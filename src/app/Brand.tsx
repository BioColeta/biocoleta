import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'

export function Brand({ compact }: { compact?: boolean }) {
  return (
    <Link
      to="/"
      className={cn('flex items-center gap-2 font-semibold', compact && 'justify-center')}
      aria-label="BioColeta, início"
    >
      <img src={`${import.meta.env.BASE_URL}logo-mark.svg`} alt="" className="size-8" />
      {!compact && <span>BioColeta</span>}
    </Link>
  )
}
