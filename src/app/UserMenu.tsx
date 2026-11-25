import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { UserRound } from 'lucide-react'
import { request } from '@/api/client'
import { useSession } from '@/api/session'
import { Button } from '@/components/ui/button'
import { Menu } from '@/components/ui/menu'

export function UserMenu() {
  const user = useSession((state) => state.user)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const signOut = async () => {
    await request('/auth/logout', { method: 'POST' }).catch(() => undefined)
    await navigate({ to: '/login' })
    useSession.getState().end()
    queryClient.clear()
  }

  return (
    <Menu
      trigger={
        <Button variant="ghost" size="icon" aria-label={`Menu de ${user?.name ?? 'usuário'}`}>
          <UserRound />
        </Button>
      }
      items={[{ label: 'Sair', onSelect: () => void signOut() }]}
    />
  )
}
