
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

interface RGBA { r: number; g: number; b: number; a: number }

function makeIcon(size: number): Uint8Array {
  const img: RGBA[] = [];
  const cx = size / 2;
  const cy = size / 2;
  
  // 缩小圆角矩形到画布的 85%
  const iconSize = size * 0.85;
  const iconRadius = iconSize * 0.22; // macOS squircle 圆角

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // 圆角矩形边界检测（使用缩小后的尺寸）
      const dx = Math.max(0, Math.abs(x - cx) - (iconSize * 0.5 - iconRadius - 0.5));
      const dy = Math.max(0, Math.abs(y - cy) - (iconSize * 0.5 - iconRadius - 0.5));
      const distCorner = Math.sqrt(dx * dx + dy * dy);

      if (distCorner > iconRadius + 1) {
        img.push({ r: 0, g: 0, b: 0, a: 0 }); // 透明
        continue;
      }

      // 抗锯齿（边缘柔化）
      const alpha = distCorner > iconRadius ? Math.max(0, 255 * (1 - (distCorner - iconRadius))) : 255;

      // 背景渐变：深蓝到深绿
      const nx = (x - cx) / (size * 0.5);
      const ny = (y - cy) / (size * 0.5);
      const t = Math.sqrt(nx * nx + ny * ny);
      const bgR = Math.floor(15 + t * 10);
      const bgG = Math.floor(23 + t * 15);
      const bgB = Math.floor(42 + t * 20);

      // 眼睛椭圆（相对于缩小后的图标）
      const ex = x - cx;
      const ey = y - cy;
      const eyeW = iconSize * 0.28;
      const eyeH = iconSize * 0.19;
      const eyeDist = Math.sqrt((ex / eyeW) ** 2 + (ey / eyeH) ** 2);

      if (eyeDist < 1.0) {
        // 瞳孔（绿色中心）
        const pupilR = iconSize * 0.09;
        const pd = Math.sqrt(ex * ex + ey * ey);
        if (pd < pupilR) {
          const blend = 1 - pd / pupilR;
          img.push({
            r: Math.floor(74 * blend + bgR * (1 - blend)),
            g: Math.floor(222 * blend + bgG * (1 - blend)),
            b: Math.floor(128 * blend + bgB * (1 - blend)),
            a: alpha,
          });
        } else {
          // 虹膜（亮绿）
          const iris = Math.max(0, 1 - eyeDist * 0.8);
          img.push({
            r: Math.floor(bgR + (100 - bgR) * iris),
            g: Math.floor(bgG + (220 - bgG) * iris),
            b: Math.floor(bgB + (140 - bgB) * iris),
            a: alpha,
          });
        }
      } else {
        // 光晕
        const glow = Math.max(0, 1 - (eyeDist - 1) * 3);
        img.push({
          r: Math.floor(bgR + 74 * glow * 0.4),
          g: Math.floor(bgG + 222 * glow * 0.4),
          b: Math.floor(bgB + 128 * glow * 0.4),
          a: alpha,
        });
      }
    }
  }

  // 转为 Uint8Array (RGBA)
  const buf = new Uint8Array(size * size * 4);
  for (let i = 0; i < img.length; i++) {
    buf[i * 4] = img[i].r;
    buf[i * 4 + 1] = img[i].g;
    buf[i * 4 + 2] = img[i].b;
    buf[i * 4 + 3] = img[i].a;
  }
  return buf;
}

const iconsetDir = join(import.meta.dir, 'icon.iconset');
await mkdir(iconsetDir, { recursive: true });

const sizes = [16, 32, 64, 128, 256, 512, 1024];

for (const s of sizes) {
  const imgData = makeIcon(s);
  // 使用 sharp 编码 PNG
  const sharp = (await import('sharp')).default;
  const png = await sharp(Buffer.from(imgData), { raw: { width: s, height: s, channels: 4 } })
    .png()
    .toBuffer();
  await writeFile(join(iconsetDir, `icon_${s}x${s}.png`), png);
  console.log(`Generated: icon_${s}x${s}.png`);

  if (s <= 512) {
    const img2xData = makeIcon(s * 2);
    const png2x = await sharp(Buffer.from(img2xData), { raw: { width: s * 2, height: s * 2, channels: 4 } })
      .png()
      .toBuffer();
    await writeFile(join(iconsetDir, `icon_${s}x${s}@2x.png`), png2x);
    console.log(`Generated: icon_${s}x${s}@2x.png`);
  }
}

console.log('✅ iconset created');

// 生成 .icns
const proc = Bun.spawn([
  'iconutil',
  '-c',
  'icns',
  iconsetDir,
  '-o',
  join(import.meta.dir, 'build/dev-macos-arm64/Resty-dev.app/Contents/Resources/AppIcon.icns'),
]);
await proc.exited;

// 刷新 Dock
Bun.spawn(['killall', 'Dock']);
console.log('✅ AppIcon.icns generated and Dock refreshed');
