import { TextareaHTMLAttributes } from "react";
import { clsx } from "clsx";

export default function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={clsx(
        "w-full rounded-xl px-4 py-3 border border-slate-200",
        "bg-white/50 backdrop-blur-sm",
        "focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500",
        "placeholder:text-slate-400",
        "transition-all duration-200",
        "hover:border-slate-300",
        "min-h-[96px]",
        className
      )}
      {...props}
    />
  );
}
