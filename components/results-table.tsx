import { Table, THead, TRow, TH, TD } from "@/components/ui/table";
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
              <TD><a className="text-fetchpilot.primary underline" href={r.url} target="_blank">{r.url}</a></TD>
              <TD>{r.price ?? "-"}</TD>
              <TD>{r.image ? <img src={r.image} alt={r.title} className="h-10 rounded-md" /> : "-"}</TD>
              <TD>{r.inStock === true ? "Yes" : r.inStock === false ? "No" : "-"}</TD>
            </TRow>
          ))}
        </tbody>
      </Table>
      {rows.length === 0 && <div className="p-6 text-slate-500 text-sm">No results yet. Run a scrape to see products.</div>}
    </div>
  );
}
