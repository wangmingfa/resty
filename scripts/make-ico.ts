/**
 * 用 sharp 生成 Windows 所需的 .ico 文件
 * ICO 格式本质上是多个 PNG/BMP 的容器
 * 这里手动构造一个包含 16x16、32x32、48x48、256x256 的 ICO 文件
 */
import sharp from 'sharp'
import { join } from 'node:path'

const ROOT = join(import.meta.dir, '..')
const ICONSET = join(ROOT, 'icon.iconset')
const OUT = join(ROOT, 'icon.ico')

const SIZES = [16, 32, 256]

// ICO 文件格式：
// ICONDIR header (6 bytes)
// ICONDIRENTRY * n (16 bytes each)
// PNG data * n

async function buildIco() {
    // 生成各尺寸 PNG buffer
    const images: Buffer[] = []
    for (const size of SIZES) {
        const srcFile = join(ICONSET, `icon_${size}x${size}.png`)
        const buf = await sharp(srcFile)
            .resize(size, size)
            .png()
            .toBuffer()
        images.push(buf)
    }

    const count = SIZES.length

    // ICONDIR: reserved(2) + type(2) + count(2)
    const iconDir = Buffer.alloc(6)
    iconDir.writeUInt16LE(0, 0)   // reserved
    iconDir.writeUInt16LE(1, 2)   // type: 1 = icon
    iconDir.writeUInt16LE(count, 4)

    // ICONDIRENTRY * count: width(1) + height(1) + colorCount(1) + reserved(1)
    //                       + planes(2) + bitCount(2) + bytesInRes(4) + imageOffset(4)
    const entrySize = 16
    const dataOffset = 6 + entrySize * count

    const entries = Buffer.alloc(entrySize * count)
    let offset = dataOffset
    for (let i = 0; i < count; i++) {
        const size = SIZES[i]
        const imgBuf = images[i]
        // width/height: 0 means 256
        entries.writeUInt8(size === 256 ? 0 : size, i * entrySize + 0)
        entries.writeUInt8(size === 256 ? 0 : size, i * entrySize + 1)
        entries.writeUInt8(0, i * entrySize + 2)   // colorCount
        entries.writeUInt8(0, i * entrySize + 3)   // reserved
        entries.writeUInt16LE(1, i * entrySize + 4) // planes
        entries.writeUInt16LE(32, i * entrySize + 6) // bitCount
        entries.writeUInt32LE(imgBuf.length, i * entrySize + 8)
        entries.writeUInt32LE(offset, i * entrySize + 12)
        offset += imgBuf.length
    }

    const ico = Buffer.concat([iconDir, entries, ...images])
    await Bun.write(OUT, ico)
    console.log(`✅ Generated ${OUT} (${ico.length} bytes)`)
}

await buildIco()