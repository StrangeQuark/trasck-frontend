import { FiCheck } from 'react-icons/fi';
import { Field } from '../../components/Field';
import { JsonPreview } from '../../components/JsonPreview';
import { RecordSelect } from '../../components/RecordSelect';
import { SelectField } from '../../components/SelectField';
import { TextField } from '../../components/TextField';

export const ImportRecordEditor = ({
  form,
  onChange,
  onSelect,
  onSubmit,
  pending,
  records,
  selectedRecord,
}) => (
  <form className="stack" onSubmit={onSubmit}>
    <h3>Record Review</h3>
    <RecordSelect label="Record" records={records} value={form.recordId} onChange={onSelect} />
    <div className="two-column compact">
      <TextField label="Source type" value={form.sourceType} onChange={(sourceType) => onChange({ ...form, sourceType })} />
      <TextField label="Source ID" value={form.sourceId} onChange={(sourceId) => onChange({ ...form, sourceId })} />
      <TextField label="Target type" value={form.targetType} onChange={(targetType) => onChange({ ...form, targetType })} />
      <TextField label="Target ID" value={form.targetId} onChange={(targetId) => onChange({ ...form, targetId })} />
      <SelectField label="Clear target" value={form.clearTarget} onChange={(clearTarget) => onChange({ ...form, clearTarget })} options={['false', 'true']} />
      <SelectField label="Status" value={form.status} onChange={(status) => onChange({ ...form, status })} options={['pending', 'imported', 'failed', 'skipped']} />
    </div>
    <TextField label="Error message" value={form.errorMessage} onChange={(errorMessage) => onChange({ ...form, errorMessage })} />
    <Field label="Source payload JSON">
      <textarea value={form.rawPayloadText} onChange={(event) => onChange({ ...form, rawPayloadText: event.target.value })} rows={8} spellCheck="false" />
    </Field>
    <button className="secondary-button" disabled={pending || !form.recordId} type="submit"><FiCheck />Save record</button>
    <JsonPreview title="Selected Record" value={selectedRecord} />
  </form>
);
