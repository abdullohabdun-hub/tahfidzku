import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useMemo } from 'react'
import { Printer, Loader2, FileText, ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'
import { flexRender, getCoreRowModel, useReactTable, getSortedRowModel } from "@tanstack/react-table"
import type { SortingState } from "@tanstack/react-table"
import { getMonthlyReport } from '../../server-fns/setoran'
import { Button } from '../../components/ui/button'

export const Route = createFileRoute('/admin/laporan')({
  component: LaporanBulananPage,
})

function LaporanBulananPage() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any[]>([])
  const [sorting, setSorting] = useState<SortingState>([])

  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1 // 1-12

  const [selectedYear, setSelectedYear] = useState<number>(currentYear)
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth)

  const loadData = async (y: number, m: number) => {
    setLoading(true)
    const res = await getMonthlyReport({ data: { year: y, month: m } })
    if (res.success && res.data) {
      setData(res.data)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData(selectedYear, selectedMonth)
  }, [selectedYear, selectedMonth])

  const columns = useMemo(() => [
    {
      accessorKey: 'createdAt',
      header: ({ column }: any) => (
        <Button 
          variant="ghost" 
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-slate-200 -ml-4"
        >
          Tanggal Setoran
          {{
            asc: <ChevronUp className="ml-2 h-4 w-4" />,
            desc: <ChevronDown className="ml-2 h-4 w-4" />,
          }[column.getIsSorted() as string] ?? <ChevronsUpDown className="ml-2 h-4 w-4 text-slate-400" />}
        </Button>
      ),
      cell: ({ row }: any) => {
        const date = new Date(row.getValue('createdAt'))
        return <span className="whitespace-nowrap">{date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
      },
    },
    {
      accessorKey: 'santriNama',
      header: ({ column }: any) => (
        <Button 
          variant="ghost" 
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-slate-200 -ml-4"
        >
          Nama Santri
          {{
            asc: <ChevronUp className="ml-2 h-4 w-4" />,
            desc: <ChevronDown className="ml-2 h-4 w-4" />,
          }[column.getIsSorted() as string] ?? <ChevronsUpDown className="ml-2 h-4 w-4 text-slate-400" />}
        </Button>
      ),
      cell: ({ row }: any) => <span className="font-medium text-slate-900">{row.getValue('santriNama')}</span>
    },
    {
      accessorKey: 'kelasNama',
      header: 'Kelas',
      cell: ({ row }: any) => row.getValue('kelasNama') || '-'
    },
    {
      id: 'jenis',
      accessorFn: (row: any) => row.jenis,
      header: 'Jenis',
      cell: ({ row }: any) => <span className="capitalize text-slate-600">{row.getValue('jenis')}</span>
    },
    {
      id: 'target',
      header: 'Hafalan (Juz/Surah)',
      cell: ({ row }: any) => {
        const d = row.original
        if (d.jenis === 'ziyadah') {
          return `${d.surah}: ${d.ayatAwal}-${d.ayatAkhir}`
        }
        return `Juz ${d.juz} Hal ${d.halamanAwal}-${d.halamanAkhir}`
      }
    },
    {
      accessorKey: 'kualitas',
      header: 'Kualitas',
      cell: ({ row }: any) => {
        const val = row.getValue('kualitas') as string
        const color = val === 'lancar' ? 'text-emerald-700 bg-emerald-100' :
                      val === 'mengulang' ? 'text-amber-700 bg-amber-100' : 'text-red-700 bg-red-100'
        return <span className={`capitalize text-[10px] font-bold px-2 py-1 rounded ${color}`}>{val}</span>
      }
    },
    {
      accessorKey: 'ustadzNama',
      header: 'Penyimak',
      cell: ({ row }: any) => row.getValue('ustadzNama')
    }
  ], [])

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]

  return (
    <div className="space-y-6 max-w-6xl">
      {/* HEADER: Akan disembunyikan saat di-print (lihat index.css media query) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Laporan Bulanan</h2>
          <p className="text-slate-500">Rekapitulasi seluruh setoran hafalan santri di lembaga Anda.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
            <select 
              value={selectedMonth} 
              onChange={e => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent text-sm font-medium pl-3 pr-2 py-1.5 outline-none border-r border-slate-200"
            >
              {monthNames.map((m, i) => (
                <option key={i+1} value={i+1}>{m}</option>
              ))}
            </select>
            <select 
              value={selectedYear} 
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-sm font-medium pl-2 pr-3 py-1.5 outline-none"
            >
              {[currentYear - 1, currentYear, currentYear + 1].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          
          <Button onClick={() => window.print()} variant="outline" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50">
            <Printer className="w-4 h-4 mr-2" /> Cetak
          </Button>
        </div>
      </div>

      {/* PRINT HEADER: Hanya muncul saat di-print */}
      <div className="hidden print:block mb-8 text-center border-b-2 border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-black uppercase">Laporan Hafalan Santri</h1>
        <p className="text-lg text-black mt-1">Periode: {monthNames[selectedMonth-1]} {selectedYear}</p>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:rounded-none">
        
        {loading ? (
          <div className="flex items-center justify-center p-12 text-emerald-600">
            <Loader2 className="animate-spin w-8 h-8" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-slate-400">
            <FileText className="w-12 h-12 mb-4 text-slate-200" />
            <p>Tidak ada catatan setoran pada bulan ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-left text-sm print:text-[11px] print:w-full">
              <thead className="bg-slate-50 border-b border-slate-200 print:bg-white print:border-b-2 print:border-slate-800">
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th key={header.id} className="p-3 font-semibold text-slate-700 print:text-black">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50 print:border-b print:border-slate-300 print:hover:bg-transparent">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="p-3 text-slate-700 print:text-black">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="hidden print:block mt-8 text-right text-xs">
        Dicetak pada: {new Date().toLocaleString('id-ID')}
      </div>
    </div>
  )
}
