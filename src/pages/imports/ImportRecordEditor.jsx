import { FiCheck } from 'react-icons/fi';
import { Field } from '../../components/Field';
import { JsonPreview } from '../../components/JsonPreview';
import { RecordSelect } from '../../components/RecordSelect';
import { SelectField } from '../../components/SelectField';
import { TextField } from '../../components/TextField';

const flattenSnapshot = (value, prefix = '', fields = {}) => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    Object.entries(value).forEach(([key, child]) => {
      flattenSnapshot(child, prefix ? `${prefix}.${key}` : key, fields);
    });
    return fields;
  }
  fields[prefix || 'value'] = value;
  return fields;
};

const formatValue = (value) => {
  if (value === undefined) {
    return 'undefined';
  }
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return text && text.length > 140 ? `${text.slice(0, 137)}...` : text;
};

const versionDiffSummaries = (versions) => (versions || []).map((version, index) => {
  const current = flattenSnapshot(version.snapshot || {});
  const previousVersion = versions[index + 1];
  if (!previousVersion) {
    return {
      version: version.version,
      changeType: version.changeType,
      summary: ['Initial captured snapshot'],
    };
  }
  const previous = flattenSnapshot(previousVersion.snapshot || {});
  const fields = Array.from(new Set([...Object.keys(previous), ...Object.keys(current)])).sort();
  const added = [];
  const removed = [];
  const changed = [];
  fields.forEach((field) => {
    const beforeValue = previous[field];
    const afterValue = current[field];
    if (!(field in previous)) {
      added.push({ field, value: formatValue(afterValue) });
      return;
    }
    if (!(field in current)) {
      removed.push({ field, previous: formatValue(beforeValue) });
      return;
    }
    if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
      changed.push({ field, previous: formatValue(beforeValue), value: formatValue(afterValue) });
    }
  });
  return {
    version: version.version,
    comparedToVersion: previousVersion.version,
    changeType: version.changeType,
    added,
    removed,
    changed,
    unchanged: added.length === 0 && removed.length === 0 && changed.length === 0,
  };
});

export const ImportRecordEditor = ({
  form,
  onChange,
  onSelect,
  onSubmit,
  pending,
  records,
  versions = [],
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
    <JsonPreview title="Record Version Diff Summary" value={versionDiffSummaries(versions)} />
    <JsonPreview title="Record Versions" value={versions} />
  </form>
);
