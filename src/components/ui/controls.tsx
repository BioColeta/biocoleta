import { Slider, Switch } from 'radix-ui'

type RangeProps = {
  label: string
  value: number
  min: number
  max: number
  step: number
  format: (value: number) => string
  onChange: (value: number) => void
}

export function RangeField({ label, value, min, max, step, format, onChange }: RangeProps) {
  return (
    <div className="grid gap-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <output className="text-primary tabular-nums">{format(value)}</output>
      </div>
      <Slider.Root
        className="relative flex h-5 touch-none items-center select-none"
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([next]) => onChange(next)}
      >
        <Slider.Track className="bg-muted relative h-1.5 grow rounded-full">
          <Slider.Range className="bg-primary absolute h-full rounded-full" />
        </Slider.Track>
        <Slider.Thumb
          aria-label={label}
          aria-valuetext={format(value)}
          className="border-primary bg-card block size-4 rounded-full border-2"
        />
      </Slider.Root>
    </div>
  )
}

type ToggleProps = { label: string; checked: boolean; onChange: (checked: boolean) => void }

export function ToggleField({ label, checked, onChange }: ToggleProps) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm font-medium">
      {label}
      <Switch.Root
        checked={checked}
        onCheckedChange={onChange}
        className="bg-muted data-[state=checked]:bg-primary h-6 w-11 shrink-0 rounded-full border p-0.5"
      >
        <Switch.Thumb className="bg-foreground data-[state=checked]:bg-primary-foreground block size-4.5 rounded-full transition-transform data-[state=checked]:translate-x-5" />
      </Switch.Root>
    </label>
  )
}
