import React from 'react';

export function Input({
  label,
  error,
  icon: Icon,
  type = 'text',
  placeholder,
  value,
  onChange,
  required = false,
  className = '',
  ...props
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }} className={className}>
      {label && (
        <label style={{ fontSize: '0.825rem', fontWeight: 600, color: '#334155' }}>
          {label} {required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
        </label>
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {Icon && (
          <div
            style={{
              position: 'absolute',
              left: '12px',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            {React.isValidElement(Icon) ? Icon : <Icon size={18} />}
          </div>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          style={{
            width: '100%',
            padding: Icon ? '10px 14px 10px 40px' : '10px 14px',
            border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border)'}`,
            borderRadius: 'var(--radius-md)',
            fontSize: '0.875rem',
            backgroundColor: '#ffffff',
            color: 'var(--color-text-main)',
            outline: 'none',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
          {...props}
        />
      </div>
      {error && (
        <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)', fontWeight: 500 }}>
          {error}
        </span>
      )}
    </div>
  );
}

export default Input;
