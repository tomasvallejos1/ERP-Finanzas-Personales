# ERP Finanzas Personales

## Estructura del proyecto

```
ERP Finanzas Personales/
├── database/
│   └── init.sql              ← Esquema PostgreSQL + funciones SQL
├── backend/
│   ├── package.json
│   ├── .env
│   └── src/
│       ├── index.js
│       ├── app.js
│       ├── config/supabase.js
│       ├── controllers/
│       │   ├── movimientos.controller.js
│       │   └── dashboard.controller.js
│       ├── middlewares/validator.js
│       └── routes/
│           ├── health.routes.js
│           ├── movimientos.routes.js
│           └── dashboard.routes.js
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── .env
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── services/api.js
        ├── components/DashboardCard.jsx
        └── pages/Dashboard.jsx
```

## Correr el proyecto

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev  # → http://localhost:5173
```
