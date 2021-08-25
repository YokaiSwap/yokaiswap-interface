export function ellipseString(str = '', width = 10): string {
  return `${str.slice(0, str.startsWith('0x') ? width + 2 : width)}...${str.slice(-width)}`
}
