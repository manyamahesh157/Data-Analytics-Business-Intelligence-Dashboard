# Enterprise BI & Data Analytics Dashboard Platform

> **Executive Summary for Project Managers & Stakeholders**  
> An enterprise-grade, multi-tenant Business Intelligence (BI) and Data Analytics platform delivering **custom visual dashboards**, **real-time KPI health scorecards with threshold alerting**, **automated multi-source ETL data ingestion**, and **scheduled executive reporting (PDF/Excel/CSV)**.

---

## 🧭 Executive System Architecture

The platform is structured into **Four Core Business Value Streams** across a reliable 3-Tier Technical Foundation:

```mermaid
flowchart TD
    subgraph S1["1. Data Ingestion & Integration Layer"]
        A1["CSV / Excel Uploads"]
        A2["PostgreSQL / MySQL Warehouses"]
        A3["REST API Endpoints"]
        A4["Google Sheets Live Sync"]
    end

    subgraph S2["2. Analytics Processing & Business Logic"]
        B1["ETL Validation & Schema Inference"]
        B2["Safe Parameterized Query Engine"]
        B3["KPI Computation Engine (MoM/QoQ Formulas)"]
        B4["Automated Threshold Alerts & Notification Service"]
        B5["Scheduled Report Generator (PDF / ExcelJS)"]
    end

    subgraph S3["3. High-Performance Data Storage"]
        C1[("PostgreSQL 16 Multi-Tenant Schema")]
        C2[("Partitioned Time-Series KPI Vault (2024-2027)")]
        C3[("Materialized Views for Heavy Aggregations")]
        C4[("Redis Caching & TTL Layer")]
    end

    subgraph S4["4. Interactive User Experience (UI)"]
        D1["Custom Drag-and-Drop Dashboard Studio"]
        D2["Real-Time KPI Monitoring Center & Drill-Down Drawer"]
        D3["Multi-Step Ingestion & Column Mapping Studio"]
        D4["Scheduled & On-Demand Reporting Hub"]
        D5["Global Date Range & Dimension Slicers"]
    end

    S1 -->|Extract & Validate| S2
    S2 <-->|Read / Write / Cache| S3
    S2 -->|Real-Time Socket.io & REST APIs| S4
    S4 -->|User Interactions & Filters| S2
```

---

## 📊 Core Capabilities Matrix (Business Value Stream)

| Business Capability | Primary User | Key Features & Value Delivered | Associated Module |
| :--- | :--- | :--- | :--- |
| **Custom Dashboard Builder** | Executives, Business Analysts | Drag-and-drop widget canvas (`react-grid-layout`), 8 interactive visualizers (Line, Bar, Donut, Area, Scatter, KPI cards, Data Tables, Speedometer Gauges), instant print/PDF export. | `client/src/components/dashboard/` <br/> `server/src/modules/dashboards/` |
| **KPI & Threshold Monitoring** | Operations & Finance Leads | Real-time metric tracking, Month-over-Month (MoM) delta percentages, sparkline trajectories, and automated multi-level alerts (**Warning** / **Critical**). | `client/src/components/kpi/` <br/> `server/src/modules/kpis/` |
| **Multi-Source ETL Ingestion** | Data Engineers, Admins | 4-step ingestion wizard supporting CSV/Excel files, relational DBs, REST APIs, and Google Sheets with automated type inference, data preview, and error logging. | `client/src/components/dataImport/` <br/> `server/src/modules/dataSources/` |
| **Automated Executive Reporting** | Management, External Board | Scheduled cron dispatch and on-demand generation of executive PDF briefings, CSV extracts, and formatted multi-tab Excel workbooks. | `client/src/components/reports/` <br/> `server/src/modules/reports/` |
| **Security, RBAC & Audit Trail** | Compliance & System Admins | Multi-tenant tenant isolation, JWT authentication, granular permission matrix (Admin, Editor, Viewer), and immutable write mutation audit logs. | `server/src/middleware/` <br/> `server/src/modules/auditLogs/` |

---

## 🗂️ Project Directory Architecture & Deliverable Mapping

Below is the project organizational structure mapped directly to team responsibilities and business outputs:

