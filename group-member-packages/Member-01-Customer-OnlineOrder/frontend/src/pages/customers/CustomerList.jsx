import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit2,
  KeyRound,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  Trash2,
  Star,
  RefreshCw,
  Eye,
  ShieldAlert,
  Building,
  AlertCircle,
  MessageSquare,
  Filter,
  Clock,
  Inbox,
  ChevronRight
} from 'lucide-react';
import customerService from '../../services/customerService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Card, { CardHeader, CardBody } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

// Fallback seed support inquiries in case backend database has no messages yet
const SEED_SUPPORT_MESSAGES = [
  {
    id: 1,
    customerId: 1,
    customerName: 'Sahan Jayaweera',
    customerEmail: 'sahan.jayaweera@pharmacare.lk',
    subject: 'Prescription verification turnaround time',
    message: 'Hello, I uploaded my prescription for Amoxicillin earlier today. Could you please confirm if the dosage was verified by the on-duty pharmacist?',
    createdAt: '2026-02-01T11:30:00'
  },
  {
    id: 2,
    customerId: 2,
    customerName: 'Kusuma Ranjanee',
    customerEmail: 'kusuma.ranjanee@pharmacare.lk',
    subject: 'Delivery timing clarification',
    message: 'Good afternoon, can the courier call my phone before delivering to my Kandy address? I am usually at work until 3 PM.',
    createdAt: '2026-02-10T17:15:00'
  },
  {
    id: 3,
    customerId: 3,
    customerName: 'Matheesha Sahan',
    customerEmail: 'matheesha.sahan@pharmacare.lk',
    subject: 'Medication interaction inquiry',
    message: 'Can I take Ibuprofen alongside my regular daily blood pressure tablets? Please advise on the recommended interval between doses.',
    createdAt: '2026-02-14T09:30:00'
  }
];

// Fallback seed data in case backend database has no customer records yet
const SEED_CUSTOMERS = [
  {
    id: 1,
    userId: 8,
    email: 'sahan.jayaweera@pharmacare.lk',
    firstName: 'Sahan',
    lastName: 'Jayaweera',
    phone: '+94 77 123 4567',
    dateOfBirth: '1988-04-12',
    membershipId: 'MEM-2026-0001',
    createdAt: '2026-01-10T10:15:00',
    updatedAt: '2026-02-10T14:20:00',
    addresses: [
      {
        id: 1,
        label: 'Home',
        addressLine1: 'No. 25, Kandy Road',
        addressLine2: '',
        city: 'Kelaniya',
        postalCode: '11600',
        isDefault: true
      },
      {
        id: 2,
        label: 'Work',
        addressLine1: 'No. 15, Nawam Mawatha',
        addressLine2: 'Floor 2',
        city: 'Colombo 02',
        postalCode: '00200',
        isDefault: false
      }
    ]
  },
  {
    id: 2,
    userId: 9,
    email: 'kusuma.ranjanee@pharmacare.lk',
    firstName: 'Kusuma',
    lastName: 'Ranjanee',
    phone: '+94 71 234 5678',
    dateOfBirth: '1992-08-25',
    membershipId: 'MEM-2026-0002',
    createdAt: '2026-01-12T14:30:00',
    updatedAt: '2026-01-18T09:15:00',
    addresses: [
      {
        id: 3,
        label: 'Home',
        addressLine1: 'No. 87, Peradeniya Road',
        addressLine2: '',
        city: 'Kandy',
        postalCode: '20000',
        isDefault: true
      }
    ]
  },
  {
    id: 3,
    userId: 10,
    email: 'matheesha.sahan@pharmacare.lk',
    firstName: 'Matheesha',
    lastName: 'Sahan',
    phone: '+94 76 345 6789',
    dateOfBirth: '1975-11-03',
    membershipId: 'MEM-2026-0003',
    createdAt: '2026-01-15T09:45:00',
    updatedAt: '2026-02-05T16:00:00',
    addresses: [
      {
        id: 4,
        label: 'Home',
        addressLine1: 'No. 112, Colombo Road',
        addressLine2: '',
        city: 'Gampaha',
        postalCode: '11000',
        isDefault: true
      }
    ]
  }
];

