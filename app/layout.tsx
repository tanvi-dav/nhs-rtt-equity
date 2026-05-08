import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navigation from './components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NHS RTT Equity Analysis',
  description: 'An equity audit of NHS England elective waiting times by region, specialty, and area-level deprivation',
}

export default function RootLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 min-h-screen text-slate-900`}>
        <Navigation />
        <main className="max-w-7xl mx-auto px-6 py-10">
          {children}
        </main>
      </body>
    </html>
  )
}