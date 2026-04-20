import { useState } from 'react';
import { FiActivity, FiArrowRight, FiDatabase, FiEye, FiPlus, FiRefreshCw, FiSliders, FiUploadCloud, FiX } from 'react-icons/fi';
import { DetailLinkGrid } from '../../components/DetailLinkGrid';
import { ErrorLine } from '../../components/ErrorLine';
import { Field } from '../../components/Field';
import { JsonPreview } from '../../components/JsonPreview';
import { JsonRecordEditor } from '../../components/JsonRecordEditor';
import { Panel } from '../../components/Panel';
import { RecordSelect } from '../../components/RecordSelect';
import { SelectField } from '../../components/SelectField';
import { TextField } from '../../components/TextField';
import { useApiAction } from '../../hooks/useApiAction';
import { firstId, numberOrUndefined, parseJson, parseJsonOrThrow, pick } from '../../utils/forms';

export const ImportsPage = ({ context }) => {
  const [jobs, setJobs] = useState([]);
  const [importJobId, setImportJobId] = useState('');
  const [templates, setTemplates] = useState([]);
  const [mappingTemplateId, setMappingTemplateId] = useState('');
  const [transformPresets, setTransformPresets] = useState([]);
  const [transformPresetId, setTransformPresetId] = useState('');
  const [records, setRecords] = useState([]);
  const [materializationRuns, setMaterializationRuns] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [parseResult, setParseResult] = useState(null);
  const [materializeResult, setMaterializeResult] = useState(null);
  const [jobForm, setJobForm] = useState({ provider: 'csv', configText: JSON.stringify({ targetProjectId: '' }, null, 2) });
  const [templateForm, setTemplateForm] = useState({
    name: 'Default work item mapping',
    provider: 'csv',
    sourceType: 'row',
    workItemTypeKey: 'story',
    transformPresetId: '',
    fieldMappingText: JSON.stringify({ title: ['title', 'summary', 'fields.summary', 'Name'], descriptionMarkdown: ['description', 'fields.description', 'Description'] }, null, 2),
    defaultsText: JSON.stringify({ descriptionMarkdown: 'Imported through Trasck' }, null, 2),
    transformationConfigText: JSON.stringify({ title: ['trim', 'collapse_whitespace'] }, null, 2),
    enabled: 'true',
  });
  const [presetForm, setPresetForm] = useState({
    name: 'Shared title cleanup',
    description: '',
    transformationConfigText: JSON.stringify({ title: ['trim', 'collapse_whitespace'] }, null, 2),
    enabled: 'true',
  });
  const [parseForm, setParseForm] = useState({
    sourceType: '',
    content: 'key,title,type\nTRASCK-1,Imported story,story',
  });
  const [materializeForm, setMaterializeForm] = useState({ limit: '25', updateExisting: 'false' });
  const [recordForm, setRecordForm] = useState({ sourceType: 'issue', sourceId: 'MANUAL-1', targetType: 'work_item', targetId: '', rawPayloadText: '{}' });
  const action = useApiAction(context.addToast);

  const load = async () => {
    if (!context.workspaceId) {
      action.setError('Workspace ID is required');
      return;
    }
    const result = await action.run(async () => {
      const [jobRows, templateRows, presetRows] = await Promise.all([
        context.services.imports.listJobs(context.workspaceId),
        context.services.imports.listMappingTemplates(context.workspaceId),
        context.services.imports.listTransformPresets(context.workspaceId),
      ]);
      const nextJobId = importJobId || firstId(jobRows);
      const nextTemplateId = mappingTemplateId || firstId(templateRows);
      const nextPresetId = transformPresetId || firstId(presetRows);
      const [job, recordRows, runRows] = await Promise.all([
        nextJobId ? context.services.imports.getJob(nextJobId) : Promise.resolve(null),
        nextJobId ? context.services.imports.listRecords(nextJobId) : Promise.resolve([]),
        nextJobId ? context.services.imports.listMaterializationRuns(nextJobId) : Promise.resolve([]),
      ]);
      return { jobRows, templateRows, presetRows, nextJobId, nextTemplateId, nextPresetId, job, recordRows, runRows };
    });
    if (result) {
      setJobs(result.jobRows || []);
      setTemplates(result.templateRows || []);
      setTransformPresets(result.presetRows || []);
      setImportJobId(result.nextJobId || '');
      setMappingTemplateId(result.nextTemplateId || '');
      setTransformPresetId(result.nextPresetId || '');
      setSelectedJob(result.job || null);
      setRecords(result.recordRows || []);
      setMaterializationRuns(result.runRows || []);
    }
  };

  const createJob = async (event) => {
    event.preventDefault();
    const job = await action.run(() => context.services.imports.createJob(context.workspaceId, {
      provider: jobForm.provider,
      config: {
        ...parseJsonOrThrow(jobForm.configText),
        targetProjectId: context.projectId || parseJson(jobForm.configText, {}).targetProjectId,
      },
    }), 'Import job created');
    if (job) {
      setImportJobId(job.id || '');
      await load();
    }
  };

  const createTemplate = async (event) => {
    event.preventDefault();
    const template = await action.run(() => context.services.imports.createMappingTemplate(context.workspaceId, {
      name: templateForm.name,
      provider: templateForm.provider,
      sourceType: templateForm.sourceType || undefined,
      targetType: 'work_item',
      projectId: context.projectId || undefined,
      workItemTypeKey: templateForm.workItemTypeKey,
      transformPresetId: templateForm.transformPresetId || undefined,
      fieldMapping: parseJsonOrThrow(templateForm.fieldMappingText),
      defaults: parseJsonOrThrow(templateForm.defaultsText),
      transformationConfig: parseJsonOrThrow(templateForm.transformationConfigText),
      enabled: templateForm.enabled === 'true',
    }), 'Mapping template created');
    if (template) {
      setMappingTemplateId(template.id || '');
      await load();
    }
  };

  const createTransformPreset = async (event) => {
    event.preventDefault();
    const preset = await action.run(() => context.services.imports.createTransformPreset(context.workspaceId, {
      name: presetForm.name,
      description: presetForm.description || undefined,
      transformationConfig: parseJsonOrThrow(presetForm.transformationConfigText),
      enabled: presetForm.enabled === 'true',
    }), 'Transform preset created');
    if (preset) {
      setTransformPresetId(preset.id || '');
      setTemplateForm((current) => ({ ...current, transformPresetId: preset.id || current.transformPresetId }));
      await load();
    }
  };

  const parseJob = async (event) => {
    event.preventDefault();
    const parsed = await action.run(() => context.services.imports.parse(importJobId, {
      content: parseForm.content,
      sourceType: parseForm.sourceType || undefined,
    }), 'Import parsed');
    if (parsed) {
      setParseResult(parsed);
      await loadRecords();
    }
  };

  const materializeJob = async (event) => {
    event.preventDefault();
    const result = await action.run(() => context.services.imports.materialize(importJobId, {
      mappingTemplateId,
      projectId: context.projectId || undefined,
      limit: numberOrUndefined(materializeForm.limit),
      updateExisting: materializeForm.updateExisting === 'true',
    }), 'Import materialized');
    if (result) {
      setMaterializeResult(result);
      await loadRecords();
    }
  };

  const createRecord = async (event) => {
    event.preventDefault();
    await action.run(() => context.services.imports.createRecord(importJobId, {
      sourceType: recordForm.sourceType,
      sourceId: recordForm.sourceId,
      targetType: recordForm.targetType || undefined,
      targetId: recordForm.targetId || undefined,
      rawPayload: parseJsonOrThrow(recordForm.rawPayloadText),
    }), 'Record created');
    await loadRecords();
  };

  const loadRecords = async () => {
    if (!importJobId) {
      action.setError('Import job is required');
      return;
    }
    const result = await action.run(() => Promise.all([
      context.services.imports.getJob(importJobId),
      context.services.imports.listRecords(importJobId),
    ]));
    if (result) {
      const [job, rows] = result;
      setSelectedJob(job || null);
      setRecords(rows || []);
      if (job) {
        const runs = await action.run(() => context.services.imports.listMaterializationRuns(importJobId));
        if (runs) {
          setMaterializationRuns(runs || []);
        }
      }
    }
  };

  const jobCommand = async (command, success) => {
    await action.run(() => command(importJobId), success);
    await loadRecords();
  };

  return (
    <div className="content-grid">
      <Panel title="Import Job" icon={<FiUploadCloud />}>
        <form className="stack" onSubmit={createJob}>
          <SelectField label="Provider" value={jobForm.provider} onChange={(provider) => setJobForm({ ...jobForm, provider })} options={['csv', 'jira', 'rally']} />
          <Field label="Config JSON">
            <textarea value={jobForm.configText} onChange={(event) => setJobForm({ ...jobForm, configText: event.target.value })} rows={6} spellCheck="false" />
          </Field>
          <button className="primary-button" disabled={action.pending || !context.workspaceId} type="submit"><FiPlus />Create job</button>
        </form>
      </Panel>
      <Panel title="Parse" icon={<FiDatabase />}>
        <form className="stack" onSubmit={parseJob}>
          <RecordSelect label="Import job" records={jobs} value={importJobId} onChange={setImportJobId} />
          <TextField label="Source type" value={parseForm.sourceType} onChange={(sourceType) => setParseForm({ ...parseForm, sourceType })} />
          <Field label="Content">
            <textarea value={parseForm.content} onChange={(event) => setParseForm({ ...parseForm, content: event.target.value })} rows={8} spellCheck="false" />
          </Field>
          <button className="primary-button" disabled={action.pending || !importJobId} type="submit"><FiRefreshCw />Parse</button>
        </form>
      </Panel>
      <Panel title="Transform Preset" icon={<FiSliders />}>
        <form className="stack" onSubmit={createTransformPreset}>
          <TextField label="Name" value={presetForm.name} onChange={(name) => setPresetForm({ ...presetForm, name })} />
          <TextField label="Description" value={presetForm.description} onChange={(description) => setPresetForm({ ...presetForm, description })} />
          <SelectField label="Enabled" value={presetForm.enabled} onChange={(enabled) => setPresetForm({ ...presetForm, enabled })} options={['true', 'false']} />
          <Field label="Transform JSON">
            <textarea value={presetForm.transformationConfigText} onChange={(event) => setPresetForm({ ...presetForm, transformationConfigText: event.target.value })} rows={5} spellCheck="false" />
          </Field>
          <button className="primary-button" disabled={action.pending || !context.workspaceId} type="submit"><FiPlus />Create preset</button>
        </form>
      </Panel>
      <Panel title="Mapping Template" icon={<FiSliders />}>
        <form className="stack" onSubmit={createTemplate}>
          <TextField label="Name" value={templateForm.name} onChange={(name) => setTemplateForm({ ...templateForm, name })} />
          <div className="two-column compact">
            <SelectField label="Provider" value={templateForm.provider} onChange={(provider) => setTemplateForm({ ...templateForm, provider })} options={['csv', 'jira', 'rally']} />
            <TextField label="Source type" value={templateForm.sourceType} onChange={(sourceType) => setTemplateForm({ ...templateForm, sourceType })} />
            <TextField label="Type key" value={templateForm.workItemTypeKey} onChange={(workItemTypeKey) => setTemplateForm({ ...templateForm, workItemTypeKey })} />
            <RecordSelect label="Preset" records={transformPresets} value={templateForm.transformPresetId} onChange={(presetId) => setTemplateForm({ ...templateForm, transformPresetId: presetId })} includeBlank />
            <SelectField label="Enabled" value={templateForm.enabled} onChange={(enabled) => setTemplateForm({ ...templateForm, enabled })} options={['true', 'false']} />
          </div>
          <Field label="Field mapping JSON">
            <textarea value={templateForm.fieldMappingText} onChange={(event) => setTemplateForm({ ...templateForm, fieldMappingText: event.target.value })} rows={6} spellCheck="false" />
          </Field>
          <Field label="Defaults JSON">
            <textarea value={templateForm.defaultsText} onChange={(event) => setTemplateForm({ ...templateForm, defaultsText: event.target.value })} rows={4} spellCheck="false" />
          </Field>
          <Field label="Transformations JSON">
            <textarea value={templateForm.transformationConfigText} onChange={(event) => setTemplateForm({ ...templateForm, transformationConfigText: event.target.value })} rows={4} spellCheck="false" />
          </Field>
          <button className="primary-button" disabled={action.pending || !context.workspaceId || !context.projectId} type="submit"><FiPlus />Create template</button>
        </form>
      </Panel>
      <Panel title="Materialize" icon={<FiArrowRight />}>
        <form className="stack" onSubmit={materializeJob}>
          <RecordSelect label="Import job" records={jobs} value={importJobId} onChange={setImportJobId} />
          <RecordSelect label="Template" records={templates} value={mappingTemplateId} onChange={setMappingTemplateId} />
          <div className="two-column compact">
            <TextField label="Limit" type="number" value={materializeForm.limit} onChange={(limit) => setMaterializeForm({ ...materializeForm, limit })} />
            <SelectField label="Update existing" value={materializeForm.updateExisting} onChange={(updateExisting) => setMaterializeForm({ ...materializeForm, updateExisting })} options={['false', 'true']} />
          </div>
          <button className="primary-button" disabled={action.pending || !importJobId || !mappingTemplateId || !context.projectId} type="submit"><FiArrowRight />Materialize</button>
        </form>
      </Panel>
      <Panel title="Manual Record" icon={<FiPlus />}>
        <form className="stack" onSubmit={createRecord}>
          <RecordSelect label="Import job" records={jobs} value={importJobId} onChange={setImportJobId} />
          <TextField label="Source type" value={recordForm.sourceType} onChange={(sourceType) => setRecordForm({ ...recordForm, sourceType })} />
          <TextField label="Source ID" value={recordForm.sourceId} onChange={(sourceId) => setRecordForm({ ...recordForm, sourceId })} />
          <TextField label="Target type" value={recordForm.targetType} onChange={(targetType) => setRecordForm({ ...recordForm, targetType })} />
          <TextField label="Target ID" value={recordForm.targetId} onChange={(targetId) => setRecordForm({ ...recordForm, targetId })} />
          <button className="primary-button" disabled={action.pending || !importJobId} type="submit"><FiPlus />Add record</button>
        </form>
      </Panel>
      <Panel title="Lifecycle" icon={<FiActivity />}>
        <RecordSelect label="Import job" records={jobs} value={importJobId} onChange={setImportJobId} />
        <div className="button-row wrap">
          <button className="secondary-button" disabled={action.pending} onClick={load} type="button"><FiRefreshCw />Load</button>
          <button className="secondary-button" disabled={action.pending || !importJobId} onClick={() => jobCommand(context.services.imports.start, 'Import started')} type="button">Start</button>
          <button className="secondary-button" disabled={action.pending || !importJobId} onClick={() => jobCommand(context.services.imports.complete, 'Import completed')} type="button">Complete</button>
          <button className="secondary-button" disabled={action.pending || !importJobId} onClick={() => jobCommand(context.services.imports.fail, 'Import failed')} type="button">Fail</button>
          <button className="icon-button danger" disabled={action.pending || !importJobId} onClick={() => jobCommand(context.services.imports.cancel, 'Import canceled')} title="Cancel import" type="button"><FiX /></button>
        </div>
      </Panel>
      <Panel title="Import Records" icon={<FiEye />} wide>
        <ErrorLine message={action.error} />
        <div className="data-columns two no-margin">
          <DetailLinkGrid title="Import Job Routes" items={jobs} basePath="/imports/jobs" />
          <DetailLinkGrid title="Template Routes" items={templates} basePath="/imports/templates" />
        </div>
        <JsonRecordEditor
          records={transformPresets}
          title="Transform Presets"
          onDelete={(record) => context.services.imports.deleteTransformPreset(record.id)}
          onSave={(record, draft) => context.services.imports.updateTransformPreset(record.id, pick(draft, ['name', 'description', 'transformationConfig', 'enabled']))}
          onSuccess={load}
          action={action}
        />
        <div className="data-columns">
          <JsonPreview title="Jobs" value={jobs} />
          <JsonPreview title="Templates" value={templates} />
          <JsonPreview title="Transform Presets" value={transformPresets} />
          <JsonPreview title="Selected Job" value={selectedJob} />
          <JsonPreview title="Parse Result" value={parseResult} />
          <JsonPreview title="Materialize Result" value={materializeResult} />
          <JsonPreview title="Materialization Runs" value={materializationRuns} />
          <JsonPreview title="Records" value={records} />
        </div>
      </Panel>
    </div>
  );
};
