# Contributing to Consensus AI Detector Dashboard

Thank you for your interest in contributing to the **Consensus AI Detector Dashboard**! We welcome bug reports, feature requests, documentation improvements, and pull requests.

---

## 🛠️ Local Development Setup

To get started on your development machine, follow these steps:

1. **Fork the Repository**: Fork this repository on GitHub and clone your fork locally.
2. **Install Packages**:
   ```bash
   npm install
   ```
3. **Switch to SQLite (Local Database)**:
   ```bash
   # On Windows (PowerShell)
   powershell -ExecutionPolicy Bypass -File .\switch-to-sqlite.ps1
   ```
4. **Prisma Setup**: Initialize your local database file and run seed scripts:
   ```bash
   npx prisma db push
   npx prisma db seed
   ```
5. **Run Dev Mode**:
   ```bash
   npm run dev
   ```

---

## 🔌 Adding a New Detector Adapter

If you want to integrate a new AI detector provider (e.g. Winston AI, ZeroGPT, Writer):

1. **Define Your Interface**: Make sure your adapter matches the `ProviderAdapter` type in `src/lib/adapters/types.ts`.
2. **Create the Adapter File**: Add your integration script inside `src/lib/adapters/[providerName].ts`.
3. **Register the Adapter**: Import and export your adapter inside `src/lib/adapters/index.ts`.
4. **Seed Database Config**: Add your key to the `PROVIDERS` list in `prisma/seed.ts` so it gets seeded automatically when the user resets their database.

---

## 📈 Pull Request Guidelines

Before submitting a Pull Request, please ensure:

* **Clean Code**: Follow established formatting conventions. Run ESLint (`npm run lint`) to check for errors.
* **No Hardcoded Keys**: Make sure you never hardcode any API credentials in any file. All keys should load via `process.env`.
* **Database Agnostic**: Test changes using the SQLite fallback to ensure compatibility.
* **Descriptive Commits**: Use clean, descriptive commit messages describing the changes.
* **One Feature Per Branch**: Keep your pull requests focused on a single issue or feature.
