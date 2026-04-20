import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import { recordLabel } from '../utils/forms';
import { EmptyState } from './EmptyState';

export const DetailLinkGrid = ({ basePath, items, title }) => (
  <section className="detail-link-group">
    <h3>{title}</h3>
    <div className="detail-link-grid">
      {items.length === 0 ? (
        <EmptyState label="No records loaded" />
      ) : items.map((item) => (
        <Link className="detail-link-card" key={item.id} to={basePath + '/' + item.id}>
          <span>{recordLabel(item)}</span>
          <FiArrowRight />
        </Link>
      ))}
    </div>
  </section>
);
