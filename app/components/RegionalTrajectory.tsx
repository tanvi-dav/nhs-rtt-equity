"use client"

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'

type Props = {
  data: any[]
  selectedRegions: string[]
  onRegionClick: (region: string) => void
}

const REGION_COLORS: Record<string, string> = {
  'London': '#1e3a8a',
  'South East': '#7c3aed',
  'East of England': '#0891b2',
  'Midlands': '#d97706',
  'North West': '#dc2626',
  'North East and Yorkshire': '#059669',
  'South West': '#db2777',
}

export default function RegionalTrajectory({ data, selectedRegions, onRegionClick }: Props) {
  // data shape: [{ month: '2025-12-01', London: 36.2, 'South East': 37.4, ... }, ...]
  
  const formatMonth = (m: string) => new Date(m).toLocaleString('en-GB', { month: 'short', year: '2-digit' })
  
  const chartData = data.map(d => ({
    ...d,
    monthLabel: formatMonth(d.month),
  }))
  
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="mb-4">
      <h2 className="text-xl font-semibold text-slate-900 mb-1">
          Regional Trajectory
        </h2>
        <p className="text-sm text-slate-600">
          Average 92nd-percentile wait by region across the 3-month observation window. 
          Click a region in the legend to focus on it.
        </p>
      </div>
      
      <div className="h-[380px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="monthLabel" 
              padding={{ left: 30, right: 30 }}
              stroke="#64748b"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
  stroke="#64748b" 
  style={{ fontSize: '12px' }}
  domain={['dataMin - 1', 'dataMax + 1']}
  tickFormatter={(v) => `${v}w`}
  label={{ 
    value: '92nd %ile wait (weeks)', 
    angle: -90, 
    position: 'insideLeft', 
    style: { fontSize: '11px', fill: '#475569' } 
  }}
/>
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
              formatter={(v: any) => [`${Number(v).toFixed(1)}w`]}
            />
            <Legend 
              onClick={(e: any) => onRegionClick(e.dataKey)}
              wrapperStyle={{ fontSize: '11px', cursor: 'pointer', paddingTop: '8px' }}
            />
            {Object.keys(REGION_COLORS).map(region => {
              const isFaded = selectedRegions.length < 7 && !selectedRegions.includes(region)
              return (
                <Line 
                  key={region}
                  type="monotone" 
                  dataKey={region} 
                  stroke={REGION_COLORS[region]} 
                  strokeWidth={isFaded ? 1 : 2.5}
                  strokeOpacity={isFaded ? 0.25 : 1}
                  dot={{ r: isFaded ? 2 : 4, fill: REGION_COLORS[region] }}
                  activeDot={{ r: 6 }}
                />
              )
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 text-xs text-slate-500 italic leading-relaxed">
        <strong className="text-slate-700 not-italic">Reading the chart:</strong> A 
        downward-sloping line indicates improving performance (shorter waits); upward 
        indicates deterioration.
      </div>
    </div>
  )
}