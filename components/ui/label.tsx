import { LabelHTMLAttributes } from "react";

export function Label(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className="block text-sm font-medium mb-1" {...props} />;
}

export default Label;
