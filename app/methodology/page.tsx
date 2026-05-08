export default function MethodologyPage() {
    return (
      <div className="space-y-12 pb-20 max-w-4xl">
        <header>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight">
            Methodology
          </h1>
          <p className="mt-4 text-lg text-slate-600 font-medium">
            Data sources, analytical approach, and methodological caveats for the 
            NHS RTT Equity Analysis dashboard.
          </p>
        </header>
        
        {/* Section: Data Sources */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Data sources</h2>
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
        
        {/* Section: Schema and storage */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Database and schema</h2>
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3 text-sm leading-relaxed text-slate-700">
            <p>
              The data solution is built on a relational schema of <strong>eight entities</strong>, hosted on 
              Supabase (managed PostgreSQL, West EU London region). The schema follows dimensional modelling 
              principles (Kimball, 1996) with <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">WaitingListSnapshot</code> as 
              the central fact table.
            </p>
            <p>
              The schema satisfies <strong>Third Normal Form</strong> (Codd, 1971) and additionally 
              <strong> Fourth Normal Form</strong> (Fagin, 1977) through deliberate decomposition of 
              independent multi-valued relationships into separate bridge tables.
            </p>
            <p>
              Notable design choices include: a self-referential adjacency-list pattern (Celko, 2012) on 
              the Geography entity supporting arbitrary-depth hierarchical roll-ups via 
              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">WITH RECURSIVE</code> queries; 
              a slowly-changing-dimension pattern (Kimball &amp; Ross, 2013) on NationalStandard for tracking 
              policy parameter revisions; and a TrustLocation bridge entity supporting weighted catchment 
              modelling when patient-flow data becomes available.
            </p>
          </div>
        </section>
        
        {/* Section: Visualisation approach */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Visualisation approach</h2>
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3 text-sm leading-relaxed text-slate-700">
            <p>
              The dashboard uses a deliberately varied set of chart types, each chosen for the analytical 
              question it answers rather than aesthetic uniformity:
            </p>
            <ul className="space-y-2 ml-6 list-disc text-sm">
              <li><strong>Horizontal bar chart</strong> for ranked categorical comparison (specialties), following Cleveland (1985) on graphical perception.</li>
              <li><strong>Small multiples</strong> for examining interaction effects (deprivation × region), following Tufte (1983).</li>
              <li><strong>Diverging dot plot</strong> for deviation-from-baseline analysis (trust outliers), avoiding the magnitude distortion bar charts impose on signed values.</li>
              <li><strong>Dumbbell range plot</strong> for spread visualisation (postcode lottery), where line length itself encodes the analytical insight.</li>
              <li><strong>Bubble chart</strong> for three-dimensional decision-support (investment priorities), encoding x, y, and size simultaneously.</li>
              <li><strong>Multi-series line chart</strong> for temporal trajectory (regional change), the canonical form for time-series comparison.</li>
            </ul>
          </div>
        </section>
        
        {/* Section: Limitations */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Limitations and caveats</h2>
          <div className="space-y-3">
            <Caveat
              heading="Three-month observation window"
              text="The current dataset spans December 2025 to February 2026. This permits cross-sectional and short-term trajectory analysis but limits inference about longer-term patterns. The Elective Recovery Plan was launched in February 2022; trajectory analysis from that baseline would require ingestion of historic monthly releases."
            />
            <Caveat
              heading="Trust-area deprivation as catchment proxy"
              text="Each NHS trust is mapped to a single LSOA (its headquarters' area) for the deprivation analysis. Real trust catchments span hundreds of LSOAs across mixed deprivation profiles. The flat overall deprivation gradient observed in this dataset likely reflects this aggregation artefact rather than absence of an underlying inverse care law (Tudor Hart, 1971). When sliced by region, London and South East do show the expected gradient — consistent with denser urban catchments where HQ-LSOA more closely approximates the served population. A patient-flow-weighted analysis would test the inverse care law more rigorously but requires patient-level data not publicly available."
            />
            <Caveat
              heading="Regional mapping derivation"
              text="NHS Digital's etr.csv did not include parent-organisation links to NHS Regions. Region was derived from each trust's HQ postcode using a custom postcode-area-to-region mapping. 199 of 201 trusts were successfully mapped; the two unmapped trusts are excluded from regional analysis. Some outer-London postcodes (BR, CR, DA, EN, HA, IG, KT, RM, SM, TW, UB, WD) map ambiguously between London and South East — the implementation prefers South East for these areas."
            />
            <Caveat
              heading="Specialty-level reporting"
              text="The analysis uses NHS Treatment Function Codes (TFCs). Subspecialty-level performance is not separately analysed; some apparent specialty-level variation may reflect differing patient-mix between trusts within the same TFC."
            />
          </div>
        </section>
        
        {/* Section: References */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">References</h2>
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <ul className="space-y-3 text-sm text-slate-700 leading-relaxed">
              <li>Celko, J. (2012) <em>Trees and Hierarchies in SQL for Smarties</em>. 2nd edn. Burlington, MA: Morgan Kaufmann.</li>
              <li>Cleveland, W. S. (1985) <em>The Elements of Graphing Data</em>. Monterey, CA: Wadsworth.</li>
              <li>Codd, E. F. (1971) 'Further normalization of the data base relational model', <em>IBM Research Report RJ909</em>.</li>
              <li>Fagin, R. (1977) 'Multivalued dependencies and a new normal form for relational databases', <em>ACM Transactions on Database Systems</em>, 2(3), pp. 262–278.</li>
              <li>Kimball, R. (1996) <em>The Data Warehouse Toolkit</em>. New York: Wiley.</li>
              <li>Kimball, R. and Ross, M. (2013) <em>The Data Warehouse Toolkit: The Definitive Guide to Dimensional Modeling</em>. 3rd edn. Indianapolis: Wiley.</li>
              <li>Marmot, M. et al. (2010) <em>Fair Society, Healthy Lives: The Marmot Review</em>. London: Institute of Health Equity.</li>
              <li>Tudor Hart, J. (1971) 'The inverse care law', <em>The Lancet</em>, 297(7696), pp. 405–412.</li>
              <li>Tufte, E. R. (1983) <em>The Visual Display of Quantitative Information</em>. Cheshire, CT: Graphics Press.</li>
            </ul>
          </div>
        </section>
        
        <footer className="pt-8 text-center text-xs text-slate-400 border-t border-slate-200">
          Last updated: May 2026 · QMUL IOT552U Business Organisation and Decision Making
        </footer>
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