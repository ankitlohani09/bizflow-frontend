import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import ProtectedRoute from './components/ProtectedRoute';
import { ThemeProvider } from './context/ThemeContext';
import { Loader2 } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

// Lazy load all pages
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Customers = lazy(() => import('./pages/Customers'));
const Invoices = lazy(() => import('./pages/Invoices'));
const InvoiceDetails = lazy(() => import('./pages/InvoiceDetails'));
const InvoiceForm = lazy(() => import('./pages/InvoiceForm'));
const Inventory = lazy(() => import('./pages/Inventory'));
const InventoryDetails = lazy(() => import('./pages/InventoryDetails'));
const StockMovements = lazy(() => import('./pages/StockMovements'));
const StockHistory = lazy(() => import('./pages/StockHistory'));
const Expenses = lazy(() => import('./pages/Expenses'));
const Staff = lazy(() => import('./pages/Staff'));
const StaffDetails = lazy(() => import('./pages/StaffDetails'));
const Suppliers = lazy(() => import('./pages/Suppliers'));
const Purchases = lazy(() => import('./pages/Purchases'));
const PurchaseForm = lazy(() => import('./pages/PurchaseForm'));
const PurchaseDetails = lazy(() => import('./pages/PurchaseDetails'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Returns = lazy(() => import('./pages/Returns'));
const ReturnDetails = lazy(() => import('./pages/ReturnDetails'));
const Settings = lazy(() => import('./pages/Settings'));
const KitchenOrders = lazy(() => import('./pages/KitchenOrders'));
const AiInsights = lazy(() => import('./pages/AiInsights'));
const Logs = lazy(() => import('./pages/Logs'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Tenants = lazy(() => import('./pages/Tenants'));
const TenantDetails = lazy(() => import('./pages/TenantDetails'));
const PublicCheckIn = lazy(() => import('./pages/PublicCheckIn'));

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="h-16 w-16 rounded-2xl border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
          <Loader2 className="absolute inset-0 m-auto h-6 w-6 text-indigo-500 animate-pulse" />
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500 animate-pulse">Initializing</span>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mt-1">BizFlow Enterprise</span>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Toaster position="top-right" reverseOrder={false} containerStyle={{ zIndex: 99999 }} />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <AnimatePresence mode="wait">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/check-in/:tenantCode" element={<PublicCheckIn />} />

              {/* Shared Access (Including ADMIN for Dashboard) */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'OWNER', 'MANAGER']} />}>
                <Route path="/dashboard" element={<Dashboard />} />
              </Route>

              {/* Operational & Billing Access (All Staff) */}
              <Route element={<ProtectedRoute allowedRoles={['OWNER', 'MANAGER', 'CASHIER']} />}>
                <Route path="/customers" element={<Customers />} />
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/invoices/new" element={<InvoiceForm />} />
                <Route path="/invoices/:id" element={<InvoiceDetails />} />
                <Route path="/returns" element={<Returns />} />
                <Route path="/returns/:id" element={<ReturnDetails />} />
                <Route path="/kitchen-orders" element={<KitchenOrders />} />
                <Route path="/settings" element={<Settings />} />
              </Route>

              {/* Managerial & Inventory Access (Excluding Billing Staff) */}
              <Route element={<ProtectedRoute allowedRoles={['OWNER', 'MANAGER']} />}>
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/inventory/:id" element={<InventoryDetails />} />
                <Route path="/stock-movements" element={<StockMovements />} />
                <Route path="/inventory/history" element={<StockHistory />} />
                <Route path="/expenses" element={<Expenses />} />
                <Route path="/suppliers" element={<Suppliers />} />
                <Route path="/purchases" element={<Purchases />} />
                <Route path="/purchases/new" element={<PurchaseForm />} />
                <Route path="/purchases/:id" element={<PurchaseDetails />} />
                <Route path="/analytics" element={<Analytics />} />
              </Route>

              {/* Owner Only Modules */}
              <Route element={<ProtectedRoute allowedRoles={['OWNER']} />}>
                <Route path="/staff" element={<Staff />} />
                <Route path="/staff/:id" element={<StaffDetails />} />
                <Route path="/ai-insights" element={<AiInsights />} />
                <Route path="/logs" element={<Logs />} />
              </Route>

              {/* Platform Management Only */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route path="/tenants" element={<Tenants />} />
                <Route path="/tenants/:id" element={<TenantDetails />} />
              </Route>

              {/* Default: redirect root to /dashboard (ProtectedRoute handles auth check) */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  );
}