const isAdvancedLabel = (label) => /\bjson\b/i.test(String(label || ''));

const advancedSummary = (label) => {
  const base = String(label || 'Advanced').replace(/\bjson\b/gi, '').replace(/\s+/g, ' ').trim();
  if (!base) {
    return 'Advanced configuration';
  }
  return /config(uration)?$/i.test(base) ? base : `${base} configuration`;
};

export const Field = ({ label, children }) => {
  if (isAdvancedLabel(label)) {
    return (
      <details className="advanced-field">
        <summary>{advancedSummary(label)}</summary>
        <label className="field">
          <span>{advancedSummary(label)}</span>
          {children}
        </label>
      </details>
    );
  }
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
};
