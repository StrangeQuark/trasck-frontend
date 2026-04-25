import { EmptyState } from './EmptyState';

export const BoardCardColumns = ({ boardWorkItems, onMove }) => {
  const columns = boardWorkItems?.columns || [];
  if (columns.length === 0) {
    return <EmptyState label="No board cards loaded" />;
  }
  const dragStart = (event, itemId) => {
    event.dataTransfer.setData('text/plain', itemId);
    event.dataTransfer.effectAllowed = 'move';
  };
  const columnDrop = (event, column) => {
    event.preventDefault();
    const workItemId = event.dataTransfer.getData('text/plain');
    if (!workItemId || !onMove) {
      return;
    }
    const columnItems = (column.workItems || []).filter((item) => item.id !== workItemId);
    const previousWorkItem = columnItems.at(-1);
    onMove(workItemId, {
      targetColumnId: column.columnId,
      previousWorkItemId: previousWorkItem?.id,
    });
  };
  const cardDrop = (event, column, targetItem) => {
    event.preventDefault();
    event.stopPropagation();
    const workItemId = event.dataTransfer.getData('text/plain');
    if (!workItemId || !onMove || workItemId === targetItem.id) {
      return;
    }
    const columnItems = (column.workItems || []).filter((item) => item.id !== workItemId);
    const targetIndex = columnItems.findIndex((item) => item.id === targetItem.id);
    if (targetIndex < 0) {
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const insertAfterTarget = event.clientY > rect.top + rect.height / 2;
    const insertIndex = insertAfterTarget ? targetIndex + 1 : targetIndex;
    const previousWorkItem = columnItems[insertIndex - 1];
    const nextWorkItem = columnItems[insertIndex];
    onMove(workItemId, {
      targetColumnId: column.columnId,
      previousWorkItemId: previousWorkItem?.id,
      nextWorkItemId: nextWorkItem?.id,
    });
  };
  return (
    <div className="board-card-columns">
      {columns.map((column) => (
        <section
          className="board-card-column"
          key={column.columnId}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => columnDrop(event, column)}
        >
          <header className="board-column-header">
            <h3>{column.columnName}</h3>
            <span>{(column.workItems || []).length}</span>
          </header>
          {(column.workItems || []).length === 0 ? (
            <EmptyState label="No work items" />
          ) : (column.workItems || []).map((item) => (
            <article
              className="board-card"
              draggable={Boolean(onMove)}
              key={item.id}
              onDragOver={(event) => event.preventDefault()}
              onDragStart={(event) => dragStart(event, item.id)}
              onDrop={(event) => cardDrop(event, column, item)}
            >
              <span className="board-card-key">{item.key}</span>
              <strong>{item.title}</strong>
              <small>{[item.typeKey, item.statusKey, item.estimatePoints ? `${item.estimatePoints} pts` : null].filter(Boolean).join(' | ')}</small>
            </article>
          ))}
        </section>
      ))}
    </div>
  );
};
