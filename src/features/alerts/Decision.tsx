import { useState } from 'react'
import { toast } from 'sonner'
import { ApiError } from '@/api/client'
import { useDecision } from '@/api/hooks'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Label, Textarea } from '@/components/ui/field'
import type { DecisionOutcome } from '@/domain/types'

const copy: Record<DecisionOutcome, { title: string; description: string; done: string }> = {
  confirmed: {
    title: 'Confirmar obstrução',
    description:
      'O bueiro continua marcado como obstruído até a telemetria voltar ao normal. Depois você pode criar a ordem de serviço.',
    done: 'Obstrução confirmada',
  },
  false_positive: {
    title: 'Marcar como falso positivo',
    description:
      'O alerta é encerrado. Um novo alerta só surge depois que o bueiro enviar uma leitura normal.',
    done: 'Alerta marcado como falso positivo',
  },
}

export function Decision({ alertId }: { alertId: string }) {
  const [outcome, setOutcome] = useState<DecisionOutcome | null>(null)
  const [note, setNote] = useState('')
  const decision = useDecision(alertId)

  const submit = () => {
    if (!outcome) return
    decision.mutate(
      { outcome, note: note || undefined },
      {
        onSuccess: () => toast.success(copy[outcome].done),
        onError: (error) =>
          toast.error(
            error instanceof ApiError && error.status === 409
              ? 'Este alerta já mudou. Os dados foram atualizados.'
              : error.message,
          ),
        onSettled: () => {
          setOutcome(null)
          setNote('')
        },
      },
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => setOutcome('confirmed')}>Confirmar obstrução</Button>
      <Button variant="danger" onClick={() => setOutcome('false_positive')}>
        Falso positivo
      </Button>
      <ConfirmDialog
        open={outcome !== null}
        onOpenChange={(open) => !open && setOutcome(null)}
        title={outcome ? copy[outcome].title : ''}
        description={outcome ? copy[outcome].description : ''}
        confirmLabel="Registrar decisão"
        onConfirm={submit}
        pending={decision.isPending}
      >
        <Label>
          Observação (opcional)
          <Textarea maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
        </Label>
      </ConfirmDialog>
    </div>
  )
}
