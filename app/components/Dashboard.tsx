"use client"

import { useState, useMemo } from 'react'
import KPICard from './KPIcard'
import SpecialtyChart from './SpecialityChart'
import DeprivationByRegion from './DeprivationByRegion'
import SlopeGraph from './SlopeGraph'
import TrustDeepDive from './TrustDeepDive'
import RegionalTrajectory from './RegionalTrajectory'
import TrustOutliers from './TrustOutliers'
import PostcodeLottery from './PostcodeLottery'
import InvestmentPriorities from './InvestmentProperties'

type DashboardProps = {
  snapshots: any[]
  trusts: any[]
  specialties: any[]
  deprivation: any[]
}

const REGIONS = [
  'East of England',
  'London',
  'Midlands',
  'North East and Yorkshire',
  'North West',
  'South East',
  'South West',
]

export default function Dashboard({ snapshots, trusts, specialties, deprivation }: DashboardProps) {
  const availableMonths = useMemo(() => 
    [...new Set(snapshots.map(s => s.snapshot_month))].sort()
  , [snapshots])
  
  const [selectedMonth, setSelectedMonth] = useState(availableMonths[availableMonths.length - 1])
  const [selectedRegions, setSelectedRegions] = useState<string[]>(REGIONS)
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null)
  const [selectedTrustForDeepDive, setSelectedTrustForDeepDive] = useState<string | null>(null)
  
  const [sortBy, setSortBy] = useState<string>('avg_median_wait')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  
  const trustMap = useMemo(() => 
    Object.fromEntries(trusts.map(t => [t.trust_code, t]))
  , [trusts])
  
  const specialtyMap = useMemo(() => 
    Object.fromEntries(specialties.map(s => [s.specialty_code, s]))
  , [specialties])
  
  const trustToDecile = useMemo(() => 
    Object.fromEntries(deprivation.map(d => [d.trust_code, d.imd_decile]))
  , [deprivation])
  
  // FILTERED data based on month + region + specialty
  const filteredSnapshots = useMemo(() => {
    return snapshots.filter(s => {
      if (s.snapshot_month !== selectedMonth) return false
      const trust = trustMap[s.trust_code]
      if (!trust) return false
      if (!selectedRegions.includes(trust.region)) return false
      if (selectedSpecialty && s.specialty_code !== selectedSpecialty) return false
      return true
    })
  }, [snapshots, selectedMonth, selectedRegions, selectedSpecialty, trustMap])
  
  // KPIs
  const kpiStats = useMemo(() => {
    const filterCode = selectedSpecialty || '999'
    const totals = filteredSnapshots
      .filter(s => s.specialty_code === filterCode)
      .reduce((acc, row) => ({
        total_waiting: acc.total_waiting + (row.total_waiting || 0),
        total_within_18_weeks: acc.total_within_18_weeks + (row.total_within_18_weeks || 0),
        breach_52_weeks: acc.breach_52_weeks + (row.breach_52_weeks || 0),
        breach_65_weeks: acc.breach_65_weeks + (row.breach_65_weeks || 0),
        breach_78_weeks: acc.breach_78_weeks + (row.breach_78_weeks || 0),
      }), {
        total_waiting: 0, total_within_18_weeks: 0, breach_52_weeks: 0, breach_65_weeks: 0, breach_78_weeks: 0,
      })
    return {
      ...totals,
      pct_within_18_weeks: totals.total_waiting > 0 
        ? (totals.total_within_18_weeks / totals.total_waiting) * 100 
        : 0,
    }
  }, [filteredSnapshots, selectedSpecialty])
  
  // Specialty data (always shows all specialties; ignores specialty filter so the chart still functions as a selector)
  const specialtyData = useMemo(() => {
    const grouped: Record<string, { name: string; code: string; total: number; count: number }> = {}
    
    snapshots
      .filter(s => 
        s.snapshot_month === selectedMonth && 
        s.specialty_code !== '999' &&
        selectedRegions.includes(trustMap[s.trust_code]?.region)
      )
      .forEach(s => {
        const spec = specialtyMap[s.specialty_code]
        if (!spec) return
        const name = spec.specialty_name
        if (!grouped[name]) grouped[name] = { name, code: s.specialty_code, total: 0, count: 0 }
        if (s.percentile_92_weeks) {
          grouped[name].total += s.percentile_92_weeks
          grouped[name].count += 1
        }
      })
    
    return Object.values(grouped)
      .filter(s => s.count > 0)
      .map(s => ({ name: s.name, code: s.code, avgWait: Math.round((s.total / s.count) * 10) / 10 }))
      .sort((a, b) => b.avgWait - a.avgWait)
  }, [snapshots, selectedMonth, selectedRegions, trustMap, specialtyMap])
  
  // Q1: Deprivation by region — every trust × decile pair, with region tag
  const q1Data = useMemo(() => {
    return snapshots
      .filter(s => 
        s.snapshot_month === selectedMonth && 
        s.specialty_code === (selectedSpecialty || '999')
      )
      .map(s => {
        const trust = trustMap[s.trust_code]
        const decile = trustToDecile[s.trust_code]
        if (!trust?.region || !decile || s.percentile_92_weeks == null) return null
        return {
          region: trust.region,
          decile,
          wait: s.percentile_92_weeks,
          trust_code: s.trust_code,
        }
      })
      .filter(Boolean) as any[]
  }, [snapshots, selectedMonth, selectedSpecialty, trustMap, trustToDecile])
  
  // Regional table data
  const regionalData = useMemo(() => {
    const monthSnapshots = snapshots.filter(s => 
      s.snapshot_month === selectedMonth && 
      s.specialty_code === (selectedSpecialty || '999')
    )
    
    const byRegion: Record<string, any> = {}
    monthSnapshots.forEach(s => {
      const trust = trustMap[s.trust_code]
      if (!trust?.region) return
      const region = trust.region
      if (!byRegion[region]) {
        byRegion[region] = { region, total_waiting: 0, total_within_18_weeks: 0, medians: [], p92s: [], trustCount: new Set() }
      }
      byRegion[region].total_waiting += s.total_waiting || 0
      byRegion[region].total_within_18_weeks += s.total_within_18_weeks || 0
      if (s.median_wait_weeks) byRegion[region].medians.push(s.median_wait_weeks)
      if (s.percentile_92_weeks) byRegion[region].p92s.push(s.percentile_92_weeks)
      byRegion[region].trustCount.add(s.trust_code)
    })
    
    const rows = Object.values(byRegion).map((r: any) => ({
      region: r.region,
      trust_count: r.trustCount.size,
      total_waiting: r.total_waiting,
      pct_within_18_weeks: r.total_waiting > 0 ? (r.total_within_18_weeks / r.total_waiting) * 100 : 0,
      avg_median_wait: r.medians.length > 0 ? r.medians.reduce((a: number, b: number) => a + b, 0) / r.medians.length : 0,
      avg_92pct_wait: r.p92s.length > 0 ? r.p92s.reduce((a: number, b: number) => a + b, 0) / r.p92s.length : 0,
    }))
    
    return [...rows].sort((a: any, b: any) => {
      const aVal = a[sortBy], bVal = b[sortBy]
      if (typeof aVal === 'string') return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal
    })
  }, [snapshots, selectedMonth, selectedSpecialty, trustMap, sortBy, sortDir])
  
  // Trend
  const trendData = useMemo(() => {
    const grouped: Record<string, { month: string; total: number; count: number }> = {}
    snapshots
      .filter(s => s.specialty_code === (selectedSpecialty || '999'))
      .forEach(s => {
        if (!grouped[s.snapshot_month]) grouped[s.snapshot_month] = { month: s.snapshot_month, total: 0, count: 0 }
        if (s.percentile_92_weeks) {
          grouped[s.snapshot_month].total += s.percentile_92_weeks
          grouped[s.snapshot_month].count += 1
        }
      })
    return Object.values(grouped)
      .map(m => ({ month: m.month, wait: Math.round((m.total / m.count) * 10) / 10 }))
      .sort((a, b) => a.month.localeCompare(b.month))
  }, [snapshots, selectedSpecialty])

  // Q6: Regional trajectory pivot
