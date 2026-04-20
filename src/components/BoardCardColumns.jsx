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
  const drop = (event, column) => {
    event.preventDefault();
    const workItemId = event.dataTransfer.getData('text/plain');
    if (!workItemId || !onMove) {
      return;
    }
    const nextWorkItem = (column.workItems || []).find((item) => item.id !== workItemId);
    onMove(workItemId, {
      targetColumnId: column.columnId,
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
          onDrop={(event) => drop(event, column)}
        >
          <h3>{column.columnName}</h3>
          {(column.workItems || []).length === 0 ? (
            <EmptyState label="No work items" />
          ) : (column.workItems || []).map((item) => (
            <article className="board-card" draggable={Boolean(onMove)} key={item.id} onDragStart={(event) => dragStart(event, item.id)}>
              <span>{item.key}</span>
              <strong>{item.title}</strong>
              <small>{item.statusKey || item.typeKey}</small>
            </article>
          ))}
        </section>
      ))}
    </div>
  );
};
