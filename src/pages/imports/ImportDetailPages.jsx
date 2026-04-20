import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiActivity, FiCheck, FiDatabase, FiEye, FiPlus, FiRefreshCw, FiSliders, FiUploadCloud, FiX } from 'react-icons/fi';
import { DetailLayout } from '../../components/DetailLayout';
import { ErrorLine } from '../../components/ErrorLine';
import { Field } from '../../components/Field';
import { JsonPreview } from '../../components/JsonPreview';
import { Panel } from '../../components/Panel';
import { RecordSelect } from '../../components/RecordSelect';
import { SelectField } from '../../components/SelectField';
import { TextField } from '../../components/TextField';
import { useApiAction } from '../../hooks/useApiAction';
import { firstId, numberOrUndefined, parseJsonOrThrow, toJsonText } from '../../utils/forms';
import { ImportConflictDetails } from './ImportConflictDetails';
import { ImportRecordEditor } from './ImportRecordEditor';
import {
  ImportConflictResolutionJobsTable,
  ImportExportJobsTable,
  ImportJobVersionDiffTable,
} from './ImportReviewTables';
import { TransformPipelineEditor } from './TransformPipelineEditor';
import { importRecordFormToRequest, importRecordToForm } from './importRecordForms';

const openConflictCompletionPhrase = 'COMPLETE WITH OPEN CONFLICTS';

