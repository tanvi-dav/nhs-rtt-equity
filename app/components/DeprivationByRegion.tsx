"use client"

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Line, ComposedChart, ResponsiveContainer, Tooltip } from 'recharts'

type Props = {
  data: any[]
  selectedRegions: string[]
  onRegionClick: (region: string) => void
}

const REGIONS = [
  'London',
  'South East',
  'East of England',
  'Midlands',
  'North West',
  'North East and Yorkshire',
  'South West',
]

// Linear regression helper
function regression(points: { decile: number; wait: number }[]) {
  if (points.length < 2) return { slope: 0, intercept: 0, r2: 0 }
  const n = points.length
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
  points.forEach(p => {
    sumX += p.decile
    sumY += p.wait
    sumXY += p.decile * p.wait
    sumX2 += p.decile * p.decile
  })
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) || 0
  const intercept = (sumY - slope * sumX) / n
  const meanY = sumY / n
  let ssTotal = 0, ssRes = 0
  points.forEach(p => {
    const pred = slope * p.decile + intercept
    ssTotal += (p.wait - meanY) ** 2
    ssRes += (p.wait - pred) ** 2
  })
  const r2 = ssTotal > 0 ? 1 - (ssRes / ssTotal) : 0
  return { slope, intercept, r2 }
}

export default function DeprivationByRegion({ data, selectedRegions, onRegionClick }: Props) {
  // Group data by region
  const byRegion: Record<string, { decile: number; wait: number }[]> = {}
  REGIONS.forEach(r => byRegion[r] = [])
  data.forEach(d => {
    if (d.region && byRegion[d.region]) {
      byRegion[d.region].push({ decile: d.decile, wait: d.wait })
    }
  })

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-slate-900 mb-1">
          Deprivation Gradient by Region
        </h2>
        <p className="text-sm text-slate-600">
          Each panel: trust 92nd percentile wait (y) vs IMD decile (x, 1=most deprived). Click a region to filter the dashboard.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {REGIONS.map(region => {
          const points = byRegion[region]
          const reg = regression(points)
          const isSelected = selectedRegions.length === 1 && selectedRegions[0] === region
          const isInFilter = selectedRegions.includes(region)
          
          // Build trend line
          const trendLine = [
            { decile: 1, wait: reg.slope * 1 + reg.intercept },
            { decile: 10, wait: reg.slope * 10 + reg.intercept },
          ]
          
          return (
            <button
              key={region}
              onClick={() => onRegionClick(region)}
              className={`text-left bg-slate-50 rounded-lg p-3 border transition-all hover:shadow-md ${
                isSelected 
                  ? 'border-blue-600 ring-2 ring-blue-200' 
                  : isInFilter 
                    ? 'border-slate-300' 
                    : 'border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-baseline justify-between mb-1">
                <h3 className="text-xs font-bold text-slate-900 truncate" title={region}>
                  {region}
                </h3>
                <span className={`text-[10px] font-mono ${reg.slope > 0.1 ? 'text-red-700' : reg.slope < -0.1 ? 'text-green-700' : 'text-slate-500'}`}>
                  m={reg.slope.toFixed(2)}
                </span>
              </div>
              <div className="h-[140px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart margin={{ top: 5, right: 5, bottom: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      type="number" 
                      dataKey="decile" 
                      domain={[1, 10]} 
                      ticks={[1, 5, 10]}
                      style={{ fontSize: '10px' }}
                      stroke="#64748b"
                    />
                    <YAxis 
                      type="number" 
                      dataKey="wait" 
                      style={{ fontSize: '10px' }}
                      stroke="#64748b"
                      width={30}
                    />
                    <Tooltip 
                      contentStyle={{ fontSize: '11px', borderRadius: '6px' }}
                      formatter={(v: any) => [`${Number(v).toFixed(1)}w`, '92nd %ile wait']}
                      labelFormatter={(label: any) => `IMD decile ${label}`}
                    />
                    <Scatter data={points} fill="#3b82f6" fillOpacity={0.5} />
                    <Line 
                      data={trendLine} 
                      type="linear" 
                      dataKey="wait" 
                      stroke="#dc2626" 
                      strokeWidth={1.5} 
                      dot={false}
                      activeDot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-between items-center mt-1 text-[10px] text-slate-500 font-mono">
                <span>n={points.length}</span>
                <span>R²={reg.r2.toFixed(3)}</span>
              </div>
            </button>
          )
        })}
      </div>

      <div className="mt-4 text-xs text-slate-500 italic leading-relaxed">
        <strong className="text-slate-700 not-italic">Reading the chart:</strong> A 
        negative slope (m &gt; 0) means more deprived areas wait longer.
      </div>
    </div>
  )
}