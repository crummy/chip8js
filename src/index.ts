import { Chip8Emulator } from "./chip8.js"

async function load(path: string, onload: (b: Uint8Array) => void) {
  const data = await fetch(path)
  const blob = await data.blob()
  const arrayBuffer = await new Response(blob).arrayBuffer()
  onload(new Uint8Array(arrayBuffer))
}

const chip8 = new Chip8Emulator()
load("maze.ch8", (rom) => {
  chip8.loadGame(rom)
  execute(chip8)
})

function execute(chip8: Chip8Emulator) {
  setTimeout(() => { 
    chip8.tick()
    execute(chip8)
  },
  1000/60)
}