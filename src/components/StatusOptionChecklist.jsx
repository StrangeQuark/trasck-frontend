import { EmptyState } from './EmptyState';

export const StatusOptionChecklist = ({ disabled = false, onChange, options, value = [] }) => {
  const selected = new Set(value);
  if (!Array.isArray(options) || options.length === 0) {
    return <EmptyState label="No workflow statuses available" />;
  }

  const toggle = (statusId) => {
    const next = new Set(selected);
    if (next.has(statusId)) {
      next.delete(statusId);
    } else {
      next.add(statusId);
    }
    onChange(Array.from(next));
  };

  return (
    <div className="status-option-grid">
      {options.map((status) => (
        <label className={'status-option' + (selected.has(status.id) ? ' selected' : '')} key={status.id}>
          <input
            checked={selected.has(status.id)}
            disabled={disabled}
            onChange={() => toggle(status.id)}
            type="checkbox"
          />
          <span>{status.name}</span>
          <small>{[status.key, status.category].filter(Boolean).join(' | ')}</small>
        </label>
      ))}
    </div>
  );
};
