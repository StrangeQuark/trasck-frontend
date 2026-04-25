import { useEffect, useState } from 'react';
import { FiList, FiPlus, FiRefreshCw } from 'react-icons/fi';
import { ErrorLine } from '../components/ErrorLine';
import { Panel } from '../components/Panel';
import { ResultList } from '../components/ResultList';
import { SelectField } from '../components/SelectField';
import { TextField } from '../components/TextField';
import { useApiAction } from '../hooks/useApiAction';
import { WorkItemDetail } from './work/WorkItemDetail';

export const WorkPage = ({ context }) => {
  const [workQuery, setWorkQuery] = useState({ customFieldKey: '', customFieldOperator: 'eq', customFieldValue: '', customFieldValueTo: '' });
  const [items, setItems] = useState([]);
  const [nextCursor, setNextCursor] = useState('');
  const [selected, setSelected] = useState(null);
  const [newWorkItem, setNewWorkItem] = useState({ typeKey: 'story', title: 'New work item', visibility: 'inherited' });
  const action = useApiAction(context.addToast);
  const canReadWorkItems = context.hasProjectPermission('work_item.read');
  const canCreateWorkItems = context.hasProjectPermission('work_item.create');

  const queryParams = (cursor) => {
    const query = { limit: 25 };
    if (cursor) {
      query.cursor = cursor;
    }
    if (workQuery.customFieldKey.trim() && workQuery.customFieldValue.trim()) {
      query.customFieldKey = workQuery.customFieldKey.trim();
      query.customFieldOperator = workQuery.customFieldOperator;
      query.customFieldValue = workQuery.customFieldValue.trim();
      if (workQuery.customFieldOperator === 'between' && workQuery.customFieldValueTo.trim()) {
        query.customFieldValueTo = workQuery.customFieldValueTo.trim();
      }
    }
    return query;
  };

  const loadItems = async (cursor = '') => {
    if (!canReadWorkItems) {
      action.setError('Your current project role cannot read work items');
      return;
    }
    if (!context.projectId) {
      action.setError('Select a project before loading work items');
      return;
    }
    const page = await action.run(() => context.services.workItems.listByProject(context.projectId, queryParams(cursor)));
    if (page) {
      const loaded = Array.isArray(page.items) ? page.items : [];
      setItems((currentItems) => (cursor ? [...currentItems, ...loaded] : loaded));
      setNextCursor(page.nextCursor || '');
    }
  };

  const create = async (event) => {
    event.preventDefault();
    if (!canCreateWorkItems) {
      action.setError('Your current project role cannot create work items');
      return;
    }
    if (!context.projectId) {
      action.setError('Select a project before creating work items');
      return;
    }
    const created = await action.run(() => context.services.workItems.create(context.projectId, newWorkItem), 'Work item created');
    if (created) {
      setSelected(created);
      await loadItems();
    }
  };

  useEffect(() => {
    if (context.projectId && canReadWorkItems) {
      loadItems();
    }
  }, [context.projectId, canReadWorkItems]);

  const openItem = async (workItemId) => {
    if (!canReadWorkItems) {
      action.setError('Your current project role cannot open work items');
      return;
    }
    const item = await action.run(() => context.services.workItems.get(workItemId));
    if (item) {
      setSelected(item);
    }
  };

  return (
    <Panel title="Project Work" icon={<FiList />} wide>
      <div className="work-layout">
        <div className="work-command-bar">
          <div className="metric-strip">
            <div>
              <span>Total loaded</span>
              <strong>{items.length}</strong>
            </div>
            <div>
              <span>Selected</span>
              <strong>{selected?.key || 'None'}</strong>
            </div>
            <div>
              <span>Project</span>
              <strong>{context.projectOptions.find((project) => project.id === context.projectId)?.key || 'None'}</strong>
            </div>
          </div>
          <form className="button-row wrap" onSubmit={(event) => { event.preventDefault(); loadItems(); }}>
            <button className="primary-button" disabled={action.pending || !context.projectId} type="submit"><FiRefreshCw />Refresh</button>
            <button className="secondary-button" disabled={!nextCursor || action.pending} onClick={() => loadItems(nextCursor)} type="button">More</button>
          </form>
        </div>
        <form className="stack" onSubmit={(event) => { event.preventDefault(); loadItems(); }}>
          <details className="advanced-field">
            <summary>Custom field filters</summary>
            <div className="two-column compact">
              <TextField label="Custom field" value={workQuery.customFieldKey} onChange={(customFieldKey) => setWorkQuery({ ...workQuery, customFieldKey })} />
              <SelectField label="Operator" value={workQuery.customFieldOperator} onChange={(customFieldOperator) => setWorkQuery({ ...workQuery, customFieldOperator })} options={['eq', 'ne', 'contains', 'not_contains', 'in', 'gt', 'gte', 'lt', 'lte', 'between']} />
              <TextField label="Value" value={workQuery.customFieldValue} onChange={(customFieldValue) => setWorkQuery({ ...workQuery, customFieldValue })} />
              <TextField label="Value to" value={workQuery.customFieldValueTo} onChange={(customFieldValueTo) => setWorkQuery({ ...workQuery, customFieldValueTo })} />
            </div>
          </details>
        </form>
        {canCreateWorkItems && (
          <form className="stack create-strip" onSubmit={create}>
            <SelectField label="Type" value={newWorkItem.typeKey} onChange={(typeKey) => setNewWorkItem({ ...newWorkItem, typeKey })} options={['story', 'epic', 'task', 'bug']} />
            <TextField label="Title" value={newWorkItem.title} onChange={(title) => setNewWorkItem({ ...newWorkItem, title })} />
            <SelectField label="Work item visibility" value={newWorkItem.visibility} onChange={(visibility) => setNewWorkItem({ ...newWorkItem, visibility })} options={['inherited', 'public', 'private']} />
            <button className="secondary-button" disabled={action.pending} type="submit"><FiPlus />Create</button>
          </form>
        )}
        <ErrorLine message={action.error} />
        <div className="work-columns">
          <ResultList items={items} titleKey="title" eyebrowKey="key" selectedId={selected?.id} onOpen={(item) => openItem(item.id)} />
          <WorkItemDetail context={context} item={selected} projectItems={items} />
        </div>
      </div>
    </Panel>
  );
};
