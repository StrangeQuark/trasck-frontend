import { useState } from 'react';
import { FiCheck, FiEye, FiLayers, FiList, FiPlus, FiRefreshCw, FiSettings, FiSliders } from 'react-icons/fi';
import { DetailLinkGrid } from '../../components/DetailLinkGrid';
import { ErrorLine } from '../../components/ErrorLine';
import { Field } from '../../components/Field';
import { JsonPreview } from '../../components/JsonPreview';
import { Panel } from '../../components/Panel';
import { RecordSelect } from '../../components/RecordSelect';
import { SelectField } from '../../components/SelectField';
import { TextField } from '../../components/TextField';
import { useApiAction } from '../../hooks/useApiAction';
import { firstId, parseJsonOrThrow } from '../../utils/forms';

export const ConfigurationPage = ({ context }) => {
  const [customFields, setCustomFields] = useState([]);
  const [fieldConfigurations, setFieldConfigurations] = useState([]);
  const [screens, setScreens] = useState([]);
  const [screenId, setScreenId] = useState('');
  const [screenFields, setScreenFields] = useState([]);
  const [screenAssignments, setScreenAssignments] = useState([]);
  const [fieldForm, setFieldForm] = useState({ name: 'Story Points', key: 'story_points', fieldType: 'number', optionsText: '{}', searchable: 'true' });
  const [contextForm, setContextForm] = useState({ customFieldId: '', required: 'false', defaultValueText: 'null', validationConfigText: '{}' });
  const [configurationForm, setConfigurationForm] = useState({ customFieldId: '', required: 'false', hidden: 'false', defaultValueText: 'null', validationConfigText: '{}' });
  const [screenForm, setScreenForm] = useState({ name: 'Story Edit', screenType: 'edit', configText: '{}' });
  const [screenFieldForm, setScreenFieldForm] = useState({ customFieldId: '', systemFieldKey: '', position: '1', required: 'false' });
  const [assignmentForm, setAssignmentForm] = useState({ operation: 'edit', priority: '100' });
  const action = useApiAction(context.addToast);

  const load = async () => {
    if (!context.workspaceId) {
      action.setError('Workspace ID is required');
      return;
    }
    const result = await action.run(async () => {
      const [fieldRows, configRows, screenRows] = await Promise.all([
        context.services.configuration.listCustomFields(context.workspaceId),
        context.services.configuration.listFieldConfigurations(context.workspaceId),
        context.services.configuration.listScreens(context.workspaceId),
      ]);
      const nextScreenId = screenId || firstId(screenRows);
      const [screenFieldRows, assignmentRows] = await Promise.all([
        nextScreenId ? context.services.configuration.listScreenFields(nextScreenId) : Promise.resolve([]),
        nextScreenId ? context.services.configuration.listScreenAssignments(nextScreenId) : Promise.resolve([]),
      ]);
      return { fieldRows, configRows, screenRows, nextScreenId, screenFieldRows, assignmentRows };
    });
    if (result) {
      setCustomFields(result.fieldRows || []);
      setFieldConfigurations(result.configRows || []);
      setScreens(result.screenRows || []);
      setScreenId(result.nextScreenId || '');
      setScreenFields(result.screenFieldRows || []);
      setScreenAssignments(result.assignmentRows || []);
      const nextFieldId = firstId(result.fieldRows) || '';
      if (nextFieldId && !contextForm.customFieldId) {
        setContextForm((current) => ({ ...current, customFieldId: nextFieldId }));
        setConfigurationForm((current) => ({ ...current, customFieldId: nextFieldId }));
        setScreenFieldForm((current) => ({ ...current, customFieldId: nextFieldId }));
      }
    }
  };

  const createCustomField = async (event) => {
    event.preventDefault();
    const field = await action.run(() => context.services.configuration.createCustomField(context.workspaceId, {
      name: fieldForm.name,
      key: fieldForm.key,
      fieldType: fieldForm.fieldType,
      options: parseJsonOrThrow(fieldForm.optionsText),
      searchable: fieldForm.searchable === 'true',
      archived: false,
    }), 'Custom field created');
    if (field) {
      setContextForm({ ...contextForm, customFieldId: field.id || contextForm.customFieldId });
      setConfigurationForm({ ...configurationForm, customFieldId: field.id || configurationForm.customFieldId });
      setScreenFieldForm({ ...screenFieldForm, customFieldId: field.id || screenFieldForm.customFieldId });
      await load();
    }
  };

  const createFieldContext = async (event) => {
    event.preventDefault();
    await action.run(() => context.services.configuration.createCustomFieldContext(contextForm.customFieldId, {
      projectId: context.projectId || undefined,
      required: contextForm.required === 'true',
      defaultValue: parseJsonOrThrow(contextForm.defaultValueText),
      validationConfig: parseJsonOrThrow(contextForm.validationConfigText),
    }), 'Field context created');
    await load();
  };

  const createFieldConfiguration = async (event) => {
    event.preventDefault();
    await action.run(() => context.services.configuration.createFieldConfiguration(context.workspaceId, {
      customFieldId: configurationForm.customFieldId,
      projectId: context.projectId || undefined,
      required: configurationForm.required === 'true',
      hidden: configurationForm.hidden === 'true',
      defaultValue: parseJsonOrThrow(configurationForm.defaultValueText),
      validationConfig: parseJsonOrThrow(configurationForm.validationConfigText),
    }), 'Field configuration created');
    await load();
  };

  const createScreen = async (event) => {
    event.preventDefault();
    const screen = await action.run(() => context.services.configuration.createScreen(context.workspaceId, {
      name: screenForm.name,
      screenType: screenForm.screenType,
      config: parseJsonOrThrow(screenForm.configText),
    }), 'Screen created');
    if (screen) {
      setScreenId(screen.id || '');
      await load();
    }
  };

  const loadScreenDetails = async () => {
    if (!screenId) {
      action.setError('Screen is required');
      return;
    }
    const result = await action.run(() => Promise.all([
      context.services.configuration.listScreenFields(screenId),
      context.services.configuration.listScreenAssignments(screenId),
    ]));
    if (result) {
      const [fieldRows, assignmentRows] = result;
      setScreenFields(fieldRows || []);
      setScreenAssignments(assignmentRows || []);
    }
  };

  const addScreenField = async (event) => {
    event.preventDefault();
    await action.run(() => context.services.configuration.addScreenField(screenId, {
      customFieldId: screenFieldForm.customFieldId || undefined,
      systemFieldKey: screenFieldForm.systemFieldKey || undefined,
      position: Number(screenFieldForm.position || 0),
      required: screenFieldForm.required === 'true',
    }), 'Screen field added');
    await loadScreenDetails();
  };

  const addScreenAssignment = async (event) => {
    event.preventDefault();
    await action.run(() => context.services.configuration.addScreenAssignment(screenId, {
      projectId: context.projectId || undefined,
      operation: assignmentForm.operation,
      priority: Number(assignmentForm.priority || 0),
    }), 'Screen assigned');
    await loadScreenDetails();
  };

  return (
    <div className="content-grid">
      <Panel title="Custom Field" icon={<FiSliders />}>
        <form className="stack" onSubmit={createCustomField}>
          <TextField label="Name" value={fieldForm.name} onChange={(name) => setFieldForm({ ...fieldForm, name })} />
          <TextField label="Key" value={fieldForm.key} onChange={(key) => setFieldForm({ ...fieldForm, key })} />
          <SelectField label="Type" value={fieldForm.fieldType} onChange={(fieldType) => setFieldForm({ ...fieldForm, fieldType })} options={['text', 'number', 'date', 'datetime', 'boolean', 'single_select', 'multi_select', 'json']} />
          <SelectField label="Searchable" value={fieldForm.searchable} onChange={(searchable) => setFieldForm({ ...fieldForm, searchable })} options={['true', 'false']} />
          <Field label="Options JSON">
            <textarea value={fieldForm.optionsText} onChange={(event) => setFieldForm({ ...fieldForm, optionsText: event.target.value })} rows={5} spellCheck="false" />
          </Field>
          <button className="primary-button" disabled={action.pending || !context.workspaceId} type="submit"><FiPlus />Create field</button>
        </form>
      </Panel>
      <Panel title="Context" icon={<FiLayers />}>
        <form className="stack" onSubmit={createFieldContext}>
          <RecordSelect label="Custom field" records={customFields} value={contextForm.customFieldId} onChange={(customFieldId) => setContextForm({ ...contextForm, customFieldId })} />
          <SelectField label="Required" value={contextForm.required} onChange={(required) => setContextForm({ ...contextForm, required })} options={['false', 'true']} />
          <Field label="Default JSON">
            <textarea value={contextForm.defaultValueText} onChange={(event) => setContextForm({ ...contextForm, defaultValueText: event.target.value })} rows={3} spellCheck="false" />
          </Field>
          <button className="primary-button" disabled={action.pending || !contextForm.customFieldId} type="submit"><FiPlus />Add context</button>
        </form>
      </Panel>
      <Panel title="Field Configuration" icon={<FiSettings />}>
        <form className="stack" onSubmit={createFieldConfiguration}>
          <RecordSelect label="Custom field" records={customFields} value={configurationForm.customFieldId} onChange={(customFieldId) => setConfigurationForm({ ...configurationForm, customFieldId })} />
          <div className="two-column compact">
            <SelectField label="Required" value={configurationForm.required} onChange={(required) => setConfigurationForm({ ...configurationForm, required })} options={['false', 'true']} />
            <SelectField label="Hidden" value={configurationForm.hidden} onChange={(hidden) => setConfigurationForm({ ...configurationForm, hidden })} options={['false', 'true']} />
          </div>
          <Field label="Validation JSON">
            <textarea value={configurationForm.validationConfigText} onChange={(event) => setConfigurationForm({ ...configurationForm, validationConfigText: event.target.value })} rows={4} spellCheck="false" />
          </Field>
          <button className="primary-button" disabled={action.pending || !configurationForm.customFieldId} type="submit"><FiPlus />Create config</button>
        </form>
      </Panel>
      <Panel title="Screen" icon={<FiEye />}>
        <form className="stack" onSubmit={createScreen}>
          <TextField label="Name" value={screenForm.name} onChange={(name) => setScreenForm({ ...screenForm, name })} />
          <SelectField label="Type" value={screenForm.screenType} onChange={(screenType) => setScreenForm({ ...screenForm, screenType })} options={['create', 'edit', 'view']} />
          <Field label="Config JSON">
            <textarea value={screenForm.configText} onChange={(event) => setScreenForm({ ...screenForm, configText: event.target.value })} rows={4} spellCheck="false" />
          </Field>
          <button className="primary-button" disabled={action.pending || !context.workspaceId} type="submit"><FiPlus />Create screen</button>
        </form>
      </Panel>
      <Panel title="Screen Layout" icon={<FiList />} wide>
        <div className="data-columns two no-margin">
          <form className="stack" onSubmit={addScreenField}>
            <RecordSelect label="Screen" records={screens} value={screenId} onChange={setScreenId} />
            <RecordSelect label="Custom field" records={customFields} value={screenFieldForm.customFieldId} onChange={(customFieldId) => setScreenFieldForm({ ...screenFieldForm, customFieldId, systemFieldKey: '' })} includeBlank />
            <TextField label="System field" value={screenFieldForm.systemFieldKey} onChange={(systemFieldKey) => setScreenFieldForm({ ...screenFieldForm, systemFieldKey, customFieldId: '' })} />
            <div className="two-column compact">
              <TextField label="Position" type="number" value={screenFieldForm.position} onChange={(position) => setScreenFieldForm({ ...screenFieldForm, position })} />
              <SelectField label="Required" value={screenFieldForm.required} onChange={(required) => setScreenFieldForm({ ...screenFieldForm, required })} options={['false', 'true']} />
            </div>
            <button className="primary-button" disabled={action.pending || !screenId || (!screenFieldForm.customFieldId && !screenFieldForm.systemFieldKey)} type="submit"><FiPlus />Add field</button>
          </form>
          <form className="stack" onSubmit={addScreenAssignment}>
            <RecordSelect label="Screen" records={screens} value={screenId} onChange={setScreenId} />
            <SelectField label="Operation" value={assignmentForm.operation} onChange={(operation) => setAssignmentForm({ ...assignmentForm, operation })} options={['create', 'edit', 'view']} />
            <TextField label="Priority" type="number" value={assignmentForm.priority} onChange={(priority) => setAssignmentForm({ ...assignmentForm, priority })} />
            <button className="primary-button" disabled={action.pending || !screenId || !context.projectId} type="submit"><FiCheck />Assign screen</button>
          </form>
        </div>
        <div className="button-row">
          <button className="secondary-button" disabled={action.pending} onClick={load} type="button"><FiRefreshCw />Load</button>
          <button className="secondary-button" disabled={action.pending || !screenId} onClick={loadScreenDetails} type="button">Screen details</button>
        </div>
        <ErrorLine message={action.error} />
        <div className="data-columns two no-margin">
          <DetailLinkGrid title="Custom Field Routes" items={customFields} basePath="/configuration/custom-fields" />
          <DetailLinkGrid title="Screen Routes" items={screens} basePath="/configuration/screens" />
        </div>
        <div className="data-columns">
          <JsonPreview title="Custom Fields" value={customFields} />
          <JsonPreview title="Field Configs" value={fieldConfigurations} />
          <JsonPreview title="Screens" value={screens} />
          <JsonPreview title="Screen Fields" value={screenFields} />
          <JsonPreview title="Assignments" value={screenAssignments} />
        </div>
      </Panel>
    </div>
  );
};
