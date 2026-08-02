import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword } from "./auth";
import { chatWithAI, logAIChat, analyzeImage, handleImageUpload, uploadImage, generateImage } from "./ai";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { 
  insertCourseSchema, 
  insertModuleSchema,
  insertLessonSchema,
  insertExamSchema,
  insertQuestionSchema,
  insertExamAttemptSchema,
  insertEnrollmentSchema,
  insertActivityLogSchema,
  insertBatchSchema,
  insertBatchEnrollmentSchema,
  insertLessonProgressSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve static files from uploads directory
  const uploadsPath = path.join(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadsPath));
  
  // Set up authentication routes and middleware
  setupAuth(app);

  // Middleware to check if user is authenticated
  const isAuthenticated = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Middleware to check if user is an admin
  const isAdmin = (req: any, res: any, next: any) => {
    if (req.isAuthenticated() && req.user!.role === "admin") {
      return next();
    }
    res.status(403).json({ message: "Forbidden: Admin access required" });
  };

  // Middleware to check if user is a super admin
  const isSuperAdmin = (req: any, res: any, next: any) => {
    if (req.isAuthenticated() && req.user!.role === "superadmin") {
      return next();
    }
    res.status(403).json({ message: "Forbidden: Super Admin access required" });
  };

  // Tenant routes
  app.get("/api/tenants", isAuthenticated, async (req, res) => {
    try {
      const tenants = await storage.getTenant(req.user!.tenantId);
      res.json(tenants);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tenant" });
    }
  });

  // User routes
  app.get("/api/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.getUsersByTenant(req.user!.tenantId);
      // Remove passwords before sending
      const safeUsers = users.map(({ password, ...rest }) => rest);
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  
  // Get a specific user by ID
  app.get("/api/users/:id", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if user belongs to the admin's tenant
      if (user.tenantId !== req.user!.tenantId) {
        return res.status(403).json({ message: "Access denied to this user" });
      }
      
      // Remove password before sending
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  // Update user profile
  app.put("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Users can only update their own profile unless they are admins
      if (userId !== req.user!.id && req.user!.role !== 'admin' && req.user!.role !== 'superadmin') {
        return res.status(403).json({ message: "You can only update your own profile" });
      }
      
      const { password, ...updateData } = req.body;
      
      // If password is provided, hash it
      let userData: any = { ...updateData };
      if (password) {
        // This references the hashPassword function from auth.ts
        // We'll need to import it or redefine it here
        const crypto = require('crypto');
        const { promisify } = require('util');
        const scrypt = promisify(crypto.scrypt);
        
        // Hash the password
        const salt = crypto.randomBytes(16).toString('hex');
        const buf = await scrypt(password, salt, 64) as Buffer;
        const hashedPassword = `${buf.toString('hex')}.${salt}`;
        
        userData.password = hashedPassword;
      }
      
      const updatedUser = await storage.updateUser(userId, userData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password before sending the response
      const { password: _, ...safeUser } = updatedUser;
      res.json(safeUser);
      
    } catch (error) {
      res.status(500).json({ message: "Failed to update user profile" });
    }
  });
  // Admin create student (does not switch login session)
  app.post("/api/users", isAdmin, async (req, res) => {
    try {
      const {
        username,
        password,
        firstName,
        lastName,
        email,
        mobileNumber,
        gender,
        dateOfBirth,
        educationLevel,
        schoolCollege,
        yearOfStudy,
      } = req.body;

      if (
        !username ||
        !password ||
        !firstName ||
        !lastName ||
        !email ||
        !mobileNumber ||
        !dateOfBirth ||
        !educationLevel ||
        !schoolCollege ||
        !yearOfStudy
      ) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser({
        username,
        password: await hashPassword(password),
        plainPassword: password,
        firstName,
        lastName,
        email,
        mobileNumber,
        gender: gender || null,
        dateOfBirth:
          typeof dateOfBirth === "string"
            ? dateOfBirth
            : new Date(dateOfBirth).toISOString().slice(0, 10),
        educationLevel,
        schoolCollege,
        yearOfStudy,
        role: "student",
        tenantId: req.user!.tenantId,
      });

      const { password: _, plainPassword: __, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (error) {
      console.error("Failed to create student:", error);
      res.status(500).json({ message: "Failed to create student" });
    }
  });

  // DELETE user route
app.delete("/api/users/:id", isAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Check if user exists and belongs to the same tenant
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Check if user belongs to the admin's tenant
    // The isAdmin middleware ensures req.user! exists, so we can safely access it
    if (user.tenantId !== req.user!.tenantId) {
      return res.status(403).json({ message: "Access denied to this user" });
    }
    
    // Prevent admin from deleting themselves
    if (userId === req.user!.id) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }
    
    // Delete the user and all related data
    await storage.deleteUser(userId);
    
    res.status(200).json({ 
      message: `User ${user.firstName} ${user.lastName} has been deleted successfully` 
    });
  } catch (error) {
    console.error("Failed to delete user:", error);
    res.status(500).json({ message: "Failed to delete user" });
  }
});

  // Course routes
  app.get("/api/courses", isAuthenticated, async (req, res) => {
    try {
      const courses = await storage.getCoursesByTenant(req.user!.tenantId);
      
      // If user is admin or superadmin, return courses with enrollment counts
      if (req.user!.role === "admin" || req.user!.role === "superadmin") {
        const counts = await storage.getEnrollmentCountsByTenant(req.user!.tenantId);
        const withCounts = courses.map((course) => ({
          ...course,
          enrollmentCount: counts[course.id] ?? 0,
        }));
        res.json(withCounts);
        return;
      }
      
      // Students only see courses assigned/enrolled by admin
      const enrollments = await storage.getEnrollmentsByUser(req.user!.id);
      const enrolledCourseIds = new Set(enrollments.map((enrollment) => enrollment.courseId));
      const assignedCourses = courses.filter((course) => enrolledCourseIds.has(course.id));
      
      res.json(assignedCourses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.get("/api/courses/:id", isAuthenticated, async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Check if course belongs to user's tenant
      if (course.tenantId !== req.user!.tenantId) {
        return res.status(403).json({ message: "Access denied to this course" });
      }
      
      // If user is admin or superadmin, allow access
      if (req.user!.role === "admin" || req.user!.role === "superadmin") {
        res.json(course);
        return;
      }
      
      // Students must be enrolled/assigned to access the course
      const enrollments = await storage.getEnrollmentsByUser(req.user!.id);
      const isEnrolled = enrollments.some((enrollment) => enrollment.courseId === courseId);
      
      if (!isEnrolled) {
        return res.status(403).json({ 
          message: "This course is not assigned to you. Please contact an administrator." 
        });
      }
      
      res.json(course);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch course" });
    }
  });

  app.post("/api/courses", isAdmin, async (req, res) => {
    try {
      const validatedData = insertCourseSchema.parse({
        ...req.body,
        tenantId: req.user!.tenantId,
        createdBy: req.user!.id
      });
      
      const course = await storage.createCourse(validatedData);
      res.status(201).json(course);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create course" });
    }
  });

  app.put("/api/courses/:id", isAdmin, async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const course = await storage.getCourse(courseId);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Check if course belongs to user's tenant
      if (course.tenantId !== req.user!.tenantId) {
        return res.status(403).json({ message: "Access denied to this course" });
      }
      
      const updatedCourse = await storage.updateCourse(courseId, req.body);
      res.json(updatedCourse);
    } catch (error) {
      res.status(500).json({ message: "Failed to update course" });
    }
  });

  app.delete("/api/courses/:id", isAdmin, async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const course = await storage.getCourse(courseId);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Check if course belongs to user's tenant
      if (course.tenantId !== req.user!.tenantId) {
        return res.status(403).json({ message: "Access denied to this course" });
      }
      
      await storage.deleteCourse(courseId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete course" });
    }
  });

  // Module routes
  app.get("/api/courses/:courseId/modules", isAuthenticated, async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const course = await storage.getCourse(courseId);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Check if course belongs to user's tenant
      if (course.tenantId !== req.user!.tenantId) {
        return res.status(403).json({ message: "Access denied to this course" });
      }
      
      // If user is admin or superadmin, allow access
      if (req.user!.role === "admin" || req.user!.role === "superadmin") {
        const modules = await storage.getModulesByCourse(courseId);
        res.json(modules);
        return;
      }
      
      // Students must be enrolled/assigned to access modules
      const enrollments = await storage.getEnrollmentsByUser(req.user!.id);
      const isEnrolled = enrollments.some(enrollment => enrollment.courseId === courseId);
      
      if (!isEnrolled) {
        return res.status(403).json({ 
          message: "This course is not assigned to you. Please contact an administrator." 
        });
      }
      
      const modules = await storage.getModulesByCourse(courseId);
      res.json(modules);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch modules" });
    }
  });

  app.post("/api/modules", isAdmin, async (req, res) => {
    try {
      const validatedData = insertModuleSchema.parse(req.body);
      
      // Check if course belongs to user's tenant
      const course = await storage.getCourse(validatedData.courseId);
      if (!course || course.tenantId !== req.user!.tenantId) {
        return res.status(403).json({ message: "Access denied to this course" });
      }
      
      const module = await storage.createModule(validatedData);
      res.status(201).json(module);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create module" });
    }
  });

  app.put("/api/modules/:id", isAdmin, async (req, res) => {
    try {
      const moduleId = parseInt(req.params.id);
      const module = await storage.getModule(moduleId);
      
      if (!module) {
        return res.status(404).json({ message: "Module not found" });
      }
      
      // Check if module's course belongs to user's tenant
      const course = await storage.getCourse(module.courseId);
      if (!course || course.tenantId !== req.user!.tenantId) {
        return res.status(403).json({ message: "Access denied to this module" });
      }
      
      const updatedModule = await storage.updateModule(moduleId, req.body);
      res.json(updatedModule);
    } catch (error) {
      res.status(500).json({ message: "Failed to update module" });
    }
  });

  app.delete("/api/modules/:id", isAdmin, async (req, res) => {
    try {
      const moduleId = parseInt(req.params.id);
      const module = await storage.getModule(moduleId);
      
      if (!module) {
        return res.status(404).json({ message: "Module not found" });
      }
      
      // Check if module's course belongs to user's tenant
      const course = await storage.getCourse(module.courseId);
      if (!course || course.tenantId !== req.user!.tenantId) {
        return res.status(403).json({ message: "Access denied to this module" });
      }
      
      await storage.deleteModule(moduleId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete module" });
    }
  });

  // Lesson routes
  app.get("/api/modules/:moduleId/lessons", isAuthenticated, async (req, res) => {
    try {
      const moduleId = parseInt(req.params.moduleId);
      const module = await storage.getModule(moduleId);
      
      if (!module) {
        return res.status(404).json({ message: "Module not found" });
      }
      
      // Check if module's course belongs to user's tenant
      const course = await storage.getCourse(module.courseId);
      if (!course || course.tenantId !== req.user!.tenantId) {
        return res.status(403).json({ message: "Access denied to this module" });
      }
      
      const lessons = await storage.getLessonsByModule(moduleId);
      res.json(lessons);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch lessons" });
    }
  });

  app.post("/api/lessons", isAdmin, async (req, res) => {
    try {
      const validatedData = insertLessonSchema.parse(req.body);
      
      // Check if module's course belongs to user's tenant
      const module = await storage.getModule(validatedData.moduleId);
      if (!module) {
        return res.status(404).json({ message: "Module not found" });
      }
      
      const course = await storage.getCourse(module.courseId);
      if (!course || course.tenantId !== req.user!.tenantId) {
        return res.status(403).json({ message: "Access denied to this module" });
      }
      
      const lesson = await storage.createLesson(validatedData);
      res.status(201).json(lesson);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create lesson" });
    }
  });

  app.put("/api/lessons/:id", isAdmin, async (req, res) => {
    try {
      const lessonId = parseInt(req.params.id);
      const lesson = await storage.getLesson(lessonId);
      
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      
      // Check if lesson's module's course belongs to user's tenant
      const module = await storage.getModule(lesson.moduleId);
      if (!module) {
        return res.status(404).json({ message: "Module not found" });
      }
      
      const course = await storage.getCourse(module.courseId);
      if (!course || course.tenantId !== req.user!.tenantId) {
        return res.status(403).json({ message: "Access denied to this lesson" });
      }
      
      const updatedLesson = await storage.updateLesson(lessonId, req.body);
      res.json(updatedLesson);
    } catch (error) {
      res.status(500).json({ message: "Failed to update lesson" });
    }
  });

  app.delete("/api/lessons/:id", isAdmin, async (req, res) => {
    try {
      const lessonId = parseInt(req.params.id);
      const lesson = await storage.getLesson(lessonId);
      
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      
      // Check if lesson's module's course belongs to user's tenant
      const module = await storage.getModule(lesson.moduleId);
      if (!module) {
        return res.status(404).json({ message: "Module not found" });
      }
      
      const course = await storage.getCourse(module.courseId);
      if (!course || course.tenantId !== req.user!.tenantId) {
        return res.status(403).json({ message: "Access denied to this lesson" });
      }
      
      await storage.deleteLesson(lessonId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete lesson" });
    }
  });

  // Enrollment routes
  app.get("/api/enrollments/user", isAuthenticated, async (req, res) => {
    try {
      const enrollments = await storage.getEnrollmentsByUser(req.user!.id);

      // Include course titles so student UI never falls back to "Course #id"
      const enhanced = [];
      for (const enrollment of enrollments) {
        const course = await storage.getCourse(enrollment.courseId);
        enhanced.push({
          ...enrollment,
          course: course
            ? {
                id: course.id,
                title: course.title,
                description: course.description,
                thumbnail: course.thumbnail,
                difficulty: course.difficulty,
                duration: course.duration,
                category: course.category,
              }
            : null,
        });
      }

      res.json(enhanced);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });
  
  // Get enrollments for a specific user (admin only)
  app.get("/api/enrollments/user/:userId", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Check if user belongs to the same tenant
      const user = await storage.getUser(userId);
      if (!user || user.tenantId !== req.user!.tenantId) {
        return res.status(403).json({ message: "Access denied to this user's enrollments" });
      }
      
      const enrollments = await storage.getEnrollmentsByUser(userId);
      
      // Enhance enrollments with course data
      const enhancedEnrollments = [];
      for (const enrollment of enrollments) {
        const course = await storage.getCourse(enrollment.courseId);
        enhancedEnrollments.push({
          ...enrollment,
          course: course
        });
      }
      
      res.json(enhancedEnrollments);
    } catch (error) {
      console.error("Failed to fetch enrollments:", error);
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });

  app.get("/api/enrollments/course/:courseId", isAdmin, async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const course = await storage.getCourse(courseId);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Check if course belongs to user's tenant
      if (course.tenantId !== req.user!.tenantId) {
        return res.status(403).json({ message: "Access denied to this course" });
      }
      
      const enrollments = await storage.getEnrollmentsByCourse(courseId);
      res.json(enrollments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });

  app.post("/api/enrollments", isAuthenticated, async (req, res) => {
    try {
      // Only admins can enroll students; students get courses via admin assignment
      if (req.user!.role !== "admin" && req.user!.role !== "superadmin") {
        return res.status(403).json({
          message: "Courses must be assigned by an administrator.",
        });
      }

      const { userId, courseId } = req.body;
      const targetUserId = userId || req.user!.id;

      const validatedData = insertEnrollmentSchema.parse({
        courseId,
        userId: targetUserId,
      });
      
      // Check if course belongs to user's tenant
      const course = await storage.getCourse(validatedData.courseId);
      if (!course || course.tenantId !== req.user!.tenantId) {
        return res.status(403).json({ message: "Access denied to this course" });
      }
      
      // Check if already enrolled
      const existingEnrollments = await storage.getEnrollmentsByUser(validatedData.userId);
      const alreadyEnrolled = existingEnrollments.some(e => e.courseId === validatedData.courseId);
      
      if (alreadyEnrolled) {
        return res.status(400).json({ message: "Already enrolled in this course" });
      }
      
      const enrollment = await storage.createEnrollment(validatedData);
      
      // Create activity log
      await storage.createActivityLog({
        userId: validatedData.userId,
        activityType: "course_enroll",
        resourceId: validatedData.courseId,
        resourceType: "course",
        tenantId: req.user!.tenantId
      });
      
      res.status(201).json(enrollment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create enrollment" });
    }
  });

  app.put("/api/enrollments/:id", isAuthenticated, async (req, res) => {
    try {
      const enrollmentId = parseInt(req.params.id);
      const enrollment = await storage.getEnrollment(enrollmentId);
      
      if (!enrollment) {
        return res.status(404).json({ message: "Enrollment not found" });
      }
      
      // Check if enrollment belongs to user or user is admin
      if (enrollment.userId !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ message: "Access denied to this enrollment" });
      }
      
      const updatedEnrollment = await storage.updateEnrollment(enrollmentId, req.body);
      res.json(updatedEnrollment);
    } catch (error) {
      res.status(500).json({ message: "Failed to update enrollment" });
    }
  });
  
  // Endpoint for admin to assign courses to students
  app.post("/api/enrollments/assign", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(String(req.body?.userId), 10);
      const courseId = parseInt(String(req.body?.courseId), 10);

      if (!Number.isFinite(userId) || !Number.isFinite(courseId)) {
        return res.status(400).json({ message: "Both userId and courseId are required" });
      }

      // Check if course exists and belongs to admin's tenant
      const course = await storage.getCourse(courseId);
      if (!course || course.tenantId !== req.user!.tenantId) {
        return res.status(403).json({ message: "Course not found or access denied" });
      }

      // Check if user exists and belongs to admin's tenant
      const user = await storage.getUser(userId);
      if (!user || user.tenantId !== req.user!.tenantId) {
        return res.status(403).json({ message: "User not found or access denied" });
      }

      if (user.role !== "student") {
        return res.status(400).json({ message: "Courses can only be assigned to students" });
      }

      // Idempotent: already enrolled is success (supports batch assign)
      const existingEnrollments = await storage.getEnrollmentsByUser(userId);
      const existing = existingEnrollments.find((e) => e.courseId === courseId);
      if (existing) {
        return res.status(200).json(existing);
      }

      const enrollment = await storage.createEnrollment({
        userId,
        courseId,
      });

      try {
        await storage.createActivityLog({
          userId,
          activityType: "course_assign",
          resourceId: courseId,
          resourceType: "course",
          tenantId: req.user!.tenantId,
        });
      } catch (logError) {
        console.error("Activity log failed after course assign:", logError);
      }

      res.status(201).json(enrollment);
    } catch (error) {
      console.error("Failed to assign course to user:", error);
      res.status(500).json({ message: "Failed to assign course to user" });
    }
  });

  // Admin unenroll student from course
  app.delete("/api/enrollments/assign", isAdmin, async (req, res) => {
    try {
      const body = req.body || {};
      const userId = parseInt(String(body.userId ?? req.query.userId), 10);
      const courseId = parseInt(String(body.courseId ?? req.query.courseId), 10);

      if (!Number.isFinite(userId) || !Number.isFinite(courseId)) {
        return res.status(400).json({ message: "Both userId and courseId are required" });
      }

      const course = await storage.getCourse(courseId);
      if (!course || course.tenantId !== req.user!.tenantId) {
        return res.status(403).json({ message: "Course not found or access denied" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.tenantId !== req.user!.tenantId) {
        return res.status(403).json({ message: "User not found or access denied" });
      }

      const deleted = await storage.deleteEnrollmentByUserAndCourse(userId, courseId);
      if (!deleted) {
        return res.status(404).json({ message: "Enrollment not found" });
      }

      res.json({ message: "Enrollment removed" });
    } catch (error) {
      console.error("Failed to remove enrollment:", error);
      res.status(500).json({ message: "Failed to remove enrollment" });
    }
  });

  // Exam routes
  app.get("/api/exams", isAuthenticated, async (req, res) => {
    try {
      const exams = await storage.getExamsByTenant(req.user!.tenantId);

      if (req.user!.role === "admin" || req.user!.role === "superadmin") {
        res.json(exams);
        return;
      }

      // Students only see published exams for courses assigned to them
      const enrollments = await storage.getEnrollmentsByUser(req.user!.id);
      const enrolledCourseIds = new Set(enrollments.map((e) => e.courseId));
      const assignedExams = exams.filter(
        (exam) =>
          enrolledCourseIds.has(exam.courseId) &&
          exam.acceptingResponses !== false
      );
      res.json(assignedExams);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exams" });
    }
  });

  app.get("/api/exams/:id", isAuthenticated, async (req, res) => {
    try {
      const examId = parseInt(req.params.id);
      const exam = await storage.getExam(examId);
      
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      
      // Check if exam belongs to user's tenant
      if (exam.tenantId !== req.user!.tenantId) {
        return res.status(403).json({ message: "Access denied to this exam" });
      }

      if (req.user!.role !== "admin" && req.user!.role !== "superadmin") {
        const enrollments = await storage.getEnrollmentsByUser(req.user!.id);
        const isEnrolled = enrollments.some((e) => e.courseId === exam.courseId);
        if (!isEnrolled) {
          return res.status(403).json({
            message: "This exam is not available for your assigned courses.",
          });
        }
      }
      
      res.json(exam);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exam" });
    }
  });

  app.post("/api/exams", isAdmin, async (req, res) => {
    try {
      const validatedData = insertExamSchema.parse({
        ...req.body,
        tenantId: req.user!.tenantId,
        createdBy: req.user!.id
      });
      
      // Check if course belongs to user's tenant
      const course = await storage.getCourse(validatedData.courseId);
      if (!course || course.tenantId !== req.user!.tenantId) {
        return res.status(403).json({ message: "Access denied to this course" });
      }
      
      const exam = await storage.createExam(validatedData);
      res.status(201).json(exam);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create exam" });
    }
  });

  app.put("/api/exams/:id", isAdmin, async (req, res) => {
    try {
      const examId = parseInt(req.params.id);
      const exam = await storage.getExam(examId);
      
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      
      // Check if exam belongs to user's tenant
      if (exam.tenantId !== req.user!.tenantId) {
        return res.status(403).json({ message: "Access denied to this exam" });
      }
      
      // Validate the request body
      const updateSchema = z.object({
        title: z.string().min(3).optional(),
        description: z.string().min(1).optional(),
        courseId: z.number().positive().optional(),
        duration: z.number().min(1).optional(),
        maxAttempts: z.number().min(1).optional(),
        startTime: z.string().transform(str => new Date(str)).optional(),
        endTime: z.string().transform(str => new Date(str)).optional(),
        acceptingResponses: z.boolean().optional(),
      });
      
      const validatedData = updateSchema.parse(req.body);
      
      const updatedExam = await storage.updateExam(examId, validatedData);
      res.json(updatedExam);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Failed to update exam:", error);
      res.status(500).json({ message: "Failed to update exam" });
    }
  });

  app.delete("/api/exams/:id", isAdmin, async (req, res) => {
    try {
      const examId = parseInt(req.params.id);
      const exam = await storage.getExam(examId);
      
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      
      // Check if exam belongs to user's tenant
      if (exam.tenantId !== req.user!.tenantId) {
        return res.status(403).json({ message: "Access denied to this exam" });
      }
      
      await storage.deleteExam(examId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete exam" });
    }
  });

  // Question routes
  app.get("/api/exams/:examId/questions", isAuthenticated, async (req, res) => {
    try {
      const examId = parseInt(req.params.examId);
      const exam = await storage.getExam(examId);
      
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      
      // Check if exam belongs to user's tenant
      if (exam.tenantId !== req.user!.tenantId) {
        return res.status(403).json({ message: "Access denied to this exam" });
      }
      
      const questions = await storage.getQuestionsByExam(examId);
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });
  
  // Add a route for bulk deleting questions for an exam
  app.delete("/api/exams/:examId/questions", isAdmin, async (req, res) => {
    try {
      const examId = parseInt(req.params.examId);
      const exam = await storage.getExam(examId);
      
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      
      // Check if exam belongs to user's tenant
      if (exam.tenantId !== req.user!.tenantId) {
        return res.status(403).json({ message: "Access denied to this exam" });
      }
      
      // Get all questions for this exam
      const questions = await storage.getQuestionsByExam(examId);
      
      // Delete each question
      for (const question of questions) {
        await storage.deleteQuestion(question.id);
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete questions" });
    }
  });
  
  // Add a route for adding questions to an exam directly
  app.post("/api/exams/:examId/questions", isAdmin, async (req, res) => {
    try {
      const examId = parseInt(req.params.examId);
      const exam = await storage.getExam(examId);
      
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      
      // Check if exam belongs to user's tenant
      if (exam.tenantId !== req.user!.tenantId) {
        return res.status(403).json({ message: "Access denied to this exam" });
      }
      
      // Get existing questions count to calculate order
      const existingQuestions = await storage.getQuestionsByExam(examId);
      const nextOrder = existingQuestions.length;
      
      const questionData = {
        ...req.body,
        examId,
        order: req.body.order !== undefined ? req.body.order : nextOrder,
        // Provide default values for legacy columns that are now optional
        options: req.body.options || null,
        correctOption: req.body.correctOption || null
      };
      
      const validatedData = insertQuestionSchema.parse(questionData);
      const question = await storage.createQuestion(validatedData);
      
      res.status(201).json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Failed to create question:", error);
      res.status(500).json({ message: "Failed to create question" });
    }
  });

  app.post("/api/questions", isAdmin, async (req, res) => {
    try {
      const validatedData = insertQuestionSchema.parse(req.body);
      
      // Check if exam belongs to user's tenant
      const exam = await storage.getExam(validatedData.examId);
      if (!exam || exam.tenantId !== req.user!.tenantId) {
        return res.status(403).json({ message: "Access denied to this exam" });
      }
      
      const question = await storage.createQuestion(validatedData);
      res.status(201).json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create question" });
    }
  });

  app.put("/api/questions/:id", isAdmin, async (req, res) => {
    try {
      const questionId = parseInt(req.params.id);
      const question = await storage.getQuestion(questionId);
      
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      // Check if question's exam belongs to user's tenant
      const exam = await storage.getExam(question.examId);
      if (!exam || exam.tenantId !== req.user!.tenantId) {
        return res.status(403).json({ message: "Access denied to this question" });
      }
      
      const updatedQuestion = await storage.updateQuestion(questionId, req.body);
      res.json(updatedQuestion);
    } catch (error) {
      res.status(500).json({ message: "Failed to update question" });
    }
  });

  app.delete("/api/questions/:id", isAdmin, async (req, res) => {
    try {
      const questionId = parseInt(req.params.id);
      const question = await storage.getQuestion(questionId);
      
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      // Check if question's exam belongs to user's tenant
      const exam = await storage.getExam(question.examId);
      if (!exam || exam.tenantId !== req.user!.tenantId) {
        return res.status(403).json({ message: "Access denied to this question" });
      }
      
      await storage.deleteQuestion(questionId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete question" });
    }
  });

  // Exam attempt routes
  app.get("/api/exam-attempts/user", isAuthenticated, async (req, res) => {
    try {
      const attempts = await storage.getExamAttemptsByUser(req.user!.id);
      res.json(attempts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exam attempts" });
    }
  });
  
  // Get exam attempts for a specific user (admin only)
  app.get("/api/exam-attempts/user/:userId", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Check if user belongs to the same tenant
      const user = await storage.getUser(userId);
      if (!user || user.tenantId !== req.user!.tenantId) {
        return res.status(403).json({ message: "Access denied to this user's exam attempts" });
      }
      
      const attempts = await storage.getExamAttemptsByUser(userId);
      
      // Enhance attempts with exam data
      const enhancedAttempts = [];
      for (const attempt of attempts) {
        const exam = await storage.getExam(attempt.examId);
        enhancedAttempts.push({
          ...attempt,
          exam: exam
        });
      }
      
      res.json(enhancedAttempts);
    } catch (error) {
      console.error("Failed to fetch exam attempts:", error);
      res.status(500).json({ message: "Failed to fetch exam attempts" });
    }
  });

  app.get("/api/exam-attempts/exam/:examId", isAdmin, async (req, res) => {
    try {
      const examId = parseInt(req.params.examId);
      const exam = await storage.getExam(examId);
      
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      
      // Check if exam belongs to user's tenant
      if (exam.tenantId !== req.user!.tenantId) {
        return res.status(403).json({ message: "Access denied to this exam" });
      }
      
      const attempts = await storage.getExamAttemptsByExam(examId);
      res.json(attempts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exam attempts" });
    }
  });

  app.post("/api/exam-attempts", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertExamAttemptSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      
      // Check if exam belongs to user's tenant
      const exam = await storage.getExam(validatedData.examId);
      if (!exam || exam.tenantId !== req.user!.tenantId) {
        return res.status(403).json({ message: "Access denied to this exam" });
      }
      
      // Check if exam is accepting responses
      if (exam.acceptingResponses === false) {
        return res.status(403).json({ message: "This exam is not accepting responses at this time" });
      }
      
      const attempt = await storage.createExamAttempt(validatedData);
      
      // Create activity log
      await storage.createActivityLog({
        userId: req.user!.id,
        activityType: "exam_start",
        resourceId: validatedData.examId,
        resourceType: "exam",
        tenantId: req.user!.tenantId
      });
      
      res.status(201).json(attempt);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create exam attempt" });
    }
  });

  app.put("/api/exam-attempts/:id", isAuthenticated, async (req, res) => {
    try {
      const attemptId = parseInt(req.params.id);
      const attempt = await storage.getExamAttempt(attemptId);
      
      if (!attempt) {
        return res.status(404).json({ message: "Exam attempt not found" });
      }
      
      // Check if attempt belongs to user or user is admin
      if (attempt.userId !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ message: "Access denied to this exam attempt" });
      }
      
      // For assignment-style exams, we don't automatically score - instructor will review
      if (req.body.completedAt && req.body.answers) {
        const exam = await storage.getExam(attempt.examId);
        if (!exam) {
          return res.status(404).json({ message: "Exam not found" });
        }
        const questions = await storage.getQuestionsByExam(attempt.examId);
        
        // Check if exam is still accepting responses
        if (exam.acceptingResponses === false) {
          return res.status(403).json({ message: "This exam is no longer accepting responses" });
        }
        
        // Fix the completedAt timestamp - convert string to Date object
        if (typeof req.body.completedAt === 'string') {
          req.body.completedAt = new Date(req.body.completedAt);
        }
        
        // Handle answers as JSON string or object
        if (typeof req.body.answers === 'string') {
          try {
            req.body.answers = JSON.parse(req.body.answers);
          } catch (e) {
            console.error("Error parsing answers JSON:", e);
          }
        }
        
        // Store the answers but don't calculate a score - will be reviewed by instructor
        // Set a null score to indicate it needs review
        req.body.score = null;
        
        // Create activity log
        await storage.createActivityLog({
          userId: req.user!.id,
          activityType: "exam_complete",
          resourceId: attempt.examId,
          resourceType: "exam",
          tenantId: req.user!.tenantId
        });
      }
      
      const updatedAttempt = await storage.updateExamAttempt(attemptId, req.body);
      res.json(updatedAttempt);
    } catch (error) {
      console.error("Failed to update exam attempt:", error);
      res.status(500).json({ message: "Failed to update exam attempt" });
    }
  });

  // Activity log routes
  app.get("/api/activity-logs/user", isAuthenticated, async (req, res) => {
    try {
      const logs = await storage.getActivityLogsByUser(req.user!.id);
      const lessonProgressList = await storage.getLessonProgressByUser(req.user!.id);
      const progressByLessonId = new Map(
        lessonProgressList.map((p) => [p.lessonId, p] as const)
      );

      const enhanced = [];
      for (const log of logs) {
        let courseId: number | null = null;
        let courseTitle: string | null = null;
        let lessonTitle: string | null = null;
        let examTitle: string | null = null;

        if (log.activityType === "lesson_complete") {
          // Legacy logs stored lessonId; newer logs store courseId
          const progress = progressByLessonId.get(log.resourceId);
          if (progress) {
            courseId = progress.courseId;
            const course = await storage.getCourse(progress.courseId);
            courseTitle = course?.title ?? null;
            const lesson = await storage.getLesson(log.resourceId);
            lessonTitle = lesson?.title ?? null;
          } else {
            const course = await storage.getCourse(log.resourceId);
            if (course) {
              courseId = course.id;
              courseTitle = course.title;
            }
          }
        } else if (
          log.activityType === "course_assign" ||
          log.activityType === "course_enroll" ||
          log.activityType === "course_view" ||
          log.resourceType === "course"
        ) {
          const course = await storage.getCourse(log.resourceId);
          if (course) {
            courseId = course.id;
            courseTitle = course.title;
          }
        } else if (
          log.activityType === "exam_start" ||
          log.activityType === "exam_complete" ||
          log.resourceType === "exam"
        ) {
          const exam = await storage.getExam(log.resourceId);
          if (exam) {
            examTitle = exam.title;
            courseId = exam.courseId;
            const course = await storage.getCourse(exam.courseId);
            courseTitle = course?.title ?? null;
          }
        }

        enhanced.push({
          ...log,
          courseId,
          courseTitle,
          lessonTitle,
          examTitle,
        });
      }

      res.json(enhanced);
    } catch (error) {
      console.error("Failed to fetch activity logs:", error);
      res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  });

  app.get("/api/activity-logs/tenant", isAdmin, async (req, res) => {
    try {
      const logs = await storage.getActivityLogsByTenant(req.user!.tenantId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  });

  app.post("/api/activity-logs", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertActivityLogSchema.parse({
        ...req.body,
        userId: req.user!.id,
        tenantId: req.user!.tenantId
      });
      
      const log = await storage.createActivityLog(validatedData);
      res.status(201).json(log);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create activity log" });
    }
  });

  // AI Chat API
  app.post("/api/ai/chat", isAuthenticated, chatWithAI);
  
  // Log AI chat interactions
  app.post("/api/ai/log", isAuthenticated, logAIChat);
  
  // AI image analysis endpoint
  app.post("/api/ai/image-analysis", isAuthenticated, analyzeImage);
  
  // Batch management routes
  // Get all batches for tenant
  app.get("/api/batches", isAdmin, async (req, res) => {
    try {
      // @ts-ignore: req.user! is defined because of isAdmin middleware
      const batches = await storage.getBatchesByTenant(req.user!.tenantId);
      res.json(batches);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch batches" });
    }
  });
  
  // Get batches by course
  app.get("/api/courses/:courseId/batches", isAdmin, async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const course = await storage.getCourse(courseId);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // @ts-ignore: req.user! is defined because of isAdmin middleware
      if (course.tenantId !== req.user!.tenantId) {
        return res.status(403).json({ message: "Access denied to this course" });
      }
      
      const batches = await storage.getBatchesByCourse(courseId);
      res.json(batches);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch batches" });
    }
  });
  
  // Get single batch
  app.get("/api/batches/:id", isAdmin, async (req, res) => {
    try {
      const batchId = parseInt(req.params.id);
      const batch = await storage.getBatch(batchId);
      
      if (!batch) {
        return res.status(404).json({ message: "Batch not found" });
      }
      
      // @ts-ignore: req.user! is defined because of isAdmin middleware
      if (batch.tenantId !== req.user!.tenantId) {
        return res.status(403).json({ message: "Access denied to this batch" });
      }
      
      res.json(batch);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch batch" });
    }
  });
  
  // Create new batch
  app.post("/api/batches", isAdmin, async (req, res) => {
    try {
      // @ts-ignore: req.user! is defined because of isAdmin middleware
      const validatedData = insertBatchSchema.parse({
        ...req.body,
        tenantId: req.user!.tenantId,
        createdBy: req.user!.id
      });
      
      // Check if course belongs to user's tenant
      const course = await storage.getCourse(validatedData.courseId);
      // @ts-ignore: req.user! is defined because of isAdmin middleware
      if (!course || course.tenantId !== req.user!.tenantId) {
        return res.status(403).json({ message: "Access denied to this course" });
      }
      
      // Check if trainer belongs to user's tenant
      const trainer = await storage.getUser(validatedData.trainerId);
      // @ts-ignore: req.user! is defined because of isAdmin middleware
      if (!trainer || trainer.tenantId !== req.user!.tenantId) {
        return res.status(403).json({ message: "Access denied to this trainer" });
      }
      
      const batch = await storage.createBatch(validatedData);
      res.status(201).json(batch);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error(error);
      res.status(500).json({ message: "Failed to create batch" });
    }
  });
  
  // Update batch
  app.put("/api/batches/:id", isAdmin, async (req, res) => {
    try {
      const batchId = parseInt(req.params.id);
      const batch = await storage.getBatch(batchId);
      
      if (!batch) {
        return res.status(404).json({ message: "Batch not found" });
      }
      
      // @ts-ignore: req.user! is defined because of isAdmin middleware
      if (batch.tenantId !== req.user!.tenantId) {
        return res.status(403).json({ message: "Access denied to this batch" });
      }
      
      const updatedBatch = await storage.updateBatch(batchId, req.body);
      res.json(updatedBatch);
    } catch (error) {
      res.status(500).json({ message: "Failed to update batch" });
    }
  });
  
  // Delete batch
  app.delete("/api/batches/:id", isAdmin, async (req, res) => {
    try {
      const batchId = parseInt(req.params.id);
      const batch = await storage.getBatch(batchId);
      
      if (!batch) {
        return res.status(404).json({ message: "Batch not found" });
      }
      
      // @ts-ignore: req.user! is defined because of isAdmin middleware
      if (batch.tenantId !== req.user!.tenantId) {
        return res.status(403).json({ message: "Access denied to this batch" });
      }
      
      await storage.deleteBatch(batchId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete batch" });
    }
  });
  
  // Get batch enrollments by batch
  app.get("/api/batches/:batchId/enrollments", isAdmin, async (req, res) => {
    try {
      const batchId = parseInt(req.params.batchId);
      const batch = await storage.getBatch(batchId);
      
      if (!batch) {
        return res.status(404).json({ message: "Batch not found" });
      }
      
      // @ts-ignore: req.user! is defined because of isAdmin middleware
      if (batch.tenantId !== req.user!.tenantId) {
        return res.status(403).json({ message: "Access denied to this batch" });
      }
      
      const enrollments = await storage.getBatchEnrollmentsByBatch(batchId);
      res.json(enrollments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch batch enrollments" });
    }
  });
  
  // Get batch enrollments by user with batch data
  app.get("/api/batch-enrollments/user/:userId", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Check if user belongs to the admin's tenant
      const user = await storage.getUser(userId);
      // @ts-ignore: req.user! is defined because of isAdmin middleware
      if (!user || user.tenantId !== req.user!.tenantId) {
        return res.status(403).json({ message: "Access denied to this user" });
      }
      
      const enrollments = await storage.getBatchEnrollmentsByUser(userId);
      
      // Enhance enrollments with batch data
      const enhancedEnrollments = [];
      for (const enrollment of enrollments) {
        const batch = await storage.getBatch(enrollment.batchId);
        enhancedEnrollments.push({
          ...enrollment,
          batch: batch
        });
      }
      
      res.json(enhancedEnrollments);
    } catch (error) {
      console.error("Failed to fetch batch enrollments:", error);
      res.status(500).json({ message: "Failed to fetch batch enrollments for user" });
    }
  });
  
  // Create batch enrollment (single student)
  app.post("/api/batch-enrollments", isAdmin, async (req, res) => {
    try {
      // @ts-ignore: req.user! is defined because of isAdmin middleware
      const validatedData = insertBatchEnrollmentSchema.parse({
        ...req.body,
        enrolledBy: req.user!.id
      });
      
      // Check if batch belongs to user's tenant
      const batch = await storage.getBatch(validatedData.batchId);
      // @ts-ignore: req.user! is defined because of isAdmin middleware
      if (!batch || batch.tenantId !== req.user!.tenantId) {
        return res.status(403).json({ message: "Access denied to this batch" });
      }
      
      // Check if user belongs to tenant
      const user = await storage.getUser(validatedData.userId);
      // @ts-ignore: req.user! is defined because of isAdmin middleware
      if (!user || user.tenantId !== req.user!.tenantId) {
        return res.status(403).json({ message: "Access denied to this user" });
      }
      
      const enrollment = await storage.createBatchEnrollment(validatedData);
      res.status(201).json(enrollment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create batch enrollment" });
    }
  });
  
  // Create batch enrollments in bulk (multiple students)
  app.post("/api/batch-enrollments/bulk", isAdmin, async (req, res) => {
    try {
      const { batchId, userIds } = req.body;
      
      if (!batchId || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ message: "Invalid request data" });
      }
      
      // Check if batch belongs to user's tenant
      const batch = await storage.getBatch(batchId);
      // @ts-ignore: req.user! is defined because of isAdmin middleware
      if (!batch || batch.tenantId !== req.user!.tenantId) {
        return res.status(403).json({ message: "Access denied to this batch" });
      }
      
      // Create enrollment objects for all users
      // @ts-ignore: req.user! is defined because of isAdmin middleware
      const enrollments = userIds.map(userId => ({
        batchId,
        userId,
        enrolledBy: req.user!.id,
        status: "active"
      }));
      
      const createdEnrollments = await storage.createBatchEnrollmentsBulk(enrollments);
      res.status(201).json(createdEnrollments);
    } catch (error) {
      res.status(500).json({ message: "Failed to create batch enrollments" });
    }
  });
  
  // Delete batch enrollment
  app.delete("/api/batch-enrollments/:id", isAdmin, async (req, res) => {
    try {
      const enrollmentId = parseInt(req.params.id);
      const enrollment = await storage.getBatchEnrollment(enrollmentId);
      
      if (!enrollment) {
        return res.status(404).json({ message: "Enrollment not found" });
      }
      
      // Check if the batch belongs to user's tenant
      const batch = await storage.getBatch(enrollment.batchId);
      // @ts-ignore: req.user! is defined because of isAdmin middleware
      if (!batch || batch.tenantId !== req.user!.tenantId) {
        return res.status(403).json({ message: "Access denied to this enrollment" });
      }
      
      await storage.deleteBatchEnrollment(enrollmentId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete batch enrollment" });
    }
  });
  
  // Lesson Progress Routes
  // Check if a lesson is completed by user
  app.get("/api/lesson-progress/:lessonId", isAuthenticated, async (req, res) => {
    try {
      const lessonId = parseInt(req.params.lessonId);
      const userId = req.user!.id;
      
      // Check if lesson exists and belongs to user's tenant
      const lesson = await storage.getLesson(lessonId);
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      
      // Get the module to check tenant access
      const module = await storage.getModule(lesson.moduleId);
      if (!module) {
        return res.status(404).json({ message: "Module not found" });
      }
      
      // Check course tenant
      const course = await storage.getCourse(module.courseId);
      if (!course || course.tenantId !== req.user!.tenantId) {
        return res.status(403).json({ message: "Access denied to this lesson" });
      }
      
      // Get progress
      const progress = await storage.getLessonProgress(userId, lessonId);
      
      res.json({
        lessonId,
        userId,
        completed: progress ? true : false,
        completedAt: progress ? progress.completedAt : null
      });
    } catch (error) {
      console.error("Failed to fetch lesson progress:", error);
      res.status(500).json({ message: "Failed to fetch lesson progress" });
    }
  });
  
  // Mark a lesson as completed
  app.post("/api/lesson-progress", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertLessonProgressSchema.parse({
        userId: req.user!.id,
        lessonId: req.body.lessonId,
        moduleId: req.body.moduleId,
        courseId: req.body.courseId,
        completed: true
      });
      
      // Check if lesson exists and belongs to user's tenant
      const lesson = await storage.getLesson(validatedData.lessonId);
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      
      // Verify that moduleId matches the lesson's moduleId
      if (lesson.moduleId !== validatedData.moduleId) {
        return res.status(400).json({ message: "Invalid module ID for this lesson" });
      }
      
      // Get the module to check course ID
      const module = await storage.getModule(lesson.moduleId);
      if (!module) {
        return res.status(404).json({ message: "Module not found" });
      }
      
      // Verify that courseId matches the module's courseId
      if (module.courseId !== validatedData.courseId) {
        return res.status(400).json({ message: "Invalid course ID for this module" });
      }
      
      // Check if the user is enrolled in the course
      const enrollments = await storage.getEnrollmentsByUser(req.user!.id);
      const isEnrolled = enrollments.some(e => e.courseId === validatedData.courseId);
      
      if (!isEnrolled) {
        return res.status(403).json({ message: "You must be enrolled in this course to mark lessons as complete" });
      }
      
      // Check if progress already exists
      const existingProgress = await storage.getLessonProgress(req.user!.id, validatedData.lessonId);
      
      if (existingProgress) {
        return res.json(existingProgress); // Progress already recorded
      }
      
      // Create new progress
      const progress = await storage.createLessonProgress(validatedData);
      
      // Log activity
      await storage.createActivityLog({
        userId: req.user!.id,
        activityType: "lesson_complete",
        resourceId: validatedData.courseId,
        resourceType: "course",
        tenantId: req.user!.tenantId
      });
      
      res.status(201).json(progress);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Failed to create lesson progress:", error);
      res.status(500).json({ message: "Failed to create lesson progress" });
    }
  });
  
  // Get all progress for a course (for a specific user)
  app.get("/api/course-progress/:courseId", isAuthenticated, async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const userId = req.user!.id;
      
      // Check if course exists and belongs to user's tenant
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      if (course.tenantId !== req.user!.tenantId) {
        return res.status(403).json({ message: "Access denied to this course" });
      }
      
      // Check if user is enrolled in the course
      const enrollments = await storage.getEnrollmentsByUser(userId);
      const enrollment = enrollments.find(e => e.courseId === courseId);
      
      if (!enrollment) {
        return res.status(403).json({ message: "You must be enrolled in this course to view progress" });
      }
      
      // Get completed lessons for this course
      const completedLessons = await storage.getLessonProgressByCourse(userId, courseId);
      
      // Get all modules and lessons in the course
      const modules = await storage.getModulesByCourse(courseId);
      const modulesWithLessons = [];
      
      for (const module of modules) {
        const lessons = await storage.getLessonsByModule(module.id);
        const lessonsWithProgress = lessons.map(lesson => {
          const isCompleted = completedLessons.some(p => p.lessonId === lesson.id);
          return {
            ...lesson,
            completed: isCompleted
          };
        });
        
        modulesWithLessons.push({
          ...module,
          lessons: lessonsWithProgress
        });
      }
      
      res.json({
        courseId,
        progress: enrollment.progress,
        completedAt: enrollment.completedAt,
        modules: modulesWithLessons,
        completedLessonCount: completedLessons.length
      });
    } catch (error) {
      console.error("Failed to fetch course progress:", error);
      res.status(500).json({ message: "Failed to fetch course progress" });
    }
  });
  
  // Admin endpoint: Get progress for all students in a course
  app.get("/api/admin/course-progress/:courseId", isAdmin, async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      
      // Check if course exists and belongs to admin's tenant
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      if (course.tenantId !== req.user!.tenantId) {
        return res.status(403).json({ message: "Access denied to this course" });
      }
      
      // Get all enrollments for this course
      const enrollments = await storage.getEnrollmentsByCourse(courseId);
      
      // Get progress data for each enrollment
      const progressData = [];
      
      for (const enrollment of enrollments) {
        const user = await storage.getUser(enrollment.userId);
        if (!user) continue;
        
        const { password, ...safeUser } = user;
        const completedLessons = await storage.getLessonProgressByCourse(enrollment.userId, courseId);
        
        progressData.push({
          user: safeUser,
          enrollment,
          completedLessonCount: completedLessons.length
        });
      }
      
      res.json({
        courseId,
        totalEnrollments: enrollments.length,
        studentProgress: progressData
      });
    } catch (error) {
      console.error("Failed to fetch course progress for admin:", error);
      res.status(500).json({ message: "Failed to fetch course progress" });
    }
  });
  
  // Image upload endpoint
  app.post("/api/ai/upload-image", isAuthenticated, handleImageUpload, uploadImage);
  
  // Image generation endpoint
  app.post("/api/ai/generate-image", isAuthenticated, generateImage);

  // Course thumbnail upload endpoint
  const courseThumbnailDir = path.join(process.cwd(), 'uploads', 'courses');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(courseThumbnailDir)) {
    fs.mkdirSync(courseThumbnailDir, { recursive: true });
  }
  
  // Configure multer for course thumbnail uploads
  const courseThumbnailStorage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, courseThumbnailDir);
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, `course-thumbnail-${uniqueSuffix}${ext}`);
    }
  });
  
  // File filter for course thumbnails
  const courseThumbnailFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Accept only jpg, jpeg, png, gif, webp files
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg' || 
        file.mimetype === 'image/png' || file.mimetype === 'image/gif' || 
        file.mimetype === 'image/webp') {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'));
    }
  };
  
  const uploadCourseThumbnail = multer({ 
    storage: courseThumbnailStorage,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB max file size
    },
    fileFilter: courseThumbnailFilter
  });
  
  // Course thumbnail upload endpoint
  app.post("/api/upload", isAuthenticated, uploadCourseThumbnail.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Return the relative path from uploads directory
      const thumbnailPath = `courses/${req.file.filename}`;
      
      res.json({ url: thumbnailPath });
    } catch (error) {
      console.error("Course thumbnail upload error:", error);
      res.status(500).json({ message: "Failed to upload course thumbnail" });
    }
  });

  // Admin grading endpoints
  app.get("/api/admin/exam-attempts", isAdmin, async (req, res) => {
    try {
      const attempts = await storage.getAllExamAttemptsForAdmin(req.user!.tenantId);
      res.json(attempts);
    } catch (error) {
      console.error("Failed to fetch exam attempts for admin:", error);
      res.status(500).json({ message: "Failed to fetch exam attempts" });
    }
  });

  app.put("/api/admin/exam-attempts/:id/grade", isAdmin, async (req, res) => {
    try {
      const attemptId = parseInt(req.params.id);
      const { feedback } = req.body;

      const attempt = await storage.gradeExamAttempt(attemptId, feedback, req.user!.tenantId);
      res.json(attempt);
    } catch (error) {
      console.error("Failed to grade exam attempt:", error);
      res.status(500).json({ message: "Failed to save grading" });
    }
  });

  // Student results endpoint
  app.get("/api/student/exam-results", isAuthenticated, async (req, res) => {
    try {
      const results = await storage.getStudentExamResults(req.user!.id);
      res.json(results);
    } catch (error) {
      console.error("Failed to fetch student exam results:", error);
      res.status(500).json({ message: "Failed to fetch exam results" });
    }
  });
  
  // Initialize the HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
