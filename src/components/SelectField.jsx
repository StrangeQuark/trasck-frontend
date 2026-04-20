import { Field } from './Field';

export const SelectField = ({ label, onChange, options, value }) => (
  <Field label={label}>
    <select value={value} onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
  </Field>
);
