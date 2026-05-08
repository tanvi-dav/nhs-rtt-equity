"use client"

import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label } from 'recharts'

type Props = {
  data: any[]
  onTrustClick: (trustCode: string) => void
}

export default function InvestmentPriorities({ data, onTrustClick }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <p className="text-sm text-slate-500 italic">No investment priority data for current filters.</p>
      </div>
    )
  }
  
  // Transform data for the chart
  const chartData = data.map(d => ({
    ...d,
    pct_breaching: d.pct_breaching_18wk,
    waiting: d.total_waiting,
    breaching: d.total_waiting - d.total_within_18_weeks,
    label: `${d.trust_name.split(' ').slice(0, 3).join(' ')} · ${d.specialty_name}`,
  }))
  
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-slate-900 mb-1">
          High-Impact Investment Targets
        </h2>
        <p className="text-sm text-slate-600">
          Each bubble = one trust-specialty combination. X = % of patients waiting beyond 18 weeks. 
          Y = total waiting list size. Bubble size = absolute number breaching. 
          Top-right = highest investment priority. Click a bubble to view trust detail.
        </p>
      </div>
      
      <div className="h-[440px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 30, bottom: 50, left: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              type="number" 
              dataKey="pct_breaching" 
              name="% breaching 18wk" 
              unit="%" 
              stroke="#64748b"
              style={{ fontSize: '11px' }}
              domain={['dataMin - 5', 'dataMax + 5']}
            >
              <Label 
                value="% of patients breaching 18-week target" 
                offset={-30} 
                position="insideBottom" 
                style={{ fontSize: '12px', fill: '#475569' }}
              />
            </XAxis>
            <YAxis 
              type="number" 
              dataKey="waiting" 
              name="total waiting" 
              stroke="#64748b"
              style={{ fontSize: '11px' }}
              tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v.toString()}
            >
              <Label 
                value="Total patients waiting" 
                angle={-90} 
                position="insideLeft" 
                offset={-15}
                style={{ fontSize: '12px', fill: '#475569' }}
              />
            </YAxis>
            <ZAxis type="number" dataKey="breaching" range={[80, 800]} />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
              content={({ active, payload }: any) => {
                if (!active || !payload || !payload[0]) return null
                const d = payload[0].payload
                return (
                  <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs">
                    <div className="font-bold text-slate-900 mb-1">{d.trust_name}</div>
                    <div className="text-slate-600 mb-2">{d.specialty_name} · {d.region}</div>
                    <div className="space-y-0.5">
                      <div><span className="text-slate-500">Total waiting:</span> <span className="font-mono font-semibold">{d.waiting.toLocaleString()}</span></div>
                      <div><span className="text-slate-500">Breaching 18wk:</span> <span className="font-mono font-semibold text-red-700">{d.breaching.toLocaleString()}</span></div>
                      <div><span className="text-slate-500">Breach rate:</span> <span className="font-mono font-semibold">{d.pct_breaching.toFixed(1)}%</span></div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-100 text-slate-500 italic">Click to view trust detail</div>
                  </div>
                )
              }}
            />
            <Scatter 
              data={chartData} 
              fill="#dc2626" 
              fillOpacity={0.55}
              stroke="#7f1d1d"
              strokeWidth={1}
              onClick={(d: any) => onTrustClick(d.trust_code)}
              style={{ cursor: 'pointer' }}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 text-xs text-slate-500 italic leading-relaxed">
        <strong className="text-slate-700 not-italic">Reading the chart:</strong> Bubbles 
        in the top-right combine high breach rates with large patient populations — these 
        represent the highest-impact intervention targets where added capacity would 
        deliver the greatest absolute reduction in 18-week breaches.
      </div>
    </div>
  )
}