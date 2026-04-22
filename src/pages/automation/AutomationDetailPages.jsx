import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiCheck, FiCpu, FiEye, FiRefreshCw, FiSend, FiSettings, FiX } from 'react-icons/fi';
import { DetailLayout } from '../../components/DetailLayout';
import { ErrorLine } from '../../components/ErrorLine';
import { Field } from '../../components/Field';
import { JsonPreview } from '../../components/JsonPreview';
import { JsonRecordEditor } from '../../components/JsonRecordEditor';
import { Panel } from '../../components/Panel';
import { SelectField } from '../../components/SelectField';
import { TextField } from '../../components/TextField';
import { useApiAction } from '../../hooks/useApiAction';
import { numberOrUndefined, parseJsonOrThrow, pick, toJsonText } from '../../utils/forms';

export const AutomationRuleDetailPage = ({ context }) => {
  const { ruleId } = useParams();
  const navigate = useNavigate();
  const action = useApiAction(context.addToast);
  const [rule, setRule] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState({ name: '', triggerType: 'manual', triggerConfigText: '{}', enabled: 'true' });

  const load = async () => {
    const result = await action.run(() => Promise.all([
      context.services.automation.getRule(ruleId),
      context.services.automation.listJobs(ruleId),
    ]));
    if (result) {
      const [ruleRow, jobRows] = result;
      setRule(ruleRow);
      setJobs(jobRows || []);
      setForm({
        name: ruleRow.name || '',
        triggerType: ruleRow.triggerType || 'manual',
        triggerConfigText: toJsonText(ruleRow.triggerConfig || {}),
        enabled: String(ruleRow.enabled ?? true),
      });
    }
  };

  useEffect(() => {
    load();
  }, [ruleId]);

  const save = async (event) => {
    event.preventDefault();
    const saved = await action.run(() => context.services.automation.updateRule(ruleId, {
      projectId: context.projectId || rule?.projectId,
      name: form.name,
      triggerType: form.triggerType,
      triggerConfig: parseJsonOrThrow(form.triggerConfigText),
      enabled: form.enabled === 'true',
    }), 'Rule saved');
    if (saved) {
      await load();
    }
  };

  const remove = async () => {
    await action.run(() => context.services.automation.deleteRule(ruleId), 'Rule deleted');
    navigate('/automation');
  };

  return (
    <DetailLayout backTo="/automation" title="Automation Rule Detail">
      <Panel title="Rule" icon={<FiCpu />}>
        <form className="stack" onSubmit={save}>
          <TextField label="Name" value={form.name} onChange={(name) => setForm({ ...form, name })} />
          <SelectField label="Trigger" value={form.triggerType} onChange={(triggerType) => setForm({ ...form, triggerType })} options={['manual', 'work_item.updated', 'work_item.created', 'schedule']} />
          <SelectField label="Enabled" value={form.enabled} onChange={(enabled) => setForm({ ...form, enabled })} options={['true', 'false']} />
          <Field label="Trigger JSON">
            <textarea value={form.triggerConfigText} onChange={(event) => setForm({ ...form, triggerConfigText: event.target.value })} rows={7} spellCheck="false" />
          </Field>
          <div className="button-row wrap">
            <button className="primary-button" disabled={action.pending} type="submit"><FiCheck />Save</button>
            <button className="icon-button danger" disabled={action.pending} onClick={remove} title="Delete rule" type="button"><FiX /></button>
            <button className="secondary-button" disabled={action.pending} onClick={load} type="button"><FiRefreshCw />Reload</button>
          </div>
        </form>
        <ErrorLine message={action.error} />
      </Panel>
      <Panel title="Conditions And Actions" icon={<FiSettings />} wide>
        <div className="data-columns two no-margin">
          <JsonRecordEditor
            records={rule?.conditions || []}
            title="Conditions"
            onDelete={(record) => context.services.automation.deleteCondition(ruleId, record.id)}
            onSave={(record, draft) => context.services.automation.updateCondition(ruleId, record.id, pick(draft, ['conditionType', 'config', 'position']))}
            onSuccess={load}
            action={action}
          />
          <JsonRecordEditor
            records={rule?.actions || []}
            title="Actions"
            onDelete={(record) => context.services.automation.deleteAction(ruleId, record.id)}
            onSave={(record, draft) => context.services.automation.updateAction(ruleId, record.id, pick(draft, ['actionType', 'executionMode', 'config', 'position']))}
            onSuccess={load}
            action={action}
          />
        </div>
        <JsonPreview title="Jobs" value={jobs} />
      </Panel>
    </DetailLayout>
  );
};

