import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const inputPath = resolve(__dirname, 'public/favicon.png');
const outputDir = resolve(__dirname, 'public/icons');

// Create icons directory
mkdirSync(outputDir, { recursive: true });

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  console.log('Generating PWA icons from favicon.png...\n');

  for (const size of sizes) {
    const outputPath = resolve(outputDir, `icon-${size}x${size}.png`);
    await sharp(inputPath)
      .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(outputPath);
    console.log(`  ✓ icon-${size}x${size}.png`);
  }

  // Generate maskable icon (with padding for safe zone)
  const maskableSize = 512;
  const innerSize = Math.round(maskableSize * 0.7); // 70% of total = safe zone
  const padding = Math.round((maskableSize - innerSize) / 2);

  // Create the maskable icon with a gradient background
  const bgBuffer = await sharp({
    create: {
      width: maskableSize,
      height: maskableSize,
      channels: 4,
      background: { r: 10, g: 10, b: 10, alpha: 255 },
    },
  }).png().toBuffer();

  const logoBuffer = await sharp(inputPath)
    .resize(innerSize, innerSize, { fit: 'contain', background: { r: 10, g: 10, b: 10, alpha: 0 } })
    .png()
    .toBuffer();

  await sharp(bgBuffer)
    .composite([{ input: logoBuffer, left: padding, top: padding }])
    .png()
    .toFile(resolve(outputDir, 'maskable-icon-512x512.png'));

  console.log('  ✓ maskable-icon-512x512.png');
  console.log('\nAll PWA icons generated successfully!');
}

generateIcons().catch(console.error);
