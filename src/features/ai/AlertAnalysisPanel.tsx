import { Loader2, Sparkles } from 'lucide-react'
import { useAnalyses, useRequestAnalysis } from '@/api/hooks'
import { EmptyState, ErrorState, QueryView } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import type { Analysis } from '@/domain/types'
import { formatDateTime, formatPercent } from '@/lib/format'
import { classificationLabel } from '@/lib/labels'

function Result({ analysis }: { analysis: Analysis }) {
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <p className="text-lg font-semibold">{classificationLabel[analysis.classification]}</p>
        <p className="text-sm">
          Probabilidade de obstrução:{' '}
          <strong className="text-2xl tabular-nums">{formatPercent(analysis.probability)}</strong>
        </p>
      </div>
      <meter
        className="h-3 w-full"
        min={0}
        max={1}
        value={analysis.probability}
        aria-label="Probabilidade de obstrução"
      />
      <p className="text-sm">{analysis.explanation}</p>
      <p className="text-muted-foreground text-xs">
        Prompt {analysis.promptVersion} · {formatDateTime(analysis.createdAt)} ·{' '}
        {analysis.readingIds.length} leituras analisadas (
        {analysis.readingIds.map((id) => `#${id}`).join(', ')})
      </p>
    </div>
  )
}

export function AlertAnalysisPanel({ alertId }: { alertId: string }) {
  const analyses = useAnalyses(alertId)
  const analyze = useRequestAnalysis(alertId)
  return (
    <Card aria-label="Análise assistida">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <CardTitle className="mb-0 flex items-center gap-2">
          <Sparkles className="text-primary size-4" aria-hidden />
          Análise assistida
          <span className="text-muted-foreground rounded-full border px-2 py-0.5 text-xs font-normal">
            simulada
          </span>
        </CardTitle>
        <Button size="sm" onClick={() => analyze.mutate()} disabled={analyze.isPending}>
          {analyze.isPending && <Loader2 className="animate-spin" />}
          {analyze.isPending ? 'Analisando' : 'Solicitar análise'}
        </Button>
      </div>
      <p className="text-muted-foreground mb-3 text-xs">
        A análise apenas informa. Ela não decide, não muda o alerta e não cria ordens de serviço.
      </p>
      {analyze.error && !analyze.isPending && (
        <ErrorState
          message={`${analyze.error.message}. A decisão manual continua disponível.`}
          onRetry={() => analyze.mutate()}
        />
      )}
      <QueryView query={analyses}>
        {([latest, ...older]) => {
          if (!latest) {
            return analyze.error ? null : <EmptyState title="Nenhuma análise solicitada" />
          }
          return (
            <div className="grid gap-4">
              <Result analysis={latest} />
              {older.length > 0 && (
                <details className="text-sm">
                  <summary className="cursor-pointer">Análises anteriores ({older.length})</summary>
                  <ul className="mt-3 grid gap-3">
                    {older.map((analysis) => (
                      <li key={analysis.id} className="bg-background rounded-lg border p-3">
                        <Result analysis={analysis} />
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )
        }}
      </QueryView>
    </Card>
  )
}
