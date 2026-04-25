import { useEffect, useState } from 'react';
import { FiCheck, FiTrash2 } from 'react-icons/fi';
import { EmptyState } from './EmptyState';
import { Field } from './Field';
import { StatusOptionChecklist } from './StatusOptionChecklist';
import { TextField } from './TextField';

export const BoardColumnEditor = ({ action, columns, onDelete, onSave, onSuccess, statusOptions }) => {
  const [drafts, setDrafts] = useState({});

  useEffect(() => {
    setDrafts(Object.fromEntries((columns || []).map((column) => [column.id, {
      name: column.name || '',
      position: String(column.position ?? 0),
      wipLimit: column.wipLimit == null ? '' : String(column.wipLimit),
      doneColumn: String(Boolean(column.doneColumn)),
      statusIds: Array.isArray(column.statusIds) ? column.statusIds : [],
    }])));
  }, [columns]);

  if (!Array.isArray(columns) || columns.length === 0) {
    return <EmptyState label="No board columns configured" />;
  }

  const updateDraft = (columnId, patch) => {
    setDrafts((current) => ({
      ...current,
      [columnId]: {
        ...current[columnId],
        ...patch,
      },
    }));
  };

  return (
    <div className="board-column-editor-list">
      {columns.map((column) => {
        const draft = drafts[column.id] || {
          name: column.name || '',
          position: String(column.position ?? 0),
          wipLimit: column.wipLimit == null ? '' : String(column.wipLimit),
          doneColumn: String(Boolean(column.doneColumn)),
          statusIds: Array.isArray(column.statusIds) ? column.statusIds : [],
        };
        return (
          <form
            className="board-column-editor"
            key={column.id}
            onSubmit={async (event) => {
              event.preventDefault();
              const saved = await action.run(() => onSave(column, {
                name: draft.name,
                position: Number(draft.position || 0),
                wipLimit: draft.wipLimit === '' ? null : Number(draft.wipLimit),
                doneColumn: draft.doneColumn === 'true',
                statusIds: draft.statusIds,
              }), 'Board column saved');
              if (saved && onSuccess) {
                await onSuccess();
              }
            }}
          >
            <div className="four-column">
              <TextField label="Name" value={draft.name} onChange={(name) => updateDraft(column.id, { name })} />
              <TextField label="Position" type="number" value={draft.position} onChange={(position) => updateDraft(column.id, { position })} />
              <TextField label="WIP limit" type="number" value={draft.wipLimit} onChange={(wipLimit) => updateDraft(column.id, { wipLimit })} />
              <Field label="Done column">
                <select value={draft.doneColumn} onChange={(event) => updateDraft(column.id, { doneColumn: event.target.value })}>
                  <option value="false">false</option>
                  <option value="true">true</option>
                </select>
              </Field>
            </div>
            <Field label="Mapped workflow statuses">
              <StatusOptionChecklist
                disabled={action.pending}
                onChange={(statusIds) => updateDraft(column.id, { statusIds })}
                options={statusOptions}
                value={draft.statusIds}
              />
            </Field>
            <div className="button-row wrap">
              <button className="primary-button" disabled={action.pending} type="submit"><FiCheck />Save</button>
              <button
                className="secondary-button danger"
                disabled={action.pending}
                onClick={async () => {
                  const deleted = await action.run(async () => {
                    await onDelete(column);
                    return true;
                  }, 'Board column deleted');
                  if (deleted && onSuccess) {
                    await onSuccess();
                  }
                }}
                type="button"
              >
                <FiTrash2 />Delete
              </button>
            </div>
          </form>
        );
      })}
    </div>
  );
};
