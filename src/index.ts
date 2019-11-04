import { Chip8Emulator, Display, Chip8 } from "./chip8.js"
import instruction from "./instructions.js"
import { toHex } from "./types.js"

async function load(path: string, onload: (b: Uint8Array) => void) {
  const data = await fetch(path)
  const blob = await data.blob()
  const arrayBuffer = await new Response(blob).arrayBuffer()
  onload(new Uint8Array(arrayBuffer))
}

const chip8 = new Chip8Emulator()
let paused = true
const canvas = <HTMLCanvasElement>document.getElementById("display")!!
executeLoop(chip8)
drawLoop(chip8)

function executeLoop(chip8: Chip8Emulator) {
  setTimeout(() => { 
    if (!paused) {
      chip8.tick()
    }
    executeLoop(chip8)
  },
  2) // 500hz
}

function drawLoop(chip8: Chip8Emulator) {
  setTimeout(() => {
    if (chip8.drawFlag) {
      drawScreen(chip8.display)
    }
    drawUI(chip8)
    drawLoop(chip8)
  },
  1000/60) // 60hz
}

function drawRomInstructions(rom: Uint8Array) {
  const table = document.getElementById("rom_instructions")!!
  for (let i = 0; i < rom.length; i += 2) {
    const op = rom[i] << 8 | rom[i + 1]

    const tr = document.createElement("tr");
    tr.id = `rom_address_${toHex(i + Chip8.ROM_START_ADDRESS)}`
    tr.className = "rom_instruction"

    const address = document.createElement("td")
    address.innerHTML = i.toString(16).padStart(4, '0')
    tr.append(address)

    const opcode = document.createElement("td")
    opcode.innerHTML = op.toString(16).padStart(4, '0')
    tr.append(opcode)

    const description = document.createElement("td")
    description.innerHTML = instruction(op).name
    tr.append(description)

    table.append(tr)
  }
}

function drawUI(chip8: Chip8Emulator) {
  for (let i = 0; i < 16; ++i) {
    document.querySelector(`#v${i.toString(16).toUpperCase()}`)!!.innerHTML = chip8.V[i].toString(16)
  }
  document.querySelector("#i")!!.innerHTML = toHex(chip8.I)
  document.querySelector("#pc")!!.innerHTML = toHex(chip8.pc)
  document.querySelector("#dt")!!.innerHTML = toHex(chip8.timer.delay, 2)
  document.querySelector("#st")!!.innerHTML = toHex(chip8.timer.sound, 2)
  document.querySelectorAll(".rom_instruction").forEach(instruction => instruction.classList.remove("highlight"))
  const inst = document.querySelector(`#rom_address_${toHex(chip8.pc)}`)
  if (inst != null) {
    inst.classList.add("highlight")
  }
}

function drawScreen(display: Display) {
  const pixelSize = 8
  const ctx = canvas.getContext("2d")!!
  for (let y = 0; y < display.height; ++y) {
    for (let x = 0; x < display.width; ++x) {
      ctx.fillStyle = display.get(x, y) ? "#FFFFFF" : "#000000"
      ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize)
    }
  }
}

document.addEventListener('keydown', event => {
  setKeyPressed(event.key, true)
})
document.addEventListener('keyup', event => {
  setKeyPressed(event.key, false)
})

document.querySelectorAll(".rom").forEach(button => {
  const b = <HTMLButtonElement>button
  const rom = b.innerHTML
  b.onclick = () => load(`roms/${rom}`, (rom) => {
    chip8.loadGame(rom)
    drawRomInstructions(rom)
    paused = false
  })
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