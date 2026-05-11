import React from 'react';
import AdminDashboard from './AdminDashboard';
import OwnerDashboard from './OwnerDashboard';

export default function Dashboard() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = user.roles?.includes('ADMIN');

    if (isAdmin) {
        return <AdminDashboard />;
    }

    return <OwnerDashboard />;
}
