import { useState } from 'react';
import { FiCopy, FiEye, FiEyeOff, FiTrash2 } from 'react-icons/fi';

export const SecretReveal = ({ label = 'Secret', onClear, prefix, value }) => {
  const [revealed, setRevealed] = useState(false);
  if (!value) {
    return null;
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard access can be blocked outside secure browser contexts.
    }
  };

  return (
    <section className="secret-reveal">
      <div>
        <h3>{label}</h3>
        {prefix && <p>{prefix}</p>}
      </div>
      <code className="secret-value">{revealed ? value : masked(value)}</code>
      <div className="button-row wrap">
        <button className="secondary-button" onClick={() => setRevealed(!revealed)} type="button">
          {revealed ? <FiEyeOff /> : <FiEye />}
          {revealed ? 'Hide' : 'Reveal'}
        </button>
        <button className="secondary-button" onClick={copy} type="button"><FiCopy />Copy</button>
        {onClear && (
          <button className="icon-button danger" onClick={onClear} title="Clear token from screen" type="button"><FiTrash2 /></button>
        )}
      </div>
    </section>
  );
};

const masked = (value) => '*'.repeat(Math.min(Math.max(value.length, 12), 32));
