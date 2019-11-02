import { Byte, Word, Address } from "./types.js"
import { Chip8 } from "./chip8"

function instruction(opcode: Byte): Instruction {
  const nnn: Address = opcode & 0x0FFF
  const n: Byte = opcode & 0x000F
  const x: Byte = opcode & 0x0F00 >> 8
  const y: Byte = opcode & 0x00F0 >> 4
  const kk: Byte = opcode & 0x00FF
  if (matches(opcode, 0x00E0)) return clearScreen;
  else if (matches(opcode, 0x00EE)) return subroutineReturn;
  else if (matches(opcode, 0x1000)) return jump(nnn)
  else if (matches(opcode, 0x2000)) return call(nnn) 
  else if (matches(opcode, 0x3000)) return skipIfEqual(x, kk) 
  else if (matches(opcode, 0x4000)) return skipIfNotEqual(x, kk) 
  else if (matches(opcode, 0x5000)) return skipIfRegistersEqual(x, y) 
  else if (matches(opcode, 0x6000)) return store(x, kk) 
  else if (matches(opcode, 0x7000)) return addByte(x, kk) 
  else if (matches(opcode, 0x8000)) return copy(x, y)
  else if (matches(opcode, 0x8001)) return or(x, y)
  else if (matches(opcode, 0x8002)) return and(x, y)
  else if (matches(opcode, 0x8003)) return xor(x, y)
  else if (matches(opcode, 0x8004)) return add(x, y)
  else if (matches(opcode, 0x8005)) return sub(x, y)
  else if (matches(opcode, 0x8006)) return shr(x)
  else if (matches(opcode, 0x8007)) return subN(x, y)
  else if (matches(opcode, 0x800E)) return shl(y)
  else if (matches(opcode, 0x9000)) return skipIfRegistersNotEqual(x, y)
  else if (matches(opcode, 0xA000)) return storeWord(nnn)
  else if (matches(opcode, 0xB000)) return jumpV0(nnn)
  else if (matches(opcode, 0xC000)) return andRandom(x, kk)
  else if (matches(opcode, 0xD000)) return draw(x, y, n)
  else if (matches(opcode, 0xE09E)) return skipIfKeyDown(x)
  else if (matches(opcode, 0xE0A1)) return skipIfKeyUp(x)
  else if (matches(opcode, 0xF007)) return storeDelayTimer(x)
  else if (matches(opcode, 0xF00A)) return awaitKeyDown(x)
  else if (matches(opcode, 0xF015)) return setDelayTimer(x)
  else if (matches(opcode, 0xF018)) return setSoundTimer(x)
  else if (matches(opcode, 0xF01E)) return addToI(x)
  else if (matches(opcode, 0xF029)) return storeSpriteLocation(x)
  else if (matches(opcode, 0xF033)) return storeBCD(x)
  else if (matches(opcode, 0xF055)) return storeRegisters(x)
  else if (matches(opcode, 0xF065)) return readRegisters(x)
  else {
    throw new InvalidOpcode(opcode)
  }
}

interface Instruction {
  (chip8: Chip8): void
}

let matches = (opcode: Byte, value: Byte) => (opcode & value) == value

