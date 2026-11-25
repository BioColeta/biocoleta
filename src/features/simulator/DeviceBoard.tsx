import { isAnomalous } from '@/domain/rules'
import { ATTENTION_LEVEL_MIN } from '@/domain/constants'
import type { DemoDrain } from '@/domain/types'
import { formatFlow, formatLevel } from '@/lib/format'
import { cn } from '@/lib/utils'

function Led({ label, on, color }: { label: string; on: boolean; color: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-slate-300">
      <span className={cn('size-2.5 rounded-full', on ? color : 'bg-slate-600')} />
      {label}
      <span className="sr-only">{on ? 'aceso' : 'apagado'}</span>
    </span>
  )
}

function stateOf(drain: DemoDrain) {
  if (drain.status === 'offline') return 'SEM COMUNICAÇÃO'
  const reading = drain.lastReading
  if (!reading) return 'AGUARDANDO'
  if (isAnomalous(reading)) return 'ALERTA DE OBSTRUÇÃO'
  return reading.waterLevel >= ATTENTION_LEVEL_MIN ? 'ATENÇÃO: NÍVEL ALTO' : 'NORMAL'
}

export function DeviceBoard({ drain, sending }: { drain: DemoDrain; sending: boolean }) {
  const online = drain.status !== 'offline'
  return (
    <div className="rounded-xl border border-emerald-900 bg-[#06281f] p-4">
      <div className="mb-3 flex flex-wrap gap-4">
        <Led label="Energia" on color="bg-red-400" />
        <Led label="Rede" on={online} color="bg-sky-400" />
        <Led label="Envio" on={sending} color="bg-emerald-300" />
      </div>
      <div
        className="rounded-md bg-black p-3 font-mono text-sm leading-6 text-cyan-300"
        role="status"
        aria-label="Visor do dispositivo"
      >
        <p>BIOCOLETA · {drain.deviceId}</p>
        <p>Nível: {formatLevel(drain.lastReading?.waterLevel)}</p>
        <p>Fluxo: {formatFlow(drain.lastReading?.waterFlow)}</p>
        <p>Tampa: {drain.lastReading?.tamperAlert ? 'VIOLADA' : 'fechada'}</p>
        <p>Estado: {stateOf(drain)}</p>
      </div>
    </div>
  )
}
