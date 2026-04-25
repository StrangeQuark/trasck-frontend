import { FiEye } from 'react-icons/fi';
import { EmptyState } from './EmptyState';
import { StatusPill } from './StatusPill';

export const ResultList = ({ eyebrowKey, items, onOpen, selectedId, titleKey }) => (
  <div className="work-list">
    {items.length === 0 ? (
      <EmptyState label="No records loaded" />
    ) : items.map((item) => (
      <button className={'work-row' + (selectedId === item.id ? ' selected' : '')} key={item.id} onClick={() => onOpen(item)} type="button">
        <span className="work-key">{item[eyebrowKey] || item.id}</span>
        <span className="work-title-group">
          <span className="work-title">{item[titleKey] || item.name || item.displayName || item.id}</span>
          <span className="work-row-meta">
            {item.typeKey || item.type || 'work'}
            {item.estimatePoints ? ` | ${item.estimatePoints} pts` : ''}
          </span>
        </span>
        <StatusPill label={item.statusKey || item.status || 'open'} tone={statusTone(item.statusKey || item.status)} />
        <FiEye className="work-row-icon" />
      </button>
    ))}
  </div>
);

const statusTone = (status = '') => {
  const normalized = String(status).toLowerCase();
  if (normalized.includes('done') || normalized.includes('closed') || normalized.includes('accepted')) {
    return 'success';
  }
  if (normalized.includes('progress') || normalized.includes('active') || normalized.includes('running')) {
    return 'info';
  }
  if (normalized.includes('blocked') || normalized.includes('failed')) {
    return 'danger';
  }
  return '';
};
