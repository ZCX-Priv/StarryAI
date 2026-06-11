export default function EmptyState({ icon: Icon, title, description, action, compact }) {
  return (
    <div className={`empty-state${compact ? ' compact' : ''}`}>
      <div className="empty-icon">
        {Icon && <Icon size={compact ? 18 : 22} />}
      </div>
      {title && <h2>{title}</h2>}
      {description && <p>{description}</p>}
      {action && <div className="empty-action">{action}</div>}
    </div>
  );
}