const trajectoryData = useMemo(() => {
    const byMonth: Record<string, any> = {}
    
    snapshots
      .filter(s => s.specialty_code === (selectedSpecialty || '999'))
      .forEach(s => {
        const region = trustMap[s.trust_code]?.region
        if (!region) return
        const m = s.snapshot_month
        if (!byMonth[m]) byMonth[m] = { month: m, _waits: {} }
        if (!byMonth[m]._waits[region]) byMonth[m]._waits[region] = []
        if (s.percentile_92_weeks) byMonth[m]._waits[region].push(s.percentile_92_weeks)
      })
    
    return Object.values(byMonth)
      .map((entry: any) => {
        const result: any = { month: entry.month }
        Object.entries(entry._waits).forEach(([region, waits]: any) => {
          result[region] = waits.length > 0 
            ? waits.reduce((a: number, b: number) => a + b, 0) / waits.length 
            : null
        })
        return result
      })
      .sort((a, b) => a.month.localeCompare(b.month))
  }, [snapshots, selectedSpecialty, trustMap])
  
  // Q3: Trust outliers data
  const outliersData = useMemo(() => {
    const monthRows = snapshots.filter(s => 
      s.snapshot_month === selectedMonth && 
      s.specialty_code === (selectedSpecialty || '999') &&
      s.percentile_92_weeks != null
    )
    
    // Compute regional averages
    const regionalGroups: Record<string, number[]> = {}
    monthRows.forEach(s => {
      const region = trustMap[s.trust_code]?.region
      if (!region || !selectedRegions.includes(region)) return
      if (!regionalGroups[region]) regionalGroups[region] = []
      regionalGroups[region].push(s.percentile_92_weeks)
    })
    
    const regionalAvg: Record<string, number> = {}
    Object.entries(regionalGroups).forEach(([region, waits]) => {
      regionalAvg[region] = waits.reduce((a, b) => a + b, 0) / waits.length
    })
    
    return monthRows
      .map(s => {
        const trust = trustMap[s.trust_code]
        if (!trust?.region || !selectedRegions.includes(trust.region)) return null
        const regional = regionalAvg[trust.region]
        if (regional == null) return null
        return {
          trust_code: s.trust_code,
          trust_name: trust.trust_name,
          region: trust.region,
          wait: s.percentile_92_weeks,
          regional_avg: regional,
          deviation: s.percentile_92_weeks - regional,
        }
      })
      .filter(d => d != null)
  }, [snapshots, selectedMonth, selectedSpecialty, selectedRegions, trustMap])

  // Q4: Postcode lottery — gaps within region+specialty
