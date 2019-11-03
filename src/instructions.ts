import { Byte, Word, Address } from "./types.js"
import { Chip8 } from "./chip8"

function instruction(opcode: Byte): Instruction {
  const nnn: Address = opcode & 0x0FFF
  const n: Byte = opcode & 0x000F
  const x: Byte = (opcode & 0x0F00) >> 8
  const y: Byte = (opcode & 0x00F0) >> 4
  const kk: Byte = opcode & 0x00FF
  
  if (opcode == 0x00E0) return clearScreen;
  else if (opcode == 0x00EE) return subroutineReturn;
  else if ((opcode & 0xF000) == 0x1000) return jump(nnn)
  else if ((opcode & 0xF000) == 0x2000) return call(nnn) 
  else if ((opcode & 0xF000) == 0x3000) return skipIfEqual(x, kk) 
  else if ((opcode & 0xF000) == 0x4000) return skipIfNotEqual(x, kk) 
  else if ((opcode & 0xF000) == 0x5000) return skipIfRegistersEqual(x, y) 
  else if ((opcode & 0xF000) == 0x6000) return store(x, kk) 
  else if ((opcode & 0xF000) == 0x7000) return addByte(x, kk) 
  else if ((opcode & 0xF00F) == 0x8000) return copy(x, y)
  else if ((opcode & 0xF00F) == 0x8001) return or(x, y)
  else if ((opcode & 0xF00F) == 0x8002) return and(x, y)
  else if ((opcode & 0xF00F) == 0x8003) return xor(x, y)
  else if ((opcode & 0xF00F) == 0x8004) return add(x, y)
  else if ((opcode & 0xF00F) == 0x8005) return sub(x, y)
  else if ((opcode & 0xF00F) == 0x8006) return shr(x)
  else if ((opcode & 0xF00F) == 0x8007) return subN(x, y)
  else if ((opcode & 0xF00F) == 0x800E) return shl(y)
  else if ((opcode & 0xF000) == 0x9000) return skipIfRegistersNotEqual(x, y)
  else if ((opcode & 0xF000) == 0xA000) return storeWord(nnn)
  else if ((opcode & 0xF000) == 0xB000) return jumpV0(nnn)
  else if ((opcode & 0xF000) == 0xC000) return andRandom(x, kk)
  else if ((opcode & 0xF000) == 0xD000) return draw(x, y, n)
  else if ((opcode & 0xF0FF) == 0xE09E) return skipIfKeyDown(x)
  else if ((opcode & 0xF0FF) == 0xE0A1) return skipIfKeyUp(x)
  else if ((opcode & 0xF0FF) == 0xF007) return storeDelayTimer(x)
  else if ((opcode & 0xF0FF) == 0xF00A) return awaitKeyDown(x)
  else if ((opcode & 0xF0FF) == 0xF015) return setDelayTimer(x)
  else if ((opcode & 0xF0FF) == 0xF018) return setSoundTimer(x)
  else if ((opcode & 0xF0FF) == 0xF01E) return addToI(x)
  else if ((opcode & 0xF0FF) == 0xF029) return storeSpriteLocation(x)
  else if ((opcode & 0xF0FF) == 0xF033) return storeBCD(x)
  else if ((opcode & 0xF0FF) == 0xF055) return storeRegisters(x)
  else if ((opcode & 0xF0FF) == 0xF065) return readRegisters(x)
  else throw new InvalidOpcode(opcode)
}

class Instruction {
  execute: (chip8: Chip8) => void
  name: string
  constructor(name: string, execute: (chip8: Chip8) => void) {
    this.execute = execute;
    this.name = name;
  }
}

