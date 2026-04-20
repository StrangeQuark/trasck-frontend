import { EmptyState } from '../../components/EmptyState';
import { JsonPreview } from '../../components/JsonPreview';
import { SummaryRows } from '../../components/SummaryRows';

const resolutionAction = {
  create_new: 'Clears the target and leaves the record pending for the next materialization.',
  update_existing: 'Leaves the existing target attached and stages the record for a materialization or rerun with update existing enabled.',
  skip: 'Marks the record skipped and keeps it out of future materialization runs.',
};

export const ImportConflictDetails = ({ conflict, resolution }) => {
  if (!conflict) {
    return <EmptyState label="No open conflict selected" />;
  }
  return (
    <div className="stack">
      <SummaryRows rows={[
        ['Source', [conflict.sourceType, conflict.sourceId].filter(Boolean).join(' / ')],
        ['Status', conflict.status],
        ['Reason', conflict.conflictReason],
        ['Target', [conflict.targetType, conflict.targetId].filter(Boolean).join(' / ')],
        ['Resolution', resolution],
        ['Next action', resolutionAction[resolution]],
      ]} />
      <JsonPreview title="Source Payload" value={conflict.rawPayload} />
    </div>
  );
};
