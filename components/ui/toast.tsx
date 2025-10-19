"use client";
import { useEffect, useState } from "react";
export default function Toast({ message }: { message: string }) {
  const [show, setShow] = useState(true);
  useEffect(() => { const t = setTimeout(() => setShow(false), 3000); return () => clearTimeout(t); }, []);
  if (!show) return null;
  return <div className="fixed bottom-6 right-6 bg-black text-white px-4 py-2 rounded-xl shadow-soft">{message}</div>;
}
