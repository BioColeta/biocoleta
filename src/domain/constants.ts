export const CITY = {
  id: 'SAO-PAULO-SP',
  name: 'São Paulo',
  center: { lat: -23.5622, lng: -46.6548 },
}

export const RULE = {
  id: 'obstruction_level_flow_v1',
  levelMin: 75,
  flowMax: 0.05,
  consecutive: 2,
} as const

export const ATTENTION_LEVEL_MIN = 60
export const OFFLINE_AFTER_TICKS = 3
export const LOW_BATTERY = 20

export const DEMO_DEVICE_KEY = 'demo-device-key'
export const DEMO_CREDENTIALS = { username: 'operator', password: 'demo_operator' }
