# ⚡ SMARTGRID — INTELLIGENT ENERGY MANAGEMENT PLATFORM

A modern, commercial-grade, full-stack web application designed to monitor, analyze, simulate, and optimize electricity consumption in a photovoltaic-powered residential or multi-zone installation with three energy storage batteries, four priority zones, individual appliance telemetry, energy trading, and official Tunisian STEG electricity billing.

---

## 🌟 Key Platform Capabilities

### 1. 📊 Overview Dashboard
- **6 Real-Time KPI Cards**:
  - Solar Production (kW) with trend indicator
  - Total Consumption (kW) & Requested demand
  - Available Battery Energy (kWh)
  - Average Battery State of Charge (SOC %)
  - Active Zones Status (4 zones)
  - Total Energy Sold (kWh) & Revenue Generated (TND)
- **Interactive Multi-Node Energy Flow Network**:
  - SVG diagram with dynamic glowing pulses and real-time kW connection labels.
  - Color-coded routing: Yellow (Solar), Purple (Battery storage), Red (Zone loads), Green (Surplus export), Blue (Utility grid).
- **Interactive Overview Charts**:
  - Solar vs. Consumption Telemetry
  - Battery Cycling & Storage Shift History
  - Zone Load Apportionment
  - Net Energy Balance Profile

### 2. ⚡ Energy Monitoring Module
- Solar generation matrices: Instantaneous, daily, weekly, monthly, annual.
- Consumption telemetry: Instantaneous, daily, peak demand, monthly forecast.
- Power Balance classification: **SURPLUS**, **BALANCED**, **DEFICIT**, and **CRITICAL**.
- 4 interactive charts with multi-period filters: Today, Yesterday, 7 Days, 30 Days, 3 Months, 12 Months.

### 3. 🏢 4-Zone Priority Management
- Exactly four configured zones with priority ranks:
  - **Zone 1: Critical Zone** (Priority 1, Default 5.0 kW, Max 8.0 kW) — Medical & server infrastructure preserved at all times.
  - **Zone 2: High Priority Zone** (Priority 2, Default 4.0 kW, Max 6.5 kW) — Workstations & office climate.
  - **Zone 3: Medium Priority Zone** (Priority 3, Default 6.0 kW, Max 9.0 kW) — Commercial induction kitchen & laundry.
  - **Zone 4: Low Priority Zone** (Priority 4, Default 3.0 kW, Max 5.0 kW) — EV auxiliary charging & outdoor lighting.
- Capabilities: Edit priority tier, adjust nominal limits, manual disconnect/reconnect, zone-by-zone comparison.

### 4. 🔌 Component-Level Appliance Management & Aging Simulator
- Individual appliance modeling with:
  - Nominal power (Watts), daily operating hours, category, energy class (A+++ to C).
  - Energy equation: `Energy (kWh) = Power (W) × Operating Hours / 1000`.
- **"Consumption Evolution" Aging Laboratory**:
  - Multi-year efficiency degradation projections based on age, maintenance condition, and usage intensity.
  - Distinguishes wear degradation from operational schedule changes.
  - **Eco-Audit Recommendation Engine**: Recommends A+++ inverter replacements, computes annual savings in TND, equipment costs, and payback periods (ROI).

### 5. 🔋 3-Battery Energy Storage System (BESS)
- Three independent lithium-iron-phosphate (LFP) battery banks:
  - **Battery 1 (Primary High-Cap)**: 20 kWh, nominal SOC 95%
  - **Battery 2 (Secondary Storage)**: 15 kWh, nominal SOC 70%
  - **Battery 3 (Auxiliary Buffer)**: 10 kWh, nominal SOC 45%
- Formulas:
  - `Stored Energy (kWh) = Capacity × SOC / 100`
  - `Available Discharge Energy (kWh) = Capacity × (SOC - Minimum SOC) / 100`
- Manual charge/discharge simulation controls, minimum reserve cutoff, and SOC history.

### 6. 🔀 Smart Energy Distribution Engine (Core Module)
- **Surplus Logic (Solar > Load)**:
  1. Supply 100% of Zone 1, 2, 3, and 4.
  2. Charge batteries sequentially (Battery 1 first, then 2, then 3) respecting max charging rates.
  3. Export leftover surplus to grid when battery reserve >= 30%.
- **Deficit Logic (Solar < Load)**:
  1. Discharge storage units respecting minimum reserve margins.
  2. In **ECO Mode**: Apply progressive load reduction (Zone 4 throttled 40%, Zone 3 throttled 25%) before shedding.
  3. **Automatic Shedding Order**: Shed Zone 4 first -> Shed Zone 3 second -> Shed Zone 2 third -> Zone 1 preserved.
- **Audit Decision Log**: Timestamped record of every dispatch event, situation, trigger reason, and affected hardware.
- **Operating Modes**: `AUTOMATIC`, `MANUAL`, `ECO`.

### 7. 💰 Simulated Energy Trading Market
- Surplus feed-in dispatch at configured tariffs (default: 0.250 TND / kWh).
- Safety guard: Energy is never exported if needed for active loads or minimum battery reserve.
- Detailed transaction ledger and estimated daily, monthly, and annual utility credits.

