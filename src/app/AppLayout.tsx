import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import { Menu as MenuIcon, PanelLeftClose, PanelLeftOpen, Search } from 'lucide-react'
import { useState } from 'react'
import { Brand } from '@/app/Brand'
import { CommandPalette } from '@/app/CommandPalette'
import { navigation } from '@/app/navigation'
import { ThemeToggle } from '@/app/ThemeToggle'
import { UserMenu } from '@/app/UserMenu'
import { Button } from '@/components/ui/button'
import { useAlertNotifications } from '@/features/alerts/useAlertNotifications'
import { DrainCommands } from '@/features/map/DrainCommands'
import { Dialog } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

type NavProps = { newAlerts: number; collapsed?: boolean; onNavigate?: () => void }

function Navigation({ newAlerts, collapsed, onNavigate }: NavProps) {
  return (
    <nav aria-label="Principal" className="grid grid-cols-1 gap-1">
      {navigation.map(({ to, label, icon: Icon }) => {
        const pending = to === '/app/alerts' ? newAlerts : 0
        const fullName = pending ? `${label}, ${pending} aguardando decisão` : label
        return (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            title={collapsed ? fullName : undefined}
            // The visible text names the link; an explicit label is only needed when it is hidden.
            aria-label={collapsed ? fullName : undefined}
            className={cn(
              'text-muted-foreground hover:bg-muted hover:text-foreground relative flex h-9 items-center rounded-lg text-sm',
              collapsed ? 'justify-center' : 'gap-3 px-3',
            )}
            activeProps={{ className: 'bg-muted !text-foreground font-medium' }}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {!collapsed && <span className="truncate">{label}</span>}
            {pending > 0 && (
              <span
                className={cn(
                  'bg-danger text-background rounded-full text-center font-semibold tabular-nums',
                  collapsed
                    ? 'absolute top-0 right-0 min-w-4 px-1 text-[10px] leading-4'
                    : 'ml-auto px-1.5 text-xs',
                )}
              >
                {pending}
                {!collapsed && <span className="sr-only"> aguardando decisão</span>}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const newAlerts = useAlertNotifications()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const section = navigation.find((item) => pathname.startsWith(item.to))?.label

  return (
    <div className="flex min-h-dvh">
      <aside
        className={cn(
          'bg-card sticky top-0 hidden h-dvh shrink-0 flex-col gap-6 border-r p-3 md:flex',
          collapsed ? 'w-16' : 'w-60',
        )}
      >
        <Brand compact={collapsed} />
        <Navigation newAlerts={newAlerts} collapsed={collapsed} />
        <Button
          variant="ghost"
          size="icon"
          className="mt-auto self-center"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
        </Button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-background/90 sticky top-0 z-30 flex h-14 items-center gap-2 border-b px-4 backdrop-blur">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menu"
          >
            <MenuIcon />
          </Button>
          <p className="min-w-0 truncate text-sm">
            <span className="text-muted-foreground max-sm:hidden">Painel / </span>
            {section}
          </p>
          <span className="text-ok ml-auto flex items-center gap-1.5 text-xs">
            <span className="bg-ok size-2 animate-pulse rounded-full" />
            <span className="max-sm:sr-only">ao vivo</span>
          </span>
          <Button variant="outline" size="sm" onClick={() => setPaletteOpen(true)}>
            <Search />
            <span className="max-sm:sr-only">Buscar</span>
            <kbd className="text-muted-foreground text-xs max-sm:hidden">⌘K</kbd>
          </Button>
          <ThemeToggle />
          <UserMenu />
        </header>
        <main className="min-w-0 flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      <Dialog open={menuOpen} onOpenChange={setMenuOpen} title="Menu" side="left">
        <Navigation newAlerts={newAlerts} onNavigate={() => setMenuOpen(false)} />
      </Dialog>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen}>
        {paletteOpen && <DrainCommands onDone={() => setPaletteOpen(false)} />}
      </CommandPalette>
    </div>
  )
}
