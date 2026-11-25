import { Link } from '@tanstack/react-router'
import { Check, ExternalLink, Info, Pause, Play, Send } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { ApiError } from '@/api/client'
import {
  sendTelemetry,
  useDemoDrains,
  useResetDemo,
  useSimulation,
  useUpdateSimulation,
} from '@/api/hooks'
import { Brand } from '@/app/Brand'
import { ThemeToggle } from '@/app/ThemeToggle'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Page, PageHeader } from '@/components/page'
import { QueryView } from '@/components/states'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { RangeField, ToggleField } from '@/components/ui/controls'
import { Label, Select } from '@/components/ui/field'
import { buildPayload } from '@/domain/telemetry'
import { scenarioSchema, type DemoDrain, type ManualValues, type Simulation } from '@/domain/types'
import { formatFlow, formatLevel, formatTime } from '@/lib/format'
import { drainStatusInfo, scenarioLabel } from '@/lib/labels'
import { cn } from '@/lib/utils'
import { DeviceBoard } from './DeviceBoard'
import { advanceScript, script } from './script'
import { Terminal, type LogEntry } from './Terminal'

const presets = scenarioSchema.options.filter((scenario) => scenario !== 'manual')
const initialValues: ManualValues = { waterLevel: 20, waterFlow: 2.5, quality: 0.98, tamper: false }

const openPanel = (path: string) =>
  window.open(`${import.meta.env.BASE_URL}${path}`, '_blank', 'noopener')

function useScenario() {
  const update = useUpdateSimulation()
  return (drainId: string, scenario: (typeof presets)[number]) =>
    update.mutate(
      { scenario: { drainId, scenario } },
      {
        onSuccess: () => toast.success(`${drainId}: ${scenarioLabel[scenario]}`),
        onError: (error) => toast.error(error.message),
      },
    )
}

function ManualControls({ drain }: { drain: DemoDrain }) {
  const [values, setValues] = useState(initialValues)
  const [entries, setEntries] = useState<LogEntry[]>([])
  const [sending, setSending] = useState(false)
  const update = useUpdateSimulation()
  const apply = useScenario()
  const set = (patch: Partial<ManualValues>) => setValues((current) => ({ ...current, ...patch }))

  const send = async () => {
    setSending(true)
    const payload = buildPayload(drain, values, new Date())
    const log = (response: string, failed: boolean) =>
      setEntries((current) =>
        [
          {
            key: Date.now(),
            at: formatTime(payload.timestamp),
            request: JSON.stringify(payload, null, 2),
            response,
            failed,
          },
          ...current,
        ].slice(0, 20),
      )
    try {
      // Keeps the engine sending these values, otherwise its next tick would undo them.
      await update.mutateAsync({
        scenario: { drainId: drain.id, scenario: 'manual', manual: values },
      })
      const body = await sendTelemetry(payload)
      log(`201 ${JSON.stringify(body)}`, false)
    } catch (error) {
      const status = error instanceof ApiError ? error.status : 'erro'
      log(`${status} ${(error as Error).message}`, true)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="grid items-start gap-3 lg:grid-cols-2">
      <Card className="grid gap-5">
        <CardTitle className="mb-0">Dispositivo</CardTitle>
        <DeviceBoard drain={drain} sending={sending} />
        <fieldset>
          <legend className="mb-2 text-sm font-medium">
            Cenários · atual: {scenarioLabel[drain.scenario]}
          </legend>
          <div className="flex flex-wrap gap-2">
            {presets.map((scenario) => (
              <Button
                key={scenario}
                size="sm"
                variant={drain.scenario === scenario ? 'default' : 'outline'}
                aria-pressed={drain.scenario === scenario}
                onClick={() => apply(drain.id, scenario)}
              >
                {scenarioLabel[scenario]}
              </Button>
            ))}
          </div>
        </fieldset>
        <RangeField
          label="Nível da água"
          min={0}
          max={100}
          step={0.5}
          value={values.waterLevel}
          format={formatLevel}
          onChange={(waterLevel) => set({ waterLevel })}
        />
        <RangeField
          label="Fluxo de saída"
          min={0}
          max={10}
          step={0.01}
          value={values.waterFlow}
          format={formatFlow}
          onChange={(waterFlow) => set({ waterFlow })}
        />
        <RangeField
          label="Qualidade do sinal"
          min={0}
          max={1}
          step={0.01}
          value={values.quality}
          format={(value) => value.toFixed(2)}
          onChange={(quality) => set({ quality })}
        />
        <ToggleField
          label="Violação da tampa"
          checked={values.tamper}
          onChange={(tamper) => set({ tamper })}
        />
        <Button onClick={() => void send()} disabled={sending}>
          <Send /> Enviar agora
        </Button>
        <p className="text-muted-foreground text-xs">
          Ao enviar, o bueiro passa a repetir esses valores até você escolher outro cenário.
        </p>
      </Card>
      <Terminal entries={entries} onClear={() => setEntries([])} />
    </div>
  )
}

function Guide({ drain }: { drain: DemoDrain }) {
  const [step, setStep] = useState<number | null>(null)
  const apply = useScenario()
  if (step !== null) {
    const next = advanceScript(step, {
      status: drain.status,
      scenario: drain.scenario,
      // A false positive closes the alert, so "no longer new" is what marks a decision.
      hasDecision: drain.openAlert?.status !== 'new',
    })
    if (next !== step) setStep(next)
  }
  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <CardTitle className="mb-0">Roteiro de demonstração</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setStep(step === null ? 0 : null)}>
          {step === null ? 'Iniciar roteiro' : 'Encerrar roteiro'}
        </Button>
      </div>
      {step !== null && (
        <>
          <ol className="grid gap-2 md:grid-cols-5">
            {script.map((item, index) => (
              <li
                key={item.title}
                aria-current={index === step ? 'step' : undefined}
                className={cn(
                  'flex flex-col gap-2 rounded-lg border p-3 text-sm',
                  index === step && 'border-primary bg-muted',
                )}
              >
                <strong className="flex items-center gap-1.5">
                  {index < step && <Check className="text-ok size-4" aria-label="Concluído" />}
                  {index + 1}. {item.title}
                </strong>
                <span className="text-muted-foreground">{item.detail}</span>
                {index === step && item.action && (
                  <Button
                    size="sm"
                    onClick={() => apply(drain.id, item.action!.scenario as 'normal')}
                  >
                    {item.action.label}
                  </Button>
                )}
                {index === step && item.openPanel && (
                  <Button
                    size="sm"
                    onClick={() =>
                      openPanel(drain.openAlert ? `app/alerts/${drain.openAlert.id}` : 'app/alerts')
                    }
                  >
                    Abrir alerta
                  </Button>
                )}
              </li>
            ))}
          </ol>
          {step === script.length && (
            <p role="status" className="text-ok mt-3 text-sm font-medium">
              Ciclo completo demonstrado.
            </p>
          )}
        </>
      )}
    </Card>
  )
}