let clearScreen = new Instruction("CLS", chip8 => chip8.display.reset())
let subroutineReturn = new Instruction("RET", (chip8: Chip8) => {
  const pc = chip8.stack.pop()
  chip8.pc = pc
})
let jump = (address: Address) => new Instruction(`JP ${address.toString(16)}`, (chip8: Chip8) => chip8.pc = address)
let call = (address: Address) => new Instruction(`CALL ${address.toString(16)}`, (chip8: Chip8) => {
  chip8.stack.push(chip8.pc);
  chip8.pc = address
})
let skipIfEqual = (registerIndex: Byte, byte: Byte) => new Instruction(`SE V${registerIndex}, ${byte.toString(16)}`, (chip8: Chip8) => {
  const skip = chip8.V[registerIndex] == byte
  if (skip) {
    chip8.pc += 2
  }
})
let skipIfNotEqual = (registerIndex: Byte, byte: Byte) => new Instruction(`SNE V${registerIndex}, ${byte.toString(16)}`, (chip8: Chip8) => {
  const skip = chip8.V[registerIndex] != byte
  if (skip) {
    chip8.pc += 2
  }
})
let skipIfRegistersEqual = (register1: Byte, register2: Byte) => new Instruction(`SE V${register1}, V${register2}`, (chip8: Chip8) => {
  const skip = chip8.V[register1] == chip8.V[register2]
  if (skip) {
    chip8.pc += 2
  }
})
let skipIfRegistersNotEqual = (register1: Byte, register2: Byte) => new Instruction(`SNE V${register1}, ${register2}`, (chip8: Chip8) => {
  const skip = chip8.V[register1] != chip8.V[register2]
  if (skip) {
    chip8.pc += 2
  }
})
let store = (registerIndex: Byte, byte: Byte) => new Instruction(`LD V${registerIndex}, ${byte.toString(16)}`, (chip8: Chip8) => {
  chip8.V[registerIndex] = byte
})
let storeWord = (word: Word) => new Instruction(`LD ${word.toString(16)}`, (chip8: Chip8) => {
  chip8.I = word
})
let copy = (registerTo: Byte, registerFrom: Byte) => new Instruction(`LD V${registerTo}, V${registerFrom}`, (chip8: Chip8) => {
  chip8.V[registerFrom] = chip8.V[registerTo]
})
let addByte = (registerIndex: Byte, byte: Byte) => new Instruction(`ADD V${registerIndex}, ${byte.toString(16)}`, (chip8: Chip8) => {
  const sum = chip8.V[registerIndex] + byte
  chip8.V[registerIndex] = sum & 0xFF
})
let or = (register1: Byte, register2: Byte) => new Instruction(`OR V${register1}, V${register2}`, (chip8: Chip8) => {
  const or = chip8.V[register1] | chip8.V[register2]
  chip8.V[register1] = or
})
let and = (register1: Byte, register2: Byte) => new Instruction(`AND V${register1}, V${register2}`, (chip8: Chip8) => {
  const and = chip8.V[register1] & chip8.V[register2]
  chip8.V[register1] = and
})
let xor = (register1: Byte, register2: Byte) => new Instruction(`XOR V${register1}, V${register2}`, (chip8: Chip8) => {
  const xor = chip8.V[register1] ^ chip8.V[register2]
  chip8.V[register1] = xor
})
let add = (register1: Byte, register2: Byte) => new Instruction(`ADD V${register1}, V${register2}`, (chip8: Chip8) => {
  const sum = chip8.V[register1] + chip8.V[register2]
  chip8.V[0xF] = sum > 0xFF ? 1 : 0
  chip8.V[register1] = sum & 0xFF
})
let sub = (register1: Byte, register2: Byte) => new Instruction(`SUB V${register1}, V${register2}`, (chip8: Chip8) => {
  const difference = chip8.V[register1] - chip8.V[register2]
  chip8.V[0xF] = difference < 0 ? 1 : 0
  chip8.V[register1] = difference & 0xFF
})
let shl = (register: Byte) => new Instruction(`SHL V${register}`, (chip8: Chip8) => {
  const shifted = chip8.V[register] << 1
  chip8.V[0xF] = (chip8.V[register] & 0x8000) == 0x8000 ? 1 : 0
  chip8.V[register] = shifted;
})
let subN = (register1: Byte, register2: Byte) => new Instruction(`SUBN V${register1}, V${register2}`, (chip8: Chip8) => {
  const difference = chip8.V[register2] - chip8.V[register1]
  chip8.V[0xF] = difference < 0 ? 1 : 0
  chip8.V[register2] = difference & 0xFF
})
let shr = (register: Byte) => new Instruction(`SHR ${register}`, (chip8: Chip8) => {
  const shifted = chip8.V[register] >> 1
  chip8.V[0xF] = (chip8.V[register] & 0x1) == 0x1 ? 1 : 0
  chip8.V[register] = shifted;
})
let jumpV0 = (address: Word) => new Instruction(`JP V0+${address.toString(16)}`, (chip8: Chip8) => {
  const destination = chip8.V[0] + address
  chip8.pc = destination
})
let andRandom = (register: Byte, byte: Byte) => new Instruction(`RND V${register} ${byte.toString(16)}`, (chip8: Chip8) => {
  const randomByte: Byte = Math.random() * 0xFF
  chip8.V[register] = randomByte & byte
})
let draw = (vx: Byte, vy: Byte, height: Byte) => new Instruction(`DRW V${vx.toString(16)} V${vy.toString(16)} ${height}`, (chip8: Chip8) => {
  chip8.V[0xF] = 0
  const x = chip8.V[vx]
  const y = chip8.V[vy]
  for (let yOffset = 0; yOffset < height; ++yOffset) {
    const pixel = chip8.memory.get(chip8.I + yOffset)
    for (let xOffset = 0; xOffset < 8; ++xOffset) {
      const dot: boolean = (pixel & (0x80 >> xOffset)) != 0
      const dotX = (x + xOffset) % chip8.display.width;
      const dotY = (y + yOffset) % chip8.display.height;
      //console.log(`set bit ${xOffset} of ${pixel.toString(2).padStart(8, '0')} at ${dotX}, ${dotY} to ${dot}`)
      if (dot != chip8.display.get(dotX, dotY)) chip8.V[0xF] = 1
      chip8.display.set(dotX, dotY, dot)
    }
  }
})
let skipIfKeyDown = (register: Byte) => new Instruction(`SKP ${register}`, (chip8: Chip8) => {
  const key = chip8.V[register]
  const skip = chip8.keys[key] == true
  if (skip) {
    chip8.pc += 2
  }
})
let skipIfKeyUp = (register: Byte) => new Instruction(`SKNP ${register}`, (chip8: Chip8) => {
  const key = chip8.V[register]
  const skip = chip8.keys[key] == false
  if (skip) {
    chip8.pc += 2
  }
})
let storeDelayTimer = (register: Byte) => new Instruction(`LD V${register} DT`, (chip8: Chip8) => {
  chip8.V[register] == chip8.timer.delay
})
let setDelayTimer = (register: Byte) => new Instruction(`LD DT, V${register}`, (chip8: Chip8) => {
  chip8.timer.delay = chip8.V[register]
})
let setSoundTimer = (register: Byte) => new Instruction(`LD ST, V${register}`, (chip8: Chip8) => {
  chip8.timer.sound = chip8.V[register]
})
let awaitKeyDown = (register: Byte) => new Instruction(`LD V${register}, K`, (chip8: Chip8) => {
  // TODO
})
let addToI = (register: Byte) => new Instruction(`ADD I, V${register}`, (chip8: Chip8) => {
  chip8.I += chip8.V[register]
})
let storeSpriteLocation = (register: Byte) => new Instruction(`LD F, V${register}`, (chip8: Chip8) => {
  chip8.I = 0 // TODO
})
let storeBCD = (register: Byte) => new Instruction(`LD B, V${register}`, (chip8: Chip8) => {
  // this is cheating
  const decimal = chip8.V[register].toString().padStart(3, '0')
  const hundreds = Number(decimal.charAt(0))
  const tens = Number(decimal.charAt(1))
  const ones = Number(decimal.charAt(2))
  chip8.memory.set(chip8.I, hundreds)
  chip8.memory.set(chip8.I + 1, tens)
  chip8.memory.set(chip8.I + 2, ones)
})
let readRegisters = (registerMax: Byte) => new Instruction(`LD [I], V${registerMax}`, (chip8: Chip8) => {
  for (let i = 0; i < registerMax; ++i) {
    const source = chip8.I + i
    chip8.V[i] = chip8.memory.get(source)
  }
})
let storeRegisters = (registerMax: Byte) => new Instruction(`LD V${registerMax}, [I]`, (chip8: Chip8) => {
  for (let i = 0; i < registerMax; ++i) {
    const destination = chip8.I + i
    chip8.memory.set(destination, chip8.V[i])
  }
})

class InvalidOpcode extends Error {
  constructor(byte: Byte) {
    super(`Invalid opcode: ${byte.toString(16)}`)
  }
}

export default instruction