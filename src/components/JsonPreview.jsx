const REDACTED = '[redacted]';
const SECRET_KEY_PATTERNS = [
  'authorization',
  'cookie',
  'credential',
  'encryptedsecret',
  'password',
  'privatekey',
  'secret',
  'token',
];
const SAFE_SECRET_METADATA = new Set([
  'secretconfigured',
  'tokenprefix',
  'tokentype',
]);

const redactedValue = (value) => {
  if (Array.isArray(value)) {
    return value.map(redactedValue);
  }
  if (!value || typeof value !== 'object') {
    return value;
  }
  return Object.fromEntries(Object.entries(value).map(([key, entryValue]) => {
    if (isSecretKey(key)) {
      return [key, entryValue ? REDACTED : entryValue];
    }
    return [key, redactedValue(entryValue)];
  }));
};

const isSecretKey = (key) => {
  const normalized = key.toLowerCase().replaceAll(/[^a-z0-9]/g, '');
  if (SAFE_SECRET_METADATA.has(normalized) || normalized.endsWith('configured')) {
    return false;
  }
  return SECRET_KEY_PATTERNS.some((pattern) => normalized.includes(pattern));
};

const diagnosticsEnabled = import.meta.env.VITE_TRASCK_ENABLE_DIAGNOSTICS === 'true';

const preferredColumns = ['key', 'name', 'title', 'status', 'type', 'displayName', 'email', 'createdAt', 'updatedAt'];

const humanizeKey = (key) => key
  .replaceAll(/([a-z0-9])([A-Z])/g, '$1 $2')
  .replaceAll(/[_-]+/g, ' ')
  .replace(/^\w/, (value) => value.toUpperCase());

const formatValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return 'None';
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (typeof value === 'number') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return `${value.length} item${value.length === 1 ? '' : 's'}`;
  }
  if (typeof value === 'object') {
    return 'Configured';
  }
  return String(value);
};

const scalarEntries = (record) => Object.entries(record || {})
  .filter(([, value]) => value === null || ['string', 'number', 'boolean', 'undefined'].includes(typeof value))
  .slice(0, 10);

const tableColumns = (rows) => {
  const keys = new Set(rows.flatMap((row) => Object.keys(row || {})));
  const preferred = preferredColumns.filter((column) => keys.has(column));
  return (preferred.length ? preferred : Array.from(keys).slice(0, 5));
};

const StructuredValue = ({ value }) => {
  const safeValue = redactedValue(value);
  if (!safeValue) {
    return <p className="muted">None</p>;
  }
  if (Array.isArray(safeValue)) {
    if (!safeValue.length) {
      return <p className="muted">No records</p>;
    }
    const rows = safeValue.filter((item) => item && typeof item === 'object').slice(0, 10);
    if (!rows.length) {
      return <p>{safeValue.map(formatValue).join(', ')}</p>;
    }
    const columns = tableColumns(rows);
    return (
      <>
        <p className="muted">{safeValue.length} record{safeValue.length === 1 ? '' : 's'}</p>
        <div className="table-wrap compact-table">
          <table>
            <thead>
              <tr>{columns.map((column) => <th key={column}>{humanizeKey(column)}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id || index}>
                  {columns.map((column) => <td key={column}>{formatValue(row[column])}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }
  if (typeof safeValue === 'object') {
    const entries = scalarEntries(safeValue);
    if (!entries.length) {
      return <p className="muted">Structured data is available through the page controls.</p>;
    }
    return (
      <dl className="summary-rows">
        {entries.map(([key, entryValue]) => (
          <div key={key}>
            <dt>{humanizeKey(key)}</dt>
            <dd>{formatValue(entryValue)}</dd>
          </div>
        ))}
      </dl>
    );
  }
  return <p>{formatValue(safeValue)}</p>;
};

export const JsonPreview = ({ title, value }) => (
  <section className="data-preview">
    {title && <h3>{title}</h3>}
    <StructuredValue value={value} />
    {diagnosticsEnabled && (
      <details className="diagnostic-json">
        <summary>Raw diagnostics</summary>
        <pre>{value ? JSON.stringify(redactedValue(value), null, 2) : 'None'}</pre>
      </details>
    )}
  </section>
);
