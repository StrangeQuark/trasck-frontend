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

export const JsonPreview = ({ title, value }) => (
  <section className="json-preview">
    {title && <h3>{title}</h3>}
    <pre>{value ? JSON.stringify(redactedValue(value), null, 2) : 'None'}</pre>
  </section>
);
