/**
 * Script to generate PNG icons for the PWA.
 * Run: node scripts/generate-icons.js
 *
 * Requires 'canvas' package: npm install --save-dev canvas
 * If canvas is not available, the script creates minimal placeholder PNGs.
 */

const fs = require('fs')
const path = require('path')

function createMinimalPNG(size, color) {
  // Create a minimal valid PNG using pure Node.js (no external deps)
  // This uses the PNG format: signature + IHDR + IDAT + IEND
  const { createHash, createDeflate } = require('zlib')

  // We'll use a simpler approach: create a script that uses canvas if available,
  // otherwise falls back to a minimal PNG generator
  try {
    const { createCanvas } = require('canvas')
    const canvas = createCanvas(size, size)
    const ctx = canvas.getContext('2d')

    // Background
    ctx.fillStyle = color
    const radius = size * 0.156
    ctx.beginPath()
    ctx.moveTo(radius, 0)
    ctx.lineTo(size - radius, 0)
    ctx.quadraticCurveTo(size, 0, size, radius)
    ctx.lineTo(size, size - radius)
    ctx.quadraticCurveTo(size, size, size - radius, size)
    ctx.lineTo(radius, size)
    ctx.quadraticCurveTo(0, size, 0, size - radius)
    ctx.lineTo(0, radius)
    ctx.quadraticCurveTo(0, 0, radius, 0)
    ctx.closePath()
    ctx.fill()

    // Letter I
    ctx.fillStyle = 'white'
    ctx.font = `bold ${size * 0.6}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('I', size / 2, size / 2)

    return canvas.toBuffer('image/png')
  } catch (e) {
    console.log('canvas not available, using placeholder PNG')
    return null
  }
}

function writePlaceholder(outputPath, size) {
  // 1x1 blue PNG as absolute fallback placeholder
  const bluePNG1x1 = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQ' +
    'AABjkB6QAAAABJRU5ErkJggg==',
    'base64'
  )
  fs.writeFileSync(outputPath, bluePNG1x1)
  console.log(`Wrote placeholder PNG to ${outputPath} (replace with real ${size}x${size} icon)`)
}

const sizes = [192, 512]
const publicDir = path.join(__dirname, '..', 'public')

for (const size of sizes) {
  const outputPath = path.join(publicDir, `icon-${size}.png`)
  const buffer = createMinimalPNG(size, '#0071e3')
  if (buffer) {
    fs.writeFileSync(outputPath, buffer)
    console.log(`Generated ${size}x${size} PNG icon at ${outputPath}`)
  } else {
    writePlaceholder(outputPath, size)
  }
}