export const WebhookDetailPage = ({ context }) => {
  const { webhookId } = useParams();
  const navigate = useNavigate();
  const action = useApiAction(context.addToast);
  const [webhook, setWebhook] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [form, setForm] = useState({ name: '', url: '', secret: '', previousSecretOverlapSeconds: '', eventTypesText: '[]', enabled: 'true' });

  const load = async () => {
    const rows = await action.run(() => context.services.automation.listWebhooks(context.workspaceId));
    if (rows) {
      const selected = (rows || []).find((row) => row.id === webhookId) || null;
      const deliveryRows = await action.run(() => context.services.automation.listWebhookDeliveries(webhookId));
      setWebhook(selected);
      setDeliveries(deliveryRows || []);
      if (selected) {
        setForm({
          name: selected.name || '',
          url: selected.url || '',
          secret: '',
          previousSecretOverlapSeconds: selected.previousSecretOverlapSeconds ? String(selected.previousSecretOverlapSeconds) : '',
          eventTypesText: toJsonText(selected.eventTypes || []),
          enabled: String(selected.enabled ?? true),
        });
      }
    }
  };

  useEffect(() => {
    load();
  }, [webhookId, context.workspaceId]);

  const save = async (event) => {
    event.preventDefault();
    const saved = await action.run(() => context.services.automation.updateWebhook(webhookId, {
      name: form.name,
      url: form.url,
      secret: form.secret || undefined,
      previousSecretOverlapSeconds: numberOrUndefined(form.previousSecretOverlapSeconds),
      eventTypes: parseJsonOrThrow(form.eventTypesText),
      enabled: form.enabled === 'true',
    }), 'Webhook saved');
    if (saved) {
      await load();
    }
  };

  const remove = async () => {
    await action.run(() => context.services.automation.deleteWebhook(webhookId), 'Webhook disabled');
    navigate('/automation');
  };

  return (
    <DetailLayout backTo="/automation" title="Webhook Detail">
      <Panel title="Webhook" icon={<FiSend />}>
        <form className="stack" onSubmit={save}>
          <TextField label="Name" value={form.name} onChange={(name) => setForm({ ...form, name })} />
          <TextField label="URL" value={form.url} onChange={(url) => setForm({ ...form, url })} />
          <TextField label="Secret" type="password" value={form.secret} onChange={(secret) => setForm({ ...form, secret })} />
          <TextField label="Secret overlap seconds" type="number" value={form.previousSecretOverlapSeconds} onChange={(previousSecretOverlapSeconds) => setForm({ ...form, previousSecretOverlapSeconds })} />
          <SelectField label="Enabled" value={form.enabled} onChange={(enabled) => setForm({ ...form, enabled })} options={['true', 'false']} />
          <Field label="Event types JSON">
            <textarea value={form.eventTypesText} onChange={(event) => setForm({ ...form, eventTypesText: event.target.value })} rows={6} spellCheck="false" />
          </Field>
          <div className="button-row wrap">
            <button className="primary-button" disabled={action.pending} type="submit"><FiCheck />Save</button>
            <button className="icon-button danger" disabled={action.pending} onClick={remove} title="Disable webhook" type="button"><FiX /></button>
            <button className="secondary-button" disabled={action.pending} onClick={load} type="button"><FiRefreshCw />Reload</button>
          </div>
        </form>
        <ErrorLine message={action.error} />
      </Panel>
      <Panel title="Deliveries" icon={<FiEye />} wide>
        <JsonPreview title="Webhook" value={webhook} />
        <JsonPreview title="Deliveries" value={deliveries} />
      </Panel>
    </DetailLayout>
  );
};
