import { useState } from "react";
import { Link } from "wouter";
import Header from "@/components/layout/header";
import ListToolbar from "@/components/layout/list-toolbar";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Mail,
  Eye,
  GraduationCap,
  BookOpen,
  Plus,
  Trash2,
  Download,
  Upload,
  UserPlus,
  CheckCircle2,
  Shield,
  XCircle,
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  TableCell,
  TableRow,
} from "@/components/ui/table";
import DataTable from "@/components/primitives/DataTable";
import { useClientPagination } from "@/hooks/use-client-pagination";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { cn } from "@/lib/utils";

export default function AdminStudents() {
  const [searchTerm, setSearchTerm] = useState("");
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

  const {
    page,
    pageSize,
    total,
    pageItems,
    setPage,
    setPageSize,
  } = useClientPagination(filteredStudents, 10);

  // Helper function to get initials from name
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };
  
  return (
    <DashboardLayout>
      <Header
        title="Students"
        actions={
          <ListToolbar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search students..."
            filters={
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 w-[140px] rounded-xl border-warm-border bg-white shadow-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            }
            action={
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    className="h-11 w-11 shrink-0 rounded-xl p-0"
                    aria-label="Add student"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl">
                  <DropdownMenuItem className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Add Single Student
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2">
                    <Upload className="h-4 w-4" />
                    Bulk Import
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2">
                    <Download className="h-4 w-4" />
                    Export Template
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            }
          />
        }
      />

      {/* Students Directory — Campus Axis list style */}
      {isLoading ? (
        <div className="flex min-h-[240px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <DataTable
          title="Student Directory"
          columns={[
            { key: "student", label: "Student" },
            { key: "username", label: "Username" },
            { key: "email", label: "Email" },
            { key: "status", label: "Status" },
            { key: "actions", label: "Actions", align: "right" },
          ]}
          isEmpty={filteredStudents.length === 0}
          empty={
            <div className="text-center">
              <GraduationCap className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
              <h3 className="mb-1 text-lg font-semibold">No students found</h3>
              <p className="text-[15px] text-muted-foreground">
                {searchTerm
                  ? "No students match your search."
                  : "Add your first student to get started."}
              </p>
            </div>
          }
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        >
          {pageItems.map((student: any) => {
            const isActive = student.status === "active" || !student.status;
            return (
              <TableRow key={student.id} className="hover:bg-[#FFF5E6]/70">
                <TableCell className="py-3.5 pl-5">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                      <AvatarFallback className="bg-accent-brand text-sm font-bold text-white">
                        {getInitials(student.firstName, student.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold text-[#2D3748]">
                        {student.firstName} {student.lastName}
                      </p>
                      <p className="text-xs text-[#718096]">ID: {student.id}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-[15px] text-[#2D3748]/90">
                  {student.username}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-[15px] text-[#2D3748]/90">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-[#A0AEC0]" />
                    <span className="truncate">{student.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
                      isActive
                        ? "border-green-200 bg-green-100 text-green-800"
                        : student.status === "inactive"
                          ? "border-red-200 bg-red-100 text-red-800"
                          : "border-amber-200 bg-amber-100 text-amber-800"
                    )}
                  >
                    {isActive ? "Active" : student.status === "inactive" ? "Inactive" : "Pending"}
                  </Badge>
                </TableCell>
                <TableCell className="pr-5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/admin/students/${student.id}`}>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-9 w-9 p-0 text-[#1976d2] hover:bg-[#1976d2]/10"
                        aria-label="View"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-9 w-9 p-0 text-[#4ECDC4] hover:bg-[#4ECDC4]/10"
                      aria-label="Assign course"
                      onClick={() => openAssignDialog(student)}
                    >
                      <BookOpen className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-9 w-9 p-0 text-[#d32f2f] hover:bg-[#d32f2f]/10"
                      aria-label="Delete"
                      onClick={() => openDeleteDialog(student)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </DataTable>
      )}
      
      {/* Enhanced Dialogs */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="backdrop-blur-sm bg-white/95 border border-white/20 shadow-2xl rounded-3xl max-w-md">
          <DialogHeader>
            <div className="p-3 bg-accent-brand rounded-2xl w-12 h-12 flex items-center justify-center mx-auto mb-4">
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
              className="flex-1 gap-2 bg-accent-brand text-white border-0 rounded-2xl hover:shadow-xl transition-all duration-300"
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
