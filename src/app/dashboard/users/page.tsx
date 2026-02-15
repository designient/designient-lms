'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { LoadingSpinner, EmptyState } from '@/components/UI';
import Toast, { showToast } from '@/components/Toast';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    emailVerified: boolean;
    createdAt: string;
}

export default function UserManagementPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');

    const fetchUsers = async () => {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (roleFilter) params.set('role', roleFilter);
        params.set('limit', '50');

        const res = await api.get<{ users: User[] }>(`/admin/users?${params}`);
        if (res.success && res.data) setUsers(res.data.users);
        setLoading(false);
    };

    useEffect(() => { fetchUsers(); }, [roleFilter]); // eslint-disable-line react-hooks/exhaustive-deps

    const changeRole = async (userId: string, role: string) => {
        const res = await api.patch(`/admin/users/${userId}/role`, { role });
        if (res.success) { showToast('success', 'Role updated'); fetchUsers(); }
        else showToast('error', res.error?.message || 'Failed');
    };

    const toggleActive = async (userId: string, isActive: boolean) => {
        const res = await api.patch(`/admin/users/${userId}/active`, { isActive });
        if (res.success) { showToast('success', isActive ? 'User activated' : 'User deactivated'); fetchUsers(); }
        else showToast('error', res.error?.message || 'Failed');
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="page-container">
            <Toast />
            <h1 className="page-title">User Management</h1>
            <p className="page-subtitle">Manage platform users, roles, and access</p>

            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <input className="form-input" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchUsers()} style={{ flex: 1, minWidth: '200px' }} />
                <select className="form-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ width: '160px' }}>
                    <option value="">All Roles</option>
                    <option value="STUDENT">Student</option>
                    <option value="INSTRUCTOR">Instructor</option>
                    <option value="ADMIN">Admin</option>
                </select>
                <button className="btn btn-primary" onClick={fetchUsers}>Search</button>
            </div>

            {users.length === 0 ? (
                <EmptyState icon="👥" title="No users found" />
            ) : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Verified</th>
                                <th>Joined</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td><strong>{user.name}</strong></td>
                                    <td style={{ color: 'var(--color-text-secondary)' }}>{user.email}</td>
                                    <td>
                                        <select className="form-select" value={user.role} onChange={(e) => changeRole(user.id, e.target.value)} style={{ width: '130px', padding: '0.25rem 0.5rem', fontSize: '0.8125rem' }}>
                                            <option value="STUDENT">Student</option>
                                            <option value="INSTRUCTOR">Instructor</option>
                                            <option value="ADMIN">Admin</option>
                                        </select>
                                    </td>
                                    <td>
                                        <span className={`badge ${user.isActive ? 'badge-success' : 'badge-danger'}`}>
                                            {user.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>{user.emailVerified ? '✅' : '❌'}</td>
                                    <td style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td>
                                        <button className={`btn btn-sm ${user.isActive ? 'btn-danger' : 'btn-primary'}`} onClick={() => toggleActive(user.id, !user.isActive)}>
                                            {user.isActive ? 'Deactivate' : 'Activate'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
