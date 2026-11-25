import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import { Menu as MenuIcon, PanelLeftClose, PanelLeftOpen, Search } from 'lucide-react'
import { useState } from 'react'
import { Brand } from '@/app/Brand'
import { CommandPalette } from '@/app/CommandPalette'
import { navigation } from '@/app/navigation'
import { ThemeToggle } from '@/app/ThemeToggle'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

type NavProps = { collapsed?: boolean; onNavigate?: () => void }

function Navigation({ collapsed, onNavigate }: NavProps) {
  return (
    <nav aria-label="Principal" className="grid gap-1">
      {navigation.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={onNavigate}
          title={collapsed ? label : undefined}
          aria-label={label}
          className="text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-3 rounded-lg px-3 py-2 text-sm"
          activeProps={{ className: 'bg-muted !text-foreground font-medium' }}
        >
          <Icon className="size-4 shrink-0" aria-hidden />
          {!collapsed && <span className="truncate">{label}</span>}
        </Link>
      ))}
    </nav>
  )
}

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
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
        <Navigation collapsed={collapsed} />
        <Button
          variant="ghost"
          size="icon"
          className="mt-auto"
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
        </header>
        <main className="min-w-0 flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      <Dialog open={menuOpen} onOpenChange={setMenuOpen} title="Menu" side="left">
        <Navigation onNavigate={() => setMenuOpen(false)} />
      </Dialog>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  )
}