function GlobalControls({ simulation }: { simulation: Simulation }) {
  const update = useUpdateSimulation()
  const reset = useResetDemo()
  const [confirming, setConfirming] = useState(false)
  return (
    <Card className="flex flex-wrap items-center gap-2">
      <Button variant="secondary" onClick={() => update.mutate({ running: !simulation.running })}>
        {simulation.running ? <Pause /> : <Play />}
        {simulation.running ? 'Pausar motor' : 'Continuar motor'}
      </Button>
      <Select
        aria-label="Velocidade"
        className="w-36"
        value={simulation.speed}
        onChange={(event) => update.mutate({ speed: Number(event.target.value) as 1 | 5 })}
      >
        <option value={1}>Velocidade 1x</option>
        <option value={5}>Velocidade 5x</option>
      </Select>
      <Button variant="outline" onClick={() => update.mutate({ preset: 'storm' })}>
        Tempestade
      </Button>
      <Button variant="outline" onClick={() => update.mutate({ preset: 'calm' })}>
        Tudo normal
      </Button>
      <Button variant="danger" className="ml-auto" onClick={() => setConfirming(true)}>
        Restaurar dados
      </Button>
      <p className="text-muted-foreground w-full text-xs" role="status">
        {simulation.running
          ? `Motor ligado: uma leitura por bueiro a cada ${simulation.tickMs / simulation.speed / 1000}s.`
          : 'Motor pausado. “Enviar agora” continua funcionando.'}
      </p>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Restaurar dados da demonstração"
        description="Alertas, decisões e ordens criados agora serão apagados em todas as abas."
        confirmLabel="Restaurar"
        pending={reset.isPending}
        onConfirm={() =>
          reset.mutate(undefined, {
            onSuccess: () => toast.success('Dados restaurados'),
            onError: (error) => toast.error(error.message),
            onSettled: () => setConfirming(false),
          })
        }
      />
    </Card>
  )
}

export function SimulatorPage() {
  const [drainId, setDrainId] = useState('BUEIRO-0102')
  const drains = useDemoDrains()
  const simulation = useSimulation()
  return (
    <div className="min-h-dvh">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <Brand />
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/app/dashboard">Painel</Link>
          </Button>
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-4">
        <Page>
          <PageHeader
            title="Simulador"
            description="Faça o papel dos sensores e veja o painel reagir."
            actions={
              <Button variant="outline" onClick={() => openPanel('app/dashboard')}>
                <ExternalLink /> Abrir painel em outra aba
              </Button>
            }
          />
          <p className="border-warning/40 bg-warning/10 mb-3 flex gap-2 rounded-xl border p-3 text-sm">
            <Info className="text-warning mt-0.5 size-4 shrink-0" aria-hidden />
            Os dados ficam neste navegador: a sincronização vale entre abas daqui, não entre
            aparelhos diferentes.
          </p>
          <div className="grid gap-3">
            <QueryView query={simulation}>
              {(data) => <GlobalControls simulation={data} />}
            </QueryView>
            <QueryView query={drains}>
              {(data) => {
                const drain = data.find((item) => item.id === drainId) ?? data[0]
                return (
                  <>
                    <Card className="flex flex-wrap items-end gap-3">
                      <Label className="w-80 max-w-full">
                        Bueiro simulado
                        <Select
                          value={drain.id}
                          onChange={(event) => setDrainId(event.target.value)}
                        >
                          {data.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.id} · {item.district}
                            </option>
                          ))}
                        </Select>
                      </Label>
                      <StatusBadge {...drainStatusInfo[drain.status]} />
                    </Card>
                    <Guide key={`guide-${drain.id}`} drain={drain} />
                    <ManualControls key={drain.id} drain={drain} />
                  </>
                )
              }}
            </QueryView>
          </div>
        </Page>
      </main>
    </div>
  )
}
