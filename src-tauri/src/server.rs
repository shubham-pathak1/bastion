use std::net::SocketAddr;
use std::sync::Arc;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::{TcpListener, TcpStream};
// use tauri::State;
use crate::AppState;

/// Start the block stats collector server
pub async fn start_block_server(state: Arc<AppState>) {
    let ports = [80, 443];
    let addresses = [
        "127.0.0.1",
        "::1",
    ];

    for &port in &ports {
        for &addr_str in &addresses {
            let state_clone = state.clone();
            tokio::spawn(async move {
                let full_addr = if addr_str.contains(':') {
                    format!("[{}]:{}", addr_str, port)
                } else {
                    format!("{}:{}", addr_str, port)
                };
                match listen_on_addr(&full_addr, port, state_clone).await {
                    Ok(_) => println!("[Bastion] Block server listening on {}", full_addr),
                    Err(e) => {
                        if port == 80 || addr_str == "127.0.0.1" {
                            eprintln!("[Bastion] Block server warning: Could not bind TCP {}: {}. (Are you running with Admin privileges?)", full_addr, e);
                        }
                    }
                }
            });

            // For port 443, also listen on UDP to block QUIC
            if port == 443 {
                let state_udp = state.clone();
                let addr_udp = addr_str.to_string();
                tokio::spawn(async move {
                    let full_addr = if addr_udp.contains(':') {
                        format!("[{}]:443", addr_udp)
                    } else {
                        format!("{}:443", addr_udp)
                    };
                    match listen_on_udp(&full_addr, 443, state_udp).await {
                        Ok(_) => println!("[Bastion] Block server listening on UDP {}", full_addr),
                        Err(e) => {
                             if addr_udp == "127.0.0.1" {
                                eprintln!("[Bastion] Block server warning: Could not bind UDP {}: {}.", full_addr, e);
                             }
                        }
                    }
                });
            }
        }
    }
}

async fn listen_on_udp(addr_str: &str, _port: u16, state: Arc<AppState>) -> std::io::Result<()> {
    let addr = addr_str.parse::<SocketAddr>().map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e))?;
    let socket = tokio::net::UdpSocket::bind(addr).await?;
    // Print handled in caller

    let mut buf = [0u8; 4096];
    loop {
        let (n, _) = socket.recv_from(&mut buf).await?;
        if n > 0 {
            // QUIC is encrypted, so we can't easily parse the domain from a single packet
            // without a full state machine. However, just hitting this listener means
            // the domain was resolved to localhost, and we are successfully blocking it.
            // We'll log a generic QUIC block.
            let _ = state.db.log_block_event("QUIC/UDP Protocol", "website");
        }
    }
}

async fn listen_on_addr(addr_str: &str, port: u16, state: Arc<AppState>) -> std::io::Result<()> {
    let addr = addr_str.parse::<SocketAddr>().map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e))?;
    let listener = TcpListener::bind(addr).await?;
    // Print handled in caller

    loop {
        let (socket, _) = listener.accept().await?;
        let state_clone = state.clone();
        tokio::spawn(async move {
            handle_connection(socket, port, state_clone).await;
        });
    }
}

