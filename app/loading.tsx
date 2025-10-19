import { PlaneTakeoff } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen grid place-content-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-fetchpilot-primary/20 grid place-content-center animate-pulse">
            <PlaneTakeoff className="text-fetchpilot-primary" size={32} />
          </div>
          <div className="absolute inset-0 rounded-2xl border-2 border-fetchpilot-primary/30 animate-ping" />
        </div>
        <p className="text-sm text-slate-600 font-medium">Loading FetchPilot...</p>
      </div>
    </div>
  )
}
