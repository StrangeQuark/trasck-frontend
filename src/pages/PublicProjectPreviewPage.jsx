import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FiEye, FiRefreshCw } from 'react-icons/fi';
import { EmptyState } from '../components/EmptyState';
import { ErrorLine } from '../components/ErrorLine';
import { JsonPreview } from '../components/JsonPreview';
import { Panel } from '../components/Panel';
import { SummaryRows } from '../components/SummaryRows';
import { useApiAction } from '../hooks/useApiAction';

export const PublicProjectPreviewPage = ({ context }) => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const action = useApiAction(context.addToast);

  const loadProject = async () => {
    if (!projectId) {
      setProject(null);
      return;
    }
    const loaded = await action.run(() => context.services.security.getPublicProject(projectId));
    setProject(loaded || null);
  };

  useEffect(() => {
    loadProject();
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
          <button className="secondary-button" disabled={action.pending || !projectId} onClick={loadProject} type="button">
            <FiRefreshCw />
            Refresh
          </button>
        </div>
      </Panel>

      <Panel title="Public Project Data" icon={<FiEye />} wide>
        <JsonPreview title="Project" value={project} />
      </Panel>
    </div>
  );
};
