# Orca Client

This folder contains the Next.js app for Orca (landing page / UI companion).

See the main project overview in the root README: `../README.md`.

## Requirements

- Node.js 18+ (LTS recommended)
- npm

## Setup

Install dependencies:

```bash
npm ci
```

Run dev server:

```bash
npm run dev
```

Then open:

- http://localhost:3000

## Environment variables

- `NEXT_PUBLIC_ORCA_REPO`
  - Optional
  - Format: `owner/repo`
  - Default: `vanthaita/Orca`
  - Used to generate links to GitHub, Issues, and Releases on the landing page.

Example (PowerShell):

```powershell
$env:NEXT_PUBLIC_ORCA_REPO="vanthaita/Orca"
npm run dev
```

## Scripts

- `npm run dev` - start dev server
- `npm run build` - build production
- `npm run start` - start production server
- `npm run lint` - run lint
