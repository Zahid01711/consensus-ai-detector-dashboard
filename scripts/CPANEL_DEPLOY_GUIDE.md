# cPanel Deployment Guide - Consensus AI Detector Dashboard

## Hosting Details
- **Hosting Provider**: BestWebHostBD (CloudsWebServer)
- **cPanel URL**: https://bst2.cloudswebserver.com:2083
- **Domain**: cliqter.com / ai.cliqter.com
- **Home Directory**: /home/cliqterc/

---

## Step 1: Upload the Deploy ZIP

1. Open cPanel File Manager
2. Navigate to `/home/cliqterc/ai.cliqter.com` (or the public_html folder for the subdomain)
3. Upload `cpanel-deploy.zip` (only 0.2 MB!)
4. Select it → Click **Extract** → Extract to same folder
5. Delete the zip after extracting

---

## Step 2: Setup Node.js App in cPanel

Go to cPanel → **Setup Node.js App** and configure:

| Setting | Value |
|---------|-------|
| Node.js version | 20.x or 22.x (latest LTS) |
| Application mode | Production |
| Application root | `ai.cliqter.com` |
| Application URL | `ai.cliqter.com` |
| Application startup file | `server.js` |

---

## Step 3: Set Environment Variables

In the Node.js app settings, add these environment variables:

```
DATABASE_URL=file:./prisma/prod.db
JWT_SECRET=<generate 32+ random chars, e.g.: a7f2k9p1m3n8q5r6s4t7u2v1w0x8y3z6>
ENCRYPTION_KEY=<generate exactly 64 hex chars>
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://ai.cliqter.com
PORT=<assigned by cPanel - leave blank, cPanel auto-assigns>
SAPLING_API_KEY=2V13OCMOO5RTBKUHCPT4F7IY6CWLK9W6
COPYLEAKS_API_KEY=8d39b0b4-e10f-4994-9b17-252b58cfe8cd
COPYLEAKS_EMAIL=ulislamjahid9@gmail.com
WASITAIGENERATED_API_KEY=wai_cvkrqASo5b27rld2h4MFgo8cu7zCSuiS
```

To generate ENCRYPTION_KEY (run this in Terminal):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

To generate JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## Step 4: Run npm install

In the Node.js App setup page, click the **"Run NPM Install"** button (or use Terminal):
```bash
cd /home/cliqterc/ai.cliqter.com
npm install
```

---

## Step 5: Build the App

In cPanel Terminal:
```bash
cd /home/cliqterc/ai.cliqter.com
npm run build
```

This compiles the Next.js app into `.next/` folder.

---

## Step 6: Initialize the Database

In cPanel Terminal:
```bash
cd /home/cliqterc/ai.cliqter.com
npx prisma db push
npx prisma db seed
```

This creates the SQLite database at `prisma/prod.db` and seeds demo accounts.

---

## Step 7: Start the App

Click the **Start App** button in cPanel Node.js App settings.

The app should now be live at: **https://ai.cliqter.com**

---

## Default Login Credentials (after seeding)

| Role | Email | Password |
|------|-------|---------|
| Admin | admin@school.edu | AdminPass123 |
| Student 1 | student1@school.edu | StudentPass123 |
| Student 2 | student2@school.edu | StudentPass123 |

---

## Troubleshooting

**App won't start / 503 error**:
- Check Node.js version (use 20.x)
- Make sure `npm install` AND `npm run build` have been run
- Check the startup file is `server.js`

**Database errors**:
- Re-run: `npx prisma db push && npx prisma db seed`

**Port already in use**:
- cPanel auto-assigns PORT - make sure you're NOT setting PORT in env variables; let cPanel handle it

**Prisma client errors**:
- Run: `npx prisma generate` then restart the app
