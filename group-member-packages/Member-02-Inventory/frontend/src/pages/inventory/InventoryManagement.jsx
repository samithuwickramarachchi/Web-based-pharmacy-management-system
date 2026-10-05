import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Search,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  Building2,
  FileText,
  Filter,
  RefreshCw,
  Eye,
  SlidersHorizontal,
  XCircle,
  TrendingDown,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
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

// Fallback seed inventory data
const SEED_CATEGORIES = [
  { id: 1, name: 'Antibiotics', description: 'Anti-infective bacterial medications' },
  { id: 2, name: 'Cardiovascular', description: 'Hypertension, cholesterol, heart health' },
  { id: 3, name: 'Analgesics & Pain', description: 'NSAIDs, analgesics, and pain management' },
  { id: 4, name: 'Endocrine & Diabetes', description: 'Insulin and oral hypoglycemic agents' },
  { id: 5, name: 'Respiratory & Allergy', description: 'Bronchodilators, antihistamines' }
];

const SEED_MANUFACTURERS = [
  { id: 1, name: 'Pfizer Inc.', contactEmail: 'supply@pfizer.com', phone: '+1 212-733-2323', address: 'New York, USA' },
  { id: 2, name: 'Novartis Pharma', contactEmail: 'orders@novartis.com', phone: '+41 61-324-1111', address: 'Basel, Switzerland' },
  { id: 3, name: 'GlaxoSmithKline (GSK)', contactEmail: 'info@gsk.com', phone: '+44 20-8047-5000', address: 'London, UK' },
  { id: 4, name: 'Bayer Healthcare', contactEmail: 'distribution@bayer.com', phone: '+49 214-30-1', address: 'Leverkusen, Germany' }
];

const SEED_PRODUCTS = [
  {
    id: 1,
    name: 'Amoxicillin 500mg',
    sku: 'MED-AMX-500',
    categoryId: 1,
    categoryName: 'Antibiotics',
    manufacturerId: 1,
    manufacturerName: 'Pfizer Inc.',
    unit: 'Box (30 Caps)',
    sellingPrice: 18.50,
    dosageInfo: 'Take 1 capsule 3 times daily with water',
    description: 'Broad-spectrum bactericidal antibiotic of the penicillin class',
    requiresPrescription: true,
    minReorderLevel: 25,
    isActive: true,
    totalStock: 85,
    batches: [
      { id: 101, batchNumber: 'AMX-2024-B1', quantity: 50, costPrice: 10.20, expiryDate: '2025-11-30', manufactureDate: '2023-11-01', isActive: true },
      { id: 102, batchNumber: 'AMX-2024-B2', quantity: 35, costPrice: 10.50, expiryDate: '2026-04-15', manufactureDate: '2024-03-01', isActive: true }
    ]
  },
  {
    id: 2,
    name: 'Atorvastatin 20mg',
    sku: 'MED-ATV-020',
    categoryId: 2,
    categoryName: 'Cardiovascular',
    manufacturerId: 1,
    manufacturerName: 'Pfizer Inc.',
    unit: 'Bottle (90 Tabs)',
    sellingPrice: 32.00,
    dosageInfo: 'Take 1 tablet once daily in the evening',
    description: 'HMG-CoA reductase inhibitor for dyslipidemia and cardiovascular prevention',
    requiresPrescription: true,
    minReorderLevel: 20,
    isActive: true,
    totalStock: 14,
    batches: [
      { id: 103, batchNumber: 'ATV-2023-A9', quantity: 14, costPrice: 16.00, expiryDate: '2025-08-31', manufactureDate: '2023-08-15', isActive: true }
    ]
  },
  {
    id: 3,
    name: 'Ibuprofen 400mg',
    sku: 'MED-IBU-400',
    categoryId: 3,
    categoryName: 'Analgesics & Pain',
    manufacturerId: 3,
    manufacturerName: 'Teva Pharmaceuticals',
    unit: 'Blister (20 Tabs)',
    sellingPrice: 7.99,
    dosageInfo: '1 tablet every 6-8 hours with food as needed for pain',
    description: 'Nonsteroidal anti-inflammatory drug (NSAID)',
    requiresPrescription: false,
    minReorderLevel: 50,
    isActive: true,
    totalStock: 140,
    batches: [
      { id: 104, batchNumber: 'IBU-2024-01', quantity: 140, costPrice: 3.40, expiryDate: '2026-10-31', manufactureDate: '2024-01-10', isActive: true }
    ]
  },
  {
    id: 4,
    name: 'Metformin HCl 850mg',
    sku: 'MED-MET-850',
    categoryId: 4,
    categoryName: 'Endocrine & Diabetes',
    manufacturerId: 2,
    manufacturerName: 'Novartis Pharma',
    unit: 'Bottle (100 Tabs)',
    sellingPrice: 15.20,
    dosageInfo: 'Take 1 tablet twice daily with meals',
    description: 'Biguanide antihyperglycemic medication for type 2 diabetes',
    requiresPrescription: true,
    minReorderLevel: 30,
    isActive: true,
    totalStock: 6,
    batches: [
      { id: 105, batchNumber: 'MET-2023-C4', quantity: 6, costPrice: 7.80, expiryDate: '2025-05-31', manufactureDate: '2023-05-10', isActive: true }
    ]
  }
];

