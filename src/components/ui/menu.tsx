import { DropdownMenu } from 'radix-ui'
import type { ReactNode } from 'react'

export type MenuItem = { label: string; onSelect: () => void; disabled?: boolean }

export function Menu({ trigger, items }: { trigger: ReactNode; items: MenuItem[] }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="bg-card animate-in fade-in z-50 min-w-44 rounded-lg border p-1 shadow-xl"
        >
          {items.map((item) => (
            <DropdownMenu.Item
              key={item.label}
              disabled={item.disabled}
              onSelect={item.onSelect}
              className="data-[highlighted]:bg-muted cursor-pointer rounded-md px-3 py-2 text-sm outline-none data-[disabled]:opacity-50"
            >
              {item.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
