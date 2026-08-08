import { Card, CardContent } from '../ui/card'
import { Megaphone, Calendar } from 'lucide-react'

interface Pengumuman {
  id: string
  judul: string
  konten: string
  createdAt: string
}

interface PengumumanWaliListProps {
  pengumumanList: Pengumuman[]
}

export function PengumumanWaliList({ pengumumanList }: PengumumanWaliListProps) {
  if (!pengumumanList || pengumumanList.length === 0) {
    return (
      <div className="w-full">
        <h2 className="text-sm font-bold text-slate-700 mb-3 px-1">Papan Pengumuman</h2>
        <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
          <CardContent className="p-8 flex flex-col items-center justify-center text-center">
            <div className="bg-slate-100 p-3 rounded-full mb-3 text-slate-400">
              <Megaphone className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-600">Belum ada pengumuman</p>
            <p className="text-xs text-slate-400 mt-1">Informasi terbaru dari sekolah akan tampil di sini</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full">
      <h2 className="text-sm font-bold text-slate-700 mb-3 px-1 flex items-center justify-between">
        <span>Papan Pengumuman</span>
        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
          {pengumumanList.length} Terbaru
        </span>
      </h2>
      
      <div className="space-y-3">
        {pengumumanList.map((item) => (
          <Card key={item.id} className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-50 p-2 rounded-md text-blue-500 shrink-0 mt-0.5">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div className="flex flex-col space-y-1.5 flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-slate-800 leading-tight">{item.judul}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {item.konten}
                  </p>
                  <div className="flex items-center text-[10px] text-slate-400 font-medium pt-1">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(item.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
