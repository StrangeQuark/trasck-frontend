import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiActivity, FiBarChart2, FiCheck, FiEye, FiList, FiRefreshCw, FiSliders, FiX } from 'react-icons/fi';
import { BoardCardColumns } from '../../components/BoardCardColumns';
import { DetailLayout } from '../../components/DetailLayout';
import { ErrorLine } from '../../components/ErrorLine';
import { Field } from '../../components/Field';
import { JsonPreview } from '../../components/JsonPreview';
import { JsonRecordEditor } from '../../components/JsonRecordEditor';
import { Panel } from '../../components/Panel';
import { SelectField } from '../../components/SelectField';
import { TextField } from '../../components/TextField';
import { useApiAction } from '../../hooks/useApiAction';

export const BoardDetailPage = ({ context }) => {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const action = useApiAction(context.addToast);
  const [board, setBoard] = useState(null);
  const [columns, setColumns] = useState([]);
  const [swimlanes, setSwimlanes] = useState([]);
  const [cards, setCards] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'kanban', filterConfigText: '{}', active: 'true' });

  const load = async () => {
    const result = await action.run(() => Promise.all([
      context.services.planning.getBoard(boardId),
      context.services.planning.listBoardColumns(boardId),
      context.services.planning.listBoardSwimlanes(boardId),
      context.services.planning.listBoardWorkItems(boardId, { limitPerColumn: 50 }),
    ]));
    if (result) {
      const [boardRow, columnRows, swimlaneRows, cardRows] = result;
      setBoard(boardRow);
      setColumns(columnRows || []);
      setSwimlanes(swimlaneRows || []);
      setCards(cardRows || null);
      setForm({
        name: boardRow.name || '',
        type: boardRow.type || 'kanban',
        filterConfigText: toJsonText(boardRow.filterConfig || {}),
        active: String(boardRow.active ?? true),
      });
    }
  };

  useEffect(() => {
    load();
  }, [boardId]);

  const save = async (event) => {
    event.preventDefault();
    const saved = await action.run(() => context.services.planning.updateBoard(boardId, {
      name: form.name,
      type: form.type,
      filterConfig: parseJsonOrThrow(form.filterConfigText),
      active: form.active === 'true',
    }), 'Board saved');
    if (saved) {
      await load();
    }
  };

  const archive = async () => {
    await action.run(() => context.services.planning.archiveBoard(boardId), 'Board archived');
    navigate('/planning');
  };

  return (
    <DetailLayout backTo="/planning" title="Board Detail">
      <Panel title="Board" icon={<FiList />}>
        <form className="stack" onSubmit={save}>
          <TextField label="Name" value={form.name} onChange={(name) => setForm({ ...form, name })} />
          <SelectField label="Type" value={form.type} onChange={(type) => setForm({ ...form, type })} options={['kanban', 'scrum']} />
          <SelectField label="Active" value={form.active} onChange={(active) => setForm({ ...form, active })} options={['true', 'false']} />
          <Field label="Filter JSON">
            <textarea value={form.filterConfigText} onChange={(event) => setForm({ ...form, filterConfigText: event.target.value })} rows={7} spellCheck="false" />
          </Field>
          <div className="button-row wrap">
            <button className="primary-button" disabled={action.pending} type="submit"><FiCheck />Save</button>
            <button className="icon-button danger" disabled={action.pending} onClick={archive} title="Archive board" type="button"><FiX /></button>
            <button className="secondary-button" disabled={action.pending} onClick={load} type="button"><FiRefreshCw />Reload</button>
          </div>
        </form>
        <ErrorLine message={action.error} />
      </Panel>
      <Panel title="Columns And Swimlanes" icon={<FiSliders />} wide>
        <div className="data-columns two no-margin">
          <JsonRecordEditor
            records={columns}
            title="Columns"
            onDelete={(record) => context.services.planning.deleteBoardColumn(boardId, record.id)}
            onSave={(record, draft) => context.services.planning.updateBoardColumn(boardId, record.id, pick(draft, ['name', 'statusIds', 'position', 'wipLimit', 'doneColumn']))}
            onSuccess={load}
            action={action}
          />
          <JsonRecordEditor
            records={swimlanes}
            title="Swimlanes"
            onDelete={(record) => context.services.planning.deleteBoardSwimlane(boardId, record.id)}
            onSave={(record, draft) => context.services.planning.updateBoardSwimlane(boardId, record.id, pick(draft, ['name', 'swimlaneType', 'query', 'position', 'enabled']))}
            onSuccess={load}
            action={action}
          />
        </div>
      </Panel>
      <Panel title="Board Cards" icon={<FiEye />} wide>
        <BoardCardColumns boardWorkItems={cards} />
        <JsonPreview title="Board" value={board} />
      </Panel>
    </DetailLayout>
  );
};

