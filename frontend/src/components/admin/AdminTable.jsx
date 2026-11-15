export default function AdminTable({ columns, rows, empty = 'No records.', onRowClick }) {
  return (
    <div className="scrollbar-thin overflow-x-auto rounded-xl border border-navy/10">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-navy text-white">
          <tr>{columns.map((c) => <th key={c.key} className="px-3 py-2 font-bold">{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id ?? i} onClick={onRowClick ? () => onRowClick(r) : undefined} className={`border-t border-navy/5 ${i % 2 ? 'bg-sand/20' : 'bg-white'} ${onRowClick ? 'cursor-pointer hover:bg-ocean/10' : ''}`}>
              {columns.map((c) => <td key={c.key} className="px-3 py-2 align-top">{c.render ? c.render(r) : r[c.key]}</td>)}
            </tr>
          ))}
          {!rows.length && (
            <tr><td colSpan={columns.length} className="px-3 py-6 text-center text-navy/60">{empty}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
