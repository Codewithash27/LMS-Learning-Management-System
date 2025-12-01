import { useState } from "react";
import { Link } from "wouter";
import Header from "@/components/layout/header";
import DashboardLayout from "@/components/layout/dashboard-layout";
import CourseEditor from "@/components/courses/course-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  MoreVertical,
  BookOpen,
  Clock,
  Users,
  BarChart3,
  PlayCircle,
  Image as ImageIcon,
  Sparkles,
  CheckCircle,
  Calendar,
  Eye,
  BarChart,
  GraduationCap,
  Target,
  TrendingUp
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function AdminCourses() {
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState<"grid" | "table">("grid");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const { toast } = useToast();
  
  // Fetch courses
  const { data: courses = [] as any[], isLoading: isLoadingCourses } = useQuery<any[]>({
    queryKey: ["/api/courses"],
  });
  
  // Delete course mutation
  const deleteMutation = useMutation({
    mutationFn: async (courseId: number) => {
      await apiRequest("DELETE", `/api/courses/${courseId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["/api/courses"]});
      toast({
        title: "🎉 Course deleted successfully",
        description: `${selectedCourse?.title} has been deleted`,
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete course",
        description: error.message || "There was an error deleting the course",
        variant: "destructive",
      });
    }
  });
  
  // Handle opening the course editor for creation
  const handleCreateCourse = () => {
    setSelectedCourse(null);
    setIsEditorOpen(true);
  };
  
  // Handle opening the course editor for editing
  const handleEditCourse = async (course: any) => {
    if (!course?.id) {
      toast({
        title: "Error",
        description: "Invalid course data. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const response = await apiRequest("GET", `/api/courses/${course.id}`);
      const fullCourseData = await response.json();
      setSelectedCourse(fullCourseData);
      setIsEditorOpen(true);
    } catch (error) {
      console.error("Error fetching course details:", error);
      toast({
        title: "Error",
        description: "Failed to fetch course details. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Handle opening the delete confirmation dialog
  const handleDeleteCourse = (course: any) => {
    setSelectedCourse(course);
    setIsDeleteDialogOpen(true);
  };
  
  // Confirm deletion
  const confirmDeleteCourse = () => {
    if (selectedCourse?.id) {
      deleteMutation.mutate(selectedCourse.id);
    } else {
      toast({
        title: "Error",
        description: "Invalid course data. Cannot delete.",
        variant: "destructive",
      });
    }
  };
  
  // Filter courses based on search term and filters
  const filteredCourses = courses.filter((course: any) => {
    const matchesSearch = 
      (course.title?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (course.description?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || course.status === statusFilter;
    const matchesLevel = levelFilter === "all" || course.difficulty === levelFilter;
    
    return matchesSearch && matchesStatus && matchesLevel;
  });
  
  // Get course statistics
  const courseStats = {
    total: courses.length,
    active: courses.filter((c: any) => c.status === 'active' || !c.status).length,
    upcoming: courses.filter((c: any) => c.status === 'upcoming').length,
    completed: courses.filter((c: any) => c.status === 'completed').length,
  };

  // Helper function to get badge color based on difficulty
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'intermediate':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'advanced':
        return 'bg-purple-100 text-purple-800 border border-purple-200';
      case 'expert':
        return 'bg-red-100 text-red-800 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  // Calculate random progress for demo (replace with actual data)
  const getRandomProgress = (courseId: number | undefined) => {
    if (!courseId) return 0;
    const progress = [87, 74, 65, 92, 51, 78, 83, 69];
    return progress[courseId % progress.length];
  };

  // Get random student count for demo
  const getRandomStudents = (courseId: number | undefined) => {
    if (!courseId) return 0;
    const students = [24, 18, 32, 15, 27, 21, 36, 29];
    return students[courseId % students.length];
  };

  return (
    <DashboardLayout>
      <Header 
        title="Courses" 
        subtitle="Manage your courses and curriculum"
      />
      
      {/* Statistics Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-sm border border-white/20 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Courses</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{courseStats.total}</h3>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm text-green-600">
              <Sparkles className="h-4 w-4 mr-1" />
              <span>+3 new this month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-white/20 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Courses</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{courseStats.active}</h3>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                <PlayCircle className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm text-gray-600">
              <span>Most popular: Web Development</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-sm border border-white/20 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">142</h3>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm text-green-600">
              <span>+12 this week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-white/20 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Completion</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">76%</h3>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg">
                <Target className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm text-gray-600">
              <span>Trending: +5% this month</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      {/* Search and Controls */}
      <motion.div 
        className="mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Search courses by title or description..."
              className="pl-10 bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl focus:ring-2 focus:ring-blue-500/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>

            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex gap-3 w-full lg:w-auto">
          <Button 
            variant="outline" 
            className="gap-2 bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl hover:shadow-lg transition-all duration-300"
          >
            <Filter size={16} />
            Filter
          </Button>
          
          <Button 
            variant="outline" 
            className={cn(
              "gap-2 bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl hover:shadow-lg transition-all duration-300",
              view === "grid" ? "bg-blue-50 border-blue-200" : ""
            )}
            onClick={() => setView("grid")}
          >
            <BarChart size={16} />
            Grid
          </Button>
          
          <Button 
            variant="outline" 
            className={cn(
              "gap-2 bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl hover:shadow-lg transition-all duration-300",
              view === "table" ? "bg-blue-50 border-blue-200" : ""
            )}
            onClick={() => setView("table")}
          >
            <Calendar size={16} />
            Table
          </Button>

          {/* Create Course Button */}
          <Button 
            onClick={handleCreateCourse}
            className="gap-2 bg-gradient-to-br from-blue-500 to-purple-600 text-white border-0 rounded-2xl hover:shadow-xl transition-all duration-300"
          >
            <Plus size={16} />
            Create Course
          </Button>
        </div>
      </motion.div>
      
      {/* Courses View */}
      {isLoadingCourses ? (
        <Card className="backdrop-blur-sm bg-white/70 border border-white/20 shadow-xl">
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="border border-white/20">
                    <div className="h-40 bg-gray-200 rounded-t-lg"></div>
                    <CardContent className="pt-6">
                      <div className="h-6 bg-gray-200 rounded mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2 w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : filteredCourses.length === 0 ? (
        <motion.div 
          className="text-center py-16 backdrop-blur-sm bg-white/50 rounded-3xl border border-white/20 shadow-xl"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No courses found</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            {searchTerm ? "No courses match your search criteria. Try a different search term." : "Get started by creating your first course."}
          </p>
          <Button 
            onClick={handleCreateCourse}
            className="gap-2 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-2xl hover:shadow-xl"
          >
            <Plus className="h-4 w-4" />
            Create First Course
          </Button>
        </motion.div>
      ) : view === "grid" ? (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <AnimatePresence>
            {filteredCourses.map((course: any, index: number) => {
              const progress = getRandomProgress(course.id);
              const studentCount = getRandomStudents(course.id);
              
              return (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="backdrop-blur-sm bg-white/70 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 group hover:scale-[1.02] overflow-hidden">
                    {/* Course Header with Thumbnail */}
                    <div className="h-40 relative flex items-center justify-center overflow-hidden">
                      {course.thumbnail ? (
                        <img 
                          src={typeof course.thumbnail === 'string' && (course.thumbnail.startsWith("http") || course.thumbnail.startsWith("data:") || course.thumbnail.startsWith("/"))
                            ? course.thumbnail 
                            : `/uploads/${course.thumbnail}`} 
                          alt={course.title || "Course thumbnail"}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center group-hover:from-blue-500/30 group-hover:to-purple-500/30 transition-all duration-500">
                          <BookOpen className="h-12 w-12 text-blue-600/60 group-hover:text-blue-600/80 transition-colors duration-300" />
                        </div>
                      )}
                      
                      <div className="absolute top-3 left-3">
                        <Badge className={cn("px-3 py-1 rounded-full font-medium text-xs", getDifficultyColor(course.difficulty))}>
                          {course.difficulty || 'All Levels'}
                        </Badge>
                      </div>
                      
                      <div className="absolute top-3 right-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 bg-white/80 backdrop-blur-sm border border-white/20 hover:bg-white hover:shadow-lg transition-all duration-300">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-2xl border border-white/20 shadow-xl backdrop-blur-sm bg-white/95">
                            <DropdownMenuItem 
                              onClick={() => handleEditCourse(course)}
                              className="rounded-lg gap-2 hover:bg-purple-50 transition-colors"
                            >
                              <Edit className="h-4 w-4 text-purple-600" />
                              <span className="font-medium">Edit Course</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-lg gap-2 hover:bg-blue-50 transition-colors">
                              <Eye className="h-4 w-4 text-blue-600" />
                              <span className="font-medium">View Details</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => window.location.href = `/admin/courses/${course.id}/progress`}
                              className="rounded-lg gap-2 hover:bg-green-50 transition-colors"
                            >
                              <Users className="h-4 w-4 text-green-600" />
                              <span className="font-medium">Student Progress</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-gray-200/50" />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteCourse(course)}
                              className="rounded-lg gap-2 hover:bg-red-50 text-red-600 focus:text-red-600 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="font-medium">Delete Course</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      {/* Progress overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
                        <div className="flex justify-between items-center text-white">
                          <span className="text-sm font-medium">Progress</span>
                          <span className="text-sm font-bold">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2 mt-2 bg-white/20 [&>div]:bg-gradient-to-r [&>div]:from-green-400 [&>div]:to-emerald-400" />
                      </div>
                    </div>
                    
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <CardTitle className="font-heading text-lg line-clamp-2 leading-tight text-gray-900">
                          {course.title}
                        </CardTitle>
                      </div>
                      
                      <p className="text-sm text-gray-600 line-clamp-3 mb-4 leading-relaxed">
                        {course.description}
                      </p>
                      
                      <div className="flex gap-2 flex-wrap mb-4">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-medium">
                          {course.category || 'General'}
                        </Badge>
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          {course.duration || '8'} weeks
                        </Badge>
                      </div>
                      
                      {/* Course Stats */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{studentCount} students</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <TrendingUp className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{progress}% complete</span>
                        </div>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="border-t border-white/20 pt-4 bg-gradient-to-r from-gray-50/50 to-gray-100/50">
                      <div className="flex gap-2 w-full">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 gap-1 bg-white/50 backdrop-blur-sm border border-white/20 rounded-xl hover:shadow-lg transition-all duration-300"
                          onClick={() => handleEditCourse(course)}
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline" 
                          className="flex-1 gap-1 bg-white/50 backdrop-blur-sm border border-white/20 rounded-xl hover:shadow-lg transition-all duration-300"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      ) : (
        // Table View
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="backdrop-blur-sm bg-white/70 border border-white/20 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20 bg-gradient-to-r from-gray-50/50 to-gray-100/50">
                    <th className="text-left p-4 font-semibold text-gray-900">Course</th>
                    <th className="text-left p-4 font-semibold text-gray-900">Category</th>
                    <th className="text-left p-4 font-semibold text-gray-900">Level</th>
                    <th className="text-left p-4 font-semibold text-gray-900">Duration</th>
                    <th className="text-left p-4 font-semibold text-gray-900">Students</th>
                    <th className="text-left p-4 font-semibold text-gray-900">Progress</th>
                    <th className="text-left p-4 font-semibold text-gray-900">Status</th>
                    <th className="text-left p-4 font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCourses.map((course: any, index: number) => {
                    const progress = getRandomProgress(course.id);
                    const studentCount = getRandomStudents(course.id);
                    
                    return (
                      <motion.tr 
                        key={course.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="border-b border-white/20 hover:bg-gray-50/50 transition-colors duration-200"
                      >
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                              {course.thumbnail ? (
                                <img 
                                  src={typeof course.thumbnail === 'string' && (course.thumbnail.startsWith("http") || course.thumbnail.startsWith("data:") || course.thumbnail.startsWith("/"))
                                    ? course.thumbnail 
                                    : `/uploads/${course.thumbnail}`} 
                                  alt={course.title || "Course thumbnail"}
                                  className="w-10 h-10 rounded-lg object-cover"
                                />
                              ) : (
                                <BookOpen className="h-5 w-5 text-blue-600" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{course.title}</div>
                              <div className="text-sm text-gray-500 line-clamp-1">{course.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {course.category || 'General'}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge className={cn("px-2 py-1 text-xs", getDifficultyColor(course.difficulty))}>
                            {course.difficulty || 'All Levels'}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm text-gray-600">
                          {course.duration || '8'} weeks
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{studentCount}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <Progress value={progress} className="w-20 h-2 [&>div]:bg-gradient-to-r [&>div]:from-green-400 [&>div]:to-emerald-400" />
                            <span className="text-sm font-medium text-gray-700">{progress}%</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge className="bg-green-100 text-green-800 border border-green-200">
                            {course.status === 'active' || !course.status ? 'Active' : course.status}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 bg-white/50 backdrop-blur-sm border border-white/20 hover:shadow-lg transition-all duration-300"
                              onClick={() => handleEditCourse(course)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 bg-white/50 backdrop-blur-sm border border-white/20 hover:shadow-lg transition-all duration-300"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 bg-white/50 backdrop-blur-sm border border-white/20 hover:shadow-lg transition-all duration-300 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteCourse(course)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}
      
      {/* Course Editor Dialog */}
      <CourseEditor 
        key={selectedCourse?.id || 'new-course'}
        open={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        course={selectedCourse}
      />
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="backdrop-blur-sm bg-white/95 border border-white/20 shadow-2xl rounded-3xl max-w-md">
          <DialogHeader>
            <div className="p-3 bg-red-100 rounded-2xl w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-xl font-bold text-center text-gray-900">
              Delete Course
            </DialogTitle>
            <DialogDescription className="text-center text-gray-600">
              {selectedCourse && 
                `Are you sure you want to delete "${selectedCourse.title}"? This action cannot be undone.`
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-start space-x-3">
              <GraduationCap className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Warning: This will permanently delete:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Course content and modules</li>
                  <li>All student enrollments</li>
                  <li>Progress and completion data</li>
                  <li>Associated materials and resources</li>
                </ul>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleteMutation.isPending}
              className="flex-1 rounded-2xl border border-white/20 bg-white/50 backdrop-blur-sm"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteCourse}
              disabled={deleteMutation.isPending}
              className="flex-1 rounded-2xl hover:shadow-xl transition-all duration-300"
            >
              {deleteMutation.isPending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-white mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete Course"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}