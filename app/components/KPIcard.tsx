export default function KPICard({ 
    label, 
    value, 
    subtitle, 
    accent = false 
  }: {
    label: string
    value: string
    subtitle?: string
    accent?: boolean
  }) {
    return (
      <div className={`p-6 rounded-lg border ${accent ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
        <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">
          {label}
        </div>
        <div className={`mt-2 text-4xl font-bold ${accent ? 'text-blue-900' : 'text-gray-900'}`}>
          {value}
        </div>
        {subtitle && (
          <div className="mt-1 text-sm text-gray-500">
            {subtitle}
          </div>
        )}
      </div>
    )
  }