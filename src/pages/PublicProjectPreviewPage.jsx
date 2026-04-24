import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FiDownload, FiEye, FiMessageSquare, FiPaperclip, FiRefreshCw } from 'react-icons/fi';
import { DEFAULT_API_BASE_URL } from '../api/client';
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
  const [selectedComments, setSelectedComments] = useState([]);
  const [selectedAttachments, setSelectedAttachments] = useState([]);
  const action = useApiAction(context.addToast);

  const loadPreview = async () => {
    if (!projectId) {
      setProject(null);
      setWorkItems([]);
      setSelectedWorkItem(null);
      setSelectedComments([]);
      setSelectedAttachments([]);
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
      setSelectedComments([]);
      setSelectedAttachments([]);
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
    const loaded = await action.run(() => Promise.all([
      context.services.security.getPublicProjectWorkItem(projectId, workItemId),
      context.services.security.listPublicProjectWorkItemComments(projectId, workItemId),
      context.services.security.listPublicProjectWorkItemAttachments(projectId, workItemId),
    ]));
    if (loaded) {
      const [item, comments, attachments] = loaded;
      setSelectedWorkItem(item);
      setSelectedComments(comments || []);
      setSelectedAttachments(attachments || []);
    }
  };

  const absoluteDownloadUrl = (downloadUrl) => {
    try {
      return new URL(downloadUrl, `${DEFAULT_API_BASE_URL}/`).toString();
    } catch {
      return downloadUrl;
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
            ['Project', project?.key || project?.name || 'Not loaded'],
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
          <div className="stack">
            <JsonPreview title="Selection" value={selectedWorkItem || project} />
            {selectedWorkItem ? (
              <div className="two-column">
                <section className="public-collab-list">
                  <h3><FiMessageSquare />Public Comments</h3>
                  {selectedComments.length === 0 ? (
                    <EmptyState label="No public comments loaded" />
                  ) : selectedComments.map((comment) => (
                    <article className="public-collab-row" key={comment.id}>
                      <p>{comment.bodyMarkdown}</p>
                      <span>{comment.createdAt || comment.id}</span>
                    </article>
                  ))}
                </section>
                <section className="public-collab-list">
                  <h3><FiPaperclip />Public Attachments</h3>
                  {selectedAttachments.length === 0 ? (
                    <EmptyState label="No public attachments loaded" />
                  ) : selectedAttachments.map((attachment) => (
                    <article className="public-collab-row" key={attachment.id}>
                      <p>{attachment.filename}</p>
                      <span>{attachment.contentType || 'application/octet-stream'} · {attachment.sizeBytes || 0} bytes</span>
                      <a className="secondary-button" href={absoluteDownloadUrl(attachment.downloadUrl)} rel="noreferrer" target="_blank">
                        <FiDownload />
                        Download
                      </a>
                    </article>
                  ))}
                </section>
              </div>
            ) : null}
          </div>
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
