import Link from 'next/link'

export default function Navigation() {
  return (
    <nav className="bg-blue-900 text-white border-b border-blue-800">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold tracking-tight hover:opacity-80">
          NHS RTT Equity Analysis
        </Link>
        <div className="flex gap-8 text-sm font-medium">
          <Link href="/" className="hover:opacity-80">Analysis</Link>
          <Link href="/methodology" className="hover:opacity-80">Methodology</Link>
        </div>
      </div>
    </nav>
  )
}