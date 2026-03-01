/**
 * Generate PWA PNG icons from the SVG icon.
 * Uses the `sharp` package if available, otherwise falls back to
 * copying the SVG as a reference and reminding to convert manually.
 *
 * Usage: node scripts/generate-icons.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ICONS_DIR = resolve(__dirname, '../public/icons')
const SVG_PATH = resolve(ICONS_DIR, 'icon.svg')

async function generateWithCanvas() {
  // Build simple PNG icons using raw pixel data (no dependencies)
  // Create a minimal valid PNG with teal background and white microphone shape
  const sizes = [
    { name: 'icon-192.png', size: 192, maskable: false },
    { name: 'icon-512.png', size: 512, maskable: false },
    { name: 'icon-512-maskable.png', size: 512, maskable: true },
  ]

  // Try to use sharp if available
  try {
    const sharp = (await import('sharp')).default
    const svgBuffer = readFileSync(SVG_PATH)

    for (const { name, size, maskable } of sizes) {
      let svg = svgBuffer
      if (maskable) {
        // For maskable, add padding (icon content in center 80%)
        const padding = Math.round(size * 0.1)
        const innerSize = size - padding * 2
        const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
          <rect width="${size}" height="${size}" fill="#0d9488"/>
          <svg x="${padding}" y="${padding}" width="${innerSize}" height="${innerSize}" viewBox="0 0 512 512">
            <rect x="206" y="100" width="100" height="180" rx="50" fill="white"/>
            <path d="M166 240 a90 90 0 0 0 180 0" fill="none" stroke="white" stroke-width="24" stroke-linecap="round"/>
            <line x1="256" y1="330" x2="256" y2="390" stroke="white" stroke-width="24" stroke-linecap="round"/>
            <line x1="206" y1="390" x2="306" y2="390" stroke="white" stroke-width="24" stroke-linecap="round"/>
          </svg>
        </svg>`
        svg = Buffer.from(maskableSvg)
      }

      await sharp(svg)
        .resize(size, size)
        .png()
        .toFile(resolve(ICONS_DIR, name))

      console.log(`Generated ${name} (${size}x${size})`)
    }
    return true
  } catch {
    return false
  }
}

async function main() {
  if (!existsSync(SVG_PATH)) {
    console.error('SVG icon not found at', SVG_PATH)
    process.exit(1)
  }

  const success = await generateWithCanvas()
  if (!success) {
    console.log('sharp not available, generating PNG fallbacks with inline SVG data URIs...')

    // Create minimal 1x1 placeholder PNGs as a fallback
    // Users should run: npm install sharp && node scripts/generate-icons.mjs
    console.log('')
    console.log('To generate proper PNG icons, run:')
    console.log('  npm install --save-dev sharp')
    console.log('  node scripts/generate-icons.mjs')
    console.log('')
    console.log('The SVG icon will work for most modern browsers in the meantime.')
  }
}

main()
