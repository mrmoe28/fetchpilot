import { Table, THead, TRow, TH, TD } from "@/components/ui/table"
import Image from "next/image"

export default function ResultsTable({ rows }: { rows: any[] }) {
  return (
    <div className="overflow-auto">
      <Table>
        <THead>
          <TRow>
            <TH>Title</TH><TH>URL</TH><TH>Price</TH><TH>Image</TH><TH>In Stock</TH>
          </TRow>
        </THead>
        <tbody>
          {rows.map((r, i) => (
            <TRow key={i}>
              <TD>{r.title}</TD>
              <TD><a className="text-fetchpilot.primary underline" href={r.url} target="_blank" rel="noopener noreferrer">{r.url}</a></TD>
              <TD>{r.price ?? "-"}</TD>
              <TD>
                {r.image ? (
                  <Image
                    src={r.image}
                    alt={r.title || 'Product image'}
                    width={40}
                    height={40}
                    className="rounded-md object-cover"
                    unoptimized
                  />
                ) : "-"}
              </TD>
              <TD>{r.inStock === true ? "Yes" : r.inStock === false ? "No" : "-"}</TD>
            </TRow>
          ))}
        </tbody>
      </Table>
      {rows.length === 0 && <div className="p-6 text-slate-500 text-sm">No results yet. Run a scrape to see products.</div>}
    </div>
  );
}
