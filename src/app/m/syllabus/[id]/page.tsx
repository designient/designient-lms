import { SyllabusBuilder } from '@/components/syllabus/SyllabusBuilder';

export default async function MentorSyllabusPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <SyllabusBuilder courseId={id} portal="mentor" />;
}
