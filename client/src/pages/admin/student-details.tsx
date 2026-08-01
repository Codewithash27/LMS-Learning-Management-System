import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { format } from "date-fns";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { 
  Loader2, 
  ArrowLeft, 
  BookOpen, 
  CalendarDays, 
  Clock, 
  Users,
  GraduationCap,
  Award,
  Eye,
  EyeOff,
  Key,
  Shield,
  Mail,
  Phone,
  Cake,
  School,
  User,
  Copy,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function StudentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const studentId = parseInt(id);
  const [showPassword, setShowPassword] = useState(false);

  // Enhanced Interfaces with password field
  interface User {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    mobileNumber: string;
    gender?: string;
    dateOfBirth: string;
    profilePhoto?: string;
    educationLevel: string;
    schoolCollege: string;
    yearOfStudy: string;
    role: string;
    password?: string;
    plainPassword?: string;
    createdAt?: string;
    lastLogin?: string;
  }

  interface Course {
    id: number;
    title: string;
    description: string;
    category: string;
    difficulty: string;
    duration: number;
    thumbnail?: string;
  }

  interface Enrollment {
    id: number;
    userId: number;
    courseId: number;
    enrolledAt: string;
    completedAt?: string;
    progress: number;
  }

  interface Batch {
    id: number;
    name: string;
    batchCode: string;
    courseId: number;
    trainerId: number;
    startDate: string;
    batchTime: string;
    description: string | null;
    maxStudents: number | null;
    isActive: boolean;
  }

  interface BatchEnrollment {
    id: number;
    batchId: number;
    userId: number;
    enrolledAt: string;
    enrolledBy: number;
    status: string;
  }

  interface Exam {
    id: number;
    title: string;
    description: string;
    courseId: number;
    duration: number;
    startTime: string;
    endTime: string;
    maxAttempts: number;
  }

  interface ExamAttempt {
    id: number;
    userId: number;
    examId: number;
    startedAt: string;
    completedAt?: string;
    score?: number;
  }

  // Fetch the student details
  const { data: student, isLoading: isLoadingStudent } = useQuery<User>({
    queryKey: [`/api/users/${studentId}`],
    enabled: !!studentId,
  });

  // Fetch all courses
  const { data: allCourses = [], isLoading: isLoadingCourses } = useQuery<Course[]>({
    queryKey: ['/api/courses'],
  });

  // Fetch student's course enrollments
  const { data: enrollments = [], isLoading: isLoadingEnrollments } = useQuery<Enrollment[]>({
    queryKey: [`/api/enrollments/user/${studentId}`],
    enabled: !!studentId,
  });

  // Fetch all batches
  const { data: allBatches = [], isLoading: isLoadingBatches } = useQuery<Batch[]>({
    queryKey: ['/api/batches'],
  });

  // Fetch student's batch enrollments
  const { data: batchEnrollments = [], isLoading: isLoadingBatchEnrollments } = useQuery<BatchEnrollment[]>({
    queryKey: [`/api/batch-enrollments/user/${studentId}`],
    enabled: !!studentId,
  });

  // Fetch exam attempts
  const { data: examAttempts = [], isLoading: isLoadingExamAttempts } = useQuery<ExamAttempt[]>({
    queryKey: [`/api/exam-attempts/user/${studentId}`],
    enabled: !!studentId,
  });

  // Fetch all exams
  const { data: allExams = [], isLoading: isLoadingExams } = useQuery<Exam[]>({
    queryKey: ['/api/exams'],
  });

  // Copy password to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Password has been copied to clipboard",
    });
  };

  // Get enrolled courses
  const enrolledCourses = allCourses.filter(course => 
    enrollments.some(enrollment => enrollment.courseId === course.id)
  );

  // Get enrolled batches with course info
  const enrolledBatches = allBatches.filter(batch => 
    batchEnrollments.some(enrollment => enrollment.batchId === batch.id)
  );

  // Get exam attempts with exam info
  const studentExamAttempts = examAttempts.map(attempt => {
    const exam = allExams.find(e => e.id === attempt.examId);
    return {
      ...attempt,
      exam: exam ? exam : undefined,
    };
  });

  // Get completion stats
  const completedCourses = enrollments.filter(e => e.completedAt).length;
  const averageProgress = enrollments.length > 0 
    ? enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length 
    : 0;
  
  const averageScore = studentExamAttempts.length > 0 && studentExamAttempts.some(a => a.score !== undefined)
    ? studentExamAttempts.filter(a => a.score !== undefined)
        .reduce((sum, a) => sum + (a.score || 0), 0) / 
      studentExamAttempts.filter(a => a.score !== undefined).length
    : null;

  if (isLoadingStudent || isLoadingCourses || isLoadingEnrollments || 
      isLoadingBatches || isLoadingBatchEnrollments || isLoadingExams || isLoadingExamAttempts) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-lg text-gray-600">Loading student details...</p>
            </motion.div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!student) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <Card className="backdrop-blur-sm bg-white/70 border border-white/20 shadow-xl">
            <CardContent className="flex flex-col items-center justify-center p-12">
              <User className="h-16 w-16 text-gray-400 mb-4" />
              <p className="mb-4 text-xl font-semibold text-gray-900">Student not found</p>
              <Link href="/admin/students">
                <Button className="gap-2 bg-accent-brand text-white rounded-2xl">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Students
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link href="/admin/students">
            <Button 
              variant="ghost" 
              className="mb-4 gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to Students
            </Button>
          </Link>
          
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Student Details
            </h1>
            <p className="text-gray-600 mt-2">Complete profile and academic information</p>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Profile Card */}
          <motion.div 
            className="lg:col-span-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="backdrop-blur-sm bg-white/70 border border-white/20 shadow-xl h-full">
              <CardHeader className="pb-4">
                <div className="flex justify-center mb-4">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Avatar className="h-28 w-28 border-4 border-white shadow-2xl">
                      {student.profilePhoto ? (
                        <AvatarImage src={student.profilePhoto} alt={`${student.firstName} ${student.lastName}`} />
                      ) : (
                        <AvatarFallback className="text-2xl bg-accent-brand text-white font-bold">
                          {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </motion.div>
                </div>
                <CardTitle className="text-center text-xl font-bold">{student.firstName} {student.lastName}</CardTitle>
                <CardDescription className="text-center flex items-center justify-center gap-2">
                  <Mail className="h-4 w-4" />
                  {student.email}
                </CardDescription>
                <Badge className="w-fit mx-auto mt-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0">
                  {student.role}
                </Badge>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Password Section */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-semibold text-gray-900">Actual Password</span>
                    </div>
                    <Shield className="h-4 w-4 text-blue-600" />
                  </div>
                  
                  {student.plainPassword ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={student.plainPassword}
                          readOnly
                          className="flex-1 bg-white/70 border border-blue-200 rounded-xl font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowPassword(!showPassword)}
                          className="bg-white/70 border border-blue-200 rounded-xl"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(student.plainPassword!)}
                          className="bg-white/70 border border-blue-200 rounded-xl"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-blue-600 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Actual user password from registration
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <p className="text-sm text-gray-500">No plain password stored for this user</p>
                    </div>
                  )}
                </div>

                {/* Personal Information */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700 flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      Username:
                    </span>
                    <span className="text-gray-900 font-semibold">{student.username}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      Mobile:
                    </span>
                    <span className="text-gray-900 font-semibold">{student.mobileNumber}</span>
                  </div>
                  
                  {student.gender && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700">Gender:</span>
                      <Badge variant="outline" className="text-gray-700">{student.gender}</Badge>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700 flex items-center gap-2">
                      <Cake className="h-4 w-4 text-gray-400" />
                      Date of Birth:
                    </span>
                    <span className="text-gray-900">{format(new Date(student.dateOfBirth), "PP")}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700 flex items-center gap-2">
                      <School className="h-4 w-4 text-gray-400" />
                      Education:
                    </span>
                    <span className="text-gray-900 text-right">{student.educationLevel}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">School/College:</span>
                    <span className="text-gray-900 text-right">{student.schoolCollege}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">Year of Study:</span>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      {student.yearOfStudy}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Statistics and Content */}
          <motion.div 
            className="lg:col-span-3 space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Learning Progress Summary */}
            <Card className="backdrop-blur-sm bg-white/70 border border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-purple-600" />
                  Learning Progress Summary
                </CardTitle>
                <CardDescription>Overview of student's learning journey and performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { icon: BookOpen, value: enrolledCourses.length, label: "Enrolled Courses", color: "from-blue-500 to-cyan-600" },
                    { icon: CalendarDays, value: enrolledBatches.length, label: "Active Batches", color: "from-green-500 to-emerald-600" },
                    { icon: Award, value: completedCourses, label: "Completed Courses", color: "from-purple-500 to-pink-600" },
                    { icon: GraduationCap, value: `${Math.round(averageProgress)}%`, label: "Average Progress", color: "from-orange-500 to-red-600" },
                    { icon: Clock, value: studentExamAttempts.length, label: "Exam Attempts", color: "from-indigo-500 to-purple-600" },
                    { icon: Users, value: averageScore !== null ? `${Math.round(averageScore)}%` : 'N/A', label: "Average Score", color: "from-teal-500 to-blue-600" },
                  ].map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                      className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-4 text-center border border-white/20 hover:shadow-lg transition-all duration-300 group"
                    >
                      <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${stat.color} shadow-lg mb-3 group-hover:scale-110 transition-transform duration-300`}>
                        <stat.icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                      <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tabs Content */}
            <Tabs defaultValue="courses" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-white/50 backdrop-blur-sm border border-white/20 rounded-2xl p-1">
                {[
                  { value: "courses", label: "Enrolled Courses", icon: BookOpen },
                  { value: "batches", label: "Batch Enrollments", icon: Users },
                  { value: "exams", label: "Exam Results", icon: Award },
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="flex items-center gap-2 rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300"
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {/* Enrolled Courses Tab */}
              <TabsContent value="courses" className="space-y-4 mt-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  Enrolled Courses ({enrolledCourses.length})
                </h2>
                
                {enrolledCourses.length === 0 ? (
                  <Card className="backdrop-blur-sm bg-white/70 border border-white/20 shadow-xl">
                    <CardContent className="flex flex-col items-center justify-center p-12">
                      <BookOpen className="h-16 w-16 text-gray-400 mb-4" />
                      <p className="mb-2 text-lg font-semibold text-gray-900">No courses enrolled</p>
                      <p className="text-sm text-gray-500 text-center mb-6">This student has not enrolled in any courses yet</p>
                      <Link href="/admin/courses">
                        <Button className="gap-2 bg-accent-brand text-white rounded-2xl">
                          <BookOpen className="h-4 w-4" />
                          Browse Courses
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AnimatePresence>
                      {enrolledCourses.map((course, index) => {
                        const enrollment = enrollments.find(e => e.courseId === course.id);
                        return (
                          <motion.div
                            key={course.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                          >
                            <Card className="backdrop-blur-sm bg-white/70 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 group hover:scale-[1.02]">
                              <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                  <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                                    {course.title}
                                  </CardTitle>
                                  <Badge className={cn(
                                    "bg-gradient-to-r text-white border-0",
                                    course.difficulty === 'Beginner' ? "from-green-500 to-emerald-600" :
                                    course.difficulty === 'Intermediate' ? "from-blue-500 to-cyan-600" :
                                    "from-purple-500 to-pink-600"
                                  )}>
                                    {course.difficulty}
                                  </Badge>
                                </div>
                                <CardDescription className="flex items-center gap-2">
                                  <span>{course.category}</span>
                                  <span>•</span>
                                  <span>{course.duration} hours</span>
                                </CardDescription>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Enrolled on:</span>
                                    <span className="font-medium text-gray-900">
                                      {enrollment ? format(new Date(enrollment.enrolledAt), "PP") : "Unknown"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Progress:</span>
                                    <span className="font-bold text-blue-600">
                                      {enrollment ? `${enrollment.progress}%` : "0%"}
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-3">
                                    <motion.div 
                                      className={cn(
                                        "h-3 rounded-full bg-gradient-to-r",
                                        enrollment && enrollment.progress >= 80 ? "from-green-500 to-emerald-600" :
                                        enrollment && enrollment.progress >= 50 ? "from-blue-500 to-cyan-600" :
                                        "from-orange-500 to-red-600"
                                      )}
                                      initial={{ width: 0 }}
                                      animate={{ width: `${enrollment ? enrollment.progress : 0}%` }}
                                      transition={{ duration: 1, delay: index * 0.1 + 0.5 }}
                                    />
                                  </div>
                                  {enrollment?.completedAt && (
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-600">Completed on:</span>
                                      <span className="font-medium text-green-600">
                                        {format(new Date(enrollment.completedAt), "PP")}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                              <CardFooter>
                                <Link href={`/admin/courses/${course.id}`} className="w-full">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="w-full gap-2 bg-white/70 backdrop-blur-sm border border-white/20 rounded-xl hover:shadow-lg transition-all duration-300"
                                  >
                                    View Course Details
                                  </Button>
                                </Link>
                              </CardFooter>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </TabsContent>
              
              {/* Batch Enrollments Tab */}
              <TabsContent value="batches" className="space-y-4 mt-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  Batch Enrollments ({enrolledBatches.length})
                </h2>
                
                {enrolledBatches.length === 0 ? (
                  <Card className="backdrop-blur-sm bg-white/70 border border-white/20 shadow-xl">
                    <CardContent className="flex flex-col items-center justify-center p-12">
                      <Users className="h-16 w-16 text-gray-400 mb-4" />
                      <p className="mb-2 text-lg font-semibold text-gray-900">No batch enrollments</p>
                      <p className="text-sm text-gray-500 text-center">This student is not enrolled in any batches</p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="backdrop-blur-sm bg-white/70 border border-white/20 shadow-xl overflow-hidden">
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-white/20">
                            <TableHead className="font-bold text-gray-900 py-4">Batch Name</TableHead>
                            <TableHead className="font-bold text-gray-900">Batch Code</TableHead>
                            <TableHead className="font-bold text-gray-900">Course</TableHead>
                            <TableHead className="font-bold text-gray-900">Start Date</TableHead>
                            <TableHead className="font-bold text-gray-900">Time</TableHead>
                            <TableHead className="font-bold text-gray-900">Status</TableHead>
                            <TableHead className="font-bold text-gray-900 text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <AnimatePresence>
                            {enrolledBatches.map((batch, index) => {
                              const batchEnrollment = batchEnrollments.find(be => be.batchId === batch.id);
                              const course = allCourses.find(c => c.id === batch.courseId);
                              
                              return (
                                <motion.tr
                                  key={batch.id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  transition={{ duration: 0.3, delay: index * 0.05 }}
                                  className="border-b border-white/20 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-all duration-300"
                                >
                                  <TableCell className="py-4 font-medium">{batch.name}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="font-mono">{batch.batchCode}</Badge>
                                  </TableCell>
                                  <TableCell>{course?.title || "Unknown"}</TableCell>
                                  <TableCell>{format(new Date(batch.startDate), "PP")}</TableCell>
                                  <TableCell>
                                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                      {batch.batchTime}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge className={cn(
                                      "text-white border-0",
                                      batchEnrollment?.status === "active" 
                                        ? "bg-gradient-to-r from-green-500 to-emerald-600" 
                                        : "bg-gradient-to-r from-gray-500 to-gray-600"
                                    )}>
                                      {batchEnrollment?.status || "Unknown"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Link href={`/admin/batches/${batch.id}`}>
                                      <Button variant="outline" size="sm" className="rounded-xl">
                                        View Batch
                                      </Button>
                                    </Link>
                                  </TableCell>
                                </motion.tr>
                              );
                            })}
                          </AnimatePresence>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              {/* Exam Results Tab */}
              <TabsContent value="exams" className="space-y-4 mt-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Award className="h-5 w-5 text-purple-600" />
                  Exam Results ({studentExamAttempts.length})
                </h2>
                
                {studentExamAttempts.length === 0 ? (
                  <Card className="backdrop-blur-sm bg-white/70 border border-white/20 shadow-xl">
                    <CardContent className="flex flex-col items-center justify-center p-12">
                      <Award className="h-16 w-16 text-gray-400 mb-4" />
                      <p className="mb-2 text-lg font-semibold text-gray-900">No exam attempts</p>
                      <p className="text-sm text-gray-500 text-center">This student has not attempted any exams yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="backdrop-blur-sm bg-white/70 border border-white/20 shadow-xl overflow-hidden">
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-white/20">
                            <TableHead className="font-bold text-gray-900 py-4">Exam Title</TableHead>
                            <TableHead className="font-bold text-gray-900">Course</TableHead>
                            <TableHead className="font-bold text-gray-900">Started On</TableHead>
                            <TableHead className="font-bold text-gray-900">Completed</TableHead>
                            <TableHead className="font-bold text-gray-900">Score</TableHead>
                            <TableHead className="font-bold text-gray-900">Status</TableHead>
                            <TableHead className="font-bold text-gray-900 text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <AnimatePresence>
                            {studentExamAttempts.map((attempt, index) => {
                              const course = attempt.exam ? allCourses.find(c => c.id === attempt.exam.courseId) : null;
                              const isCompleted = !!attempt.completedAt;
                              
                              return (
                                <motion.tr
                                  key={attempt.id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  transition={{ duration: 0.3, delay: index * 0.05 }}
                                  className="border-b border-white/20 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-all duration-300"
                                >
                                  <TableCell className="py-4 font-medium">{attempt.exam?.title || "Unknown Exam"}</TableCell>
                                  <TableCell>{course?.title || "Unknown"}</TableCell>
                                  <TableCell>{format(new Date(attempt.startedAt), "PP")}</TableCell>
                                  <TableCell>
                                    {attempt.completedAt ? format(new Date(attempt.completedAt), "PP") : "Not completed"}
                                  </TableCell>
                                  <TableCell>
                                    {attempt.score !== undefined ? (
                                      <Badge className={cn(
                                        "text-white border-0",
                                        attempt.score >= 80 ? "bg-gradient-to-r from-green-500 to-emerald-600" :
                                        attempt.score >= 60 ? "bg-gradient-to-r from-blue-500 to-cyan-600" :
                                        "bg-gradient-to-r from-red-500 to-pink-600"
                                      )}>
                                        {attempt.score}%
                                      </Badge>
                                    ) : (
                                      "N/A"
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={isCompleted ? "default" : "secondary"}>
                                      {isCompleted ? "Completed" : "In Progress"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {attempt.exam ? (
                                      <Link href={`/admin/exams/${attempt.exam.id}`}>
                                        <Button variant="outline" size="sm" className="rounded-xl">
                                          View Exam
                                        </Button>
                                      </Link>
                                    ) : (
                                      <Button variant="outline" size="sm" disabled className="rounded-xl">
                                        View Exam
                                      </Button>
                                    )}
                                  </TableCell>
                                </motion.tr>
                              );
                            })}
                          </AnimatePresence>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}