let clearScreen: Instruction = chip8 => chip8.screen.reset()
let subroutineReturn: Instruction = chip8 => {
  const pc = chip8.stack.pop()
  chip8.registers.pc = pc
}
let jump = (address: Address) => (chip8: Chip8) => {
  chip8.registers.pc = address
}
let call = (address: Address) => (chip8: Chip8) => {
  chip8.stack.push(chip8.registers.pc);
  chip8.registers.pc = address
}
let skipIfEqual = (registerIndex: Byte, byte: Byte) => (chip8: Chip8) => {
  const skip = chip8.registers.V[registerIndex] == byte
  if (skip) {
    chip8.registers.pc += 2
  }
}
let skipIfNotEqual = (registerIndex: Byte, byte: Byte) => (chip8: Chip8) => {
  const skip = chip8.registers.V[registerIndex] != byte
  if (skip) {
    chip8.registers.pc += 2
  }
}
let skipIfRegistersEqual = (register1: Byte, register2: Byte) => (chip8: Chip8) => {
  const skip = chip8.registers.V[register1] == chip8.registers.V[register2]
  if (skip) {
    chip8.registers.pc += 2
  }
}
let skipIfRegistersNotEqual = (register1: Byte, register2: Byte) => (chip8: Chip8) => {
  const skip = chip8.registers.V[register1] != chip8.registers.V[register2]
  if (skip) {
    chip8.registers.pc += 2
  }
}
let store = (registerIndex: Byte, byte: Byte) => (chip8: Chip8) => {
  chip8.registers.V[registerIndex] = byte
}
let storeWord = (word: Word) => (chip8: Chip8) => {
  chip8.registers.I = word
}
let copy = (registerTo: Byte, registerFrom: Byte) => (chip8: Chip8) => {
  chip8.registers.V[registerFrom] = chip8.registers.V[registerTo]
}
let addByte = (registerIndex: Byte, byte: Byte) => (chip8: Chip8) => {
  const sum = chip8.registers.V[registerIndex] + byte
  chip8.registers.V[registerIndex] = sum & 0xFF
}
let or = (register1: Byte, register2: Byte) => (chip8: Chip8) => {
  const or = chip8.registers.V[register1] | chip8.registers.V[register2]
  chip8.registers.V[register1] = or
}
let and = (register1: Byte, register2: Byte) => (chip8: Chip8) => {
  const and = chip8.registers.V[register1] & chip8.registers.V[register2]
  chip8.registers.V[register1] = and
}
let xor = (register1: Byte, register2: Byte) => (chip8: Chip8) => {
  const xor = chip8.registers.V[register1] ^ chip8.registers.V[register2]
  chip8.registers.V[register1] = xor
}
let add = (register1: Byte, register2: Byte) => (chip8: Chip8) => {
  const sum = chip8.registers.V[register1] + chip8.registers.V[register2]
  chip8.registers.V[register1] = sum & 0xFF
}
let sub = (register1: Byte, register2: Byte) => (chip8: Chip8) => {
  const difference = chip8.registers.V[register1] - chip8.registers.V[register2]
  chip8.registers.V[register1] = difference & 0xFF
}
let shl = (register: Byte) => (chip8: Chip8) => {
  const shifted = chip8.registers.V[register] << 1
  chip8.registers.V[register] = shifted;
}
let subN = (register1: Byte, register2: Byte) => sub(register2, register1)
let shr = (register: Byte) => (chip8: Chip8) => {
  const shifted = chip8.registers.V[register] >> 1
  chip8.registers.V[register] = shifted;
}
let jumpV0 = (address: Word) => (chip8: Chip8) => {
  const destination = chip8.registers.V[0] + address
  chip8.registers.pc = destination
}
let andRandom = (register: Byte, byte: Byte) => (chip8: Chip8) => {
  const randomByte: Byte = Math.random() * 0xFF
  chip8.registers.V[register] = randomByte & byte
}
let draw = (register1: Byte, register2: Byte, nibble: Byte) => (chip8: Chip8) => {
  // TODO
}
let skipIfKeyDown = (register: Byte) => (chip8: Chip8) => {
  const key = chip8.registers.V[register]
  const skip = chip8.keys[key] == true
  if (skip) {
    chip8.registers.pc += 2
  }
}
let skipIfKeyUp = (register: Byte) => (chip8: Chip8) => {
  const key = chip8.registers.V[register]
  const skip = chip8.keys[key] == false
  if (skip) {
    chip8.registers.pc += 2
  }
}
let storeDelayTimer = (register: Byte) => (chip8: Chip8) => {
  chip8.registers.V[register] == chip8.timer.delay
}
let setDelayTimer = (register: Byte) => (chip8: Chip8) => {
  chip8.timer.delay = chip8.registers.V[register]
}
let setSoundTimer = (register: Byte) => (chip8: Chip8) => {
  chip8.timer.sound = chip8.registers.V[register]
}
let awaitKeyDown = (register: Byte) => (chip8: Chip8) => {
  // TODO
}
let addToI = (register: Byte) => (chip8: Chip8) => {
  chip8.registers.I += chip8.registers.V[register]
}
let storeSpriteLocation = (register: Byte) => (chip8: Chip8) => {
  chip8.registers.I = 0 // TODO
}
let storeBCD = (register: Byte) => (chip8: Chip8) => {
  // this is cheating
  const decimal = chip8.registers.V[register].toString().padStart(3, '0')
  const hundreds = Number(decimal.charAt(0))
  const tens = Number(decimal.charAt(1))
  const ones = Number(decimal.charAt(2))
  chip8.memory.set(chip8.registers.I, hundreds)
  chip8.memory.set(chip8.registers.I + 1, tens)
  chip8.memory.set(chip8.registers.I + 2, ones)
}
let readRegisters = (registerMax: Byte) => (chip8: Chip8) => {
  for (let i = 0; i < registerMax; ++i) {
    const source = chip8.registers.I + i
    chip8.registers.V[i] = chip8.memory.get(source)
  }
}
let storeRegisters = (registerMax: Byte) => (chip8: Chip8) => {
  for (let i = 0; i < registerMax; ++i) {
    const destination = chip8.registers.I + i
    chip8.memory.set(destination, chip8.registers.V[i])
  }
}

class InvalidOpcode extends Error {
  constructor(byte: Byte) {
    super(`Invalid opcode: ${byte.toString(16)}`)
  }
}

export default instruction