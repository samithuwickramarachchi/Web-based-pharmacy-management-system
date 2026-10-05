import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { hasAnyRole } from '../../utils/roleUtils';
import LoadingSpinner from '../common/LoadingSpinner';
import Card, { CardBody } from '../common/Card';
import { ShieldAlert } from 'lucide-react';

export function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner text="Checking authentication..." size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !hasAnyRole(user, allowedRoles)) {
    return (
      <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
        <Card>
          <CardBody style={{ textAlign: 'center', padding: '40px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-danger-bg)',
                color: 'var(--color-danger)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <ShieldAlert size={32} />
            </div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Access Restricted</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
              Your current role (<strong>{user?.role}</strong>) does not have permission to access this module.
              Please contact your pharmacy administrator.
            </p>
            <a
              href={hasAnyRole(user, ['CUSTOMER']) ? '/' : '/dashboard'}
              style={{
                display: 'inline-block',
                backgroundColor: 'var(--color-primary)',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.875rem',
                padding: '9px 18px',
                borderRadius: 'var(--radius-md)',
              }}
            >
              {hasAnyRole(user, ['CUSTOMER']) ? 'Return to Pharmacy Store' : 'Return to Dashboard'}
            </a>
          </CardBody>
        </Card>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;
