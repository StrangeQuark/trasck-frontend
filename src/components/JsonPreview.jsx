export const JsonPreview = ({ title, value }) => (
  <section className="json-preview">
    {title && <h3>{title}</h3>}
    <pre>{value ? JSON.stringify(value, null, 2) : 'None'}</pre>
  </section>
);
