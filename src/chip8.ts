import { Byte, Word, Address } from "./types.js"
import font from "./font.js"
import instruction from "./instructions.js"

export class Registers {
  pc: Word = 0
  I: Word = 0
  V: Byte[] = [] // size 16

  constructor() {
    this.reset()
  }

  reset() {
    this.pc = 0x200
    this.I = 0
    this.V = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  }
}

export class Timer {
  delay: Byte = 0
  sound: Byte = 0
}

export class Memory {
  interpreter: Byte[] = [] // 0x000-0x1FF
  font: Byte[] = [] // 0x050-0x0A0
  ram: Byte[] = [] // 0x200-0xFFF

  constructor() {
    this.reset()
  }

  reset() {
    for (let i = 0x50; i <= 0xA0; ++i) {
      this.font[i - 0x50] = font[i]
    }
    for (let i = 0x200; i <= 0xFFF; ++i) {
      this.ram[i - 0x200] = 0
    }
  }

  get(address: Address) {
    if (address >= 0x000 && address <= 0x1FF) return this.interpreter[address]
    if (address >= 0x050 && address <= 0x0A0) return this.font[address - 0x050]
    if (address >= 0x200 && address <= 0xFFF) return this.ram[address - 0x200]
  }

  set(address: Address, value: Byte) {
    if (address >= 0x000 && address <= 0x1FF) throw new IllegalAccess(address)
    if (address >= 0x050 && address <= 0x0A0) throw new IllegalAccess(address)
    if (address >= 0x200 && address <= 0xFFF) this.ram[address - 0x200] = value
  }
}

export class Screen {
  width = 64
  height = 32
  pixels: Byte[] = [] // size widht*height

  constructor() {
    this.reset()
  }

  reset() {
    for (let i = 0; i < 64 * 32; ++i) {
      this.pixels[i] = 0
    }
  }
}

export class Stack {
  stack: Address[] = [] // size 16
  sp: Byte

  constructor() {
    this.sp = 0
    this.reset()
  }

  reset() {
    this.stack = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  }

  push(address: Address) {
    if (this.sp == 16) {
      throw new StackOverflow()
    }
    this.stack[this.sp] = address
    this.sp++
  }

  pop(): Address {
    if (this.sp == 0) {
      throw new StackUnderflow()
    }

    this.sp--
    return this.stack[this.sp]
  }
}

export interface Chip8 {
  registers: Registers
  timer: Timer
  memory: Memory
  screen: Screen
  stack: Stack
  keys: Boolean[]
}

export class Chip8Emulator implements Chip8 {
  registers = new Registers()
  timer = new Timer()
  memory = new Memory()
  screen = new Screen()
  stack = new Stack()
  keys: Boolean[] = []

  loadGame(game:Uint8Array) {
    if (game.byteLength > this.memory.ram.length) {
      throw new InvalidROM("ROM size too big")
    }
    for (let i = 0; i < game.byteLength; ++i) {
      this.memory.set(0x200 + i, game[i])
    }
  }

  tick() {
    const opcode = this.memory.get(this.registers.pc) << 8 | this.memory.get(this.registers.pc + 1)
    console.log(`pc: ${this.registers.pc.toString(16)}, opcode: ${opcode.toString(16)}`)
    this.registers.pc += 2
    instruction(opcode)
  }

  drawFlag(): boolean {
    return true // 0x00e0 clears screen, 0xdxyn draws a sprite
  }
}

class IllegalAccess extends Error {
  constructor(address: Address) {
    super(`Unable to access address ${address.toString(16)}`)
  }
}

class InvalidROM extends Error {
  constructor(reason: string) {
    super(reason)
  }
}

class StackUnderflow extends Error {}
class StackOverflow extends Error {}