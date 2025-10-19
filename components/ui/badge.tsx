export default function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs">{children}</span>;
}
