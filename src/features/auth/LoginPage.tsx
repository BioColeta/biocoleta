import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useLogin } from '@/api/hooks'
import { Brand } from '@/app/Brand'
import { ThemeToggle } from '@/app/ThemeToggle'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input, Label } from '@/components/ui/field'
import { DEMO_CREDENTIALS } from '@/domain/constants'
import { internalTarget } from './redirect'

const schema = z.object({
  username: z.string().trim().min(1, 'Informe o usuário'),
  password: z.string().min(1, 'Informe a senha'),
})

export function LoginPage() {
  const navigate = useNavigate()
  const { redirect } = useSearch({ from: '/login' })
  const login = useLogin()
  const {
    register,
    handleSubmit,
    resetField,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { username: '', password: '' } })

  const enter = (credentials: z.infer<typeof schema>) =>
    login.mutate(credentials, {
      onSuccess: () => void navigate(internalTarget(redirect)),
      onError: () => resetField('password'),
    })

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between p-4">
        <Brand />
        <ThemeToggle />
      </header>
      <main className="grid flex-1 place-items-center p-4">
        <Card className="w-full max-w-sm p-6">
          <h1 className="text-xl font-semibold">Acessar o painel</h1>
          <p className="text-warning border-warning/40 bg-warning/10 my-4 rounded-lg border p-3 text-sm">
            Ambiente de demonstração com dados simulados. Não use senhas reais.
          </p>
          <form className="grid gap-4" onSubmit={handleSubmit(enter)} noValidate>
            <Label>
              Usuário
              <Input
                autoComplete="username"
                aria-invalid={Boolean(errors.username)}
                {...register('username')}
              />
              {errors.username && <span className="text-danger">{errors.username.message}</span>}
            </Label>
            <Label>
              Senha
              <Input
                type="password"
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
                {...register('password')}
              />
              {errors.password && <span className="text-danger">{errors.password.message}</span>}
            </Label>
            {login.error && (
              <p role="alert" className="text-danger text-sm">
                {login.error.message}
              </p>
            )}
            <Button type="submit" disabled={login.isPending}>
              Entrar
            </Button>
            <Button variant="secondary" onClick={() => enter(DEMO_CREDENTIALS)}>
              Entrar como operador de demonstração
            </Button>
          </form>
        </Card>
      </main>
    </div>
  )
}
