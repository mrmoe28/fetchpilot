"use client";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import ScraperForm from "@/components/scraper-form";
import ResultsTable from "@/components/results-table";
import LogView from "@/components/log-view";
import { Sparkles, Zap, Brain, Globe } from "lucide-react";

export default function Page() {
  const [rows, setRows] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function runScrape(input: { url: string; goal?: string }) {
    setLoading(true);
    setLogs((l) => [...l, "▶ Starting FetchPilot..."]);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.text();
        setLogs((l) => [...l, `✖ Error: ${err}`]);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setRows(data.products || []);
      setLogs((l) => l.concat(data.logs || []));
    } catch (e: any) {
      setLogs((l) => [...l, `✖ Exception: ${e?.message}`]);
    } finally {
      setLoading(false);
      setLogs((l) => [...l, "✔ Done"]);
    }
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 via-blue-500/10 to-cyan-500/10 rounded-3xl blur-3xl"></div>
        <Card className="relative glass shadow-soft-xl border border-white/40 rounded-3xl overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-sky-400/20 to-transparent rounded-full blur-3xl"></div>
          <CardContent className="relative p-8 md:p-12">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-100 text-sky-700 text-sm font-medium mb-6 animate-slide-down">
                <Sparkles className="w-4 h-4" />
                <span>AI-Powered Web Intelligence</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 via-sky-900 to-slate-900 bg-clip-text text-transparent mb-4 animate-slide-up">
                Extract data from any website
              </h1>
              <p className="text-lg text-slate-600 mb-8 animate-slide-up" style={{animationDelay: "0.1s"}}>
                FetchPilot uses advanced AI to understand, navigate, and extract structured data from complex websites. No manual selectors needed.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { icon: Brain, label: "LLM-Guided", desc: "Smart extraction" },
                  { icon: Zap, label: "HTTP-First", desc: "Lightning fast" },
                  { icon: Globe, label: "Universal", desc: "Any website" },
                  { icon: Sparkles, label: "Self-Correcting", desc: "Auto-adapts" },
                ].map((feature, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/60 border border-white/60 shadow-sm animate-scale-in"
                    style={{animationDelay: `${0.2 + i * 0.1}s`}}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white grid place-content-center shadow-md">
                      <feature.icon className="w-5 h-5" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-sm text-slate-900">{feature.label}</p>
                      <p className="text-xs text-slate-500">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scraper Form */}
      <Card className="glass shadow-soft-lg border border-white/40 rounded-3xl card-hover">
        <CardContent className="p-6 md:p-8">
          <ScraperForm onSubmit={runScrape} loading={loading} />
        </CardContent>
      </Card>

      {/* Results Section */}
      {(rows.length > 0 || logs.length > 0) && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="glass shadow-soft-lg border border-white/40 rounded-3xl overflow-hidden animate-slide-up">
            <CardContent className="p-0">
              <div className="p-6 border-b border-slate-200/60 bg-gradient-to-r from-white/80 to-white/40">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Extracted Products ({rows.length})
                </h2>
              </div>
              <ResultsTable rows={rows} />
            </CardContent>
          </Card>
          <Card className="glass shadow-soft-lg border border-white/40 rounded-3xl overflow-hidden animate-slide-up" style={{animationDelay: "0.1s"}}>
            <CardContent className="p-0">
              <div className="p-6 border-b border-slate-200/60 bg-gradient-to-r from-white/80 to-white/40">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <div className="w-2 h-2 bg-sky-500 rounded-full animate-pulse"></div>
                  Execution Log
                </h2>
              </div>
              <LogView logs={logs} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
