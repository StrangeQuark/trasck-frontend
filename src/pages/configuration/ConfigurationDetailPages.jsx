import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiCheck, FiEye, FiLayers, FiList, FiRefreshCw, FiSliders, FiX } from 'react-icons/fi';
import { DetailLayout } from '../../components/DetailLayout';
import { ErrorLine } from '../../components/ErrorLine';
import { Field } from '../../components/Field';
import { JsonPreview } from '../../components/JsonPreview';
import { JsonRecordEditor } from '../../components/JsonRecordEditor';
import { Panel } from '../../components/Panel';
import { SelectField } from '../../components/SelectField';
import { TextField } from '../../components/TextField';
import { useApiAction } from '../../hooks/useApiAction';
import { parseJsonOrThrow, pick, toJsonText } from '../../utils/forms';

export const CustomFieldDetailPage = ({ context }) => {
  const { customFieldId } = useParams();
  const navigate = useNavigate();
  const action = useApiAction(context.addToast);
  const [field, setField] = useState(null);
  const [contexts, setContexts] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [form, setForm] = useState({ name: '', key: '', fieldType: 'text', optionsText: '{}', searchable: 'false', archived: 'false' });
  const canManageWorkspace = context.hasWorkspacePermission('workspace.admin');

  const load = async () => {
    const result = await action.run(() => Promise.all([
      context.services.configuration.getCustomField(customFieldId),
      context.services.configuration.listCustomFieldContexts(customFieldId),
      context.services.configuration.listFieldConfigurations(context.workspaceId),
    ]));
    if (result) {
      const [fieldRow, contextRows, configRows] = result;
      setField(fieldRow);
      setContexts(contextRows || []);
      setConfigs((configRows || []).filter((row) => row.customFieldId === customFieldId));
      setForm({
        name: fieldRow.name || '',
        key: fieldRow.key || '',
        fieldType: fieldRow.fieldType || 'text',
        optionsText: toJsonText(fieldRow.options || {}),
        searchable: String(Boolean(fieldRow.searchable)),
        archived: String(Boolean(fieldRow.archived)),
      });
    }
  };

  useEffect(() => {
    load();
  }, [customFieldId]);

  const save = async (event) => {
    event.preventDefault();
    if (!canManageWorkspace) {
      action.setError('Your current workspace role cannot update custom fields');
      return;
    }
    const saved = await action.run(() => context.services.configuration.updateCustomField(customFieldId, {
      name: form.name,
      key: form.key,
      fieldType: form.fieldType,
      options: parseJsonOrThrow(form.optionsText),
      searchable: form.searchable === 'true',
      archived: form.archived === 'true',
    }), 'Custom field saved');
    if (saved) {
      await load();
    }
  };

  const archive = async () => {
    if (!canManageWorkspace) {
      action.setError('Your current workspace role cannot archive custom fields');
      return;
    }
    await action.run(() => context.services.configuration.archiveCustomField(customFieldId), 'Custom field archived');
    navigate('/configuration');
  };

  return (
    <DetailLayout backTo="/configuration" title="Custom Field Detail">
      <Panel title="Field" icon={<FiSliders />}>
        <form className="stack" onSubmit={save}>
          <TextField label="Name" value={form.name} onChange={(name) => setForm({ ...form, name })} />
          <TextField label="Key" value={form.key} onChange={(key) => setForm({ ...form, key })} />
          <SelectField label="Type" value={form.fieldType} onChange={(fieldType) => setForm({ ...form, fieldType })} options={['text', 'number', 'date', 'datetime', 'boolean', 'single_select', 'multi_select', 'json']} />
          <SelectField label="Searchable" value={form.searchable} onChange={(searchable) => setForm({ ...form, searchable })} options={['true', 'false']} />
          <SelectField label="Archived" value={form.archived} onChange={(archived) => setForm({ ...form, archived })} options={['false', 'true']} />
          <Field label="Options JSON">
            <textarea value={form.optionsText} onChange={(event) => setForm({ ...form, optionsText: event.target.value })} rows={6} spellCheck="false" />
          </Field>
          <div className="button-row wrap">
            <button className="primary-button" disabled={action.pending || !canManageWorkspace} type="submit"><FiCheck />Save</button>
            <button className="icon-button danger" disabled={action.pending || !canManageWorkspace} onClick={archive} title="Archive custom field" type="button"><FiX /></button>
            <button className="secondary-button" disabled={action.pending} onClick={load} type="button"><FiRefreshCw />Reload</button>
          </div>
        </form>
        <ErrorLine message={action.error} />
      </Panel>
      <Panel title="Contexts And Configs" icon={<FiLayers />} wide>
        {canManageWorkspace ? (
          <div className="data-columns two no-margin">
            <JsonRecordEditor
              records={contexts}
              title="Contexts"
              onDelete={(record) => context.services.configuration.deleteCustomFieldContext(customFieldId, record.id)}
              onSave={(record, draft) => context.services.configuration.updateCustomFieldContext(customFieldId, record.id, pick(draft, ['projectId', 'workItemTypeId', 'required', 'defaultValue', 'validationConfig']))}
              onSuccess={load}
              action={action}
            />
            <JsonRecordEditor
              records={configs}
              title="Field Configurations"
              onDelete={(record) => context.services.configuration.deleteFieldConfiguration(record.id)}
              onSave={(record, draft) => context.services.configuration.updateFieldConfiguration(record.id, pick(draft, ['projectId', 'workItemTypeId', 'required', 'hidden', 'defaultValue', 'validationConfig']))}
              onSuccess={load}
              action={action}
            />
          </div>
        ) : (
          <p className="muted">Context and field configuration records are read-only for your current workspace membership.</p>
        )}
        <JsonPreview title="Field" value={field} />
      </Panel>
    </DetailLayout>
  );
};

