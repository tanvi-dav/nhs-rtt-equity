export default function MethodologyPage() {
    return (
      <div className="space-y-12 pb-20 max-w-4xl">
        <header>
          <h1 className="text-5xl font-black text-white-900 tracking-tight">
            Methodology
          </h1>
          <p className="mt-4 text-lg text-slate-600 font-medium">
            Data sources for the NHS RTT Equity Analysis dashboard.
          </p>
        </header>
        
        {/* Section: Data Sources */}
        <section>
          <h2 className="text-2xl font-bold text-white-900 mb-4">Data sources</h2>
          <div className="space-y-4">
            <SourceCard
              title="NHS England Referral to Treatment Statistics"
              description="Monthly provider-level performance data for consultant-led elective care, including total waiting list, percentage within 18 weeks, and breach counts by trust and specialty."
              access="December 2025, January 2026, and February 2026 monthly releases."
              url="https://www.england.nhs.uk/statistics/statistical-work-areas/rtt-waiting-times/"
              license="Open Government Licence v3.0"
            />
            <SourceCard
              title="English Indices of Deprivation 2025"
              description="Lower-layer Super Output Area (LSOA) deprivation rankings and deciles based on seven domains including income, employment, health, education, crime, housing barriers, and living environment."
              access="File 1 (IMD rank and decile), published November 2025 by Ministry of Housing, Communities and Local Government."
              url="https://www.gov.uk/government/statistics/english-indices-of-deprivation-2025"
              license="Open Government Licence v3.0"
            />
            <SourceCard
              title="NHS Digital Organisation Data Service"
              description="Authoritative register of NHS trust codes, names, and postcodes. Used to identify active acute trusts and derive regional mapping."
              access="etr.csv current as of April 2026."
              url="https://www.odsdatasearchandexport.nhs.uk/"
              license="Open Government Licence v3.0"
            />
          </div>
        </section>
        
      </div>
    )
  }
  
  function SourceCard({ title, description, access, url, license }: any) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <span className="flex-shrink-0 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 bg-emerald-50 text-emerald-700 rounded">
            {license}
          </span>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed mb-3">{description}</p>
        <div className="text-xs text-slate-500 space-y-1">
          <div><strong className="text-slate-700">Access:</strong> {access}</div>
          <div>
            <strong className="text-slate-700">URL:</strong>{' '}
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline break-all">
              {url}
            </a>
          </div>
        </div>
      </div>
    )
  }
  
  function Caveat({ heading, text }: any) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <h3 className="text-sm font-bold text-amber-900 mb-2">{heading}</h3>
        <p className="text-sm text-amber-900 leading-relaxed">{text}</p>
      </div>
    )
  }