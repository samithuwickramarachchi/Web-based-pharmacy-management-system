import React from 'react';

export function Badge({ children, variant = 'neutral', size = 'sm' }) {
  const variantStyles = {
    success: {
      backgroundColor: 'var(--color-success-bg)',
      color: 'var(--color-success-text)',
      border: '1px solid var(--color-success-border)',
    },
    warning: {
      backgroundColor: 'var(--color-warning-bg)',
      color: 'var(--color-warning-text)',
      border: '1px solid var(--color-warning-border)',
    },
    danger: {
      backgroundColor: 'var(--color-danger-bg)',
      color: 'var(--color-danger-text)',
      border: '1px solid var(--color-danger-border)',
    },
    info: {
      backgroundColor: 'var(--color-info-bg)',
      color: 'var(--color-info-text)',
      border: '1px solid var(--color-info-border)',
    },
    primary: {
      backgroundColor: 'var(--color-primary-light)',
      color: 'var(--color-primary)',
      border: '1px solid var(--color-primary-border)',
    },
    neutral: {
      backgroundColor: 'var(--color-bg-subtle)',
      color: 'var(--color-text-muted)',
      border: '1px solid var(--color-border)',
    },
  };

  const sizeStyles = {
    sm: { padding: '2px 8px', fontSize: '0.725rem' },
    md: { padding: '4px 10px', fontSize: '0.8rem' },
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontWeight: 600,
        borderRadius: 'var(--radius-full)',
        whiteSpace: 'nowrap',
        ...variantStyles[variant],
        ...sizeStyles[size],
      }}
    >
      {children}
    </span>
  );
}

export default Badge;
