import React from 'react';

export function Button({
  children,
  variant = 'primary', // primary, secondary, outline, danger, ghost
  size = 'md', // sm, md, lg
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontWeight: 600,
    borderRadius: 'var(--radius-md)',
    border: '1px solid transparent',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.65 : 1,
    transition: 'all 0.15s ease',
    textDecoration: 'none',
  };

  const sizeStyles = {
    sm: { padding: '6px 12px', fontSize: '0.775rem' },
    md: { padding: '9px 16px', fontSize: '0.875rem' },
    lg: { padding: '12px 22px', fontSize: '1rem' },
  };

  const variantStyles = {
    primary: {
      backgroundColor: 'var(--color-primary)',
      color: '#ffffff',
      boxShadow: '0 2px 6px rgba(13, 148, 136, 0.25)',
    },
    secondary: {
      backgroundColor: 'var(--color-bg-subtle)',
      color: 'var(--color-text-main)',
      borderColor: 'var(--color-border)',
    },
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--color-primary)',
      borderColor: 'var(--color-primary)',
    },
    danger: {
      backgroundColor: 'var(--color-danger)',
      color: '#ffffff',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--color-text-muted)',
    },
  };

  const mergedStyle = {
    ...baseStyle,
    ...sizeStyles[size],
    ...variantStyles[variant],
  };

  const renderIcon = () => {
    if (!Icon) return null;
    if (React.isValidElement(Icon)) {
      return Icon;
    }
    const IconComponent = Icon;
    return <IconComponent size={16} />;
  };

  return (
    <button
      type={type}
      style={mergedStyle}
      disabled={disabled || loading}
      onClick={onClick}
      className={className}
      {...props}
    >
      {loading && (
        <span
          style={{
            width: '16px',
            height: '16px',
            border: '2px solid currentColor',
            borderRightColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite',
          }}
        />
      )}
      {!loading && iconPosition === 'left' && renderIcon()}
      {children && <span>{children}</span>}
      {!loading && iconPosition === 'right' && renderIcon()}
    </button>
  );
}

export default Button;
