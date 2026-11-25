import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'

export type LogEntry = {
  key: number
  at: string
  request: string
  response: string
  failed: boolean
}

export function Terminal({ entries, onClear }: { entries: LogEntry[]; onClear: () => void }) {
  return (
    <Card className="flex flex-col">
      <div className="mb-3 flex items-center justify-between">
        <CardTitle className="mb-0">Terminal</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClear} disabled={entries.length === 0}>
          Limpar
        </Button>
      </div>
      <div
        className="max-h-96 min-h-48 overflow-auto rounded-lg bg-[#020617] p-3 font-mono text-xs text-slate-200"
        role="log"
        aria-label="Requisições enviadas"
        tabIndex={0}
      >
        {entries.length === 0 && (
          <p className="text-slate-400">Use “Enviar agora” para ver a requisição.</p>
        )}
        {entries.map((entry) => (
          <div key={entry.key} className="mb-4">
            <p className="text-sky-300">[{entry.at}] POST /api/telemetry</p>
            <p className={entry.failed ? 'text-red-300' : 'text-emerald-300'}>← {entry.response}</p>
            <pre className="mt-1 text-slate-400">{entry.request}</pre>
          </div>
        ))}
      </div>
    </Card>
  )
}
