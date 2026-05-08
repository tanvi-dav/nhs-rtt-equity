import { supabase } from './supabase'

// Fetch all snapshot data for client-side filtering
// Fetch all snapshot data with pagination (Supabase caps at 1000/request)
export async function getAllSnapshotData() {
  const allData: any[] = []
  const pageSize = 1000
  let from = 0
  let hasMore = true
  
  while (hasMore) {
    const { data, error } = await supabase
      .from('waiting_list_snapshot')
      .select(`
        snapshot_month,
        trust_code,
        specialty_code,
        total_waiting,
        total_within_18_weeks,
        breach_52_weeks,
        breach_65_weeks,
        breach_78_weeks,
        median_wait_weeks,
        percentile_92_weeks
      `)
      .range(from, from + pageSize - 1)
    
    if (error) throw error
    if (!data || data.length === 0) {
      hasMore = false
    } else {
      allData.push(...data)
      from += pageSize
      // If we got less than a full page, we're done
      if (data.length < pageSize) hasMore = false
    }
  }
  
  return allData
}

// Fetch trust metadata
export async function getAllTrusts() {
  const { data, error } = await supabase
    .from('trust')
    .select('trust_code, trust_name, region')
    .not('region', 'is', null)
    .order('trust_name')
  
  if (error) throw error
  return data
}

// Fetch specialty metadata
export async function getAllSpecialties() {
  const { data, error } = await supabase
    .from('specialty')
    .select('specialty_code, specialty_name, specialty_grouping')
    .neq('specialty_code', '999')
  
  if (error) throw error
  return data
}

// Fetch deprivation data joined to trusts
export async function getTrustDeprivation() {
  const { data: locations, error: locError } = await supabase
    .from('trust_location')
    .select('trust_code, lsoa_code')
    .limit(50000)
  
  if (locError) throw locError
  
  const lsoaCodes = locations.map(l => l.lsoa_code)
  
  const { data: scores, error: scoreError } = await supabase
    .from('deprivation_score')
    .select('lsoa_code, imd_decile, imd_rank')
    .in('lsoa_code', lsoaCodes)
  
  if (scoreError) throw scoreError
  
  // Map trust_code → imd_decile
  const lsoaToScore = Object.fromEntries(scores.map(s => [s.lsoa_code, s]))
  
  return locations.map(l => ({
    trust_code: l.trust_code,
    lsoa_code: l.lsoa_code,
    imd_decile: lsoaToScore[l.lsoa_code]?.imd_decile,
    imd_rank: lsoaToScore[l.lsoa_code]?.imd_rank,
  })).filter(t => t.imd_decile != null)
}

// =====================================================
// ANALYTICAL QUERIES (for /queries page)
// These mirror the analytical SQL queries documented in the project.
// Each function returns a result set equivalent to running the SQL.
// =====================================================

// Q1: Deprivation gradient by region
export async function runQ1_DeprivationByRegion(
  snapshots: any[], 
  trusts: any[], 
  deprivation: any[],
  selectedMonth: string
) {
  const trustMap = Object.fromEntries(trusts.map(t => [t.trust_code, t]))
  const trustToDecile = Object.fromEntries(deprivation.map(d => [d.trust_code, d.imd_decile]))
  
  const groups: Record<string, any> = {}
  
  snapshots
    .filter(s => s.snapshot_month === selectedMonth && s.specialty_code === '999')
    .forEach(s => {
      const trust = trustMap[s.trust_code]
      const decile = trustToDecile[s.trust_code]
      if (!trust?.region || !decile) return
      const key = `${trust.region}|${decile}`
      if (!groups[key]) {
        groups[key] = {
          region: trust.region,
          imd_decile: decile,
          trustCount: new Set(),
          waits: [],
          totalWaiting: 0,
          totalWithin18: 0,
        }
      }
      groups[key].trustCount.add(s.trust_code)
      if (s.percentile_92_weeks) groups[key].waits.push(s.percentile_92_weeks)
      groups[key].totalWaiting += s.total_waiting || 0
      groups[key].totalWithin18 += s.total_within_18_weeks || 0
    })
  
  return Object.values(groups).map((g: any) => ({
    region: g.region,
    imd_decile: g.imd_decile,
    trust_count: g.trustCount.size,
    avg_92pct_wait: g.waits.length > 0 
      ? g.waits.reduce((a: number, b: number) => a + b, 0) / g.waits.length 
      : 0,
    pct_within_18_weeks: g.totalWaiting > 0 
      ? (g.totalWithin18 / g.totalWaiting) * 100 
      : 0,
    total_patients: g.totalWaiting,
  })).sort((a, b) => a.region.localeCompare(b.region) || a.imd_decile - b.imd_decile)
}

