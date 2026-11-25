import { Link } from '@tanstack/react-router'
import { EmptyState } from '@/components/states'
import { Button } from '@/components/ui/button'

export function NotFound() {
  return (
    <main className="grid min-h-[60dvh] place-items-center">
      <EmptyState
        title="Página não encontrada"
        description="O endereço acessado não existe."
        action={
          <Button asChild>
            <Link to="/">Voltar ao início</Link>
          </Button>
        }
      />
    </main>
  )
}
