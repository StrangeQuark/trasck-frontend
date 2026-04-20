import { useEffect, useState } from 'react';
import { FiCheck, FiX } from 'react-icons/fi';
import { parseJsonOrThrow, toJsonText } from '../utils/forms';
import { RecordSelect } from './RecordSelect';

export const JsonRecordEditor = ({ action, onDelete, onSave, onSuccess, records, title }) => {
  const [selectedId, setSelectedId] = useState('');
  const [draft, setDraft] = useState('{}');
  const selected = records.find((record) => record.id === selectedId) || records[0] || null;

  useEffect(() => {
    if (!selectedId && selected?.id) {
      setSelectedId(selected.id);
    }
  }, [records, selectedId, selected]);

  useEffect(() => {
    setDraft(toJsonText(selected || {}));
  }, [selected?.id]);

  const save = async () => {
    if (!selected) {
      return;
    }
    const result = await action.run(() => onSave(selected, parseJsonOrThrow(draft)), title + ' saved');
    if (result !== undefined && onSuccess) {
      await onSuccess();
    }
  };

  const remove = async () => {
    if (!selected) {
      return;
    }
    const result = await action.run(async () => {
      await onDelete(selected);
      return true;
    }, title + ' deleted');
    if (result !== undefined && onSuccess) {
      setSelectedId('');
      await onSuccess();
    }
  };

  return (
    <section className="json-record-editor">
      <h3>{title}</h3>
      <RecordSelect includeBlank label="Record" records={records} value={selected?.id || ''} onChange={setSelectedId} />
      <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={10} spellCheck="false" />
      <div className="button-row wrap">
        <button className="secondary-button" disabled={action.pending || !selected} onClick={save} type="button"><FiCheck />Save</button>
        <button className="icon-button danger" disabled={action.pending || !selected} onClick={remove} title={'Delete ' + title} type="button"><FiX /></button>
      </div>
    </section>
  );
};
