export const ToastStack = ({ items, onDismiss }) => (
  <div className="toast-stack" aria-live="polite">
    {items.map((item) => (
      <button className={'toast ' + item.tone} key={item.id} onClick={() => onDismiss(item.id)} type="button">
        {item.message}
      </button>
    ))}
  </div>
);
