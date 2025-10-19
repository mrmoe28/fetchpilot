import { clsx } from "clsx";
import { ButtonHTMLAttributes } from "react";
export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-2xl px-4 py-2 font-medium",
        "bg-fetchpilot.primary text-white hover:opacity-90 active:opacity-80 disabled:opacity-50",
        "shadow-soft transition-all", className
      )}
      {...props}
    />
  );
}
export default Button;