const postcodeLotteryData = useMemo(() => {
    const groups: Record<string, any> = {}
    
    snapshots
      .filter(s => 
        s.snapshot_month === selectedMonth && 
        s.specialty_code !== '999' &&
        s.percentile_92_weeks != null &&
        selectedRegions.includes(trustMap[s.trust_code]?.region)
      )
      .forEach(s => {
        const trust = trustMap[s.trust_code]
        const spec = specialtyMap[s.specialty_code]
        if (!trust?.region || !spec) return
        const key = `${trust.region}|${spec.specialty_name}`
        if (!groups[key]) {
          groups[key] = {
            region: trust.region,
            specialty_name: spec.specialty_name,
            waits: [],
            trustCount: new Set(),
          }
        }
        groups[key].waits.push(s.percentile_92_weeks)
        groups[key].trustCount.add(s.trust_code)
      })
    
    return Object.values(groups)
      .filter((g: any) => g.trustCount.size >= 3)
      .map((g: any) => {
        const sorted = [...g.waits].sort((a, b) => a - b)
        return {
          region: g.region,
          specialty_name: g.specialty_name,
          trust_count: g.trustCount.size,
          best_wait: sorted[0],
          worst_wait: sorted[sorted.length - 1],
          gap_weeks: sorted[sorted.length - 1] - sorted[0],
        }
      })
  }, [snapshots, selectedMonth, selectedRegions, trustMap, specialtyMap])
  
  // Q5: Investment priorities
  const investmentData = useMemo(() => {
    return snapshots
      .filter(s => 
        s.snapshot_month === selectedMonth && 
        s.specialty_code !== '999' &&
        s.total_waiting > 1000 &&
        selectedRegions.includes(trustMap[s.trust_code]?.region) &&
        (!selectedSpecialty || s.specialty_code === selectedSpecialty)
      )
      .map(s => {
        const trust = trustMap[s.trust_code]
        const spec = specialtyMap[s.specialty_code]
        if (!trust || !spec) return null
        const breaching = (s.total_waiting || 0) - (s.total_within_18_weeks || 0)
        return {
          trust_code: s.trust_code,
          trust_name: trust.trust_name,
          region: trust.region,
          specialty_name: spec.specialty_name,
          total_waiting: s.total_waiting,
          total_within_18_weeks: s.total_within_18_weeks || 0,
          pct_breaching_18wk: s.total_waiting > 0 ? 100 * breaching / s.total_waiting : 0,
          breaching,
        }
      })
      .filter(d => d != null)
      .sort((a: any, b: any) => b.breaching - a.breaching)
      .slice(0, 30)
  }, [snapshots, selectedMonth, selectedRegions, selectedSpecialty, trustMap, specialtyMap])
  
  const formatMonth = (m: string) => new Date(m).toLocaleString('en-GB', { month: 'long', year: 'numeric' })
  
  // Region click from Q1 — single-region focus mode
  const handleQ1RegionClick = (region: string) => {
    if (selectedRegions.length === 1 && selectedRegions[0] === region) {
      setSelectedRegions(REGIONS)
    } else {
      setSelectedRegions([region])
    }
  }

  const handleTrustClick = (trustCode: string) => {
    setSelectedTrustForDeepDive(trustCode)
    // Scroll to deep-dive section
    setTimeout(() => {
      const el = document.getElementById('trust-deep-dive')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }
  
  // Specialty click
  const handleSpecialtyClick = (code: string) => {
    setSelectedSpecialty(prev => prev === code ? null : code)
  }
  
  const handleSort = (column: string) => {
    if (sortBy === column) setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    else { setSortBy(column); setSortDir('desc') }
  }
  
  const toggleRegion = (region: string) => {
    setSelectedRegions(prev => prev.includes(region) ? prev.filter(r => r !== region) : [...prev, region])
  }
  
  const allRegionsSelected = selectedRegions.length === REGIONS.length
  const hasActiveFilter = !allRegionsSelected || selectedSpecialty !== null
  const selectedSpecialtyName = selectedSpecialty 
    ? specialtyMap[selectedSpecialty]?.specialty_name 
    : null
  
  return (
    <div className="space-y-8 pb-20">
      <header>
  <h1 className="text-5xl font-white text-slate-900 tracking-tight">
    NHS Referrel To Treatment Waiting Times
  </h1>
  <p className="mt-4 text-xl text-slate-600 font-medium max-w-3xl">
    Cross-sectional analysis of England's NHS elective waiting list, examining 
    variation by specialty, region, and area-level deprivation across {trusts.length} acute trusts.
  </p>
  <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-slate-500">
    <div className="flex items-center gap-2">
      <span className="w-2 h-2 bg-emerald-500 rounded-full" />
      <span>Data current to February 2026</span>
    </div>
    <a href="/methodology" className="text-blue-700 hover:underline font-medium">
      View methodology →
    </a>
  </div>
</header>
      
      {/* Filter bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-4 flex-wrap">
          <label className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Month:</label>
          <div className="flex gap-2">
            {availableMonths.map(month => (
              <button key={month} onClick={() => setSelectedMonth(month)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedMonth === month ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}>
                {formatMonth(month)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-start gap-4 flex-wrap">
          <label className="text-sm font-semibold text-slate-700 uppercase tracking-wide pt-2">Regions:</label>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setSelectedRegions(allRegionsSelected ? [] : REGIONS)}
              className="px-3 py-2 rounded-lg text-xs font-semibold text-blue-900 bg-blue-50 border border-blue-200 hover:bg-blue-100">
              {allRegionsSelected ? 'Clear all' : 'Select all'}
            </button>
            {REGIONS.map(region => (
              <button key={region} onClick={() => toggleRegion(region)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  selectedRegions.includes(region) ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}>
                {region}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Active filter pills */}
      {hasActiveFilter && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">Active filters:</span>
          {!allRegionsSelected && selectedRegions.length > 0 && (
            <span className="px-3 py-1 bg-white border border-amber-300 rounded-full text-xs font-medium text-amber-900">
              {selectedRegions.length === 1 ? `Region: ${selectedRegions[0]}` : `${selectedRegions.length} regions`}
            </span>
          )}
          {selectedSpecialtyName && (
            <span className="px-3 py-1 bg-white border border-amber-300 rounded-full text-xs font-medium text-amber-900">
              Specialty: {selectedSpecialtyName}
            </span>
          )}
          <button onClick={() => { setSelectedRegions(REGIONS); setSelectedSpecialty(null) }}
            className="ml-auto text-xs font-semibold text-amber-900 hover:text-amber-700 underline">
            Clear all filters
          </button>
        </div>
      )}
      
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPICard label="Patients Waiting" 
          value={kpiStats.total_waiting > 1_000_000 
            ? (kpiStats.total_waiting / 1_000_000).toFixed(2) + 'M' 
            : (kpiStats.total_waiting / 1_000).toFixed(0) + 'K'} 
          subtitle={selectedSpecialtyName || formatMonth(selectedMonth)} accent />
        <KPICard label="Within 18 Weeks" value={kpiStats.pct_within_18_weeks.toFixed(1) + '%'} subtitle="target: 92%" />
        <KPICard label="52-Week Breach" value={kpiStats.breach_52_weeks.toLocaleString()} subtitle="patients" />
        <KPICard label="78-Week Breach" value={kpiStats.breach_78_weeks.toLocaleString()} subtitle="patients" />
      </div>
      
      {/* Q2: Specialty (existing chart, click-to-filter wired in next chunk) */}
      <SpecialtyChart data={specialtyData} />
      
      {/* Q1: Deprivation by region — small multiples */}
      <DeprivationByRegion 
        data={q1Data} 
        selectedRegions={selectedRegions}
        onRegionClick={handleQ1RegionClick}
      />

    <TrustOutliers 
        data={outliersData}
        onTrustClick={handleTrustClick}
    />

    <PostcodeLottery 
        data={postcodeLotteryData}
    />

    <InvestmentPriorities 
        data={investmentData}
        onTrustClick={handleTrustClick}
    />
      
      {/* Slope graph (will be replaced by Q6 in a later chunk) */}
      <RegionalTrajectory 
  data={trajectoryData}
  selectedRegions={selectedRegions}
  onRegionClick={(region) => {
    if (selectedRegions.length === 1 && selectedRegions[0] === region) {
      setSelectedRegions(REGIONS)
    } else {
      setSelectedRegions([region])
    }
  }}
/>
      
      {/* Regional Table */}
      <section className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Regional Performance</h2>
          <p className="text-sm text-slate-600 mt-1">{formatMonth(selectedMonth)} — click headers to sort</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-700 text-xs uppercase tracking-wider border-b border-slate-200">
              <tr>
                <SortableHeader label="Region" column="region" current={sortBy} direction={sortDir} onClick={handleSort} />
                <SortableHeader label="Trusts" column="trust_count" current={sortBy} direction={sortDir} onClick={handleSort} align="right" />
                <SortableHeader label="Median Wait" column="avg_median_wait" current={sortBy} direction={sortDir} onClick={handleSort} align="right" />
                <SortableHeader label="92nd %ile" column="avg_92pct_wait" current={sortBy} direction={sortDir} onClick={handleSort} align="right" />
                <SortableHeader label="Within 18wk" column="pct_within_18_weeks" current={sortBy} direction={sortDir} onClick={handleSort} align="right" />
                <SortableHeader label="Volume" column="total_waiting" current={sortBy} direction={sortDir} onClick={handleSort} align="right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {regionalData.map((r: any) => (
                <tr key={r.region} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-semibold text-slate-900">{r.region}</td>
                  <td className="px-6 py-4 text-right">{r.trust_count}</td>
                  <td className="px-6 py-4 text-right">{r.avg_median_wait.toFixed(1)}w</td>
                  <td className="px-6 py-4 text-right font-semibold">{r.avg_92pct_wait.toFixed(1)}w</td>
                  <td className="px-6 py-4 text-right">{r.pct_within_18_weeks.toFixed(1)}%</td>
                  <td className="px-6 py-4 text-right">{r.total_waiting.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      
      <div id="trust-deep-dive">
  <TrustDeepDive 
    snapshots={snapshots} trusts={trusts} specialties={specialties} 
    deprivation={deprivation} selectedMonth={selectedMonth}
    initialTrust={selectedTrustForDeepDive}
  />
</div>
      
<footer className="mt-16 pt-8 border-t border-slate-200 text-sm text-slate-500 space-y-3">
  <p>
    <strong className="text-slate-700">Data sources:</strong>{' '}
    NHS England Referral to Treatment statistics; English Indices of Deprivation 2025; 
    NHS Digital Organisation Data Service. All sources are published under the Open Government Licence v3.0.
  </p>
  <p>
    For full data sources, schema documentation, methodological caveats, and references, 
    see the{' '}
    <a href="/methodology" className="text-blue-700 hover:underline font-medium">
      methodology page
    </a>.
  </p>
  <p className="text-xs text-slate-400">
    QMUL IOT552U Business Organisation and Decision Making · 2026
  </p>
</footer>
    </div>
  )
}

function SortableHeader({ label, column, current, direction, onClick, align = 'left' }: any) {
  const isActive = current === column
  return (
    <th className={`px-6 py-3 cursor-pointer hover:bg-slate-100 transition-colors text-${align}`} onClick={() => onClick(column)}>
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive && <span className="text-blue-600">{direction === 'asc' ? '↑' : '↓'}</span>}
      </span>
    </th>
  )
}