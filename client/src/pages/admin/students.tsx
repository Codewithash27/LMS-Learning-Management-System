import { useState } from "react";
import { Link } from "wouter";
import Header from "@/components/layout/header";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  MoreVertical,
  Users,
  Mail,
  Eye,
  BarChart,
  GraduationCap,
  BookOpen,
  Plus,
  Trash2,
  Download,
  Upload,
  UserPlus,
  Sparkles,
  Shield,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Clock
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
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

export default function AdminStudents() {
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState<"table" | "grid">("table");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();
  
  // Fetch students (users with role "student")
  const { data: allUsers = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/users"],
  });
  
  // Fetch courses for dropdown
  const { data: courses = [] } = useQuery({
    queryKey: ["/api/courses"],
  });
  
  // Course assignment mutation
  const assignCourseMutation = useMutation({
    mutationFn: async ({ userId, courseId }: { userId: number, courseId: number }) => {
      await apiRequest("POST", "/api/enrollments/assign", { 
        userId, 
        courseId 
      });
    },
    onSuccess: () => {
      toast({
        title: "🎉 Course assigned successfully",
        description: `Course has been assigned to ${selectedStudent?.firstName} ${selectedStudent?.lastName}`,
      });
      setIsAssignDialogOpen(false);
      setSelectedCourseId("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to assign course",
        description: error.message || "There was an error assigning the course",
        variant: "destructive",
      });
    }
  });

  // Delete student mutation
  const deleteStudentMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("DELETE", `/api/users/${userId}`);
    },
    onSuccess: () => {
      toast({
        title: "Student deleted",
        description: `${selectedStudent?.firstName} ${selectedStudent?.lastName} has been deleted successfully`,
      });
      setIsDeleteDialogOpen(false);
      setSelectedStudent(null);
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete student",
        description: error.message || "There was an error deleting the student",
        variant: "destructive",
      });
    }
  });
  
  // Handle assigning course to student
  const handleAssignCourse = () => {
    if (!selectedStudent || !selectedCourseId) {
      toast({
        title: "Error",
        description: "Please select a course to assign",
        variant: "destructive",
      });
      return;
    }
    
    assignCourseMutation.mutate({
      userId: selectedStudent.id,
      courseId: parseInt(selectedCourseId)
    });
  };

  // Handle deleting student
  const handleDeleteStudent = () => {
    if (!selectedStudent) return;
    
    deleteStudentMutation.mutate(selectedStudent.id);
  };
  
  // Open assign course dialog
  const openAssignDialog = (student: any) => {
    setSelectedStudent(student);
    setIsAssignDialogOpen(true);
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (student: any) => {
    setSelectedStudent(student);
    setIsDeleteDialogOpen(true);
  };
  
  // Filter only students
  const students = (allUsers as any[]).filter((user) => user.role === "student");
  
  // Filter students based on search term and status
  const filteredStudents = students.filter((student: any) => {
    const matchesSearch = 
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || student.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Helper function to get initials from name
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };
  
  // Get student statistics
  const studentStats = {
    total: students.length,
    active: students.filter((s: any) => s.status === 'active' || !s.status).length,
    inactive: students.filter((s: any) => s.status === 'inactive').length,
    newThisMonth: students.filter((s: any) => {
      const created = new Date(s.createdAt);
      const now = new Date();
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length
  };

  return (
    <DashboardLayout>
      <Header title="Students" subtitle="Manage and monitor student accounts" />
      
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
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{studentStats.total}</h3>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm text-green-600">
              <Sparkles className="h-4 w-4 mr-1" />
              <span>+{studentStats.newThisMonth} new this month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-white/20 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Students</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{studentStats.active}</h3>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm text-gray-600">
              <Shield className="h-4 w-4 mr-1" />
              <span>All systems active</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-sm border border-white/20 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inactive</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{studentStats.inactive}</h3>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm text-gray-600">
              <span>Requires attention</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-white/20 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New This Month</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{studentStats.newThisMonth}</h3>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg">
                <UserPlus className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm text-green-600">
              <span>+12% growth</span>
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
              placeholder="Search students by name, email, or username..."
              className="pl-10 bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl focus:ring-2 focus:ring-blue-500/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40 bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="backdrop-blur-sm bg-white/95 border border-white/20 rounded-2xl">
              <SelectItem value="all" className="rounded-lg">All Status</SelectItem>
              <SelectItem value="active" className="rounded-lg">Active</SelectItem>
              <SelectItem value="inactive" className="rounded-lg">Inactive</SelectItem>
              <SelectItem value="pending" className="rounded-lg">Pending</SelectItem>
            </SelectContent>
          </Select>
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
            <Users size={16} />
            Grid
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-2 bg-gradient-to-br from-blue-500 to-purple-600 text-white border-0 rounded-2xl hover:shadow-xl transition-all duration-300">
                <Plus size={16} />
                Add Student
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-2xl border border-white/20 shadow-xl backdrop-blur-sm bg-white/95">
              <DropdownMenuItem className="rounded-lg gap-2">
                <UserPlus className="h-4 w-4" />
                Add Single Student
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg gap-2">
                <Upload className="h-4 w-4" />
                Bulk Import
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg gap-2">
                <Download className="h-4 w-4" />
                Export Template
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>
      
      {/* Students List */}
      {isLoading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-2 text-gray-500">Loading students...</p>
          </div>
        </div>
      ) : filteredStudents.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="backdrop-blur-sm bg-white/50 rounded-3xl border border-white/20 shadow-xl">
            <CardContent className="p-6 text-center py-16">
              <GraduationCap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No students found</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {searchTerm ? "No students match your search criteria. Try a different search term." : "Get started by adding your first student to the system."}
              </p>
            </CardContent>
          </Card>
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
                    <TableHead className="font-bold text-gray-900 py-4">Student</TableHead>
                    <TableHead className="font-bold text-gray-900">Username</TableHead>
                    <TableHead className="font-bold text-gray-900">Email</TableHead>
                    <TableHead className="font-bold text-gray-900">Status</TableHead>
                    <TableHead className="font-bold text-gray-900 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {filteredStudents.map((student: any, index: number) => (
                      <motion.tr
                        key={student.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="border-b border-white/20 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-all duration-300 group"
                      >
                        <TableCell className="py-4">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10 border-2 border-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                                {getInitials(student.firstName, student.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-gray-900">{student.firstName} {student.lastName}</p>
                              <p className="text-sm text-gray-500">ID: {student.id}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-gray-700">{student.username}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">{student.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(
                            "px-3 py-1 rounded-full font-medium text-xs",
                            student.status === 'active' || !student.status
                              ? "bg-green-100 text-green-800 border border-green-200"
                              : student.status === 'inactive'
                              ? "bg-red-100 text-red-800 border border-red-200"
                              : "bg-amber-100 text-amber-800 border border-amber-200"
                          )}>
                            {student.status === 'active' || !student.status ? 'Active' : 
                             student.status === 'inactive' ? 'Inactive' : 'Pending'}
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
                              <Link href={`/admin/students/${student.id}`} className="w-full">
                                <DropdownMenuItem className="rounded-lg gap-2 hover:bg-blue-50 transition-colors">
                                  <Eye className="h-4 w-4 text-blue-600" />
                                  <span className="font-medium">View Details</span>
                                </DropdownMenuItem>
                              </Link>
                              <DropdownMenuItem className="rounded-lg gap-2 hover:bg-green-50 transition-colors">
                                <BarChart className="h-4 w-4 text-green-600" />
                                <span className="font-medium">View Performance</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="rounded-lg gap-2 hover:bg-purple-50 transition-colors">
                                <Mail className="h-4 w-4 text-purple-600" />
                                <span className="font-medium">Send Email</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-gray-200/50" />
                              <DropdownMenuItem 
                                onClick={() => openAssignDialog(student)}
                                className="rounded-lg gap-2 hover:bg-amber-50 transition-colors"
                              >
                                <BookOpen className="h-4 w-4 text-amber-600" />
                                <span className="font-medium">Assign Course</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-gray-200/50" />
                              <DropdownMenuItem 
                                onClick={() => openDeleteDialog(student)}
                                className="rounded-lg gap-2 hover:bg-red-50 text-red-600 focus:text-red-600 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="font-medium">Delete User</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </motion.tr>
                    ))}
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
          {filteredStudents.map((student: any, index: number) => (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
                <Card className="backdrop-blur-sm bg-white/70 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 group hover:scale-[1.01] overflow-hidden">
                <CardContent className="p-6">
                  {/* Student Header */}
                  <div className="flex items-center space-x-4 mb-4">
                    <Avatar className="h-16 w-16 border-2 border-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg font-bold">
                        {getInitials(student.firstName, student.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-lg truncate">{student.firstName} {student.lastName}</h3>
                      <p className="text-sm text-gray-500 truncate">@{student.username}</p>
                      <Badge className={cn(
                        "mt-2 px-2 py-1 rounded-full text-xs",
                        student.status === 'active' || !student.status
                          ? "bg-green-100 text-green-800 border border-green-200"
                          : "bg-red-100 text-red-800 border border-red-200"
                      )}>
                        {student.status === 'active' || !student.status ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Student Info */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{student.email}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Shield className="h-4 w-4 text-gray-400" />
                      <span>Student ID: {student.id}</span>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <Link href={`/admin/students/${student.id}`} className="w-full">
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
                        Stats
                      </Button>
                    </div>
                    
                    <Button 
                      size="sm"
                      variant="secondary" 
                      className="w-full gap-1 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl hover:shadow-lg transition-all duration-300"
                      onClick={() => openAssignDialog(student)}
                    >
                      <BookOpen className="h-4 w-4 text-blue-600" />
                      Assign Course
                    </Button>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        size="sm"
                        variant="outline" 
                        className="w-full gap-1 bg-white/50 backdrop-blur-sm border border-white/20 rounded-xl hover:shadow-lg transition-all duration-300"
                      >
                        <Mail className="h-4 w-4" />
                        Email
                      </Button>
                      <Button 
                        size="sm"
                        variant="destructive" 
                        className="w-full gap-1 rounded-xl hover:shadow-lg transition-all duration-300"
                        onClick={() => openDeleteDialog(student)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
      
      {/* Enhanced Dialogs */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="backdrop-blur-sm bg-white/95 border border-white/20 shadow-2xl rounded-3xl max-w-md">
          <DialogHeader>
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <DialogTitle className="text-xl font-bold text-center text-gray-900">
              Assign Course
            </DialogTitle>
            <div className="text-sm text-gray-600 text-center mt-2">
              {selectedStudent && 
                `Choose a course to assign to ${selectedStudent.firstName} ${selectedStudent.lastName}`
              }
            </div>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="course" className="text-sm font-medium text-gray-700">
                Select Course
              </label>
              <Select
                value={selectedCourseId}
                onValueChange={setSelectedCourseId}
              >
                <SelectTrigger className="bg-white/50 backdrop-blur-sm border border-white/20 rounded-2xl">
                  <SelectValue placeholder="Choose a course..." />
                </SelectTrigger>
                <SelectContent className="backdrop-blur-sm bg-white/95 border border-white/20 rounded-2xl">
                  {(courses as any[])
                    .filter((course) => course.isEnrollmentRequired)
                    .map((course) => (
                      <SelectItem key={course.id} value={course.id.toString()} className="rounded-lg">
                        {course.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setIsAssignDialogOpen(false)}
              disabled={assignCourseMutation.isPending}
              className="flex-1 rounded-2xl border border-white/20 bg-white/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignCourse}
              disabled={!selectedCourseId || assignCourseMutation.isPending}
              className="flex-1 gap-2 bg-gradient-to-br from-blue-500 to-purple-600 text-white border-0 rounded-2xl hover:shadow-xl transition-all duration-300"
            >
              {assignCourseMutation.isPending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-white" />
                  Assigning...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Assign Course
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="backdrop-blur-sm bg-white/95 border border-white/20 shadow-2xl rounded-3xl max-w-md">
          <DialogHeader>
            <div className="p-3 bg-red-100 rounded-2xl w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-xl font-bold text-center text-gray-900">
              Delete Student
            </DialogTitle>
            <DialogDescription className="text-center text-gray-600">
              {selectedStudent && 
                `Are you sure you want to delete ${selectedStudent.firstName} ${selectedStudent.lastName}? This action cannot be undone.`
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Warning: This will permanently delete:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Student profile and data</li>
                  <li>All course enrollments</li>
                  <li>Progress and exam results</li>
                </ul>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleteStudentMutation.isPending}
              className="flex-1 rounded-2xl border border-white/20 bg-white/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteStudent}
              disabled={deleteStudentMutation.isPending}
              className="flex-1 gap-2 rounded-2xl hover:shadow-xl transition-all duration-300"
            >
              {deleteStudentMutation.isPending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-white" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete Student
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}