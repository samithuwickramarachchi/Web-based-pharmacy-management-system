# group-member-packages -- PharmaCare Pro

## Purpose
This directory contains **ownership packages** for each of the 6 team members.
These packages are **NOT standalone projects**.
They are reference folders containing copies of owned files and documentation.

The actual runnable project is at the project root (`backend/`, `frontend/`, `database/`).

---

## Six Member Responsibilities

| Member | Function |
|--------|----------|
| Member 01 | Customer Management + Online Order Management |
| Member 02 | Inventory Management |
| Member 03 | Sales and Billing Management |
| Member 04 | Supplier Management |
| Member 05 | Discount and Promotion Management |
| Member 06 | Delivery Management |

---

## Package Contents
Each member folder contains:
- Copied backend/frontend source files for that member's domain
- `OWNERSHIP.md` -- what this member owns
- `FILES.txt` -- exact list of owned files
- `DEPENDENCIES.md` -- cross-module dependencies
- `GITHUB_INSTRUCTIONS.md` -- step-by-step GitHub workflow

---

## Git Branch Strategy
```
main
  feature/customer-online-order
  feature/inventory-management
  feature/sales-billing
  feature/supplier-management
  feature/promotion-management
  feature/delivery-management
```

---

## Shared File Rules
See `SHARED-FILES.md` for files ALL members depend on.

No member should:
- Delete another member's files
- Modify shared infrastructure files without team agreement
- Push experimental work directly to `main`
