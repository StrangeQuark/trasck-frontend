import { useState } from 'react';
import { FiActivity, FiArrowRight, FiCheck, FiDatabase, FiEye, FiPlus, FiRefreshCw, FiSliders, FiUploadCloud, FiX } from 'react-icons/fi';
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
import { ImportConflictDetails } from './ImportConflictDetails';
import { ImportRecordEditor } from './ImportRecordEditor';
import {
  ImportCompletionMetricsTable,
  ImportConflictResolutionJobsTable,
  ImportExportJobsTable,
  ImportJobVersionDiffTable,
} from './ImportReviewTables';
import { TransformPipelineEditor } from './TransformPipelineEditor';
import { importRecordFormToRequest, importRecordToForm } from './importRecordForms';

const selectedIdOrFirst = (records, selectedId) => {
  const rows = records || [];
  return rows.some((record) => record.id === selectedId) ? selectedId : firstId(rows);
};

const selectedRecordFromRows = (records, preferredRecordId, currentRecordId) => {
  const rows = records || [];
  return rows.find((record) => record.id === preferredRecordId)
    || rows.find((record) => record.id === currentRecordId)
    || rows[0]
    || null;
};

const filterRequest = (filters) => ({
  status: filters.status || undefined,
  conflictStatus: filters.conflictStatus || undefined,
  sourceType: filters.sourceType || undefined,
});

const pageItems = (page) => (Array.isArray(page) ? page : page?.items || []);

const openConflictCompletionPhrase = 'COMPLETE WITH OPEN CONFLICTS';
const filteredConflictResolutionPhrase = 'RESOLVE FILTERED CONFLICTS';

