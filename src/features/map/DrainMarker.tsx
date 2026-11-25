import { toneIcons } from '@/components/status-badge'
import type { Tone } from '@/components/status-badge'
import { cn } from '@/lib/utils'

const background: Record<Tone, string> = {
  ok: 'bg-ok',
  warning: 'bg-warning',
  danger: 'bg-danger',
  neutral: 'bg-neutral',
}

// Each status also has its own shape, so colour is never the only difference.
const shape: Record<Tone, string> = {
  ok: 'rounded-full',
  warning: 'rounded-md rotate-0 [clip-path:polygon(50%_0,100%_100%,0_100%)] items-end pb-0.5',
  danger: '[clip-path:polygon(30%_0,70%_0,100%_30%,100%_70%,70%_100%,30%_100%,0_70%,0_30%)]',
  neutral: 'rounded-sm',
}

type Props = {
  tone: Tone
  label: string
  selected?: boolean
  onClick: () => void
}

export function DrainMarker({ tone, label, selected, onClick }: Props) {
  const Icon = toneIcons[tone]
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selected}
      title={label}
      onClick={onClick}
      className={cn('relative grid size-8 place-items-center', selected && 'scale-125')}
    >
      {tone === 'danger' && (
        <span className="bg-danger absolute inset-1 animate-ping rounded-full opacity-60" />
      )}
      <span
        className={cn(
          'text-background relative flex size-7 justify-center shadow-lg',
          'items-center',
          background[tone],
          shape[tone],
        )}
      >
        {tone !== 'warning' ? (
          <Icon className="size-4" aria-hidden />
        ) : (
          <span className="text-xs font-bold" aria-hidden>
            !
          </span>
        )}
      </span>
      {selected && <span className="border-foreground absolute inset-0 rounded-full border-2" />}
    </button>
  )
}
