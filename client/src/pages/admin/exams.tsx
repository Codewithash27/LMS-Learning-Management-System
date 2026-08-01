import { useState } from "react";
import { Link } from "wouter";
import Header from "@/components/layout/header";
import ListToolbar from "@/components/layout/list-toolbar";
import DashboardLayout from "@/components/layout/dashboard-layout";
import ExamEditor from "@/components/exams/exam-editor";
import DataTable from "@/components/primitives/DataTable";
import { useClientPagination } from "@/hooks/use-client-pagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  Plus,
  Edit,
  Trash2,
  Eye,
  FileText,
  BookOpen,
  AlertTriangle,
} from "lucide-react";
import {
  TableCell,
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
import { cn } from "@/lib/utils";

export default function AdminExams() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const { toast } = useToast();

  const { data: exams = [], isLoading } = useQuery({
    queryKey: ["/api/exams"],
  });

  const { data: courses = [] } = useQuery<{ id: number; title: string }[]>({
    queryKey: ["/api/courses"],
  });

  const deleteExamMutation = useMutation({
    mutationFn: async (examId: number) => {
      await apiRequest("DELETE", `/api/exams/${examId}`);
    },
    onSuccess: () => {
      toast({
        title: "Exam deleted successfully",
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

  const handleDeleteExam = () => {
    if (!selectedExam) return;
    deleteExamMutation.mutate(selectedExam.id);
  };

  const openDeleteDialog = (exam: any) => {
    setSelectedExam(exam);
    setIsDeleteDialogOpen(true);
  };

  const handleCreateExam = () => {
    setSelectedExam(null);
    setIsEditorOpen(true);
  };

  const handleEditExam = (exam: any) => {
    setSelectedExam(exam);
    setIsEditorOpen(true);
  };

  const filteredExams = (exams as any[]).filter((exam: any) => {
    const matchesSearch =
      exam.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.course?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || exam.status === statusFilter;
    const matchesType = typeFilter === "all" || exam.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const {
    page,
    pageSize,
    total,
    pageItems,
    setPage,
    setPageSize,
  } = useClientPagination(filteredExams, 10);

  const getStatusBadge = (exam: any) => {
    const now = new Date();
    const startTime = exam.startTime ? new Date(exam.startTime) : null;
    const endTime = exam.endTime ? new Date(exam.endTime) : null;

    if (!startTime) {
      return { label: "Draft", className: "border-gray-200 bg-gray-100 text-gray-800" };
    }

    if (endTime && now > endTime) {
      return { label: "Completed", className: "border-green-200 bg-green-100 text-green-800" };
    }

    if (startTime && now > startTime) {
      return { label: "Active", className: "border-green-200 bg-green-100 text-green-800" };
    }

    return { label: "Upcoming", className: "border-amber-200 bg-amber-100 text-amber-800" };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getCourseName = (courseId: number) => {
    const course = (courses as any[]).find((c: any) => c.id === courseId);
    return course ? course.title : "Unknown Course";
  };

  return (
    <DashboardLayout>
      <Header
        title="Exams"
        actions={
          <ListToolbar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search exams..."
            filters={
              <>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-10 w-[130px] rounded-xl border-warm-border bg-white shadow-sm">
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
                  <SelectTrigger className="h-10 w-[130px] rounded-xl border-warm-border bg-white shadow-sm">
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
              </>
            }
            action={
              <Button
                type="button"
                onClick={handleCreateExam}
                className="h-11 w-11 shrink-0 rounded-xl p-0"
                aria-label="Create exam"
              >
                <Plus className="h-5 w-5" />
              </Button>
            }
          />
        }
      />

      {isLoading ? (
        <div className="flex min-h-[240px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <DataTable
          title="Exam Directory"
          columns={[
            { key: "exam", label: "Exam" },
            { key: "course", label: "Course" },
            { key: "schedule", label: "Schedule" },
            { key: "duration", label: "Duration" },
            { key: "status", label: "Status" },
            { key: "actions", label: "Actions", align: "right" },
          ]}
          isEmpty={filteredExams.length === 0}
          empty={
            <div className="text-center">
              <FileText className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
              <h3 className="mb-1 text-lg font-semibold">No exams found</h3>
              <p className="mb-4 text-[15px] text-muted-foreground">
                {searchTerm
                  ? "No exams match your search."
                  : "Create your first exam to get started."}
              </p>
              {!searchTerm && (
                <Button type="button" onClick={handleCreateExam} className="gap-2 rounded-xl">
                  <Plus className="h-4 w-4" />
                  Create Exam
                </Button>
              )}
            </div>
          }
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        >
          {pageItems.map((exam: any) => {
            const status = getStatusBadge(exam);
            return (
              <TableRow key={exam.id} className="hover:bg-[#FFF5E6]/70">
                <TableCell className="py-3.5 pl-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#4ECDC4]/15">
                      <FileText className="h-5 w-5 text-[#4ECDC4]" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold text-[#2D3748]">
                        {exam.title}
                      </p>
                      <p className="line-clamp-1 text-xs text-[#718096]">
                        {exam.description || "No description"}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-[15px] text-[#2D3748]/90">
                    <BookOpen className="h-3.5 w-3.5 shrink-0 text-[#A0AEC0]" />
                    <span className="truncate">{getCourseName(exam.courseId)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-[15px] text-[#2D3748]/90">
                      <Calendar className="h-3.5 w-3.5 text-[#A0AEC0]" />
                      <span>{exam.startTime ? formatDate(exam.startTime) : "Not scheduled"}</span>
                    </div>
                    {exam.startTime && (
                      <div className="flex items-center gap-1.5 text-xs text-[#718096]">
                        <Clock className="h-3 w-3" />
                        <span>{formatTime(exam.startTime)}</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-[15px] text-[#2D3748]/90">
                  {exam.duration ? `${exam.duration} mins` : "—"}
                </TableCell>
                <TableCell>
                  <Badge
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
                      status.className
                    )}
                  >
                    {status.label}
                  </Badge>
                </TableCell>
                <TableCell className="pr-5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/admin/exams/${exam.id}`}>
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
                      aria-label="Edit"
                      onClick={() => handleEditExam(exam)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-9 w-9 p-0 text-[#d32f2f] hover:bg-[#d32f2f]/10"
                      aria-label="Delete"
                      onClick={() => openDeleteDialog(exam)}
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

      <ExamEditor
        open={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        courses={courses}
        exam={selectedExam}
      />

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-center text-xl font-bold">
              Delete Exam
            </DialogTitle>
            <DialogDescription className="text-center">
              {selectedExam &&
                `Are you sure you want to delete "${selectedExam.title}"? This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">This will permanently delete:</p>
                <ul className="mt-1 list-inside list-disc space-y-1">
                  <li>Exam questions and settings</li>
                  <li>All student attempts and submissions</li>
                  <li>Results and analytics data</li>
                </ul>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleteExamMutation.isPending}
              className="flex-1 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteExam}
              disabled={deleteExamMutation.isPending}
              className="flex-1 rounded-xl"
            >
              {deleteExamMutation.isPending ? "Deleting..." : "Delete Exam"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
