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
                if let Err(e) = listen_on_addr(&full_addr, port, state_clone).await {
                    // Only log if it's not a expected bind error (like IPv6 not supported)
                    if port == 80 || addr_str == "127.0.0.1" {
                        eprintln!("[Bastion] Block server failed to bind TCP {}: {}", full_addr, e);
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
                    if let Err(e) = listen_on_udp(&full_addr, 443, state_udp).await {
                         if addr_udp == "127.0.0.1" {
                            eprintln!("[Bastion] Block server failed to bind UDP {}: {}", full_addr, e);
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
    println!("[Bastion] Block server listening on UDP {}", addr);

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
    println!("[Bastion] Block server listening on {}", addr);

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
                "HTTP/1.1 403 Forbidden\r\nContent-Type: text/html\r\n\r\n<h1>Blocked by Bastion</h1>"
            } else {
                // For HTTPS, we can't send a valid response without certs, so just close
                ""
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
