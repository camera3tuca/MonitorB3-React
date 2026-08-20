import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generate() {
  const svgPath = path.join(process.cwd(), 'public', 'icon.svg');
  const svgBuffer = fs.readFileSync(svgPath);

  const out192 = path.join(process.cwd(), 'public', 'icon-192.png');
  const out512 = path.join(process.cwd(), 'public', 'icon-512.png');

  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(out192);

  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(out512);

  console.log('Successfully generated icon-192.png and icon-512.png');
}

generate().catch(console.error);
