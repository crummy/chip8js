import { Chip8Emulator, Display } from "./chip8.js"

async function load(path: string, onload: (b: Uint8Array) => void) {
  const data = await fetch(path)
  const blob = await data.blob()
  const arrayBuffer = await new Response(blob).arrayBuffer()
  onload(new Uint8Array(arrayBuffer))
}

const chip8 = new Chip8Emulator()
const canvas = <HTMLCanvasElement>document.getElementById("display")!!
load("maze.ch8", (rom) => {
  chip8.loadGame(rom)
  execute(chip8)
})

function execute(chip8: Chip8Emulator) {
  setTimeout(() => { 
    chip8.tick()
    execute(chip8)
    if (chip8.drawFlag) {
      draw(chip8.display)
    }
  },
  2) // 500hz?
}

function draw(display: Display) {
  const ctx = canvas.getContext("2d")!!
  ctx.scale(4, 4)
  const imageData = ctx.createImageData(display.width, display.height)
  for (let y = 0; y < display.height; ++y) {
    for (let x = 0; x < display.width; ++x) {
      const pixel = display.get(x, y) ? 0 : 255
      imageData.data[y * (display.width * 4) + x * 4] = pixel
      imageData.data[y * (display.width * 4) + x * 4 + 1] = pixel
      imageData.data[y * (display.width * 4) + x * 4 + 2] = pixel
      imageData.data[y * (display.width * 4) + x * 4 + 3] = 255
    }
  }
  ctx.putImageData(imageData, 0, 0)
}

document.addEventListener('keydown', event => {
  setKeyPressed(event.key, true)
})
document.addEventListener('keyup', event => {
  setKeyPressed(event.key, false)
})

function setKeyPressed(key: string, set: boolean) {
  switch (key.toLowerCase()) {
    case '1': chip8.keys[0x1] = set; break;
    case '2': chip8.keys[0x2] = set; break;
    case '3': chip8.keys[0x3] = set; break;
    case '4': chip8.keys[0xC] = set; break;
    case 'Q': chip8.keys[0x4] = set; break;
    case 'W': chip8.keys[0x5] = set; break;
    case 'E': chip8.keys[0x6] = set; break;
    case 'R': chip8.keys[0xD] = set; break;
    case 'A': chip8.keys[0x7] = set; break;
    case 'S': chip8.keys[0x8] = set; break;
    case 'D': chip8.keys[0x9] = set; break;
    case 'F': chip8.keys[0xE] = set; break;
    case 'Z': chip8.keys[0xA] = set; break;
    case 'X': chip8.keys[0x0] = set; break;
    case 'C': chip8.keys[0xB] = set; break;
    case 'V': chip8.keys[0xF] = set; break;
  }
}