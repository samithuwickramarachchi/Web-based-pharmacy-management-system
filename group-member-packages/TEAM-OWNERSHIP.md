# TEAM-OWNERSHIP.md -- PharmaCare Pro Pharmacy Management System

## 6-Member GitHub Team Ownership Matrix

| Member | Function | Backend | Frontend | Tests | Primary DB Tables | Design Pattern | Branch |
|--------|----------|---------|----------|-------|-------------------|----------------|--------|
| Member 01 | Customer OnlineOrder | 52 files | 11 files | 6 tests | `customers`, `customer_addresses`, `support_messages`... | Strategy Pattern | `feature/customer-online-order` |
| Member 02 | Inventory | 31 files | 2 files | 1 tests | `categories`, `manufacturers`, `products`... | Observer Pattern | `feature/inventory-management` |
| Member 03 | Sales Billing | 33 files | 3 files | 0 tests | `sales`, `sale_items`, `sale_payments`... | Strategy Pattern | `feature/sales-billing` |
| Member 04 | Supplier | 24 files | 2 files | 0 tests | `suppliers`, `purchase_orders`, `purchase_order_items` | Factory Method Pattern | `feature/supplier-management` |
| Member 05 | Promotion | 15 files | 2 files | 0 tests | `promotions`, `promotion_products`, `promotion_usage` | Strategy Pattern | `feature/promotion-management` |
| Member 06 | Delivery | 17 files | 2 files | 0 tests | `deliveries`, `delivery_status_history` | State Pattern | `feature/delivery-management` |

---

## Database Table Ownership Summary

| Tables | Owner |
|--------|-------|
| `roles`, `users` | SHARED (Auth) |
| `customers`, `customer_addresses`, `support_messages` | Member 01 |
| `shopping_carts`, `cart_items`, `online_orders`, `online_order_items`, `prescriptions` | Member 01 |
| `categories`, `manufacturers`, `products`, `product_batches`, `stock_movements` | Member 02 |
| `sales`, `sale_items`, `sale_payments`, `payments` | Member 03 |
| `suppliers`, `purchase_orders`, `purchase_order_items` | Member 04 |
| `promotions`, `promotion_products`, `promotion_usage` | Member 05 |
| `deliveries`, `delivery_status_history` | Member 06 |
| `activity_logs`, `notifications` | SHARED (Common) |

---

## Branch Strategy

```
main
  feature/customer-online-order    (Member 01)
  feature/inventory-management     (Member 02)
  feature/sales-billing            (Member 03)
  feature/supplier-management      (Member 04)
  feature/promotion-management     (Member 05)
  feature/delivery-management      (Member 06)
```

All feature branches merge to `main` via Pull Request.
