export const StatusPill = ({ active, label }) => (
  <span className={'status-pill' + (active ? ' active' : '')}>
    {label}
  </span>
);
