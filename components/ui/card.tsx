import { ReactNode, HTMLAttributes } from "react";
import { clsx } from "clsx";
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("bg-white rounded-2xl border border-slate-200", className)} {...props} />;
}
export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("p-4", className)} {...props} />;
}
