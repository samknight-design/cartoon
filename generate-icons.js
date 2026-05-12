// Run with: node generate-icons.js
// Requires: npm install canvas (if not available, icons will be skipped)
import { createCanvas } from 'canvas'
import { writeFileSync, mkdirSync } from 'fs'

mkdirSync('./public/icons', { recursive: true })

function drawIcon(size) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')
  const r = size * 0.175 // corner radius

  // Background
  const bg = ctx.createLinearGradient(0, 0, size, size)
  bg.addColorStop(0, '#1d1940')
  bg.addColorStop(1, '#0A0818')
  ctx.beginPath()
  ctx.moveTo(r, 0)
  ctx.lineTo(size - r, 0)
  ctx.quadraticCurveTo(size, 0, size, r)
  ctx.lineTo(size, size - r)
  ctx.quadraticCurveTo(size, size, size - r, size)
  ctx.lineTo(r, size)
  ctx.quadraticCurveTo(0, size, 0, size - r)
  ctx.lineTo(0, r)
  ctx.quadraticCurveTo(0, 0, r, 0)
  ctx.closePath()
  ctx.fillStyle = bg
  ctx.fill()

  // Stars
  const stars = [[0.15, 0.15], [0.85, 0.2], [0.9, 0.8], [0.1, 0.82], [0.78, 0.1]]
  stars.forEach(([x, y]) => {
    ctx.beginPath()
    ctx.arc(x * size, y * size, size * 0.008, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.fill()
  })

  // Coin
  const coinX = size * 0.35, coinY = size * 0.52, coinR = size * 0.22
  const coinGrad = ctx.createRadialGradient(coinX - coinR * 0.3, coinY - coinR * 0.3, 0, coinX, coinY, coinR)
  coinGrad.addColorStop(0, '#FFE566')
  coinGrad.addColorStop(0.6, '#FFD700')
  coinGrad.addColorStop(1, '#B8860B')
  ctx.beginPath()
  ctx.arc(coinX, coinY, coinR, 0, Math.PI * 2)
  ctx.fillStyle = coinGrad
  ctx.fill()
  ctx.font = `bold ${size * 0.22}px serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#B8860B'
  ctx.fillText('★', coinX, coinY + size * 0.02)

  // Gem
  const gemX = size * 0.66, gemY = size * 0.52
  const gemH = size * 0.46
  const gemW = size * 0.22
  const gemGrad = ctx.createLinearGradient(gemX - gemW, gemY - gemH / 2, gemX + gemW, gemY + gemH / 2)
  gemGrad.addColorStop(0, '#C084FC')
  gemGrad.addColorStop(1, '#06B6D4')
  ctx.beginPath()
  ctx.moveTo(gemX, gemY - gemH / 2)
  ctx.lineTo(gemX + gemW, gemY)
  ctx.lineTo(gemX, gemY + gemH / 2)
  ctx.lineTo(gemX - gemW, gemY)
  ctx.closePath()
  ctx.fillStyle = gemGrad
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(gemX, gemY - gemH / 2)
  ctx.lineTo(gemX + gemW, gemY)
  ctx.lineTo(gemX, gemY - gemH * 0.05)
  ctx.closePath()
  ctx.fillStyle = 'rgba(255,255,255,0.25)'
  ctx.fill()

  return canvas.toBuffer('image/png')
}

try {
  writeFileSync('./public/icons/icon-192.png', drawIcon(192))
  writeFileSync('./public/icons/icon-512.png', drawIcon(512))
  console.log('Icons generated successfully!')
} catch (e) {
  console.log('canvas not available — please add PNG icons manually to public/icons/')
}
