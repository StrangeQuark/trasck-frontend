export const StatusPill = ({ active, label, tone = '' }) => (
  <span className={['status-pill', active ? 'active' : '', tone ? `tone-${tone}` : ''].filter(Boolean).join(' ')}>
    {label}
  </span>
);
