import { useNavigate } from '@tanstack/react-router'
import { Command } from 'cmdk'
import { useEffect, type ReactNode } from 'react'
import { navigation } from '@/app/navigation'

type Props = { open: boolean; onOpenChange: (open: boolean) => void; children?: ReactNode }

export const commandItemClass =
  'flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm data-[selected=true]:bg-muted'

export function CommandPalette({ open, onOpenChange, children }: Props) {
  const navigate = useNavigate()

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        onOpenChange(!open)
      }
    }
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [open, onOpenChange])

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Paleta de comandos"
      overlayClassName="fixed inset-0 z-50 bg-black/60"
      contentClassName="fixed top-[15dvh] left-1/2 z-50 w-[min(34rem,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-xl border bg-card shadow-2xl"
    >
      <Command.Input
        placeholder="Ir para… ou buscar um bueiro"
        className="h-12 w-full border-b bg-transparent px-4 text-sm outline-none"
      />
      <Command.List className="max-h-80 overflow-y-auto p-2">
        <Command.Empty className="text-muted-foreground p-4 text-sm">
          Nada encontrado.
        </Command.Empty>
        <Command.Group heading="Navegação" className="text-muted-foreground text-xs">
          {navigation.map(({ to, label, icon: Icon }) => (
            <Command.Item
              key={to}
              className={`${commandItemClass} text-foreground`}
              onSelect={() => {
                onOpenChange(false)
                navigate({ to })
              }}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </Command.Item>
          ))}
        </Command.Group>
        {children}
      </Command.List>
    </Command.Dialog>
  )
}
