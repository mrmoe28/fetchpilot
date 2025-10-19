export default function LogView({ logs }: { logs: string[] }) {
  return (
    <div className="p-6 h-[400px] overflow-auto font-mono text-xs bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100 rounded-b-3xl">
      {logs.length === 0 ? (
        <div className="flex items-center justify-center h-full text-slate-500">
          <p>Logs will appear here once scraping starts...</p>
        </div>
      ) : (
        <div className="space-y-1">
          {logs.map((l, i) => (
            <div
              key={i}
              className={`py-0.5 px-2 rounded animate-fade-in ${
                l.includes('✖') || l.includes('Error')
                  ? 'text-red-400 bg-red-500/10'
                  : l.includes('✔') || l.includes('Done')
                  ? 'text-green-400 bg-green-500/10'
                  : l.includes('▶')
                  ? 'text-blue-400 bg-blue-500/10'
                  : 'text-slate-300'
              }`}
            >
              <span className="text-slate-500 select-none mr-2">{String(i + 1).padStart(3, '0')}</span>
              {l}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
