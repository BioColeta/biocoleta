import { z } from 'zod'
import { CITY } from './constants.ts'
import type { ManualValues, Reading } from './types.ts'

const measurement = z.object({
  sensor_id: z.string().optional(),
  measurement: z.string(),
  value: z.number(),
  unit: z.string().optional(),
})

export const payloadSchema = z
  .object({
    city_id: z.string().optional(),
    sector: z.string().optional(),
    entity_type: z.string().optional(),
    entity_id: z.string().min(1),
    device_id: z.string().min(1),
    timestamp: z.string().refine((value) => !Number.isNaN(Date.parse(value)), 'Invalid timestamp'),
    readings: z.array(measurement).min(1),
    quality: z.number().min(0).max(1).optional(),
    tamper_alert: z.boolean().optional(),
  })
  .transform((payload, context) => {
    const valueOf = (name: string, max: number) => {
      const value = payload.readings.find((item) => item.measurement === name)?.value
      if (value === undefined || value < 0 || value > max) {
        context.addIssue({ code: 'custom', message: `Missing or invalid reading: ${name}` })
        return 0
      }
      return value
    }
    return {
      deviceId: payload.device_id,
      drainId: payload.entity_id,
      recordedAt: new Date(payload.timestamp).toISOString(),
      waterLevel: valueOf('water_level', 100),
      waterFlow: valueOf('water_flow', Number.MAX_SAFE_INTEGER),
      quality: payload.quality ?? 1,
      tamperAlert: payload.tamper_alert ?? false,
    }
  })

export type TelemetryInput = z.output<typeof payloadSchema>
export type TelemetryPayload = z.input<typeof payloadSchema>

export function buildPayload(
  drain: { id: string; deviceId: string },
  values: ManualValues,
  at: Date,
): TelemetryPayload {
  return {
    city_id: CITY.id,
    sector: 'sanitation',
    entity_type: 'drain',
    entity_id: drain.id,
    device_id: drain.deviceId,
    timestamp: at.toISOString(),
    readings: [
      {
        sensor_id: 'WATER-LEVEL-01',
        measurement: 'water_level',
        value: values.waterLevel,
        unit: 'percent',
      },
      {
        sensor_id: 'WATER-FLOW-01',
        measurement: 'water_flow',
        value: values.waterFlow,
        unit: 'L/s',
      },
    ],
    quality: values.quality,
    tamper_alert: values.tamper,
  }
}

export function payloadFromReading(drainId: string, reading: Reading): TelemetryPayload {
  const values = {
    waterLevel: reading.waterLevel,
    waterFlow: reading.waterFlow,
    quality: reading.quality,
    tamper: reading.tamperAlert,
  }
  return buildPayload(
    { id: drainId, deviceId: reading.deviceId },
    values,
    new Date(reading.recordedAt),
  )
}
