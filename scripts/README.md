# Platform Automation & Diagnostic Scripts

This directory contains utility scripts to manage, seed, configure, and diagnose the Consolidated AI Detection Dashboard.

---

## 🛠️ Scripts Reference

### 1. `scripts/update_keys.ts`
* **Purpose**: Updates and encrypts API keys for Sapling and Copyleaks in the active database.
* **API Keys Used**: Reads `SAPLING_API_KEY`, `COPYLEAKS_API_KEY`, and `COPYLEAKS_EMAIL` from your local `.env` file.
* **Run Command**:
  ```bash
  npx tsx scripts/update_keys.ts
  ```

### 2. `scripts/activate_wasitaigenerated.ts`
* **Purpose**: Confirms WasItAIGenerated is active, encrypts its credentials, and disables the offline Copyleaks provider.
* **API Keys Used**: Reads `WASITAIGENERATED_API_KEY` from your local `.env` file.
* **Run Command**:
  ```bash
  npx tsx scripts/activate_wasitaigenerated.ts
  ```

### 3. `scripts/disable_copyleaks.ts`
* **Purpose**: Disables the Copyleaks AI detector configuration (which requires an enterprise plan) and removes related student permissions.
* **Run Command**:
  ```bash
  npx tsx scripts/disable_copyleaks.ts
  ```

### 4. `scripts/grant_permissions.ts`
* **Purpose**: Evaluates student user accounts and assigns permitted access to the active Sapling and WasItAIGenerated providers.
* **Run Command**:
  ```bash
  npx tsx scripts/grant_permissions.ts
  ```

### 5. `scripts/test_connections.ts`
* **Purpose**: Diagnoses and tests the network connection and scan output for active provider configurations.
* **Run Command**:
  ```bash
  npx tsx scripts/test_connections.ts
  ```

### 6. `scripts/check_status.ts`
* **Purpose**: Performs a quick console status check on the SQLite database, printing provider statuses and details on recent scans.
* **Run Command**:
  ```bash
  npx tsx scripts/check_status.ts
  ```

### 7. `scripts/create_zip.py`
* **Purpose**: Packages the codebase, docs, and configurations into `ai-detection-dashboard.zip`, automatically excluding build caches, node modules, local database locks, and private mastermind logs.
* **Run Command**:
  ```bash
  python scripts/create_zip.py
  ```

### 8. `scripts/generate_student_report.py`
* **Purpose**: Compiles a highly detailed operations report PDF (`doc/project_report.pdf`) using ReportLab.
* **Run Command**:
  ```bash
  python scripts/generate_student_report.py
  ```
