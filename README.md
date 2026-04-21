# TMS — Transport Management System

## Démarrage rapide

### Prérequis
- Node.js 18+
- PostgreSQL (créer la DB `tms_db_new`)

### Backend (NestJS)
```bash
cd backend
cp .env .env.local   # adapter les variables DB
npm run start:dev
# Seed (premier lancement) :
npx ts-node -r tsconfig-paths/register src/seed.ts
```
API: http://localhost:3001/api  
Swagger: http://localhost:3001/api/docs

### Frontend (React)
```bash
cd frontend
npm start
```
App: http://localhost:3000

### Compte par défaut (après seed)
- Email: admin@tms.com
- Password: Admin123!

## Stack
- Backend: NestJS + TypeORM + PostgreSQL + JWT
- Frontend: React + TypeScript + Ant Design + dnd-kit
