import { SyllabusBuilder } from '@/components/syllabus/SyllabusBuilder';

export default async function CourseBuilderPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <SyllabusBuilder courseId={id} portal="admin" />;
}
