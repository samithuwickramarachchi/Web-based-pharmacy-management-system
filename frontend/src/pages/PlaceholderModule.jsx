import React from 'react';
import Card, { CardHeader, CardBody } from '../components/common/Card';
import Badge from '../components/common/Badge';
import { Layers, Construction } from 'lucide-react';

export function PlaceholderModule({
  moduleName = 'Module',
  description = 'This functional module is configured in the backend and ready for frontend view integration.',
  endpoints = [],
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Card>
        <CardHeader
          title={moduleName}
          subtitle="Enterprise Pharmacy Management Subsystem"
          action={<Badge variant="primary">Stage 8 Foundation Active</Badge>}
        />
        <CardBody style={{ padding: '36px 24px', textAlign: 'center' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}
          >
            <Layers size={32} />
          </div>
          <h2 style={{ fontSize: '1.35rem', marginBottom: '8px' }}>
            {moduleName} Console
          </h2>
          <p
            style={{
              color: 'var(--color-text-muted)',
              maxWidth: '520px',
              margin: '0 auto 24px',
              fontSize: '0.9rem',
              lineHeight: 1.6,
            }}
          >
            {description}
          </p>

          {endpoints.length > 0 && (
            <div
              style={{
                maxWidth: '600px',
                margin: '0 auto',
                textAlign: 'left',
                backgroundColor: 'var(--color-bg-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                border: '1px solid var(--color-border)',
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--color-text-muted)',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Construction size={14} />
                <span>Connected Stage 7 Backend Endpoints:</span>
              </div>
              <ul
                style={{
                  listStyle: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  fontSize: '0.8rem',
                  fontFamily: 'monospace',
                }}
              >
                {endpoints.map((ep, idx) => (
                  <li key={idx} style={{ color: 'var(--color-text-main)' }}>
                    • {ep}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

export default PlaceholderModule;
