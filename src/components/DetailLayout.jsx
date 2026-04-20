import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';

export const DetailLayout = ({ backTo, children, title }) => (
  <div className="detail-layout">
    <div className="detail-toolbar">
      <Link className="secondary-button" to={backTo}><FiArrowRight className="back-icon" />Back</Link>
      <h2>{title}</h2>
    </div>
    <div className="content-grid">
      {children}
    </div>
  </div>
);
