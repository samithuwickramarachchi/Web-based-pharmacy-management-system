import React, { useState, useEffect, useMemo } from 'react';
import {
  Truck,
  Building,
  Building2,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Calendar,
  DollarSign,
  PackageCheck,
  Eye,
  RefreshCw,
  Edit2,
  Trash2,
  Layers,
  ArrowDownCircle,
  XCircle,
  Phone,
  Mail,
  MapPin,
  User,
  Check,
  AlertTriangle,
  ShieldCheck,
  Filter
} from 'lucide-react';
import supplierService from '../../services/supplierService';
import inventoryService from '../../services/inventoryService';
import { formatCurrency } from '../../utils/formatUtils';
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

export default function SupplierManagement() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Role validation matching backend Spring Security roles
  const userRole = (user?.role || '').toUpperCase();
  const userAuthorities = (user?.authorities || []).map((a) =>
    (typeof a === 'string' ? a : a.authority || '').toUpperCase()
  );

  const isManagerOrAdmin =
    userRole === 'ADMIN' ||
    userRole === 'INVENTORY_MANAGER' ||
    userRole === 'SUPPLIER_OFFICER' ||
    userRole === 'SUPPLIER_STAFF' ||
    userAuthorities.includes('ROLE_ADMIN') ||
    userAuthorities.includes('ROLE_INVENTORY_MANAGER') ||
    userAuthorities.includes('ROLE_SUPPLIER_OFFICER') ||
    userAuthorities.includes('ROLE_SUPPLIER_STAFF');

  const isAdminOnly =
    userRole === 'ADMIN' ||
    userRole === 'SUPPLIER_OFFICER' ||
    userAuthorities.includes('ROLE_ADMIN') ||
    userAuthorities.includes('ROLE_SUPPLIER_OFFICER');

  const [activeTab, setActiveTab] = useState('pos'); // 'pos', 'suppliers'

  // Data State
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [supplierFilter, setSupplierFilter] = useState('ALL');

  const [supplierSearch, setSupplierSearch] = useState('');
  const [supplierStatusFilter, setSupplierStatusFilter] = useState('ALL');

  // Pagination State for Purchase Orders
  const [poPagination, setPoPagination] = useState({
    page: 0,
    size: 10,
    totalPages: 1,
    totalElements: 0
  });

  // Modal States
  const [createPoModal, setCreatePoModal] = useState(false);
  const [receiveStockModal, setReceiveStockModal] = useState(false);
  const [viewPoModal, setViewPoModal] = useState(false);
  const [supplierModal, setSupplierModal] = useState(false);
  const [viewSupplierModal, setViewSupplierModal] = useState(false);

  // Selected Entities for Action
  const [selectedPo, setSelectedPo] = useState(null);
  const [currentSupplier, setCurrentSupplier] = useState(null);
  const [viewingSupplier, setViewingSupplier] = useState(null);
  const [supplierPOs, setSupplierPOs] = useState([]);
  const [loadingSupplierPOs, setLoadingSupplierPOs] = useState(false);

  // Confirmation Modals
  const [confirmDeleteSupplier, setConfirmDeleteSupplier] = useState(null);
  const [confirmCancelPo, setConfirmCancelPo] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Forms
  const [poForm, setPoForm] = useState({
    supplierId: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: '',
    notes: '',
    items: [
      { productId: '', quantityOrdered: 50, unitCost: 10.00 }
    ]
  });

  const [receiveForm, setReceiveForm] = useState({
    items: []
  });

  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    isActive: true
  });

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Load POs, Suppliers and Products
  const loadData = async (page = 0) => {
    try {
      setLoading(true);
      const [posData, suppData, prodData] = await Promise.all([
        supplierService.getAllPurchaseOrders(page, poPagination.size).catch(() => null),
        supplierService.getAllSuppliers(0, 100).catch(() => null),
        inventoryService.getProducts(0, 100).catch(() => null)
      ]);

      if (posData?.content) {
        setPurchaseOrders(posData.content);
        setPoPagination({
          page: posData.number || 0,
          size: posData.size || 10,
          totalPages: posData.totalPages || 1,
          totalElements: posData.totalElements || posData.content.length
        });
      }

      if (suppData?.content) {
        setSuppliers(suppData.content);
      }

      if (prodData?.content) {
        setProducts(prodData.content);
      }
    } catch (err) {
      console.error('Supplier data load error:', err);
      toast.error('Failed to load supplier management data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(0);
  }, []);

  // Filtered POs
  const filteredPOs = useMemo(() => {
    return purchaseOrders.filter((po) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        po.poNumber?.toLowerCase().includes(q) ||
        po.supplierName?.toLowerCase().includes(q);

      const matchStatus = statusFilter === 'ALL' || po.status === statusFilter;
      const matchSupplier = supplierFilter === 'ALL' || String(po.supplierId) === String(supplierFilter);

      return matchSearch && matchStatus && matchSupplier;
    });
  }, [purchaseOrders, searchQuery, statusFilter, supplierFilter]);

  // Filtered Suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const q = supplierSearch.toLowerCase();
      const matchSearch =
        !q ||
        s.name?.toLowerCase().includes(q) ||
        s.contactPerson?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.phone?.toLowerCase().includes(q) ||
        s.address?.toLowerCase().includes(q);

      const matchStatus =
        supplierStatusFilter === 'ALL' ||
        (supplierStatusFilter === 'ACTIVE' && s.isActive) ||
        (supplierStatusFilter === 'INACTIVE' && !s.isActive);

      return matchSearch && matchStatus;
    });
  }, [suppliers, supplierSearch, supplierStatusFilter]);

  // Status Badge Rendering
  const renderPoStatusBadge = (status) => {
    switch (status) {
      case 'RECEIVED':
        return <Badge variant="success">Received & Stocked</Badge>;
      case 'PARTIALLY_RECEIVED':
        return <Badge variant="blue">Partially Received</Badge>;
      case 'CONFIRMED':
        return <Badge variant="teal">Confirmed by Vendor</Badge>;
      case 'SUBMITTED':
        return <Badge variant="warning">Submitted</Badge>;
      case 'DRAFT':
        return <Badge variant="gray">Draft</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="gray">{status}</Badge>;
    }
  };

  // Open Create PO Modal
  const handleOpenCreatePo = (preselectedSupplierId = null) => {
    const defaultSupplier = preselectedSupplierId
      ? suppliers.find((s) => s.id === Number(preselectedSupplierId))
      : suppliers.find((s) => s.isActive) || suppliers[0];

    const defaultProduct = products[0];

    setPoForm({
      supplierId: defaultSupplier ? defaultSupplier.id : '',
      orderDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: '',
      notes: '',
      items: [
        {
          productId: defaultProduct ? defaultProduct.id : '',
          quantityOrdered: 50,
          unitCost: defaultProduct?.sellingPrice ? Number((defaultProduct.sellingPrice * 0.6).toFixed(2)) : 10.00
        }
      ]
    });
    setFormError('');
    setCreatePoModal(true);
  };

  // Add Item Line to PO Form
  const handleAddPoItemLine = () => {
    const defaultProduct = products[0];
    setPoForm({
      ...poForm,
      items: [
        ...poForm.items,
        {
          productId: defaultProduct ? defaultProduct.id : '',
          quantityOrdered: 50,
          unitCost: 10.00
        }
      ]
    });
  };

  const handleRemovePoItemLine = (idx) => {
    setPoForm({
      ...poForm,
      items: poForm.items.filter((_, i) => i !== idx)
    });
  };

  // Save Purchase Order
  const handleSavePurchaseOrder = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!poForm.supplierId) {
      setFormError('Please select a supplier.');
      return;
    }
    if (!poForm.items || poForm.items.length === 0) {
      setFormError('Please add at least one line item to the order.');
      return;
    }

    for (let i = 0; i < poForm.items.length; i++) {
      const it = poForm.items[i];
      if (!it.productId) {
        setFormError(`Please select a medicine for item line #${i + 1}.`);
        return;
      }
      if (!it.quantityOrdered || Number(it.quantityOrdered) < 1) {
        setFormError(`Quantity ordered for item line #${i + 1} must be at least 1.`);
        return;
      }
      if (it.unitCost === '' || Number(it.unitCost) < 0) {
        setFormError(`Unit cost for item line #${i + 1} must be non-negative.`);
        return;
      }
    }

    try {
      setSubmitting(true);
      const payload = {
        supplierId: Number(poForm.supplierId),
        orderDate: poForm.orderDate,
        expectedDeliveryDate: poForm.expectedDeliveryDate || null,
        notes: poForm.notes || null,
        items: poForm.items.map((it) => ({
          productId: Number(it.productId),
          quantityOrdered: Number(it.quantityOrdered),
          unitCost: Number(it.unitCost)
        }))
      };

      const createdPo = await supplierService.createPurchaseOrder(payload);
      toast.success(`Purchase Order ${createdPo.poNumber} submitted successfully.`);

      setPurchaseOrders((prev) => [createdPo, ...prev]);
      setCreatePoModal(false);
    } catch (err) {
      console.error('Failed to create purchase order:', err);
      const msg = err.response?.data?.message || 'Failed to submit purchase order. Please verify details.';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Update PO Status (Confirm / Cancel)
  const handleUpdatePoStatus = async (poId, newStatus) => {
    try {
      setActionLoading(true);
      const updated = await supplierService.updatePurchaseOrderStatus(poId, newStatus);
      toast.success(`PO ${updated.poNumber} status updated to ${newStatus}.`);

      setPurchaseOrders((prev) => prev.map((p) => (p.id === poId ? updated : p)));
      if (selectedPo && selectedPo.id === poId) {
        setSelectedPo(updated);
      }
      setConfirmCancelPo(null);
    } catch (err) {
      console.error('PO status update failed:', err);
      toast.error(err.response?.data?.message || `Failed to update status to ${newStatus}.`);
    } finally {
      setActionLoading(false);
    }
  };

  // Open Receive Stock Modal
  const handleOpenReceiveModal = (po) => {
    setSelectedPo(po);
    const initialItems = (po.items || []).map((it) => {
      const remaining = Math.max(0, it.quantityOrdered - (it.quantityReceived || 0));
      return {
        productId: it.productId,
        productName: it.productName,
        quantityReceived: remaining || it.quantityOrdered,
        batchNumber: `BAT-${Date.now().toString().slice(-4)}-${it.productId}`,
        manufacturingDate: new Date().toISOString().split('T')[0],
        expiryDate: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 years default
        purchasePrice: it.unitCost,
        sellingPrice: (Number(it.unitCost) * 1.5).toFixed(2)
      };
    });

    setReceiveForm({ items: initialItems });
    setFormError('');
    setReceiveStockModal(true);
  };

  // Submit Receive Stock
  const handleSaveReceiveStock = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!receiveForm.items || receiveForm.items.length === 0) {
      setFormError('No items specified to receive.');
      return;
    }

    for (let i = 0; i < receiveForm.items.length; i++) {
      const it = receiveForm.items[i];
      if (!it.quantityReceived || Number(it.quantityReceived) < 1) {
        setFormError(`Quantity received for ${it.productName} must be at least 1.`);
        return;
      }
      if (!it.batchNumber || !it.batchNumber.trim()) {
        setFormError(`Batch / Lot number is required for ${it.productName}.`);
        return;
      }
      if (!it.expiryDate) {
        setFormError(`Expiry date is required for ${it.productName}.`);
        return;
      }
    }

    try {
      setSubmitting(true);
      const payload = {
        items: receiveForm.items.map((it) => ({
          productId: Number(it.productId),
          quantityReceived: Number(it.quantityReceived),
          batchNumber: it.batchNumber.trim(),
          manufacturingDate: it.manufacturingDate || null,
          expiryDate: it.expiryDate,
          purchasePrice: Number(it.purchasePrice),
          sellingPrice: Number(it.sellingPrice)
        }))
      };

      const updatedPo = await supplierService.receiveStock(selectedPo.id, payload);
      toast.success(`Stock received and new batches added to inventory for ${selectedPo.poNumber}.`);

      setPurchaseOrders((prev) =>
        prev.map((po) => (po.id === selectedPo.id ? updatedPo : po))
      );
      setReceiveStockModal(false);
    } catch (err) {
      console.error('Receive stock failed:', err);
      const msg = err.response?.data?.message || 'Failed to receive stock into inventory.';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Supplier CRUD
  const handleOpenAddSupplier = () => {
    setCurrentSupplier(null);
    setSupplierForm({
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      isActive: true
    });
    setFormError('');
    setSupplierModal(true);
  };

  const handleOpenEditSupplier = (s) => {
    setCurrentSupplier(s);
    setSupplierForm({
      name: s.name || '',
      contactPerson: s.contactPerson || '',
      email: s.email || '',
      phone: s.phone || '',
      address: s.address || '',
      isActive: s.isActive ?? true
    });
    setFormError('');
    setSupplierModal(true);
  };

  const handleViewSupplierDetails = async (s) => {
    setViewingSupplier(s);
    setViewSupplierModal(true);
    try {
      setLoadingSupplierPOs(true);
      const pos = await supplierService.getPurchaseOrdersBySupplier(s.id);
      setSupplierPOs(pos || []);
    } catch (err) {
      console.warn('Failed to load POs for supplier:', err);
      setSupplierPOs([]);
    } finally {
      setLoadingSupplierPOs(false);
    }
  };

  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!supplierForm.name.trim()) {
      setFormError('Supplier company name is required.');
      return;
    }

    try {
      setSubmitting(true);
      if (currentSupplier) {
        const updated = await supplierService.updateSupplier(currentSupplier.id, supplierForm);
        setSuppliers((prev) =>
          prev.map((s) => (s.id === currentSupplier.id ? updated : s))
        );
        toast.success(`Supplier "${supplierForm.name}" updated successfully.`);
      } else {
        const created = await supplierService.createSupplier(supplierForm);
        setSuppliers((prev) => [created, ...prev]);
        toast.success(`Supplier "${supplierForm.name}" registered successfully.`);
      }
      setSupplierModal(false);
    } catch (err) {
      console.error('Failed to save supplier:', err);
      const msg = err.response?.data?.message || 'Failed to save supplier. Please check name uniqueness.';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete / Deactivate Supplier
  const handleConfirmDeactivateSupplier = async () => {
    if (!confirmDeleteSupplier) return;
    try {
      setActionLoading(true);
      await supplierService.deleteSupplier(confirmDeleteSupplier.id);
      toast.success(`Supplier "${confirmDeleteSupplier.name}" deactivated.`);

      setSuppliers((prev) =>
        prev.map((s) => (s.id === confirmDeleteSupplier.id ? { ...s, isActive: false } : s))
      );
      setConfirmDeleteSupplier(null);
    } catch (err) {
      console.error('Failed to deactivate supplier:', err);
      toast.error(err.response?.data?.message || 'Failed to deactivate supplier.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="module-container">
      {/* Module Header */}
      <div className="module-header">
        <div>
          <div className="module-title-row">
            <h1 className="module-title">Suppliers & Purchase Orders</h1>
            <Badge variant="teal">{purchaseOrders.length} Procurement Orders</Badge>
          </div>
          <p className="module-subtitle">
            Procure pharmaceutical stocks from distributors, track shipment orders, and receive batches into dispensary inventory.
          </p>
        </div>

        <div className="module-actions">
          {activeTab === 'pos' && isManagerOrAdmin && (
            <Button
              variant="teal"
              icon={<Plus size={16} />}
              onClick={() => handleOpenCreatePo()}
            >
              Draft Purchase Order
            </Button>
          )}
          {activeTab === 'suppliers' && isManagerOrAdmin && (
            <Button
              variant="teal"
              icon={<Plus size={16} />}
              onClick={handleOpenAddSupplier}
            >
              Register Supplier
            </Button>
          )}
          <Button
            variant="outline"
            icon={<RefreshCw size={16} className={loading ? 'animate-spin' : ''} />}
            onClick={() => loadData(poPagination.page)}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--color-border)', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('pos')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: 'pointer',
            borderBottom: activeTab === 'pos' ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === 'pos' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <FileText size={16} />
          Purchase Orders ({purchaseOrders.length})
        </button>

        <button
          onClick={() => setActiveTab('suppliers')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: 'pointer',
            borderBottom: activeTab === 'suppliers' ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === 'suppliers' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Building2 size={16} />
          Supplier Directory ({suppliers.length})
        </button>
      </div>

      {/* ================= TAB 1: PURCHASE ORDERS ================= */}
      {activeTab === 'pos' && (
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: '1 1 300px', maxWidth: '380px' }}>
                <Input
                  placeholder="Search PO number or supplier..."
                  icon={<Search size={16} />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <select
                  className="form-control"
                  style={{ width: 'auto', minWidth: '170px', fontSize: '0.875rem' }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All PO Statuses</option>
                  <option value="DRAFT">Draft</option>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="PARTIALLY_RECEIVED">Partially Received</option>
                  <option value="RECEIVED">Received</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>

                <select
                  className="form-control"
                  style={{ width: 'auto', minWidth: '180px', fontSize: '0.875rem' }}
                  value={supplierFilter}
                  onChange={(e) => setSupplierFilter(e.target.value)}
                >
                  <option value="ALL">All Suppliers</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>

          <CardBody style={{ padding: 0 }}>
            {loading ? (
              <LoadingSpinner text="Loading purchase orders..." />
            ) : filteredPOs.length === 0 ? (
              <EmptyState
                icon={<Truck size={36} />}
                title="No purchase orders found"
                message="No procurement orders match your filter criteria. Click 'Draft Purchase Order' to initiate restocking."
              />
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>PO Number</th>
                      <th>Order Date</th>
                      <th>Supplier Distributor</th>
                      <th>Expected Delivery</th>
                      <th>Total Value</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPOs.map((po) => (
                      <tr key={po.id}>
                        <td>
                          <span style={{ fontWeight: 700, color: 'var(--color-teal-700)' }}>
                            {po.poNumber}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)' }}>
                          {po.orderDate}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--color-slate-800)', fontSize: '0.875rem' }}>
                            {po.supplierName}
                          </div>
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)' }}>
                          {po.expectedDeliveryDate || 'Standard Delivery'}
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-slate-900)' }}>
                            {formatCurrency(po.totalAmount)}
                          </span>
                        </td>
                        <td>{renderPoStatusBadge(po.status)}</td>
                        <td>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' }}>
                            <Button
                              variant="outline"
                              size="sm"
                              icon={<Eye size={14} />}
                              onClick={() => {
                                setSelectedPo(po);
                                setViewPoModal(true);
                              }}
                            >
                              Details
                            </Button>
                            {po.status !== 'RECEIVED' && po.status !== 'CANCELLED' && isManagerOrAdmin && (
                              <Button
                                variant="teal"
                                size="sm"
                                icon={<PackageCheck size={14} />}
                                onClick={() => handleOpenReceiveModal(po)}
                              >
                                Receive Stock
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>

          <Pagination
            page={poPagination.page}
            totalPages={poPagination.totalPages}
            totalElements={poPagination.totalElements}
            onPageChange={(p) => loadData(p)}
          />
        </Card>
      )}

      {/* ================= TAB 2: SUPPLIERS DIRECTORY ================= */}
      {activeTab === 'suppliers' && (
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: '1 1 300px', maxWidth: '380px' }}>
                <Input
                  placeholder="Search supplier name, representative, email..."
                  icon={<Search size={16} />}
                  value={supplierSearch}
                  onChange={(e) => setSupplierSearch(e.target.value)}
                />
              </div>

              <div>
                <select
                  className="form-control"
                  style={{ width: 'auto', minWidth: '170px', fontSize: '0.875rem' }}
                  value={supplierStatusFilter}
                  onChange={(e) => setSupplierStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Vendors</option>
                  <option value="ACTIVE">Active Vendors Only</option>
                  <option value="INACTIVE">Inactive Vendors</option>
                </select>
              </div>
            </div>
          </CardHeader>

          <CardBody style={{ padding: 0 }}>
            {filteredSuppliers.length === 0 ? (
              <EmptyState
                icon={<Building size={36} />}
                title="No suppliers found"
                message="No suppliers match your search criteria."
              />
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Supplier Company</th>
                      <th>Contact Representative</th>
                      <th>Email & Phone</th>
                      <th>Address / Hub</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSuppliers.map((s) => (
                      <tr key={s.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '6px',
                                background: s.isActive ? '#eff6ff' : '#f1f5f9',
                                color: s.isActive ? '#1d4ed8' : '#94a3b8',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Building size={16} />
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--color-slate-800)' }}>{s.name}</div>
                              <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                                ID: #{s.id}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td style={{ color: 'var(--color-slate-700)', fontSize: '0.875rem' }}>
                          {s.contactPerson || 'Account Desk'}
                        </td>
                        <td>
                          <div style={{ fontSize: '0.85rem' }}>
                            <div style={{ color: 'var(--color-slate-700)' }}>{s.email || '-'}</div>
                            <div style={{ color: 'var(--color-slate-500)', fontSize: '0.75rem' }}>{s.phone || '-'}</div>
                          </div>
                        </td>
                        <td style={{ color: 'var(--color-slate-600)', fontSize: '0.85rem' }}>
                          {s.address || 'Address not registered'}
                        </td>
                        <td>
                          <Badge variant={s.isActive ? 'success' : 'neutral'}>
                            {s.isActive ? 'Active Vendor' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' }}>
                            <Button
                              variant="outline"
                              size="sm"
                              icon={<Eye size={14} />}
                              onClick={() => handleViewSupplierDetails(s)}
                            >
                              Details
                            </Button>
                            {isManagerOrAdmin && (
                              <Button
                                variant="outline"
                                size="sm"
                                icon={<Edit2 size={14} />}
                                onClick={() => handleOpenEditSupplier(s)}
                              >
                                Edit
                              </Button>
                            )}
                            {isAdminOnly && s.isActive && (
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={<Trash2 size={14} color="#ef4444" />}
                                onClick={() => setConfirmDeleteSupplier(s)}
                                title="Deactivate Supplier"
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* ================= MODAL: CREATE PURCHASE ORDER ================= */}
      <Modal
        isOpen={createPoModal}
        onClose={() => setCreatePoModal(false)}
        title="Draft New Purchase Order"
        size="lg"
      >
        <form onSubmit={handleSavePurchaseOrder}>
          {formError && (
            <div className="alert-box error" style={{ marginBottom: '1rem' }}>
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label className="input-label">Supplier Distributor *</label>
              <select
                className="form-control"
                value={poForm.supplierId}
                onChange={(e) => setPoForm({ ...poForm, supplierId: e.target.value })}
                required
              >
                <option value="">Select Supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {!s.isActive ? '(Inactive)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <Input
              type="date"
              label="Order Date *"
              value={poForm.orderDate}
              onChange={(e) => setPoForm({ ...poForm, orderDate: e.target.value })}
              required
            />

            <Input
              type="date"
              label="Expected Delivery"
              value={poForm.expectedDeliveryDate}
              onChange={(e) => setPoForm({ ...poForm, expectedDeliveryDate: e.target.value })}
            />
          </div>

          {/* Line Items */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="input-label" style={{ margin: 0 }}>Medications to Restock *</label>
              <Button
                variant="ghost"
                size="sm"
                icon={<Plus size={14} />}
                type="button"
                onClick={handleAddPoItemLine}
              >
                Add Item Line
              </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {poForm.items.map((item, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'center' }}>
                  <select
                    className="form-control"
                    value={item.productId}
                    onChange={(e) => {
                      const updated = [...poForm.items];
                      const selectedProd = products.find((p) => p.id === Number(e.target.value));
                      updated[idx].productId = e.target.value;
                      if (selectedProd?.sellingPrice) {
                        updated[idx].unitCost = Number((selectedProd.sellingPrice * 0.6).toFixed(2));
                      }
                      setPoForm({ ...poForm, items: updated });
                    }}
                    required
                  >
                    <option value="">Select Medicine</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>

                  <Input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.quantityOrdered}
                    onChange={(e) => {
                      const updated = [...poForm.items];
                      updated[idx].quantityOrdered = e.target.value;
                      setPoForm({ ...poForm, items: updated });
                    }}
                    required
                  />

                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Cost (RS)"
                    value={item.unitCost}
                    onChange={(e) => {
                      const updated = [...poForm.items];
                      updated[idx].unitCost = e.target.value;
                      setPoForm({ ...poForm, items: updated });
                    }}
                    required
                  />

                  {poForm.items.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      icon={<Trash2 size={14} color="#ef4444" />}
                      onClick={() => handleRemovePoItemLine(idx)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <Input
              label="Procurement Instructions / Notes"
              placeholder="e.g. Temperature controlled shipment required..."
              value={poForm.notes}
              onChange={(e) => setPoForm({ ...poForm, notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button
              variant="outline"
              type="button"
              onClick={() => setCreatePoModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="teal"
              type="submit"
              loading={submitting}
            >
              Submit Order
            </Button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: RECEIVE STOCK & VERIFY BATCHES ================= */}
      <Modal
        isOpen={receiveStockModal}
        onClose={() => setReceiveStockModal(false)}
        title={selectedPo ? `Receive Stock: ${selectedPo.poNumber}` : 'Receive Stock'}
        size="lg"
      >
        <form onSubmit={handleSaveReceiveStock}>
          {formError && (
            <div className="alert-box error" style={{ marginBottom: '1rem' }}>
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <p style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)', marginBottom: '1.25rem' }}>
            Verify delivered physical boxes, assign batch/lot numbers, manufacturing and expiry dates to stock items directly into dispensary inventory.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            {receiveForm.items.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--color-slate-50)',
                  border: '1px solid var(--color-slate-200)',
                  borderRadius: '8px',
                  padding: '1rem'
                }}
              >
                <div style={{ fontWeight: 600, color: 'var(--color-slate-800)', marginBottom: '0.75rem' }}>
                  {item.productName || `Product #${item.productId}`}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <Input
                    type="number"
                    min="1"
                    label="Qty Received *"
                    value={item.quantityReceived}
                    onChange={(e) => {
                      const updated = [...receiveForm.items];
                      updated[idx].quantityReceived = e.target.value;
                      setReceiveForm({ items: updated });
                    }}
                    required
                  />

                  <Input
                    label="Batch / Lot Number *"
                    value={item.batchNumber}
                    onChange={(e) => {
                      const updated = [...receiveForm.items];
                      updated[idx].batchNumber = e.target.value;
                      setReceiveForm({ items: updated });
                    }}
                    required
                  />

                  <Input
                    type="date"
                    label="Expiry Date *"
                    value={item.expiryDate}
                    onChange={(e) => {
                      const updated = [...receiveForm.items];
                      updated[idx].expiryDate = e.target.value;
                      setReceiveForm({ items: updated });
                    }}
                    required
                  />

                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    label="Retail Selling Price (RS) *"
                    value={item.sellingPrice}
                    onChange={(e) => {
                      const updated = [...receiveForm.items];
                      updated[idx].sellingPrice = e.target.value;
                      setReceiveForm({ items: updated });
                    }}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <Input
                    type="date"
                    label="Manufacture Date (Optional)"
                    value={item.manufacturingDate}
                    onChange={(e) => {
                      const updated = [...receiveForm.items];
                      updated[idx].manufacturingDate = e.target.value;
                      setReceiveForm({ items: updated });
                    }}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    label="Unit Purchase Cost (RS)"
                    value={item.purchasePrice}
                    onChange={(e) => {
                      const updated = [...receiveForm.items];
                      updated[idx].purchasePrice = e.target.value;
                      setReceiveForm({ items: updated });
                    }}
                    required
                  />
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button
              variant="outline"
              type="button"
              onClick={() => setReceiveStockModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="teal"
              type="submit"
              loading={submitting}
            >
              Confirm & Stock into Inventory
            </Button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: PO DETAILS & STATUS WORKFLOW ================= */}
      <Modal
        isOpen={viewPoModal}
        onClose={() => setViewPoModal(false)}
        title={selectedPo ? `PO Inspection: ${selectedPo.poNumber}` : 'PO Details'}
        size="md"
      >
        {selectedPo && (
          <div>
            <div style={{ padding: '1rem', background: 'var(--color-slate-50)', borderRadius: '8px', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)' }}>Supplier:</span>
                <span style={{ fontWeight: 600, color: 'var(--color-slate-800)' }}>{selectedPo.supplierName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)' }}>Order Date:</span>
                <span style={{ fontSize: '0.85rem' }}>{selectedPo.orderDate}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)' }}>Status:</span>
                {renderPoStatusBadge(selectedPo.status)}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)' }}>Total Value:</span>
                <span style={{ fontWeight: 800, color: 'var(--color-teal-800)' }}>{formatCurrency(selectedPo.totalAmount)}</span>
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>Ordered Products</h4>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Ordered</th>
                      <th>Received</th>
                      <th>Unit Cost</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedPo.items || []).map((it, idx) => (
                      <tr key={idx}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{it.productName}</div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>{it.productSku}</span>
                        </td>
                        <td>{it.quantityOrdered}</td>
                        <td style={{ color: it.quantityReceived >= it.quantityOrdered ? '#059669' : '#d97706', fontWeight: 600 }}>
                          {it.quantityReceived || 0}
                        </td>
                        <td>{formatCurrency(it.unitCost)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(it.totalCost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PO Workflow Transitions */}
            {isManagerOrAdmin && selectedPo.status !== 'RECEIVED' && selectedPo.status !== 'CANCELLED' && (
              <div style={{ padding: '0.75rem', background: 'var(--color-slate-50)', borderRadius: '6px', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-slate-700)', marginBottom: '0.5rem' }}>
                  Update Order Status
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {selectedPo.status === 'SUBMITTED' && (
                    <Button
                      variant="teal"
                      size="sm"
                      onClick={() => handleUpdatePoStatus(selectedPo.id, 'CONFIRMED')}
                      disabled={actionLoading}
                    >
                      Confirm Vendor Acceptance
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setConfirmCancelPo(selectedPo)}
                    disabled={actionLoading}
                  >
                    Cancel Purchase Order
                  </Button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={() => setViewPoModal(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ================= MODAL: SUPPLIER DETAILS ================= */}
      <Modal
        isOpen={viewSupplierModal}
        onClose={() => setViewSupplierModal(false)}
        title={viewingSupplier ? `Vendor Inspection: ${viewingSupplier.name}` : 'Supplier Details'}
        size="lg"
      >
        {viewingSupplier && (
          <div>
            <div style={{ padding: '1rem', background: 'var(--color-slate-50)', borderRadius: '8px', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-slate-900)' }}>{viewingSupplier.name}</h3>
                <Badge variant={viewingSupplier.isActive ? 'success' : 'neutral'}>
                  {viewingSupplier.isActive ? 'Active Vendor' : 'Inactive'}
                </Badge>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: 'var(--color-slate-500)' }}>Representative:</span>{' '}
                  <strong>{viewingSupplier.contactPerson || 'General Desk'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--color-slate-500)' }}>Email:</span>{' '}
                  <strong>{viewingSupplier.email || 'N/A'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--color-slate-500)' }}>Phone:</span>{' '}
                  <strong>{viewingSupplier.phone || 'N/A'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--color-slate-500)' }}>Address:</span>{' '}
                  <strong>{viewingSupplier.address || 'N/A'}</strong>
                </div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Procurement History with this Supplier</h4>
                {isManagerOrAdmin && (
                  <Button
                    variant="teal"
                    size="sm"
                    icon={<Plus size={14} />}
                    onClick={() => {
                      setViewSupplierModal(false);
                      handleOpenCreatePo(viewingSupplier.id);
                    }}
                  >
                    Draft PO for this Vendor
                  </Button>
                )}
              </div>

              {loadingSupplierPOs ? (
                <LoadingSpinner text="Loading supplier orders..." />
              ) : supplierPOs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--color-slate-400)', fontSize: '0.85rem' }}>
                  No past purchase orders found for this vendor.
                </div>
              ) : (
                <div className="table-wrapper" style={{ maxHeight: '240px', overflowY: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>PO #</th>
                        <th>Date</th>
                        <th>Value</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supplierPOs.map((p) => (
                        <tr key={p.id}>
                          <td style={{ fontWeight: 600, color: 'var(--color-teal-700)' }}>{p.poNumber}</td>
                          <td>{p.orderDate}</td>
                          <td style={{ fontWeight: 600 }}>{formatCurrency(p.totalAmount)}</td>
                          <td>{renderPoStatusBadge(p.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <Button variant="outline" onClick={() => setViewSupplierModal(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ================= MODAL: REGISTER / EDIT SUPPLIER ================= */}
      <Modal
        isOpen={supplierModal}
        onClose={() => setSupplierModal(false)}
        title={currentSupplier ? 'Edit Supplier Details' : 'Register New Pharmaceutical Vendor'}
        size="md"
      >
        <form onSubmit={handleSaveSupplier}>
          {formError && (
            <div className="alert-box error" style={{ marginBottom: '1rem' }}>
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <Input
              label="Supplier Company Name *"
              placeholder="e.g. McKesson Supply"
              value={supplierForm.name}
              onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <Input
              label="Contact Representative"
              placeholder="Account Executive"
              value={supplierForm.contactPerson}
              onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
            />
            <Input
              label="Phone Number"
              placeholder="+94 11-XXX-XXXX"
              value={supplierForm.phone}
              onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <Input
              label="Email Address"
              type="email"
              placeholder="orders@supplier.com"
              value={supplierForm.email}
              onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <Input
              label="Warehouse / Hub Address"
              placeholder="No. X, Road Name, City, Sri Lanka"
              value={supplierForm.address}
              onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
            />
          </div>

          {currentSupplier && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <input
                type="checkbox"
                id="supplierActiveCheck"
                checked={supplierForm.isActive}
                onChange={(e) => setSupplierForm({ ...supplierForm, isActive: e.target.checked })}
              />
              <label htmlFor="supplierActiveCheck" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>
                Supplier is Active & Authorized for Orders
              </label>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button
              variant="outline"
              type="button"
              onClick={() => setSupplierModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="teal"
              type="submit"
              loading={submitting}
            >
              Save Supplier
            </Button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: CONFIRM DEACTIVATE SUPPLIER ================= */}
      <ConfirmModal
        isOpen={Boolean(confirmDeleteSupplier)}
        onClose={() => setConfirmDeleteSupplier(null)}
        onConfirm={handleConfirmDeactivateSupplier}
        title="Deactivate Supplier"
        message={
          confirmDeleteSupplier
            ? `Are you sure you want to deactivate "${confirmDeleteSupplier.name}"? Inactive suppliers will be hidden from new purchase orders.`
            : ''
        }
        confirmLabel="Deactivate"
        variant="danger"
        loading={actionLoading}
      />

      {/* ================= MODAL: CONFIRM CANCEL PO ================= */}
      <ConfirmModal
        isOpen={Boolean(confirmCancelPo)}
        onClose={() => setConfirmCancelPo(null)}
        onConfirm={() => handleUpdatePoStatus(confirmCancelPo.id, 'CANCELLED')}
        title="Cancel Purchase Order"
        message={
          confirmCancelPo
            ? `Are you sure you want to cancel purchase order ${confirmCancelPo.poNumber}? Cancelled orders cannot be received into inventory.`
            : ''
        }
        confirmLabel="Cancel Order"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
}
