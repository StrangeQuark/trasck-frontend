import { EmptyState } from './EmptyState';

export const BoardCardColumns = ({ boardWorkItems }) => {
  const columns = boardWorkItems?.columns || [];
  if (columns.length === 0) {
    return <EmptyState label="No board cards loaded" />;
  }
  return (
    <div className="board-card-columns">
      {columns.map((column) => (
        <section className="board-card-column" key={column.columnId}>
          <h3>{column.columnName}</h3>
          {(column.workItems || []).length === 0 ? (
            <EmptyState label="No work items" />
          ) : (column.workItems || []).map((item) => (
            <article className="board-card" key={item.id}>
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