// Q2: Trust-level outliers within each region
export async function runQ2_TrustOutliers(
  snapshots: any[], 
  trusts: any[], 
  deprivation: any[],
  selectedMonth: string
) {
  const trustMap = Object.fromEntries(trusts.map(t => [t.trust_code, t]))
  const trustToDecile = Object.fromEntries(deprivation.map(d => [d.trust_code, d.imd_decile]))
  
  // Get total rows for the month
  const monthRows = snapshots.filter(s => 
    s.snapshot_month === selectedMonth && 
    s.specialty_code === '999' &&
    s.percentile_92_weeks != null
  )
  
  // Compute regional averages
  const regionalAvg: Record<string, number> = {}
  const regionalGroups: Record<string, number[]> = {}
  
  monthRows.forEach(s => {
    const region = trustMap[s.trust_code]?.region
    if (!region) return
    if (!regionalGroups[region]) regionalGroups[region] = []
    regionalGroups[region].push(s.percentile_92_weeks)
  })
  
  Object.entries(regionalGroups).forEach(([region, waits]) => {
    regionalAvg[region] = waits.reduce((a, b) => a + b, 0) / waits.length
  })
  
  // Build trust rows with deviation
  const rows = monthRows
    .filter(s => trustMap[s.trust_code]?.region)
    .map(s => {
      const trust = trustMap[s.trust_code]
      const region = trust.region
      const deviation = s.percentile_92_weeks - regionalAvg[region]
      
      // Compute regional percentile
      const sorted = [...regionalGroups[region]].sort((a, b) => a - b)
      const rank = sorted.findIndex(v => v >= s.percentile_92_weeks)
      const percentile = (rank / sorted.length) * 100
      
      return {
        trust_name: trust.trust_name,
        region,
        imd_decile: trustToDecile[s.trust_code] || null,
        wait_weeks: s.percentile_92_weeks,
        regional_avg: regionalAvg[region],
        deviation_from_region: deviation,
        regional_percentile_rank: percentile,
      }
    })
  
  // Sort by absolute deviation, take top 20
  return rows
    .sort((a, b) => Math.abs(b.deviation_from_region) - Math.abs(a.deviation_from_region))
    .slice(0, 20)
}

