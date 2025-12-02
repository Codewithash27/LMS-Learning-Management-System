# Learning Management System (LMS)

A comprehensive, full-stack Learning Management System built with modern web technologies. This platform enables educational institutions to manage courses, students, batches, exams, and track learning progress with an integrated AI assistant.

## 🚀 Features

### Admin Features
- **Dashboard**: Comprehensive analytics and overview of system activity
- **Course Management**: Create and manage courses with modules, lessons, videos, and quizzes
- **Student Management**: Add, view, and manage student profiles and enrollments
- **Batch Management**: Organize students into batches with trainers and schedules
- **Exam Management**: Create text-based assignments/exams with question management
- **Grading System**: Review and grade student exam submissions with feedback
- **Reports & Analytics**: View detailed reports on student progress and course performance
- **Activity Tracking**: Monitor student engagement and learning activities

### Student Features
- **Dashboard**: Personalized dashboard with course progress and upcoming exams
- **My Courses**: Browse and access enrolled courses with progress tracking
- **Course Content**: Access video lessons, text content, and interactive quizzes
- **Exams**: Take assignments/exams and view results
- **AI Assistant**: Chat with AI for learning support and image analysis
- **Progress Tracking**: Monitor completion status and learning progress
- **Profile Management**: Update personal information and profile photo

### Technical Features
- **Multi-tenant Architecture**: Support for multiple organizations/tenants
- **Role-based Access Control**: Admin, Super Admin, and Student roles
- **File Upload**: Support for course thumbnails, profile photos, and images
- **AI Integration**: Together AI for chat assistance and image analysis
- **Real-time Progress Tracking**: Track lesson completion and course progress
- **Responsive Design**: Modern UI built with shadcn/ui and Tailwind CSS

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Wouter** - Lightweight routing
- **TanStack Query** - Data fetching and caching
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components
- **Recharts** - Data visualization
- **Framer Motion** - Animation library
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Backend
- **Express.js** - Web framework
- **Node.js** - Runtime environment
- **TypeScript** - Type safety
- **PostgreSQL** - Relational database
- **Drizzle ORM** - Type-safe SQL ORM
- **Passport.js** - Authentication middleware
- **Express Session** - Session management
- **Multer** - File upload handling

### AI & External Services
- **Together AI** - AI chat and image analysis
- **Image Processing** - Image upload and analysis capabilities

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **PostgreSQL** (v12 or higher)
- **Git**

## 🔧 Installation

1. **Clone the repository**sh
   git clone <your-repository-url>
   cd LMS_Trial
   2. **Install dependencies**
   npm install 
   3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   # Database
   DATABASE_URL=postgresql://username:password@localhost:5432/lms_db

   # Session Secret (generate a random string)
   SESSION_SECRET=your-session-secret-here

   # Together AI API Keys (comma-separated for rotation)
   TOGETHER_API_KEYS=your-api-key-1,your-api-key-2

   # Server
   NODE_ENV=development
   PORT=5000
   4. **Set up the database**
   
   Create a PostgreSQL database:
   CREATE DATABASE lms_db;
      Push the schema to the database:
  
   npm run db:push
   5. **Start the development server**sh
   npm run dev
      The application will be available at `http://localhost:5000`

## 📁 Project Structure

<img width="652" height="662" alt="image" src="https://github.com/user-attachments/assets/092c6cc2-6502-408d-bfce-549ccfa0a7de" />