### 8. 🧪 Interactive Simulation Center
- **Control Sliders**: Solar factor, Zone 1-4 power demands, Battery 1-3 SOCs.
- **10 Predefined Benchmark Scenarios**:
  1. Normal Mediterranean Sunny Day
  2. Cloudy / Overcast Weather (25% solar)
  3. Extreme Peak HVAC Consumption
  4. Midsummer Solar Surplus
  5. Battery 1 Failure (Unit 1 offline)
  6. Battery 2 Failure (Unit 2 offline)
  7. Battery 3 Failure (Unit 3 offline)
  8. Critical Energy Crisis (Near-zero solar, depleted reserve)
  9. Nighttime Residential Consumption
  10. Appliance Efficiency Degradation
- Full Before/After diagnostics, shedding indicators, and exportable JSON results.

### 9. 📈 Advanced Analytics & Global Filtering
- 10 Required analytical charts:
  1. Daily Consumption Profile
  2. Monthly Consumption Aggregation
  3. Solar Production vs Consumption
  4. Comparative Zone Demands
  5. Isolated Zone History
  6. Appliance Consumption Breakdown
  7. Battery Storage Cycling History
  8. Energy Source Distribution Pie
  9. Weekly Load Demand Heatmap
  10. Monthly Financial Energy Savings
- Global multi-dimensional filters: Date horizon, Zone isolation, Energy type, Time grouping.
- One-click CSV dataset export.

### 10. 🧾 Official Tunisian STEG Electricity Bill Simulator
- Reference: **https://www.steg.com.tn/fr/node/12034**
- Low Voltage (Basse Tension - BT) Residential & Commercial Schedules:
  - **Tranche 1 (0 to 50 kWh/mo)**: 0.062 TND / kWh (TVA 7%)
  - **Tranche 2 (51 to 100 kWh/mo)**: 0.096 TND / kWh (TVA 7%)
  - **Tranche 3 (101 to 200 kWh/mo)**: 0.176 TND / kWh (TVA 7%)
  - **Tranche 4 (201 to 300 kWh/mo)**: 0.218 TND / kWh (TVA 7%)
  - **Tranche 5 (301 to 500 kWh/mo)**: 0.341 TND / kWh (TVA 13%)
  - **Tranche 6 (> 500 kWh/mo)**: 0.414 TND / kWh (TVA 13%)
- Prorated monthly bracket calculation for 1-month and 2-month (bimestrielle) invoices.
- Accurate line-item accounting:
  - Energy Cost (HT)
  - Redevance de puissance: Contracted kVA × 0.700 TND × Months (TVA 19%)
  - Contribution Collectivités Locales (CL): 0.005 TND / kWh
  - Fonds de Transition Énergétique (FTE): 1.250 TND
  - Radio-Télévision Tunisienne (RTT): 0.500 TND
  - Timbre Fiscal: 1.000 TND
  - Net TTC and Solar Feed-In credit offset
- Printable / downloadable PDF invoice simulator.

### 11. 💡 Solar Savings & ROI Simulator
- Side-by-side financial comparison: Grid-Only vs Solar + BESS Microgrid.
- Dynamic bill reduction percentage, annual savings, and payback period (ROI).

### 12. 🔔 Alerts & Notification Center
- Severity tiers: **CRITICAL**, **WARNING**, **INFORMATION**.
- Filtering, read/unread status, and batch acknowledgment.

### 13. 🌱 Environmental Analytics & Carbon Offset
- Tunisian grid emissions factor (0.580 kg CO₂ / kWh).
- Quantifies CO₂ avoided, trees equivalent, and passenger vehicle kilometer offsets.

### 14. 📑 Monthly Energy Reports
- Audit summaries by month, downloadable CSV, and printable report view.

### 15. ⚙️ Settings
- Custom platform branding, currency (TND), language, operating dispatch mode, and simulation speed.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Framer Motion, Recharts.
- **Backend**: Node.js, Express.js, TypeScript.
- **Database & ORM**: SQLite / PostgreSQL with Prisma ORM.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js >= 18
- pnpm or npm

### 2. Quick Start (Development Mode)
Run both backend API (port 5000) and frontend client (port 3000) with hot-reloading:
```bash
npm run dev
```

Open your browser at:
- **Frontend App**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000/api`

### 3. Production Build & Execution
Build and run the production server (serves both API and production frontend on port 5000):
```bash
npm run build
npm start
```
Then visit: `http://localhost:5000`

---

## 🏛️ Database Architecture (Prisma Schema)

- `User`: Operator credentials and permissions.
- `Zone`: 4 distinct zones with priorities, limits, and active shedding state.
- `Appliance`: Individual hardware units with nominal wattage, duty cycles, and efficiency.
- `Battery`: 3 storage batteries with SOC, SOH, and C-rates.
- `EnergyReading`: High-resolution historical readings.
- `EnergyTransaction`: Feed-in tariff export ledger.
- `SimulationScenario`: 10 predefined benchmark stress scenarios.
- `DistributionDecision`: Auditable EMS dispatch decisions.
- `Notification`: Critical, warning, and informational alarms.
- `TariffVersion` & `TariffBracket`: Official STEG tariff brackets.
- `ElectricityBill`: Detailed simulated STEG invoices.
- `SystemSettings`: Global operating thresholds.

---

## 📜 Disclaimer
This software platform is an intelligent simulation and analytics tool designed for photovoltaic energy management and Tunisian STEG tariff estimation. It does not control physical grid switches or replace official invoices issued by the Société Tunisienne de l'Électricité et du Gaz (STEG).
