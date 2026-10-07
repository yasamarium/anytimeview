# AnytimeView — Minimalist Stream & Document Vault

AnytimeView is a high-performance, minimalist media streaming and document reading platform with a geo-distributed database architecture synchronized across three core nodes:

1. **Kolkata Edge Cluster (India)** — Primary Ingestion Hub & APAC Edge CDN.
2. **Israel Security Gateway (Tel Aviv)** — Cryptographic Ledger & Object Vault Replication.
3. **US Central Core (Virginia, USA)** — Global Failover & High-Bandwidth Redundant Media Archive.

---

## 🌟 Key Features

- **Inline Zero-Reload Player**:
  - **Video Streaming**: Responsive HTML5 video player with sleek controls and instant buffering.
  - **High-Res Images**: Gallery & lightbox view with zoom, aspect ratio preservation, and direct download.
  - **Inline PDF Reader**: Embedded document viewer allowing users to read multi-page PDFs directly inside the website without downloading first.
- **Database in Map**:
  - Interactive, dynamic world map showing live cluster telemetry across Kolkata, Israel, and US States.
  - Live node latency ping tests, uptime status, and replication metrics.
- **Admin Access Control (`/admin`)**:
  - Protected by security passkey: `123as`.
  - Secure drag-and-drop uploader supporting Video, Image, and PDF formats.
  - One-click deletion across the distributed network.
- **Zero-Config Deployment**:
  - Optimized for instantaneous deployment on Vercel.

---

## 🚀 Getting Started

### Local Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Environment Variables (Optional)
```env
# Optional override if configuring external master credentials
GITHUB_TOKEN=your_token_here
GITHUB_OWNER=yasamarium
```

---

## 🔐 Admin Authentication
- Visit `/admin`
- Enter passkey: `123as`
