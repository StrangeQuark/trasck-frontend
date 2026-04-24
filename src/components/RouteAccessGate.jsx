import { AccessPanel } from './AccessPanel';

export const RouteAccessGate = ({ allowed, children, message, title }) => {
  if (!allowed) {
    return <AccessPanel message={message} title={title} />;
  }
  return children;
};
