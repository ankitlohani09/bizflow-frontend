import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

/**
 * ProtectedRoute – Enforces authentication and Role-Based Access Control (RBAC)
 * 
 * @param {string[]} allowedRoles - List of roles permitted to access this route
 */
export default function ProtectedRoute({ allowedRoles = [] }) {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const token = localStorage.getItem('token');
    
    // 1. Auth Check – require both token and profile
    if (!user || !token) {
        return <Navigate to="/login" replace />;
    }

    // 2. Role Check (if required)
    // Backend returns 'roles' as an array. We check if any user role matches allowedRoles.
    if (allowedRoles.length > 0) {
        const hasAccess = user.roles?.some(role => allowedRoles.includes(role));
        if (!hasAccess) {
            console.warn(`Access denied for roles: ${user.roles?.join(', ')}. Required: ${allowedRoles.join(', ')}`);
            const isAdmin = user.roles?.includes('ADMIN');
            return <Navigate to={isAdmin ? "/tenants" : "/invoices"} replace />;
        }
    }

    return <Outlet />;
}
