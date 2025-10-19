"use client";
import { useState } from "react";
import Label from "@/components/ui/label";
import Input from "@/components/ui/input";
import Textarea from "@/components/ui/textarea";
import Button from "@/components/ui/button";
import { Play, Loader2 } from "lucide-react";

export default function ScraperForm({ onSubmit, loading }: { onSubmit: (d: { url: string; goal?: string }) => void; loading: boolean; }) {
  const [url, setUrl] = useState("");
  const [goal, setGoal] = useState("Extract product cards and canonical links");

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="url" className="text-sm font-semibold text-slate-900 mb-2 block">
            Start URL
          </Label>
          <Input
            id="url"
            placeholder="https://example.com/products"
            value={url}
            onChange={e=>setUrl(e.target.value)}
            className="h-12 text-base"
          />
          <p className="text-xs text-slate-500 mt-1.5">Enter the URL of the page you want to scrape</p>
        </div>
        <div>
          <Label htmlFor="goal" className="text-sm font-semibold text-slate-900 mb-2 block">
            Extraction Goal <span className="text-slate-400 font-normal">(optional)</span>
          </Label>
          <Textarea
            id="goal"
            value={goal}
            onChange={e=>setGoal(e.target.value)}
            className="min-h-[80px] text-base resize-none"
            placeholder="Describe what data you want to extract..."
          />
          <p className="text-xs text-slate-500 mt-1.5">Provide specific instructions for better accuracy</p>
        </div>
      </div>

      <Button
        disabled={loading || !url}
        onClick={() => onSubmit({ url, goal })}
        className="w-full h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Play className="w-5 h-5 mr-2" />
            Start Extraction
          </>
        )}
      </Button>
    </div>
  );
}
