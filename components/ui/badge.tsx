export default function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs ${className || 'bg-slate-100 text-slate-700'}`}>{children}</span>;
}
