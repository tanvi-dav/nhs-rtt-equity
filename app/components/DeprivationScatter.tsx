"use client"
import { 
  ComposedChart, Scatter, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Label 
} from 'recharts'

export default function DeprivationScatter({ data }: { data: any[] }) {
  // Linear regression with statistics
  const calculateStats = (pts: any[]) => {
    if (pts.length < 2) return { slope: 0, intercept: 0, r2: 0, n: 0, line: [] }
    
    const n = pts.length
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0
    
    pts.forEach(p => {
      sumX += p.decile
      sumY += p.wait
      sumXY += p.decile * p.wait
      sumX2 += p.decile * p.decile
      sumY2 += p.wait * p.wait
    })
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n
    
    // R²: coefficient of determination
    const meanY = sumY / n
    let ssTotal = 0, ssResidual = 0
    pts.forEach(p => {
      const predicted = slope * p.decile + intercept
      ssTotal += Math.pow(p.wait - meanY, 2)
      ssResidual += Math.pow(p.wait - predicted, 2)
    })
    const r2 = 1 - (ssResidual / ssTotal)
    
    const line = [
      { decile: 1, wait: slope * 1 + intercept },
      { decile: 10, wait: slope * 10 + intercept }
    ]
    
    return { slope, intercept, r2, n, line }
  }
  
  const stats = calculateStats(data)
  
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-slate-900">
          Deprivation and Waiting Time
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Trust-area IMD decile (1 = most deprived) vs 92nd percentile wait
        </p>
      </div>
      
      {/* Statistics panel */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">Slope</div>
            <div className="font-mono font-semibold text-slate-900">
              {stats.slope.toFixed(3)} w/decile
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">R²</div>
            <div className="font-mono font-semibold text-slate-900">
              {stats.r2.toFixed(4)}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500">N</div>
            <div className="font-mono font-semibold text-slate-900">
              {stats.n.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
      
      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart margin={{ top: 20, right: 20, bottom: 30, left: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              type="number" 
              dataKey="decile" 
              domain={[1, 10]} 
              ticks={[1,2,3,4,5,6,7,8,9,10]}
              stroke="#64748b"
            >
              <Label 
                value="IMD Decile (1 = most deprived)" 
                offset={-15} 
                position="insideBottom" 
                style={{ fontSize: '12px', fill: '#475569' }}
              />
            </XAxis>
            <YAxis type="number" dataKey="wait" stroke="#64748b">
              <Label 
                value="92nd %ile wait (weeks)" 
                angle={-90} 
                position="insideLeft" 
                style={{ fontSize: '12px', fill: '#475569' }}
              />
            </YAxis>
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }} 
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
            />
            <Scatter name="Trusts" data={data} fill="#3b82f6" fillOpacity={0.4} />
            <Line 
              data={stats.line} 
              type="monotone" 
              dataKey="wait" 
              stroke="#dc2626" 
              strokeWidth={2.5} 
              dot={false} 
              activeDot={false} 
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      {/* Methodological caveat */}
      <div className="mt-4 text-xs text-slate-500 italic leading-relaxed">
        <strong className="text-slate-700 not-italic">Methodological note:</strong> The 
        observed null relationship reflects the use of trust headquarters' LSOA as a 
        proxy for catchment deprivation. Real trust catchments cover hundreds of LSOAs; 
        a weighted-catchment analysis would likely reveal patterns this aggregation 
        cannot capture. Patient-level data (not publicly available) would be the gold 
        standard for testing the inverse care law (Tudor Hart, 1971) in elective NHS care.
      </div>
    </div>
  )
}