export const ReleaseDetailPage = ({ context }) => {
  const { releaseId } = useParams();
  const navigate = useNavigate();
  const action = useApiAction(context.addToast);
  const [release, setRelease] = useState(null);
  const [scope, setScope] = useState([]);
  const [form, setForm] = useState({ name: '', version: '', startDate: '', releaseDate: '', status: 'planned', description: '' });

  const load = async () => {
    const result = await action.run(() => Promise.all([
      context.services.planning.getRelease(releaseId),
      context.services.planning.listReleaseWorkItems(releaseId),
    ]));
    if (result) {
      const [releaseRow, scopeRows] = result;
      setRelease(releaseRow);
      setScope(scopeRows || []);
      setForm({
        name: releaseRow.name || '',
        version: releaseRow.version || '',
        startDate: releaseRow.startDate || '',
        releaseDate: releaseRow.releaseDate || '',
        status: releaseRow.status || 'planned',
        description: releaseRow.description || '',
      });
    }
  };

  useEffect(() => {
    load();
  }, [releaseId]);

  const save = async (event) => {
    event.preventDefault();
    const saved = await action.run(() => context.services.planning.updateRelease(releaseId, {
      ...form,
      description: form.description || undefined,
    }), 'Release saved');
    if (saved) {
      await load();
    }
  };

  const archive = async () => {
    await action.run(() => context.services.planning.deleteRelease(releaseId), 'Release archived');
    navigate('/planning');
  };

  return (
    <DetailLayout backTo="/planning" title="Release Detail">
      <Panel title="Release" icon={<FiActivity />}>
        <form className="stack" onSubmit={save}>
          <TextField label="Name" value={form.name} onChange={(name) => setForm({ ...form, name })} />
          <TextField label="Version" value={form.version} onChange={(version) => setForm({ ...form, version })} />
          <TextField label="Start" value={form.startDate} onChange={(startDate) => setForm({ ...form, startDate })} />
          <TextField label="Release date" value={form.releaseDate} onChange={(releaseDate) => setForm({ ...form, releaseDate })} />
          <SelectField label="Status" value={form.status} onChange={(status) => setForm({ ...form, status })} options={['planned', 'active', 'released', 'archived']} />
          <TextField label="Description" value={form.description} onChange={(description) => setForm({ ...form, description })} />
          <div className="button-row wrap">
            <button className="primary-button" disabled={action.pending} type="submit"><FiCheck />Save</button>
            <button className="icon-button danger" disabled={action.pending} onClick={archive} title="Archive release" type="button"><FiX /></button>
            <button className="secondary-button" disabled={action.pending} onClick={load} type="button"><FiRefreshCw />Reload</button>
          </div>
        </form>
        <ErrorLine message={action.error} />
      </Panel>
      <Panel title="Scope" icon={<FiList />} wide>
        <JsonPreview title="Release" value={release} />
        <JsonPreview title="Work Items" value={scope} />
      </Panel>
    </DetailLayout>
  );
};

export const RoadmapDetailPage = ({ context }) => {
  const { roadmapId } = useParams();
  const navigate = useNavigate();
  const action = useApiAction(context.addToast);
  const [roadmap, setRoadmap] = useState(null);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: '', visibility: 'project', configText: '{}' });

  const load = async () => {
    const result = await action.run(() => Promise.all([
      context.services.planning.getRoadmap(roadmapId),
      context.services.planning.listRoadmapItems(roadmapId),
    ]));
    if (result) {
      const [roadmapRow, itemRows] = result;
      setRoadmap(roadmapRow);
      setItems(itemRows || []);
      setForm({
        name: roadmapRow.name || '',
        visibility: roadmapRow.visibility || 'project',
        configText: toJsonText(roadmapRow.config || {}),
      });
    }
  };

  useEffect(() => {
    load();
  }, [roadmapId]);

  const save = async (event) => {
    event.preventDefault();
    const saved = await action.run(() => context.services.planning.updateRoadmap(roadmapId, {
      projectId: context.projectId || roadmap?.projectId,
      name: form.name,
      visibility: form.visibility,
      config: parseJsonOrThrow(form.configText),
    }), 'Roadmap saved');
    if (saved) {
      await load();
    }
  };

  const archive = async () => {
    await action.run(() => context.services.planning.deleteRoadmap(roadmapId), 'Roadmap archived');
    navigate('/planning');
  };

  return (
    <DetailLayout backTo="/planning" title="Roadmap Detail">
      <Panel title="Roadmap" icon={<FiBarChart2 />}>
        <form className="stack" onSubmit={save}>
          <TextField label="Name" value={form.name} onChange={(name) => setForm({ ...form, name })} />
          <SelectField label="Visibility" value={form.visibility} onChange={(visibility) => setForm({ ...form, visibility })} options={['private', 'project', 'workspace', 'public']} />
          <Field label="Config JSON">
            <textarea value={form.configText} onChange={(event) => setForm({ ...form, configText: event.target.value })} rows={8} spellCheck="false" />
          </Field>
          <div className="button-row wrap">
            <button className="primary-button" disabled={action.pending} type="submit"><FiCheck />Save</button>
            <button className="icon-button danger" disabled={action.pending} onClick={archive} title="Archive roadmap" type="button"><FiX /></button>
            <button className="secondary-button" disabled={action.pending} onClick={load} type="button"><FiRefreshCw />Reload</button>
          </div>
        </form>
        <ErrorLine message={action.error} />
      </Panel>
      <Panel title="Items" icon={<FiList />} wide>
        <JsonRecordEditor
          records={items}
          title="Roadmap Items"
          onDelete={(record) => context.services.planning.deleteRoadmapItem(roadmapId, record.id)}
          onSave={(record, draft) => context.services.planning.updateRoadmapItem(roadmapId, record.id, pick(draft, ['workItemId', 'startDate', 'endDate', 'position', 'displayConfig']))}
          onSuccess={load}
          action={action}
        />
        <JsonPreview title="Roadmap" value={roadmap} />
      </Panel>
    </DetailLayout>
  );
};
