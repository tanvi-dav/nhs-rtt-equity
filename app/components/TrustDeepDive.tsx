"use client"

import { useState, useMemo, useEffect } from 'react'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts'

type Props = {
    snapshots: any[]
    trusts: any[]
    specialties: any[]
    deprivation: any[]
    selectedMonth: string
    initialTrust?: string | null
  }
  
  export default function TrustDeepDive({ snapshots, trusts, specialties, deprivation, selectedMonth, initialTrust }: Props) {
    const [selectedTrust, setSelectedTrust] = useState<string | null>(initialTrust || null)
  const [searchTerm, setSearchTerm] = useState('')
  
  useEffect(() => {
    if (initialTrust) setSelectedTrust(initialTrust)
  }, [initialTrust])
  
  const trustMap = useMemo(() => 
    Object.fromEntries(trusts.map(t => [t.trust_code, t]))
  , [trusts])
  
  const specialtyMap = useMemo(() => 
    Object.fromEntries(specialties.map(s => [s.specialty_code, s]))
  , [specialties])
  
  const trustToDecile = useMemo(() => 
    Object.fromEntries(deprivation.map(d => [d.trust_code, d.imd_decile]))
  , [deprivation])
  
  // Filter trusts by search
  const filteredTrusts = useMemo(() => {
    const term = searchTerm.toLowerCase().trim()
    if (!term) return trusts // show all if no search
    return trusts.filter(t => 
      t.trust_name.toLowerCase().includes(term) || 
      t.trust_code.toLowerCase().includes(term)
    )
  }, [trusts, searchTerm])
  
  // Compute deep-dive data when a trust is selected
  const deepDiveData = useMemo(() => {
    if (!selectedTrust) return null
    
    const trust = trustMap[selectedTrust]
    if (!trust) return null
    
    // Trust's snapshots for selected month
    const monthSnapshots = snapshots.filter(s => 
      s.trust_code === selectedTrust && 
      s.snapshot_month === selectedMonth
    )
    
    // The '999' total row for this trust this month
    const totalRow = monthSnapshots.find(s => s.specialty_code === '999')
    
    // Specialty-level rows (excluding total)
    const specialtyRows = monthSnapshots
      .filter(s => s.specialty_code !== '999')
      .map(s => ({
        name: specialtyMap[s.specialty_code]?.specialty_name || s.specialty_code,
        wait: s.percentile_92_weeks || 0,
        median: s.median_wait_weeks || 0,
        waiting: s.total_waiting || 0,
      }))
      .filter(s => s.wait > 0)
      .sort((a, b) => b.wait - a.wait)
    
    // 3-month trajectory (all months for this trust, '999' rows only)
    const trajectory = snapshots
      .filter(s => s.trust_code === selectedTrust && s.specialty_code === '999')
      .map(s => ({
        month: s.snapshot_month,
        waiting: s.total_waiting || 0,
        wait_92: s.percentile_92_weeks || 0,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
    
    // Regional peer comparison
    const region = trust.region
    const peerSnapshots = snapshots.filter(s => 
      s.snapshot_month === selectedMonth && 
      s.specialty_code === '999' &&
      trustMap[s.trust_code]?.region === region &&
      s.trust_code !== selectedTrust
    )
    
    const peerStats = peerSnapshots.length > 0 ? {
      avgWait: peerSnapshots.reduce((sum, s) => sum + (s.percentile_92_weeks || 0), 0) / peerSnapshots.length,
      avgPctWithin18: peerSnapshots.reduce((sum, s) => 
        sum + ((s.total_within_18_weeks || 0) / Math.max(s.total_waiting || 1, 1) * 100), 0
      ) / peerSnapshots.length,
      n: peerSnapshots.length,
    } : null
    
    const trustPctWithin18 = totalRow && totalRow.total_waiting 
      ? (totalRow.total_within_18_weeks / totalRow.total_waiting) * 100 
      : 0
    
    return {
      trust,
      totalRow,
      specialtyRows,
      trajectory,
      peerStats,
      trustPctWithin18,
      decile: trustToDecile[selectedTrust],
    }
  }, [selectedTrust, snapshots, trustMap, specialtyMap, selectedMonth, trustToDecile])
  
  const formatMonth = (month: string) => {
    const date = new Date(month)
    return date.toLocaleString('en-GB', { month: 'short', year: '2-digit' })
  }
  
  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
        <h2 className="text-xl font-semibold text-slate-900">Trust Deep-Dive</h2>
        <p className="text-sm text-slate-600 mt-1">
          Search and select any of {trusts.length} trusts for detailed analysis
        </p>
      </div>
      
      <div className="p-6">
        {/* Search and trust list */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Search trusts
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Type to search by name or code..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            
            <div className="mt-3 max-h-[420px] overflow-y-auto border border-slate-200 rounded-lg">
              {filteredTrusts.length === 0 ? (
                <p className="p-4 text-sm text-slate-500 text-center">No trusts found</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {filteredTrusts.map(t => (
                    <li 
                      key={t.trust_code}
                      onClick={() => setSelectedTrust(t.trust_code)}
                      className={`px-3 py-2 cursor-pointer hover:bg-blue-50 transition-colors ${
                        selectedTrust === t.trust_code ? 'bg-blue-100 border-l-4 border-blue-600' : ''
                      }`}
                    >
                      <div className="text-sm font-semibold text-slate-900 line-clamp-1">
                        {t.trust_name}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        {t.trust_code} · {t.region}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          
          {/* Deep dive view */}
          <div className="lg:col-span-2">
            {!deepDiveData ? (
              <div className="h-[480px] flex items-center justify-center bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                <div className="text-center">
                  <p className="text-slate-500 font-medium">Select a trust to view detailed analysis</p>
                  <p className="text-xs text-slate-400 mt-2">
                    Search by trust name or NHS code (e.g., &quot;Manchester&quot; or &quot;R0A&quot;)
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Trust header */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {deepDiveData.trust.trust_name}
                  </h3>
                  <div className="text-xs text-slate-500 mt-1 font-mono">
                    {deepDiveData.trust.trust_code} · {deepDiveData.trust.region}
                    {deepDiveData.decile && ` · IMD decile ${deepDiveData.decile}`}
                  </div>
                </div>
                
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3">
                  <StatBox 
                    label="Total Waiting" 
                    value={deepDiveData.totalRow?.total_waiting?.toLocaleString() || '—'}
                  />
                  <StatBox 
                    label="Within 18wk" 
                    value={`${deepDiveData.trustPctWithin18.toFixed(1)}%`}
                    comparison={deepDiveData.peerStats 
                      ? `Region avg: ${deepDiveData.peerStats.avgPctWithin18.toFixed(1)}%`
                      : undefined
                    }
                  />
                  <StatBox 
                    label="92nd %ile" 
                    value={`${(deepDiveData.totalRow?.percentile_92_weeks || 0).toFixed(1)}w`}
                    comparison={deepDiveData.peerStats 
                      ? `Region avg: ${deepDiveData.peerStats.avgWait.toFixed(1)}w`
                      : undefined
                    }
                  />
                </div>
                
                {/* Trajectory chart */}
                {deepDiveData.trajectory.length > 1 && (
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">
                      3-Month Trajectory: Total Waiting List
                    </h4>
                    <div className="h-[160px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={deepDiveData.trajectory.map(t => ({
                          ...t,
                          monthLabel: formatMonth(t.month)
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="monthLabel" style={{ fontSize: '11px' }} />
                          <YAxis style={{ fontSize: '11px' }} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                            formatter={(v: any) => [v.toLocaleString(), 'Patients']}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="waiting" 
                            stroke="#1e3a8a" 
                            strokeWidth={2.5}
                            dot={{ r: 4, fill: '#1e3a8a' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
                
                {/* Specialty breakdown */}
                {deepDiveData.specialtyRows.length > 0 && (
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">
                      Worst-Performing Specialties at This Trust
                    </h4>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={deepDiveData.specialtyRows.slice(0, 8)} 
                          layout="vertical"
                          margin={{ top: 5, right: 40, left: 10, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                          <XAxis type="number" hide />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            width={140} 
                            style={{ fontSize: '11px' }}
                          />
                          <Tooltip 
                            contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                            formatter={(v: any) => [`${v}w`, '92nd %ile']}
                          />
                          <Bar 
                            dataKey="wait" 
                            fill="#1e3a8a" 
                            radius={[0, 4, 4, 0]} 
                            barSize={14}
                            label={{ 
                              position: 'right', 
                              formatter: (v: any) => `${v}w`,
                              fontSize: 10,
                              fill: '#1e3a8a'
                            }} 
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function StatBox({ label, value, comparison }: { label: string; value: string; comparison?: string }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
      <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
        {label}
      </div>
      <div className="mt-1 text-xl font-bold text-slate-900">
        {value}
      </div>
      {comparison && (
        <div className="text-xs text-slate-500 mt-1">
          {comparison}
        </div>
      )}
    </div>
  )
}