```
📁 bi-analytics-platform/
│
├── 📂 database/                               # DATABASE & DATA MODEL LAYER
│   ├── 📄 schema.sql                          # Complete PostgreSQL DDL (14 Multi-tenant tables, Partitions, Triggers)
│   ├── 📄 seed.sql                            # Enterprise seed data (SaaS metrics, E-Commerce, Users, Dashboards, KPIs)
│   └── 📄 erd.md                              # Entity Relationship Diagram & Cardinality Specifications
│
├── 📂 server/                                 # BACKEND SERVICE LAYER (Node.js + Express + TypeScript)
│   ├── 📂 src/
│   │   ├── 📂 config/                         # Environment variables (Zod schema validation) & Winston logger
│   │   ├── 📂 db/                             # PostgreSQL connection pool & Redis caching engine
│   │   ├── 📂 middleware/                     # JWT Auth, Role-Based Access Control (RBAC), and Write Audit Logger
│   │   ├── 📂 modules/
│   │   │   ├── 📂 auth/                       # User Login, Registration, Profile, and Refresh Token Handlers
│   │   │   ├── 📂 dashboards/                 # Dashboard CRUD & Parameterized SQL Query Engine
│   │   │   ├── 📂 kpis/                       # KPI Formula Engine, PoP Calculations & Threshold Alert Evaluator
│   │   │   ├── 📂 dataSources/                # Multi-Source Connectors (CSV/Excel/REST/DB) & ETL Ingestion Pipeline
│   │   │   ├── 📂 reports/                    # Headless PDF Generator, ExcelJS Workbook Builder & Cron Scheduler
│   │   │   ├── 📂 auditLogs/                  # Security Audit Trail and Mutation Inspector
│   │   │   ├── 📂 realtime/                   # Socket.io WebSocket Gateway for live client event streaming
│   │   │   └── 📂 docs/                       # OpenAPI / Swagger Specification at /api/docs
│   │   ├── 📂 types/                          # Domain Type Definitions strictly aligned with PostgreSQL schema
│   │   ├── 📄 app.ts                          # Express application pipeline & middleware configuration
│   │   └── 📄 index.ts                        # Server entry point, background worker bootstrap & port binding
│   ├── 📄 Dockerfile                          # Multi-stage production container build for Backend
│   └── 📄 package.json                        # Backend dependencies & compilation scripts
│
├── 📂 client/                                 # FRONTEND APPLICATION LAYER (React 18 + Vite + Tailwind CSS)
│   ├── 📂 src/
│   │   ├── 📂 components/
│   │   │   ├── 📂 dashboard/                  # Drag-and-drop Dashboard Studio, Widget Cards & Add Widget Modal
│   │   │   ├── 📂 widgets/                    # Chart.js / Recharts components (Line, Bar, Pie, Area, Scatter, Gauge, Table)
│   │   │   ├── 📂 kpi/                        # KPI Monitoring Cards, Sparklines & Historical Drill-Down Drawer
│   │   │   ├── 📂 dataImport/                 # 4-Step ETL Ingestion Wizard, Source Connector & Dataset Explorer
│   │   │   ├── 📂 reports/                    # Scheduled Report Setup Modal & Export Download Archive
│   │   │   ├── 📂 audit/                      # Security & Mutation Audit Log Viewer with JSON Diff inspection
│   │   │   ├── 📂 layout/                     # Application Shell, Collapsible Sidebar, Topbar & Global Filter Bar
│   │   │   └── 📂 auth/                       # Login & Register Views with 1-Click Persona Quick-Switchers
│   │   ├── 📂 hooks/                          # React Query Data Hooks (useDashboards, useKpis, useDataSources, etc.)
│   │   ├── 📂 services/                       # REST API Client & Socket.io Real-Time Client
│   │   ├── 📂 store/                          # Global Zustand State Store (Auth, Date Range, Dimension Slicers, Theme)
│   │   ├── 📂 types/                          # Frontend TypeScript interfaces (matching Backend & DB contracts)
│   │   ├── 📄 App.tsx                         # Client Master Routing & Protected Route Guards
│   │   └── 📄 main.tsx                        # React DOM mounting & Tailwind initialization
│   ├── 📄 Dockerfile                          # Multi-stage production container build with Nginx
│   └── 📄 package.json                        # Frontend dependencies & build scripts
│
├── 📄 docker-compose.yml                      # Full-stack Docker orchestration (Postgres + Redis + API + Client)
└── 📄 README.md                               # Project documentation & execution guide
```

---

## 👥 Cross-Functional Team Ownership

```
+--------------------------+--------------------------+--------------------------+
|      FRONTEND TEAM       |       BACKEND TEAM       |    DATABASE & INFRA      |
+--------------------------+--------------------------+--------------------------+
| - UI / UX Layouts        | - RESTful API Gateway    | - PostgreSQL Schemas     |
| - Chart.js & Gauges      | - Parameterized Queries  | - Time-Series Partition  |
| - react-grid-layout      | - KPI Engine & Alerts    | - Materialized Views     |
| - React Query & Zustand  | - ETL Ingestion Pipeline | - Redis Cache Strategy   |
| - Responsive Themeing    | - Cron Report Scheduler  | - Docker Compose Stacks  |
+--------------------------+--------------------------+--------------------------+
```

---

## ⚡ Quick Start & Execution Guide

### Option 1: Docker Compose (Recommended for Staging / Production)
```bash
docker-compose up --build -d
```
- **Web App UI**: [http://localhost:3000](http://localhost:3000)
- **API Gateway**: [http://localhost:5000/api](http://localhost:5000/api)
- **Interactive Swagger Documentation**: [http://localhost:5000/api/docs](http://localhost:5000/api/docs)
- **Health Check & Diagnostics**: [http://localhost:5000/health](http://localhost:5000/health)

### Option 2: Local Development
1. **Start Backend Server**:
   ```bash
   cd server
   npm install
   npm run dev
   ```
2. **Start Frontend Client**:
   ```bash
   cd client
   npm install
   npm run dev
   ```

---

## 🔑 Pre-Seeded Stakeholder Demo Personas

The platform comes pre-seeded with three operational personas for immediate demonstration:

| Persona / Role | Email | Password | Business Responsibilities & Permissions |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@apex.io` | `Password123!` | Full control: configure data sources, run ETL jobs, manage users, and inspect security audit logs. |
| **Business Analyst / Editor** | `editor@apex.io` | `Password123!` | Create & edit visual dashboards, configure KPI formulas, and schedule automated reports. |
| **Executive Stakeholder / Viewer** | `viewer@apex.io` | `Password123!` | Read-only access to published executive dashboards, scorecards, and exported briefing files. |

*(The login screen includes **1-click quick role selector buttons** for easy demo presentation).*
