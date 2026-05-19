import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─── Seed data ────────────────────────────────────────────────

async function main() {
  console.log('🌱  Starting database seed...\n');

  // ── 1. Admin user ──────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@tutorly.lk' },
    update: {},
    create: {
      email: 'admin@tutorly.lk',
      passwordHash: adminPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'ADMIN',
      isActive: true,
      isVerified: true,
    },
  });
  console.log(`✅  Admin created:   ${admin.email}`);

  // ── 2. Teacher user ────────────────────────────────────────
  const teacherPassword = await bcrypt.hash('Teacher@123', 12);
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@tutorly.lk' },
    update: {},
    create: {
      email: 'teacher@tutorly.lk',
      passwordHash: teacherPassword,
      firstName: 'Nimesh',
      lastName: 'Perera',
      role: 'TEACHER',
      phone: '+94771234567',
      isActive: true,
      isVerified: true,
    },
  });
  console.log(`✅  Teacher created: ${teacher.email}`);

  // Teacher profile
  const teacherProfile = await prisma.teacherProfile.upsert({
    where: { userId: teacher.id },
    update: {},
    create: {
      userId: teacher.id,
      bio: 'Senior software engineer with 10+ years of experience teaching programming and mathematics.',
      subjects: ['Mathematics', 'Programming', 'Physics'],
      qualifications: ['BSc Computer Science (University of Moratuwa)', 'MSc Data Science'],
      experience: 10,
      rating: 4.8,
      isVerified: true,
    },
  });
  console.log(`✅  Teacher profile created`);

  // ── 3. Student user ────────────────────────────────────────
  const studentPassword = await bcrypt.hash('Student@123', 12);
  const student = await prisma.user.upsert({
    where: { email: 'student@tutorly.lk' },
    update: {},
    create: {
      email: 'student@tutorly.lk',
      passwordHash: studentPassword,
      firstName: 'Kasun',
      lastName: 'Silva',
      role: 'STUDENT',
      phone: '+94779876543',
      isActive: true,
      isVerified: true,
    },
  });
  console.log(`✅  Student created: ${student.email}`);

  // ── 4. Sample courses ──────────────────────────────────────
  const course1 = await prisma.course.upsert({
    where: { id: 'seed-course-01' },
    update: {},
    create: {
      id: 'seed-course-01',
      title: 'Complete Mathematics for A/L Students',
      description:
        'A comprehensive course covering all topics required for Sri Lankan Advanced Level Mathematics examination. Includes Pure Mathematics, Applied Mathematics, and Statistics.',
      shortDesc: 'Master A/L Mathematics with expert guidance',
      teacherId: teacherProfile.id,
      price: 4500,
      type: 'SUBSCRIPTION',
      monthlyPrice: 4500,
      level: 'ADVANCED',
      language: 'Sinhala',
      tags: ['mathematics', 'a-level', 'sri-lanka', 'exam-prep'],
      category: 'Mathematics',
      isPublished: true,
      isFeatured: true,
      totalDuration: 7200,
      totalLessons: 48,
      rating: 4.9,
    },
  });

  const course2 = await prisma.course.upsert({
    where: { id: 'seed-course-02' },
    update: {},
    create: {
      id: 'seed-course-02',
      title: 'Python Programming from Zero to Hero',
      description:
        'Learn Python programming from scratch. This course covers variables, data types, control flow, functions, OOP, file handling, and builds three real projects.',
      shortDesc: 'Learn Python with hands-on projects',
      teacherId: teacherProfile.id,
      price: 2990,
      type: 'ONE_TIME',
      level: 'BEGINNER',
      language: 'English',
      tags: ['python', 'programming', 'beginner', 'projects'],
      category: 'Programming',
      isPublished: true,
      totalDuration: 5400,
      totalLessons: 36,
      rating: 4.7,
    },
  });

  console.log(`✅  Courses created: ${course1.title}, ${course2.title}`);

  // ── 5. Sample lessons ──────────────────────────────────────
  const lessonsData = [
    { title: 'Introduction & Course Overview', order: 1, isFree: true, duration: 900 },
    { title: 'Numbers and Algebra Foundations', order: 2, isFree: false, duration: 2700 },
    { title: 'Quadratic Equations', order: 3, isFree: false, duration: 3600 },
  ];

  for (const l of lessonsData) {
    await prisma.lesson.upsert({
      where: { id: `seed-lesson-c1-${l.order}` },
      update: {},
      create: {
        id: `seed-lesson-c1-${l.order}`,
        courseId: course1.id,
        ...l,
        description: `Detailed lesson on ${l.title}`,
        hlsUrl: `https://stream.tutorly.lk/hls/demo-${l.order}/index.m3u8`,
        isPublished: true,
      },
    });
  }
  console.log(`✅  Lessons created for course 1`);

  // ── 6. Sample enrollment ───────────────────────────────────
  await prisma.enrollment.upsert({
    where: { studentId_courseId: { studentId: student.id, courseId: course2.id } },
    update: {},
    create: {
      studentId: student.id,
      courseId: course2.id,
      status: 'ACTIVE',
    },
  });
  console.log(`✅  Enrollment created: ${student.email} → ${course2.title}`);

  // ── 7. Course chat rooms ───────────────────────────────────
  for (const course of [course1, course2]) {
    await prisma.chatRoom.upsert({
      where: { courseId: course.id },
      update: {},
      create: { courseId: course.id },
    });
  }
  console.log(`✅  Chat rooms created`);

  // ── 8. Welcome notifications ───────────────────────────────
  await prisma.notification.createMany({
    data: [
      {
        userId: student.id,
        type: 'SYSTEM',
        title: 'Welcome to TUTORLY! 🎓',
        body: 'Start exploring courses and begin your learning journey today.',
        payload: {},
      },
      {
        userId: teacher.id,
        type: 'SYSTEM',
        title: 'Welcome to TUTORLY! 📚',
        body: 'Your teacher profile is ready. Start creating courses to reach students.',
        payload: {},
      },
    ],
    skipDuplicates: true,
  });
  console.log(`✅  Notifications created`);

  // ── Summary ────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(50));
  console.log('🎉  Seed completed successfully!\n');
  console.log('  Login credentials:');
  console.log('  ┌─────────────────────────────────────────────');
  console.log('  │  Admin:   admin@tutorly.lk  /  Admin@123');
  console.log('  │  Teacher: teacher@tutorly.lk / Teacher@123');
  console.log('  │  Student: student@tutorly.lk / Student@123');
  console.log('  └─────────────────────────────────────────────\n');
}

main()
  .catch((err) => {
    console.error('❌  Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
