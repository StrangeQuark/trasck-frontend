export const Panel = ({ title, icon, children, wide = false }) => (
  <section className={'panel' + (wide ? ' panel-wide' : '')}>
    <header className="panel-header">
      <span className="panel-icon">{icon}</span>
      <h2>{title}</h2>
    </header>
    {children}
  </section>
);
