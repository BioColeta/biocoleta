import { AlertTriangle, CheckCircle2, CircleSlash, OctagonAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

export type Tone = 'ok' | 'warning' | 'danger' | 'neutral'

export const toneIcons = {
  ok: CheckCircle2,
  warning: AlertTriangle,
  danger: OctagonAlert,
  neutral: CircleSlash,
}

const toneClasses: Record<Tone, string> = {
  ok: 'text-ok border-ok/40 bg-ok/10',
  warning: 'text-warning border-warning/40 bg-warning/10',
  danger: 'text-danger border-danger/40 bg-danger/10',
  neutral: 'text-neutral border-neutral/40 bg-neutral/10',
}

export function StatusBadge({ tone, label }: { tone: Tone; label: string }) {
  const Icon = toneIcons[tone]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        toneClasses[tone],
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {label}
    </span>
  )
}
