"use client";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import ScraperForm from "@/components/scraper-form";
import ResultsTable from "@/components/results-table";
import LogView from "@/components/log-view";

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
    <div className="grid gap-6">
      <Card className="shadow-soft border-0 rounded-2xl">
        <CardContent className="p-6">
          <ScraperForm onSubmit={runScrape} loading={loading} />
        </CardContent>
      </Card>
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-soft border-0 rounded-2xl">
          <CardContent className="p-0">
            <ResultsTable rows={rows} />
          </CardContent>
        </Card>
        <Card className="shadow-soft border-0 rounded-2xl">
          <CardContent className="p-0">
            <LogView logs={logs} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
