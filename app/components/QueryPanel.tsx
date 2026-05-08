"use client"

import { useState } from 'react'

type QueryPanelProps = {
  number: number
  question: string
  description: string
  tables: string[]
  techniques: string[]
  sql: string
  finding?: string
  children: React.ReactNode
}

export default function QueryPanel({ 
  number, question, description, tables, techniques, sql, finding, children 
}: QueryPanelProps) {
  const [showSQL, setShowSQL] = useState(false)
  
  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-200 bg-slate-50">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-900 text-white font-bold flex items-center justify-center">
            Q{number}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-900">{question}</h2>
            <p className="text-sm text-slate-600 mt-1">{description}</p>
            <div className="flex gap-2 mt-3 flex-wrap">
              {tables.map(t => (
                <span key={t} className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-900 rounded">
                  {t}
                </span>
              ))}
              {techniques.map(t => (
                <span key={t} className="px-2 py-1 text-xs font-medium bg-purple-50 text-purple-900 rounded">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {finding && (
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
          <div className="flex items-start gap-2">
            <span className="text-xs font-bold text-blue-900 uppercase tracking-wider mt-0.5">
              Finding:
            </span>
            <p className="text-sm text-blue-900 font-medium">{finding}</p>
          </div>
        </div>
      )}
      
      <div className="px-6 py-4 border-b border-slate-200">
        <button
          onClick={() => setShowSQL(!showSQL)}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 uppercase tracking-wider flex items-center gap-1"
        >
          {showSQL ? '▼' : '▶'} View SQL
        </button>
        {showSQL && (
          <pre className="mt-3 p-4 bg-slate-900 text-slate-100 rounded-lg text-xs overflow-x-auto leading-relaxed">
            <code>{sql}</code>
          </pre>
        )}
      </div>
      
      <div className="p-6">
        {children}
      </div>
    </section>
  )
}