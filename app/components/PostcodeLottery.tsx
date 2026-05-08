"use client"

import { useMemo } from 'react'

type Props = {
  data: any[]
  onClick?: (region: string, specialty: string) => void
}

export default function PostcodeLottery({ data, onClick }: Props) {
  const { rows, maxWait } = useMemo(() => {
    if (!data || data.length === 0) return { rows: [], maxWait: 60 }
    const top15 = [...data].sort((a, b) => b.gap_weeks - a.gap_weeks).slice(0, 15)
    const maxWait = Math.max(...top15.map(r => r.worst_wait)) * 1.05
    return { rows: top15, maxWait }
  }, [data])
  
  if (rows.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <p className="text-sm text-slate-500 italic">Not enough data for postcode lottery analysis under current filters.</p>
      </div>
    )
  }
  
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-slate-900 mb-1">
          Postcode Lottery
        </h2>
        <p className="text-sm text-slate-600">
          Top 15 region-specialty combinations with the largest wait-time gap between best and worst trust. 
          Each line shows the spread; longer line = more inequality of access.
        </p>
      </div>
      
      <div className="space-y-2 mt-4">
        <div className="flex items-center text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2">
          <div className="flex-1">Region · Specialty</div>
          <div className="w-[55%] flex items-center justify-between px-2">
            <span>0w</span>
            <span>{Math.round(maxWait / 4)}w</span>
            <span>{Math.round(maxWait / 2)}w</span>
            <span>{Math.round((maxWait / 4) * 3)}w</span>
            <span>{Math.round(maxWait)}w</span>
          </div>
          <div className="w-16 text-right">Gap</div>
        </div>
        {rows.map((r, i) => (
          <DumbbellRow 
            key={`${r.region}-${r.specialty_name}`} 
            row={r} 
            maxWait={maxWait}
            onClick={() => onClick?.(r.region, r.specialty_name)}
          />
        ))}
      </div>
      
      <div className="mt-4 text-xs text-slate-500 italic leading-relaxed">
        <strong className="text-slate-700 not-italic">Reading the chart:</strong> Each 
        line connects the best- and worst-performing trust within a region for a given 
        specialty. A longer line indicates patients with the same clinical need face 
        dramatically different waits depending solely on which trust serves their area — 
        a textbook "postcode lottery" pattern.
      </div>
    </div>
  )
}

function DumbbellRow({ row, maxWait, onClick }: any) {
  const bestPct = (row.best_wait / maxWait) * 100
  const worstPct = (row.worst_wait / maxWait) * 100
  const lineWidthPct = worstPct - bestPct
  
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center gap-2 hover:bg-slate-50 px-2 py-2 rounded transition-colors text-left group"
    >
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-slate-900 truncate">
          {row.specialty_name}
        </div>
        <div className="text-[10px] text-slate-500">
          {row.region} · {row.trust_count} trusts
        </div>
      </div>
      
      <div className="w-[55%] relative h-6">
        {/* Background grid line */}
        <div className="absolute inset-y-1/2 left-0 right-0 border-t border-dashed border-slate-200" />
        
        {/* Connecting line */}
        <div 
          className="absolute inset-y-1/2 h-0.5 bg-blue-300 group-hover:bg-blue-500 transition-colors"
          style={{ left: `${bestPct}%`, width: `${lineWidthPct}%` }}
        />
        
        {/* Best dot */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-green-500 border-2 border-white shadow"
          style={{ left: `${bestPct}%` }}
          title={`Best: ${row.best_wait.toFixed(1)}w`}
        />
        
        {/* Worst dot */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow"
          style={{ left: `${worstPct}%` }}
          title={`Worst: ${row.worst_wait.toFixed(1)}w`}
        />
      </div>
      
      <div className="w-16 text-right text-xs font-mono font-bold text-blue-900">
        {row.gap_weeks.toFixed(0)}w
      </div>
    </button>
  )
}