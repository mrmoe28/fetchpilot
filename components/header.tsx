import { PlaneTakeoff } from "lucide-react";
export default function Header() {
  return (
    <header className="border-b bg-white">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-fetchpilot.primary text-white grid place-content-center shadow-soft">
          <PlaneTakeoff size={18} />
        </div>
        <div>
          <h1 className="font-semibold leading-tight">FetchPilot</h1>
          <p className="text-xs text-slate-500 -mt-0.5">Autonomous web intelligence agent</p>
        </div>
      </div>
    </header>
  );
}
