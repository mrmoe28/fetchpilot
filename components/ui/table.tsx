import { HTMLAttributes, ReactNode } from "react";
export function Table({ children }: { children: ReactNode }) { return <table className="w-full text-sm">{children}</table>; }
export function THead({ children }: { children: ReactNode }) { return <thead className="bg-slate-50">{children}</thead>; }
export function TRow({ children }: { children: ReactNode }) { return <tr className="border-b last:border-0">{children}</tr>; }
export function TH({ children }: { children: ReactNode }) { return <th className="text-left px-3 py-2 font-semibold">{children}</th>; }
export function TD({ children }: { children: ReactNode }) { return <td className="px-3 py-2">{children}</td>; }
