import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { ThemeProvider } from './context/ThemeContext';
import { Loader2 } from 'lucide-react';

// Lazy load all pages
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Customers = lazy(() => import('./pages/Customers'));
const Invoices = lazy(() => import('./pages/Invoices'));
const InvoiceDetails = lazy(() => import('./pages/InvoiceDetails'));
const InvoiceForm = lazy(() => import('./pages/InvoiceForm'));
const Inventory = lazy(() => import('./pages/Inventory'));
const StockMovements = lazy(() => import('./pages/StockMovements'));
const StockHistory = lazy(() => import('./pages/StockHistory'));
const Expenses = lazy(() => import('./pages/Expenses'));
const Staff = lazy(() => import('./pages/Staff'));
const StaffDetails = lazy(() => import('./pages/StaffDetails'));
const Suppliers = lazy(() => import('./pages/Suppliers'));
const Purchases = lazy(() => import('./pages/Purchases'));
const PurchaseForm = lazy(() => import('./pages/PurchaseForm'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Returns = lazy(() => import('./pages/Returns'));
const Settings = lazy(() => import('./pages/Settings'));

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Loading Network...</span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />

            {/* General access routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/invoices/new" element={<InvoiceForm />} />
              <Route path="/invoices/:id" element={<InvoiceDetails />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/stock-movements" element={<StockMovements />} />
              <Route path="/inventory/history" element={<StockHistory />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/purchases" element={<Purchases />} />
              <Route path="/purchases/new" element={<PurchaseForm />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/returns" element={<Returns />} />
            </Route>

            {/* Admin and Owner Only */}
            <Route element={<ProtectedRoute allowedRoles={['OWNER', 'ADMIN']} />}>
              <Route path="/staff" element={<Staff />} />
              <Route path="/staff/:id" element={<StaffDetails />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* Default: redirect root to /dashboard (ProtectedRoute handles auth check) */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  );
}