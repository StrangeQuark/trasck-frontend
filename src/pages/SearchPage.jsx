import { useEffect, useState } from 'react';
import { FiDatabase, FiEye, FiFilter, FiLayers, FiPlus, FiRefreshCw, FiSettings } from 'react-icons/fi';
import { ErrorLine } from '../components/ErrorLine';
import { Field } from '../components/Field';
import { JsonPreview } from '../components/JsonPreview';
import { Panel } from '../components/Panel';
import { RecordSelect } from '../components/RecordSelect';
import { SelectField } from '../components/SelectField';
import { TextField } from '../components/TextField';
import { defaultSavedFilterQuery } from '../constants/appConstants';
import { useApiAction } from '../hooks/useApiAction';
import { parseJson, parseJsonOrThrow } from '../utils/forms';

export const SearchPage = ({ context }) => {
  const [filters, setFilters] = useState([]);
  const [views, setViews] = useState([]);
  const [results, setResults] = useState(null);
  const [savedFilterId, setSavedFilterId] = useState('');
  const [filterForm, setFilterForm] = useState({
    name: 'Open work search',
    visibility: 'project',
    projectId: context.projectId,
    teamId: '',
    sortField: 'workspaceSequenceNumber',
    sortDirection: 'asc',
    queryText: JSON.stringify({ ...defaultSavedFilterQuery, projectId: context.projectId }, null, 2),
  });
  const [viewForm, setViewForm] = useState({
    name: 'Project work view',
    viewType: 'work_items',
    visibility: 'project',
    configText: JSON.stringify({ columns: ['key', 'title', 'statusKey', 'assigneeId'] }, null, 2),
  });
  const action = useApiAction(context.addToast);

  useEffect(() => {
    setFilterForm((current) => {
      if (current.projectId || !context.projectId) {
        return current;
      }
      return {
        ...current,
        projectId: context.projectId,
        queryText: JSON.stringify({ ...defaultSavedFilterQuery, projectId: context.projectId }, null, 2),
      };
    });
  }, [context.projectId]);

  const load = async () => {
    if (!context.workspaceId) {
      action.setError('Select a workspace before loading filters');
      return;
    }
    const result = await action.run(() => Promise.all([
      context.services.search.listSavedFilters(context.workspaceId),
      context.services.search.listSavedViews(context.workspaceId),
    ]));
    if (result) {
      const [filterRows, viewRows] = result;
      setFilters(filterRows || []);
      setViews(viewRows || []);
    }
  };

  const syncStructuredQuery = () => {
    const query = parseJson(filterForm.queryText, defaultSavedFilterQuery);
    query.entityType = 'work_item';
    query.projectId = filterForm.projectId || context.projectId || query.projectId;
    query.sort = [{ field: filterForm.sortField, direction: filterForm.sortDirection }];
    setFilterForm({ ...filterForm, queryText: JSON.stringify(query, null, 2) });
  };

  const createFilter = async (event) => {
    event.preventDefault();
    const saved = await action.run(() => {
      const query = parseJsonOrThrow(filterForm.queryText);
      return context.services.search.createSavedFilter(context.workspaceId, {
        name: filterForm.name,
        visibility: filterForm.visibility,
        projectId: filterForm.visibility === 'project' ? filterForm.projectId || context.projectId : undefined,
        teamId: filterForm.visibility === 'team' ? filterForm.teamId : undefined,
        query,
      });
    }, 'Saved filter created');
    if (saved) {
      setSavedFilterId(saved.id || '');
      await load();
    }
  };

  const executeFilter = async (cursor = '') => {
    if (!savedFilterId) {
      action.setError('Select a saved filter first');
      return;
    }
    const page = await action.run(() => context.services.search.executeSavedFilter(savedFilterId, {
      limit: 25,
      cursor: cursor || undefined,
    }));
    if (page) {
      setResults(page);
    }
  };

  const createView = async (event) => {
    event.preventDefault();
    const saved = await action.run(() => context.services.search.createSavedView(context.workspaceId, {
      name: viewForm.name,
      viewType: viewForm.viewType,
      visibility: viewForm.visibility,
      projectId: viewForm.visibility === 'project' ? context.projectId : undefined,
      config: parseJsonOrThrow(viewForm.configText),
    }), 'Saved view created');
    if (saved) {
      await load();
    }
  };

  return (
    <div className="content-grid">
      <Panel title="Saved Filter Builder" icon={<FiFilter />} wide>
        <form className="stack" onSubmit={createFilter}>
          <div className="two-column compact">
            <TextField label="Name" value={filterForm.name} onChange={(name) => setFilterForm({ ...filterForm, name })} />
            <SelectField label="Visibility" value={filterForm.visibility} onChange={(visibility) => setFilterForm({ ...filterForm, visibility })} options={['private', 'project', 'team', 'workspace', 'public']} />
            <RecordSelect
              includeBlank
              label="Project"
              records={context.projectOptions.filter((project) => project.workspaceId === context.workspaceId)}
              value={filterForm.projectId}
              onChange={(projectId) => setFilterForm({ ...filterForm, projectId })}
            />
            <SelectField label="Sort" value={filterForm.sortField} onChange={(sortField) => setFilterForm({ ...filterForm, sortField })} options={['workspaceSequenceNumber', 'rank', 'createdAt', 'updatedAt', 'dueDate', 'priority']} />
            <SelectField label="Direction" value={filterForm.sortDirection} onChange={(sortDirection) => setFilterForm({ ...filterForm, sortDirection })} options={['asc', 'desc']} />
          </div>
          <details className="advanced-field">
            <summary>Team scope</summary>
            <TextField label="Team" value={filterForm.teamId} onChange={(teamId) => setFilterForm({ ...filterForm, teamId })} />
          </details>
          <button className="secondary-button" onClick={syncStructuredQuery} type="button"><FiSettings />Sync</button>
          <Field label="Expert JSON">
            <textarea value={filterForm.queryText} onChange={(event) => setFilterForm({ ...filterForm, queryText: event.target.value })} rows={14} spellCheck="false" />
          </Field>
          <div className="button-row wrap">
            <button className="primary-button" disabled={action.pending || !context.workspaceId} type="submit"><FiPlus />Create filter</button>
            <button className="secondary-button" disabled={action.pending} onClick={load} type="button"><FiRefreshCw />Refresh</button>
          </div>
        </form>
      </Panel>
      <Panel title="Execute" icon={<FiEye />}>
        <div className="stack">
          <RecordSelect label="Saved filter" records={filters} value={savedFilterId} onChange={setSavedFilterId} />
          <button className="primary-button" disabled={action.pending || !savedFilterId} onClick={() => executeFilter()} type="button"><FiRefreshCw />Run</button>
          <button className="secondary-button" disabled={action.pending || !results?.nextCursor} onClick={() => executeFilter(results.nextCursor)} type="button">More</button>
          <ErrorLine message={action.error} />
        </div>
        <JsonPreview title="Results" value={results} />
      </Panel>
      <Panel title="Saved View" icon={<FiLayers />}>
        <form className="stack" onSubmit={createView}>
          <TextField label="Name" value={viewForm.name} onChange={(name) => setViewForm({ ...viewForm, name })} />
          <SelectField label="Visibility" value={viewForm.visibility} onChange={(visibility) => setViewForm({ ...viewForm, visibility })} options={['private', 'project', 'team', 'workspace', 'public']} />
          <Field label="Config JSON">
            <textarea value={viewForm.configText} onChange={(event) => setViewForm({ ...viewForm, configText: event.target.value })} rows={8} spellCheck="false" />
          </Field>
          <button className="primary-button" disabled={action.pending || !context.workspaceId} type="submit"><FiPlus />Create view</button>
        </form>
      </Panel>
      <Panel title="Catalog" icon={<FiDatabase />} wide>
        <div className="data-columns two">
          <JsonPreview title="Filters" value={filters} />
          <JsonPreview title="Views" value={views} />
        </div>
      </Panel>
    </div>
  );
};
