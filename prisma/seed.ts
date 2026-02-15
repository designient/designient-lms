import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import bcrypt from 'bcryptjs';

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Seeding database...');

    // Clean existing data
    await prisma.auditLog.deleteMany();
    await prisma.grade.deleteMany();
    await prisma.submission.deleteMany();
    await prisma.assignment.deleteMany();
    await prisma.lessonProgress.deleteMany();
    await prisma.enrollment.deleteMany();
    await prisma.lesson.deleteMany();
    await prisma.module.deleteMany();
    await prisma.course.deleteMany();
    await prisma.user.deleteMany();

    const passwordHash = await bcrypt.hash('Password1', 10);

    // Create users
    const admin = await prisma.user.create({
        data: {
            name: 'Admin User',
            email: 'admin@lms.com',
            passwordHash,
            role: 'ADMIN',
            isActive: true,
            emailVerified: true,
        },
    });

    const instructor = await prisma.user.create({
        data: {
            name: 'Jane Instructor',
            email: 'instructor@lms.com',
            passwordHash,
            role: 'INSTRUCTOR',
            isActive: true,
            emailVerified: true,
        },
    });

    const student = await prisma.user.create({
        data: {
            name: 'John Student',
            email: 'student@lms.com',
            passwordHash,
            role: 'STUDENT',
            isActive: true,
            emailVerified: true,
        },
    });

    const student2 = await prisma.user.create({
        data: {
            name: 'Alice Learner',
            email: 'alice@lms.com',
            passwordHash,
            role: 'STUDENT',
            isActive: true,
            emailVerified: true,
        },
    });

    // Create courses
    const webDevCourse = await prisma.course.create({
        data: {
            title: 'Full-Stack Web Development',
            slug: 'full-stack-web-development',
            description:
                'Learn to build modern web applications from scratch using HTML, CSS, JavaScript, React, Node.js, and databases.',
            level: 'BEGINNER',
            isPublished: true,
            createdBy: instructor.id,
        },
    });

    const pythonCourse = await prisma.course.create({
        data: {
            title: 'Python for Data Science',
            slug: 'python-for-data-science',
            description:
                'Master Python fundamentals and learn data analysis with pandas, NumPy, and matplotlib.',
            level: 'INTERMEDIATE',
            isPublished: true,
            createdBy: instructor.id,
        },
    });

    const draftCourse = await prisma.course.create({
        data: {
            title: 'Advanced Cloud Architecture',
            slug: 'advanced-cloud-architecture',
            description: 'Deep dive into cloud infrastructure, microservices, and DevOps practices.',
            level: 'ADVANCED',
            isPublished: false,
            createdBy: admin.id,
        },
    });

    // Modules for Web Dev course
    const mod1 = await prisma.module.create({
        data: { courseId: webDevCourse.id, title: 'HTML & CSS Fundamentals', position: 0 },
    });
    const mod2 = await prisma.module.create({
        data: { courseId: webDevCourse.id, title: 'JavaScript Essentials', position: 1 },
    });
    const mod3 = await prisma.module.create({
        data: { courseId: webDevCourse.id, title: 'React Basics', position: 2 },
    });

    // Lessons for Module 1
    const lesson1 = await prisma.lesson.create({
        data: {
            moduleId: mod1.id,
            title: 'Introduction to HTML',
            contentType: 'TEXT',
            contentBody:
                '<h2>What is HTML?</h2><p>HTML (HyperText Markup Language) is the standard markup language for creating web pages. It describes the structure of a web page using a series of elements.</p><h3>Basic Structure</h3><pre><code>&lt;!DOCTYPE html&gt;\n&lt;html&gt;\n  &lt;head&gt;\n    &lt;title&gt;My Page&lt;/title&gt;\n  &lt;/head&gt;\n  &lt;body&gt;\n    &lt;h1&gt;Hello World&lt;/h1&gt;\n  &lt;/body&gt;\n&lt;/html&gt;</code></pre>',
            position: 0,
        },
    });

    await prisma.lesson.create({
        data: {
            moduleId: mod1.id,
            title: 'CSS Selectors and Properties',
            contentType: 'TEXT',
            contentBody:
                '<h2>CSS Selectors</h2><p>CSS selectors are used to select HTML elements for styling. The most common types are element, class, and ID selectors.</p><pre><code>h1 { color: navy; }\n.highlight { background: yellow; }\n#header { padding: 20px; }</code></pre>',
            position: 1,
        },
    });

    await prisma.lesson.create({
        data: {
            moduleId: mod1.id,
            title: 'Responsive Design with CSS',
            contentType: 'VIDEO',
            contentBody: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            position: 2,
        },
    });

    // Lessons for Module 2
    await prisma.lesson.create({
        data: {
            moduleId: mod2.id,
            title: 'Variables and Data Types',
            contentType: 'TEXT',
            contentBody:
                '<h2>JavaScript Variables</h2><p>JavaScript has three ways to declare variables: <code>var</code>, <code>let</code>, and <code>const</code>.</p><pre><code>let name = "John";\nconst age = 25;\nlet scores = [90, 85, 92];</code></pre>',
            position: 0,
        },
    });

    await prisma.lesson.create({
        data: {
            moduleId: mod2.id,
            title: 'Functions and Scope',
            contentType: 'TEXT',
            contentBody:
                '<h2>Functions</h2><p>Functions are reusable blocks of code. JavaScript supports function declarations, expressions, and arrow functions.</p><pre><code>const greet = (name) => `Hello, ${name}!`;</code></pre>',
            position: 1,
        },
    });

    // Lessons for Module 3
    await prisma.lesson.create({
        data: {
            moduleId: mod3.id,
            title: 'React Components',
            contentType: 'TEXT',
            contentBody:
                '<h2>Components</h2><p>React applications are built from components — reusable pieces of UI. Each component returns JSX that describes what should appear on screen.</p>',
            position: 0,
        },
    });

    // Modules for Python course
    const pyMod1 = await prisma.module.create({
        data: { courseId: pythonCourse.id, title: 'Python Basics', position: 0 },
    });

    await prisma.lesson.create({
        data: {
            moduleId: pyMod1.id,
            title: 'Getting Started with Python',
            contentType: 'TEXT',
            contentBody:
                '<h2>Why Python?</h2><p>Python is a versatile, beginner-friendly programming language widely used in data science, AI, web development, and automation.</p>',
            position: 0,
        },
    });

    // Assignments
    const assignment1 = await prisma.assignment.create({
        data: {
            courseId: webDevCourse.id,
            moduleId: mod1.id,
            title: 'Build a Personal Portfolio Page',
            description:
                'Create a responsive personal portfolio webpage using HTML and CSS. Include sections for About Me, Projects, and Contact. Use semantic HTML elements and CSS Grid or Flexbox for layout.',
            maxScore: 100,
            isPublished: true,
            createdBy: instructor.id,
        },
    });

    await prisma.assignment.create({
        data: {
            courseId: webDevCourse.id,
            moduleId: mod2.id,
            title: 'JavaScript Calculator',
            description:
                'Build a functional calculator using JavaScript. It should support +, -, *, / operations and handle edge cases like division by zero.',
            maxScore: 100,
            isPublished: true,
            createdBy: instructor.id,
        },
    });

    await prisma.assignment.create({
        data: {
            courseId: pythonCourse.id,
            moduleId: pyMod1.id,
            title: 'Data Analysis with Pandas',
            description:
                'Analyze the provided CSV dataset using pandas. Generate summary statistics and create at least 3 visualizations.',
            maxScore: 100,
            isPublished: true,
            createdBy: instructor.id,
        },
    });

    // Enrollment
    const enrollment = await prisma.enrollment.create({
        data: { userId: student.id, courseId: webDevCourse.id },
    });

    await prisma.enrollment.create({
        data: { userId: student2.id, courseId: webDevCourse.id },
    });

    await prisma.enrollment.create({
        data: { userId: student.id, courseId: pythonCourse.id },
    });

    // Lesson progress
    await prisma.lessonProgress.create({
        data: { userId: student.id, lessonId: lesson1.id },
    });

    // Sample submission + grade
    const submission = await prisma.submission.create({
        data: {
            assignmentId: assignment1.id,
            studentId: student.id,
            fileUrl: 'submissions/sample-portfolio.pdf',
            notes: 'Here is my portfolio page. I used CSS Grid for the layout.',
            attemptNo: 1,
            status: 'GRADED',
        },
    });

    await prisma.grade.create({
        data: {
            submissionId: submission.id,
            gradedBy: instructor.id,
            score: 88,
            feedback:
                'Great work! Your layout is clean and responsive. Consider adding hover effects and a dark mode toggle for extra polish.',
        },
    });

    console.log('✅ Seeding complete!');
    console.log('');
    console.log('📧 Test accounts (password: Password1):');
    console.log(`   Admin:      admin@lms.com`);
    console.log(`   Instructor: instructor@lms.com`);
    console.log(`   Student:    student@lms.com`);
    console.log(`   Student 2:  alice@lms.com`);

    // Suppress unused variable warnings
    void enrollment;
    void draftCourse;
}

main()
    .catch((e) => {
        console.error('Seed error:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
