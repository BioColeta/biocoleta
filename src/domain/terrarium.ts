export function terrariumElevation(red: number, green: number, blue: number): number {
  return red * 256 + green + blue / 256 - 32768
}

/** Web Mercator tile that contains a coordinate, plus the pixel inside that tile. */
export function tilePosition(lat: number, lng: number, zoom: number, size = 256) {
  const scale = 2 ** zoom
  const latitude = (lat * Math.PI) / 180
  const x = ((lng + 180) / 360) * scale
  const y = ((1 - Math.asinh(Math.tan(latitude)) / Math.PI) / 2) * scale
  return {
    x: Math.floor(x),
    y: Math.floor(y),
    column: Math.floor((x % 1) * size),
    row: Math.floor((y % 1) * size),
  }
}
