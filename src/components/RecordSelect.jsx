import { recordLabel } from '../utils/forms';
import { Field } from './Field';

export const RecordSelect = ({ includeBlank = false, label, onChange, records, value }) => (
  <Field label={label}>
    <select value={value || ''} onChange={(event) => onChange(event.target.value)}>
      {includeBlank && <option value="">None</option>}
      {!includeBlank && !value && <option value="">Select</option>}
      {records.map((record) => (
        <option key={record.id} value={record.id}>{recordLabel(record)}</option>
      ))}
    </select>
  </Field>
);
