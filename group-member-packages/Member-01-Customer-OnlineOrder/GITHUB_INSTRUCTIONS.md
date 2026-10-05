# GITHUB_INSTRUCTIONS.md -- Member 01 -- Customer Management + Online Order Management

## IMPORTANT
Do NOT create a separate repository.
The GitHub repository is the **complete Pharmacy Management System**.
This package is an ownership reference -- not a standalone project.

---

## Your Branch
```
feature/customer-online-order
```

---

## Step-by-Step Workflow

### 1. Clone the Main Repository
```bash
git clone <repository-url>
cd "SE project us"
```

### 2. Create Your Feature Branch
```bash
git checkout -b feature/customer-online-order
```

### 3. Work on Your Assigned Files
Your owned files are listed in `FILES.txt` and `OWNERSHIP.md`.
Focus your changes on those files.
Do NOT delete or overwrite other modules.

### 4. Run the Application Locally

**Backend:**
```bash
cd backend/pharmacy-backend
mvnw.cmd spring-boot:run
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### 5. Commit Your Changes
```bash
git add .
git commit -m "feat(member-01): implement customer onlineorder functionality"
```

### 6. Push Your Branch
```bash
git push -u origin feature/customer-online-order
```

### 7. Create a Pull Request
- Base branch: `main`
- Compare branch: `feature/customer-online-order`
- Title: `Member 01: Customer Onlineorder Implementation`
- Describe what was implemented or changed.

### 8. Do NOT Push Directly to Main
All changes must go through Pull Requests.

---

## Rules
1. Only modify files listed in your `FILES.txt` without team discussion.
2. For shared files, open a team discussion before making changes.
3. Do NOT remove other members' files.
4. Always pull latest main before starting new work:
```bash
git checkout main
git pull origin main
git checkout feature/customer-online-order
git merge main
```
5. Resolve merge conflicts carefully -- never delete another member's code without agreement.
