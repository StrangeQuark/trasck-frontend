import { useState } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { Field } from '../../components/Field';
import { JsonPreview } from '../../components/JsonPreview';
import { SelectField } from '../../components/SelectField';
import { TextField } from '../../components/TextField';
import { parseJson, toJsonText } from '../../utils/forms';

const functions = ['trim', 'collapse_whitespace', 'lower', 'upper', 'replace', 'prefix', 'suffix', 'truncate'];
const targetFields = ['title', 'descriptionMarkdown', 'typeKey', 'statusKey', 'priorityKey', 'visibility'];
const customTargetField = 'custom...';

const pipelineFor = (value) => {
  if (Array.isArray(value)) {
    return value;
  }
  if (value?.pipeline && Array.isArray(value.pipeline)) {
    return value.pipeline;
  }
  if (value) {
    return [value];
  }
  return [];
};

const buildStep = (form) => {
  if (form.functionName === 'replace') {
    return {
      function: 'replace',
      target: form.target,
      replacement: form.replacement,
      regex: form.regex === 'true',
    };
  }
  if (form.functionName === 'prefix' || form.functionName === 'suffix') {
    return { function: form.functionName, value: form.value };
  }
  if (form.functionName === 'truncate') {
    return { function: 'truncate', maxLength: Number(form.maxLength || 80) };
  }
  return { function: form.functionName };
};

export const TransformPipelineEditor = ({ label, value, onChange }) => {
  const [form, setForm] = useState({
    targetField: 'title',
    customTargetField: '',
    functionName: 'trim',
    target: '',
    replacement: '',
    regex: 'false',
    value: '',
    maxLength: '80',
  });
  const config = parseJson(value, {});
  const configuredFields = Object.keys(config).filter((field) => !targetFields.includes(field));
  const targetFieldOptions = [...targetFields, ...configuredFields, customTargetField];
  const activeTargetField = form.targetField === customTargetField ? form.customTargetField.trim() : form.targetField;
  const selectedPipeline = activeTargetField ? pipelineFor(config[activeTargetField]) : [];

  const writeConfig = (nextConfig) => onChange(toJsonText(nextConfig));

  const addStep = () => {
    if (!activeTargetField) {
      return;
    }
    const next = { ...config };
    next[activeTargetField] = [...selectedPipeline, buildStep(form)];
    writeConfig(next);
  };

  const clearField = () => {
    if (!activeTargetField) {
      return;
    }
    const next = { ...config };
    delete next[activeTargetField];
    writeConfig(next);
  };

  return (
    <div className="stack">
      <div className="two-column compact">
        <SelectField label="Transform field" value={form.targetField} onChange={(targetField) => setForm({ ...form, targetField })} options={targetFieldOptions} />
        {form.targetField === customTargetField && (
          <TextField label="Custom field" value={form.customTargetField} onChange={(nextValue) => setForm({ ...form, customTargetField: nextValue })} />
        )}
        <SelectField label="Function" value={form.functionName} onChange={(functionName) => setForm({ ...form, functionName })} options={functions} />
        {(form.functionName === 'replace') && (
          <>
            <TextField label="Find" value={form.target} onChange={(target) => setForm({ ...form, target })} />
            <TextField label="Replace with" value={form.replacement} onChange={(replacement) => setForm({ ...form, replacement })} />
            <SelectField label="Regex" value={form.regex} onChange={(regex) => setForm({ ...form, regex })} options={['false', 'true']} />
          </>
        )}
        {(form.functionName === 'prefix' || form.functionName === 'suffix') && (
          <TextField label="Value" value={form.value} onChange={(nextValue) => setForm({ ...form, value: nextValue })} />
        )}
        {form.functionName === 'truncate' && (
          <TextField label="Max length" type="number" value={form.maxLength} onChange={(maxLength) => setForm({ ...form, maxLength })} />
        )}
      </div>
      <div className="button-row wrap">
        <button className="secondary-button" disabled={!activeTargetField} onClick={addStep} type="button"><FiPlus />Add step</button>
        <button className="icon-button danger" disabled={!activeTargetField} onClick={clearField} title="Clear field pipeline" type="button"><FiTrash2 /></button>
      </div>
      <JsonPreview title={label + ' Pipeline'} value={config} />
      <Field label={label + ' JSON'}>
        <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} spellCheck="false" />
      </Field>
    </div>
  );
};