export const ImportJobDetailPage = ({ context }) => {
  const { importJobId } = useParams();
  const action = useApiAction(context.addToast);
  const [job, setJob] = useState(null);
  const [records, setRecords] = useState([]);
  const [recordVersions, setRecordVersions] = useState([]);
  const [recordVersionDiffs, setRecordVersionDiffs] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [conflictResolutionJobs, setConflictResolutionJobs] = useState([]);
  const [conflictResolutionJobId, setConflictResolutionJobId] = useState('');
  const [materializationRuns, setMaterializationRuns] = useState([]);
  const [jobVersionDiffs, setJobVersionDiffs] = useState(null);
  const [jobVersionDiffExport, setJobVersionDiffExport] = useState(null);
  const [jobVersionDiffExportJob, setJobVersionDiffExportJob] = useState(null);
  const [exportJobs, setExportJobs] = useState([]);
  const [conflictResolutionWorkerResult, setConflictResolutionWorkerResult] = useState(null);
  const [materializeResult, setMaterializeResult] = useState(null);
  const [recordEditForm, setRecordEditForm] = useState(importRecordToForm());
  const [conflictForm, setConflictForm] = useState({ recordId: '', resolution: 'create_new' });
  const [rerunForm, setRerunForm] = useState({ materializationRunId: '', limit: '25', updateExisting: 'source' });
  const selectedConflict = conflicts.find((record) => record.id === conflictForm.recordId) || null;
  const selectedImportRecord = records.find((record) => record.id === recordEditForm.recordId) || null;

  const syncRecordEditForm = async (recordRows) => {
    const rows = recordRows || [];
    const selected = rows.find((record) => record.id === recordEditForm.recordId) || rows[0] || null;
    setRecordEditForm(importRecordToForm(selected));
    if (selected?.id) {
      const versionResult = await action.run(() => Promise.all([
        context.services.imports.listRecordVersions(selected.id),
        context.services.imports.listRecordVersionDiffs(selected.id),
      ]));
      const [versions, diffs] = versionResult || [];
      setRecordVersions(versions || []);
      setRecordVersionDiffs(diffs || []);
    } else {
      setRecordVersions([]);
      setRecordVersionDiffs([]);
    }
  };

  const load = async () => {
    const result = await action.run(() => Promise.all([
      context.services.imports.getJob(importJobId),
      context.services.imports.listRecords(importJobId),
      context.services.imports.listConflicts(importJobId),
      context.services.imports.listConflictResolutionJobs(importJobId),
      context.services.imports.listJobVersionDiffs(importJobId),
      context.services.imports.listMaterializationRuns(importJobId),
      context.workspaceId ? context.services.imports.listExportJobs(context.workspaceId, { exportType: 'import_job_version_diffs', limit: 20 }) : Promise.resolve({ items: [] }),
    ]));
    if (result) {
      const [jobRow, recordRows, conflictRows, resolutionJobRows, jobDiffRows, runRows, exportJobPage] = result;
      setJob(jobRow);
      setRecords(recordRows || []);
      setConflicts(conflictRows || []);
      setConflictResolutionJobs(resolutionJobRows || []);
      setJobVersionDiffs(jobDiffRows || null);
      setJobVersionDiffExport(null);
      setJobVersionDiffExportJob(null);
      setExportJobs(exportJobPage?.items || exportJobPage || []);
      setMaterializationRuns(runRows || []);
      await syncRecordEditForm(recordRows);
      setConflictForm((current) => ({ ...current, recordId: firstId(conflictRows) }));
      setConflictResolutionJobId((current) => (resolutionJobRows || []).some((jobRow) => jobRow.id === current) ? current : firstId(resolutionJobRows));
      setRerunForm((current) => ({ ...current, materializationRunId: firstId(runRows) }));
    }
  };

  useEffect(() => {
    load();
  }, [importJobId]);

  const command = async (fn, success, request) => {
    await action.run(() => fn(importJobId, request), success);
    await load();
  };

  const completeImportJob = async () => {
    const hasOpenConflicts = conflicts.length > 0;
    let request;
    if (hasOpenConflicts) {
      const confirmation = window.prompt(`Type ${openConflictCompletionPhrase} to complete with open conflicts.`);
      if (confirmation !== openConflictCompletionPhrase) {
        action.setError('Open-conflict completion confirmation did not match');
        return;
      }
      const reason = window.prompt('Enter an audit reason for completing with open conflicts.');
      if (!reason?.trim()) {
        action.setError('Open-conflict completion requires an audit reason');
        return;
      }
      request = {
        acceptOpenConflicts: true,
        openConflictConfirmation: confirmation,
        openConflictReason: reason.trim(),
      };
    }
    await command(context.services.imports.complete, 'Import completed', request);
  };

  const resolveConflict = async (event) => {
    event.preventDefault();
    await action.run(() => context.services.imports.resolveConflict(conflictForm.recordId, {
      resolution: conflictForm.resolution,
    }), 'Import conflict resolved');
    await load();
  };

  const rerunMaterialization = async (event) => {
    event.preventDefault();
    const result = await action.run(() => context.services.imports.rerunMaterialization(rerunForm.materializationRunId, {
      limit: numberOrUndefined(rerunForm.limit),
      updateExisting: rerunForm.updateExisting === 'source' ? undefined : rerunForm.updateExisting === 'true',
    }), 'Materialization rerun completed');
    if (result) {
      setMaterializeResult(result);
      await load();
    }
  };

  const runConflictResolutionJob = async () => {
    if (!conflictResolutionJobId) {
      action.setError('Conflict resolution job is required');
      return;
    }
    await action.run(() => context.services.imports.runConflictResolutionJob(conflictResolutionJobId), 'Conflict resolution job ran');
    await load();
  };

  const cancelConflictResolutionJob = async () => {
    if (!conflictResolutionJobId) {
      action.setError('Conflict resolution job is required');
      return;
    }
    await action.run(() => context.services.imports.cancelConflictResolutionJob(conflictResolutionJobId), 'Conflict resolution job canceled');
    await load();
  };

  const retryConflictResolutionJob = async () => {
    if (!conflictResolutionJobId) {
      action.setError('Conflict resolution job is required');
      return;
    }
    await action.run(() => context.services.imports.retryConflictResolutionJob(conflictResolutionJobId), 'Conflict resolution job retried');
    await load();
  };

  const processConflictResolutionJobs = async () => {
    if (!context.workspaceId) {
      action.setError('Workspace ID is required');
      return;
    }
    const result = await action.run(() => context.services.imports.processConflictResolutionJobs(context.workspaceId, { limit: 10 }), 'Queued conflict jobs processed');
    if (result) {
      setConflictResolutionWorkerResult(result);
      await load();
    }
  };

  const loadJobVersionDiffExport = async () => {
    const exported = await action.run(() => context.services.imports.exportJobVersionDiffs(importJobId), 'Job diff export loaded');
    if (exported) {
      setJobVersionDiffExport(exported);
    }
  };

  const createJobVersionDiffExportJob = async () => {
    const exportJob = await action.run(() => context.services.imports.createJobVersionDiffExportJob(importJobId), 'Job diff export artifact created');
    if (exportJob) {
      setJobVersionDiffExportJob(exportJob);
      if (context.workspaceId) {
        const exportJobPage = await action.run(() => context.services.imports.listExportJobs(context.workspaceId, { exportType: 'import_job_version_diffs', limit: 20 }));
        setExportJobs(exportJobPage?.items || exportJobPage || []);
      }
    }
  };

  const downloadExportJob = async (exportJob) => {
    if (!context.workspaceId || !exportJob?.id) {
      action.setError('Export job is required');
      return;
    }
    const blob = await action.run(() => context.services.imports.downloadExportJob(context.workspaceId, exportJob.id), 'Export artifact downloaded');
    if (blob) {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = exportJob.filename || 'trasck-export.json';
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const selectRecordForEdit = async (recordId) => {
    const selected = records.find((record) => record.id === recordId) || null;
    setRecordEditForm(importRecordToForm(selected));
    if (selected?.id) {
      const versionResult = await action.run(() => Promise.all([
        context.services.imports.listRecordVersions(selected.id),
        context.services.imports.listRecordVersionDiffs(selected.id),
      ]));
      const [versions, diffs] = versionResult || [];
      setRecordVersions(versions || []);
      setRecordVersionDiffs(diffs || []);
    } else {
      setRecordVersions([]);
      setRecordVersionDiffs([]);
    }
  };

  const updateRecord = async (event) => {
    event.preventDefault();
    const saved = await action.run(() => context.services.imports.updateRecord(recordEditForm.recordId, importRecordFormToRequest(recordEditForm, parseJsonOrThrow)), 'Record saved');
    if (saved) {
      setRecordEditForm(importRecordToForm(saved));
      const versionResult = await action.run(() => Promise.all([
        context.services.imports.listRecordVersions(saved.id),
        context.services.imports.listRecordVersionDiffs(saved.id),
      ]));
      const [versions, diffs] = versionResult || [];
      setRecordVersions(versions || []);
      setRecordVersionDiffs(diffs || []);
      await load();
    }
  };

  return (
    <DetailLayout backTo="/imports" title="Import Job Detail">
      <Panel title="Lifecycle" icon={<FiUploadCloud />}>
        <div className="button-row wrap">
          <button className="secondary-button" disabled={action.pending} onClick={load} type="button"><FiRefreshCw />Reload</button>
          <button className="secondary-button" disabled={action.pending} onClick={() => command(context.services.imports.start, 'Import started')} type="button">Start</button>
          <button className="secondary-button" disabled={action.pending} onClick={completeImportJob} type="button">Complete</button>
          <button className="secondary-button" disabled={action.pending} onClick={() => command(context.services.imports.fail, 'Import failed')} type="button">Fail</button>
          <button className="icon-button danger" disabled={action.pending} onClick={() => command(context.services.imports.cancel, 'Import canceled')} title="Cancel import" type="button"><FiX /></button>
        </div>
        <ErrorLine message={action.error} />
      </Panel>
      <Panel title="Conflict Review" icon={<FiDatabase />}>
        <form className="stack" onSubmit={resolveConflict}>
          <RecordSelect label="Open conflict" records={conflicts} value={conflictForm.recordId} onChange={(recordId) => setConflictForm({ ...conflictForm, recordId })} />
          <SelectField label="Resolution" value={conflictForm.resolution} onChange={(resolution) => setConflictForm({ ...conflictForm, resolution })} options={['create_new', 'update_existing', 'skip']} />
          <ImportConflictDetails conflict={selectedConflict} resolution={conflictForm.resolution} />
          <button className="secondary-button" disabled={action.pending || !conflictForm.recordId} type="submit"><FiCheck />Resolve</button>
        </form>
      </Panel>
      <Panel title="Conflict Jobs" icon={<FiActivity />}>
        <RecordSelect label="Resolution job" records={conflictResolutionJobs} value={conflictResolutionJobId} onChange={setConflictResolutionJobId} />
        <div className="button-row wrap">
          <button className="secondary-button" disabled={action.pending || !conflictResolutionJobId} onClick={runConflictResolutionJob} type="button"><FiActivity />Run job</button>
          <button className="secondary-button" disabled={action.pending || !conflictResolutionJobId} onClick={retryConflictResolutionJob} type="button"><FiRefreshCw />Retry job</button>
          <button className="secondary-button" disabled={action.pending || !context.workspaceId} onClick={processConflictResolutionJobs} type="button"><FiActivity />Process queued</button>
          <button className="icon-button danger" disabled={action.pending || !conflictResolutionJobId} onClick={cancelConflictResolutionJob} title="Cancel conflict resolution job" type="button"><FiX /></button>
        </div>
        <JsonPreview title="Worker Result" value={conflictResolutionWorkerResult} />
        <ImportConflictResolutionJobsTable jobs={conflictResolutionJobs} />
      </Panel>
      <Panel title="Rerun Snapshot" icon={<FiRefreshCw />}>
        <form className="stack" onSubmit={rerunMaterialization}>
          <RecordSelect label="Run" records={materializationRuns} value={rerunForm.materializationRunId} onChange={(materializationRunId) => setRerunForm({ ...rerunForm, materializationRunId })} />
          <TextField label="Limit" type="number" value={rerunForm.limit} onChange={(limit) => setRerunForm({ ...rerunForm, limit })} />
          <SelectField label="Update existing" value={rerunForm.updateExisting} onChange={(updateExisting) => setRerunForm({ ...rerunForm, updateExisting })} options={['source', 'true', 'false']} />
          <button className="secondary-button" disabled={action.pending || !rerunForm.materializationRunId} type="submit"><FiRefreshCw />Rerun</button>
        </form>
      </Panel>
      <Panel title="Record Review" icon={<FiEye />} wide>
        <ImportRecordEditor
          form={recordEditForm}
          onChange={setRecordEditForm}
          onSelect={selectRecordForEdit}
          onSubmit={updateRecord}
          pending={action.pending}
          records={records}
          selectedRecord={selectedImportRecord}
          versions={recordVersions}
          versionDiffs={recordVersionDiffs}
        />
      </Panel>
      <Panel title="Records" icon={<FiEye />} wide>
        <div className="button-row wrap">
          <button className="secondary-button" disabled={action.pending} onClick={loadJobVersionDiffExport} type="button"><FiEye />Load job diff export</button>
          <button className="secondary-button" disabled={action.pending} onClick={createJobVersionDiffExportJob} type="button"><FiPlus />Create export artifact</button>
        </div>
        <JsonPreview title="Job" value={job} />
        <JsonPreview title="Open Conflicts" value={conflicts} />
        <ImportConflictResolutionJobsTable jobs={conflictResolutionJobs} />
        <ImportJobVersionDiffTable diffs={jobVersionDiffs} />
        <ImportExportJobsTable jobs={exportJobs} onDownload={downloadExportJob} />
        <JsonPreview title="Job Version Diff Export" value={jobVersionDiffExport} />
        <JsonPreview title="Job Version Diff Export Artifact" value={jobVersionDiffExportJob} />
        <JsonPreview title="Materialization Runs" value={materializationRuns} />
        <JsonPreview title="Materialize Result" value={materializeResult} />
        <JsonPreview title="Records" value={records} />
      </Panel>
    </DetailLayout>
  );
};

export const ImportTemplateDetailPage = ({ context }) => {
  const { mappingTemplateId } = useParams();
  const navigate = useNavigate();
  const action = useApiAction(context.addToast);
  const [template, setTemplate] = useState(null);
  const [lookups, setLookups] = useState([]);
  const [typeTranslations, setTypeTranslations] = useState([]);
  const [statusTranslations, setStatusTranslations] = useState([]);
  const [form, setForm] = useState({ name: '', provider: 'csv', sourceType: '', workItemTypeKey: '', statusKey: '', fieldMappingText: '{}', defaultsText: '{}', transformationConfigText: '{}', enabled: 'true' });
  const [lookupForm, setLookupForm] = useState({ sourceField: '', sourceValue: '', targetField: '', targetValueText: 'null' });
  const [typeForm, setTypeForm] = useState({ sourceTypeKey: '', targetTypeKey: '' });
  const [statusForm, setStatusForm] = useState({ sourceStatusKey: '', targetStatusKey: '' });

  const load = async () => {
    const result = await action.run(() => Promise.all([
      context.services.imports.listMappingTemplates(context.workspaceId),
      context.services.imports.listValueLookups(mappingTemplateId),
      context.services.imports.listTypeTranslations(mappingTemplateId),
      context.services.imports.listStatusTranslations(mappingTemplateId),
    ]));
    if (result) {
      const [templates, lookupRows, typeRows, statusRows] = result;
      const selected = (templates || []).find((row) => row.id === mappingTemplateId) || null;
      setTemplate(selected);
      setLookups(lookupRows || []);
      setTypeTranslations(typeRows || []);
      setStatusTranslations(statusRows || []);
      if (selected) {
        setForm({
          name: selected.name || '',
          provider: selected.provider || 'csv',
          sourceType: selected.sourceType || '',
          workItemTypeKey: selected.workItemTypeKey || '',
          statusKey: selected.statusKey || '',
          fieldMappingText: toJsonText(selected.fieldMapping || {}),
          defaultsText: toJsonText(selected.defaults || {}),
          transformationConfigText: toJsonText(selected.transformationConfig || {}),
          enabled: String(selected.enabled ?? true),
        });
      }
    }
  };

  useEffect(() => {
    load();
  }, [mappingTemplateId, context.workspaceId]);

  const save = async (event) => {
    event.preventDefault();
    const saved = await action.run(() => context.services.imports.updateMappingTemplate(mappingTemplateId, {
      name: form.name,
      provider: form.provider,
      sourceType: form.sourceType || undefined,
      targetType: 'work_item',
      projectId: context.projectId || template?.projectId,
      workItemTypeKey: form.workItemTypeKey || undefined,
      statusKey: form.statusKey || undefined,
      fieldMapping: parseJsonOrThrow(form.fieldMappingText),
      defaults: parseJsonOrThrow(form.defaultsText),
      transformationConfig: parseJsonOrThrow(form.transformationConfigText),
      enabled: form.enabled === 'true',
    }), 'Mapping template saved');
    if (saved) {
      await load();
    }
  };

  const disable = async () => {
    await action.run(() => context.services.imports.deleteMappingTemplate(mappingTemplateId), 'Template disabled');
    navigate('/imports');
  };

  const createLookup = async (event) => {
    event.preventDefault();
    await action.run(() => context.services.imports.createValueLookup(mappingTemplateId, {
      sourceField: lookupForm.sourceField,
      sourceValue: lookupForm.sourceValue,
      targetField: lookupForm.targetField,
      targetValue: parseJsonOrThrow(lookupForm.targetValueText),
      enabled: true,
    }), 'Lookup added');
    await load();
  };

  const createTypeTranslation = async (event) => {
    event.preventDefault();
    await action.run(() => context.services.imports.createTypeTranslation(mappingTemplateId, { ...typeForm, enabled: true }), 'Type translation added');
    await load();
  };

  const createStatusTranslation = async (event) => {
    event.preventDefault();
    await action.run(() => context.services.imports.createStatusTranslation(mappingTemplateId, { ...statusForm, enabled: true }), 'Status translation added');
    await load();
  };

  return (
    <DetailLayout backTo="/imports" title="Import Template Detail">
      <Panel title="Template" icon={<FiSliders />}>
        <form className="stack" onSubmit={save}>
          <TextField label="Name" value={form.name} onChange={(name) => setForm({ ...form, name })} />
          <SelectField label="Provider" value={form.provider} onChange={(provider) => setForm({ ...form, provider })} options={['csv', 'jira', 'rally']} />
          <TextField label="Source type" value={form.sourceType} onChange={(sourceType) => setForm({ ...form, sourceType })} />
          <TextField label="Type fallback" value={form.workItemTypeKey} onChange={(workItemTypeKey) => setForm({ ...form, workItemTypeKey })} />
          <TextField label="Status fallback" value={form.statusKey} onChange={(statusKey) => setForm({ ...form, statusKey })} />
          <SelectField label="Enabled" value={form.enabled} onChange={(enabled) => setForm({ ...form, enabled })} options={['true', 'false']} />
          <Field label="Field mapping JSON">
            <textarea value={form.fieldMappingText} onChange={(event) => setForm({ ...form, fieldMappingText: event.target.value })} rows={6} spellCheck="false" />
          </Field>
          <Field label="Defaults JSON">
            <textarea value={form.defaultsText} onChange={(event) => setForm({ ...form, defaultsText: event.target.value })} rows={4} spellCheck="false" />
          </Field>
          <TransformPipelineEditor label="Transformations" value={form.transformationConfigText} onChange={(transformationConfigText) => setForm({ ...form, transformationConfigText })} />
          <div className="button-row wrap">
            <button className="primary-button" disabled={action.pending} type="submit"><FiCheck />Save</button>
            <button className="icon-button danger" disabled={action.pending} onClick={disable} title="Disable template" type="button"><FiX /></button>
            <button className="secondary-button" disabled={action.pending} onClick={load} type="button"><FiRefreshCw />Reload</button>
          </div>
        </form>
        <ErrorLine message={action.error} />
      </Panel>
      <Panel title="Mapping Rules" icon={<FiDatabase />} wide>
        <div className="data-columns two no-margin">
          <form className="stack" onSubmit={createLookup}>
            <TextField label="Source field" value={lookupForm.sourceField} onChange={(sourceField) => setLookupForm({ ...lookupForm, sourceField })} />
            <TextField label="Source value" value={lookupForm.sourceValue} onChange={(sourceValue) => setLookupForm({ ...lookupForm, sourceValue })} />
            <TextField label="Target field" value={lookupForm.targetField} onChange={(targetField) => setLookupForm({ ...lookupForm, targetField })} />
            <TextField label="Target value JSON" value={lookupForm.targetValueText} onChange={(targetValueText) => setLookupForm({ ...lookupForm, targetValueText })} />
            <button className="secondary-button" disabled={action.pending} type="submit"><FiPlus />Add lookup</button>
          </form>
          <div className="stack">
            <form className="stack" onSubmit={createTypeTranslation}>
              <TextField label="Source type" value={typeForm.sourceTypeKey} onChange={(sourceTypeKey) => setTypeForm({ ...typeForm, sourceTypeKey })} />
              <TextField label="Target type" value={typeForm.targetTypeKey} onChange={(targetTypeKey) => setTypeForm({ ...typeForm, targetTypeKey })} />
              <button className="secondary-button" disabled={action.pending} type="submit"><FiPlus />Add type</button>
            </form>
            <form className="stack nested-form" onSubmit={createStatusTranslation}>
              <TextField label="Source status" value={statusForm.sourceStatusKey} onChange={(sourceStatusKey) => setStatusForm({ ...statusForm, sourceStatusKey })} />
              <TextField label="Target status" value={statusForm.targetStatusKey} onChange={(targetStatusKey) => setStatusForm({ ...statusForm, targetStatusKey })} />
              <button className="secondary-button" disabled={action.pending} type="submit"><FiPlus />Add status</button>
            </form>
          </div>
        </div>
        <div className="data-columns">
          <JsonPreview title="Lookups" value={lookups} />
          <JsonPreview title="Type Translations" value={typeTranslations} />
          <JsonPreview title="Status Translations" value={statusTranslations} />
          <JsonPreview title="Template" value={template} />
        </div>
      </Panel>
    </DetailLayout>
  );
};
