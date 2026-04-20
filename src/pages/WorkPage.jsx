import { useState } from 'react';
import { FiList, FiPlus, FiRefreshCw } from 'react-icons/fi';
import { ErrorLine } from '../components/ErrorLine';
import { JsonPreview } from '../components/JsonPreview';
import { Panel } from '../components/Panel';
import { ResultList } from '../components/ResultList';
import { SelectField } from '../components/SelectField';
import { TextField } from '../components/TextField';
import { useApiAction } from '../hooks/useApiAction';

export const WorkPage = ({ context }) => {
  const [workQuery, setWorkQuery] = useState({ customFieldKey: '', customFieldOperator: 'eq', customFieldValue: '', customFieldValueTo: '' });
  const [items, setItems] = useState([]);
  const [nextCursor, setNextCursor] = useState('');
  const [selected, setSelected] = useState(null);
  const [newWorkItem, setNewWorkItem] = useState({ typeKey: 'story', title: 'New work item' });
  const action = useApiAction(context.addToast);

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
    if (!context.projectId) {
      action.setError('Project ID is required');
      return;
    }
    const page = await action.run(() => context.services.workItems.listByProject(context.projectId, queryParams(cursor)));
    if (page) {
      const loaded = Array.isArray(page.items) ? page.items : [];
      setItems(cursor ? [...items, ...loaded] : loaded);
      setNextCursor(page.nextCursor || '');
    }
  };

  const create = async (event) => {
    event.preventDefault();
    if (!context.projectId) {
      action.setError('Project ID is required');
      return;
    }
    const created = await action.run(() => context.services.workItems.create(context.projectId, newWorkItem), 'Work item created');
    if (created) {
      setSelected(created);
      await loadItems();
    }
  };

  const openItem = async (workItemId) => {
    const item = await action.run(() => context.services.workItems.get(workItemId));
    if (item) {
      setSelected(item);
    }
  };

  return (
    <Panel title="Project Work" icon={<FiList />} wide>
      <div className="work-layout">
        <form className="stack" onSubmit={(event) => { event.preventDefault(); loadItems(); }}>
          <div className="two-column compact">
            <TextField label="Project ID" value={context.projectId} onChange={context.setProjectId} />
            <TextField label="Custom field" value={workQuery.customFieldKey} onChange={(customFieldKey) => setWorkQuery({ ...workQuery, customFieldKey })} />
            <SelectField label="Operator" value={workQuery.customFieldOperator} onChange={(customFieldOperator) => setWorkQuery({ ...workQuery, customFieldOperator })} options={['eq', 'ne', 'contains', 'not_contains', 'in', 'gt', 'gte', 'lt', 'lte', 'between']} />
            <TextField label="Value" value={workQuery.customFieldValue} onChange={(customFieldValue) => setWorkQuery({ ...workQuery, customFieldValue })} />
            <TextField label="Value to" value={workQuery.customFieldValueTo} onChange={(customFieldValueTo) => setWorkQuery({ ...workQuery, customFieldValueTo })} />
          </div>
          <div className="button-row">
            <button className="primary-button" disabled={action.pending} type="submit"><FiRefreshCw />Load</button>
            <button className="secondary-button" disabled={!nextCursor || action.pending} onClick={() => loadItems(nextCursor)} type="button">More</button>
          </div>
        </form>
        <form className="stack create-strip" onSubmit={create}>
          <TextField label="Type key" value={newWorkItem.typeKey} onChange={(typeKey) => setNewWorkItem({ ...newWorkItem, typeKey })} />
          <TextField label="Title" value={newWorkItem.title} onChange={(title) => setNewWorkItem({ ...newWorkItem, title })} />
          <button className="secondary-button" disabled={action.pending} type="submit"><FiPlus />Create</button>
        </form>
        <ErrorLine message={action.error} />
        <div className="work-columns">
          <ResultList items={items} titleKey="title" eyebrowKey="key" onOpen={(item) => openItem(item.id)} />
          <JsonPreview title="Detail" value={selected} />
        </div>
      </div>
    </Panel>
  );
};