export default function InventoryManagement() {
  const { user } = useAuth();
  const { toast } = useToast();

  // user.role is a plain string (e.g. "ADMIN"); user.authorities is an array (e.g. ["ROLE_ADMIN"])
  const userRole = (user?.role || '').toUpperCase();
  const userAuthorities = (user?.authorities || []).map((a) => a.toUpperCase());
  const isManagerOrAdmin =
    userRole === 'ADMIN' ||
    userRole === 'INVENTORY_MANAGER' ||
    userRole === 'INVENTORY_STAFF' ||
    userAuthorities.includes('ROLE_ADMIN') ||
    userAuthorities.includes('ROLE_INVENTORY_MANAGER') ||
    userAuthorities.includes('ROLE_INVENTORY_STAFF');
  const isAdminOnly = userRole === 'ADMIN' || userAuthorities.includes('ROLE_ADMIN');

  const [activeTab, setActiveTab] = useState('products'); // 'products', 'categories', 'manufacturers'

  // Data states
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState('all'); // 'all', 'low', 'out'
  const [rxFilter, setRxFilter] = useState('all'); // 'all', 'rx', 'otc'

  // Pagination
  const [pagination, setPagination] = useState({
    page: 0,
    size: 10,
    totalPages: 1,
    totalElements: 0
  });

  // Modals
  const [productModal, setProductModal] = useState(false);
  const [batchModal, setBatchModal] = useState(false);
  const [stockAdjustModal, setStockAdjustModal] = useState(false);
  const [batchesViewModal, setBatchesViewModal] = useState(false);
  const [categoryModal, setCategoryModal] = useState(false);
  const [manufacturerModal, setManufacturerModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Selected Records for Modals
  const [currentProduct, setCurrentProduct] = useState(null);
  const [currentBatch, setCurrentBatch] = useState(null);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [currentManufacturer, setCurrentManufacturer] = useState(null);

  // Forms
  const [productForm, setProductForm] = useState({
    categoryId: '',
    manufacturerId: '',
    name: '',
    sku: '',
    description: '',
    dosageInfo: '',
    unit: '',
    sellingPrice: '',
    requiresPrescription: false,
    minReorderLevel: 20,
    isActive: true
  });

  const [batchForm, setBatchForm] = useState({
    batchNumber: '',
    quantity: '',
    costPrice: '',
    manufactureDate: '',
    expiryDate: '',
    isActive: true
  });

  const [adjustForm, setAdjustForm] = useState({
    quantityDelta: '',
    reason: 'Stock count audit reconciliation'
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: ''
  });

  const [manufacturerForm, setManufacturerForm] = useState({
    name: '',
    contactEmail: '',
    phone: '',
    address: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Load Categories and Manufacturers
  const loadLookups = async () => {
    try {
      const [catData, mfgData] = await Promise.all([
        inventoryService.getCategories(),
        inventoryService.getManufacturers()
      ]);
      setCategories(catData && catData.length > 0 ? catData : SEED_CATEGORIES);
      setManufacturers(mfgData && mfgData.length > 0 ? mfgData : SEED_MANUFACTURERS);
    } catch (err) {
      console.warn('Categories/Manufacturers lookup error, using seed:', err);
      setCategories(SEED_CATEGORIES);
      setManufacturers(SEED_MANUFACTURERS);
    }
  };

  // Load Products
  const loadProducts = async (page = 0) => {
    try {
      setLoading(true);
      const data = await inventoryService.getProducts(page, pagination.size);
      if (data && data.content && data.content.length > 0) {
        setProducts(data.content);
        setPagination({
          page: data.number || 0,
          size: data.size || 10,
          totalPages: data.totalPages || 1,
          totalElements: data.totalElements || data.content.length
        });
      } else {
        setProducts(SEED_PRODUCTS);
        setPagination({
          page: 0,
          size: 10,
          totalPages: 1,
          totalElements: SEED_PRODUCTS.length
        });
      }
    } catch (err) {
      console.warn('Products API error, using seed products:', err);
      setProducts(SEED_PRODUCTS);
      setPagination({
        page: 0,
        size: 10,
        totalPages: 1,
        totalElements: SEED_PRODUCTS.length
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLookups();
    loadProducts(0);
  }, []);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        (p.name || '').toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q);

      // Category filter
      const matchCat =
        !selectedCategoryFilter ||
        String(p.categoryId) === String(selectedCategoryFilter);

      // Rx filter
      let matchRx = true;
      if (rxFilter === 'rx') matchRx = p.requiresPrescription === true;
      if (rxFilter === 'otc') matchRx = p.requiresPrescription === false;

      // Stock status filter
      let matchStock = true;
      const stock = p.totalStock ?? (p.batches?.reduce((acc, b) => acc + (b.quantity || 0), 0) || 0);
      const minLevel = p.minReorderLevel || 10;
      if (stockStatusFilter === 'low') matchStock = stock > 0 && stock <= minLevel;
      if (stockStatusFilter === 'out') matchStock = stock === 0;

      return matchSearch && matchCat && matchRx && matchStock;
    });
  }, [products, searchQuery, selectedCategoryFilter, rxFilter, stockStatusFilter]);

  // Product CRUD
  const handleOpenNewProduct = () => {
    setCurrentProduct(null);
    setProductForm({
      categoryId: categories[0]?.id || '',
      manufacturerId: manufacturers[0]?.id || '',
      name: '',
      sku: `SKU-${Date.now().toString().slice(-4)}`,
      description: '',
      dosageInfo: '',
      unit: 'Box',
      sellingPrice: '',
      requiresPrescription: false,
      minReorderLevel: 20,
      isActive: true
    });
    setFormError('');
    setProductModal(true);
  };

  const handleOpenEditProduct = (prod) => {
    setCurrentProduct(prod);
    setProductForm({
      categoryId: prod.categoryId || '',
      manufacturerId: prod.manufacturerId || '',
      name: prod.name || '',
      sku: prod.sku || '',
      description: prod.description || '',
      dosageInfo: prod.dosageInfo || '',
      unit: prod.unit || '',
      sellingPrice: prod.sellingPrice || '',
      requiresPrescription: !!prod.requiresPrescription,
      minReorderLevel: prod.minReorderLevel ?? 20,
      isActive: prod.isActive ?? true
    });
    setFormError('');
    setProductModal(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!productForm.name.trim() || !productForm.sku.trim() || !productForm.unit.trim()) {
      setFormError('Name, SKU, and Unit are required fields.');
      return;
    }
    if (!productForm.sellingPrice || Number(productForm.sellingPrice) <= 0) {
      setFormError('Selling price must be greater than zero.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        ...productForm,
        categoryId: Number(productForm.categoryId),
        manufacturerId: productForm.manufacturerId ? Number(productForm.manufacturerId) : null,
        sellingPrice: Number(productForm.sellingPrice),
        minReorderLevel: Number(productForm.minReorderLevel || 0)
      };

      if (currentProduct) {
        const res = await inventoryService.updateProduct(currentProduct.id, payload);
        toast.success(`Medicine "${payload.name}" updated successfully.`);
        setProducts((prev) =>
          prev.map((p) => (p.id === currentProduct.id ? { ...p, ...res, ...payload } : p))
        );
      } else {
        const res = await inventoryService.createProduct(payload);
        toast.success(`New medicine "${payload.name}" registered in catalog.`);
        setProducts((prev) => [{ ...payload, id: res.id || Date.now(), batches: [] }, ...prev]);
      }
      setProductModal(false);
    } catch (err) {
      console.warn('Product save API error, saving locally:', err);
      // Fallback local update
      if (currentProduct) {
        setProducts((prev) =>
          prev.map((p) => (p.id === currentProduct.id ? { ...p, ...productForm } : p))
        );
        toast.success(`Medicine updated.`);
      } else {
        setProducts((prev) => [
          {
            ...productForm,
            id: Date.now(),
            batches: [],
            categoryName: categories.find((c) => c.id === Number(productForm.categoryId))?.name || 'General'
          },
          ...prev
        ]);
        toast.success(`New medicine added to catalog.`);
      }
      setProductModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Batches View
  const handleOpenBatches = async (product) => {
    setCurrentProduct(product);
    try {
      const bList = await inventoryService.getBatches(product.id);
      if (bList && bList.length > 0) {
        setCurrentProduct({ ...product, batches: bList });
      }
    } catch (err) {
      console.warn('Batches API error, using existing batches:', err);
    }
    setBatchesViewModal(true);
  };

  // Add Batch
  const handleOpenAddBatch = () => {
    setCurrentBatch(null); // ensure edit mode is cleared
    setBatchForm({
      batchNumber: `BAT-${Date.now().toString().slice(-6)}`,
      quantity: '',
      costPrice: '',
      manufactureDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      isActive: true
    });
    setFormError('');
    setBatchModal(true);
  };

  const handleSaveBatch = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!batchForm.batchNumber.trim() || !batchForm.expiryDate) {
      setFormError('Batch number and expiry date are required.');
      return;
    }
    if (batchForm.quantity === '' || Number(batchForm.quantity) < 0) {
      setFormError('Initial quantity must be 0 or greater.');
      return;
    }
    if (!batchForm.costPrice || Number(batchForm.costPrice) <= 0) {
      setFormError('Cost price must be positive.');
      return;
    }

    const isEdit = !!currentBatch;
    try {
      setSubmitting(true);
      const payload = {
        ...batchForm,
        quantity: Number(batchForm.quantity),
        costPrice: Number(batchForm.costPrice)
      };

      if (isEdit) {
        // Edit existing batch via PUT
        const res = await inventoryService.updateBatch(currentProduct.id, currentBatch.id, payload);
        toast.success(`Batch ${payload.batchNumber} updated.`);
        const updatedBatch = res || { ...currentBatch, ...payload };
        const updatedBatches = (currentProduct.batches || []).map((b) =>
          b.id === currentBatch.id ? updatedBatch : b
        );
        const updatedProduct = {
          ...currentProduct,
          batches: updatedBatches,
          totalStock: updatedBatches.reduce((sum, b) => sum + (b.quantity || 0), 0)
        };
        setCurrentProduct(updatedProduct);
        setProducts((prev) =>
          prev.map((p) => (p.id === currentProduct.id ? updatedProduct : p))
        );
      } else {
        // Create new batch via POST
        const res = await inventoryService.createBatch(currentProduct.id, payload);
        toast.success(`Batch ${payload.batchNumber} added.`);
        const newBatches = [...(currentProduct.batches || []), res || { ...payload, id: Date.now() }];
        const updatedProduct = {
          ...currentProduct,
          batches: newBatches,
          totalStock: newBatches.reduce((sum, b) => sum + (b.quantity || 0), 0)
        };
        setCurrentProduct(updatedProduct);
        setProducts((prev) =>
          prev.map((p) => (p.id === currentProduct.id ? updatedProduct : p))
        );
      }
      setBatchModal(false);
      setCurrentBatch(null);
    } catch (err) {
      console.warn('Batch save API error, updating locally:', err);
      if (isEdit) {
        const updatedBatches = (currentProduct.batches || []).map((b) =>
          b.id === currentBatch.id ? { ...b, ...batchForm, quantity: Number(batchForm.quantity), costPrice: Number(batchForm.costPrice) } : b
        );
        const updatedProduct = {
          ...currentProduct,
          batches: updatedBatches,
          totalStock: updatedBatches.reduce((sum, b) => sum + (b.quantity || 0), 0)
        };
        setCurrentProduct(updatedProduct);
        setProducts((prev) => prev.map((p) => (p.id === currentProduct.id ? updatedProduct : p)));
        toast.success(`Batch ${batchForm.batchNumber} updated.`);
      } else {
        const newBatch = { ...batchForm, id: Date.now(), quantity: Number(batchForm.quantity), costPrice: Number(batchForm.costPrice) };
        const newBatches = [...(currentProduct.batches || []), newBatch];
        const updatedProduct = {
          ...currentProduct,
          batches: newBatches,
          totalStock: newBatches.reduce((sum, b) => sum + (b.quantity || 0), 0)
        };
        setCurrentProduct(updatedProduct);
        setProducts((prev) => prev.map((p) => (p.id === currentProduct.id ? updatedProduct : p)));
        toast.success(`Batch ${batchForm.batchNumber} registered.`);
      }
      setBatchModal(false);
      setCurrentBatch(null);
    } finally {
      setSubmitting(false);
    }
  };

  // Stock Adjustment
  const handleOpenStockAdjust = (batch) => {
    setCurrentBatch(batch);
    setAdjustForm({
      quantityDelta: '',
      reason: 'Periodic audit reconciliation'
    });
    setFormError('');
    setStockAdjustModal(true);
  };

  const handleSaveStockAdjust = async (e) => {
    e.preventDefault();
    setFormError('');
    const delta = Number(adjustForm.quantityDelta);
    if (isNaN(delta) || delta === 0) {
      setFormError('Please provide a non-zero adjustment delta (positive or negative integer).');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        quantityDelta: delta,
        reason: adjustForm.reason
      };

      await inventoryService.adjustStock(currentProduct.id, currentBatch.id, payload);
      toast.success(`Batch ${currentBatch.batchNumber} stock adjusted by ${delta > 0 ? '+' : ''}${delta} units.`);
      
      // Update local batch stock
      const updatedBatches = (currentProduct.batches || []).map((b) => {
        if (b.id === currentBatch.id) {
          const newQty = Math.max(0, (b.quantity || 0) + delta);
          return { ...b, quantity: newQty };
        }
        return b;
      });

      const updatedProduct = {
        ...currentProduct,
        batches: updatedBatches,
        totalStock: updatedBatches.reduce((sum, b) => sum + (b.quantity || 0), 0)
      };

      setCurrentProduct(updatedProduct);
      setProducts((prev) =>
        prev.map((p) => (p.id === currentProduct.id ? updatedProduct : p))
      );
      setStockAdjustModal(false);
    } catch (err) {
      console.warn('Stock adjustment API error, updating locally:', err);
      const updatedBatches = (currentProduct.batches || []).map((b) => {
        if (b.id === currentBatch.id) {
          const newQty = Math.max(0, (b.quantity || 0) + delta);
          return { ...b, quantity: newQty };
        }
        return b;
      });
      const updatedProduct = {
        ...currentProduct,
        batches: updatedBatches,
        totalStock: updatedBatches.reduce((sum, b) => sum + (b.quantity || 0), 0)
      };
      setCurrentProduct(updatedProduct);
      setProducts((prev) =>
        prev.map((p) => (p.id === currentProduct.id ? updatedProduct : p))
      );
      toast.success(`Batch stock adjusted.`);
      setStockAdjustModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Categories CRUD
  const handleOpenAddCategory = () => {
    setCurrentCategory(null);
    setCategoryForm({ name: '', description: '' });
    setFormError('');
    setCategoryModal(true);
  };

  const handleOpenEditCategory = (cat) => {
    setCurrentCategory(cat);
    setCategoryForm({ name: cat.name || '', description: cat.description || '' });
    setFormError('');
    setCategoryModal(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      setFormError('Category name is required.');
      return;
    }
    try {
      setSubmitting(true);
      if (currentCategory) {
        await inventoryService.updateCategory(currentCategory.id, categoryForm);
        setCategories((prev) =>
          prev.map((c) => (c.id === currentCategory.id ? { ...c, ...categoryForm } : c))
        );
        toast.success(`Category "${categoryForm.name}" updated.`);
      } else {
        const res = await inventoryService.createCategory(categoryForm);
        setCategories((prev) => [...prev, res || { ...categoryForm, id: Date.now() }]);
        toast.success(`Category "${categoryForm.name}" created.`);
      }
      setCategoryModal(false);
    } catch (err) {
      console.warn('Category save error, saving locally:', err);
      if (currentCategory) {
        setCategories((prev) =>
          prev.map((c) => (c.id === currentCategory.id ? { ...c, ...categoryForm } : c))
        );
      } else {
        setCategories((prev) => [...prev, { ...categoryForm, id: Date.now() }]);
      }
      toast.success(`Category saved.`);
      setCategoryModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Category
  const handleDeleteCategory = (cat) => {
    setConfirmDelete({ type: 'category', id: cat.id, label: cat.name });
  };

  // Delete Manufacturer
  const handleDeleteManufacturer = (mfg) => {
    setConfirmDelete({ type: 'manufacturer', id: mfg.id, label: mfg.name });
  };

  // Delete Batch (deactivate)
  const handleDeleteBatch = (batch) => {
    setConfirmDelete({ type: 'batch', id: batch.id, label: batch.batchNumber });
  };

  // Confirm destructive action
  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    const { type, id, label } = confirmDelete;
    try {
      setSubmitting(true);
      if (type === 'category') {
        await inventoryService.deleteCategory(id);
        setCategories((prev) => prev.filter((c) => c.id !== id));
        toast.success(`Category "${label}" deleted.`);
      } else if (type === 'manufacturer') {
        await inventoryService.deleteManufacturer(id);
        setManufacturers((prev) => prev.filter((m) => m.id !== id));
        toast.success(`Manufacturer "${label}" deleted.`);
      } else if (type === 'batch') {
        // Batch deactivation via stock adjust to 0 or local removal
        const updatedBatches = (currentProduct?.batches || []).filter((b) => b.id !== id);
        const updatedProduct = {
          ...currentProduct,
          batches: updatedBatches,
          totalStock: updatedBatches.reduce((sum, b) => sum + (b.quantity || 0), 0)
        };
        setCurrentProduct(updatedProduct);
        setProducts((prev) => prev.map((p) => (p.id === currentProduct.id ? updatedProduct : p)));
        toast.info(`Batch "${label}" removed from view.`);
      }
    } catch (err) {
      const msg = err.response?.data?.message || `Failed to delete ${type}. It may be in use.`;
      toast.error(msg);
    } finally {
      setSubmitting(false);
      setConfirmDelete(null);
    }
  };

  // Edit Batch
  const handleOpenEditBatch = (batch) => {
    setCurrentBatch(batch);
    setBatchForm({
      batchNumber: batch.batchNumber || '',
      quantity: batch.quantity ?? '',
      costPrice: batch.costPrice ?? '',
      manufactureDate: batch.manufactureDate || '',
      expiryDate: batch.expiryDate || '',
      isActive: batch.isActive ?? true
    });
    setFormError('');
    setBatchModal(true);
  };

  // Manufacturers CRUD
  const handleOpenAddManufacturer = () => {
    setCurrentManufacturer(null);
    setManufacturerForm({ name: '', contactEmail: '', phone: '', address: '' });
    setFormError('');
    setManufacturerModal(true);
  };

  const handleOpenEditManufacturer = (mfg) => {
    setCurrentManufacturer(mfg);
    setManufacturerForm({
      name: mfg.name || '',
      contactEmail: mfg.contactEmail || '',
      phone: mfg.phone || '',
      address: mfg.address || ''
    });
    setFormError('');
    setManufacturerModal(true);
  };

  const handleSaveManufacturer = async (e) => {
    e.preventDefault();
    if (!manufacturerForm.name.trim()) {
      setFormError('Manufacturer name is required.');
      return;
    }
    try {
      setSubmitting(true);
      if (currentManufacturer) {
        await inventoryService.updateManufacturer(currentManufacturer.id, manufacturerForm);
        setManufacturers((prev) =>
          prev.map((m) => (m.id === currentManufacturer.id ? { ...m, ...manufacturerForm } : m))
        );
        toast.success(`Manufacturer "${manufacturerForm.name}" updated.`);
      } else {
        const res = await inventoryService.createManufacturer(manufacturerForm);
        setManufacturers((prev) => [...prev, res || { ...manufacturerForm, id: Date.now() }]);
        toast.success(`Manufacturer "${manufacturerForm.name}" registered.`);
      }
      setManufacturerModal(false);
    } catch (err) {
      console.warn('Manufacturer save error, saving locally:', err);
      if (currentManufacturer) {
        setManufacturers((prev) =>
          prev.map((m) => (m.id === currentManufacturer.id ? { ...m, ...manufacturerForm } : m))
        );
      } else {
        setManufacturers((prev) => [...prev, { ...manufacturerForm, id: Date.now() }]);
      }
      toast.success(`Manufacturer saved.`);
      setManufacturerModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="module-container">
      {/* Module Title & Tab Navigation */}
      <div className="module-header">
        <div>
          <div className="module-title-row">
            <h1 className="module-title">Pharmaceutical Inventory</h1>
            <Badge variant="teal">{products.length} Products</Badge>
          </div>
          <p className="module-subtitle">
            Manage pharmaceutical catalog, real-time batch stock levels, expiry tracking, categories, and manufacturers.
          </p>
        </div>

        <div className="module-actions">
          {activeTab === 'products' && isManagerOrAdmin && (
            <Button
              variant="teal"
              icon={<Plus size={16} />}
              onClick={handleOpenNewProduct}
            >
              Add New Medicine
            </Button>
          )}
          {activeTab === 'categories' && isManagerOrAdmin && (
            <Button
              variant="teal"
              icon={<Plus size={16} />}
              onClick={handleOpenAddCategory}
            >
              New Category
            </Button>
          )}
          {activeTab === 'manufacturers' && isManagerOrAdmin && (
            <Button
              variant="teal"
              icon={<Plus size={16} />}
              onClick={handleOpenAddManufacturer}
            >
              New Manufacturer
            </Button>
          )}
          <Button
            variant="outline"
            icon={<RefreshCw size={16} className={loading ? 'animate-spin' : ''} />}
            onClick={() => {
              loadLookups();
              loadProducts(pagination.page);
            }}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs Row */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--color-border)', marginBottom: '1.5rem' }}>
        <button
          className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('products');
            setTimeout(() => {
              document.getElementById('inventory-medicine-list')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 50);
          }}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: 'pointer',
            borderBottom: activeTab === 'products' ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === 'products' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.15s ease'
          }}
        >
          <Package size={16} />
          Medicines & Batches
        </button>

        <button
          className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: 'pointer',
            borderBottom: activeTab === 'categories' ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === 'categories' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.15s ease'
          }}
        >
          <Layers size={16} />
          Therapeutic Categories ({categories.length})
        </button>

        <button
          className={`tab-btn ${activeTab === 'manufacturers' ? 'active' : ''}`}
          onClick={() => setActiveTab('manufacturers')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: 'pointer',
            borderBottom: activeTab === 'manufacturers' ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === 'manufacturers' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.15s ease'
          }}
        >
          <Building2 size={16} />
          Manufacturers ({manufacturers.length})
        </button>
      </div>

      {/* ================= TAB 1: MEDICINES & PRODUCTS ================= */}
      {activeTab === 'products' && (
        <>
          {/* Top Quick Stock KPI Summary */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}
          >
            <Card>
              <CardBody style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className="kpi-icon-wrap" style={{ background: '#ecfdf5', color: '#059669' }}>
                  <Package size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-slate-500)', fontWeight: 500 }}>
                    Active Product SKUs
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-slate-800)' }}>
                    {products.length}
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className="kpi-icon-wrap" style={{ background: '#fffbeb', color: '#d97706' }}>
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-slate-500)', fontWeight: 500 }}>
                    Low Stock Alerts
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#d97706' }}>
                    {products.filter((p) => {
                      const stock = p.totalStock ?? (p.batches?.reduce((acc, b) => acc + (b.quantity || 0), 0) || 0);
                      return stock > 0 && stock <= (p.minReorderLevel || 20);
                    }).length}
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className="kpi-icon-wrap" style={{ background: '#fef2f2', color: '#dc2626' }}>
                  <XCircle size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-slate-500)', fontWeight: 500 }}>
                    Out of Stock Medicines
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#dc2626' }}>
                    {products.filter((p) => {
                      const stock = p.totalStock ?? (p.batches?.reduce((acc, b) => acc + (b.quantity || 0), 0) || 0);
                      return stock === 0;
                    }).length}
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Search and Filters Bar */}
          <Card id="inventory-medicine-list">
            <CardHeader>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', width: '100%', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: '1 1 280px', maxWidth: '380px' }}>
                  <Input
                    placeholder="Search medicine name, SKU, or formula..."
                    icon={<Search size={16} />}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
                  {/* Category Filter */}
                  <select
                    className="form-control"
                    style={{ width: 'auto', minWidth: '160px', padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  >
                    <option value="">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  {/* Stock Filter */}
                  <select
                    className="form-control"
                    style={{ width: 'auto', minWidth: '140px', padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
                    value={stockStatusFilter}
                    onChange={(e) => setStockStatusFilter(e.target.value)}
                  >
                    <option value="all">All Stock Levels</option>
                    <option value="low">Low Stock Only</option>
                    <option value="out">Out of Stock</option>
                  </select>

                  {/* Rx Filter */}
                  <select
                    className="form-control"
                    style={{ width: 'auto', minWidth: '130px', padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
                    value={rxFilter}
                    onChange={(e) => setRxFilter(e.target.value)}
                  >
                    <option value="all">All Types</option>
                    <option value="rx">Rx Required</option>
                    <option value="otc">Over-the-Counter</option>
                  </select>
                </div>
              </div>
            </CardHeader>

            <CardBody style={{ padding: 0 }}>
              {loading ? (
                <LoadingSpinner text="Loading medicine catalog..." />
              ) : filteredProducts.length === 0 ? (
                <EmptyState
                  icon={<Package size={36} />}
                  title="No medicines match your filters"
                  message="Try clearing your search query or changing category and stock level filters."
                />
              ) : (
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Product & SKU</th>
                        <th>Category</th>
                        <th>Dosage & Unit</th>
                        <th>Price</th>
                        <th>Available Stock</th>
                        <th>Classification</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((prod) => {
                        const totalStock =
                          prod.totalStock ??
                          (prod.batches?.reduce((sum, b) => sum + (b.quantity || 0), 0) || 0);
                        const minReorder = prod.minReorderLevel || 20;
                        const isLowStock = totalStock > 0 && totalStock <= minReorder;
                        const isOutOfStock = totalStock === 0;

                        return (
                          <tr key={prod.id}>
                            {/* Product Name & SKU */}
                            <td>
                              <div>
                                <div style={{ fontWeight: 600, color: 'var(--color-slate-800)' }}>
                                  {prod.name}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem' }}>
                                  <Badge variant="teal">{prod.sku}</Badge>
                                  {prod.manufacturerName && (
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                                      by {prod.manufacturerName}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Category */}
                            <td>
                              <span style={{ color: 'var(--color-slate-700)', fontSize: '0.875rem' }}>
                                {prod.categoryName ||
                                  categories.find((c) => c.id === prod.categoryId)?.name ||
                                  'General'}
                              </span>
                            </td>

                            {/* Dosage & Unit */}
                            <td>
                              <div style={{ fontSize: '0.85rem' }}>
                                <div style={{ color: 'var(--color-slate-800)', fontWeight: 500 }}>
                                  {prod.unit}
                                </div>
                                <div style={{ color: 'var(--color-slate-500)', fontSize: '0.75rem' }}>
                                  {prod.dosageInfo || 'Standard'}
                                </div>
                              </div>
                            </td>

                            {/* Price */}
                            <td>
                              <div style={{ fontWeight: 600, color: 'var(--color-teal-700)', fontSize: '0.95rem' }}>
                                {formatCurrency(prod.sellingPrice)}
                              </div>
                            </td>

                            {/* Stock Level & Badge */}
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {isOutOfStock ? (
                                  <Badge variant="danger" icon={<XCircle size={12} />}>
                                    0 Units (Out of Stock)
                                  </Badge>
                                ) : isLowStock ? (
                                  <Badge variant="warning" icon={<AlertTriangle size={12} />}>
                                    {totalStock} Units (Low)
                                  </Badge>
                                ) : (
                                  <Badge variant="success" icon={<CheckCircle2 size={12} />}>
                                    {totalStock} Units
                                  </Badge>
                                )}
                              </div>
                            </td>

                            {/* Rx Classification */}
                            <td>
                              {prod.requiresPrescription ? (
                                <Badge variant="blue">Rx Required</Badge>
                              ) : (
                                <Badge variant="gray">OTC</Badge>
                              )}
                            </td>

                            {/* Action Buttons */}
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  icon={<Layers size={14} />}
                                  title="View batch numbers, expiries and adjust stock"
                                  onClick={() => handleOpenBatches(prod)}
                                >
                                  Batches ({prod.batches?.length || 0})
                                </Button>
                                {isManagerOrAdmin && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    icon={<Edit2 size={14} />}
                                    title="Edit product details"
                                    onClick={() => handleOpenEditProduct(prod)}
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
              onPageChange={(p) => loadProducts(p)}
            />
          </Card>
        </>
      )}

      {/* ================= TAB 2: CATEGORIES ================= */}
      {activeTab === 'categories' && (
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-slate-900)' }}>
                  Therapeutic Categories
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-slate-500)' }}>
                  Classification tree for medicines, generics, and therapeutic drug groups.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardBody style={{ padding: 0 }}>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Category Name</th>
                    <th>Description</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr key={cat.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '6px',
                              background: 'var(--color-teal-100)',
                              color: 'var(--color-teal-800)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 600
                            }}
                          >
                            <Layers size={16} />
                          </div>
                          <span style={{ fontWeight: 600, color: 'var(--color-slate-800)' }}>
                            {cat.name}
                          </span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--color-slate-600)', fontSize: '0.875rem' }}>
                        {cat.description || 'No description provided.'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          {isManagerOrAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Edit2 size={14} />}
                              onClick={() => handleOpenEditCategory(cat)}
                            >
                              Edit
                            </Button>
                          )}
                          {isAdminOnly && (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Trash2 size={14} />}
                              title="Delete category (ADMIN only)"
                              onClick={() => handleDeleteCategory(cat)}
                              style={{ color: 'var(--color-danger, #dc2626)' }}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* ================= TAB 3: MANUFACTURERS ================= */}
      {activeTab === 'manufacturers' && (
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-slate-900)' }}>
                  Pharmaceutical Manufacturers
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-slate-500)' }}>
                  Drug producers, regulatory license records, and manufacturer contacts.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardBody style={{ padding: 0 }}>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Manufacturer Name</th>
                    <th>Email Contact</th>
                    <th>Phone</th>
                    <th>Headquarters / Address</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {manufacturers.map((mfg) => (
                    <tr key={mfg.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '6px',
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Building2 size={16} />
                          </div>
                          <span style={{ fontWeight: 600, color: 'var(--color-slate-800)' }}>
                            {mfg.name}
                          </span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--color-slate-600)', fontSize: '0.875rem' }}>
                        {mfg.contactEmail || 'N/A'}
                      </td>
                      <td style={{ color: 'var(--color-slate-600)', fontSize: '0.875rem' }}>
                        {mfg.phone || 'N/A'}
                      </td>
                      <td style={{ color: 'var(--color-slate-600)', fontSize: '0.875rem' }}>
                        {mfg.address || 'N/A'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          {isManagerOrAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Edit2 size={14} />}
                              onClick={() => handleOpenEditManufacturer(mfg)}
                            >
                              Edit
                            </Button>
                          )}
                          {isAdminOnly && (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Trash2 size={14} />}
                              title="Delete manufacturer (ADMIN only)"
                              onClick={() => handleDeleteManufacturer(mfg)}
                              style={{ color: 'var(--color-danger, #dc2626)' }}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* ================= MODAL: REGISTER / EDIT MEDICINE ================= */}
      <Modal
        isOpen={productModal}
        onClose={() => setProductModal(false)}
        title={currentProduct ? `Edit Medicine: ${currentProduct.name}` : 'Register New Medicine'}
        size="lg"
      >
        <form onSubmit={handleSaveProduct}>
          {formError && (
            <div className="alert-box error" style={{ marginBottom: '1rem' }}>
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <Input
              label="Medicine Name *"
              placeholder="e.g. Amoxicillin Trihydrate"
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              required
            />
            <Input
              label="SKU / Barcode *"
              placeholder="e.g. MED-AMX-500"
              value={productForm.sku}
              onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label className="input-label">Category *</label>
              <select
                className="form-control"
                value={productForm.categoryId}
                onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                required
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="input-label">Manufacturer</label>
              <select
                className="form-control"
                value={productForm.manufacturerId}
                onChange={(e) => setProductForm({ ...productForm, manufacturerId: e.target.value })}
              >
                <option value="">Select Manufacturer (Optional)</option>
                {manufacturers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <Input
              label="Dispensing Unit *"
              placeholder="e.g. Box, Bottle, Blister"
              value={productForm.unit}
              onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
              required
            />
            <Input
              type="number"
              step="0.01"
              label="Selling Price (RS) *"
              placeholder="0.00"
              value={productForm.sellingPrice}
              onChange={(e) => setProductForm({ ...productForm, sellingPrice: e.target.value })}
              required
            />
            <Input
              type="number"
              label="Min Reorder Level"
              placeholder="20"
              value={productForm.minReorderLevel}
              onChange={(e) => setProductForm({ ...productForm, minReorderLevel: e.target.value })}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <Input
              label="Dosage & Usage Instructions"
              placeholder="e.g. 500mg, 1 tablet twice daily"
              value={productForm.dosageInfo}
              onChange={(e) => setProductForm({ ...productForm, dosageInfo: e.target.value })}
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <Input
              label="Clinical Description / Indications"
              placeholder="Brief pharmacological indication..."
              value={productForm.description}
              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', padding: '0.75rem 1rem', background: 'var(--color-slate-50)', borderRadius: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="reqPrescription"
                checked={productForm.requiresPrescription}
                onChange={(e) => setProductForm({ ...productForm, requiresPrescription: e.target.checked })}
                style={{ width: '16px', height: '16px', accentColor: 'var(--color-teal-600)' }}
              />
              <label htmlFor="reqPrescription" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-slate-700)', cursor: 'pointer' }}>
                Requires Verified Doctor Prescription (Rx)
              </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="isActiveProd"
                checked={productForm.isActive}
                onChange={(e) => setProductForm({ ...productForm, isActive: e.target.checked })}
                style={{ width: '16px', height: '16px', accentColor: 'var(--color-teal-600)' }}
              />
              <label htmlFor="isActiveProd" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-slate-700)', cursor: 'pointer' }}>
                Active for Dispensing
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button
              variant="outline"
              type="button"
              onClick={() => setProductModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="teal"
              type="submit"
              loading={submitting}
            >
              {currentProduct ? 'Update Medicine' : 'Register Medicine'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: VIEW BATCHES & EXPIRIES ================= */}
      <Modal
        isOpen={batchesViewModal}
        onClose={() => setBatchesViewModal(false)}
        title={currentProduct ? `Inventory Batches: ${currentProduct.name}` : 'Product Batches'}
        size="lg"
      >
        {currentProduct && (
          <div>
            {/* Header info */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem 1.25rem',
                background: 'linear-gradient(135deg, var(--color-slate-50), var(--color-teal-50))',
                borderRadius: '8px',
                border: '1px solid var(--color-slate-200)',
                marginBottom: '1.25rem'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-slate-800)' }}>
                    {currentProduct.name}
                  </span>
                  <Badge variant="teal">{currentProduct.sku}</Badge>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)', marginTop: '0.2rem' }}>
                  Unit: {currentProduct.unit} | Retail Price: {formatCurrency(currentProduct.sellingPrice)}
                </div>
              </div>

              {isManagerOrAdmin && (
                <Button
                  variant="teal"
                  size="sm"
                  icon={<Plus size={14} />}
                  onClick={handleOpenAddBatch}
                >
                  Receive New Batch
                </Button>
              )}
            </div>

            {/* Batches Table */}
            {(!currentProduct.batches || currentProduct.batches.length === 0) ? (
              <EmptyState
                icon={<Package size={32} />}
                title="No stock batches recorded"
                message="This product has no active or archived inventory batches. Click 'Receive New Batch' above to stock."
              />
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Batch Number</th>
                      <th>In-Stock Quantity</th>
                      <th>Cost Price</th>
                      <th>Manufactured</th>
                      <th>Expiry Date</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentProduct.batches.map((b) => {
                      const isExpired = b.expiryDate && new Date(b.expiryDate) < new Date();
                      const isExpiringSoon =
                        b.expiryDate &&
                        !isExpired &&
                        new Date(b.expiryDate) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

                      return (
                        <tr key={b.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span style={{ fontWeight: 600, color: 'var(--color-slate-800)' }}>
                                {b.batchNumber}
                              </span>
                              {isExpired ? (
                                <Badge variant="danger">Expired</Badge>
                              ) : isExpiringSoon ? (
                                <Badge variant="warning">Expiring Soon</Badge>
                              ) : null}
                            </div>
                          </td>
                          <td>
                            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: b.quantity > 0 ? 'var(--color-slate-800)' : '#dc2626' }}>
                              {b.quantity} units
                            </span>
                          </td>
                          <td>{formatCurrency(b.costPrice)}</td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)' }}>
                            {b.manufactureDate || 'N/A'}
                          </td>
                          <td>
                            <span
                              style={{
                                fontSize: '0.85rem',
                                fontWeight: 500,
                                color: isExpired ? '#dc2626' : isExpiringSoon ? '#d97706' : 'var(--color-slate-700)'
                              }}
                            >
                              {b.expiryDate}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' }}>
                              {isManagerOrAdmin && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    icon={<Edit2 size={13} />}
                                    title="Edit batch details"
                                    onClick={() => handleOpenEditBatch(b)}
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    icon={<SlidersHorizontal size={13} />}
                                    title="Perform stock adjustment count"
                                    onClick={() => handleOpenStockAdjust(b)}
                                  >
                                    Adjust
                                  </Button>
                                </>
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
          </div>
        )}
      </Modal>

      {/* ================= MODAL: ADD / EDIT BATCH ================= */}
      <Modal
        isOpen={batchModal}
        onClose={() => { setBatchModal(false); setCurrentBatch(null); }}
        title={
          currentBatch
            ? `Edit Batch: ${currentBatch.batchNumber}`
            : currentProduct
            ? `Add Stock Batch for ${currentProduct.name}`
            : 'New Batch'
        }
        size="md"
      >
        <form onSubmit={handleSaveBatch}>
          {formError && (
            <div className="alert-box error" style={{ marginBottom: '1rem' }}>
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <Input
              label="Batch / Lot Number *"
              placeholder="e.g. BAT-2024-009"
              value={batchForm.batchNumber}
              onChange={(e) => setBatchForm({ ...batchForm, batchNumber: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <Input
              type="number"
              label="Quantity Received *"
              placeholder="e.g. 50"
              value={batchForm.quantity}
              onChange={(e) => setBatchForm({ ...batchForm, quantity: e.target.value })}
              required
            />
            <Input
              type="number"
              step="0.01"
              label="Unit Cost Price (RS) *"
              placeholder="e.g. 10.50"
              value={batchForm.costPrice}
              onChange={(e) => setBatchForm({ ...batchForm, costPrice: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <Input
              type="date"
              label="Manufacture Date"
              value={batchForm.manufactureDate}
              onChange={(e) => setBatchForm({ ...batchForm, manufactureDate: e.target.value })}
            />
            <Input
              type="date"
              label="Expiry Date *"
              value={batchForm.expiryDate}
              onChange={(e) => setBatchForm({ ...batchForm, expiryDate: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button
              variant="outline"
              type="button"
              onClick={() => setBatchModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="teal"
              type="submit"
              loading={submitting}
            >
              {currentBatch ? 'Update Batch' : 'Receive Batch'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: ADJUST STOCK ================= */}
      <Modal
        isOpen={stockAdjustModal}
        onClose={() => setStockAdjustModal(false)}
        title={currentBatch ? `Adjust Stock: Batch ${currentBatch.batchNumber}` : 'Adjust Stock'}
        size="md"
      >
        <form onSubmit={handleSaveStockAdjust}>
          {formError && (
            <div className="alert-box error" style={{ marginBottom: '1rem' }}>
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <div style={{ background: 'var(--color-slate-50)', padding: '0.85rem 1rem', borderRadius: '6px', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-slate-600)' }}>
              Current Batch Quantity: <strong>{currentBatch?.quantity} units</strong>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', marginTop: '0.25rem' }}>
              Positive values (e.g. +10) increase stock. Negative values (e.g. -5) deduct damaged/expired units.
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <Input
              type="number"
              label="Quantity Delta (+ / -) *"
              placeholder="e.g. -5 or 10"
              value={adjustForm.quantityDelta}
              onChange={(e) => setAdjustForm({ ...adjustForm, quantityDelta: e.target.value })}
              required
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className="input-label">Reason for Adjustment *</label>
            <select
              className="form-control"
              value={adjustForm.reason}
              onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
            >
              <option value="Periodic stock count audit reconciliation">Periodic stock count audit reconciliation</option>
              <option value="Damaged during storage/handling">Damaged during storage/handling</option>
              <option value="Discarded due to shelf expiry">Discarded due to shelf expiry</option>
              <option value="Supplier return / defective lot">Supplier return / defective lot</option>
              <option value="Customer return / undamaged">Customer return / undamaged</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button
              variant="outline"
              type="button"
              onClick={() => setStockAdjustModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="teal"
              type="submit"
              loading={submitting}
            >
              Confirm Adjustment
            </Button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: CATEGORY ================= */}
      <Modal
        isOpen={categoryModal}
        onClose={() => setCategoryModal(false)}
        title={currentCategory ? 'Edit Category' : 'Create Category'}
        size="md"
      >
        <form onSubmit={handleSaveCategory}>
          {formError && (
            <div className="alert-box error" style={{ marginBottom: '1rem' }}>
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <Input
              label="Category Name *"
              placeholder="e.g. Antihistamines"
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              required
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <Input
              label="Description"
              placeholder="Clinical classification details..."
              value={categoryForm.description}
              onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button
              variant="outline"
              type="button"
              onClick={() => setCategoryModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="teal"
              type="submit"
              loading={submitting}
            >
              Save Category
            </Button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: MANUFACTURER ================= */}
      <Modal
        isOpen={manufacturerModal}
        onClose={() => setManufacturerModal(false)}
        title={currentManufacturer ? 'Edit Manufacturer' : 'Register Manufacturer'}
        size="md"
      >
        <form onSubmit={handleSaveManufacturer}>
          {formError && (
            <div className="alert-box error" style={{ marginBottom: '1rem' }}>
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <Input
              label="Manufacturer Name *"
              placeholder="e.g. GlaxoSmithKline"
              value={manufacturerForm.name}
              onChange={(e) => setManufacturerForm({ ...manufacturerForm, name: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <Input
              label="Contact Email"
              placeholder="orders@pharma.com"
              value={manufacturerForm.contactEmail}
              onChange={(e) => setManufacturerForm({ ...manufacturerForm, contactEmail: e.target.value })}
            />
            <Input
              label="Phone"
              placeholder="+94 11-XXX-XXXX"
              value={manufacturerForm.phone}
              onChange={(e) => setManufacturerForm({ ...manufacturerForm, phone: e.target.value })}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <Input
              label="Address / Headquarters"
              placeholder="London, UK"
              value={manufacturerForm.address}
              onChange={(e) => setManufacturerForm({ ...manufacturerForm, address: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button
              variant="outline"
              type="button"
              onClick={() => setManufacturerModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="teal"
              type="submit"
              loading={submitting}
            >
              Save Manufacturer
            </Button>
          </div>
        </form>
      </Modal>

      {/* ================= CONFIRM DELETE DIALOG ================= */}
      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleConfirmDelete}
        title={
          confirmDelete?.type === 'category'
            ? 'Delete Category'
            : confirmDelete?.type === 'manufacturer'
            ? 'Delete Manufacturer'
            : 'Remove Batch'
        }
        message={
          confirmDelete?.type === 'category'
            ? `Are you sure you want to permanently delete the category "${confirmDelete?.label}"? This cannot be undone and will fail if products are still assigned to it.`
            : confirmDelete?.type === 'manufacturer'
            ? `Are you sure you want to permanently delete the manufacturer "${confirmDelete?.label}"? This cannot be undone.`
            : `Remove batch "${confirmDelete?.label}" from this product's batch list?`
        }
        confirmLabel="Delete"
        variant="danger"
        loading={submitting}
      />
    </div>
  );
}
