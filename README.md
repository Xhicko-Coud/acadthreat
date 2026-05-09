
```md
# AcadThreat

AcadThreat is a web-based Cyber Threat Intelligence dashboard designed for real-time monitoring, analysis, and visualization of cyber threats within academic network environments.

The system helps security administrators collect threat intelligence, ingest network/security logs, detect suspicious activities, prioritize threats using severity scoring, and visualize security events through an interactive dashboard.

---

## Project Title

**Web-Based Cyber Threat Intelligence Dashboard for Real-Time Monitoring of Academic Network Threats**

---

## Overview

Academic institutions operate open and highly connected digital environments used by students, staff, researchers, and external users. This openness increases exposure to cybersecurity threats such as phishing, brute-force attacks, malware, ransomware, suspicious login behavior, and malicious network traffic.

AcadThreat provides a centralized monitoring platform that combines internal log analysis with external cyber threat intelligence indicators to improve threat visibility and decision-making.

This project is built as an MVP for academic research and demonstration purposes.

---

## Core Features

- Secure admin login
- Protected dashboard access
- Threat intelligence indicator management
- Log ingestion and normalization
- Threat correlation with known indicators of compromise
- Rule-based anomaly detection
- Threat severity scoring
- Threat event management
- Real-time dashboard overview
- Threat trend visualization
- Recent security activity feed
- Simulated security logs for testing and demonstration

---

## System Modules

### 1. Platform Foundation & App Shell

Provides the base application structure, admin layout, login route, global providers, navigation shell, and Convex connection.

### 2. Authentication & Access Control

Handles secure admin login, session management, trusted internal user registration, and role-based access control.

### 3. Threat Intelligence Feed Sources

Stores and manages threat intelligence sources such as AbuseIPDB, AlienVault OTX, URLHaus, PhishTank, and manual indicators.

### 4. Threat Indicator Repository

Stores known malicious IP addresses, domains, URLs, and file hashes for later correlation with security logs.

### 5. Secure Log Ingestion

Receives authentication logs, firewall logs, and web server logs through controlled ingestion endpoints.

### 6. Log Normalization

Converts raw logs from different sources into a consistent event format for analysis.

### 7. Threat Correlation Engine

Matches normalized events against known threat indicators to detect malicious activity.

### 8. Anomaly Detection Engine

Detects suspicious activity patterns such as repeated failed logins, brute-force attempts, blocked traffic spikes, and suspicious web requests.

### 9. Severity Scoring Engine

Assigns risk scores and severity levels to detected threats.

### 10. Threat Management Dashboard

Displays detected threats, severity levels, statuses, related indicators, and investigation details.

### 11. Analytics & Visualization

Provides charts, summaries, and trends for threat monitoring and decision support.

### 12. Simulation & Demo Data

Generates sample logs and threat scenarios for development, testing, and academic demonstration.

---

## Tech Stack

- **Frontend:** Next.js, React, TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn UI
- **Backend/Data Layer:** Convex
- **Authentication:** Better Auth with Convex integration
- **Charts:** Recharts
- **Icons:** Lucide React
- **Deployment:** Vercel

---

## Planned Architecture

```txt
Security Logs / Threat Feeds
        ↓
Log Ingestion
        ↓
Raw Log Storage
        ↓
Normalization
        ↓
Correlation + Anomaly Detection
        ↓
Severity Scoring
        ↓
Threat Events
        ↓
Dashboard Visualization
```

---

## Installation

Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/acadthreat.git
```

Move into the project folder:

```bash
cd acadthreat
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Start Convex development server:

```bash
npx convex dev
```

---

## Environment Variables

Create a `.env.local` file in the project root.

```env
NEXT_PUBLIC_CONVEX_URL=

BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
```

Do not commit real secrets to GitHub.

---

## Development Commands

Run the local development server:

```bash
npm run dev
```

Run TypeScript check:

```bash
npx tsc --noEmit
```

Run lint check:

```bash
npm run lint
```

Create production build:

```bash
npm run build
```

---

## Project Structure

```txt
src/
  app/
    login/
    (protected)/
      admin/
        dashboard/

  components/
    layout/
    shared/
    ui/

  config/

  lib/

convex/
  schema.ts
  health.ts
```

---

## Security Notes

This project follows a security-first design approach.

Key rules:

* No public user registration
* Users are created internally by trusted administrators
* Protected pages require authentication
* Sensitive data must not be exposed to the frontend
* Raw tokens and secrets must never be displayed
* Backend authorization must be enforced through Convex functions
* Environment secrets must never be committed

---

## MVP Scope

The MVP focuses on proving the core research objectives:

* Collecting and processing cybersecurity logs
* Managing threat intelligence indicators
* Detecting suspicious activity
* Scoring threat severity
* Displaying security events through a dashboard
* Demonstrating monitoring using simulated academic network logs

The MVP does not aim to replace a full enterprise SIEM system.

---

## Future Improvements

* Live integration with threat intelligence APIs
* More advanced anomaly detection
* Machine learning-based threat prediction
* Multi-institution support
* Advanced reporting and export tools
* Email/SMS alert notifications
* Incident response workflow
* Audit log dashboard
* User activity monitoring

---

## Academic Purpose

This project supports research and implementation for an academic cybersecurity system focused on improving threat monitoring in university and academic network environments.

It demonstrates how cyber threat intelligence, log analysis, anomaly detection, severity scoring, and dashboard visualization can be combined into a unified monitoring platform.

---

## License

This project is for academic and educational use.

```

```
