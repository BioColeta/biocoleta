import type { DrainStatus, Scenario } from '@/domain/types'

type State = { status: DrainStatus; scenario: Scenario; hasDecision: boolean }

export type ScriptStep = {
  title: string
  detail: string
  action?: { label: string; scenario: Scenario }
  openPanel?: boolean
  done: (state: State) => boolean
}

export const script: ScriptStep[] = [
  {
    title: 'Escoamento normal',
    detail: 'Comece com o bueiro saudável.',
    action: { label: 'Aplicar normal', scenario: 'normal' },
    done: (state) => state.scenario === 'normal' && state.status === 'normal',
  },
  {
    title: 'Provocar a obstrução',
    detail: 'Nível alto e fluxo quase parado.',
    action: { label: 'Obstruir', scenario: 'obstruction' },
    done: (state) => state.scenario === 'obstruction',
  },
  {
    title: 'Aguardar o alerta',
    detail: 'Duas leituras seguidas criam o alerta.',
    done: (state) => state.status === 'obstructed',
  },
  {
    title: 'Decidir no painel',
    detail: 'Abra o alerta, analise e confirme.',
    openPanel: true,
    done: (state) => state.hasDecision,
  },
  {
    title: 'Normalizar',
    detail: 'A telemetria saudável encerra o alerta sozinha.',
    action: { label: 'Normalizar', scenario: 'normal' },
    done: (state) => state.scenario === 'normal' && state.status === 'normal',
  },
]

/** Steps complete in order, so an already healthy drain does not skip the script to its end. */
export function advanceScript(current: number, state: State): number {
  return current < script.length && script[current].done(state) ? current + 1 : current
}
