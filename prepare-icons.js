import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const input = path.join(__dirname, 'src', 'assets', 'bastion_logo.png');
const outputDir = path.join(__dirname, 'src-tauri', 'icons');

async function createIcons() {
    console.log('Generating high-quality icons from:', input);

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate PNGs
    const sizes = [32, 64, 128, 256, 512];
    for (const size of sizes) {
        await sharp(input)
            .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .toFile(path.join(outputDir, `${size}x${size}.png`));
        console.log(`Created ${size}x${size}.png`);
    }

    // Copy the largest one as icon.png
    await sharp(input)
        .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .toFile(path.join(outputDir, `icon.png`));

    // For .ico, we really want multiple layers, but tauri icon usually does this.
    // We'll just ensure icon.ico is at least the 256x256 version for now if we can't do multi-layer easily.
    // Actually, sharp doesn't do multi-layer .ico. 
    // BUT we can use tauri icon IF we have a square image.

    console.log('Icons prepared in src-tauri/icons. Running tauri icon...');
}

createIcons().catch(console.error);
