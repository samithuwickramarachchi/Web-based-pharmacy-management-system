import React from 'react';

export function Card({ children, className = '', style = {}, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
        ...style,
      }}
      className={className}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className = '', style = {}, children }) {
  if (children) {
    return (
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--color-border)',
          ...style,
        }}
        className={className}
      >
        {children}
      </div>
    );
  }
  return (
    <div
      style={{
        padding: '18px 22px',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...style,
      }}
      className={className}
    >
      <div>
        {title && <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{title}</h3>}
        {subtitle && (
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function CardBody({ children, className = '', style = {} }) {
  return (
    <div style={{ padding: '20px 22px', ...style }} className={className}>
      {children}
    </div>
  );
}

export default Card;
