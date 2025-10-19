import { clsx } from "clsx";
import { ButtonHTMLAttributes } from "react";

export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-xl px-6 py-3 font-semibold",
        "bg-gradient-to-r from-sky-500 to-blue-600 text-white",
        "hover:from-sky-600 hover:to-blue-700 active:scale-95",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
        "shadow-lg shadow-sky-500/25 hover:shadow-xl hover:shadow-sky-500/30",
        "transition-all duration-200 ease-out",
        className
      )}
      {...props}
    />
  );
}

export default Button;