// Q3: Postcode lottery — gaps within region+specialty
export async function runQ3_PostcodeLottery(
  snapshots: any[], 
  trusts: any[], 
  specialties: any[],
  selectedMonth: string
) {
  const trustMap = Object.fromEntries(trusts.map(t => [t.trust_code, t]))
  const specMap = Object.fromEntries(specialties.map(s => [s.specialty_code, s]))
  
  const groups: Record<string, any> = {}
  
  snapshots
    .filter(s => 
      s.snapshot_month === selectedMonth && 
      s.specialty_code !== '999' &&
      s.percentile_92_weeks != null
    )
    .forEach(s => {
      const trust = trustMap[s.trust_code]
      const spec = specMap[s.specialty_code]
      if (!trust?.region || !spec) return
      const key = `${trust.region}|${spec.specialty_name}`
      if (!groups[key]) {
        groups[key] = {
          region: trust.region,
          specialty_name: spec.specialty_name,
          specialty_grouping: spec.specialty_grouping,
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
      const best = sorted[0]
      const worst = sorted[sorted.length - 1]
      const avg = g.waits.reduce((a: number, b: number) => a + b, 0) / g.waits.length
      return {
        region: g.region,
        specialty_name: g.specialty_name,
        specialty_grouping: g.specialty_grouping,
        trust_count: g.trustCount.size,
        best_wait: best,
        worst_wait: worst,
        gap_weeks: worst - best,
        gap_pct_of_avg: (worst - best) / avg * 100,
      }
    })
    .sort((a, b) => b.gap_weeks - a.gap_weeks)
    .slice(0, 20)
}

// Q4: Specialty by region cross-tabulation
export async function runQ4_SpecialtyByRegion(
  snapshots: any[], 
  trusts: any[], 
  specialties: any[],
  selectedMonth: string
) {
  const trustMap = Object.fromEntries(trusts.map(t => [t.trust_code, t]))
  const specMap = Object.fromEntries(specialties.map(s => [s.specialty_code, s]))
  
  const REGIONS = [
    'London', 'South East', 'East of England', 'Midlands',
    'North West', 'North East and Yorkshire', 'South West'
  ]
  
  const groups: Record<string, any> = {}
  
  snapshots
    .filter(s => 
      s.snapshot_month === selectedMonth && 
      s.specialty_code !== '999' &&
      s.percentile_92_weeks != null
    )
    .forEach(s => {
      const trust = trustMap[s.trust_code]
      const spec = specMap[s.specialty_code]
      if (!trust?.region || !spec) return
      
      if (!groups[spec.specialty_name]) {
        groups[spec.specialty_name] = {
          specialty_name: spec.specialty_name,
          specialty_grouping: spec.specialty_grouping,
          regions: {},
          allWaits: [],
        }
      }
      
      if (!groups[spec.specialty_name].regions[trust.region]) {
        groups[spec.specialty_name].regions[trust.region] = []
      }
      groups[spec.specialty_name].regions[trust.region].push(s.percentile_92_weeks)
      groups[spec.specialty_name].allWaits.push(s.percentile_92_weeks)
    })
  
  return Object.values(groups).map((g: any) => {
    const row: any = {
      specialty_name: g.specialty_name,
      specialty_grouping: g.specialty_grouping,
      national_avg: g.allWaits.reduce((a: number, b: number) => a + b, 0) / g.allWaits.length,
    }
    REGIONS.forEach(region => {
      const waits = g.regions[region] || []
      row[region] = waits.length > 0 
        ? waits.reduce((a: number, b: number) => a + b, 0) / waits.length 
        : null
    })
    return row
  }).sort((a, b) => b.national_avg - a.national_avg)
}

// Q5: High-impact recovery targets
export async function runQ5_RecoveryTargets(
  snapshots: any[], 
  trusts: any[], 
  specialties: any[],
  selectedMonth: string
) {
  const trustMap = Object.fromEntries(trusts.map(t => [t.trust_code, t]))
  const specMap = Object.fromEntries(specialties.map(s => [s.specialty_code, s]))
  
  return snapshots
    .filter(s => 
      s.snapshot_month === selectedMonth && 
      s.specialty_code !== '999' &&
      s.total_waiting > 1000
    )
    .map(s => {
      const trust = trustMap[s.trust_code]
      const spec = specMap[s.specialty_code]
      if (!trust || !spec) return null
      
      const breaching = (s.total_waiting || 0) - (s.total_within_18_weeks || 0)
      
      return {
        trust_name: trust.trust_name,
        region: trust.region,
        specialty_name: spec.specialty_name,
        total_waiting: s.total_waiting,
        breach_52_weeks: s.breach_52_weeks || 0,
        breach_78_weeks: s.breach_78_weeks || 0,
        pct_breaching_18wk: s.total_waiting > 0 
          ? 100 * breaching / s.total_waiting 
          : 0,
        thousand_patients_breaching: Math.round(breaching / 1000),
      }
    })
    .filter(r => r != null)
    .sort((a: any, b: any) => b.thousand_patients_breaching - a.thousand_patients_breaching)
    .slice(0, 15)
}

// Q6: Month-on-month change by region
export async function runQ6_MonthOnMonth(
  snapshots: any[], 
  trusts: any[]
) {
  const trustMap = Object.fromEntries(trusts.map(t => [t.trust_code, t]))
  
  const monthly: Record<string, Record<string, any>> = {}
  
  snapshots
    .filter(s => s.specialty_code === '999')
    .forEach(s => {
      const region = trustMap[s.trust_code]?.region
      if (!region) return
      if (!monthly[region]) monthly[region] = {}
      if (!monthly[region][s.snapshot_month]) {
        monthly[region][s.snapshot_month] = {
          waits: [],
          totalWaiting: 0,
          totalWithin18: 0,
        }
      }
      if (s.percentile_92_weeks) monthly[region][s.snapshot_month].waits.push(s.percentile_92_weeks)
      monthly[region][s.snapshot_month].totalWaiting += s.total_waiting || 0
      monthly[region][s.snapshot_month].totalWithin18 += s.total_within_18_weeks || 0
    })
  
  const rows: any[] = []
  Object.entries(monthly).forEach(([region, monthData]) => {
    const sortedMonths = Object.keys(monthData).sort()
    sortedMonths.forEach((month, i) => {
      const data = monthData[month]
      const avgWait = data.waits.length > 0 
        ? data.waits.reduce((a: number, b: number) => a + b, 0) / data.waits.length 
        : 0
      const prevMonth = i > 0 ? sortedMonths[i - 1] : null
      const prevData = prevMonth ? monthData[prevMonth] : null
      const prevAvg = prevData && prevData.waits.length > 0
        ? prevData.waits.reduce((a: number, b: number) => a + b, 0) / prevData.waits.length
        : null
      
      rows.push({
        region,
        snapshot_month: month,
        avg_92pct_wait: avgWait,
        prev_month_wait: prevAvg,
        mom_change: prevAvg !== null ? avgWait - prevAvg : null,
        pct_within_18wk: data.totalWaiting > 0 
          ? 100 * data.totalWithin18 / data.totalWaiting 
          : 0,
        total_waiting: data.totalWaiting,
      })
    })
  })
  
  return rows.sort((a, b) => 
    a.region.localeCompare(b.region) || a.snapshot_month.localeCompare(b.snapshot_month)
  )
}