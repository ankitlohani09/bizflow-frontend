import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import authService from '../services/authService';

/**
 * ProtectedRoute
 *
 * Wraps any route that requires authentication.
 * If no token is found in localStorage → redirects to /login.
 * If authenticated → renders the child route (via <Outlet />).
 *
 * Usage in router:
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="/dashboard" element={<Dashboard />} />
 *   </Route>
 */
export default function ProtectedRoute() {
    if (!authService.isAuthenticated()) {
        // replace: true means the login page won't be in browser history
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}
