import { useState } from 'react';
import { FiBell, FiCheck, FiCpu, FiPlus, FiRefreshCw, FiSend, FiSettings, FiX } from 'react-icons/fi';
import { DetailLinkGrid } from '../../components/DetailLinkGrid';
import { ErrorLine } from '../../components/ErrorLine';
import { Field } from '../../components/Field';
import { JsonPreview } from '../../components/JsonPreview';
import { Panel } from '../../components/Panel';
import { RecordSelect } from '../../components/RecordSelect';
import { SelectField } from '../../components/SelectField';
import { TextField } from '../../components/TextField';
import { useApiAction } from '../../hooks/useApiAction';
import { firstId, numberOrUndefined, parseJsonOrThrow, settingsToForm } from '../../utils/forms';

const workerTypeOptions = ['all', 'automation', 'webhook', 'email', 'import_conflict_resolution'];

export const AutomationPage = ({ context }) => {
  const [notifications, setNotifications] = useState(null);
  const [preferences, setPreferences] = useState([]);
  const [defaultPreferences, setDefaultPreferences] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [webhookId, setWebhookId] = useState('');
  const [webhookDeliveries, setWebhookDeliveries] = useState([]);
  const [webhookDeliveryId, setWebhookDeliveryId] = useState('');
  const [emailDeliveries, setEmailDeliveries] = useState([]);
  const [emailDeliveryId, setEmailDeliveryId] = useState('');
  const [workerSettings, setWorkerSettings] = useState(null);
  const [workerRuns, setWorkerRuns] = useState([]);
  const [workerHealth, setWorkerHealth] = useState([]);
  const [workerTypeFilter, setWorkerTypeFilter] = useState('all');
  const [rules, setRules] = useState([]);
  const [ruleId, setRuleId] = useState('');
  const [jobs, setJobs] = useState([]);
  const [runResult, setRunResult] = useState(null);
  const [workItems, setWorkItems] = useState([]);
  const [preferenceForm, setPreferenceForm] = useState({ channel: 'in_app', eventType: 'work_item.updated', enabled: 'true', configText: '{}' });
  const [defaultPreferenceForm, setDefaultPreferenceForm] = useState({ channel: 'in_app', eventType: 'automation.rule_queued', enabled: 'true', configText: '{}' });
  const [webhookForm, setWebhookForm] = useState({ name: 'Automation Webhook', url: 'https://example.com/hooks/trasck', secret: '', eventTypesText: JSON.stringify(['automation.rule_executed'], null, 2), enabled: 'true' });
  const [ruleForm, setRuleForm] = useState({ name: 'Notify on update', triggerType: 'manual', triggerConfigText: '{}' });
  const [conditionForm, setConditionForm] = useState({ conditionType: 'always', configText: '{}', position: '1' });
  const [actionForm, setActionForm] = useState({ actionType: 'email', executionMode: 'async', configText: JSON.stringify({ toEmail: 'admin@trasck.local', subject: 'Automation ran', body: 'Trasck queued the email delivery action.' }, null, 2), position: '1' });
  const [executeForm, setExecuteForm] = useState({ sourceEntityType: 'work_item', sourceEntityId: '', payloadText: '{}' });
  const [workerForm, setWorkerForm] = useState({ limit: '10', maxAttempts: '3', dryRun: 'true' });
  const [workerSettingsForm, setWorkerSettingsForm] = useState({
    automationJobsEnabled: 'false',
    webhookDeliveriesEnabled: 'false',
    emailDeliveriesEnabled: 'false',
    importConflictResolutionEnabled: 'false',
    automationLimit: '25',
    webhookLimit: '25',
    emailLimit: '25',
    importConflictResolutionLimit: '10',
    webhookMaxAttempts: '3',
    emailMaxAttempts: '3',
    webhookDryRun: 'true',
    emailDryRun: 'true',
    workerRunRetentionEnabled: 'false',
    workerRunRetentionDays: '',
    workerRunExportBeforePrune: 'true',
    workerRunPruningAutomaticEnabled: 'false',
    workerRunPruningIntervalMinutes: '1440',
    workerRunPruningWindowStart: '',
    workerRunPruningWindowEnd: '',
  });
  const action = useApiAction(context.addToast);

  const load = async () => {
    if (!context.workspaceId) {
      action.setError('Workspace ID is required');
      return;
    }
    const result = await action.run(async () => {
      const workerQuery = workerTypeFilter === 'all' ? {} : { workerType: workerTypeFilter };
      const [notificationPage, preferenceRows, defaultRows, webhookRows, ruleRows, workItemPage, settings, workerRunRows, workerHealthRows, emailRows] = await Promise.all([
        context.services.automation.listNotifications(context.workspaceId, { limit: 25 }),
        context.services.automation.listPreferences(context.workspaceId),
        context.services.automation.listDefaultPreferences(context.workspaceId),
        context.services.automation.listWebhooks(context.workspaceId),
        context.services.automation.listRules(context.workspaceId),
        context.projectId ? context.services.workItems.listByProject(context.projectId, { limit: 50 }) : Promise.resolve({ items: [] }),
        context.services.automation.getWorkerSettings(context.workspaceId),
        context.services.automation.listWorkerRuns(context.workspaceId, workerQuery),
        context.services.automation.listWorkerHealth(context.workspaceId, workerQuery),
        context.services.automation.listEmailDeliveries(context.workspaceId),
      ]);
      const nextWebhookId = webhookId || firstId(webhookRows);
      const nextRuleId = ruleId || firstId(ruleRows);
      const nextEmailDeliveryId = emailDeliveryId || firstId(emailRows);
      const [deliveryRows, jobRows] = await Promise.all([
        nextWebhookId ? context.services.automation.listWebhookDeliveries(nextWebhookId) : Promise.resolve([]),
        nextRuleId ? context.services.automation.listJobs(nextRuleId) : Promise.resolve([]),
      ]);
      return { notificationPage, preferenceRows, defaultRows, webhookRows, ruleRows, workItemRows: workItemPage?.items || [], settings, workerRunRows, workerHealthRows, emailRows, nextWebhookId, nextRuleId, nextEmailDeliveryId, deliveryRows, jobRows };
    });
    if (result) {
      setNotifications(result.notificationPage || null);
      setPreferences(result.preferenceRows || []);
      setDefaultPreferences(result.defaultRows || []);
      setWebhooks(result.webhookRows || []);
      setRules(result.ruleRows || []);
      setWorkItems(result.workItemRows || []);
      setWorkerSettings(result.settings || null);
      setWorkerRuns(result.workerRunRows || []);
      setWorkerHealth(result.workerHealthRows || []);
      setEmailDeliveries(result.emailRows || []);
      setWebhookId(result.nextWebhookId || '');
      setRuleId(result.nextRuleId || '');
      setEmailDeliveryId(result.nextEmailDeliveryId || '');
      setWebhookDeliveries(result.deliveryRows || []);
      setWebhookDeliveryId(firstId(result.deliveryRows) || '');
      setJobs(result.jobRows || []);
      if (result.settings) {
        setWorkerSettingsForm(settingsToForm(result.settings));
      }
      if (!executeForm.sourceEntityId && firstId(result.workItemRows)) {
        setExecuteForm((current) => ({ ...current, sourceEntityId: firstId(result.workItemRows) }));
      }
    }
  };

  const savePreference = async (event) => {
    event.preventDefault();
    await action.run(() => context.services.automation.upsertPreference(context.workspaceId, {
      channel: preferenceForm.channel,
      eventType: preferenceForm.eventType,
      enabled: preferenceForm.enabled === 'true',
      config: parseJsonOrThrow(preferenceForm.configText),
    }), 'Preference saved');
    await load();
  };

  const saveDefaultPreference = async (event) => {
    event.preventDefault();
    await action.run(() => context.services.automation.upsertDefaultPreference(context.workspaceId, {
      channel: defaultPreferenceForm.channel,
      eventType: defaultPreferenceForm.eventType,
      enabled: defaultPreferenceForm.enabled === 'true',
      config: parseJsonOrThrow(defaultPreferenceForm.configText),
    }), 'Default saved');
    await load();
  };

  const createWebhook = async (event) => {
    event.preventDefault();
    const webhook = await action.run(() => context.services.automation.createWebhook(context.workspaceId, {
      name: webhookForm.name,
      url: webhookForm.url,
      secret: webhookForm.secret || undefined,
      eventTypes: parseJsonOrThrow(webhookForm.eventTypesText),
      enabled: webhookForm.enabled === 'true',
    }), 'Webhook created');
    if (webhook) {
      setWebhookId(webhook.id || '');
      await load();
    }
  };

  const createRule = async (event) => {
    event.preventDefault();
    const rule = await action.run(() => context.services.automation.createRule(context.workspaceId, {
      projectId: context.projectId || undefined,
      name: ruleForm.name,
      triggerType: ruleForm.triggerType,
      triggerConfig: parseJsonOrThrow(ruleForm.triggerConfigText),
      enabled: true,
    }), 'Rule created');
    if (rule) {
      setRuleId(rule.id || '');
      await load();
    }
  };

  const createCondition = async (event) => {
    event.preventDefault();
    await action.run(() => context.services.automation.createCondition(ruleId, {
      conditionType: conditionForm.conditionType,
      config: parseJsonOrThrow(conditionForm.configText),
      position: Number(conditionForm.position || 0),
    }), 'Condition added');
    await loadRuleJobs();
  };

  const createAction = async (event) => {
    event.preventDefault();
    await action.run(() => context.services.automation.createAction(ruleId, {
      actionType: actionForm.actionType,
      executionMode: actionForm.executionMode,
      config: parseJsonOrThrow(actionForm.configText),
      position: Number(actionForm.position || 0),
    }), 'Action added');
    await loadRuleJobs();
  };

  const executeRule = async (event) => {
    event.preventDefault();
    const execution = await action.run(() => context.services.automation.executeRule(ruleId, {
      sourceEntityType: executeForm.sourceEntityType,
      sourceEntityId: executeForm.sourceEntityId || undefined,
      payload: parseJsonOrThrow(executeForm.payloadText),
    }), 'Rule queued');
    if (execution) {
      setRunResult(execution);
      await loadRuleJobs();
    }
  };

  const loadRuleJobs = async () => {
    if (!ruleId) {
      action.setError('Automation rule is required');
      return;
    }
    const rows = await action.run(() => context.services.automation.listJobs(ruleId));
    if (rows) {
      setJobs(rows || []);
    }
  };

  const loadWebhookDeliveries = async () => {
    if (!webhookId) {
      action.setError('Webhook is required');
      return;
    }
    const rows = await action.run(() => context.services.automation.listWebhookDeliveries(webhookId));
    if (rows) {
      setWebhookDeliveries(rows || []);
    }
  };

  const runQueuedJobs = async () => {
    const result = await action.run(() => context.services.automation.runQueuedJobs(context.workspaceId, {
      limit: numberOrUndefined(workerForm.limit),
    }), 'Automation worker run');
    if (result) {
      setRunResult(result);
      await loadRuleJobs();
    }
  };

  const processDeliveries = async () => {
    const result = await action.run(() => context.services.automation.processWebhookDeliveries(context.workspaceId, {
      limit: numberOrUndefined(workerForm.limit),
      maxAttempts: numberOrUndefined(workerForm.maxAttempts),
      dryRun: workerForm.dryRun === 'true',
    }), 'Webhook worker run');
    if (result) {
      setRunResult(result);
      await loadWebhookDeliveries();
    }
  };

  const processEmails = async () => {
    const result = await action.run(() => context.services.automation.processEmailDeliveries(context.workspaceId, {
      limit: numberOrUndefined(workerForm.limit),
      maxAttempts: numberOrUndefined(workerForm.maxAttempts),
      dryRun: workerForm.dryRun === 'true',
    }), 'Email worker run');
    if (result) {
      setRunResult(result);
      await loadEmailDeliveries();
    }
  };

  const saveWorkerSettings = async () => {
    const settings = await action.run(() => context.services.automation.updateWorkerSettings(context.workspaceId, {
      automationJobsEnabled: workerSettingsForm.automationJobsEnabled === 'true',
      webhookDeliveriesEnabled: workerSettingsForm.webhookDeliveriesEnabled === 'true',
      emailDeliveriesEnabled: workerSettingsForm.emailDeliveriesEnabled === 'true',
      importConflictResolutionEnabled: workerSettingsForm.importConflictResolutionEnabled === 'true',
      automationLimit: numberOrUndefined(workerSettingsForm.automationLimit),
      webhookLimit: numberOrUndefined(workerSettingsForm.webhookLimit),
      emailLimit: numberOrUndefined(workerSettingsForm.emailLimit),
      importConflictResolutionLimit: numberOrUndefined(workerSettingsForm.importConflictResolutionLimit),
      webhookMaxAttempts: numberOrUndefined(workerSettingsForm.webhookMaxAttempts),
      emailMaxAttempts: numberOrUndefined(workerSettingsForm.emailMaxAttempts),
      webhookDryRun: workerSettingsForm.webhookDryRun === 'true',
      emailDryRun: workerSettingsForm.emailDryRun === 'true',
      workerRunRetentionEnabled: workerSettingsForm.workerRunRetentionEnabled === 'true',
      workerRunRetentionDays: numberOrUndefined(workerSettingsForm.workerRunRetentionDays),
      workerRunExportBeforePrune: workerSettingsForm.workerRunExportBeforePrune === 'true',
      workerRunPruningAutomaticEnabled: workerSettingsForm.workerRunPruningAutomaticEnabled === 'true',
      workerRunPruningIntervalMinutes: numberOrUndefined(workerSettingsForm.workerRunPruningIntervalMinutes),
      workerRunPruningWindowStart: workerSettingsForm.workerRunPruningWindowStart || undefined,
      workerRunPruningWindowEnd: workerSettingsForm.workerRunPruningWindowEnd || undefined,
    }), 'Worker settings saved');
    if (settings) {
      setWorkerSettings(settings);
      setWorkerSettingsForm(settingsToForm(settings));
    }
  };

  const exportWorkerRuns = async () => {
    const workerQuery = workerTypeFilter === 'all' ? {} : { workerType: workerTypeFilter };
    const result = await action.run(() => context.services.automation.exportWorkerRuns(context.workspaceId, {
      limit: numberOrUndefined(workerForm.limit),
      ...workerQuery,
    }), 'Worker runs exported');
    if (result) {
      setRunResult(result);
      await load();
    }
  };

  const pruneWorkerRuns = async () => {
    const workerQuery = workerTypeFilter === 'all' ? {} : { workerType: workerTypeFilter };
    const result = await action.run(() => context.services.automation.pruneWorkerRuns(context.workspaceId, workerQuery), 'Worker runs pruned');
    if (result) {
      setRunResult(result);
      await load();
    }
  };

  const loadEmailDeliveries = async () => {
    const rows = await action.run(() => context.services.automation.listEmailDeliveries(context.workspaceId));
    if (rows) {
      setEmailDeliveries(rows || []);
      setEmailDeliveryId(emailDeliveryId || firstId(rows) || '');
    }
  };

  const webhookDeliveryCommand = async (command, success) => {
    if (!webhookDeliveryId) {
      action.setError('Webhook delivery is required');
      return;
    }
    const delivery = await action.run(() => command(webhookDeliveryId), success);
    if (delivery) {
      await loadWebhookDeliveries();
    }
  };

  const emailDeliveryCommand = async (command, success) => {
    if (!emailDeliveryId) {
      action.setError('Email delivery is required');
      return;
    }
    const delivery = await action.run(() => command(emailDeliveryId), success);
    if (delivery) {
      await loadEmailDeliveries();
    }
  };

  const useSelectedWebhookConfig = () => {
    if (!webhookId) {
      return;
    }
    setActionForm({
      ...actionForm,
      actionType: 'webhook',
      executionMode: 'async',
      configText: JSON.stringify({ webhookId }, null, 2),
    });
  };

  return (
    <div className="content-grid">
      <Panel title="Notification Preferences" icon={<FiBell />}>
        <form className="stack" onSubmit={savePreference}>
          <TextField label="Channel" value={preferenceForm.channel} onChange={(channel) => setPreferenceForm({ ...preferenceForm, channel })} />
          <TextField label="Event type" value={preferenceForm.eventType} onChange={(eventType) => setPreferenceForm({ ...preferenceForm, eventType })} />
          <SelectField label="Enabled" value={preferenceForm.enabled} onChange={(enabled) => setPreferenceForm({ ...preferenceForm, enabled })} options={['true', 'false']} />
          <Field label="Config JSON">
            <textarea value={preferenceForm.configText} onChange={(event) => setPreferenceForm({ ...preferenceForm, configText: event.target.value })} rows={4} spellCheck="false" />
          </Field>
          <button className="primary-button" disabled={action.pending || !context.workspaceId} type="submit"><FiCheck />Save preference</button>
        </form>
        <form className="stack nested-form" onSubmit={saveDefaultPreference}>
          <TextField label="Default event" value={defaultPreferenceForm.eventType} onChange={(eventType) => setDefaultPreferenceForm({ ...defaultPreferenceForm, eventType })} />
          <SelectField label="Enabled" value={defaultPreferenceForm.enabled} onChange={(enabled) => setDefaultPreferenceForm({ ...defaultPreferenceForm, enabled })} options={['true', 'false']} />
          <button className="secondary-button" disabled={action.pending || !context.workspaceId} type="submit"><FiCheck />Save default</button>
        </form>
      </Panel>
      <Panel title="Webhooks" icon={<FiSend />}>
        <form className="stack" onSubmit={createWebhook}>
          <TextField label="Name" value={webhookForm.name} onChange={(name) => setWebhookForm({ ...webhookForm, name })} />
          <TextField label="URL" value={webhookForm.url} onChange={(url) => setWebhookForm({ ...webhookForm, url })} />
          <TextField label="Secret" value={webhookForm.secret} onChange={(secret) => setWebhookForm({ ...webhookForm, secret })} />
          <Field label="Event types JSON">
            <textarea value={webhookForm.eventTypesText} onChange={(event) => setWebhookForm({ ...webhookForm, eventTypesText: event.target.value })} rows={4} spellCheck="false" />
          </Field>
          <button className="primary-button" disabled={action.pending || !context.workspaceId} type="submit"><FiPlus />Create webhook</button>
        </form>
      </Panel>
      <Panel title="Automation Rule" icon={<FiCpu />}>
        <form className="stack" onSubmit={createRule}>
          <TextField label="Name" value={ruleForm.name} onChange={(name) => setRuleForm({ ...ruleForm, name })} />
          <SelectField label="Trigger" value={ruleForm.triggerType} onChange={(triggerType) => setRuleForm({ ...ruleForm, triggerType })} options={['manual', 'work_item.updated', 'work_item.created', 'schedule']} />
          <Field label="Trigger JSON">
            <textarea value={ruleForm.triggerConfigText} onChange={(event) => setRuleForm({ ...ruleForm, triggerConfigText: event.target.value })} rows={4} spellCheck="false" />
          </Field>
          <button className="primary-button" disabled={action.pending || !context.workspaceId} type="submit"><FiPlus />Create rule</button>
        </form>
      </Panel>
      <Panel title="Conditions And Actions" icon={<FiSettings />}>
        <RecordSelect label="Rule" records={rules} value={ruleId} onChange={setRuleId} />
        <form className="stack nested-form" onSubmit={createCondition}>
          <TextField label="Condition" value={conditionForm.conditionType} onChange={(conditionType) => setConditionForm({ ...conditionForm, conditionType })} />
          <Field label="Config JSON">
            <textarea value={conditionForm.configText} onChange={(event) => setConditionForm({ ...conditionForm, configText: event.target.value })} rows={3} spellCheck="false" />
          </Field>
          <button className="secondary-button" disabled={action.pending || !ruleId} type="submit"><FiPlus />Add condition</button>
        </form>
        <form className="stack nested-form" onSubmit={createAction}>
          <SelectField label="Action" value={actionForm.actionType} onChange={(actionType) => setActionForm({ ...actionForm, actionType })} options={['notification', 'webhook', 'email', 'field_update', 'comment']} />
          <SelectField label="Execution" value={actionForm.executionMode} onChange={(executionMode) => setActionForm({ ...actionForm, executionMode })} options={['sync', 'async', 'hybrid']} />
          <Field label="Config JSON">
            <textarea value={actionForm.configText} onChange={(event) => setActionForm({ ...actionForm, configText: event.target.value })} rows={5} spellCheck="false" />
          </Field>
          <div className="button-row wrap">
            <button className="secondary-button" disabled={!webhookId} onClick={useSelectedWebhookConfig} type="button">Use webhook</button>
            <button className="primary-button" disabled={action.pending || !ruleId} type="submit"><FiPlus />Add action</button>
          </div>
        </form>
      </Panel>
      <Panel title="Execution" icon={<FiRefreshCw />} wide>
        <form className="stack create-strip" onSubmit={executeRule}>
          <RecordSelect label="Rule" records={rules} value={ruleId} onChange={setRuleId} />
          <SelectField label="Source" value={executeForm.sourceEntityType} onChange={(sourceEntityType) => setExecuteForm({ ...executeForm, sourceEntityType })} options={['work_item', 'project', 'workspace']} />
          <RecordSelect label="Work item" records={workItems} value={executeForm.sourceEntityId} onChange={(sourceEntityId) => setExecuteForm({ ...executeForm, sourceEntityId })} includeBlank />
          <button className="primary-button" disabled={action.pending || !ruleId} type="submit"><FiSend />Queue rule</button>
        </form>
        <div className="agent-command-strip compact-actions">
          <TextField label="Limit" type="number" value={workerForm.limit} onChange={(limit) => setWorkerForm({ ...workerForm, limit })} />
          <TextField label="Max attempts" type="number" value={workerForm.maxAttempts} onChange={(maxAttempts) => setWorkerForm({ ...workerForm, maxAttempts })} />
          <SelectField label="Dry run" value={workerForm.dryRun} onChange={(dryRun) => setWorkerForm({ ...workerForm, dryRun })} options={['true', 'false']} />
          <button className="secondary-button" disabled={action.pending || !context.workspaceId} onClick={runQueuedJobs} type="button">Run jobs</button>
          <button className="secondary-button" disabled={action.pending || !context.workspaceId} onClick={processDeliveries} type="button">Run deliveries</button>
          <button className="secondary-button" disabled={action.pending || !context.workspaceId} onClick={processEmails} type="button">Run emails</button>
        </div>
        <div className="data-columns two no-margin">
          <div className="stack nested-form">
            <div className="two-column compact">
              <SelectField label="Job schedule" value={workerSettingsForm.automationJobsEnabled} onChange={(automationJobsEnabled) => setWorkerSettingsForm({ ...workerSettingsForm, automationJobsEnabled })} options={['false', 'true']} />
              <SelectField label="Webhook schedule" value={workerSettingsForm.webhookDeliveriesEnabled} onChange={(webhookDeliveriesEnabled) => setWorkerSettingsForm({ ...workerSettingsForm, webhookDeliveriesEnabled })} options={['false', 'true']} />
              <SelectField label="Email schedule" value={workerSettingsForm.emailDeliveriesEnabled} onChange={(emailDeliveriesEnabled) => setWorkerSettingsForm({ ...workerSettingsForm, emailDeliveriesEnabled })} options={['false', 'true']} />
              <SelectField label="Import schedule" value={workerSettingsForm.importConflictResolutionEnabled} onChange={(importConflictResolutionEnabled) => setWorkerSettingsForm({ ...workerSettingsForm, importConflictResolutionEnabled })} options={['false', 'true']} />
              <TextField label="Job limit" type="number" value={workerSettingsForm.automationLimit} onChange={(automationLimit) => setWorkerSettingsForm({ ...workerSettingsForm, automationLimit })} />
              <TextField label="Webhook limit" type="number" value={workerSettingsForm.webhookLimit} onChange={(webhookLimit) => setWorkerSettingsForm({ ...workerSettingsForm, webhookLimit })} />
              <TextField label="Email limit" type="number" value={workerSettingsForm.emailLimit} onChange={(emailLimit) => setWorkerSettingsForm({ ...workerSettingsForm, emailLimit })} />
              <TextField label="Import limit" type="number" value={workerSettingsForm.importConflictResolutionLimit} onChange={(importConflictResolutionLimit) => setWorkerSettingsForm({ ...workerSettingsForm, importConflictResolutionLimit })} />
              <TextField label="Webhook attempts" type="number" value={workerSettingsForm.webhookMaxAttempts} onChange={(webhookMaxAttempts) => setWorkerSettingsForm({ ...workerSettingsForm, webhookMaxAttempts })} />
              <TextField label="Email attempts" type="number" value={workerSettingsForm.emailMaxAttempts} onChange={(emailMaxAttempts) => setWorkerSettingsForm({ ...workerSettingsForm, emailMaxAttempts })} />
              <SelectField label="Webhook dry" value={workerSettingsForm.webhookDryRun} onChange={(webhookDryRun) => setWorkerSettingsForm({ ...workerSettingsForm, webhookDryRun })} options={['true', 'false']} />
              <SelectField label="Email dry" value={workerSettingsForm.emailDryRun} onChange={(emailDryRun) => setWorkerSettingsForm({ ...workerSettingsForm, emailDryRun })} options={['true', 'false']} />
              <SelectField label="Retention" value={workerSettingsForm.workerRunRetentionEnabled} onChange={(workerRunRetentionEnabled) => setWorkerSettingsForm({ ...workerSettingsForm, workerRunRetentionEnabled })} options={['false', 'true']} />
              <TextField label="Retention days" type="number" value={workerSettingsForm.workerRunRetentionDays} onChange={(workerRunRetentionDays) => setWorkerSettingsForm({ ...workerSettingsForm, workerRunRetentionDays })} />
              <SelectField label="Export first" value={workerSettingsForm.workerRunExportBeforePrune} onChange={(workerRunExportBeforePrune) => setWorkerSettingsForm({ ...workerSettingsForm, workerRunExportBeforePrune })} options={['true', 'false']} />
              <SelectField label="Auto prune" value={workerSettingsForm.workerRunPruningAutomaticEnabled} onChange={(workerRunPruningAutomaticEnabled) => setWorkerSettingsForm({ ...workerSettingsForm, workerRunPruningAutomaticEnabled })} options={['false', 'true']} />
              <TextField label="Prune minutes" type="number" value={workerSettingsForm.workerRunPruningIntervalMinutes} onChange={(workerRunPruningIntervalMinutes) => setWorkerSettingsForm({ ...workerSettingsForm, workerRunPruningIntervalMinutes })} />
              <TextField label="Window start" type="time" value={workerSettingsForm.workerRunPruningWindowStart} onChange={(workerRunPruningWindowStart) => setWorkerSettingsForm({ ...workerSettingsForm, workerRunPruningWindowStart })} />
              <TextField label="Window end" type="time" value={workerSettingsForm.workerRunPruningWindowEnd} onChange={(workerRunPruningWindowEnd) => setWorkerSettingsForm({ ...workerSettingsForm, workerRunPruningWindowEnd })} />
            </div>
            <button className="secondary-button" disabled={action.pending || !context.workspaceId} onClick={saveWorkerSettings} type="button"><FiCheck />Save worker settings</button>
          </div>
          <div className="stack nested-form">
            <RecordSelect label="Webhook delivery" records={webhookDeliveries} value={webhookDeliveryId} onChange={setWebhookDeliveryId} />
            <RecordSelect label="Email delivery" records={emailDeliveries} value={emailDeliveryId} onChange={setEmailDeliveryId} />
            <div className="button-row wrap">
              <button className="secondary-button" disabled={action.pending || !webhookDeliveryId} onClick={() => webhookDeliveryCommand(context.services.automation.retryWebhookDelivery, 'Webhook delivery queued')} type="button">Retry webhook</button>
              <button className="icon-button danger" disabled={action.pending || !webhookDeliveryId} onClick={() => webhookDeliveryCommand(context.services.automation.cancelWebhookDelivery, 'Webhook delivery canceled')} title="Cancel webhook delivery" type="button"><FiX /></button>
              <button className="secondary-button" disabled={action.pending || !emailDeliveryId} onClick={() => emailDeliveryCommand(context.services.automation.retryEmailDelivery, 'Email delivery queued')} type="button">Retry email</button>
              <button className="icon-button danger" disabled={action.pending || !emailDeliveryId} onClick={() => emailDeliveryCommand(context.services.automation.cancelEmailDelivery, 'Email delivery canceled')} title="Cancel email delivery" type="button"><FiX /></button>
              <button className="secondary-button" disabled={action.pending || !context.workspaceId} onClick={exportWorkerRuns} type="button">Export runs</button>
              <button className="secondary-button" disabled={action.pending || !context.workspaceId} onClick={pruneWorkerRuns} type="button">Prune runs</button>
            </div>
          </div>
        </div>
        <div className="button-row wrap">
          <button className="secondary-button" disabled={action.pending} onClick={load} type="button"><FiRefreshCw />Load</button>
          <button className="secondary-button" disabled={action.pending || !ruleId} onClick={loadRuleJobs} type="button">Rule jobs</button>
          <SelectField label="Worker type" value={workerTypeFilter} onChange={setWorkerTypeFilter} options={workerTypeOptions} />
          <RecordSelect label="Webhook" records={webhooks} value={webhookId} onChange={setWebhookId} />
          <button className="secondary-button" disabled={action.pending || !webhookId} onClick={loadWebhookDeliveries} type="button">Deliveries</button>
          <button className="secondary-button" disabled={action.pending || !context.workspaceId} onClick={loadEmailDeliveries} type="button">Emails</button>
        </div>
        <ErrorLine message={action.error} />
        <div className="data-columns two no-margin">
          <DetailLinkGrid title="Rule Routes" items={rules} basePath="/automation/rules" />
          <DetailLinkGrid title="Webhook Routes" items={webhooks} basePath="/automation/webhooks" />
        </div>
        <div className="data-columns">
          <JsonPreview title="Notifications" value={notifications} />
          <JsonPreview title="Preferences" value={preferences} />
          <JsonPreview title="Defaults" value={defaultPreferences} />
          <JsonPreview title="Worker Settings" value={workerSettings} />
          <JsonPreview title={`Worker Runs (${workerTypeFilter})`} value={workerRuns} />
          <JsonPreview title={`Worker Health (${workerTypeFilter})`} value={workerHealth} />
          <JsonPreview title="Webhooks" value={webhooks} />
          <JsonPreview title="Deliveries" value={webhookDeliveries} />
          <JsonPreview title="Emails" value={emailDeliveries} />
          <JsonPreview title="Rules" value={rules} />
          <JsonPreview title="Jobs" value={jobs} />
          <JsonPreview title="Run Result" value={runResult} />
        </div>
      </Panel>
    </div>
  );
};