export const ImportsPage = ({ context }) => {
  const [jobs, setJobs] = useState([]);
  const [importJobId, setImportJobId] = useState('');
  const [importSettings, setImportSettings] = useState(null);
  const [samples, setSamples] = useState([]);
  const [sampleResult, setSampleResult] = useState(null);
  const [sampleSettingsForm, setSampleSettingsForm] = useState({ sampleJobsEnabled: 'true' });
  const [sampleForm, setSampleForm] = useState({ sampleKey: 'csv', createMappingTemplate: 'true' });
  const [templates, setTemplates] = useState([]);
  const [mappingTemplateId, setMappingTemplateId] = useState('');
  const [transformPresets, setTransformPresets] = useState([]);
  const [transformPresetId, setTransformPresetId] = useState('');
  const [transformPresetVersions, setTransformPresetVersions] = useState([]);
  const [records, setRecords] = useState([]);
  const [recordVersions, setRecordVersions] = useState([]);
  const [recordVersionDiffs, setRecordVersionDiffs] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [conflictResolutionJobs, setConflictResolutionJobs] = useState([]);
  const [workspaceConflictResolutionJobs, setWorkspaceConflictResolutionJobs] = useState([]);
  const [conflictResolutionJobId, setConflictResolutionJobId] = useState('');
  const [conflictResolutionJobStatus, setConflictResolutionJobStatus] = useState('');
  const [conflictResolutionWorkerResult, setConflictResolutionWorkerResult] = useState(null);
  const [reviewExportWorkerResult, setReviewExportWorkerResult] = useState(null);
  const [materializationRuns, setMaterializationRuns] = useState([]);
  const [jobVersionDiffs, setJobVersionDiffs] = useState(null);
  const [jobVersionDiffExport, setJobVersionDiffExport] = useState(null);
  const [jobVersionDiffExportJob, setJobVersionDiffExportJob] = useState(null);
  const [exportJobs, setExportJobs] = useState([]);
  const [projectImportCompletions, setProjectImportCompletions] = useState(null);
  const [workspaceImportCompletions, setWorkspaceImportCompletions] = useState(null);
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
    contentType: 'text/csv',
    content: 'key,title,type\nTRASCK-1,Imported story,story',
  });
  const [materializeForm, setMaterializeForm] = useState({ limit: '25', updateExisting: 'false' });
  const [recordForm, setRecordForm] = useState({ sourceType: 'issue', sourceId: 'MANUAL-1', targetType: 'work_item', targetId: '', rawPayloadText: '{}' });
  const [recordEditForm, setRecordEditForm] = useState(importRecordToForm());
  const [recordFilters, setRecordFilters] = useState({ status: '', conflictStatus: '', sourceType: '' });
  const [cloneForm, setCloneForm] = useState({ versionId: '', name: '', enabled: 'true' });
  const [retargetForm, setRetargetForm] = useState({ versionId: '', name: '', enabled: 'true', mappingTemplateIds: [] });
  const [retargetPreview, setRetargetPreview] = useState(null);
  const [conflictForm, setConflictForm] = useState({ recordId: '', resolution: 'create_new' });
  const [bulkConflictIds, setBulkConflictIds] = useState([]);
  const [filteredConflictPreview, setFilteredConflictPreview] = useState(null);
  const [rerunForm, setRerunForm] = useState({ materializationRunId: '', limit: '25', updateExisting: 'source' });
  const action = useApiAction(context.addToast);
  const selectedConflict = conflicts.find((record) => record.id === conflictForm.recordId) || null;
  const selectedImportRecord = records.find((record) => record.id === recordEditForm.recordId) || null;

  const syncRecordEditForm = async (recordRows, preferredRecordId) => {
    const selected = selectedRecordFromRows(recordRows, preferredRecordId, recordEditForm.recordId);
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

  const load = async (selection = {}) => {
    if (!context.workspaceId) {
      action.setError('Workspace ID is required');
      return;
    }
    const result = await action.run(async () => {
      const [jobRows, importSettingsRow, sampleRows, templateRows, presetRows] = await Promise.all([
        context.services.imports.listJobs(context.workspaceId),
        context.services.imports.getSettings(context.workspaceId),
        context.services.imports.listSamples(context.workspaceId).catch(() => []),
        context.services.imports.listMappingTemplates(context.workspaceId),
        context.services.imports.listTransformPresets(context.workspaceId),
      ]);
      const nextJobId = selection.importJobId || importJobId || firstId(jobRows);
      const nextTemplateId = selection.mappingTemplateId || mappingTemplateId || firstId(templateRows);
      const nextPresetId = selection.transformPresetId || transformPresetId || firstId(presetRows);
      const [job, recordRows, conflictRows, resolutionJobRows, jobDiffRows, runRows, versionRows, workspaceResolutionJobRows, exportJobPage, projectImportMetrics, workspaceImportMetrics] = await Promise.all([
        nextJobId ? context.services.imports.getJob(nextJobId) : Promise.resolve(null),
        nextJobId ? context.services.imports.listRecords(nextJobId, filterRequest(recordFilters)) : Promise.resolve([]),
        nextJobId ? context.services.imports.listConflicts(nextJobId) : Promise.resolve([]),
        nextJobId ? context.services.imports.listConflictResolutionJobs(nextJobId) : Promise.resolve([]),
        nextJobId ? context.services.imports.listJobVersionDiffs(nextJobId) : Promise.resolve(null),
        nextJobId ? context.services.imports.listMaterializationRuns(nextJobId) : Promise.resolve([]),
        nextPresetId ? context.services.imports.listTransformPresetVersions(nextPresetId) : Promise.resolve([]),
        context.services.imports.listWorkspaceConflictResolutionJobs(context.workspaceId, { status: conflictResolutionJobStatus || undefined }),
        context.services.imports.listExportJobs(context.workspaceId, { exportType: 'import_job_version_diffs', limit: 20 }),
        context.projectId ? context.services.dashboards.projectImportCompletions(context.projectId) : Promise.resolve(null),
        context.services.dashboards.workspaceImportCompletions(context.workspaceId),
      ]);
      return { jobRows, importSettingsRow, sampleRows, templateRows, presetRows, nextJobId, nextTemplateId, nextPresetId, job, recordRows, conflictRows, resolutionJobRows, jobDiffRows, runRows, versionRows, workspaceResolutionJobRows, exportJobPage, projectImportMetrics, workspaceImportMetrics };
    });
    if (result) {
      setJobs(result.jobRows || []);
      setImportSettings(result.importSettingsRow || null);
      setSampleSettingsForm({ sampleJobsEnabled: String(result.importSettingsRow?.sampleJobsEnabled ?? true) });
      setSamples(result.sampleRows || []);
      setSampleForm((current) => ({ ...current, sampleKey: current.sampleKey || result.sampleRows?.[0]?.key || 'csv' }));
      setTemplates(result.templateRows || []);
      setTransformPresets(result.presetRows || []);
      setImportJobId(result.nextJobId || '');
      setMappingTemplateId(result.nextTemplateId || '');
      setTransformPresetId(result.nextPresetId || '');
      setSelectedJob(result.job || null);
      setRecords(result.recordRows || []);
      setConflicts(result.conflictRows || []);
      setConflictResolutionJobs(result.resolutionJobRows || []);
      setWorkspaceConflictResolutionJobs(result.workspaceResolutionJobRows || []);
      setJobVersionDiffs(result.jobDiffRows || null);
      setJobVersionDiffExport(null);
      setJobVersionDiffExportJob(null);
      setExportJobs(pageItems(result.exportJobPage));
      setProjectImportCompletions(result.projectImportMetrics || null);
      setWorkspaceImportCompletions(result.workspaceImportMetrics || null);
      setMaterializationRuns(result.runRows || []);
      setTransformPresetVersions(result.versionRows || []);
      await syncRecordEditForm(result.recordRows);
      setConflictForm((current) => ({ ...current, recordId: selectedIdOrFirst(result.conflictRows, current.recordId) }));
      setConflictResolutionJobId((current) => selectedIdOrFirst(result.resolutionJobRows, current));
      setBulkConflictIds((current) => current.filter((recordId) => (result.conflictRows || []).some((record) => record.id === recordId)));
      setRerunForm((current) => ({ ...current, materializationRunId: selectedIdOrFirst(result.runRows, current.materializationRunId) }));
      setCloneForm((current) => ({ ...current, versionId: selectedIdOrFirst(result.versionRows, current.versionId) }));
      setRetargetForm((current) => ({ ...current, versionId: selectedIdOrFirst(result.versionRows, current.versionId) }));
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
      await load({ importJobId: job.id || '' });
    }
  };

  const createSampleJob = async (event) => {
    event.preventDefault();
    const result = await action.run(() => context.services.imports.createSampleJob(context.workspaceId, sampleForm.sampleKey, {
      projectId: context.projectId || undefined,
      createMappingTemplate: sampleForm.createMappingTemplate === 'true',
    }), 'Sample import job created');
    if (result) {
      setSampleResult(result);
      setImportJobId(result.importJob?.id || '');
      if (result.mappingTemplate?.id) {
        setMappingTemplateId(result.mappingTemplate.id);
      }
      if (result.transformPreset?.id) {
        setTransformPresetId(result.transformPreset.id);
      }
      await load({
        importJobId: result.importJob?.id || '',
        mappingTemplateId: result.mappingTemplate?.id || '',
        transformPresetId: result.transformPreset?.id || '',
      });
    }
  };

  const saveImportSettings = async () => {
    const settings = await action.run(() => context.services.imports.updateSettings(context.workspaceId, {
      sampleJobsEnabled: sampleSettingsForm.sampleJobsEnabled === 'true',
    }), 'Import settings saved');
    if (settings) {
      setImportSettings(settings);
      setSampleSettingsForm({ sampleJobsEnabled: String(settings.sampleJobsEnabled ?? false) });
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
      await load({ mappingTemplateId: template.id || '' });
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
      await load({ transformPresetId: preset.id || '' });
    }
  };

  const parseJob = async (event) => {
    event.preventDefault();
    const parsed = await action.run(() => context.services.imports.parse(importJobId, {
      content: parseForm.content,
      sourceType: parseForm.sourceType || undefined,
      contentType: parseForm.contentType || undefined,
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
    const record = await action.run(() => context.services.imports.createRecord(importJobId, {
      sourceType: recordForm.sourceType,
      sourceId: recordForm.sourceId,
      targetType: recordForm.targetType || undefined,
      targetId: recordForm.targetId || undefined,
      rawPayload: parseJsonOrThrow(recordForm.rawPayloadText),
    }), 'Record created');
    if (record) {
      setRecordEditForm(importRecordToForm(record));
    }
    await loadRecords(record?.id);
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
    }
    await loadRecords();
  };

  const cloneTransformPresetVersion = async (event) => {
    event.preventDefault();
    const preset = await action.run(() => context.services.imports.cloneTransformPresetVersion(transformPresetId, cloneForm.versionId, {
      name: cloneForm.name || undefined,
      enabled: cloneForm.enabled === 'true',
    }), 'Transform preset cloned');
    if (preset) {
      setTransformPresetId(preset.id || '');
      setCloneForm((current) => ({ ...current, name: '', versionId: '' }));
      await load({ transformPresetId: preset.id || '' });
    }
  };

  const retargetRequest = () => ({
    name: retargetForm.name || undefined,
    enabled: retargetForm.enabled === 'true',
    mappingTemplateIds: retargetForm.mappingTemplateIds,
  });

  const toggleRetargetTemplate = (templateId) => {
    setRetargetPreview(null);
    setRetargetForm((current) => ({
      ...current,
      mappingTemplateIds: current.mappingTemplateIds.includes(templateId)
        ? current.mappingTemplateIds.filter((id) => id !== templateId)
        : [...current.mappingTemplateIds, templateId],
    }));
  };

  const previewRetarget = async (event) => {
    event.preventDefault();
    const preview = await action.run(() => context.services.imports.previewCloneRetargetTransformPresetVersion(transformPresetId, retargetForm.versionId, retargetRequest()), 'Retarget preview ready');
    if (preview) {
      setRetargetPreview(preview);
    }
  };

  const applyRetarget = async () => {
    const applied = await action.run(() => context.services.imports.cloneRetargetTransformPresetVersion(transformPresetId, retargetForm.versionId, retargetRequest()), 'Templates retargeted');
    if (applied?.clonedPreset?.id) {
      setTransformPresetId(applied.clonedPreset.id);
      setRetargetPreview(applied);
      await load({ transformPresetId: applied.clonedPreset.id });
    }
  };

  const resolveConflict = async (event) => {
    event.preventDefault();
    await action.run(() => context.services.imports.resolveConflict(conflictForm.recordId, {
      resolution: conflictForm.resolution,
    }), 'Import conflict resolved');
    await loadRecords();
  };

  const toggleBulkConflict = (recordId) => {
    setBulkConflictIds((current) => current.includes(recordId)
      ? current.filter((id) => id !== recordId)
      : [...current, recordId]);
  };

  const resolveSelectedConflicts = async () => {
    await action.run(() => context.services.imports.resolveConflicts(importJobId, {
      scope: 'selected',
      recordIds: bulkConflictIds,
      resolution: conflictForm.resolution,
    }), 'Import conflicts resolved');
    setBulkConflictIds([]);
    setFilteredConflictPreview(null);
    await loadRecords();
  };

  const filteredConflictRequest = () => ({
    scope: 'filtered',
    ...filterRequest({ ...recordFilters, conflictStatus: 'open' }),
    conflictStatus: 'open',
    resolution: conflictForm.resolution,
  });

  const previewFilteredConflicts = async () => {
    const preview = await action.run(() => context.services.imports.previewResolveConflicts(importJobId, filteredConflictRequest()), 'Filtered conflict preview ready');
    if (preview) {
      setFilteredConflictPreview(preview);
    }
    return preview;
  };

  const resolveFilteredConflicts = async () => {
    const preview = filteredConflictPreview || await previewFilteredConflicts();
    if (!preview?.matched) {
      action.setError('No filtered open conflicts are available to resolve');
      return;
    }
    const confirmation = window.prompt(`Type ${filteredConflictResolutionPhrase} to resolve ${preview.matched} filtered open conflicts.`);
    if (confirmation !== filteredConflictResolutionPhrase) {
      action.setError('Filtered conflict resolution confirmation did not match');
      return;
    }
    await action.run(() => context.services.imports.resolveConflicts(importJobId, {
      ...filteredConflictRequest(),
      expectedCount: preview.matched,
      confirmation,
    }), 'Filtered import conflicts resolved');
    setFilteredConflictPreview(null);
    await loadRecords();
  };

  const queueFilteredConflictResolutionJob = async () => {
    const preview = filteredConflictPreview || await previewFilteredConflicts();
    if (!preview?.matched) {
      action.setError('No filtered open conflicts are available to queue');
      return;
    }
    const confirmation = window.prompt(`Type ${filteredConflictResolutionPhrase} to queue ${preview.matched} filtered open conflicts.`);
    if (confirmation !== filteredConflictResolutionPhrase) {
      action.setError('Filtered conflict resolution confirmation did not match');
      return;
    }
    const job = await action.run(() => context.services.imports.createConflictResolutionJob(importJobId, {
      ...filteredConflictRequest(),
      expectedCount: preview.matched,
      confirmation,
    }), 'Conflict resolution job queued');
    if (job?.id) {
      setConflictResolutionJobId(job.id);
      await loadRecords();
    }
  };

  const runConflictResolutionJob = async () => {
    if (!conflictResolutionJobId) {
      action.setError('Conflict resolution job is required');
      return;
    }
    await action.run(() => context.services.imports.runConflictResolutionJob(conflictResolutionJobId), 'Conflict resolution job ran');
    await loadRecords();
  };

  const cancelConflictResolutionJob = async () => {
    if (!conflictResolutionJobId) {
      action.setError('Conflict resolution job is required');
      return;
    }
    await action.run(() => context.services.imports.cancelConflictResolutionJob(conflictResolutionJobId), 'Conflict resolution job canceled');
    await loadRecords();
  };

  const retryConflictResolutionJob = async () => {
    if (!conflictResolutionJobId) {
      action.setError('Conflict resolution job is required');
      return;
    }
    await action.run(() => context.services.imports.retryConflictResolutionJob(conflictResolutionJobId), 'Conflict resolution job retried');
    await loadRecords();
  };

  const processConflictResolutionJobs = async () => {
    if (!context.workspaceId) {
      action.setError('Workspace ID is required');
      return;
    }
    const result = await action.run(() => context.services.imports.processConflictResolutionJobs(context.workspaceId, { limit: 10 }), 'Queued conflict jobs processed');
    if (result) {
      setConflictResolutionWorkerResult(result);
      await loadRecords();
    }
  };

  const loadJobVersionDiffExport = async () => {
    if (!importJobId) {
      action.setError('Import job is required');
      return;
    }
    const exported = await action.run(() => context.services.imports.exportJobVersionDiffs(importJobId), 'Job diff export loaded');
    if (exported) {
      setJobVersionDiffExport(exported);
    }
  };

  const createJobVersionDiffExportJob = async (request = { format: 'json' }) => {
    if (!importJobId) {
      action.setError('Import job is required');
      return;
    }
    const exportJob = await action.run(() => context.services.imports.createJobVersionDiffExportJob(importJobId, request), 'Job diff export artifact created');
    if (exportJob) {
      setJobVersionDiffExportJob(exportJob);
      if (context.workspaceId) {
        const exportJobPage = await action.run(() => context.services.imports.listExportJobs(context.workspaceId, { exportType: 'import_job_version_diffs', limit: 20 }));
        setExportJobs(pageItems(exportJobPage));
      }
    }
  };

  const createJobVersionDiffCsvExportJob = ({ filter, filterColumn }) => createJobVersionDiffExportJob({
    format: 'csv',
    filter,
    filterColumn,
  });

  const createImportReviewCsvExportJob = async (request) => {
    if (!context.workspaceId) {
      action.setError('Workspace ID is required');
      return;
    }
    const exportJob = await action.run(() => context.services.imports.createReviewCsvExportJob(context.workspaceId, request), 'Import review export queued');
    if (exportJob) {
      setJobVersionDiffExportJob(exportJob);
      setExportJobs((current) => [exportJob, ...current.filter((job) => job.id !== exportJob.id)].slice(0, 20));
    }
  };

  const processReviewCsvExportJobs = async () => {
    if (!context.workspaceId) {
      action.setError('Workspace ID is required');
      return;
    }
    const result = await action.run(() => context.services.imports.processReviewCsvExportJobs(context.workspaceId, { limit: 10 }), 'Import review exports processed');
    if (result) {
      setReviewExportWorkerResult(result);
      setExportJobs((current) => [...(result.jobs || []), ...current.filter((job) => !(result.jobs || []).some((processed) => processed.id === job.id))].slice(0, 20));
    }
  };

  const createConflictJobsCsvExportJob = (scope = {}) => ({ filter, filterColumn }) => createImportReviewCsvExportJob({
    tableType: 'conflict_resolution_jobs',
    filter,
    filterColumn,
    ...scope,
  });

  const createExportJobsCsvExportJob = ({ filter, filterColumn }) => createImportReviewCsvExportJob({
    tableType: 'export_jobs',
    exportType: 'import_job_version_diffs',
    filter,
    filterColumn,
  });

  const createCompletionCsvExportJob = (tableType, extra = {}) => ({ filter, filterColumn }) => createImportReviewCsvExportJob({
    tableType,
    filter,
    filterColumn,
    ...extra,
  });

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

  const loadImportOpsAudit = async () => {
    if (!context.workspaceId) {
      action.setError('Workspace ID is required');
      return;
    }
    const result = await action.run(() => Promise.all([
      context.services.imports.listWorkspaceConflictResolutionJobs(context.workspaceId, { status: conflictResolutionJobStatus || undefined }),
      context.services.imports.listExportJobs(context.workspaceId, { exportType: 'import_job_version_diffs', limit: 20 }),
    ]));
    if (result) {
      const [workspaceResolutionJobRows, exportJobPage] = result;
      setWorkspaceConflictResolutionJobs(workspaceResolutionJobRows || []);
      setExportJobs(pageItems(exportJobPage));
    }
  };

  const rerunMaterialization = async (event) => {
    event.preventDefault();
    const result = await action.run(() => context.services.imports.rerunMaterialization(rerunForm.materializationRunId, {
      limit: numberOrUndefined(rerunForm.limit),
      updateExisting: rerunForm.updateExisting === 'source' ? undefined : rerunForm.updateExisting === 'true',
    }), 'Materialization rerun completed');
    if (result) {
      setMaterializeResult(result);
      await loadRecords();
    }
  };

  const loadRecords = async (preferredRecordId) => {
    if (!importJobId) {
      action.setError('Import job is required');
      return;
    }
    const result = await action.run(() => Promise.all([
      context.services.imports.getJob(importJobId),
      context.services.imports.listRecords(importJobId, filterRequest(recordFilters)),
      context.services.imports.listConflicts(importJobId),
      context.services.imports.listConflictResolutionJobs(importJobId),
      context.services.imports.listJobVersionDiffs(importJobId),
      context.services.imports.listMaterializationRuns(importJobId),
      context.workspaceId ? context.services.imports.listWorkspaceConflictResolutionJobs(context.workspaceId, { status: conflictResolutionJobStatus || undefined }) : Promise.resolve([]),
      context.workspaceId ? context.services.imports.listExportJobs(context.workspaceId, { exportType: 'import_job_version_diffs', limit: 20 }) : Promise.resolve({ items: [] }),
      context.projectId ? context.services.dashboards.projectImportCompletions(context.projectId) : Promise.resolve(null),
      context.workspaceId ? context.services.dashboards.workspaceImportCompletions(context.workspaceId) : Promise.resolve(null),
    ]));
    if (result) {
      const [job, rows, conflictRows, resolutionJobRows, jobDiffRows, runs, workspaceResolutionJobRows, exportJobPage, projectImportMetrics, workspaceImportMetrics] = result;
      setSelectedJob(job || null);
      setRecords(rows || []);
      setConflicts(conflictRows || []);
      setConflictResolutionJobs(resolutionJobRows || []);
      setWorkspaceConflictResolutionJobs(workspaceResolutionJobRows || []);
      setJobVersionDiffs(jobDiffRows || null);
      setJobVersionDiffExport(null);
      setJobVersionDiffExportJob(null);
      setExportJobs(pageItems(exportJobPage));
      setProjectImportCompletions(projectImportMetrics || null);
      setWorkspaceImportCompletions(workspaceImportMetrics || null);
      setMaterializationRuns(runs || []);
      await syncRecordEditForm(rows, preferredRecordId);
      setConflictForm((current) => ({ ...current, recordId: selectedIdOrFirst(conflictRows, current.recordId) }));
      setConflictResolutionJobId((current) => selectedIdOrFirst(resolutionJobRows, current));
      setBulkConflictIds((current) => current.filter((recordId) => (conflictRows || []).some((record) => record.id === recordId)));
      setFilteredConflictPreview(null);
      setRerunForm((current) => ({ ...current, materializationRunId: selectedIdOrFirst(runs, current.materializationRunId) }));
    }
  };

  const loadPresetVersions = async (presetId = transformPresetId) => {
    if (!presetId) {
      setTransformPresetVersions([]);
      return;
    }
    const versions = await action.run(() => context.services.imports.listTransformPresetVersions(presetId));
    if (versions) {
      setTransformPresetId(presetId);
      setTransformPresetVersions(versions || []);
      setCloneForm((current) => ({ ...current, versionId: selectedIdOrFirst(versions, current.versionId) }));
      setRetargetPreview(null);
      setRetargetForm((current) => ({ ...current, versionId: selectedIdOrFirst(versions, current.versionId) }));
    }
  };

  const jobCommand = async (command, success) => {
    await action.run(() => command(importJobId), success);
    await loadRecords();
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
    await action.run(() => context.services.imports.complete(importJobId, request), 'Import completed');
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
      <Panel title="Sample Walkthrough" icon={<FiDatabase />}>
        <div className="stack nested-form">
          <div className="two-column compact">
            <SelectField label="Sample jobs" value={sampleSettingsForm.sampleJobsEnabled} onChange={(sampleJobsEnabled) => setSampleSettingsForm({ sampleJobsEnabled })} options={['true', 'false']} />
            <button className="secondary-button" disabled={action.pending || !context.workspaceId} onClick={saveImportSettings} type="button"><FiCheck />Save setting</button>
          </div>
          <dl className="summary-rows">
            <div><dt>Deployment</dt><dd>{String(importSettings?.deploymentSampleJobsEnabled ?? false)}</dd></div>
            <div><dt>Available</dt><dd>{String(importSettings?.sampleJobsAvailable ?? false)}</dd></div>
          </dl>
        </div>
        <form className="stack" onSubmit={createSampleJob}>
          <SelectField label="Sample" value={sampleForm.sampleKey} onChange={(sampleKey) => setSampleForm({ ...sampleForm, sampleKey })} options={(samples.length ? samples : [{ key: 'csv' }, { key: 'jira' }, { key: 'rally' }]).map((sample) => sample.key)} />
          <SelectField label="Create mapping" value={sampleForm.createMappingTemplate} onChange={(createMappingTemplate) => setSampleForm({ ...sampleForm, createMappingTemplate })} options={['true', 'false']} />
          <button className="primary-button" disabled={action.pending || !context.workspaceId || !importSettings?.sampleJobsAvailable || (sampleForm.createMappingTemplate === 'true' && !context.projectId)} type="submit"><FiPlus />Create sample job</button>
        </form>
        <dl className="summary-rows">
          {(samples || []).map((sample) => (
            <div key={sample.key}>
              <dt>{sample.label || sample.key}</dt>
              <dd>{sample.provider} / {sample.sourceType}</dd>
            </div>
          ))}
        </dl>
        <JsonPreview title="Sample Result" value={sampleResult} />
      </Panel>
      <Panel title="Parse" icon={<FiDatabase />}>
        <form className="stack" onSubmit={parseJob}>
          <RecordSelect label="Import job" records={jobs} value={importJobId} onChange={setImportJobId} />
          <TextField label="Source type" value={parseForm.sourceType} onChange={(sourceType) => setParseForm({ ...parseForm, sourceType })} />
          <SelectField label="Content type" value={parseForm.contentType} onChange={(contentType) => setParseForm({ ...parseForm, contentType })} options={['text/csv', 'application/json', 'text/plain']} />
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
          <TransformPipelineEditor label="Transform" value={presetForm.transformationConfigText} onChange={(transformationConfigText) => setPresetForm({ ...presetForm, transformationConfigText })} />
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
          <TransformPipelineEditor label="Template transformations" value={templateForm.transformationConfigText} onChange={(transformationConfigText) => setTemplateForm({ ...templateForm, transformationConfigText })} />
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
          <button className="secondary-button" disabled={action.pending || !importJobId} onClick={completeImportJob} type="button">Complete</button>
          <button className="secondary-button" disabled={action.pending || !importJobId} onClick={() => jobCommand(context.services.imports.fail, 'Import failed')} type="button">Fail</button>
          <button className="icon-button danger" disabled={action.pending || !importJobId} onClick={() => jobCommand(context.services.imports.cancel, 'Import canceled')} title="Cancel import" type="button"><FiX /></button>
        </div>
      </Panel>
      <Panel title="Import Ops Audit" icon={<FiActivity />}>
        <SelectField label="Conflict job status" value={conflictResolutionJobStatus} onChange={setConflictResolutionJobStatus} options={['', 'queued', 'running', 'completed', 'failed', 'cancelled']} />
        <div className="button-row wrap">
          <button className="secondary-button" disabled={action.pending || !context.workspaceId} onClick={loadImportOpsAudit} type="button"><FiRefreshCw />Load audit</button>
          <button className="secondary-button" disabled={action.pending || !context.workspaceId} onClick={processConflictResolutionJobs} type="button"><FiActivity />Process queued</button>
          <button className="secondary-button" disabled={action.pending || !context.workspaceId} onClick={processReviewCsvExportJobs} type="button"><FiActivity />Process review exports</button>
        </div>
        <JsonPreview title="Worker Result" value={conflictResolutionWorkerResult} />
        <JsonPreview title="Review Export Result" value={reviewExportWorkerResult} />
        <ImportConflictResolutionJobsTable jobs={workspaceConflictResolutionJobs} onCsvExport={createConflictJobsCsvExportJob({ status: conflictResolutionJobStatus || undefined })} />
        <ImportExportJobsTable jobs={exportJobs} onCsvExport={createExportJobsCsvExportJob} onDownload={downloadExportJob} />
        <ImportCompletionMetricsTable title="Project" metrics={projectImportCompletions} onCsvExport={createCompletionCsvExportJob('project_completion', { projectId: context.projectId || undefined })} />
        <ImportCompletionMetricsTable title="Workspace" metrics={workspaceImportCompletions} onCsvExport={createCompletionCsvExportJob('workspace_completion')} />
      </Panel>
      <Panel title="Import Records" icon={<FiEye />} wide>
        <ErrorLine message={action.error} />
        <div className="data-columns two no-margin">
          <DetailLinkGrid title="Import Job Routes" items={jobs} basePath="/imports/jobs" />
          <DetailLinkGrid title="Template Routes" items={templates} basePath="/imports/templates" />
        </div>
        <div className="stack">
          <RecordSelect label="Version history preset" records={transformPresets} value={transformPresetId} onChange={(presetId) => loadPresetVersions(presetId)} includeBlank />
          <button className="secondary-button" disabled={action.pending || !transformPresetId} onClick={() => loadPresetVersions()} type="button"><FiRefreshCw />Load versions</button>
        </div>
        <form className="stack" onSubmit={(event) => { event.preventDefault(); loadRecords(); }}>
          <h3>Filter Records</h3>
          <div className="data-columns three no-margin">
            <SelectField label="Status" value={recordFilters.status} onChange={(status) => { setFilteredConflictPreview(null); setRecordFilters({ ...recordFilters, status }); }} options={['', 'pending', 'imported', 'failed', 'skipped', 'conflict']} />
            <SelectField label="Conflict" value={recordFilters.conflictStatus} onChange={(conflictStatus) => { setFilteredConflictPreview(null); setRecordFilters({ ...recordFilters, conflictStatus }); }} options={['', 'open', 'resolved']} />
            <TextField label="Source type" value={recordFilters.sourceType} onChange={(sourceType) => { setFilteredConflictPreview(null); setRecordFilters({ ...recordFilters, sourceType }); }} />
          </div>
          <button className="secondary-button" disabled={action.pending || !importJobId} type="submit"><FiRefreshCw />Apply filters</button>
        </form>
        <div className="data-columns three no-margin">
          <form className="stack" onSubmit={cloneTransformPresetVersion}>
            <h3>Clone Version</h3>
            <RecordSelect label="Version" records={transformPresetVersions} value={cloneForm.versionId} onChange={(versionId) => setCloneForm({ ...cloneForm, versionId })} />
            <TextField label="Clone name" value={cloneForm.name} onChange={(name) => setCloneForm({ ...cloneForm, name })} />
            <SelectField label="Enabled" value={cloneForm.enabled} onChange={(enabled) => setCloneForm({ ...cloneForm, enabled })} options={['true', 'false']} />
            <button className="secondary-button" disabled={action.pending || !transformPresetId || !cloneForm.versionId} type="submit"><FiPlus />Clone</button>
          </form>
          <form className="stack" onSubmit={previewRetarget}>
            <h3>Retarget Version</h3>
            <RecordSelect label="Version" records={transformPresetVersions} value={retargetForm.versionId} onChange={(versionId) => { setRetargetPreview(null); setRetargetForm((current) => ({ ...current, versionId })); }} />
            <TextField label="Clone name" value={retargetForm.name} onChange={(name) => { setRetargetPreview(null); setRetargetForm((current) => ({ ...current, name })); }} />
            <SelectField label="Enabled" value={retargetForm.enabled} onChange={(enabled) => { setRetargetPreview(null); setRetargetForm((current) => ({ ...current, enabled })); }} options={['true', 'false']} />
            <div className="stack">
              {templates.map((template) => (
                <label className="checkbox-row" key={template.id}>
                  <input checked={retargetForm.mappingTemplateIds.includes(template.id)} onChange={() => toggleRetargetTemplate(template.id)} type="checkbox" />
                  <span>{template.name || template.id}</span>
                </label>
              ))}
            </div>
            <div className="button-row wrap">
              <button className="secondary-button" disabled={action.pending || !transformPresetId || !retargetForm.versionId || retargetForm.mappingTemplateIds.length === 0} type="submit"><FiEye />Preview</button>
              <button className="primary-button" disabled={action.pending || !retargetPreview || retargetForm.mappingTemplateIds.length === 0} onClick={applyRetarget} type="button"><FiArrowRight />Apply</button>
            </div>
            <JsonPreview title="Retarget Preview" value={retargetPreview} />
          </form>
          <form className="stack" onSubmit={resolveConflict}>
            <h3>Conflict Review</h3>
            <RecordSelect label="Open conflict" records={conflicts} value={conflictForm.recordId} onChange={(recordId) => setConflictForm({ ...conflictForm, recordId })} />
            <SelectField label="Resolution" value={conflictForm.resolution} onChange={(resolution) => setConflictForm({ ...conflictForm, resolution })} options={['create_new', 'update_existing', 'skip']} />
            <ImportConflictDetails conflict={selectedConflict} resolution={conflictForm.resolution} />
            <div className="stack">
              {conflicts.map((conflict) => (
                <label className="checkbox-row" key={conflict.id}>
                  <input checked={bulkConflictIds.includes(conflict.id)} onChange={() => toggleBulkConflict(conflict.id)} type="checkbox" />
                  <span>{[conflict.sourceType, conflict.sourceId].filter(Boolean).join(' / ')}</span>
                </label>
              ))}
            </div>
            <button className="secondary-button" disabled={action.pending || !conflictForm.recordId} type="submit"><FiArrowRight />Resolve</button>
            <button className="secondary-button" disabled={action.pending || bulkConflictIds.length === 0} onClick={resolveSelectedConflicts} type="button"><FiCheck />Resolve selected</button>
            <button className="secondary-button" disabled={action.pending || !importJobId} onClick={previewFilteredConflicts} type="button"><FiEye />Preview filtered</button>
            <button className="secondary-button" disabled={action.pending || !filteredConflictPreview?.matched} onClick={resolveFilteredConflicts} type="button"><FiCheck />Resolve filtered</button>
            <button className="secondary-button" disabled={action.pending || !filteredConflictPreview?.matched} onClick={queueFilteredConflictResolutionJob} type="button"><FiPlus />Queue filtered</button>
            <RecordSelect label="Resolution job" records={conflictResolutionJobs} value={conflictResolutionJobId} onChange={setConflictResolutionJobId} />
            <div className="button-row wrap">
              <button className="secondary-button" disabled={action.pending || !conflictResolutionJobId} onClick={runConflictResolutionJob} type="button"><FiActivity />Run job</button>
              <button className="secondary-button" disabled={action.pending || !conflictResolutionJobId} onClick={retryConflictResolutionJob} type="button"><FiRefreshCw />Retry job</button>
              <button className="icon-button danger" disabled={action.pending || !conflictResolutionJobId} onClick={cancelConflictResolutionJob} title="Cancel conflict resolution job" type="button"><FiX /></button>
            </div>
            <JsonPreview title="Filtered Conflict Preview" value={filteredConflictPreview} />
            <ImportConflictResolutionJobsTable jobs={conflictResolutionJobs} onCsvExport={createConflictJobsCsvExportJob({ importJobId })} />
          </form>
          <form className="stack" onSubmit={rerunMaterialization}>
            <h3>Rerun Snapshot</h3>
            <RecordSelect label="Run" records={materializationRuns} value={rerunForm.materializationRunId} onChange={(materializationRunId) => setRerunForm({ ...rerunForm, materializationRunId })} />
            <TextField label="Limit" type="number" value={rerunForm.limit} onChange={(limit) => setRerunForm({ ...rerunForm, limit })} />
            <SelectField label="Update existing" value={rerunForm.updateExisting} onChange={(updateExisting) => setRerunForm({ ...rerunForm, updateExisting })} options={['source', 'true', 'false']} />
            <button className="secondary-button" disabled={action.pending || !rerunForm.materializationRunId} type="submit"><FiRefreshCw />Rerun</button>
          </form>
        </div>
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
        <JsonRecordEditor
          records={transformPresets}
          title="Transform Presets"
          onDelete={(record) => context.services.imports.deleteTransformPreset(record.id)}
          onSave={(record, draft) => context.services.imports.updateTransformPreset(record.id, pick(draft, ['name', 'description', 'transformationConfig', 'enabled']))}
          onSuccess={load}
          action={action}
        />
        <div className="button-row wrap">
          <button className="secondary-button" disabled={action.pending || !importJobId} onClick={loadJobVersionDiffExport} type="button"><FiEye />Load job diff export</button>
          <button className="secondary-button" disabled={action.pending || !importJobId} onClick={() => createJobVersionDiffExportJob()} type="button"><FiPlus />Create export artifact</button>
        </div>
        <ImportJobVersionDiffTable diffs={jobVersionDiffs} onCsvExport={createJobVersionDiffCsvExportJob} />
        <ImportExportJobsTable jobs={exportJobs} onCsvExport={createExportJobsCsvExportJob} onDownload={downloadExportJob} />
        <div className="data-columns">
          <JsonPreview title="Jobs" value={jobs} />
          <JsonPreview title="Templates" value={templates} />
          <JsonPreview title="Transform Presets" value={transformPresets} />
          <JsonPreview title="Transform Preset Versions" value={transformPresetVersions} />
          <JsonPreview title="Selected Job" value={selectedJob} />
          <JsonPreview title="Parse Result" value={parseResult} />
          <JsonPreview title="Materialize Result" value={materializeResult} />
          <JsonPreview title="Job Version Diff Export" value={jobVersionDiffExport} />
          <JsonPreview title="Job Version Diff Export Artifact" value={jobVersionDiffExportJob} />
          <JsonPreview title="Materialization Runs" value={materializationRuns} />
          <JsonPreview title="Open Conflicts" value={conflicts} />
          <JsonPreview title="Records" value={records} />
        </div>
      </Panel>
    </div>
  );
};
