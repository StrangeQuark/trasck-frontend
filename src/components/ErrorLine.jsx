export const ErrorLine = ({ message }) => (
  message ? <p className="error-line">{message}</p> : null
);
