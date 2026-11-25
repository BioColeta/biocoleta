import { useNavigate } from '@tanstack/react-router'
import { Command } from 'cmdk'
import { MapPin } from 'lucide-react'
import { useDrains } from '@/api/hooks'
import { commandItemClass } from '@/app/CommandPalette'

export function DrainCommands({ onDone }: { onDone: () => void }) {
  const drains = useDrains()
  const navigate = useNavigate()
  return (
    <Command.Group heading="Buscar bueiro" className="text-muted-foreground text-xs">
      {drains.data?.map((drain) => (
        <Command.Item
          key={drain.id}
          value={`${drain.id} ${drain.address} ${drain.district}`}
          className={`${commandItemClass} text-foreground`}
          onSelect={() => {
            onDone()
            void navigate({ to: '/app/map', search: { drain: drain.id } })
          }}
        >
          <MapPin className="size-4" aria-hidden />
          {drain.id}
          <span className="text-muted-foreground truncate">{drain.address}</span>
        </Command.Item>
      ))}
    </Command.Group>
  )
}
