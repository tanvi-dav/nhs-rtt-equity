"use client"

import { useMemo } from 'react'

type Props = {
  data: any[]
  onTrustClick: (trustCode: string) => void
}

export default function TrustOutliers({ data, onTrustClick }: Props) {
  // data shape: [{ trust_code, trust_name, region, deviation, wait, regional_avg }, ...]
  
  const { sorted, maxAbs } = useMemo(() => {
    if (!data || data.length === 0) return { sorted: [], maxAbs: 1 }
    const sorted = [...data].sort((a, b) => b.deviation - a.deviation)
    const maxAbs = Math.max(...data.map(d => Math.abs(d.deviation)))
    return { sorted, maxAbs }
  }, [data])
  
  if (sorted.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <p className="text-sm text-slate-500 italic">No outlier data for current filters.</p>
      </div>
    )
  }
  
  // Top 10 underperformers (positive deviation = waiting longer than peers) and top 10 overperformers
  const top10Worst = sorted.filter(d => d.deviation > 0).slice(0, 10)
  const top10Best = sorted.filter(d => d.deviation < 0).slice(-10).reverse()
  
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="mb-4">
      <h2 className="text-xl font-semibold text-slate-900 mb-1">
          Trust Performance Outliers
        </h2>
        <p className="text-sm text-slate-600">
          Each row is one trust. Bars show deviation from the regional mean wait time. 
          Red = waiting longer than peers; green = waiting shorter. Click any trust to view its detail.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
        {/* Worst performers */}
        <div>
          <h3 className="text-sm font-bold text-red-700 uppercase tracking-wider mb-3">
            ↑ Underperforming vs regional peers
          </h3>
          <div className="space-y-1.5">
            {top10Worst.map((d, i) => (
              <OutlierRow 
                key={d.trust_code} 
                trust={d} 
                maxAbs={maxAbs} 
                onClick={() => onTrustClick(d.trust_code)}
                color="red"
              />
            ))}
          </div>
        </div>
        
        {/* Best performers */}
        <div>
          <h3 className="text-sm font-bold text-green-700 uppercase tracking-wider mb-3">
            ↓ Outperforming regional peers
          </h3>
          <div className="space-y-1.5">
            {top10Best.map((d, i) => (
              <OutlierRow 
                key={d.trust_code} 
                trust={d} 
                maxAbs={maxAbs} 
                onClick={() => onTrustClick(d.trust_code)}
                color="green"
              />
            ))}
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-slate-500 italic leading-relaxed">
        <strong className="text-slate-700 not-italic">Methodology:</strong> Computed using 
        SQL window functions (<code className="bg-slate-100 px-1 rounded text-[11px]">AVG OVER PARTITION BY region</code>) 
        to derive regional means, with each trust's deviation expressed in weeks. Outliers 
        with positive deviation are candidates for operational review; negative-deviation 
        trusts may offer best-practice insights.
      </div>
    </div>
  )
}

function OutlierRow({ trust, maxAbs, onClick, color }: any) {
  const widthPct = (Math.abs(trust.deviation) / maxAbs) * 100
  const colorClass = color === 'red' ? 'bg-red-500' : 'bg-green-500'
  const textColor = color === 'red' ? 'text-red-700' : 'text-green-700'
  
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center gap-2 hover:bg-slate-50 px-2 py-1.5 rounded transition-colors text-left"
    >
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-slate-900 truncate" title={trust.trust_name}>
          {trust.trust_name}
        </div>
        <div className="text-[10px] text-slate-500 font-mono">
          {trust.region}
        </div>
      </div>
      <div className="flex-shrink-0 w-32 relative h-4">
        <div className="absolute inset-y-0 left-0 bg-slate-100 rounded w-full"></div>
        <div 
          className={`absolute inset-y-0 left-0 ${colorClass} rounded transition-all`}
          style={{ width: `${widthPct}%` }}
        />
      </div>
      <div className={`flex-shrink-0 w-16 text-right text-xs font-mono font-bold ${textColor}`}>
        {trust.deviation > 0 ? '+' : ''}{trust.deviation.toFixed(1)}w
      </div>
    </button>
  )
}