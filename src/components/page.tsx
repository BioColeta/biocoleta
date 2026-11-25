import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { Card } from '@/components/ui/card'

type PageHeaderProps = { title: string; description?: string; actions?: ReactNode }

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

export function Page({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  )
}

type KpiCardProps = { label: string; value: ReactNode; hint?: string }

export function KpiCard({ label, value, hint }: KpiCardProps) {
  return (
    <Card className="h-full">
      <p className="text-muted-foreground text-xs font-medium">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="text-muted-foreground mt-1 text-xs">{hint}</p>}
    </Card>
  )
}