async fn handle_connection(mut socket: TcpStream, port: u16, state: Arc<AppState>) {
    // Buffer to read initial packet
    let mut buf = [0u8; 4096];
    
    // Set a short timeout for reading so we don't hang on idle connections
    let read_result = tokio::time::timeout(
        std::time::Duration::from_millis(500),
        socket.read(&mut buf)
    ).await;

    match read_result {
        Ok(Ok(n)) if n > 0 => {
            let data = &buf[..n];
            let domain = if port == 443 {
                parse_sni(data)
            } else {
                parse_host_header(data)
            };

            if let Some(domain) = domain {
                println!("Intercepted blocked request for: {}", domain);
                let _ = state.db.log_block_event(&domain, "website");
            }

            // Send a basic response to close gracefully
            let response = if port == 80 {
                let warning_text = state.db.get_setting("custom_warning_text")
                    .unwrap_or(None)
                    .unwrap_or_else(|| "Is this really worth breaking your focus?".to_string());

                let html = format!(r#"
<!DOCTYPE html>
<html>
<head>
    <title>Blocked by Bastion</title>
    <style>
        body {{
            background-color: #000;
            color: #fff;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            overflow: hidden;
        }}
        .container {{
            text-align: center;
            padding: 3rem;
            border-radius: 2rem;
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            max-width: 500px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }}
        .logo {{
            width: 64px;
            height: 64px;
            background: #fff;
            border-radius: 1rem;
            margin: 0 auto 2rem;
            display: flex;
            align-items: center;
            justify-content: center;
        }}
        .logo svg {{
            width: 32px;
            height: 32px;
            fill: #000;
        }}
        h1 {{
            font-size: 2rem;
            font-weight: 900;
            margin: 0 0 1rem;
            letter-spacing: -0.025em;
            text-transform: uppercase;
        }}
        p {{
            color: rgba(255, 255, 255, 0.6);
            font-size: 1.125rem;
            line-height: 1.6;
            margin: 0;
            font-weight: 500;
        }}
        .footer {{
            margin-top: 2rem;
            font-size: 0.75rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: rgba(255, 255, 255, 0.3);
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>
        </div>
        <h1>Blocked</h1>
        <p>{}</p>
        <div class="footer">Bastion Focus Defense System</div>
    </div>
</body>
</html>
                "#, warning_text);

                format!("HTTP/1.1 403 Forbidden\r\nContent-Length: {}\r\nContent-Type: text/html\r\nConnection: close\r\n\r\n{}", html.len(), html)
            } else {
                // For HTTPS, we can't send a valid response without certs, so just close
                "".to_string()
            };

            if !response.is_empty() {
                let _ = socket.write_all(response.as_bytes()).await;
            }
        }
        _ => {}
    }
}

/// Parse SNI from ClientHello to get the domain name
fn parse_sni(data: &[u8]) -> Option<String> {
    // Very basic TLS ClientHello parser
    // This is a simplified implementation just to extract the server name extension
    
    if data.len() < 43 { return None; } // Min size for ClientHello
    
    // Handshake type 0x01 (ClientHello)
    if data[0] != 0x16 { return None; } // Content Type: Handshake
    if data[5] != 0x01 { return None; } // Handshake Type: ClientHello

    let mut pos = 43; // Skip header + random + session ID len
    
    // Skip Session ID
    if pos >= data.len() { return None; }
    let session_id_len = data[38] as usize;
    pos += session_id_len;

    // Skip Cipher Sultes
    if pos + 2 >= data.len() { return None; }
    let cipher_suites_len = ((data[pos] as usize) << 8) | (data[pos + 1] as usize);
    pos += 2 + cipher_suites_len;

    // Skip Compression Methods
    if pos + 1 >= data.len() { return None; }
    let compression_len = data[pos] as usize;
    pos += 1 + compression_len;

    // Extensions
    if pos + 2 >= data.len() { return None; }
    let _extensions_len = ((data[pos] as usize) << 8) | (data[pos + 1] as usize);
    pos += 2;

    while pos + 4 <= data.len() {
        let ext_type = ((data[pos] as usize) << 8) | (data[pos + 1] as usize);
        let ext_len = ((data[pos + 2] as usize) << 8) | (data[pos + 3] as usize);
        pos += 4;

        if ext_type == 0x0000 { // Server Name extension
            if pos + 2 > data.len() { return None; }
            let _list_len = ((data[pos] as usize) << 8) | (data[pos + 1] as usize);
            pos += 2;
            
            if pos + 3 > data.len() { return None; }
            let name_type = data[pos];
             // 0x00 is host_name
            if name_type == 0x00 {
                let name_len = ((data[pos + 1] as usize) << 8) | (data[pos + 2] as usize);
                pos += 3;
                if pos + name_len <= data.len() {
                    return Some(String::from_utf8_lossy(&data[pos..pos + name_len]).to_string());
                }
            }
        }
        
        pos += ext_len;
    }

    None
}

/// Parse Host header from HTTP request
fn parse_host_header(data: &[u8]) -> Option<String> {
    let text = String::from_utf8_lossy(data);
    for line in text.lines() {
        if line.to_lowercase().starts_with("host:") {
            return Some(line[5..].trim().to_string());
        }
    }
    None
}
