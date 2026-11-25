import { RULE } from './constants.ts'
import { isAnomalous } from './rules.ts'
import type { Analysis, Reading } from './types.ts'

export type AnalysisResult = Pick<
  Analysis,
  'probability' | 'classification' | 'explanation' | 'readingIds'
>

const weights: Record<string, { anomalous: number; stagnant: number; high: number }> = {
  v1: { anomalous: 0.6, stagnant: 0.2, high: 0.2 },
  v2: { anomalous: 0.5, stagnant: 0.35, high: 0.15 },
}

const MIN_QUALITY = 0.5
const MIN_READINGS = 3

const percent = (value: number) => `${Math.round(value * 100)}%`
const ratio = (readings: Reading[], match: (reading: Reading) => boolean) =>
  readings.filter(match).length / readings.length

export function analyzeReadings(readings: Reading[], promptVersion: string): AnalysisResult {
  const readingIds = readings.map((reading) => reading.id)
  if (readings.length < MIN_READINGS) {
    return {
      probability: 0.5,
      classification: 'inconclusive',
      explanation: `Há apenas ${readings.length} leitura(s) na janela, insuficiente para concluir.`,
      readingIds,
    }
  }
  const quality = readings.reduce((sum, item) => sum + item.quality, 0) / readings.length
  const anomalous = ratio(readings, isAnomalous)
  const stagnant = ratio(readings, (item) => item.waterFlow <= RULE.flowMax)
  const high = ratio(readings, (item) => item.waterLevel >= RULE.levelMin)
  const weight = weights[promptVersion] ?? weights.v2
  const score = anomalous * weight.anomalous + stagnant * weight.stagnant + high * weight.high
  const probability = Number(score.toFixed(2))

  if (quality < MIN_QUALITY) {
    return {
      probability,
      classification: 'sensor_fault',
      explanation: `A qualidade média do sinal é ${percent(quality)}. Verifique o sensor antes de confiar nas medições.`,
      readingIds,
    }
  }
  const classification =
    probability >= 0.6 ? 'obstruction' : probability <= 0.25 ? 'normal' : 'inconclusive'
  return {
    probability,
    classification,
    explanation: `Em ${readings.length} leituras, ${percent(high)} têm nível alto, ${percent(stagnant)} têm fluxo parado e ${percent(anomalous)} apresentam os dois sinais juntos.`,
    readingIds,
  }
}
