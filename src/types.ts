export type Byte = number
export type Word = number
export type Address = Word

export function toHex(number: Number, digits: number = 4): string {
  return number.toString(16).toUpperCase().padStart(digits, '0')
}