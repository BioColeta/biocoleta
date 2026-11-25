import { readFile, writeFile } from 'node:fs/promises'
import { PNG } from 'pngjs'
import { buildDrainNetwork } from '../src/domain/network.ts'
import { between, seededRandom } from '../src/domain/random.ts'
import { terrariumElevation, tilePosition } from '../src/domain/terrarium.ts'

const TILES = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium'
const ZOOM = 14
const data = new URL('../src/mocks/data/', import.meta.url)

type Location = { id: string; lat: number; lng: number }

const cache = new Map<string, PNG>()

async function tile(x: number, y: number): Promise<PNG> {
  const key = `${ZOOM}/${x}/${y}`
  const cached = cache.get(key)
  if (cached) return cached
  const response = await fetch(`${TILES}/${key}.png`)
  if (!response.ok) throw new Error(`Tile ${key} failed with HTTP ${response.status}`)
  const png = PNG.sync.read(Buffer.from(await response.arrayBuffer()))
  cache.set(key, png)
  return png
}

async function elevationOf({ lat, lng }: Location): Promise<number> {
  const { x, y, column, row } = tilePosition(lat, lng, ZOOM)
  const png = await tile(x, y)
  const offset = (row * png.width + column) * 4
  const [red, green, blue] = png.data.subarray(offset, offset + 3)
  return Number(terrariumElevation(red, green, blue).toFixed(2))
}

const locations: Location[] = JSON.parse(
  await readFile(new URL('drain-locations.json', data), 'utf8'),
)
const points = []
for (const location of locations) {
  points.push({ ...location, elevationM: await elevationOf(location) })
}
const network = buildDrainNetwork(points)
const random = seededRandom(2026)
const terrain = Object.fromEntries(
  points.map((point) => [
    point.id,
    {
      elevationM: point.elevationM,
      downstreamDrainId: network[point.id],
      catchmentAreaM2: between(random, 500, 5000, 0),
      runoffCoefficient: between(random, 0.6, 0.95),
      capacityLps: between(random, 20, 120, 0),
    },
  ]),
)
await writeFile(new URL('terrain.json', data), `${JSON.stringify(terrain, null, 1)}\n`)
console.log(`Wrote terrain for ${points.length} drains from ${cache.size} tile(s)`)
