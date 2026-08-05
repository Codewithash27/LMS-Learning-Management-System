import { useState, useMemo } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import Header from "@/components/layout/header";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  LineChart, 
  Download, 
  Users, 
  BookOpen, 
  ClipboardList, 
  Activity,
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  Clock,
  Calendar,
  Filter,
  RefreshCw,
  FileText,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  BarChart,
  PieChart as PieChartLucide
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  PieChart,
  Pie,
  BarChart as RechartsBarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  Area,
  AreaChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Color scheme matching courses.tsx
const COLORS = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
};

// Sample data - in a real application, this would come from API
const pieData = [
  { name: 'Completed', value: 45, color: '#10b981' },
  { name: 'In Progress', value: 35, color: '#f59e0b' },
  { name: 'Not Started', value: 20, color: '#e5e7eb' },
];

const barData = [
  { name: 'Intro to Programming', students: 120, completion: 85, avgScore: 87 },
  { name: 'Data Structures', students: 78, completion: 72, avgScore: 82 },
  { name: 'Web Development', students: 95, completion: 90, avgScore: 91 },
  { name: 'Machine Learning', students: 62, completion: 45, avgScore: 78 },
  { name: 'Advanced Mathematics', students: 55, completion: 60, avgScore: 75 },
];

const generateLineData = (days: number = 7) => {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      logins: Math.floor(Math.random() * 80) + 20,
      courseViews: Math.floor(Math.random() * 150) + 50,
      examStarts: Math.floor(Math.random() * 30) + 5,
      completions: Math.floor(Math.random() * 25) + 10,
    };
  });
};

const engagementData = [
  { name: 'Morning (6AM-12PM)', value: 35, color: '#3b82f6' },
  { name: 'Afternoon (12PM-5PM)', value: 45, color: '#f59e0b' },
  { name: 'Evening (5PM-10PM)', value: 60, color: '#06b6d4' },
  { name: 'Night (10PM-6AM)', value: 25, color: '#e5e7eb' },
];

const performanceData = [
  { subject: 'Engagement', A: 85, fullMark: 100 },
  { subject: 'Completion', A: 78, fullMark: 100 },
  { subject: 'Scores', A: 82, fullMark: 100 },
  { subject: 'Retention', A: 75, fullMark: 100 },
  { subject: 'Satisfaction', A: 88, fullMark: 100 },
];

