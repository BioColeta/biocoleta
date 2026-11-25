import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Label, Select, Textarea } from '@/components/ui/field'
import { prioritySchema } from '@/domain/types'
import { priorityInfo } from '@/lib/labels'

const crews = ['Equipe Norte', 'Equipe Centro', 'Equipe Sul'] as const

const schema = z.object({
  priority: prioritySchema,
  crew: z.enum(crews),
  note: z.string().max(500, 'Use no máximo 500 caracteres'),
})

export type WorkOrderValues = z.infer<typeof schema>

type Props = {
  submitLabel: string
  pending: boolean
  onSubmit: (values: WorkOrderValues) => void
}

export function WorkOrderForm({ submitLabel, pending, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'medium', crew: crews[1], note: '' },
  })
  return (
    <form className="grid gap-3" onSubmit={handleSubmit(onSubmit)}>
      <Label>
        Prioridade
        <Select {...register('priority')}>
          {prioritySchema.options.map((priority) => (
            <option key={priority} value={priority}>
              {priorityInfo[priority].label}
            </option>
          ))}
        </Select>
      </Label>
      <Label>
        Equipe
        <Select {...register('crew')}>
          {crews.map((crew) => (
            <option key={crew}>{crew}</option>
          ))}
        </Select>
      </Label>
      <Label>
        Observação
        <Textarea {...register('note')} aria-invalid={Boolean(errors.note)} />
        {errors.note && <span className="text-danger">{errors.note.message}</span>}
      </Label>
      <Button type="submit" disabled={pending}>
        {submitLabel}
      </Button>
    </form>
  )
}
