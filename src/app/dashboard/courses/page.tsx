'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { api } from '@/lib/api';
import { LoadingSpinner, EmptyState } from '@/components/UI';
import Toast, { showToast } from '@/components/Toast';
import Link from 'next/link';

interface Course {
    id: string;
    title: string;
    slug: string;
    level: string;
    isPublished: boolean;
    createdAt: string;
    _count: { modules: number; enrollments: number };
}

export default function ManageCoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [level, setLevel] = useState('BEGINNER');
    const [creating, setCreating] = useState(false);
    const { data: session } = useSession();

    const fetchCourses = async () => {
        const res = await api.get<{ courses: Course[] }>('/courses?limit=50');
        if (res.success && res.data) setCourses(res.data.courses);
        setLoading(false);
    };

    useEffect(() => { fetchCourses(); }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        const res = await api.post('/courses', { title, description, level });
        if (res.success) {
            showToast('success', 'Course created!');
            setShowCreate(false);
            setTitle(''); setDescription(''); setLevel('BEGINNER');
            fetchCourses();
        } else {
            showToast('error', res.error?.message || 'Failed');
        }
        setCreating(false);
    };

    const togglePublish = async (course: Course) => {
        const endpoint = course.isPublished ? 'unpublish' : 'publish';
        const res = await api.post(`/courses/${course.id}/${endpoint}`);
        if (res.success) {
            showToast('success', `Course ${endpoint}ed`);
            fetchCourses();
        } else {
            showToast('error', res.error?.message || 'Failed');
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="page-container">
            <Toast />
            <div className="card-header" style={{ marginBottom: '1.5rem' }}>
                <div>
                    <h1 className="page-title">Manage Courses</h1>
                    <p className="page-subtitle" style={{ marginBottom: 0 }}>Create, edit, and publish courses</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
                    + New Course
                </button>
            </div>

            {showCreate && (
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem' }}>Create New Course</h2>
                    <form onSubmit={handleCreate}>
                        <div className="form-group">
                            <label className="form-label">Title</label>
                            <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Course title" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea className="form-textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Course description" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Level</label>
                            <select className="form-select" value={level} onChange={(e) => setLevel(e.target.value)}>
                                <option value="BEGINNER">Beginner</option>
                                <option value="INTERMEDIATE">Intermediate</option>
                                <option value="ADVANCED">Advanced</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button type="submit" className="btn btn-primary" disabled={creating}>
                                {creating ? 'Creating...' : 'Create Course'}
                            </button>
                            <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {courses.length === 0 ? (
                <EmptyState icon="📚" title="No courses yet" message="Create your first course" />
            ) : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Course</th>
                                <th>Level</th>
                                <th>Modules</th>
                                <th>Enrolled</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {courses.map((course) => (
                                <tr key={course.id}>
                                    <td><strong>{course.title}</strong></td>
                                    <td><span className="badge badge-primary">{course.level}</span></td>
                                    <td>{course._count?.modules || 0}</td>
                                    <td>{course._count?.enrollments || 0}</td>
                                    <td>
                                        <span className={`badge ${course.isPublished ? 'badge-success' : 'badge-neutral'}`}>
                                            {course.isPublished ? 'Published' : 'Draft'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <Link href={`/dashboard/courses/${course.id}/builder`}>
                                                <button className="btn btn-secondary btn-sm">Edit</button>
                                            </Link>
                                            <button className="btn btn-ghost btn-sm" onClick={() => togglePublish(course)}>
                                                {course.isPublished ? 'Unpublish' : 'Publish'}
                                            </button>
                                        </div>
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
