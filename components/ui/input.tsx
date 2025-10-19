import { InputHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";
const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function I({ className, ...props }, ref) {
  return <input ref={ref} className={clsx("w-full rounded-xl border px-3 py-2 border-slate-300 focus:outline-none focus:ring-2 focus:ring-fetchpilot.accent", className)} {...props} />;
});
export default Input;
