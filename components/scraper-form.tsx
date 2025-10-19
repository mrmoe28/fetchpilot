"use client";
import { useState } from "react";
import Label from "@/components/ui/label";
import Input from "@/components/ui/input";
import Textarea from "@/components/ui/textarea";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";

export default function ScraperForm({ onSubmit, loading }: { onSubmit: (d: { url: string; goal?: string }) => void; loading: boolean; }) {
  const [url, setUrl] = useState("");
  const [goal, setGoal] = useState("Extract product cards and canonical links");

  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-2">
        <Badge>HTTP-first</Badge>
        <Badge>LLM-guided</Badge>
        <Badge>Self-correcting</Badge>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="url">Start URL</Label>
          <Input id="url" placeholder="https://example.com/category" value={url} onChange={e=>setUrl(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="goal">Goal (optional)</Label>
          <Textarea id="goal" value={goal} onChange={e=>setGoal(e.target.value)} />
        </div>
      </div>
      <Button disabled={loading || !url} onClick={() => onSubmit({ url, goal })}>
        {loading ? "Running…" : "Run FetchPilot"}
      </Button>
    </div>
  );
}
