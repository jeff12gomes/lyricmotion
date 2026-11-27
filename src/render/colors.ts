export function invertHex(hex: string): string {
  if (/^#[\da-f]{3}$/i.test(hex)) {
    hex = `#${Array.from(hex.slice(1), (digit) => digit + digit).join("")}`;
  }
  if (!/^#[\da-f]{6}$/i.test(hex)) return hex;

  const red = 255 - Number.parseInt(hex.slice(1, 3), 16);
  const green = 255 - Number.parseInt(hex.slice(3, 5), 16);
  const blue = 255 - Number.parseInt(hex.slice(5, 7), 16);
  return `#${[red, green, blue]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")}`;
}
