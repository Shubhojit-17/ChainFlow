# ChainFlow — Implementation Architecture

> **Loan Lifecycle Management & Transparency Platform**  
> High-Level System Design & Data Flow

---

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Core Data Flow](#core-data-flow)
3. [Loan Lifecycle State Engine](#loan-lifecycle-state-engine)
4. [Covenant Monitoring System](#covenant-monitoring-system)
5. [Document Hashing Approach](#document-hashing-approach)
6. [ESG & Green Loan Tracking](#esg--green-loan-tracking)
7. [Ownership & Participation Tracking](#ownership--participation-tracking)
8. [Analytics Derivation](#analytics-derivation)
9. [Security Architecture](#security-architecture)

---

## System Architecture Overview

ChainFlow follows a **three-tier architecture** with a permissioned ledger as the trust layer:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION LAYER                              │
│                                                                          │
│    ┌──────────────────┐    ┌──────────────────┐    ┌────────────────┐   │
│    │   Agent Bank     │    │     Lender       │    │    Borrower    │   │
│    │  Control Panel   │    │    Dashboard     │    │     Portal     │   │
│    └────────┬─────────┘    └────────┬─────────┘    └───────┬────────┘   │
│             │                       │                       │            │
│             └───────────────────────┴───────────────────────┘            │
│                                     │                                    │
│                          Electron Desktop Application                    │
│                          (React + TypeScript + Tailwind)                 │
└─────────────────────────────────────┼────────────────────────────────────┘
                                      │
                                      │ REST API (JWT Auth)
                                      │
┌─────────────────────────────────────┼────────────────────────────────────┐
│                           APPLICATION LAYER                              │
│                                     │                                    │
│    ┌────────────────────────────────▼────────────────────────────────┐   │
│    │                     Express API Server                          │   │
│    │                                                                 │   │
│    │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │   │
│    │  │  Loan       │  │  Covenant   │  │  Document   │             │   │
│    │  │  Service    │  │  Service    │  │  Service    │             │   │
│    │  └─────────────┘  └─────────────┘  └─────────────┘             │   │
│    │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │   │
│    │  │  ESG        │  │  Analytics  │  │  Ownership  │             │   │
│    │  │  Service    │  │  Service    │  │  Service    │             │   │
│    │  └─────────────┘  └─────────────┘  └─────────────┘             │   │
│    └─────────────────────────┬───────────────────────────────────────┘   │
│                              │                                           │
└──────────────────────────────┼───────────────────────────────────────────┘
                               │
          ┌────────────────────┴────────────────────┐
          │                                         │
          ▼                                         ▼
┌─────────────────────────┐             ┌─────────────────────────────────┐
│     DATA LAYER          │             │      LEDGER LAYER               │
│                         │             │                                 │
│  ┌───────────────────┐  │             │  ┌───────────────────────────┐  │
│  │   PostgreSQL      │  │             │  │   Hyperledger Fabric      │  │
│  │                   │  │             │  │                           │  │
│  │  • User Profiles  │  │             │  │  • Loan Events            │  │
│  │  • Loan Metadata  │  │             │  │  • State Transitions      │  │
│  │  • Document Refs  │  │             │  │  • Covenant Events        │  │
│  │  • ESG KPIs       │  │             │  │  • Document Hashes        │  │
│  │  • Analytics      │  │             │  │  • Ownership Changes      │  │
│  └───────────────────┘  │             │  │  • ESG Submissions        │  │
│                         │             │  └───────────────────────────┘  │
└─────────────────────────┘             └─────────────────────────────────┘
```

### Design Principles

1. **Separation of Concerns:** Mutable operational data in PostgreSQL; immutable audit trail on ledger
2. **Single Source of Truth:** Ledger is authoritative for loan state and event history
3. **Offline Resilience:** Desktop app caches critical data for intermittent connectivity
4. **Role-Based Access:** JWT claims enforce permission boundaries at API layer

---

## Core Data Flow

### Write Path (Loan Operations)

```
User Action → UI Validation → API Request → Auth Middleware → Business Logic
     │                                                              │
     │                                                              ▼
     │                                           ┌──────────────────────────┐
     │                                           │  Validation & Rules     │
     │                                           │  • Role authorization   │
     │                                           │  • State transition OK? │
     │                                           │  • Covenant check       │
     │                                           └───────────┬─────────────┘
     │                                                       │
     │                              ┌────────────────────────┴───────────────┐
     │                              │                                        │
     │                              ▼                                        ▼
     │                    ┌─────────────────┐                    ┌───────────────────┐
     │                    │  PostgreSQL     │                    │  Hyperledger      │
     │                    │  (Metadata)     │                    │  (Immutable Log)  │
     │                    └─────────────────┘                    └───────────────────┘
     │                                                                      │
     │                                                                      │
     └──────────────────────────────────────────────────────────────────────┘
                                  Response to User
```

### Read Path (Queries & Dashboards)

```
Dashboard Request → API → Query Router
                              │
           ┌──────────────────┼──────────────────┐
           │                  │                  │
           ▼                  ▼                  ▼
    ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
    │ PostgreSQL  │   │   Ledger    │   │   Cache     │
    │ (Metadata)  │   │  (History)  │   │ (Analytics) │
    └──────┬──────┘   └──────┬──────┘   └──────┬──────┘
           │                 │                 │
           └─────────────────┴─────────────────┘
                             │
                             ▼
                    Response Aggregation
                             │
                             ▼
                        UI Rendering
```

---

## Loan Lifecycle State Engine

### State Machine Definition

The loan lifecycle follows a **fixed, linear progression** with controlled transitions:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   MANDATED   │────▶│    CREDIT    │────▶│ DOCUMENTATION│
│              │     │   APPROVED   │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
                                                 │
                                                 ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   MATURED    │◀────│    ACTIVE    │◀────│  CP PENDING  │
│              │     │              │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
       ▲                    │
       │                    ▼
       │             ┌──────────────┐     ┌──────────────┐
       └─────────────│   COVENANT   │────▶│  AMENDMENT   │
                     │  MONITORING  │     │              │
                     └──────────────┘     └──────────────┘
```

### Stage Definitions

| Stage | Description | Entry Criteria |
|-------|-------------|----------------|
| **Mandated** | Agent Bank appointed, mandate letter signed | Initial creation |
| **Credit Approved** | Internal credit committee approval | Mandate complete |
| **Documentation** | Legal documentation drafting | Credit approval |
| **CP Pending** | Conditions Precedent checklist | Docs executed |
| **Active** | Loan drawn, funds disbursed | All CPs satisfied |
| **Covenant Monitoring** | Ongoing compliance tracking | Loan active |
| **Amendment** | Terms modification in progress | Amendment request |
| **Matured** | Loan fully repaid, facility closed | Final payment |

### Transition Logic

```javascript
// Pseudocode for state transition validation
function canTransition(loan, targetState, user) {
  // 1. Check user role
  if (user.role !== 'AGENT_BANK') {
    return { allowed: false, reason: 'Only Agent Bank can advance stages' };
  }
  
  // 2. Check valid transition
  const validTransitions = STATE_MACHINE[loan.currentState];
  if (!validTransitions.includes(targetState)) {
    return { allowed: false, reason: 'Invalid state transition' };
  }
  
  // 3. Check stage-specific requirements
  const requirements = STAGE_REQUIREMENTS[targetState];
  for (const req of requirements) {
    if (!req.check(loan)) {
      return { allowed: false, reason: req.message };
    }
  }
  
  return { allowed: true };
}
```

### Ledger Event Structure

Each state transition creates an immutable event:

```json
{
  "eventType": "STATE_TRANSITION",
  "loanId": "LOAN-2024-001",
  "fromState": "DOCUMENTATION",
  "toState": "CP_PENDING",
  "timestamp": "2024-12-27T10:30:00Z",
  "performedBy": "agent-bank-user-001",
  "organization": "AgentBank_MSP",
  "transactionId": "tx-abc123...",
  "metadata": {
    "notes": "All facility agreements executed"
  }
}
```

---

## Covenant Monitoring System

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  COVENANT MONITORING                         │
│                                                              │
│  ┌────────────────┐    ┌────────────────┐    ┌───────────┐  │
│  │   Covenant     │    │   Compliance   │    │  Alert    │  │
│  │  Definitions   │───▶│    Engine      │───▶│  System   │  │
│  │  (PostgreSQL)  │    │                │    │           │  │
│  └────────────────┘    └───────┬────────┘    └───────────┘  │
│                                │                             │
│                                ▼                             │
│                       ┌────────────────┐                     │
│                       │ Ledger Events  │                     │
│                       │ • Breaches     │                     │
│                       │ • Waivers      │                     │
│                       │ • Cures        │                     │
│                       └────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

### Covenant Data Model

```typescript
interface Covenant {
  id: string;
  loanId: string;
  type: 'FINANCIAL' | 'INFORMATION' | 'AFFIRMATIVE' | 'NEGATIVE';
  name: string;                    // e.g., "Leverage Ratio"
  threshold: number;               // e.g., 3.5
  operator: 'LT' | 'LTE' | 'GT' | 'GTE' | 'EQ';
  frequency: 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL';
  nextTestDate: Date;
}

interface CovenantStatus {
  covenantId: string;
  status: 'COMPLIANT' | 'AT_RISK' | 'BREACHED';
  currentValue: number;
  testDate: Date;
  reportedBy: string;
}
```

### Compliance States

```
                 ┌─────────────────┐
                 │    COMPLIANT    │
                 │  (Within limit) │
                 └────────┬────────┘
                          │
            Value approaching threshold
                          │
                          ▼
                 ┌─────────────────┐
                 │    AT RISK      │
                 │  (Warning zone) │
                 └────────┬────────┘
                          │
              Threshold exceeded
                          │
                          ▼
                 ┌─────────────────┐
          ┌──────│    BREACHED     │──────┐
          │      │  (Violation)    │      │
          │      └─────────────────┘      │
          │                               │
     Waiver Granted              Cure Achieved
          │                               │
          ▼                               ▼
  ┌───────────────┐              ┌───────────────┐
  │    WAIVED     │              │    CURED      │
  │ (Acknowledged)│              │  (Resolved)   │
  └───────────────┘              └───────────────┘
```

### Ledger Events for Covenants

All covenant status changes are recorded immutably:

- `COVENANT_TEST_SUBMITTED` — New compliance data reported
- `COVENANT_BREACH_DETECTED` — Threshold violated
- `COVENANT_WAIVER_GRANTED` — Lenders waive breach
- `COVENANT_CURE_CONFIRMED` — Breach resolved
- `COVENANT_AMENDMENT_APPROVED` — Terms modified

---

## Document Hashing Approach

### Principle

**Documents are never stored on the ledger.** Only cryptographic hashes are recorded, providing:
- Proof of existence at a specific time
- Tamper evidence (any change invalidates the hash)
- Privacy (document contents remain off-chain)

### Hash Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                       DOCUMENT SUBMISSION                           │
│                                                                     │
│  1. User uploads document via UI                                    │
│                    │                                                │
│                    ▼                                                │
│  2. Client-side SHA-256 hash generation                            │
│     ┌─────────────────────────────────┐                            │
│     │  Document → SHA-256 → Hash      │                            │
│     │  "contract.pdf" → "a3f2b9c..."  │                            │
│     └─────────────────────────────────┘                            │
│                    │                                                │
│                    ▼                                                │
│  3. API receives: { hash, metadata }                               │
│     (Document NOT transmitted to server)                           │
│                    │                                                │
│         ┌─────────┴─────────┐                                      │
│         │                   │                                       │
│         ▼                   ▼                                       │
│  ┌─────────────┐    ┌─────────────────┐                            │
│  │ PostgreSQL  │    │    Ledger       │                            │
│  │             │    │                 │                            │
│  │ • filename  │    │ • hash          │                            │
│  │ • docType   │    │ • timestamp     │                            │
│  │ • loanId    │    │ • submittedBy   │                            │
│  │ • storageRef│    │ • loanId        │                            │
│  └─────────────┘    └─────────────────┘                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Hash Verification

```javascript
// Verification logic (client-side)
async function verifyDocument(file, expectedHash) {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return computedHash === expectedHash;
}
```

### Document Types Tracked

| Document Type | Stage | Required |
|--------------|-------|----------|
| Mandate Letter | Mandated | Yes |
| Credit Memo | Credit Approved | Yes |
| Facility Agreement | Documentation | Yes |
| CP Satisfaction Certificate | CP Pending | Yes |
| Compliance Certificate | Covenant Monitoring | Per covenant |
| Amendment Agreement | Amendment | Yes |
| Payoff Letter | Matured | Yes |

---

## ESG & Green Loan Tracking

### ESG Classification

```
┌─────────────────────────────────────────────────────────────┐
│                   LOAN ESG STATUS                           │
│                                                             │
│  ┌─────────────────┐                                        │
│  │  STANDARD       │  No ESG classification                 │
│  │  (Default)      │                                        │
│  └────────┬────────┘                                        │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────┐                                        │
│  │  GREEN          │  Use of proceeds for green projects   │
│  │                 │  • Renewable energy                    │
│  │                 │  • Energy efficiency                   │
│  │                 │  • Clean transportation                │
│  └─────────────────┘                                        │
│                                                             │
│  ┌─────────────────┐                                        │
│  │  SUSTAINABILITY │  Margin linked to ESG KPIs            │
│  │  LINKED         │  • Carbon emissions                   │
│  │                 │  • Diversity targets                  │
│  │                 │  • Safety metrics                     │
│  └─────────────────┘                                        │
│                                                             │
│  ┌─────────────────┐                                        │
│  │  SOCIAL         │  Use of proceeds for social impact    │
│  │                 │  • Affordable housing                 │
│  │                 │  • Healthcare facilities              │
│  │                 │  • Education infrastructure           │
│  └─────────────────┘                                        │
└─────────────────────────────────────────────────────────────┘
```

### ESG KPI Tracking

```typescript
interface ESGTarget {
  id: string;
  loanId: string;
  kpiName: string;              // e.g., "Scope 1 Emissions"
  baselineValue: number;
  targetValue: number;
  targetDate: Date;
  marginImpact: number;         // bps adjustment on achievement
}

interface ESGReport {
  targetId: string;
  reportingPeriod: string;
  actualValue: number;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'DISPUTED';
  verifiedBy?: string;
  ledgerTxId: string;           // Immutable record reference
}
```

### ESG Ledger Events

- `ESG_CLASSIFICATION_SET` — Loan marked as green/sustainability-linked
- `ESG_KPI_DEFINED` — Target KPI registered
- `ESG_REPORT_SUBMITTED` — Periodic performance data submitted
- `ESG_VERIFICATION_COMPLETED` — Third-party verification recorded
- `ESG_TARGET_ACHIEVED` — KPI milestone met
- `ESG_TARGET_MISSED` — Reporting deadline or target missed

---

## Ownership & Participation Tracking

### Syndicate Structure

```
┌─────────────────────────────────────────────────────────────┐
│                   LOAN OWNERSHIP                            │
│                                                             │
│  Loan: LOAN-2024-001                                        │
│  Facility Amount: $100,000,000                              │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Participant          │ Commitment  │ Share │ Role       ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ Alpha Bank           │ $40,000,000 │ 40%   │ Agent Bank ││
│  │ Beta Capital         │ $30,000,000 │ 30%   │ Lender     ││
│  │ Gamma Investments    │ $20,000,000 │ 20%   │ Lender     ││
│  │ Delta Finance        │ $10,000,000 │ 10%   │ Lender     ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Ownership Change Flow

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Seller     │───▶│   Trade      │───▶│   Buyer      │
│  (Existing   │    │  Settlement  │    │  (New        │
│   Lender)    │    │              │    │   Lender)    │
└──────────────┘    └──────┬───────┘    └──────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │   Ledger Record        │
              │                        │
              │ • Trade ID             │
              │ • Seller Org           │
              │ • Buyer Org            │
              │ • Amount Transferred   │
              │ • Settlement Date      │
              │ • New Participation %  │
              └────────────────────────┘
```

### Ledger Events for Ownership

- `PARTICIPATION_INITIAL` — Original syndicate allocation
- `PARTICIPATION_TRANSFER` — Secondary market trade settled
- `PARTICIPATION_INCREASE` — Commitment increased
- `PARTICIPATION_PAYDOWN` — Principal reduction

---

## Analytics Derivation

### Metrics Calculation

Analytics are derived from ledger events and cached in PostgreSQL for dashboard performance:

```
┌─────────────────────────────────────────────────────────────┐
│                 ANALYTICS PIPELINE                          │
│                                                             │
│  ┌───────────────┐                                          │
│  │ Ledger Events │                                          │
│  │ (Raw Data)    │                                          │
│  └───────┬───────┘                                          │
│          │                                                  │
│          ▼                                                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              AGGREGATION ENGINE                        │  │
│  │                                                        │  │
│  │  • Time in Stage = StateExit.timestamp -              │  │
│  │                    StateEntry.timestamp               │  │
│  │                                                        │  │
│  │  • Covenant Breach Rate = BreachEvents /              │  │
│  │                           TotalTestEvents             │  │
│  │                                                        │  │
│  │  • ESG Compliance = TargetsAchieved /                 │  │
│  │                     TotalTargets                       │  │
│  │                                                        │  │
│  │  • Documentation Cycle Time = CPPending.timestamp -   │  │
│  │                               Documentation.timestamp  │  │
│  └───────────────────────────────────────────────────────┘  │
│          │                                                  │
│          ▼                                                  │
│  ┌───────────────┐                                          │
│  │ PostgreSQL    │                                          │
│  │ (Cached       │                                          │
│  │  Metrics)     │                                          │
│  └───────────────┘                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Key Metrics

| Metric | Derivation | Business Value |
|--------|------------|----------------|
| **Avg. Time per Stage** | Mean duration between state transitions | Identify bottlenecks |
| **CP Satisfaction Rate** | CPs satisfied on first attempt | Process efficiency |
| **Covenant Breach Frequency** | Breaches per loan per quarter | Portfolio risk |
| **ESG Target Achievement** | % of KPIs met | Sustainability performance |
| **Documentation Cycle Time** | Days from mandate to closing | Operational efficiency |
| **Trade Settlement Time** | Days from trade to settlement | Market efficiency |

---

## Security Architecture

### Authentication Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Login     │────▶│   API       │────▶│  Database   │
│   Request   │     │   Auth      │     │  Validate   │
└─────────────┘     └──────┬──────┘     └──────┬──────┘
                          │                    │
                          │◀───────────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │  Generate   │
                   │    JWT      │
                   └──────┬──────┘
                          │
                          ▼
                   Return Token with Claims:
                   {
                     "sub": "user-001",
                     "org": "AgentBank_MSP",
                     "role": "AGENT_BANK",
                     "exp": 1735300000
                   }
```

### Authorization Matrix

| Operation | Agent Bank | Lender | Borrower |
|-----------|-----------|--------|----------|
| Create Loan | ✓ | ✗ | ✗ |
| Advance Stage | ✓ | ✗ | ✗ |
| Submit Document Hash | ✓ | ✓ | ✓ |
| Report Covenant | ✓ | ✗ | ✓ |
| Approve Waiver | ✓ | ✓ | ✗ |
| Submit ESG Report | ✓ | ✗ | ✓ |
| Transfer Participation | ✗ | ✓ | ✗ |
| View Loan Details | ✓ | ✓ | ✓ |
| View Analytics | ✓ | ✓ | ✗ |

---

*This document provides architectural guidance for the ChainFlow platform. Implementation details may vary based on specific deployment requirements.*
