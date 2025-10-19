import { TextareaHTMLAttributes } from "react";
import { clsx } from "clsx";
export default function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={clsx("w-full rounded-xl border px-3 py-2 border-slate-300 min-h-[96px] focus:outline-none focus:ring-2 focus:ring-fetchpilot.accent")} {...props} />;
}
