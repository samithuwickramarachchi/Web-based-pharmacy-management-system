import React from 'react';

export function LoadingSpinner({ text = 'Loading...', size = 'md' }) {
  const pixelSizes = {
    sm: 20,
    md: 32,
    lg: 48,
  };

  const px = pixelSizes[size] || 32;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        gap: '12px',
        color: 'var(--color-text-muted)',
      }}
    >
      <div
        style={{
          width: `${px}px`,
          height: `${px}px`,
          border: '3px solid var(--color-border)',
          borderTopColor: 'var(--color-primary)',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }}
      />
      {text && <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{text}</span>}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default LoadingSpinner;