export default function AdminReports() {
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState("7d");
  const [refreshKey, setRefreshKey] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Fetch required data
  const { data: students = [], refetch: refetchStudents } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });
  
  const { data: courses = [], refetch: refetchCourses } = useQuery<any[]>({
    queryKey: ["/api/courses"],
  });
  
  const { data: exams = [], refetch: refetchExams } = useQuery<any[]>({
    queryKey: ["/api/exams"],
  });
  
  const { data: activityLogs = [], refetch: refetchActivityLogs } = useQuery<any[]>({
    queryKey: ["/api/activity-logs/tenant"],
  });
  
  // Count only student users
  const studentCount = (students as any[]).filter((user: any) => user.role === "student").length;
  
  // Calculate statistics
  const stats = useMemo(() => {
    const coursesArray = courses as any[];
    const examsArray = exams as any[];
    const activityLogsArray = activityLogs as any[];
    
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
      totalActivityLogs: activityLogsArray.length,
      totalEnrollments,
      avgCompletion,
    };
  }, [students, courses, exams, activityLogs, studentCount]);
  
  // Generate line data based on date range
  const lineData = useMemo(() => {
    const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
    return generateLineData(days);
  }, [dateRange, refreshKey]);
  
  // Handle export report
  const handleExportReport = () => {
    toast({
      title: "📊 Exporting Report",
      description: "Your report is being generated and will download shortly."
    });
    // Simulate export
    setTimeout(() => {
      toast({
        title: "✅ Report Exported",
        description: "Report has been downloaded successfully."
      });
    }, 1500);
  };
  
  // Handle refresh
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    refetchStudents();
    refetchCourses();
    refetchExams();
    refetchActivityLogs();
    toast({
      title: "🔄 Refreshing Data",
      description: "Updating all analytics data..."
    });
  };
  
  // Calculate trends (mock data - replace with actual calculations)
  const trends = {
    students: { value: 12, isPositive: true },
    courses: { value: 3, isPositive: true },
    exams: { value: 5, isPositive: true },
    activity: { value: 8, isPositive: true },
  };

  return (
    <DashboardLayout>
      <Header 
        title="Reports & Analytics"
      />

      {/* Controls Bar */}
      <motion.div 
        className="mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-full sm:w-40 bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-3 w-full lg:w-auto">
          <Button 
            variant="outline" 
            className="gap-2 bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl hover:shadow-lg transition-all duration-300"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          
          <Button 
            variant="outline" 
            className="gap-2 bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl hover:shadow-lg transition-all duration-300"
          >
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          
          <Button 
            onClick={handleExportReport}
            className="gap-2 bg-accent-brand text-white border-0 rounded-2xl hover:shadow-xl transition-all duration-300"
          >
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </motion.div>
      
      
      
      {/* Additional Stats Row */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
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
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 bg-white/50 backdrop-blur-sm border border-white/20 rounded-2xl p-1">
          <TabsTrigger 
            value="overview" 
            className="rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-brand-blue data-[state=active]:text-white"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="courses"
            className="rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-brand-blue data-[state=active]:text-white"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Courses
          </TabsTrigger>
          <TabsTrigger 
            value="students"
            className="rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-brand-blue data-[state=active]:text-white"
          >
            <Users className="h-4 w-4 mr-2" />
            Students
          </TabsTrigger>
          <TabsTrigger 
            value="activity"
            className="rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-brand-blue data-[state=active]:text-white"
          >
            <Activity className="h-4 w-4 mr-2" />
            Activity
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="backdrop-blur-sm bg-white/70 border border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-900">
                    <LineChart className="h-5 w-5 mr-2 text-blue-600" />
                    Platform Activity
                  </CardTitle>
                  <CardDescription>
                    Daily logins, course views, exam starts, and completions
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={lineData}>
                        <defs>
                          <linearGradient id="colorLogins" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '12px'
                          }} 
                        />
                        <Legend />
                        <Area type="monotone" dataKey="logins" stroke="#3b82f6" fillOpacity={1} fill="url(#colorLogins)" />
                        <Area type="monotone" dataKey="courseViews" stroke="#06b6d4" fillOpacity={1} fill="url(#colorViews)" />
                        <Line type="monotone" dataKey="examStarts" stroke="#f59e0b" strokeWidth={2} />
                        <Line type="monotone" dataKey="completions" stroke="#10b981" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="backdrop-blur-sm bg-white/70 border border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-900">
                    <PieChartIcon className="h-5 w-5 mr-2 text-teal-700" />
                    Course Completion Status
                  </CardTitle>
                  <CardDescription>
                    Overall completion rate across all courses
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-80 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '12px'
                          }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    {pieData.map((item, index) => (
                      <div key={index} className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-sm font-medium text-gray-700">{item.name}</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{item.value}%</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="backdrop-blur-sm bg-white/70 border border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900">
                  <BarChart3 className="h-5 w-5 mr-2 text-green-600" />
                  Top Courses by Enrollment
                </CardTitle>
                <CardDescription>
                  Number of students enrolled, completion rate, and average scores
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={barData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" stroke="#6b7280" angle={-45} textAnchor="end" height={100} />
                      <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
                      <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '12px'
                        }} 
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="students" name="Students Enrolled" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                      <Bar yAxisId="right" dataKey="completion" name="Completion %" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Performance Radar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="backdrop-blur-sm bg-white/70 border border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900">
                  <Target className="h-5 w-5 mr-2 text-amber-600" />
                  Performance Overview
                </CardTitle>
                <CardDescription>
                  Multi-dimensional performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={performanceData}>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis dataKey="subject" stroke="#6b7280" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#6b7280" />
                      <Radar name="Performance" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '12px'
                        }} 
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
        
        <TabsContent value="courses" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="backdrop-blur-sm bg-white/70 border border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900">
                  <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                  Course Performance Analysis
                </CardTitle>
                <CardDescription>
                  Detailed metrics and analytics for each course
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {barData.map((course, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="p-4 rounded-2xl bg-gradient-to-r from-gray-50/50 to-gray-100/50 border border-white/20 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">{course.name}</h4>
                          <p className="text-sm text-gray-600">{course.students} students enrolled</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800 border border-green-200">
                          {course.completion}% Complete
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Completion Rate</span>
                          <span className="font-medium text-gray-900">{course.completion}%</span>
                        </div>
                        <Progress value={course.completion} className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-green-400 [&>div]:to-emerald-400" />
                        <div className="flex justify-between text-sm mt-2">
                          <span className="text-gray-600">Average Score</span>
                          <span className="font-medium text-gray-900">{course.avgScore}%</span>
                        </div>
                        <Progress value={course.avgScore} className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-brand-blue" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <Card className="backdrop-blur-sm bg-white/70 border border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="text-gray-900">Course Distribution</CardTitle>
                <CardDescription>Courses by category and difficulty</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={barData.slice(0, 3)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '12px'
                        }} 
                      />
                      <Bar dataKey="students" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="backdrop-blur-sm bg-white/70 border border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="text-gray-900">Course Statistics</CardTitle>
                <CardDescription>Quick overview metrics</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/50">
                  <div className="flex items-center">
                    <BookOpen className="h-5 w-5 text-blue-600 mr-3" />
                    <span className="text-gray-700">Total Courses</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{(courses as any[]).length}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-green-50/50">
                  <div className="flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mr-3" />
                    <span className="text-gray-700">Active Courses</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{stats.activeCourses}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-teal-50/50">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-teal-700 mr-3" />
                    <span className="text-gray-700">Total Enrollments</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{stats.totalEnrollments}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
        
        <TabsContent value="students" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="backdrop-blur-sm bg-white/70 border border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900">
                  <Clock className="h-5 w-5 mr-2 text-blue-600" />
                  Student Engagement Metrics
                </CardTitle>
                <CardDescription>
                  Detailed engagement data by time of day
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={engagementData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '12px'
                        }} 
                      />
                      <Legend />
                      <Bar dataKey="value" name="Activity Level" radius={[8, 8, 0, 0]}>
                        {engagementData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <Card className="backdrop-blur-sm bg-white/70 border border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900">
                  <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                  Student Performance Overview
                </CardTitle>
                <CardDescription>
                  Key performance indicators
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="p-4 rounded-xl bg-gradient-to-r from-teal-50/50 to-cyan-50/50 border border-white/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Average Score</span>
                    <span className="text-2xl font-bold text-gray-900">87%</span>
                  </div>
                  <Progress value={87} className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-brand-blue" />
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-r from-green-50/50 to-emerald-50/50 border border-white/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Completion Rate</span>
                    <span className="text-2xl font-bold text-gray-900">76%</span>
                  </div>
                  <Progress value={76} className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-green-400 [&>div]:to-emerald-400" />
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50/50 to-orange-50/50 border border-white/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Active Students</span>
                    <span className="text-2xl font-bold text-gray-900">{Math.round(stats.totalStudents * 0.85)}</span>
                  </div>
                  <Progress value={85} className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-amber-400 [&>div]:to-orange-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="backdrop-blur-sm bg-white/70 border border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900">
                  <Award className="h-5 w-5 mr-2 text-amber-600" />
                  Top Performers
                </CardTitle>
                <CardDescription>
                  Students with highest achievements
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((rank) => (
                    <div key={rank} className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-gray-50/50 to-gray-100/50 border border-white/20 hover:shadow-md transition-all duration-300">
                      <div className="flex items-center">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mr-3",
                          rank === 1 && "bg-gradient-to-br from-yellow-400 to-amber-500 text-white",
                          rank === 2 && "bg-gradient-to-br from-gray-300 to-gray-400 text-white",
                          rank === 3 && "bg-gradient-to-br from-amber-600 to-orange-600 text-white",
                          rank > 3 && "bg-gray-200 text-gray-700"
                        )}>
                          {rank}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Student {rank}</p>
                          <p className="text-sm text-gray-600">{95 - rank * 2}% average</p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800 border border-green-200">
                        {Math.floor(Math.random() * 10) + 5} courses
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
        
        <TabsContent value="activity" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="backdrop-blur-sm bg-white/70 border border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900">
                  <Activity className="h-5 w-5 mr-2 text-teal-700" />
                  Platform Activity Logs
                </CardTitle>
                <CardDescription>
                  Real-time activity tracking and analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {(activityLogs as any[]).length > 0 ? (
                    (activityLogs as any[]).slice(0, 10).map((log: any, index: number) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="p-4 rounded-xl bg-gradient-to-r from-gray-50/50 to-gray-100/50 border border-white/20 hover:shadow-md transition-all duration-300"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="p-2 rounded-lg bg-blue-100 mr-3">
                              <Activity className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{log.action || 'Activity'}</p>
                              <p className="text-sm text-gray-600">{log.user || 'System'} • {log.timestamp || 'Just now'}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-white/50">
                            {log.type || 'Info'}
                          </Badge>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        No activity logs yet
                      </h3>
                      <p className="text-gray-500">
                        Activity logs will appear here as users interact with the platform.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <Card className="backdrop-blur-sm bg-white/70 border border-white/20 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Today's Activity</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-2">
                      {Math.floor((activityLogs as any[]).length * 0.3)}
                    </h3>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-100">
                    <Zap className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="backdrop-blur-sm bg-white/70 border border-white/20 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">This Week</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-2">
                      {(activityLogs as any[]).length}
                    </h3>
                  </div>
                  <div className="p-3 rounded-xl bg-green-100">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="backdrop-blur-sm bg-white/70 border border-white/20 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Peak Hours</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-2">
                      2-5 PM
                    </h3>
                  </div>
                  <div className="p-3 rounded-xl bg-teal-100">
                    <Clock className="h-6 w-6 text-teal-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
