import React from 'react';
import { Link } from 'react-router-dom';
import Card, { CardBody } from '../components/common/Card';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export function NotFound() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <Card style={{ maxWidth: '440px', width: '100%', textAlign: 'center' }}>
        <CardBody style={{ padding: '40px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-bg-subtle)',
              color: 'var(--color-text-muted)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}
          >
            <FileQuestion size={32} />
          </div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '8px' }}>404 - Page Not Found</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
            The pharmacy management page or resource you requested could not be located.
          </p>
          <Link
            to="/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--color-primary)',
              color: '#ffffff',
              padding: '10px 20px',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </Link>
        </CardBody>
      </Card>
    </div>
  );
}

export default NotFound;
