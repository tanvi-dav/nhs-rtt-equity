"use client"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts'

export default function SlopeGraph({ data }: { data: any[] }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-slate-900">3-Month Wait Trajectory</h2>
        <p className="text-sm text-slate-600">National 92nd percentile trend</p>
      </div>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 30, right: 50, left: 20, bottom: 20 }}>
            <XAxis dataKey="month" padding={{ left: 30, right: 30 }} />
            <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="wait" 
              stroke="#1e3a8a" 
              strokeWidth={4} 
              dot={{ r: 6, fill: '#1e3a8a' }}
            >
              <LabelList 
                dataKey="wait" 
                position="top" 
                offset={10} 
                style={{ fontWeight: 'bold' }} 
                formatter={(v: any) => `${v}w`} 
              />
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}