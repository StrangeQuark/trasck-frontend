import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FiEye, FiRefreshCw } from 'react-icons/fi';
import { EmptyState } from '../components/EmptyState';
import { ErrorLine } from '../components/ErrorLine';
import { JsonPreview } from '../components/JsonPreview';
import { Panel } from '../components/Panel';
import { ResultList } from '../components/ResultList';
import { SummaryRows } from '../components/SummaryRows';
import { useApiAction } from '../hooks/useApiAction';

export const PublicProjectPreviewPage = ({ context }) => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [workItems, setWorkItems] = useState([]);
  const [nextCursor, setNextCursor] = useState('');
  const [selectedWorkItem, setSelectedWorkItem] = useState(null);
  const action = useApiAction(context.addToast);

  const loadPreview = async () => {
    if (!projectId) {
      setProject(null);
      setWorkItems([]);
      setSelectedWorkItem(null);
      return;
    }
    const loaded = await action.run(() => Promise.all([
      context.services.security.getPublicProject(projectId),
      context.services.security.listPublicProjectWorkItems(projectId, { limit: 25 }),
    ]));
    if (loaded) {
      const [loadedProject, page] = loaded;
      setProject(loadedProject || null);
      setWorkItems(page?.items || []);
      setNextCursor(page?.nextCursor || '');
      setSelectedWorkItem(null);
    }
  };

  const loadMoreWorkItems = async () => {
    if (!projectId || !nextCursor) {
      return;
    }
    const page = await action.run(() => context.services.security.listPublicProjectWorkItems(projectId, {
      limit: 25,
      cursor: nextCursor,
    }));
    if (page) {
      setWorkItems((items) => [...items, ...(page.items || [])]);
      setNextCursor(page.nextCursor || '');
    }
  };

  const openWorkItem = async (workItemId) => {
    const item = await action.run(() => context.services.security.getPublicProjectWorkItem(projectId, workItemId));
    if (item) {
      setSelectedWorkItem(item);
    }
  };

  useEffect(() => {
    loadPreview();
  }, [projectId]);

  return (
    <div className="content-grid">
      <Panel title="Public Project Preview" icon={<FiEye />}>
        <div className="stack">
          <SummaryRows rows={[
            ['Project', projectId],
            ['Name', project?.name],
            ['Key', project?.key],
            ['Visibility', project?.visibility],
          ]} />
          <ErrorLine message={action.error} />
          {!project && !action.pending ? <EmptyState label="Public project is not available" /> : null}
          <button className="secondary-button" disabled={action.pending || !projectId} onClick={loadPreview} type="button">
            <FiRefreshCw />
            Refresh
          </button>
        </div>
      </Panel>

      <Panel title="Public Project Data" icon={<FiEye />} wide>
        <div className="work-columns">
          <ResultList items={workItems} titleKey="title" eyebrowKey="key" onOpen={(item) => openWorkItem(item.id)} />
          <JsonPreview title="Selected Work Item" value={selectedWorkItem || project} />
        </div>
        <div className="button-row wrap">
          <button className="secondary-button" disabled={action.pending || !nextCursor} onClick={loadMoreWorkItems} type="button">
            <FiRefreshCw />
            More work items
          </button>
        </div>
      </Panel>
    </div>
  );
};
