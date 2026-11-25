import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { Info, Pause, Play } from 'lucide-react'
import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useCreateWorkOrder, useDrains, useWorkOrders } from '@/api/hooks'
import { KpiCard, Page, PageHeader } from '@/components/page'
import { EmptyState, QueryView } from '@/components/states'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { RangeField } from '@/components/ui/controls'
import { Dialog } from '@/components/ui/dialog'
import { cleaningRanking, RAIN_PRESETS, simulateStorm } from '@/domain/hydrology'
import type { DrainView, WorkOrderView } from '@/domain/types'
import { isOpenWorkOrder } from '@/domain/workOrders'
import { WorkOrderForm } from '@/features/work-orders/WorkOrderForm'
import { formatPercent } from '@/lib/format'
import { drainStatusInfo } from '@/lib/labels'
import { bandInfo, formatVolume } from './pressure'
import { ReliefMap } from './ReliefMap'

const PLAY_STEP_MS = 800
const DEFAULT_INTENSITY = 50
const DEFAULT_DURATION = 60
const TOP = 8

function Planner({ drains, orders }: { drains: DrainView[]; orders: WorkOrderView[] }) {
  const { intensity = DEFAULT_INTENSITY, duration = DEFAULT_DURATION } = useSearch({
    from: '/app/planning',
  })
  const navigate = useNavigate({ from: '/app/planning' })
  const update = (patch: { intensity?: number; duration?: number }) => {
    setChosenStep(null)
    void navigate({ search: (current) => ({ ...current, ...patch }), replace: true })
  }
  const [chosenStep, setChosenStep] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [ordering, setOrdering] = useState<string | null>(null)
  const create = useCreateWorkOrder()

  // One object, so map, summary and ranking always describe the same scenario.
  const scenario = useDeferredValue(
    useMemo(() => ({ drains, intensity, duration }), [drains, intensity, duration]),
  )
  const storm = useMemo(
    () => simulateStorm(scenario.drains, scenario.intensity, scenario.duration),
    [scenario],
  )
  const ranking = useMemo(
    () => cleaningRanking(scenario.drains, scenario.intensity, scenario.duration).slice(0, TOP),
    [scenario],
  )
  const last = storm.steps.length - 1
  const index = Math.min(chosenStep ?? storm.peakIndex, last)
  const step = storm.steps[index]

  useEffect(() => {
    if (!playing) return
    const timer = setInterval(() => {
      setChosenStep((current) => {
        const next = (current ?? 0) + 1
        if (next >= last) setPlaying(false)
        return Math.min(next, last)
      })
    }, PLAY_STEP_MS)
    return () => clearInterval(timer)
  }, [playing, last])

  const play = () => {
    if (!playing && index >= last) setChosenStep(0)
    else if (!playing && chosenStep === null) setChosenStep(0)
    setPlaying(!playing)
  }

  const pressured = [...step.flows].sort(([, a], [, b]) => b.pressure - a.pressure).slice(0, TOP)
  const openOrder = (drainId: string) =>
    orders.find((order) => order.drainId === drainId && isOpenWorkOrder(order))
  const focus = selected ? step.flows.get(selected) : undefined
  const focusDrain = drains.find((drain) => drain.id === selected)

  return (
    <div className="grid min-w-0 gap-3">
      <p className="border-warning/40 bg-warning/10 flex gap-2 rounded-xl border p-3 text-sm">
        <Info className="text-warning mt-0.5 size-4 shrink-0" aria-hidden />
        Estimativa didática: só a altitude vem de dado real. Áreas, capacidades e perdas por
        obstrução são fictícias. Não prevê alagamentos reais.
      </p>
      <Card className="grid gap-4 lg:grid-cols-2">
        <div className="grid content-start gap-4">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Cenários de chuva">
            {RAIN_PRESETS.map((preset) => (
              <Button
                key={preset.label}
                size="sm"
                variant={intensity === preset.intensity ? 'default' : 'outline'}
                aria-pressed={intensity === preset.intensity}
                onClick={() => update({ intensity: preset.intensity })}
              >
                {preset.label} · {preset.intensity} mm/h
              </Button>
            ))}
          </div>
          <RangeField
            label="Intensidade no pico"
            min={0}
            max={150}
            step={5}
            value={intensity}
            format={(value) => `${value} mm/h`}
            onChange={(value) => update({ intensity: value })}
          />
          <RangeField
            label="Duração"
            min={15}
            max={180}
            step={15}
            value={duration}
            format={(value) => `${value} min`}
            onChange={(value) => update({ duration: value })}
          />
        </div>
        <div className="grid content-start gap-3">
          <RangeField
            label="Linha do tempo"
            min={0}
            max={last}
            step={1}
            value={index}
            format={(value) =>
              `${storm.steps[value].minute} min · ${Math.round(storm.steps[value].intensity)} mm/h`
            }
            onChange={(value) => {
              setPlaying(false)
              setChosenStep(value)
            }}
          />
          <Button variant="secondary" size="sm" className="justify-self-start" onClick={play}>
            {playing ? <Pause /> : <Play />}
            {playing ? 'Pausar' : 'Reproduzir'}
          </Button>
        </div>
      </Card>
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Sobrecarregados neste momento" value={step.overloaded} />
        <KpiCard
          label="Volume excedente no evento"
          value={formatVolume(storm.excessLiters)}
          hint="Água que sai da rede pelos pontos de saída"
        />
        <KpiCard
          label="Maior pressão agora"
          value={formatPercent(pressured[0]?.[1].pressure ?? 0)}
          hint={pressured[0]?.[0]}
        />
      </div>
      <div className="h-[65dvh] min-h-96 overflow-hidden rounded-xl border">
        <ReliefMap drains={drains} flows={step.flows} selected={selected} onSelect={setSelected} />
      </div>
      {focus && focusDrain && (
        <Card className="text-sm" aria-live="polite">
          <strong>{focusDrain.id}</strong> · {focusDrain.elevationM} m de altitude · chega{' '}
          {focus.inflowLps.toFixed(0)} L/s para {focus.capacityLps.toFixed(0)} L/s de capacidade (
          {formatPercent(focus.pressure)}).{' '}
          {focusDrain.downstreamDrainId
            ? `O excedente desce para ${focusDrain.downstreamDrainId}.`
            : 'É um ponto de saída da rede.'}
          {focus.uncertain && ' Sensor offline: situação real desconhecida.'}
        </Card>
      )}
      <div className="grid gap-3 xl:grid-cols-2">
        <Card>
          <CardTitle>Pontos mais pressionados</CardTitle>
          <ul className="divide-y">
            {pressured.map(([id, flow]) => (
              <li key={id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <button
                  type="button"
                  className="text-primary text-sm font-medium underline-offset-4 hover:underline"
                  onClick={() => setSelected(id)}
                >
                  {id}
                </button>
                <span className="flex items-center gap-2 text-sm tabular-nums">
                  {formatPercent(flow.pressure)}
                  <StatusBadge {...bandInfo[flow.band]} />
                </span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardTitle>Limpar antes da chuva</CardTitle>
          {ranking.length === 0 ? (
            <EmptyState title="Nenhum bueiro obstruído ou em atenção" />
          ) : (
            <ol className="divide-y" aria-label="Ranking de limpeza">
              {ranking.map((item) => {
                const order = openOrder(item.drainId)
                const status = drains.find((drain) => drain.id === item.drainId)!.status
                return (
                  <li key={item.drainId} className="grid gap-1.5 py-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <strong>{item.drainId}</strong>
                      <StatusBadge {...drainStatusInfo[status]} />
                    </div>
                    <p className="text-muted-foreground">
                      Evita {formatVolume(item.savedLiters)} · pressão no pico de{' '}
                      {formatPercent(item.pressureBefore)} para {formatPercent(item.pressureAfter)}
                      {item.avoidedOverloads > 0 &&
                        ` · ${item.avoidedOverloads} sobrecarga(s) a menos`}
                    </p>
                    {order ? (
                      <Link to="/app/work-orders" className="text-primary underline">
                        Ordem {order.id} aberta
                      </Link>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="justify-self-start"
                        onClick={() => setOrdering(item.drainId)}
                      >
                        Criar ordem preventiva
                      </Button>
                    )}
                  </li>
                )
              })}
            </ol>
          )}
        </Card>
      </div>
      <Dialog
        open={Boolean(ordering)}
        onOpenChange={(open) => !open && setOrdering(null)}
        title={`Ordem preventiva · ${ordering ?? ''}`}
        description="A ordem só é criada quando você confirmar."
      >
        <WorkOrderForm
          submitLabel="Confirmar ordem preventiva"
          pending={create.isPending}
          onSubmit={(values) =>
            create.mutate(
              { ...values, type: 'preventive', drainId: ordering! },
              {
                onSuccess: (created) => toast.success(`${created.id} criada`),
                onError: (error) => toast.error(error.message),
                onSettled: () => setOrdering(null),
              },
            )
          }
        />
      </Dialog>
    </div>
  )
}

export function PlanningPage() {
  const drains = useDrains()
  const orders = useWorkOrders()
  return (
    <Page>
      <PageHeader
        title="Planejamento de chuva"
        description="Escolha uma chuva e veja onde a rede ficaria pressionada."
      />
      <QueryView query={drains}>
        {(drainData) => (
          <QueryView query={orders}>
            {(orderData) => <Planner drains={drainData} orders={orderData} />}
          </QueryView>
        )}
      </QueryView>
    </Page>
  )
}
