import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { useState } from 'react'
import { EmptyState } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/field'

type DataTableProps<T> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<T, any>[]
  data: T[]
  label: string
  search?: string
  onSearchChange?: (value: string) => void
  initialSorting?: SortingState
  pageSize?: number
}

export function DataTable<T>({
  columns,
  data,
  label,
  search,
  onSearchChange,
  initialSorting = [],
  pageSize = 10,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>(initialSorting)
  const [localSearch, setLocalSearch] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize })
  const filter = search ?? localSearch
  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter: filter, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    autoResetPageIndex: false,
    getColumnCanGlobalFilter: () => true,
    globalFilterFn: 'includesString',
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })
  const pageCount = Math.max(table.getPageCount(), 1)
  if (pagination.pageIndex >= pageCount) {
    setPagination({ pageIndex: pageCount - 1, pageSize })
  }

  const changeSearch = (value: string) => {
    ;(onSearchChange ?? setLocalSearch)(value)
    setPagination({ pageIndex: 0, pageSize })
  }

  return (
    <div className="grid min-w-0 gap-3">
      <Input
        type="search"
        aria-label={`Buscar em ${label}`}
        placeholder="Buscar"
        className="max-w-xs"
        value={filter}
        onChange={(event) => changeSearch(event.target.value)}
      />
      <div
        className="bg-card relative overflow-x-auto rounded-xl border"
        role="region"
        aria-label={label}
        tabIndex={0}
      >
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id} className="text-muted-foreground border-b text-left">
                {group.headers.map((header) => {
                  const sorted = header.column.getIsSorted()
                  const Icon =
                    sorted === 'asc' ? ArrowUp : sorted === 'desc' ? ArrowDown : ArrowUpDown
                  return (
                    <th
                      key={header.id}
                      className="px-3 py-2 font-medium whitespace-nowrap"
                      aria-sort={
                        sorted ? (sorted === 'asc' ? 'ascending' : 'descending') : undefined
                      }
                    >
                      {header.column.getCanSort() ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <Icon className="size-3" aria-hidden />
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-muted/50 border-b last:border-0">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-2.5 whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {table.getRowModel().rows.length === 0 && (
          <EmptyState title="Nenhum resultado" description="Ajuste os filtros ou a busca." />
        )}
      </div>
      <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-2 text-sm">
        <span>
          {table.getFilteredRowModel().rows.length} itens · página {pagination.pageIndex + 1} de{' '}
          {pageCount}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  )
}
