# 🛡️ PatchForge (Audit & Monitor)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Frontend](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel)](https://patchforgefrontend.vercel.app/)
[![Backend](https://img.shields.io/badge/Backend-Render-informational?logo=render)](https://patchforge-backend-boe7.onrender.com)
[![SDK](https://img.shields.io/badge/Harness-TrueForge-purple)](https://github.com/p920750/PatchForge)

PatchForge is an automated AI-driven vulnerability detection, sandbox execution, and patch generation platform designed to secure modern software supply chains seamlessly. Built on the **TrueForge** agentic framework, PatchForge autonomously scans codebases for known CVE vulnerabilities, validates patch fixes inside isolated **Daytona** sandboxes, and verifies code quality via **Qodo** before generating pull-request-ready remediations.

---

## 🌐 Live Deployments

* **Frontend Dashboard**: [https://patchforgefrontend.vercel.app/](https://patchforgefrontend.vercel.app/)
* **Express Backend API**: [https://patchforge-backend-boe7.onrender.com](https://patchforge-backend-boe7.onrender.com)

---

## 🎥 Demonstration

📽️[Watch the video](https://drive.google.com/file/d/1GFoTIkrln9d1ZwxFiCdxN_770_OzDg56/view?usp=sharing)

> *Note: A local video file (`demo.mp4`) is also included in the root directory of this repository for offline viewing.*

---

## 🎯 Relevance & Problem Statement

In modern Software Supply Chain Security and DevSecOps, manual security patching remains a major operational bottleneck. Organizations face increasing rates of zero-day vulnerabilities and critical CVE disclosures, but patching processes are hampered by:

- **Slow Mean Time to Remediation (MTTR)**: SecOps and developer teams spend days or weeks manually reproducing vulnerabilities, updating dependencies, and running regression tests.
- **Local Machine & Production Execution Risks**: Running unverified patches or third-party exploit code locally poses severe security risks to developer environments.
- **Lack of Real-Time Auditability**: Traditional automated dependency bots often act as black boxes, failing to stream live containerized execution logs or verification steps back to security engineers.

PatchForge solves these pain points by orchestrating automated, agentic patching pipelines in secure, isolated sandboxes with full real-time audit transparency.

---

## 📊 Comparison with Existing Tools

| Feature | Dependabot | Snyk | Manual Code Reviews | **PatchForge** |
| :--- | :---: | :---: | :---: | :---: |
| **Real-time Agentic Patching** | ❌ (Static PRs) | ❌ (Alerts & Static PRs) | ❌ (Manual Fixes) | **✅ Autonomous Agent** |
| **Isolated Sandbox Execution** | ❌ | ❌ | ❌ | **✅ Daytona Sandbox** |
| **Automated Code Review & Quality Guard** | ❌ | ❌ | ⚠️ (Time Consuming) | **✅ Qodo AI Verification** |
| **End-to-End Live Audit Streaming** | ❌ | ❌ | ❌ | **✅ Live Audit Stream** |

---

## 👥 Target Audience & Key Benefits

### **Target Audience**
- **Security Engineers**: Automate CVE verification and patch validation without risk to internal infrastructure.
- **DevSecOps Teams**: Embed real-time vulnerability scanning and automated remediation into CI/CD pipelines.
- **Open-Source Maintainers**: Keep open-source repositories secure against zero-days with minimal manual maintenance overhead.
- **Enterprise Developers**: Ensure dependency upgrades never break production unit test suites.

### **Key Benefits**
- ⚡ **Drastically Reduced MTTR**: Cut vulnerability remediation from days down to seconds.
- 🛡️ **Zero Local Machine Risk**: All test suites and dependency upgrades execute strictly inside isolated Daytona containers.
- 🤖 **Pull-Request-Ready Fixes**: Automatically verified patches with quality guarantees from Qodo.
- 👁️ **Transparent Live Auditing**: Stream real-time sandbox logs, container boot times, and test results straight to the dashboard.

---

## 🔍 Scope & Scale

### **Current Capabilities**
- **CVE-Targeted Scanning**: Automated detection and resolution targeting disclosed vulnerabilities (e.g., `CVE-2026-2137`).
- **Sandbox Enforcement**: Execution of dependency tests inside containerized Daytona sandboxes before patch approval.
- **Live Audit Monitoring**: Real-time log streaming and status updates on the Next.js frontend.

### **Scalable Architecture**
- **Decoupled Monorepo Structure**: Independent Next.js 14 frontend (`/dashboard`) and Express API backend (`/src`).
- **Serverless Frontend**: Edge-rendered Next.js dashboard hosted on Vercel with automatic global CDN distribution.
- **Containerized Backend Runners**: Microservice API running on Node.js/Express, hosted on Render with scalable keep-alive workers.

---

## ⚙️ Environment Variables Setup

To run PatchForge locally or deploy it to production, configure the environment variables as shown below:

### **Backend (`/` or root `.env`)**
```bash
# Server Configuration
PORT=10000
NODE_ENV=development

# CORS Allowed Origins
FRONTEND_URL=https://patchforgefrontend.vercel.app

# Integration Keys (Optional - default runs in mock execution mode)
TRUEFORGE_API_KEY=
DAYTONA_SANDBOX_KEY=
QODO_API_KEY=
```

### **Frontend (`dashboard/.env.local`)**
```bash
# API Gateway Endpoint (Exposed to Client)
NEXT_PUBLIC_API_URL=https://patchforge-backend-boe7.onrender.com
```

---

## 🏗️ Architecture & Working Mechanism

```
┌──────────────────────────────┐
│  Next.js 14 Dashboard        │
│  (https://patchforge...)     │
└──────────────┬───────────────┘
               │ 1. Trigger POST /scan-and-patch
               ▼
┌──────────────────────────────┐
│  Express API Server          │
│  (https://patchforge-backend)│
└──────────────┬───────────────┘
               │ 2. Instantiate TrueForge Agent
               ▼
┌──────────────────────────────┐
│  TrueForge SDK / Agent Core │
└──────────────┬───────────────┘
               │ 3. Execute Isolated Testing
               ▼
┌──────────────────────────────┐
│  Daytona Sandbox Container   │
│  (Runs unit tests safely)   │
└──────────────┬───────────────┘
               │ 4. Quality Audit & Review
               ▼
┌──────────────────────────────┐
│  Qodo Automated Review       │
└──────────────┬───────────────┘
               │ 5. Live Stream Status & Logs
               ▼
┌──────────────────────────────┐
│  Real-Time Audit Monitor     │
└──────────────┬───────────────┘
```

### **Step-by-Step Workflow**
1. **Trigger**: The user initiates a scan and patch request from the Next.js Dashboard (`/dashboard`).
2. **Orchestration**: The Express API backend receives the payload (`repo`, `issueId`) and instantiates the `patchforge-agent` via TrueForge SDK.
3. **Sandbox Execution**: The TrueForge runner executes dependency updates and unit tests inside an isolated Daytona sandbox.
4. **Patch Verification**: Qodo AI reviews code diffs and verifies patch integrity to prevent breaking changes.
5. **Streaming**: Real-time execution logs and run IDs are returned to the Next.js dashboard monitor.

---

## ⚡ Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Vercel
- **Backend**: Node.js, Express, TypeScript, `tsx`, Render
- **Security & Sandbox Engine**: TrueForge SDK, Daytona Sandbox, Qodo AI Review

---

## 📂 Repository Structure

```
PatchForge/
├── dashboard/                 <-- Next.js 14 Frontend Application
│   ├── package.json           <-- Frontend dependencies & scripts
│   ├── next.config.mjs        <-- Next.js configuration
│   ├── tsconfig.json
│   └── src/app/               <-- App router (page.tsx, layout.tsx, globals.css)
├── src/                       <-- Express API Backend
│   ├── index.ts               <-- Server entry point (/health, /scan-and-patch, /)
│   └── mockVulnerability.ts   <-- Daytona sandbox & CVE mock definitions
├── agent.json                 <-- TrueForge Agent configuration manifest
├── package.json               <-- Root package config
└── tsconfig.json              <-- Root TypeScript compiler configuration
```

---

## 🚀 Local Setup & Quickstart

### **1. Clone Repository**
```bash
git clone https://github.com/p920750/PatchForge.git
cd PatchForge
```

### **2. Start Express Backend API**
```bash
npm install
npm run dev
# Server running at http://localhost:3000
```

### **3. Start Next.js Dashboard**
```bash
cd dashboard
npm install
npm run dev
# Dashboard running at http://localhost:3001 (or default Next port)
```

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).

