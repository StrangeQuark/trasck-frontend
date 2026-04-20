import { FiEye } from 'react-icons/fi';
import { EmptyState } from './EmptyState';

export const ResultList = ({ eyebrowKey, items, onOpen, titleKey }) => (
  <div className="work-list">
    {items.length === 0 ? (
      <EmptyState label="No records loaded" />
    ) : items.map((item) => (
      <button className="work-row" key={item.id} onClick={() => onOpen(item)} type="button">
        <span className="work-key">{item[eyebrowKey] || item.id}</span>
        <span className="work-title">{item[titleKey] || item.name || item.displayName || item.id}</span>
        <FiEye />
      </button>
    ))}
  </div>
);
