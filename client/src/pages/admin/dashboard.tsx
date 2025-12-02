import { useEffect, useMemo } from "react";
import Header from "@/components/layout/header";
import DashboardLayout from "@/components/layout/dashboard-layout";
import StatCard from "@/components/dashboard/stat-card";
import ActivityChart from "@/components/dashboard/activity-chart";
import PerformanceMetrics from "@/components/dashboard/performance-metrics";
import RecentActivities from "@/components/dashboard/recent-activities";
import UpcomingExams from "@/components/dashboard/upcoming-exams";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  BookOpen, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  Target,
  Award,
  Clock,
  Activity,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  ClipboardList,
  GraduationCap,
  Zap,
  BarChart3,
  PlayCircle,
  Eye
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Sample activity data
  const activityData = [
    { day: 'Mon', percentage: 40 },
    { day: 'Tue', percentage: 65 },
    { day: 'Wed', percentage: 85 },
    { day: 'Thu', percentage: 95, isCurrentDay: true },
    { day: 'Fri', percentage: 75 },
    { day: 'Sat', percentage: 50 },
    { day: 'Sun', percentage: 30 },
  ];
  
  // Sample course performance data
  const coursePerformance = [
    { name: 'Introduction to Programming', percentage: 87 },
    { name: 'Data Structures', percentage: 74 },
    { name: 'Advanced Mathematics', percentage: 65 },
    { name: 'Web Development Basics', percentage: 92 },
    { name: 'Machine Learning', percentage: 51 },
  ];
  
  // Sample recent activities
  const recentActivities = [
    {
      id: 1,
      type: 'new-course',
      title: 'New Course Added',
      description: 'Advanced Web Development with React',
      time: '2h ago',
    },
    {
      id: 2,
      type: 'exam-results',
      title: 'Exam Results Published',
      description: 'Data Structures Mid-Term Examination',
      time: '5h ago',
    },
    {
      id: 3,
      type: 'deadline',
      title: 'Deadline Reminder',
      description: 'Machine Learning Project Submission',
      time: '1d ago',
    },
    {
      id: 4,
      type: 'new-students',
      title: 'New Students Enrolled',
      description: '15 new students joined Advanced Mathematics',
      time: '2d ago',
    },
  ];
  
  // Sample upcoming exams
  const upcomingExams = [
    {
      id: 1,
      title: 'Data Structures',
      subtitle: 'Final Examination',
      urgency: 'high',
      urgencyLabel: 'Tomorrow',
      time: '09:00 AM - 11:00 AM',
    },
    {
      id: 2,
      title: 'Web Development',
      subtitle: 'Mid-Term Quiz',
      urgency: 'medium',
      urgencyLabel: 'In 3 days',
      time: '02:00 PM - 03:30 PM',
    },
    {
      id: 3,
      title: 'Machine Learning',
      subtitle: 'Project Presentation',
      urgency: 'low',
      urgencyLabel: 'Next week',
      time: '10:00 AM - 01:00 PM',
    },
  ];

  // Fetch dashboard data
  const { data: students = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
    enabled: !!user,
  });
  
  const { data: courses = [] } = useQuery<any[]>({
    queryKey: ["/api/courses"],
    enabled: !!user,
  });
  
  const { data: exams = [] } = useQuery<any[]>({
    queryKey: ["/api/exams"],
    enabled: !!user,
  });
  
  const { data: activityLogs = [] } = useQuery<any[]>({
    queryKey: ["/api/activity-logs/tenant"],
    enabled: !!user,
  });
  
  // Calculate statistics
  const stats = useMemo(() => {
    const studentsArray = students as any[];
    const coursesArray = courses as any[];
    const examsArray = exams as any[];
    
    const studentCount = studentsArray.filter((u: any) => u.role === "student").length;
    const activeCourses = coursesArray.filter((c: any) => c.status === 'active' || !c.status).length;
    const totalEnrollments = coursesArray.reduce((sum: number, course: any) => {
      return sum + (course.enrollments?.length || 0);
    }, 0);
    const avgCompletion = coursesArray.length > 0 
      ? Math.round(coursesArray.reduce((sum: number, course: any) => {
          const progress = course.enrollments?.reduce((pSum: number, e: any) => pSum + (e.progress || 0), 0) || 0;
          const count = course.enrollments?.length || 1;
          return sum + (progress / count);
        }, 0) / coursesArray.length)
      : 0;
    
    return {
      totalStudents: studentCount,
      activeCourses,
      totalExams: examsArray.length,
      totalEnrollments,
      avgCompletion,
      totalActivityLogs: (activityLogs as any[]).length,
    };
  }, [students, courses, exams, activityLogs]);

  // Log activity on dashboard visit
  useEffect(() => {
    if (user) {
      const logActivity = async () => {
        try {
          await apiRequest("POST", "/api/activity-logs", {
            activityType: "dashboard_view",
            resourceId: 0,
            resourceType: "dashboard"
          });
        } catch (error) {
          // Silent fail - activity logging shouldn't disrupt user experience
        }
      };
      
      logActivity();
    }
  }, [user]);

  return (
    <DashboardLayout>
      <Header 
        title="Dashboard" 
        subtitle={`Welcome back, ${user?.firstName || 'Admin'}. Here's what's happening with your platform.`}
      />
      
      {/* Main Statistics Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.totalStudents}</h3>
                <div className="flex items-center mt-2 text-sm">
                  <span className="text-green-600 flex items-center">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    +12% this month
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Courses</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.activeCourses}</h3>
                <div className="flex items-center mt-2 text-sm">
                  <span className="text-green-600 flex items-center">
                    <Sparkles className="h-3 w-3 mr-1" />
                    +3 new this month
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming Exams</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.totalExams}</h3>
                <div className="flex items-center mt-2 text-sm">
                  <span className="text-gray-600">
                    {upcomingExams.length} scheduled
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Completion</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.avgCompletion}%</h3>
                <div className="flex items-center mt-2 text-sm">
                  <span className="text-green-600 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +5% this month
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg">
                <Target className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      {/* Additional Stats Row */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="backdrop-blur-sm bg-white/70 border border-white/20 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Enrollments</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.totalEnrollments}</h3>
              </div>
              <div className="p-2 rounded-xl bg-blue-100">
                <Award className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="backdrop-blur-sm bg-white/70 border border-white/20 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Activity Logs</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.totalActivityLogs}</h3>
              </div>
              <div className="p-2 rounded-xl bg-amber-100">
                <Activity className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="backdrop-blur-sm bg-white/70 border border-white/20 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Score</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">87%</h3>
              </div>
              <div className="p-2 rounded-xl bg-green-100">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      {/* Charts and Metrics Section */}
      <div className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2"
        >
          <ActivityChart 
            data={activityData} 
            changePercentage="18.2%" 
            isPositiveChange={true}
            className="h-full"
          />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <PerformanceMetrics 
            courses={coursePerformance}
            className="h-full"
          />
        </motion.div>
      </div>
      
      {/* Recent Activities and Upcoming Exams */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="lg:col-span-2"
        >
          <RecentActivities 
            activities={recentActivities}
            className="h-full"
          />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <UpcomingExams 
            exams={upcomingExams}
            onScheduleExam={() => {
              toast({
                title: "Coming soon",
                description: "Use the Exams page to schedule a new exam."
              });
            }}
            className="h-full"
          />
        </motion.div>
      </div>
      
      {/* Quick Actions and Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <Card className="backdrop-blur-sm bg-white/70 border border-white/20 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900">
              <Zap className="h-5 w-5 mr-2 text-amber-600" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Frequently used actions and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col items-center gap-2 bg-gradient-to-br from-blue-50/50 to-purple-50/50 border border-white/20 rounded-2xl hover:shadow-lg transition-all duration-300"
                onClick={() => window.location.href = '/admin/courses'}
              >
                <BookOpen className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Create Course</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col items-center gap-2 bg-gradient-to-br from-green-50/50 to-emerald-50/50 border border-white/20 rounded-2xl hover:shadow-lg transition-all duration-300"
                onClick={() => window.location.href = '/admin/exams'}
              >
                <ClipboardList className="h-5 w-5 text-green-600" />
                <span className="font-medium">Schedule Exam</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col items-center gap-2 bg-gradient-to-br from-purple-50/50 to-pink-50/50 border border-white/20 rounded-2xl hover:shadow-lg transition-all duration-300"
                onClick={() => window.location.href = '/admin/reports'}
              >
                <BarChart3 className="h-5 w-5 text-purple-600" />
                <span className="font-medium">View Reports</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col items-center gap-2 bg-gradient-to-br from-amber-50/50 to-orange-50/50 border border-white/20 rounded-2xl hover:shadow-lg transition-all duration-300"
                onClick={() => window.location.href = '/admin/users'}
              >
                <Users className="h-5 w-5 text-amber-600" />
                <span className="font-medium">Manage Users</span>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="backdrop-blur-sm bg-white/70 border border-white/20 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900">
              <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
              Platform Insights
            </CardTitle>
            <CardDescription>
              Key metrics and trends
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/50 to-purple-50/50 border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Student Growth</span>
                <Badge className="bg-green-100 text-green-800 border border-green-200">
                  +12%
                </Badge>
              </div>
              <Progress value={75} className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-blue-400 [&>div]:to-purple-400" />
            </div>
            
            <div className="p-4 rounded-xl bg-gradient-to-r from-green-50/50 to-emerald-50/50 border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Course Engagement</span>
                <Badge className="bg-blue-100 text-blue-800 border border-blue-200">
                  {stats.avgCompletion}%
                </Badge>
              </div>
              <Progress value={stats.avgCompletion} className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-green-400 [&>div]:to-emerald-400" />
            </div>
            
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50/50 to-orange-50/50 border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Platform Activity</span>
                <Badge className="bg-purple-100 text-purple-800 border border-purple-200">
                  High
                </Badge>
              </div>
              <Progress value={85} className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-amber-400 [&>div]:to-orange-400" />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
}
