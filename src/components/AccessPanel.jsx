import { Panel } from './Panel';

export const AccessPanel = ({ message = 'You do not have access to this area.', title = 'Access Restricted' }) => (
  <div className="content-grid">
    <Panel title={title}>
      <p className="muted">{message}</p>
    </Panel>
  </div>
);
