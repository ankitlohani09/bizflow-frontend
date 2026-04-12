import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Invoices from './pages/Invoices';
import InvoiceDetails from './pages/InvoiceDetails';
import InvoiceForm from './pages/InvoiceForm';
import Inventory from './pages/Inventory';
import StockHistory from './pages/StockHistory';
import Expenses from './pages/Expenses';
import Staff from './pages/Staff';
import Suppliers from './pages/Suppliers';
import Purchases from './pages/Purchases';
import PurchaseForm from './pages/PurchaseForm';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import ProtectedRoute from './components/ProtectedRoute';

/**
 * App – root router
 *
 * Routes:
 *   /            → redirects to /dashboard
 *   /login       → Login page (public)
 *   /dashboard   → Dashboard (protected – needs JWT)
 *
 * Adding a new protected page:
 *   1. Create the page component in src/pages/
 *   2. Add a new <Route> inside the <Route element={<ProtectedRoute />}> block
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes – redirect to /login if not authenticated */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/invoices/new" element={<InvoiceForm />} />
          <Route path="/invoices/:id" element={<InvoiceDetails />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/inventory/history" element={<StockHistory />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/purchases/new" element={<PurchaseForm />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
          {/* Add more protected routes here as the app grows */}
        </Route>

        {/* Default: redirect root to /dashboard (ProtectedRoute handles auth check) */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}