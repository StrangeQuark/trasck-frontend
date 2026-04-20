import { Field } from './Field';

export const TextField = ({ label, onChange, type = 'text', value }) => (
  <Field label={label}>
    <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
  </Field>
);
