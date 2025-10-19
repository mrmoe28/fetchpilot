export default function LogView({ logs }: { logs: string[] }) {
  return (
    <div className="p-4 h-[360px] overflow-auto font-mono text-xs bg-slate-50 rounded-2xl">
      {logs.map((l, i) => <div key={i} className="py-0.5">{l}</div>)}
    </div>
  );
}
