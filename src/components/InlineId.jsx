export const InlineId = ({ label, onChange, value }) => (
  <label className="inline-id">
    <span>{label}</span>
    <input value={value} onChange={(event) => onChange(event.target.value)} />
  </label>
);
