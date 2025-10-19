import { ReactNode, CSSProperties } from "react";
import { clsx } from "clsx";

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return <table className={clsx("w-full text-sm", className)}>{children}</table>;
}

export function THead({ children, className }: { children: ReactNode; className?: string }) {
  return <thead className={clsx("bg-slate-50", className)}>{children}</thead>;
}

export function TRow({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return <tr className={clsx("border-b last:border-0", className)} style={style}>{children}</tr>;
}

export function TH({ children, className }: { children: ReactNode; className?: string }) {
  return <th className={clsx("text-left px-3 py-2 font-semibold", className)}>{children}</th>;
}

export function TD({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={clsx("px-3 py-2", className)}>{children}</td>;
}
