import { Byte, Word, Address } from "./types.js"
import font from "./font.js"
import instruction from "./instructions.js"

export class Timer {
  delay: Byte = 0
  sound: Byte = 0

  reset() {
    this.delay = 0
    this.sound = 0;
  }

  // TODO: count down every 60hz
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

  get(address: Address): number {
    if (address >= 0x000 && address <= 0x1FF) return this.interpreter[address]
    if (address >= 0x050 && address <= 0x0A0) return this.font[address - 0x050]
    if (address >= 0x200 && address <= 0xFFF) return this.ram[address - 0x200]
    throw new IllegalAccess(address)
  }

  set(address: Address, value: Byte) {
    if (address >= 0x000 && address <= 0x1FF) throw new IllegalAccess(address)
    if (address >= 0x050 && address <= 0x0A0) throw new IllegalAccess(address)
    if (address >= 0x200 && address <= 0xFFF) this.ram[address - 0x200] = value
  }
}

export class Display {
  width = 64
  height = 32
  pixels: boolean[] = [] // size widht*height

  constructor() {
    this.reset()
  }

  set(x: Byte, y: Byte, state: boolean) {
    if (x < 0 || x > this.width) console.log(`drawing out of bounds to ${x},${y}`) //throw new OutOfBounds(x)
    if (y < 0 || y > this.height) console.log(`drawing out of bounds to ${x},${y}`)  // throw new OutOfBounds(y)
    this.pixels[y * this.width + x] = state
  }

  get(x: Byte, y: Byte): boolean {
    return this.pixels[y * this.width + x]
  }

  reset() {
    for (let i = 0; i < 64 * 32; ++i) {
      this.pixels[i] = false
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
  timer: Timer
  memory: Memory
  display: Display
  stack: Stack
  keys: Boolean[]
  pc: Word
  I: Word
  V: Byte[]
}

export class Chip8Emulator implements Chip8 {
  timer = new Timer()
  memory = new Memory()
  display = new Display()
  stack = new Stack()

  keys: Boolean[] = []
  pc: Word = 0x200
  I: Word = 0
  V: Byte[] = [] // size 16
  
  drawFlag = false

  loadGame(game:Uint8Array) {
    if (game.byteLength > this.memory.ram.length) {
      throw new InvalidROM("ROM size too big")
    }
    for (let i = 0; i < game.byteLength; ++i) {
      const byte = game[i]
      this.memory.set(0x200 + i, byte)
    }
    for (let i = 0; i < game.byteLength; i += 2) {
      const word = game[i] << 8 | game[i + 1]
      console.log(i.toString(16), word.toString(16), instruction(word).name)
    }
  }

  tick() {
    const opcode = this.memory.get(this.pc) << 8 | this.memory.get(this.pc + 1)
    this.drawFlag = (opcode == 0x00e0) || ((opcode & 0xF000) == 0xD000)
    const inst = instruction(opcode)
    console.log(`pc: ${this.pc.toString(16)}, op: ${opcode.toString(16)} ${inst.name}`)
    this.pc += 2
    inst.execute(this)
  }

  reset() {
    this.timer.reset()
    this.memory.reset()
    this.display.reset()
    this.stack.reset()
    this.keys = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false]
    this.pc = 0x200
    this.I = 0
    this.V = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
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

class OutOfBounds extends Error {
  constructor(byte: Byte) {
    super(`Out of bounds: ${byte.toString(16)}`)
  }
}

class StackUnderflow extends Error {}
class StackOverflow extends Error {}