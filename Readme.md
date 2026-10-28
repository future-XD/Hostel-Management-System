# HostelHub — Agile Hostel Management System

**Developer:** Bhavishya Yadav (Reg. No: `2427010200`)  
**Architecture:** Full-Stack Monorepo (React + Vite + Tailwind CSS | FastAPI + SQLAlchemy | Supabase PostgreSQL)  
**Methodology:** Agile Scrum (Sprint 0 + 4 Feature Sprints + User Feedback Implementation)

---

## 1. Project Overview
**HostelHub** is a role-based residential hostel management platform built for three primary actors—**Student**, **Warden**, and **Administrator**[cite: 1, 4]. Designed iteratively using Agile methodology, the system implements all 7 functional processes (`1.0` to `7.0`) and 6 core data stores (`D1` to `D6`) defined in our System Data Flow Diagrams (DFD)[cite: 4, 5], while integrating room waitlist queues and room inspection metrics (`cleanliness_level`, `damage_severity`) from our Entity-Relationship (ER) model[cite: 2, 3].

---

## 2. Tech Stack
* **Frontend:** React 18 (Vite), Tailwind CSS, React Router v6, Axios (with Custom TTL Smart Cache Interceptor), Lucide Icons
* **Backend:** Python FastAPI, SQLAlchemy 2.0 ORM, Pydantic v2 Validation
* **Database:** Supabase PostgreSQL (Session Pooler IPv4)
* **Security:** OAuth2 JWT Bearer Authentication (`python-jose`) + Bcrypt Password Hashing (`passlib`) + Role-Based Access Control (RBAC)

---

## 3. DFD & ER Traceability Matrix

| DFD Process | Process Name | Implemented Database Tables (Data Stores) | Core Features & Use Cases |
| :--- | :--- | :--- | :--- |
| **1.0** | User Authentication[cite: 5] | `users` (`D1 User Data`)[cite: 2, 5] | Student Registration, JWT Login/Logout, Admin Role Management (`Manage Users`) |
| **2.0** | Room Management[cite: 5] | `rooms` (`D2 Room Data`)[cite: 2, 5] | Real-time bed occupancy KPIs, Room CRUD (`Manage Rooms`), Maintenance toggles[cite: 1, 5] |
| **3.0** | Accommodation Application Processing[cite: 5] | `allocations`, `waitlists` (`D3 Application Data`)[cite: 2, 5] | Student Room Application, Auto-Waitlist Engine when preferred room type is full, Warden Room Allocation & automatic `Fee Trigger`[cite: 1, 2, 5] |
| **4.0** | Fee Payment Management[cite: 5] | `fee_payments` (`D4 Fee Payment Data`)[cite: 5] | Semester Fee Invoices, Online Payment Simulation, Printable Official Fee Receipts (`Generate Receipt`)[cite: 1, 5] |
| **5.0** | Complaint & Visitor Management[cite: 5] | `complaints_and_inspections`, `visitor_logs` (`D5` + `INSPECTION_LOG`)[cite: 2, 5] | Student Maintenance Complaints, Warden Room Inspections (`cleanliness_level`, `damage_severity`), Escalation to Admin, Visitor Check-In/Out Log[cite: 1, 2, 5] |
| **6.0** | Leave & Notice Management[cite: 5] | `leave_requests`, `notices` (`D6` + `NOTIFICATION`)[cite: 2, 5] | Student Out-Pass/Leave Requests, Warden Leave Approval, Role-Targeted Hostel Notice Board[cite: 1, 2, 5] |
| **7.0** | System Administration[cite: 5] | Aggregated across `D1`–`D6`[cite: 5] | Executive KPIs (Revenue, Occupancy %, Active Waitlist) & `Unresolved Escalations` monitor[cite: 4, 5] |

---

## 4. Agile Sprint Delivery Log
* **Sprint 0 (Foundation):** Monorepo setup, Supabase PostgreSQL connection, unified 9-table SQLAlchemy schema resolving initial ER/DFD gaps, and JWT RBAC middleware.
* **Sprint 1 (Auth & Inventory):** Process `1.0` & `2.0` — Login/Registration portal, quick-fill demo credentials, room inventory filters, and capacity tracking[cite: 1, 5].
* **Sprint 2 (Allocations, Waitlist & Fees):** Process `3.0` & `4.0` — Accommodation applications, automated waitlist queue positioning, room allotment with `Fee Trigger`, and printable receipts[cite: 1, 2, 5].
* **Sprint 3 (Operations & Inspections):** Process `5.0` — Maintenance complaints, Warden `INSPECTION_LOG` scoring (1–5 scale), and visitor entry/exit timestamps[cite: 1, 2, 5].
* **Sprint 4 (Leaves, Notices, Admin Reports & Cache Optimization):** Process `6.0` & `7.0` — Leave approval workflow, hostel notice board, admin analytics dashboard, plus a client-side Axios TTL cache based on Sprint 3 user feedback.

---

## 5. Local Setup Instructions

### Backend (`/backend`)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
