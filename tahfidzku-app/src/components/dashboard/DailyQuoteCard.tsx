import { Card, CardContent } from '../ui/card'
import { Quote } from 'lucide-react'

interface DailyQuoteCardProps {
  quote: {
    text: string
    source: string
  }
}

export function DailyQuoteCard({ quote }: DailyQuoteCardProps) {
  return (
    <Card className="w-full bg-gradient-to-br from-emerald-500 to-teal-600 border-none shadow-md overflow-hidden relative">
      {/* Dekorasi Latar Belakang */}
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Quote size={80} />
      </div>
      
      <CardContent className="p-5 relative z-10">
        <div className="flex flex-col space-y-3">
          <div className="flex items-center space-x-2 opacity-80 text-white/90">
            <Quote size={16} fill="currentColor" />
            <span className="text-xs font-semibold uppercase tracking-wider">Kutipan Hari Ini</span>
          </div>
          
          <blockquote className="text-white font-medium leading-snug">
            "{quote.text}"
          </blockquote>
          
          <div className="text-emerald-100 text-xs font-medium text-right pt-2 border-t border-emerald-400/30">
            — {quote.source}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