export const ScreenDetailPage = ({ context }) => {
  const { screenId } = useParams();
  const navigate = useNavigate();
  const action = useApiAction(context.addToast);
  const [screen, setScreen] = useState(null);
  const [fields, setFields] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [form, setForm] = useState({ name: '', screenType: 'edit', configText: '{}' });
  const canManageWorkspace = context.hasWorkspacePermission('workspace.admin');

  const load = async () => {
    const result = await action.run(() => Promise.all([
      context.services.configuration.getScreen(screenId),
      context.services.configuration.listScreenFields(screenId),
      context.services.configuration.listScreenAssignments(screenId),
    ]));
    if (result) {
      const [screenRow, fieldRows, assignmentRows] = result;
      setScreen(screenRow);
      setFields(fieldRows || []);
      setAssignments(assignmentRows || []);
      setForm({
        name: screenRow.name || '',
        screenType: screenRow.screenType || 'edit',
        configText: toJsonText(screenRow.config || {}),
      });
    }
  };

  useEffect(() => {
    load();
  }, [screenId]);

  const save = async (event) => {
    event.preventDefault();
    if (!canManageWorkspace) {
      action.setError('Your current workspace role cannot update screens');
      return;
    }
    const saved = await action.run(() => context.services.configuration.updateScreen(screenId, {
      name: form.name,
      screenType: form.screenType,
      config: parseJsonOrThrow(form.configText),
    }), 'Screen saved');
    if (saved) {
      await load();
    }
  };

  const archive = async () => {
    if (!canManageWorkspace) {
      action.setError('Your current workspace role cannot delete screens');
      return;
    }
    await action.run(() => context.services.configuration.deleteScreen(screenId), 'Screen deleted');
    navigate('/configuration');
  };

  return (
    <DetailLayout backTo="/configuration" title="Screen Detail">
      <Panel title="Screen" icon={<FiEye />}>
        <form className="stack" onSubmit={save}>
          <TextField label="Name" value={form.name} onChange={(name) => setForm({ ...form, name })} />
          <SelectField label="Type" value={form.screenType} onChange={(screenType) => setForm({ ...form, screenType })} options={['create', 'edit', 'view']} />
          <Field label="Config JSON">
            <textarea value={form.configText} onChange={(event) => setForm({ ...form, configText: event.target.value })} rows={7} spellCheck="false" />
          </Field>
          <div className="button-row wrap">
            <button className="primary-button" disabled={action.pending || !canManageWorkspace} type="submit"><FiCheck />Save</button>
            <button className="icon-button danger" disabled={action.pending || !canManageWorkspace} onClick={archive} title="Delete screen" type="button"><FiX /></button>
            <button className="secondary-button" disabled={action.pending} onClick={load} type="button"><FiRefreshCw />Reload</button>
          </div>
        </form>
        <ErrorLine message={action.error} />
      </Panel>
      <Panel title="Layout Records" icon={<FiList />} wide>
        {canManageWorkspace ? (
          <div className="data-columns two no-margin">
            <JsonRecordEditor
              records={fields}
              title="Fields"
              onDelete={(record) => context.services.configuration.deleteScreenField(screenId, record.id)}
              onSave={(record, draft) => context.services.configuration.updateScreenField(screenId, record.id, pick(draft, ['customFieldId', 'systemFieldKey', 'position', 'required']))}
              onSuccess={load}
              action={action}
            />
            <JsonRecordEditor
              records={assignments}
              title="Assignments"
              onDelete={(record) => context.services.configuration.deleteScreenAssignment(screenId, record.id)}
              onSave={(record, draft) => context.services.configuration.updateScreenAssignment(screenId, record.id, pick(draft, ['projectId', 'workItemTypeId', 'operation', 'priority']))}
              onSuccess={load}
              action={action}
            />
          </div>
        ) : (
          <p className="muted">Screen fields and assignments are read-only for your current workspace membership.</p>
        )}
        <JsonPreview title="Screen" value={screen} />
      </Panel>
    </DetailLayout>
  );
};
