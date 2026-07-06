USE tutorly;

-- Delete any existing records to prevent duplicates
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE chat_rooms;
TRUNCATE TABLE enrollments;
TRUNCATE TABLE lessons;
TRUNCATE TABLE courses;
TRUNCATE TABLE teacher_profiles;
TRUNCATE TABLE student_profiles;
TRUNCATE TABLE notifications;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- Insert Users (Password: Admin@123, Teacher@123, Student@123)
INSERT INTO users (id, email, passwordHash, role, firstName, lastName, isActive, isVerified, createdAt, updatedAt)
VALUES 
('83238692-a1f9-4d64-8f0a-70233e70cc8b', 'admin@tutorly.lk', '$2a$12$3JVsMIr/V.hGkId45koPH.LbeKNja87jPkLD/e4cCDG.gIPAD0Yru', 'ADMIN', 'Super', 'Admin', true, true, NOW(3), NOW(3)),
('8be138c2-28e4-4c4f-9556-3a7cb141df90', 'teacher@tutorly.lk', '$2a$12$Le5HMBffN29HlfOy70z43.5765A8Sa2dwgTrm5LghEHwts6tXeBxa', 'TEACHER', 'Nimesh', 'Perera', true, true, NOW(3), NOW(3)),
('54d9a695-1db6-4cc2-bc89-ea3c1ff00c3b', 'student@tutorly.lk', '$2a$12$36IpC2Pcz3AxzCAhbFAdNehOnsb8iqmF7VVzR86t398q4QTcqV0RC', 'STUDENT', 'Kasun', 'Silva', true, true, NOW(3), NOW(3));

-- Insert Teacher Profile
INSERT INTO teacher_profiles (id, userId, bio, subjects, qualifications, experience, rating, totalStudents, totalCourses, totalEarnings, isVerified, approvalStatus, createdAt, updatedAt)
VALUES
('34db7a9d-5eb4-44cc-a1df-9c0e0b3c66f5', '8be138c2-28e4-4c4f-9556-3a7cb141df90', 'Senior software engineer with 10+ years of experience teaching programming and mathematics.', '["Mathematics", "Programming", "Physics"]', '["BSc Computer Science (University of Moratuwa)", "MSc Data Science"]', 10, 4.8, 0, 0, 0.0, true, 'APPROVED', NOW(3), NOW(3));

-- Insert Student Profile
INSERT INTO student_profiles (id, userId, grade, createdAt, updatedAt)
VALUES
('stud-profile-01', '54d9a695-1db6-4cc2-bc89-ea3c1ff00c3b', 'Grade 12', NOW(3), NOW(3));

-- Insert Courses
INSERT INTO courses (id, title, description, shortDesc, teacherId, price, type, monthlyPrice, level, language, tags, category, isPublished, isFeatured, totalDuration, totalLessons, rating, totalRatings, createdAt, updatedAt)
VALUES
('seed-course-01', 'Complete Mathematics for A/L Students', 'A comprehensive course covering all topics required for Sri Lankan Advanced Level Mathematics examination. Includes Pure Mathematics, Applied Mathematics, and Statistics.', 'Master A/L Mathematics with expert guidance', '34db7a9d-5eb4-44cc-a1df-9c0e0b3c66f5', 4500.0, 'SUBSCRIPTION', 4500.0, 'ADVANCED', 'Sinhala', '["mathematics", "a-level", "sri-lanka", "exam-prep"]', 'Mathematics', true, true, 7200, 48, 4.9, 0, NOW(3), NOW(3)),
('seed-course-02', 'Python Programming from Zero to Hero', 'Learn Python programming from scratch. This course covers variables, data types, control flow, functions, OOP, file handling, and builds three real projects.', 'Learn Python with hands-on projects', '34db7a9d-5eb4-44cc-a1df-9c0e0b3c66f5', 2990.0, 'ONE_TIME', NULL, 'BEGINNER', 'English', '["python", "programming", "beginner", "projects"]', 'Programming', true, false, 5400, 36, 4.7, 0, NOW(3), NOW(3));

-- Insert Lessons
INSERT INTO lessons (id, courseId, title, description, duration, `order`, isFree, isPublished, hlsUrl, createdAt, updatedAt)
VALUES
('seed-lesson-c1-1', 'seed-course-01', 'Introduction & Course Overview', 'Detailed lesson on Introduction & Course Overview', 900, 1, true, true, 'https://stream.tutorly.lk/hls/demo-1/index.m3u8', NOW(3), NOW(3)),
('seed-lesson-c1-2', 'seed-course-01', 'Numbers and Algebra Foundations', 'Detailed lesson on Numbers and Algebra Foundations', 2700, 2, false, true, 'https://stream.tutorly.lk/hls/demo-2/index.m3u8', NOW(3), NOW(3)),
('seed-lesson-c1-3', 'seed-course-01', 'Quadratic Equations', 'Detailed lesson on Quadratic Equations', 3600, 3, false, true, 'https://stream.tutorly.lk/hls/demo-3/index.m3u8', NOW(3), NOW(3));

-- Insert Enrollments
INSERT INTO enrollments (id, studentId, courseId, status, enrolledAt, updatedAt)
VALUES
('seed-enroll-01', '54d9a695-1db6-4cc2-bc89-ea3c1ff00c3b', 'seed-course-02', 'ACTIVE', NOW(3), NOW(3));

-- Insert Chat Rooms
INSERT INTO chat_rooms (id, courseId, streamId, name, isActive, createdAt)
VALUES
('seed-chat-01', 'seed-course-01', NULL, NULL, true, NOW(3)),
('seed-chat-02', 'seed-course-02', NULL, NULL, true, NOW(3));

-- Insert Notifications
INSERT INTO notifications (id, userId, type, title, body, payload, isRead, createdAt)
VALUES
('seed-notif-01', '54d9a695-1db6-4cc2-bc89-ea3c1ff00c3b', 'SYSTEM', 'Welcome to TUTORLY! 🎓', 'Start exploring courses and begin your learning journey today.', '{}', false, NOW(3)),
('seed-notif-02', '8be138c2-28e4-4c4f-9556-3a7cb141df90', 'SYSTEM', 'Welcome to TUTORLY! 📚', 'Your teacher profile is ready. Start creating courses to reach students.', '{}', false, NOW(3));
