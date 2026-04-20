export const SummaryRows = ({ rows }) => (
  <dl className="summary-rows">
    {rows.map(([label, value]) => (
      <div key={label}>
        <dt>{label}</dt>
        <dd>{value || 'None'}</dd>
      </div>
    ))}
  </dl>
);
