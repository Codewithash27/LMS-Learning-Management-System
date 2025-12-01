import { useState } from "react";
import { Link } from "wouter";
import Header from "@/components/layout/header";
import DashboardLayout from "@/components/layout/dashboard-layout";
import ExamEditor from "@/components/exams/exam-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  MoreVertical,
  Calendar,
  Clock,
  Users,
  Plus,
  Edit,
  Trash2,
  Eye,
  BarChart,
  FileText,
  Sparkles,
  CheckCircle,
  BookOpen,
  Play,
  AlertTriangle
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function AdminExams() {
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState<"table" | "grid">("table");
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const { toast } = useToast();
  
  // Fetch exams
  const { data: exams = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/exams"],
  });
  
  // Fetch courses for reference
  const { data: courses = [] } = useQuery({
    queryKey: ["/api/courses"],
  });
  
  // Delete exam mutation
  const deleteExamMutation = useMutation({
    mutationFn: async (examId: number) => {
      await apiRequest("DELETE", `/api/exams/${examId}`);
    },
    onSuccess: () => {
      toast({
        title: "🎉 Exam deleted successfully",
        description: `${selectedExam?.title} has been deleted`,
      });
      setIsDeleteDialogOpen(false);
      setSelectedExam(null);
      queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete exam",
        description: error.message || "There was an error deleting the exam",
        variant: "destructive",
      });
    }
  });

  // Handle deleting exam
  const handleDeleteExam = () => {
    if (!selectedExam) return;
    
    deleteExamMutation.mutate(selectedExam.id);
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (exam: any) => {
    setSelectedExam(exam);
    setIsDeleteDialogOpen(true);
  };

  // Handle opening the exam editor for creation
  const handleCreateExam = () => {
    setSelectedExam(null);
    setIsEditorOpen(true);
  };

  // Handle opening the exam editor for editing
  const handleEditExam = (exam: any) => {
    setSelectedExam(exam);
    setIsEditorOpen(true);
  };
  
  // Filter exams based on search term and filters
  const filteredExams = (exams as any[]).filter((exam: any) => {
    const matchesSearch = 
      exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.course?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || exam.status === statusFilter;
    const matchesType = typeFilter === "all" || exam.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });
  
  // Get exam statistics
  const examStats = {
    total: exams.length,
    upcoming: (exams as any[]).filter((e: any) => e.status === 'upcoming' || !e.status).length,
    completed: (exams as any[]).filter((e: any) => e.status === 'completed').length,
    active: (exams as any[]).filter((e: any) => e.status === 'active').length,
  };

  // Helper function to get status badge
  const getStatusBadge = (exam: any) => {
    const now = new Date();
    const startTime = exam.startTime ? new Date(exam.startTime) : null;
    const endTime = exam.endTime ? new Date(exam.endTime) : null;
    
    if (!startTime) {
      return { label: "Draft", className: "bg-gray-100 text-gray-800 border border-gray-200" };
    }
    
    if (endTime && now > endTime) {
      return { label: "Completed", className: "bg-green-100 text-green-800 border border-green-200" };
    }
    
    if (startTime && now > startTime) {
      return { label: "Active", className: "bg-blue-100 text-blue-800 border border-blue-200" };
    }
    
    return { label: "Upcoming", className: "bg-amber-100 text-amber-800 border border-amber-200" };
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Get course name by ID
  const getCourseName = (courseId: number) => {
    const course = (courses as any[]).find((c: any) => c.id === courseId);
    return course ? course.title : "Unknown Course";
  };

  return (
    <DashboardLayout>
      <Header title="Exams" subtitle="Manage and schedule examinations" />
      
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
                <p className="text-sm font-medium text-gray-600">Total Exams</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{examStats.total}</h3>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm text-green-600">
              <Sparkles className="h-4 w-4 mr-1" />
              <span>+5 scheduled this month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-white/20 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{examStats.upcoming}</h3>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm text-gray-600">
              <span>Next: Tomorrow, 09:00 AM</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-sm border border-white/20 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Now</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{examStats.active}</h3>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm text-green-600">
              <span>In progress</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-white/20 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{examStats.completed}</h3>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm text-gray-600">
              <span>Results pending: 2</span>
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
              placeholder="Search exams by title, course, or description..."
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
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="quiz">Quiz</SelectItem>
                <SelectItem value="midterm">Mid-Term</SelectItem>
                <SelectItem value="final">Final</SelectItem>
                <SelectItem value="assignment">Assignment</SelectItem>
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
              view === "table" ? "bg-blue-50 border-blue-200" : ""
            )}
            onClick={() => setView("table")}
          >
            <BarChart size={16} />
            Table
          </Button>
          
          <Button 
            variant="outline" 
            className={cn(
              "gap-2 bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl hover:shadow-lg transition-all duration-300",
              view === "grid" ? "bg-blue-50 border-blue-200" : ""
            )}
            onClick={() => setView("grid")}
          >
            <Calendar size={16} />
            Grid
          </Button>

          {/* Create Exam Button - Directly opens the form */}
          <Button 
            onClick={handleCreateExam}
            className="gap-2 bg-gradient-to-br from-blue-500 to-purple-600 text-white border-0 rounded-2xl hover:shadow-xl transition-all duration-300"
          >
            <Plus size={16} />
            Create Exam
          </Button>
        </div>
      </motion.div>
      
      {/* Exams List */}
      {isLoading ? (
        <Card className="backdrop-blur-sm bg-white/70 border border-white/20 shadow-xl">
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : filteredExams.length === 0 ? (
        <motion.div 
          className="text-center py-16 backdrop-blur-sm bg-white/50 rounded-3xl border border-white/20 shadow-xl"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No exams found</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            {searchTerm ? "No exams match your search criteria. Try a different search term." : "Get started by creating your first exam."}
          </p>
          <Button 
            onClick={handleCreateExam}
            className="gap-2 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-2xl hover:shadow-xl"
          >
            <Plus className="h-4 w-4" />
            Create First Exam
          </Button>
        </motion.div>
      ) : view === "table" ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="backdrop-blur-sm bg-white/70 border border-white/20 shadow-xl overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-white/20">
                    <TableHead className="font-bold text-gray-900 py-4">Exam Title</TableHead>
                    <TableHead className="font-bold text-gray-900">Course</TableHead>
                    <TableHead className="font-bold text-gray-900">Schedule</TableHead>
                    <TableHead className="font-bold text-gray-900">Duration</TableHead>
                    <TableHead className="font-bold text-gray-900">Status</TableHead>
                    <TableHead className="font-bold text-gray-900 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {filteredExams.map((exam: any, index: number) => {
                      const status = getStatusBadge(exam);
                      return (
                      <motion.tr
                        key={exam.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="border-b border-white/20 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-all duration-300 group"
                      >
                        <TableCell className="py-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 group-hover:scale-110 transition-transform duration-300">
                              <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{exam.title}</p>
                              <p className="text-sm text-gray-500 truncate max-w-xs">{exam.description}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <BookOpen className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-700">{getCourseName(exam.courseId)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span>{exam.startTime ? formatDate(exam.startTime) : "Not scheduled"}</span>
                            </div>
                            {exam.startTime && (
                              <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <Clock className="h-3 w-3 text-gray-400" />
                                <span>{formatTime(exam.startTime)}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-gray-700">
                            {exam.duration ? `${exam.duration} mins` : "Not set"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("px-3 py-1 rounded-full font-medium text-xs", status.className)}>
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-9 w-9 p-0 rounded-xl bg-white/50 backdrop-blur-sm border border-white/20 hover:bg-white hover:shadow-lg transition-all duration-300"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent 
                              align="end" 
                              className="rounded-2xl border border-white/20 shadow-xl backdrop-blur-sm bg-white/95"
                            >
                              <Link href={`/admin/exams/${exam.id}`} className="w-full">
                                <DropdownMenuItem className="rounded-lg gap-2 hover:bg-blue-50 transition-colors">
                                  <Eye className="h-4 w-4 text-blue-600" />
                                  <span className="font-medium">View Details</span>
                                </DropdownMenuItem>
                              </Link>
                              <DropdownMenuItem className="rounded-lg gap-2 hover:bg-green-50 transition-colors">
                                <BarChart className="h-4 w-4 text-green-600" />
                                <span className="font-medium">View Results</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="rounded-lg gap-2 hover:bg-purple-50 transition-colors"
                                onClick={() => handleEditExam(exam)}
                              >
                                <Edit className="h-4 w-4 text-purple-600" />
                                <span className="font-medium">Edit Exam</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-gray-200/50" />
                              <DropdownMenuItem className="rounded-lg gap-2 hover:bg-amber-50 transition-colors">
                                <Play className="h-4 w-4 text-amber-600" />
                                <span className="font-medium">Start Exam</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-gray-200/50" />
                              <DropdownMenuItem 
                                onClick={() => openDeleteDialog(exam)}
                                className="rounded-lg gap-2 hover:bg-red-50 text-red-600 focus:text-red-600 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="font-medium">Delete Exam</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </motion.tr>
                    )})}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {filteredExams.map((exam: any, index: number) => {
            const status = getStatusBadge(exam);
            return (
            <motion.div
              key={exam.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="backdrop-blur-sm bg-white/70 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 group hover:scale-[1.02] overflow-hidden">
                <CardContent className="p-6">
                  {/* Exam Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 group-hover:scale-110 transition-transform duration-300">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <Badge className={cn("px-3 py-1 rounded-full font-medium text-xs", status.className)}>
                      {status.label}
                    </Badge>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2">{exam.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2">{exam.description}</p>
                  </div>
                  
                  {/* Exam Info */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <BookOpen className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{getCourseName(exam.courseId)}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{exam.startTime ? formatDate(exam.startTime) : "Not scheduled"}</span>
                    </div>
                    
                    {exam.startTime && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>{formatTime(exam.startTime)} • {exam.duration || 'N/A'} mins</span>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span>{exam.participants || 0} participants</span>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <Link href={`/admin/exams/${exam.id}`} className="w-full">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full gap-1 bg-white/50 backdrop-blur-sm border border-white/20 rounded-xl hover:shadow-lg transition-all duration-300"
                        >
                          <Eye className="h-4 w-4" />
                          Details
                        </Button>
                      </Link>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full gap-1 bg-white/50 backdrop-blur-sm border border-white/20 rounded-xl hover:shadow-lg transition-all duration-300"
                      >
                        <BarChart className="h-4 w-4" />
                        Results
                      </Button>
                    </div>
                    
                    <Button 
                      size="sm"
                      variant="secondary" 
                      className="w-full gap-1 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl hover:shadow-lg transition-all duration-300"
                      onClick={() => handleEditExam(exam)}
                    >
                      <Edit className="h-4 w-4 text-blue-600" />
                      Edit Exam
                    </Button>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        size="sm"
                        variant="outline" 
                        className="w-full gap-1 bg-white/50 backdrop-blur-sm border border-white/20 rounded-xl hover:shadow-lg transition-all duration-300"
                      >
                        <Play className="h-4 w-4" />
                        Start
                      </Button>
                      <Button 
                        size="sm"
                        variant="destructive" 
                        className="w-full gap-1 rounded-xl hover:shadow-lg transition-all duration-300"
                        onClick={() => openDeleteDialog(exam)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )})}
        </motion.div>
      )}
      
      {/* Exam Editor Dialog */}
      <ExamEditor 
        open={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        courses={courses}
        exam={selectedExam}
      />
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="backdrop-blur-sm bg-white/95 border border-white/20 shadow-2xl rounded-3xl max-w-md">
          <DialogHeader>
            <div className="p-3 bg-red-100 rounded-2xl w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-xl font-bold text-center text-gray-900">
              Delete Exam
            </DialogTitle>
            <DialogDescription className="text-center text-gray-600">
              {selectedExam && 
                `Are you sure you want to delete "${selectedExam.title}"? This action cannot be undone.`
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Warning: This will permanently delete:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Exam questions and settings</li>
                  <li>All student attempts and submissions</li>
                  <li>Results and analytics data</li>
                </ul>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleteExamMutation.isPending}
              className="flex-1 rounded-2xl border border-white/20 bg-white/50 backdrop-blur-sm"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteExam}
              disabled={deleteExamMutation.isPending}
              className="flex-1 rounded-2xl hover:shadow-xl transition-all duration-300"
            >
              {deleteExamMutation.isPending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-white mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete Exam"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}