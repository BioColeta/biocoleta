import { toast } from 'sonner'
import { useActivatePrompt, usePrompts, useSimulation, useUpdateSimulation } from '@/api/hooks'
import { Page, PageHeader } from '@/components/page'
import { QueryView } from '@/components/states'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { Label, Select } from '@/components/ui/field'
import { RULE } from '@/domain/constants'
import { aiModeSchema, type AiMode } from '@/domain/types'
import { formatDateTime, formatFlow } from '@/lib/format'

const modeLabel: Record<AiMode, string> = {
  ok: 'Funcionando',
  unavailable: 'Indisponível (erro 503)',
  invalid: 'Resposta inválida',
}

function Prompts() {
  const prompts = usePrompts()
  const activate = useActivatePrompt()
  return (
    <Card>
      <CardTitle>Versões de prompt</CardTitle>
      <QueryView query={prompts}>
        {(data) => (
          <ul className="grid gap-3">
            {data.map((prompt) => (
              <li key={prompt.version} className="bg-background rounded-lg border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong>Versão {prompt.version}</strong>
                  {prompt.active ? (
                    <StatusBadge tone="ok" label="Ativa" />
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={activate.isPending}
                      onClick={() =>
                        activate.mutate(prompt.version, {
                          onSuccess: () => toast.success(`Versão ${prompt.version} ativada`),
                          onError: (error) => toast.error(error.message),
                        })
                      }
                    >
                      Ativar {prompt.version}
                    </Button>
                  )}
                </div>
                <p className="mt-2 text-sm">{prompt.content}</p>
                <p className="text-muted-foreground mt-2 text-xs">
                  Criada em {formatDateTime(prompt.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </QueryView>
    </Card>
  )
}

function FailureSimulation() {
  const simulation = useSimulation()
  const update = useUpdateSimulation()
  return (
    <Card>
      <CardTitle>Testar falhas da análise</CardTitle>
      <Label>
        Comportamento do analisador simulado
        <Select
          value={simulation.data?.aiMode ?? 'ok'}
          onChange={(event) => update.mutate({ aiMode: event.target.value as AiMode })}
        >
          {aiModeSchema.options.map((mode) => (
            <option key={mode} value={mode}>
              {modeLabel[mode]}
            </option>
          ))}
        </Select>
      </Label>
    </Card>
  )
}

export function SettingsPage() {
  const rule = [
    ['Identificador', RULE.id],
    ['Nível mínimo', `${RULE.levelMin}%`],
    ['Fluxo máximo', formatFlow(RULE.flowMax)],
    ['Leituras consecutivas', String(RULE.consecutive)],
  ]
  return (
    <Page>
      <PageHeader
        title="Análise de IA"
        description="A análise é simulada no navegador, sem modelo real nem chave de API."
      />
      <div className="grid gap-3 lg:grid-cols-[2fr_1fr]">
        <Prompts />
        <div className="grid content-start gap-3">
          <Card>
            <CardTitle>Regra de detecção (somente leitura)</CardTitle>
            <dl className="grid gap-2 text-sm">
              {rule.map(([term, value]) => (
                <div key={term} className="flex flex-wrap justify-between gap-2">
                  <dt className="text-muted-foreground">{term}</dt>
                  <dd className="font-medium break-all">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <FailureSimulation />
        </div>
      </div>
    </Page>
  )
}
