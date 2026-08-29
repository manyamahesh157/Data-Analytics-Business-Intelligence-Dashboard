# Enterprise BI & Business Intelligence Dashboard Platform

A complete, production-grade, multi-tenant Business Intelligence and Data Analytics Dashboard platform. Built with **PostgreSQL**, **Node.js + Express (TypeScript)**, and **React.js + Tailwind CSS + Chart.js / Recharts**.

---

## 🏛️ System Architecture

```
+------------------------------------------------------------------------------------+
|                                FRONTEND (React 18 + Vite + Tailwind)               |
|  - Custom Drag & Drop Dashboards                                                   |
|  - Chart.js / Recharts / Gauge Visualizations                                      |
|  - Real-Time KPI Monitoring Center with Sparklines & Alerts                        |
|  - 4-Step Multi-Source Ingestion Wizard (CSV, Excel, PG, REST, Google Sheets)       |
|  - Automated Scheduled & On-Demand Reporting Studio (PDF, Excel, CSV)              |
+------------------------------------------+-----------------------------------------+
                                           | HTTP REST & WebSocket (Socket.io)
+------------------------------------------v-----------------------------------------+
|                              BACKEND (Express + TypeScript)                        |
|  - JWT & Refresh Token Auth + RBAC (Admin, Editor, Viewer)                         |
|  - Safe Parameterized Query Builder with Column Whitelisting & Redis Caching       |
|  - Automated ETL Pipeline (Extract -> Validate -> Transform -> Load)               |
|  - KPI Engine with Period-over-Period (MoM/QoQ/YoY) & Alert Triggers               |
|  - BullMQ / Cron Scheduled Reporting Worker                                        |
|  - Socket.io Real-Time Room Subscriptions                                         |
+------------------------------------------+-----------------------------------------+
                                           | SQL Queries / Pooling
+------------------------------------------v-----------------------------------------+
|                                DATABASE (PostgreSQL 16)                            |
|  - Multi-tenant Core: organizations, users, roles, permissions, audit_logs         |
|  - Datasets: data_sources, import_jobs, imported_datasets                          |
|  - Dashboards: dashboards, widgets, dashboard_permissions                          |
|  - Partitioned Time-Series: kpi_definitions, kpi_values (partitioned), kpi_alerts  |
|  - Reports: reports, report_history                                                |
|  - Materialized View: mv_kpi_monthly_aggregates                                    |
+------------------------------------------------------------------------------------+
```

---

## 📦 Directory Structure

```
├── database/
│   ├── schema.sql           # PostgreSQL Schema DDL (UUIDs, Partitioning, MVs, Triggers)
│   ├── seed.sql             # Seed Data (SaaS metrics, e-commerce, users, widgets, KPIs)
│   └── erd.md               # Entity Relationship Diagram & Cardinality Specification
├── server/
│   ├── src/
│   │   ├── config/          # Zod env validator & Winston logger
│   │   ├── db/              # Postgres Pool, Redis Cache, Migrations, Seeds
│   │   ├── middleware/      # Auth, RBAC, Write Audit Logger, Rate Limiter, Validation
│   │   ├── modules/
│   │   │   ├── auth/        # Login, Register, Profile, Refresh Token
│   │   │   ├── dashboards/  # Dashboard CRUD, Widget CRUD, Safe Query Builder
│   │   │   ├── kpis/        # KPI Engine, PoP Formulas, Alerts Evaluator
│   │   │   ├── dataSources/ # Connectors (CSV/Excel/REST/DB), ETL Ingestion Pipeline
│   │   │   ├── reports/     # Puppeteer/HTML PDF, ExcelJS, CSV, Cron Scheduler
│   │   │   ├── auditLogs/   # Security mutation audit viewer
│   │   │   ├── realtime/    # Socket.io gateway & event broadcasting
│   │   │   └── docs/        # OpenAPI / Swagger specs
│   │   ├── types/           # 1:1 Schema-aligned TypeScript types
│   │   ├── app.ts           # Express Application setup
│   │   └── index.ts         # Bootstrap entry point
│   ├── Dockerfile
│   └── package.json
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── dashboard/   # Dashboard Studio, Widget Card, Add Widget Modal
│   │   │   ├── widgets/     # Line, Bar, Pie, Area, Scatter, KPI Card, Table, Gauge
│   │   │   ├── kpi/         # KPI Monitoring Hub, Sparklines, Drill-Down Drawer
│   │   │   ├── dataImport/  # 4-step Ingestion Wizard & Dataset Explorer
│   │   │   ├── reports/     # Scheduled Report Modal & Archive Downloads
│   │   │   ├── audit/       # Security Audit Log Viewer
│   │   │   ├── layout/      # AppLayout, Sidebar, Topbar, Global Filter Bar
│   │   │   └── auth/        # Login & Register with Demo Role Quick Switchers
│   │   ├── hooks/           # React Query Hooks (useDashboards, useKpis, etc.)
│   │   ├── services/        # REST API & Socket.io Clients
│   │   ├── store/           # Zustand App State (Auth, Date Range, Slicers, Theme)
│   │   ├── types/           # Frontend TypeScript Interfaces
│   │   ├── App.tsx          # Master Router
│   │   └── main.tsx         # Root DOM Render
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml       # Production Stack Orchestration (Postgres + Redis + API + Client)
└── README.md
```

---

## ⚡ Quick Start & Execution

### Option A: Docker Compose (All Services)
```bash
docker-compose up --build -d
```
- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)
- **Swagger Documentation**: [http://localhost:5000/api/docs](http://localhost:5000/api/docs)
- **Health Check**: [http://localhost:5000/health](http://localhost:5000/health)

### Option B: Local Node.js Development
1. **Start Backend**:
   ```bash
   cd server
   npm install
   npm run dev
   ```
2. **Start Frontend**:
   ```bash
   cd client
   npm install
   npm run dev
   ```

---

## 🔑 Demo Login Credentials

The platform is pre-seeded with three multi-tenant personas:

| Persona | Email | Password | Role & Permissions |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@apex.io` | `Password123!` | Full Administrative control, dataset imports, user & audit management |
| **Editor** | `editor@apex.io` | `Password123!` | Create & customize dashboards, define KPIs, schedule reports |
| **Viewer** | `viewer@apex.io` | `Password123!` | Read-only access to published dashboards and KPI scorecards |

*(Clickable instant demo role switchers are conveniently built directly into the login screen).*
