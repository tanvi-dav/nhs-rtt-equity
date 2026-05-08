"use client"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function SpecialtyChart({ data }: { data: any[] }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-slate-900">Wait Times by Specialty</h2>
        <p className="text-sm text-slate-600">92nd percentile wait times in weeks</p>
      </div>
      <div className="h-[500px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={data} 
            layout="vertical" 
            margin={{ top: 5, right: 60, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis type="number" hide />
            <YAxis 
              dataKey="name" 
              type="category" 
              width={160} 
              style={{ fontSize: '12px', fontWeight: 500 }}
              tick={{ fill: '#374151' }}
            />
            <Tooltip 
              cursor={{fill: '#f9fafb'}}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
            />
            <Bar 
              dataKey="avgWait" 
              fill="#1e3a8a" 
              radius={[0, 4, 4, 0]} 
              barSize={20}
              label={{ 
                position: 'right', 
                formatter: (val: any) => val !== undefined ? `${val}w` : '', 
                fontSize: 12, 
                fill: '#1e3a8a', 
                fontWeight: 'bold' 
              }} 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}