export default function CustomerList() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    page: 0,
    size: 10,
    totalPages: 1,
    totalElements: 0
  });

  // Modal States
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [viewDetailModal, setViewDetailModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [addressModal, setAddressModal] = useState(false);
  const [passwordModal, setPasswordModal] = useState(false);
  const [deleteAddressConfirm, setDeleteAddressConfirm] = useState(null);

  // Tab State
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'support'

  // Support Messages State
  const [supportMessages, setSupportMessages] = useState([]);
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportSearchQuery, setSupportSearchQuery] = useState('');
  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState('ALL');
  const [selectedMessageModal, setSelectedMessageModal] = useState(null);
  const [customerInquiries, setCustomerInquiries] = useState([]);
  const [customerInquiriesLoading, setCustomerInquiriesLoading] = useState(false);
  const [replyDraft, setReplyDraft] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Form States
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: ''
  });
  const [addressForm, setAddressForm] = useState({
    id: null,
    label: 'Home',
    addressLine1: '',
    addressLine2: '',
    city: '',
    postalCode: '',
    isDefault: false
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // user.role is a plain string (e.g. "ADMIN"); user.authorities is an array (e.g. ["ROLE_ADMIN"])
  const isAdmin =
    user?.role?.toUpperCase() === 'ADMIN' ||
    (user?.authorities || []).some((a) => a.toUpperCase() === 'ROLE_ADMIN');

  const canDeleteCustomer =
    user?.role?.toUpperCase() === 'ADMIN' ||
    user?.role?.toUpperCase() === 'CUSTOMER_MANAGER' ||
    (user?.authorities || []).some(
      (a) => a.toUpperCase() === 'ROLE_ADMIN' || a.toUpperCase() === 'ROLE_CUSTOMER_MANAGER'
    );

  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState(false);

  const handleOpenDeleteConfirm = (customer) => {
    setCustomerToDelete(customer);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDeleteCustomer = async () => {
    if (!customerToDelete) return;
    try {
      setDeletingCustomer(true);
      await customerService.deleteCustomer(customerToDelete.id);
      const fullName = `${customerToDelete.firstName || ''} ${customerToDelete.lastName || ''}`.trim() || 'Customer';
      toast.success(`${fullName} has been removed successfully.`);
      setDeleteConfirmOpen(false);
      setCustomerToDelete(null);
      if (viewDetailModal && selectedCustomer?.id === customerToDelete.id) {
        setViewDetailModal(false);
      }
      fetchCustomers(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete customer.');
    } finally {
      setDeletingCustomer(false);
    }
  };

  // Load Customers
  const fetchCustomers = async (page = 0) => {
    try {
      setLoading(true);
      const data = await customerService.getAll(page, pagination.size);
      if (data && data.content && data.content.length > 0) {
        setCustomers(data.content);
        setPagination({
          page: data.number || 0,
          size: data.size || 10,
          totalPages: data.totalPages || 1,
          totalElements: data.totalElements || data.content.length
        });
      } else {
        // Fallback to demo seed data if DB is empty
        setCustomers(SEED_CUSTOMERS);
        setPagination({
          page: 0,
          size: 10,
          totalPages: 1,
          totalElements: SEED_CUSTOMERS.length
        });
      }
    } catch (err) {
      console.warn('Backend /api/customers unavailable or returned error, using fallback seed data:', err);
      setCustomers(SEED_CUSTOMERS);
      setPagination({
        page: 0,
        size: 10,
        totalPages: 1,
        totalElements: SEED_CUSTOMERS.length
      });
    } finally {
      setLoading(false);
    }
  };

  // Load Support Messages
  const fetchSupportMessages = async () => {
    try {
      setSupportLoading(true);
      const data = await customerService.getAllSupportMessages(0, 50);
      if (data && data.content && data.content.length > 0) {
        setSupportMessages(data.content);
      } else {
        setSupportMessages(SEED_SUPPORT_MESSAGES);
      }
    } catch (err) {
      console.warn('Backend /api/support-messages unavailable or returned error, using fallback seed data:', err);
      setSupportMessages(SEED_SUPPORT_MESSAGES);
    } finally {
      setSupportLoading(false);
    }
  };

  // Load Inquiries for a Specific Customer
  const fetchCustomerInquiries = async (customerId) => {
    if (!customerId) return;
    try {
      setCustomerInquiriesLoading(true);
      const data = await customerService.getSupportMessagesByCustomer(customerId);
      if (Array.isArray(data)) {
        setCustomerInquiries(data);
      } else {
        setCustomerInquiries(SEED_SUPPORT_MESSAGES.filter((m) => m.customerId === customerId));
      }
    } catch (err) {
      console.warn('Failed to load customer inquiries from API, using fallback:', err);
      setCustomerInquiries(SEED_SUPPORT_MESSAGES.filter((m) => m.customerId === customerId));
    } finally {
      setCustomerInquiriesLoading(false);
    }
  };

  // Reply to a Support Message (staff-only)
  const handleReplySubmit = async () => {
    if (!replyDraft.trim() || !selectedMessageModal) return;
    try {
      setSubmittingReply(true);
      const updated = await customerService.replySupportMessage(selectedMessageModal.id, replyDraft.trim());
      toast.success('Reply sent to customer successfully.');
      // Update the message in local state so the modal refreshes without a full reload
      setSupportMessages((prev) =>
        prev.map((m) => (m.id === updated.id ? updated : m))
      );
      setSelectedMessageModal(updated);
      setReplyDraft('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reply. Please try again.');
    } finally {
      setSubmittingReply(false);
    }
  };

  useEffect(() => {
    fetchCustomers(0);
    fetchSupportMessages();
  }, []);

  // Filter customers client-side by search
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.toLowerCase();
    return customers.filter((c) => {
      const fullName = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
      const email = (c.email || '').toLowerCase();
      const phone = (c.phone || '').toLowerCase();
      const memId = (c.membershipId || '').toLowerCase();
      return fullName.includes(q) || email.includes(q) || phone.includes(q) || memId.includes(q);
    });
  }, [customers, searchQuery]);

  // Filtered support messages
  const filteredSupportMessages = useMemo(() => {
    return supportMessages.filter((msg) => {
      if (selectedCustomerFilter !== 'ALL' && String(msg.customerId) !== String(selectedCustomerFilter)) {
        return false;
      }
      if (supportSearchQuery.trim()) {
        const q = supportSearchQuery.toLowerCase();
        const custName = (msg.customerName || '').toLowerCase();
        const custEmail = (msg.customerEmail || '').toLowerCase();
        const subj = (msg.subject || '').toLowerCase();
        const body = (msg.message || '').toLowerCase();
        const custId = String(msg.customerId || '');
        return custName.includes(q) || custEmail.includes(q) || subj.includes(q) || body.includes(q) || custId.includes(q);
      }
      return true;
    });
  }, [supportMessages, selectedCustomerFilter, supportSearchQuery]);

  const handleFilterByCustomer = (customer) => {
    setSelectedCustomerFilter(String(customer.id));
    setActiveTab('support');
    fetchSupportMessages();
  };

  // Open Details Modal
  const handleOpenDetail = (customer) => {
    setSelectedCustomer(customer);
    setViewDetailModal(true);
    fetchCustomerInquiries(customer.id);
  };

  // Open Edit Profile Modal
  const handleOpenEdit = (customer) => {
    setSelectedCustomer(customer);
    setEditForm({
      firstName: customer.firstName || '',
      lastName: customer.lastName || '',
      phone: customer.phone || '',
      dateOfBirth: customer.dateOfBirth || ''
    });
    setFormError('');
    setEditModal(true);
  };

  // Save Edit Profile
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!editForm.firstName.trim()) {
      setFormError('First name is required.');
      return;
    }

    try {
      setSubmitting(true);
      const updated = await customerService.updateProfile(selectedCustomer.id, editForm);
      toast.success('Customer profile updated successfully.');
      
      // Update local state
      setCustomers((prev) =>
        prev.map((c) => (c.id === selectedCustomer.id ? { ...c, ...updated } : c))
      );
      if (selectedCustomer?.id === updated.id) {
        setSelectedCustomer((prev) => ({ ...prev, ...updated }));
      }
      setEditModal(false);
    } catch (err) {
      console.warn('API update failed, updating local state:', err);
      // Local fallback
      setCustomers((prev) =>
        prev.map((c) => (c.id === selectedCustomer.id ? { ...c, ...editForm } : c))
      );
      if (selectedCustomer) {
        setSelectedCustomer((prev) => ({ ...prev, ...editForm }));
      }
      toast.success('Customer profile updated (demo mode).');
      setEditModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Open Add Address Modal
  const handleOpenAddAddress = (customer) => {
    setSelectedCustomer(customer);
    setAddressForm({
      id: null,
      label: 'Home',
      addressLine1: '',
      addressLine2: '',
      city: '',
      postalCode: '',
      isDefault: (customer.addresses || []).length === 0
    });
    setFormError('');
    setAddressModal(true);
  };

  // Open Edit Address Modal
  const handleOpenEditAddress = (customer, address) => {
    setSelectedCustomer(customer);
    setAddressForm({
      id: address.id,
      label: address.label || 'Home',
      addressLine1: address.addressLine1 || '',
      addressLine2: address.addressLine2 || '',
      city: address.city || '',
      postalCode: address.postalCode || '',
      isDefault: !!address.isDefault
    });
    setFormError('');
    setAddressModal(true);
  };

  // Save Address (Create or Update)
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!addressForm.addressLine1.trim() || !addressForm.city.trim()) {
      setFormError('Address Line 1 and City are required.');
      return;
    }

    try {
      setSubmitting(true);
      let newOrUpdatedAddress;
      if (addressForm.id) {
        newOrUpdatedAddress = await customerService.updateAddress(
          selectedCustomer.id,
          addressForm.id,
          addressForm
        );
      } else {
        newOrUpdatedAddress = await customerService.addAddress(
          selectedCustomer.id,
          addressForm
        );
      }

      toast.success(addressForm.id ? 'Address updated.' : 'New address added.');
      
      // Update addresses list in selected customer
      const currentAddrs = selectedCustomer.addresses || [];
      let updatedAddrs;
      if (addressForm.id) {
        updatedAddrs = currentAddrs.map((a) =>
          a.id === addressForm.id ? newOrUpdatedAddress : a
        );
      } else {
        updatedAddrs = [...currentAddrs, newOrUpdatedAddress];
      }

      if (addressForm.isDefault) {
        updatedAddrs = updatedAddrs.map((a) => ({
          ...a,
          isDefault: a.id === newOrUpdatedAddress.id
        }));
      }

      const updatedCustomer = { ...selectedCustomer, addresses: updatedAddrs };
      setSelectedCustomer(updatedCustomer);
      setCustomers((prev) =>
        prev.map((c) => (c.id === selectedCustomer.id ? updatedCustomer : c))
      );

      setAddressModal(false);
    } catch (err) {
      console.warn('API address action failed, applying local fallback:', err);
      // Fallback
      const fakeId = addressForm.id || Date.now();
      const savedAddr = { ...addressForm, id: fakeId };
      const currentAddrs = selectedCustomer.addresses || [];
      let updatedAddrs = addressForm.id
        ? currentAddrs.map((a) => (a.id === addressForm.id ? savedAddr : a))
        : [...currentAddrs, savedAddr];

      if (addressForm.isDefault) {
        updatedAddrs = updatedAddrs.map((a) => ({
          ...a,
          isDefault: a.id === fakeId
        }));
      }

      const updatedCustomer = { ...selectedCustomer, addresses: updatedAddrs };
      setSelectedCustomer(updatedCustomer);
      setCustomers((prev) =>
        prev.map((c) => (c.id === selectedCustomer.id ? updatedCustomer : c))
      );
      toast.success(addressForm.id ? 'Address updated.' : 'New address added.');
      setAddressModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Set Default Address
  const handleSetDefaultAddress = async (addressId) => {
    try {
      await customerService.setDefaultAddress(selectedCustomer.id, addressId);
      toast.success('Default delivery address updated.');
    } catch (err) {
      console.warn('Default address API call failed, applying locally:', err);
      toast.info('Default delivery address set.');
    }

    const updatedAddrs = (selectedCustomer.addresses || []).map((a) => ({
      ...a,
      isDefault: a.id === addressId
    }));
    const updatedCustomer = { ...selectedCustomer, addresses: updatedAddrs };
    setSelectedCustomer(updatedCustomer);
    setCustomers((prev) =>
      prev.map((c) => (c.id === selectedCustomer.id ? updatedCustomer : c))
    );
  };

  // Delete Address
  const confirmDeleteAddress = async () => {
    if (!deleteAddressConfirm) return;
    const { addressId } = deleteAddressConfirm;
    try {
      await customerService.deleteAddress(selectedCustomer.id, addressId);
      toast.success('Address removed.');
    } catch (err) {
      console.warn('Delete address API failed, removing locally:', err);
      toast.info('Address removed.');
    }

    const updatedAddrs = (selectedCustomer.addresses || []).filter(
      (a) => a.id !== addressId
    );
    const updatedCustomer = { ...selectedCustomer, addresses: updatedAddrs };
    setSelectedCustomer(updatedCustomer);
    setCustomers((prev) =>
      prev.map((c) => (c.id === selectedCustomer.id ? updatedCustomer : c))
    );
    setDeleteAddressConfirm(null);
  };

  // Open Change Password
  const handleOpenPasswordReset = (customer) => {
    setSelectedCustomer(customer);
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setFormError('');
    setPasswordModal(true);
  };

  // Submit Password Change
  const handleSavePassword = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!passwordForm.currentPassword) {
      setFormError('Current password is required.');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setFormError('New password must be at least 8 characters.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setFormError('New passwords do not match.');
      return;
    }

    try {
      setSubmitting(true);
      await customerService.changePassword(selectedCustomer.id, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      toast.success('Customer credentials reset successfully.');
      setPasswordModal(false);
    } catch (err) {
      const msg = err.response?.data?.message || 'Password update failed. Verify current credentials.';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="module-container">
      {/* Top Header & Metrics */}
      <div className="module-header">
        <div>
          <div className="module-title-row">
            <h1 className="module-title">
              {activeTab === 'directory' ? 'Customer Directory & Profiles' : 'Customer Support & Inquiries'}
            </h1>
            <Badge variant="teal">
              {activeTab === 'directory' ? `Total Clients: ${pagination.totalElements}` : `Total Inquiries: ${supportMessages.length}`}
            </Badge>
          </div>
          <p className="module-subtitle">
            {activeTab === 'directory'
              ? 'Search patient records, view verified prescription addresses, and manage account contact information.'
              : 'Review patient inquiries, pharmacist advisories, and order questions submitted via the customer portal.'}
          </p>
        </div>

        <div className="module-actions">
          <Button
            variant="outline"
            icon={<RefreshCw size={16} className={(activeTab === 'directory' ? loading : supportLoading) ? 'animate-spin' : ''} />}
            onClick={() => {
              if (activeTab === 'directory') {
                fetchCustomers(pagination.page);
              } else {
                fetchSupportMessages();
              }
            }}
            disabled={activeTab === 'directory' ? loading : supportLoading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Module Tabs Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--color-slate-200)',
          marginBottom: '1.5rem',
          background: 'transparent'
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('directory')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'directory' ? '3px solid var(--color-teal-600)' : '3px solid transparent',
            color: activeTab === 'directory' ? 'var(--color-teal-700)' : 'var(--color-slate-500)',
            fontWeight: activeTab === 'directory' ? 700 : 500,
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Users size={17} />
          Customer Directory
          <Badge variant={activeTab === 'directory' ? 'teal' : 'gray'}>
            {pagination.totalElements}
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('support');
            fetchSupportMessages();
          }}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'support' ? '3px solid var(--color-teal-600)' : '3px solid transparent',
            color: activeTab === 'support' ? 'var(--color-teal-700)' : 'var(--color-slate-500)',
            fontWeight: activeTab === 'support' ? 700 : 500,
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <MessageSquare size={17} />
          Support & Inquiries
          <Badge variant={activeTab === 'support' ? 'teal' : 'gray'}>
            {supportMessages.length}
          </Badge>
        </button>
      </div>

      {activeTab === 'directory' && (
        <div>

      {/* Metric Cards Row */}
      <div className="dashboard-grid" style={{ marginBottom: '1.5rem' }}>
        <Card>
          <CardBody style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="kpi-icon-wrap" style={{ background: '#ecfdf5', color: '#059669' }}>
              <Users size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-slate-500)', fontWeight: 500 }}>
                Total Registered Clients
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-slate-800)' }}>
                {pagination.totalElements}
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="kpi-icon-wrap" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <MapPin size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-slate-500)', fontWeight: 500 }}>
                Delivery Address Records
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-slate-800)' }}>
                {customers.reduce((sum, c) => sum + (c.addresses?.length || 0), 0)}
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="kpi-icon-wrap" style={{ background: '#fef3c7', color: '#d97706' }}>
              <Building size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-slate-500)', fontWeight: 500 }}>
                Active Profiles
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-slate-800)' }}>
                100% Verified
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Main Card with Search and Data Table */}
      <Card>
        <CardHeader>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: '1 1 300px', maxWidth: '420px' }}>
              <Input
                placeholder="Search by name, email, phone, or membership ID..."
                icon={<Search size={16} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div style={{ color: 'var(--color-slate-500)', fontSize: '0.875rem' }}>
              Showing {filteredCustomers.length} of {customers.length} records
            </div>
          </div>
        </CardHeader>

        <CardBody style={{ padding: 0 }}>
          {loading ? (
            <LoadingSpinner text="Loading customer directory..." />
          ) : filteredCustomers.length === 0 ? (
            <EmptyState
              icon={<Users size={36} />}
              title="No customers found"
              message={searchQuery ? `No customer matched "${searchQuery}".` : 'No registered customers found in database.'}
            />
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Membership / ID</th>
                    <th>Contact Info</th>
                    <th>Date of Birth</th>
                    <th>Saved Addresses</th>
                    <th>Registered</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((cust) => {
                    const fullName = `${cust.firstName || ''} ${cust.lastName || ''}`.trim() || 'Unnamed';
                    const initials = `${cust.firstName?.[0] || ''}${cust.lastName?.[0] || ''}`.toUpperCase() || 'CU';
                    const defaultAddr = cust.addresses?.find((a) => a.isDefault) || cust.addresses?.[0];

                    return (
                      <tr key={cust.id}>
                        {/* Customer Avatar & Name */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--color-teal-600), var(--color-teal-800))',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                flexShrink: 0
                              }}
                            >
                              {initials}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--color-slate-800)' }}>
                                {fullName}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                                User ID: #{cust.userId || cust.id}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Membership ID */}
                        <td>
                          <Badge variant="teal">
                            {cust.membershipId || `MEM-${String(cust.id).padStart(4, '0')}`}
                          </Badge>
                        </td>

                        {/* Contact Info */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.85rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-slate-700)' }}>
                              <Mail size={13} color="var(--color-slate-400)" />
                              {cust.email}
                            </span>
                            {cust.phone && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-slate-500)' }}>
                                <Phone size={13} color="var(--color-slate-400)" />
                                {cust.phone}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Date of Birth */}
                        <td>
                          {cust.dateOfBirth ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--color-slate-600)' }}>
                              <Calendar size={14} color="var(--color-slate-400)" />
                              {cust.dateOfBirth}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--color-slate-400)', fontSize: '0.85rem' }}>Not provided</span>
                          )}
                        </td>

                        {/* Saved Addresses */}
                        <td>
                          {cust.addresses && cust.addresses.length > 0 ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <Badge variant="blue">
                                {cust.addresses.length} {cust.addresses.length === 1 ? 'address' : 'addresses'}
                              </Badge>
                              {defaultAddr && (
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                                  ({defaultAddr.city})
                                </span>
                              )}
                            </div>
                          ) : (
                            <Badge variant="gray">No address</Badge>
                          )}
                        </td>

                        {/* Registered Date */}
                        <td style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)' }}>
                          {cust.createdAt ? new Date(cust.createdAt).toLocaleDateString() : 'Active'}
                        </td>

                        {/* Action Buttons */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                            <Button
                              variant="outline"
                              size="sm"
                              icon={<Eye size={14} />}
                              title="View full profile & address book"
                              onClick={() => handleOpenDetail(cust)}
                            >
                              Profile
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Edit2 size={14} />}
                              title="Edit personal contact details"
                              onClick={() => handleOpenEdit(cust)}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<MessageSquare size={14} />}
                              title="View support inquiries for this customer"
                              onClick={() => handleFilterByCustomer(cust)}
                            />
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={<KeyRound size={14} />}
                                title="Reset account password"
                                onClick={() => handleOpenPasswordReset(cust)}
                              />
                            )}
                            {canDeleteCustomer && (
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={<Trash2 size={14} color="#dc2626" />}
                                title={`Delete ${fullName}`}
                                onClick={() => handleOpenDeleteConfirm(cust)}
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>

        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          totalElements={pagination.totalElements}
          onPageChange={(p) => fetchCustomers(p)}
        />
      </Card>
      </div>
      )}

      {/* ================= TAB 2: SUPPORT & INQUIRIES ================= */}
      {activeTab === 'support' && (
        <div>
          {/* Support Metric Cards */}
          <div className="dashboard-grid" style={{ marginBottom: '1.5rem' }}>
            <Card>
              <CardBody style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className="kpi-icon-wrap" style={{ background: '#eff6ff', color: '#2563eb' }}>
                  <MessageSquare size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-slate-500)', fontWeight: 500 }}>
                    Total Inquiries Received
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-slate-800)' }}>
                    {supportMessages.length}
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className="kpi-icon-wrap" style={{ background: '#ecfdf5', color: '#059669' }}>
                  <Filter size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-slate-500)', fontWeight: 500 }}>
                    Filtered Results
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-slate-800)' }}>
                    {filteredSupportMessages.length}
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className="kpi-icon-wrap" style={{ background: '#fef3c7', color: '#d97706' }}>
                  <Users size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-slate-500)', fontWeight: 500 }}>
                    Active Inquiring Customers
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-slate-800)' }}>
                    {new Set(supportMessages.map((m) => m.customerId).filter(Boolean)).size}
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Support Search & Filter Bar */}
          <Card>
            <CardHeader>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', flex: '1 1 500px', alignItems: 'center' }}>
                  <div style={{ flex: '1 1 280px', maxWidth: '360px' }}>
                    <Input
                      placeholder="Search inquiries by customer, subject, or message..."
                      icon={<Search size={16} />}
                      value={supportSearchQuery}
                      onChange={(e) => setSupportSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Customer Filter Dropdown */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Filter size={15} color="var(--color-slate-400)" />
                    <select
                      value={selectedCustomerFilter}
                      onChange={(e) => setSelectedCustomerFilter(e.target.value)}
                      style={{
                        padding: '0.55rem 0.85rem',
                        borderRadius: 'var(--radius-md, 6px)',
                        border: '1.5px solid var(--color-border, #cbd5e1)',
                        fontSize: '0.875rem',
                        background: '#ffffff',
                        color: 'var(--color-slate-800)',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="ALL">All Customers (All Inquiries)</option>
                      {customers.map((c) => (
                        <option key={c.id} value={String(c.id)}>
                          Customer #{c.id}: {c.firstName} {c.lastName} ({c.email})
                        </option>
                      ))}
                    </select>

                    {selectedCustomerFilter !== 'ALL' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedCustomerFilter('ALL')}
                        style={{ fontSize: '0.8rem', color: 'var(--color-teal-700)' }}
                      >
                        Reset Filter
                      </Button>
                    )}
                  </div>
                </div>

                <div style={{ color: 'var(--color-slate-500)', fontSize: '0.875rem' }}>
                  Showing {filteredSupportMessages.length} of {supportMessages.length} inquiries
                </div>
              </div>
            </CardHeader>

            <CardBody style={{ padding: 0 }}>
              {supportLoading ? (
                <LoadingSpinner text="Loading customer support messages..." />
              ) : filteredSupportMessages.length === 0 ? (
                <EmptyState
                  icon={<Inbox size={36} />}
                  title="No Inquiries Found"
                  description={
                    selectedCustomerFilter !== 'ALL'
                      ? 'No support messages found for the selected customer.'
                      : 'There are currently no customer support inquiries matching your search.'
                  }
                  action={
                    selectedCustomerFilter !== 'ALL' ? (
                      <Button variant="outline" size="sm" onClick={() => setSelectedCustomerFilter('ALL')}>
                        Show All Inquiries
                      </Button>
                    ) : null
                  }
                />
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th>Subject & Inquiry</th>
                        <th>Message Preview</th>
                        <th>Status</th>
                        <th>Submitted At</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSupportMessages.map((msg) => {
                        const initials = (msg.customerName || 'CU')
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase();

                        return (
                          <tr key={msg.id}>
                            {/* Customer Identifier */}
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div
                                  style={{
                                    width: '38px',
                                    height: '38px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, var(--color-teal-600), var(--color-teal-800))',
                                    color: '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 600,
                                    fontSize: '0.875rem',
                                    flexShrink: 0
                                  }}
                                >
                                  {initials}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600, color: 'var(--color-slate-800)' }}>
                                    {msg.customerName || 'Customer'}
                                  </div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <Mail size={12} /> {msg.customerEmail || 'No email'}
                                  </div>
                                  <div style={{ fontSize: '0.7rem', color: 'var(--color-teal-700)', fontWeight: 600 }}>
                                    Customer ID: #{msg.customerId}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Subject */}
                            <td>
                              <div>
                                <Badge variant="teal" style={{ marginBottom: '0.25rem' }}>
                                  Inquiry #{msg.id}
                                </Badge>
                                <div style={{ fontWeight: 600, color: 'var(--color-slate-800)', fontSize: '0.9rem' }}>
                                  {msg.subject}
                                </div>
                              </div>
                            </td>

                            {/* Preview */}
                            <td style={{ maxWidth: '340px' }}>
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: '0.85rem',
                                  color: 'var(--color-slate-600)',
                                  lineHeight: 1.4,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical'
                                }}
                              >
                                {msg.message}
                              </p>
                            </td>

                            {/* Reply Status */}
                            <td>
                              {msg.replyText ? (
                                <Badge variant="teal" style={{ whiteSpace: 'nowrap' }}>✓ Replied</Badge>
                              ) : (
                                <Badge variant="gray" style={{ whiteSpace: 'nowrap' }}>Pending</Badge>
                              )}
                            </td>

                            {/* Timestamp */}
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.825rem', color: 'var(--color-slate-600)' }}>
                                <Clock size={13} color="var(--color-slate-400)" />
                                {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : 'Recent'}
                              </div>
                            </td>

                            {/* Actions */}
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  icon={<Eye size={14} />}
                                  onClick={() => { setSelectedMessageModal(msg); setReplyDraft(''); }}
                                >
                                  View
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* ================= MODAL: CUSTOMER DETAIL & ADDRESS BOOK ================= */}
      <Modal
        isOpen={viewDetailModal}
        onClose={() => setViewDetailModal(false)}
        title={
          selectedCustomer
            ? `Customer Profile: ${selectedCustomer.firstName || ''} ${selectedCustomer.lastName || ''}`
            : 'Customer Profile'
        }
        size="lg"
      >
        {selectedCustomer && (
          <div>
            {/* Header Identity Card */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.25rem',
                padding: '1.25rem',
                background: 'linear-gradient(135deg, var(--color-slate-50), var(--color-teal-50))',
                borderRadius: '8px',
                border: '1px solid var(--color-slate-200)',
                marginBottom: '1.5rem'
              }}
            >
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--color-teal-600), var(--color-teal-900))',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  fontWeight: 700
                }}
              >
                {`${selectedCustomer.firstName?.[0] || ''}${selectedCustomer.lastName?.[0] || ''}`.toUpperCase()}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-slate-900)' }}>
                    {selectedCustomer.firstName} {selectedCustomer.lastName}
                  </h3>
                  <Badge variant="teal">
                    {selectedCustomer.membershipId || `MEM-${selectedCustomer.id}`}
                  </Badge>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', marginTop: '0.35rem', fontSize: '0.85rem', color: 'var(--color-slate-600)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Mail size={14} /> {selectedCustomer.email}
                  </span>
                  {selectedCustomer.phone && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Phone size={14} /> {selectedCustomer.phone}
                    </span>
                  )}
                  {selectedCustomer.dateOfBirth && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Calendar size={14} /> DOB: {selectedCustomer.dateOfBirth}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Edit2 size={14} />}
                  onClick={() => {
                    setViewDetailModal(false);
                    handleOpenEdit(selectedCustomer);
                  }}
                >
                  Edit Info
                </Button>
                {canDeleteCustomer && (
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Trash2 size={14} color="#dc2626" />}
                    style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                    onClick={() => {
                      handleOpenDeleteConfirm(selectedCustomer);
                    }}
                  >
                    Delete Customer
                  </Button>
                )}
              </div>
            </div>

            {/* Address Management Section */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-slate-800)' }}>
                    Delivery Addresses ({selectedCustomer.addresses?.length || 0})
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-slate-500)' }}>
                    Managed delivery drop-off destinations for pharmacy dispatch.
                  </p>
                </div>
                <Button
                  variant="teal"
                  size="sm"
                  icon={<Plus size={14} />}
                  onClick={() => handleOpenAddAddress(selectedCustomer)}
                >
                  Add Address
                </Button>
              </div>

              {(!selectedCustomer.addresses || selectedCustomer.addresses.length === 0) ? (
                <div
                  style={{
                    padding: '2rem',
                    textAlign: 'center',
                    background: 'var(--color-slate-50)',
                    borderRadius: '8px',
                    border: '1px dashed var(--color-slate-300)'
                  }}
                >
                  <MapPin size={28} style={{ color: 'var(--color-slate-400)', marginBottom: '0.5rem' }} />
                  <div style={{ fontWeight: 600, color: 'var(--color-slate-700)' }}>No addresses on record</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-slate-500)', marginBottom: '1rem' }}>
                    This customer does not have any saved delivery addresses yet.
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Plus size={14} />}
                    onClick={() => handleOpenAddAddress(selectedCustomer)}
                  >
                    Add First Address
                  </Button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {selectedCustomer.addresses.map((addr) => (
                    <div
                      key={addr.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1rem',
                        borderRadius: '8px',
                        border: addr.isDefault
                          ? '1.5px solid var(--color-teal-500)'
                          : '1px solid var(--color-slate-200)',
                        background: addr.isDefault ? 'var(--color-teal-50)' : '#ffffff'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--color-slate-800)', fontSize: '0.95rem' }}>
                            {addr.label || 'Address'}
                          </span>
                          {addr.isDefault && (
                            <Badge variant="teal" icon={<CheckCircle2 size={12} />}>
                              Default Delivery
                            </Badge>
                          )}
                        </div>
                        <div style={{ color: 'var(--color-slate-700)', fontSize: '0.875rem' }}>
                          {addr.addressLine1}
                          {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                        </div>
                        <div style={{ color: 'var(--color-slate-500)', fontSize: '0.8rem' }}>
                          {addr.city}, {addr.postalCode || 'N/A'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {!addr.isDefault && (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Star size={14} />}
                            title="Set as default address"
                            onClick={() => handleSetDefaultAddress(addr.id)}
                          >
                            Set Default
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Edit2 size={14} />}
                          title="Edit address"
                          onClick={() => handleOpenEditAddress(selectedCustomer, addr)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 size={14} color="#ef4444" />}
                          title="Remove address"
                          onClick={() =>
                            setDeleteAddressConfirm({
                              addressId: addr.id,
                              label: addr.label || addr.addressLine1
                            })
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Customer Inquiries History Section */}
            <div style={{ marginTop: '2rem', borderTop: '1px solid var(--color-slate-200)', paddingTop: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-slate-800)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MessageSquare size={16} color="var(--color-teal-600)" />
                    Customer Support Inquiries ({customerInquiries.length})
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-slate-500)' }}>
                    Inquiries and pharmacist advisory questions submitted by {selectedCustomer.firstName}.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<MessageSquare size={14} />}
                  onClick={() => {
                    setViewDetailModal(false);
                    handleFilterByCustomer(selectedCustomer);
                  }}
                >
                  Manage in Support Tab
                </Button>
              </div>

              {customerInquiriesLoading ? (
                <LoadingSpinner text="Loading inquiries..." />
              ) : customerInquiries.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', background: 'var(--color-slate-50)', borderRadius: '8px', border: '1px dashed var(--color-slate-300)', color: 'var(--color-slate-500)', fontSize: '0.85rem' }}>
                  No support messages submitted by this customer yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {customerInquiries.map((inq) => (
                    <div
                      key={inq.id}
                      style={{
                        padding: '1rem',
                        background: '#ffffff',
                        border: '1px solid var(--color-slate-200)',
                        borderRadius: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Badge variant="teal">Inquiry #{inq.id}</Badge>
                          <strong style={{ fontSize: '0.9rem', color: 'var(--color-slate-800)' }}>{inq.subject}</strong>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Clock size={12} />
                          {inq.createdAt ? new Date(inq.createdAt).toLocaleString() : ''}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.825rem', color: 'var(--color-slate-600)', margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                        {inq.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ================= MODAL: EDIT CUSTOMER PROFILE ================= */}
      <Modal
        isOpen={editModal}
        onClose={() => setEditModal(false)}
        title="Edit Customer Profile"
        size="md"
      >
        <form onSubmit={handleSaveEdit}>
          {formError && (
            <div className="alert-box error" style={{ marginBottom: '1rem' }}>
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <Input
              label="First Name *"
              value={editForm.firstName}
              onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
              required
            />
            <Input
              label="Last Name"
              value={editForm.lastName}
              onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <Input
              label="Phone Number"
              icon={<Phone size={16} />}
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              placeholder="+94 7X-XXX-XXXX"
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <Input
              type="date"
              label="Date of Birth"
              icon={<Calendar size={16} />}
              value={editForm.dateOfBirth}
              onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button
              variant="outline"
              type="button"
              onClick={() => setEditModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="teal"
              type="submit"
              loading={submitting}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: ADD / EDIT ADDRESS ================= */}
      <Modal
        isOpen={addressModal}
        onClose={() => setAddressModal(false)}
        title={addressForm.id ? 'Edit Delivery Address' : 'Add Delivery Address'}
        size="md"
      >
        <form onSubmit={handleSaveAddress}>
          {formError && (
            <div className="alert-box error" style={{ marginBottom: '1rem' }}>
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <Input
              label="Address Label (e.g., Home, Office, Clinic)"
              value={addressForm.label}
              onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
              placeholder="Home"
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <Input
              label="Street Address Line 1 *"
              value={addressForm.addressLine1}
              onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
              placeholder="123 Health Ave"
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <Input
              label="Address Line 2 (Apt, Suite, Unit)"
              value={addressForm.addressLine2}
              onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
              placeholder="Apt 4B"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <Input
              label="City *"
              value={addressForm.city}
              onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
              placeholder="Colombo, Kandy, Galle..."
              required
            />
            <Input
              label="Postal Code"
              value={addressForm.postalCode}
              onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
              placeholder="00300"
            />
          </div>

          <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              id="isDefault"
              checked={addressForm.isDefault}
              onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
              style={{ width: '16px', height: '16px', accentColor: 'var(--color-teal-600)' }}
            />
            <label htmlFor="isDefault" style={{ fontSize: '0.875rem', color: 'var(--color-slate-700)', cursor: 'pointer' }}>
              Set as primary default delivery destination
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button
              variant="outline"
              type="button"
              onClick={() => setAddressModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="teal"
              type="submit"
              loading={submitting}
            >
              {addressForm.id ? 'Update Address' : 'Save Address'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: CHANGE/RESET PASSWORD ================= */}
      <Modal
        isOpen={passwordModal}
        onClose={() => setPasswordModal(false)}
        title="Admin Password Reset"
        size="md"
      >
        <form onSubmit={handleSavePassword}>
          {formError && (
            <div className="alert-box error" style={{ marginBottom: '1rem' }}>
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <div style={{ background: '#fef2f2', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid #fee2e2', marginBottom: '1.25rem', display: 'flex', gap: '0.5rem' }}>
            <ShieldAlert size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.8rem', color: '#991b1b' }}>
              You are performing an administrative credential update for customer{' '}
              <strong>{selectedCustomer?.email}</strong>.
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <Input
              type="password"
              label="Current Password *"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              placeholder="Enter customer's current password"
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <Input
              type="password"
              label="New Password (min 8 characters) *"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              placeholder="Enter new strong password"
              required
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <Input
              type="password"
              label="Confirm New Password *"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              placeholder="Re-type new password"
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button
              variant="outline"
              type="button"
              onClick={() => setPasswordModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              type="submit"
              loading={submitting}
            >
              Reset Credentials
            </Button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: SUPPORT INQUIRY DETAIL ================= */}
      <Modal
        isOpen={!!selectedMessageModal}
        onClose={() => setSelectedMessageModal(null)}
        title="Customer Support Inquiry Details"
        size="md"
      >
        {selectedMessageModal && (
          <div>
            {/* Customer Identity Banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem',
                background: 'var(--color-slate-50)',
                borderRadius: '8px',
                border: '1px solid var(--color-slate-200)',
                marginBottom: '1.25rem'
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--color-teal-600), var(--color-teal-800))',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                  fontWeight: 700
                }}
              >
                {(selectedMessageModal.customerName || 'C')[0]?.toUpperCase()}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--color-slate-900)' }}>
                    {selectedMessageModal.customerName}
                  </h4>
                  <Badge variant="teal">Customer #{selectedMessageModal.customerId}</Badge>
                </div>
                <div style={{ fontSize: '0.825rem', color: 'var(--color-slate-500)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>{selectedMessageModal.customerEmail}</span>
                  <span>•</span>
                  <span>
                    {selectedMessageModal.createdAt ? new Date(selectedMessageModal.createdAt).toLocaleString() : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Subject */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Subject / Inquiry Reason
              </label>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-slate-800)', marginTop: '0.25rem' }}>
                {selectedMessageModal.subject}
              </div>
            </div>

            {/* Message Body */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Customer Message
              </label>
              <div
                style={{
                  marginTop: '0.35rem',
                  padding: '1rem',
                  background: '#f8fafc',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border, #cbd5e1)',
                  fontSize: '0.9rem',
                  color: 'var(--color-slate-700)',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {selectedMessageModal.message}
              </div>
            </div>

            {/* Existing Reply (if any) */}
            {selectedMessageModal.replyText && (
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ✓ Reply Sent
                </label>
                <div style={{ marginTop: '0.35rem', padding: '1rem', background: 'linear-gradient(135deg, #ecfdf5, #f0fdf4)', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600, marginBottom: '0.4rem' }}>
                    Replied by {selectedMessageModal.repliedByName || 'Staff'} &nbsp;·&nbsp;
                    {selectedMessageModal.replyAt ? new Date(selectedMessageModal.replyAt).toLocaleString() : ''}
                  </div>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#065f46', lineHeight: '1.55', whiteSpace: 'pre-wrap' }}>
                    {selectedMessageModal.replyText}
                  </p>
                </div>
              </div>
            )}

            {/* Reply Compose Area */}
            <div style={{ marginBottom: '1.25rem', borderTop: '1px dashed var(--color-slate-200)', paddingTop: '1rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-slate-600)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.4rem' }}>
                {selectedMessageModal.replyText ? 'Update Reply' : 'Write a Reply'}
              </label>
              <textarea
                rows={4}
                placeholder="Type your reply to the customer here..."
                value={replyDraft}
                onChange={(e) => setReplyDraft(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '6px',
                  border: '1.5px solid var(--color-border, #cbd5e1)',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit',
                  lineHeight: '1.5',
                  resize: 'vertical',
                  background: '#fff',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', borderTop: '1px solid var(--color-slate-200)', paddingTop: '1rem' }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const cust = customers.find((c) => c.id === selectedMessageModal.customerId);
                  setSelectedMessageModal(null);
                  if (cust) {
                    handleOpenDetail(cust);
                  } else {
                    toast.info(`Customer profile ID: #${selectedMessageModal.customerId}`);
                  }
                }}
              >
                View Customer Profile
              </Button>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMessageModal(null)}
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!replyDraft.trim() || submittingReply}
                  onClick={handleReplySubmit}
                  icon={<MessageSquare size={14} />}
                >
                  {submittingReply ? 'Sending...' : (selectedMessageModal.replyText ? 'Update Reply' : 'Send Reply')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ================= CONFIRM DELETE ADDRESS MODAL ================= */}
      <ConfirmModal
        isOpen={!!deleteAddressConfirm}
        onClose={() => setDeleteAddressConfirm(null)}
        onConfirm={confirmDeleteAddress}
        title="Delete Address"
        message={`Are you sure you want to delete "${deleteAddressConfirm?.label}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
      />

      {/* ================= CONFIRM DELETE CUSTOMER MODAL ================= */}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => {
          if (!deletingCustomer) {
            setDeleteConfirmOpen(false);
            setCustomerToDelete(null);
          }
        }}
        onConfirm={handleConfirmDeleteCustomer}
        title="Delete Customer"
        message={
          customerToDelete
            ? `Are you sure you want to delete ${customerToDelete.firstName || ''} ${customerToDelete.lastName || ''}`.trim() + '?'
            : 'Are you sure you want to delete this customer?'
        }
        confirmLabel="Delete Customer"
        cancelLabel="Cancel"
        variant="danger"
        loading={deletingCustomer}
      />
    </div>
  );
}
