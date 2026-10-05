import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import salesService from '../services/salesService';
import promotionService from '../services/promotionService';

const CartContext = createContext(null);

const LOCAL_STORAGE_CART_KEY = 'pharmacare_guest_cart';

export function CartProvider({ children }) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [cart, setCart] = useState({
    cartId: null,
    customerId: null,
    items: [],
    totalAmount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Determine customer ID (from user object or fallback)
  const customerId = user?.customerId || (user?.roles?.includes('CUSTOMER') ? user.id : null);

  // Recalculate local totals
  const computeLocalTotal = (items) => {
    return items.reduce((sum, item) => sum + (Number(item.unitPrice) * item.quantity), 0);
  };

  // ── Load cart on mount or user change ──────────────────────────────────────
  const loadCart = useCallback(async () => {
    if (customerId) {
      try {
        setLoading(true);
        const data = await salesService.getCart(customerId);
        if (data) {
          setCart({
            cartId: data.cartId || null,
            customerId: data.customerId || customerId,
            items: data.items || [],
            totalAmount: Number(data.totalAmount) || 0,
          });
        }
      } catch (err) {
        console.warn('Could not load backend cart, falling back to local state:', err);
        const local = localStorage.getItem(LOCAL_STORAGE_CART_KEY);
        if (local) {
          try {
            const parsed = JSON.parse(local);
            setCart(parsed);
          } catch {
            // ignore
          }
        }
      } finally {
        setLoading(false);
      }
    } else {
      // Guest local cart
      const local = localStorage.getItem(LOCAL_STORAGE_CART_KEY);
      if (local) {
        try {
          const parsed = JSON.parse(local);
          setCart(parsed);
        } catch {
          setCart({ cartId: null, customerId: null, items: [], totalAmount: 0 });
        }
      }
    }
  }, [customerId]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  // Persist guest cart to localStorage
  useEffect(() => {
    if (!customerId) {
      localStorage.setItem(LOCAL_STORAGE_CART_KEY, JSON.stringify(cart));
    }
  }, [cart, customerId]);

  // ── Add Item to Cart ───────────────────────────────────────────────────────
  const addToCart = async (product, quantity = 1) => {
    if (!product || !product.id) return false;

    // Check stock limit if known
    const available = product.totalStock !== undefined ? product.totalStock : null;
    if (available !== null) {
      if (available <= 0) {
        toast.error('This product is currently out of stock.');
        return false;
      }
      const existingInCart = cart.items.find((i) => i.productId === product.id);
      const currentCartQty = existingInCart ? existingInCart.quantity : 0;
      if (currentCartQty + quantity > available) {
        toast.error(`Only ${available} units are currently available.`);
        return false;
      }
    }

    if (customerId) {
      try {
        setLoading(true);
        const updated = await salesService.addItemToCart(customerId, product.id, quantity);
        setCart({
          cartId: updated.cartId || null,
          customerId: updated.customerId || customerId,
          items: updated.items || [],
          totalAmount: Number(updated.totalAmount) || 0,
        });
        toast.success(`Added ${product.name} to cart`);
        return true;
      } catch (err) {
        console.error('Add to cart failed:', err);
        toast.error(err.response?.data?.message || 'Failed to add item to cart');
        return false;
      } finally {
        setLoading(false);
      }
    } else {
      // Offline/Guest local cart update
      let allowed = true;
      setCart((prev) => {
        const existingIdx = prev.items.findIndex((i) => i.productId === product.id);
        let newItems;
        if (existingIdx >= 0) {
          newItems = [...prev.items];
          const newQty = newItems[existingIdx].quantity + quantity;
          if (available !== null && newQty > available) {
            toast.error(`Only ${available} units are currently available.`);
            allowed = false;
            return prev;
          }
          newItems[existingIdx] = {
            ...newItems[existingIdx],
            quantity: newQty,
            subtotal: newQty * Number(newItems[existingIdx].unitPrice),
            availableStock: available !== null ? available : newItems[existingIdx].availableStock,
          };
        } else {
          const unitPrice = Number(product.sellingPrice) || 0;
          newItems = [
            ...prev.items,
            {
              id: Date.now(),
              productId: product.id,
              productName: product.name,
              productSku: product.sku || '',
              unitPrice: unitPrice,
              quantity: quantity,
              subtotal: unitPrice * quantity,
              requiresPrescription: Boolean(product.requiresPrescription),
              categoryName: product.categoryName || '',
              availableStock: available !== null ? available : undefined,
            },
          ];
        }
        return {
          ...prev,
          items: newItems,
          totalAmount: computeLocalTotal(newItems),
        };
      });
      if (allowed) {
        toast.success(`Added ${product.name} to cart`);
      }
      return allowed;
    }
  };

  // ── Update Item Quantity ───────────────────────────────────────────────────
  const updateQuantity = async (itemId, quantity) => {
    if (quantity <= 0) {
      return removeFromCart(itemId);
    }

    const item = cart.items.find((i) => i.id === itemId);
    if (item && item.availableStock !== undefined && item.availableStock !== null) {
      if (quantity > item.availableStock) {
        toast.error(`Only ${item.availableStock} units are currently available.`);
        return false;
      }
    }

    if (customerId) {
      try {
        setLoading(true);
        const updated = await salesService.updateCartItemQuantity(customerId, itemId, quantity);
        setCart({
          cartId: updated.cartId || null,
          customerId: updated.customerId || customerId,
          items: updated.items || [],
          totalAmount: Number(updated.totalAmount) || 0,
        });
        return true;
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to update quantity');
        return false;
      } finally {
        setLoading(false);
      }
    } else {
      setCart((prev) => {
        const newItems = prev.items.map((i) =>
          i.id === itemId
            ? { ...i, quantity, subtotal: quantity * Number(i.unitPrice) }
            : i
        );
        return {
          ...prev,
          items: newItems,
          totalAmount: computeLocalTotal(newItems),
        };
      });
      return true;
    }
  };

  // ── Remove Item from Cart ──────────────────────────────────────────────────
  const removeFromCart = async (itemId) => {
    if (customerId) {
      try {
        setLoading(true);
        const updated = await salesService.removeItemFromCart(customerId, itemId);
        setCart({
          cartId: updated.cartId || null,
          customerId: updated.customerId || customerId,
          items: updated.items || [],
          totalAmount: Number(updated.totalAmount) || 0,
        });
        toast.info('Item removed from cart');
        return true;
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to remove item');
        return false;
      } finally {
        setLoading(false);
      }
    } else {
      setCart((prev) => {
        const newItems = prev.items.filter((i) => i.id !== itemId);
        return {
          ...prev,
          items: newItems,
          totalAmount: computeLocalTotal(newItems),
        };
      });
      toast.info('Item removed from cart');
      return true;
    }
  };

  // ── Clear Cart ─────────────────────────────────────────────────────────────
  const clearCart = async () => {
    if (customerId) {
      try {
        await salesService.clearCart(customerId);
      } catch (err) {
        console.warn('Could not clear backend cart:', err);
      }
    }
    localStorage.removeItem(LOCAL_STORAGE_CART_KEY);
    setCart({
      cartId: null,
      customerId: customerId || null,
      items: [],
      totalAmount: 0,
    });
    setAppliedCoupon(null);
    setDiscountAmount(0);
  };

  // ── Apply Coupon Code ──────────────────────────────────────────────────────
  const applyCoupon = async (code) => {
    if (!code || !code.trim()) {
      toast.error('Please enter a promo code');
      return false;
    }

    try {
      const result = await promotionService.validateCoupon({
        couponCode: code.trim(),
        orderAmount: cart.totalAmount,
      });

      if (result && result.valid) {
        setAppliedCoupon({
          code: code.trim().toUpperCase(),
          discountAmount: Number(result.discountAmount) || 0,
          finalAmount: Number(result.finalAmount),
          message: result.message || 'Coupon applied successfully!',
        });
        setDiscountAmount(Number(result.discountAmount) || 0);
        toast.success(`Coupon ${code.trim().toUpperCase()} applied!`);
        return true;
      } else {
        toast.error(result?.message || 'Invalid or expired coupon');
        return false;
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not validate coupon');
      return false;
    }
  };

  // ── Remove Coupon Code ─────────────────────────────────────────────────────
  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    toast.info('Coupon removed');
  };

  // Total items count (sum of quantities)
  const cartCount = cart.items.reduce((sum, item) => sum + (item.quantity || 1), 0);

  // Final total accounting for discounts
  const finalTotal = Math.max(0, (cart.totalAmount || 0) - discountAmount);

  // Check if any cart item requires prescription
  const requiresPrescription = cart.items.some(
    (item) => item.requiresPrescription === true
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        loading,
        appliedCoupon,
        discountAmount,
        finalTotal,
        requiresPrescription,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart: loadCart,
        applyCoupon,
        removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export default CartContext;
