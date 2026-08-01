import { useState } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import Header from "@/components/layout/header";
import ListToolbar from "@/components/layout/list-toolbar";
import DataTable from "@/components/primitives/DataTable";
import { useClientPagination } from "@/hooks/use-client-pagination";
import ExamView from "@/components/exams/exam-view";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Book,
  CheckCircle2,
  XCircle,
  LayoutGrid,
  List,
  FileText,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export default function StudentUpcomingExams() {
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState<"grid" | "list">("list");
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [isExamOpen, setIsExamOpen] = useState(false);
  const { toast } = useToast();

  const { data: exams = [], isLoading: isLoadingExams } = useQuery({
    queryKey: ["/api/exams"],
  });

  const { data: courses = [] } = useQuery({
    queryKey: ["/api/courses"],
  });

  const { data: examAttempts = [] } = useQuery({
    queryKey: ["/api/exam-attempts/user"],
  });

  const getCourseName = (courseId: number) => {
    const course = (courses as any[]).find((c) => c.id === courseId);
    return course ? course.title : "Unknown Course";
  };

  const filteredExams = (exams as any[]).filter(
    (exam) =>
      exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getCourseName(exam.courseId).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const { page, pageSize, total, pageItems, setPage, setPageSize } =
    useClientPagination(filteredExams, 10);

  const canTakeExam = (exam: any) => exam.acceptingResponses !== false;

  const getExamStatus = (exam: any) => {
    const attemptsForExam = (examAttempts as any[]).filter(
      (attempt) => attempt.examId === exam.id
    );
    const hasCompletedAttempt = attemptsForExam.some((attempt) => attempt.completedAt);

    if (exam.acceptingResponses === false) {
      return {
        label: "Closed",
        color: "border-red-200 bg-red-100 text-red-800",
        icon: <XCircle className="mr-1 h-3.5 w-3.5" />,
      };
    }

    if (hasCompletedAttempt) {
      return {
        label: "Retake Available",
        color: "border-blue-200 bg-blue-100 text-blue-800",
        icon: <CheckCircle2 className="mr-1 h-3.5 w-3.5" />,
      };
    }

    return {
      label: "Available",
      color: "border-green-200 bg-green-100 text-green-800",
      icon: <CheckCircle2 className="mr-1 h-3.5 w-3.5" />,
    };
  };

  const handleStartExam = (exam: any) => {
    if (!canTakeExam(exam)) {
      toast({
        title: "Cannot start exam",
        description: "This exam is not available at this time.",
        variant: "destructive",
      });
      return;
    }

    setSelectedExam(exam);
    setIsExamOpen(true);
  };

  const viewToggle = (
    <div className="inline-flex rounded-xl border border-warm-border bg-white p-0.5 shadow-sm">
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className={cn(
          "h-9 w-9 rounded-lg p-0",
          view === "grid" && "bg-brand-turquoise/15 text-brand-turquoise"
        )}
        onClick={() => setView("grid")}
        aria-label="Grid view"
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className={cn(
          "h-9 w-9 rounded-lg p-0",
          view === "list" && "bg-brand-turquoise/15 text-brand-turquoise"
        )}
        onClick={() => setView("list")}
        aria-label="List view"
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  );

  const emptyState = (
    <div className="py-12 text-center">
      <Book className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
      <h3 className="mb-1 text-lg font-semibold">No exams found</h3>
      <p className="text-[15px] text-muted-foreground">
        {searchTerm
          ? "Try a different search term"
          : "There are no exams for your assigned courses yet"}
      </p>
    </div>
  );

  return (
    <DashboardLayout>
      <Header
        title="Upcoming Exams"
        actions={
          <ListToolbar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search exams..."
            extras={viewToggle}
          />
        }
      />

      {isLoadingExams ? (
        <div
          className={cn(
            view === "grid"
              ? "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
              : "space-y-3"
          )}
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                "animate-pulse rounded-card bg-muted",
                view === "grid" ? "h-40" : "h-20"
              )}
            />
          ))}
        </div>
      ) : filteredExams.length === 0 ? (
        emptyState
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredExams.map((exam: any) => {
            const status = getExamStatus(exam);
            const isAvailable = canTakeExam(exam);
            return (
              <Card
                key={exam.id}
                className="flex flex-col overflow-hidden transition-shadow hover:shadow-[0_12px_28px_rgba(0,0,0,0.06)]"
              >
                <CardHeader className="pb-2">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4ECDC4]/15">
                      <FileText className="h-5 w-5 text-[#4ECDC4]" />
                    </div>
                    <Badge
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase",
                        status.color
                      )}
                    >
                      <span className="flex items-center">
                        {status.icon}
                        {status.label}
                      </span>
                    </Badge>
                  </div>
                  <CardTitle className="line-clamp-2 text-[17px]">{exam.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{getCourseName(exam.courseId)}</p>
                </CardHeader>
                <CardContent className="mt-auto space-y-4 pb-4">
                  <p className="line-clamp-2 text-[15px] text-muted-foreground">
                    {exam.description || "No description"}
                  </p>
                  <Button
                    className="w-full"
                    onClick={() => handleStartExam(exam)}
                    disabled={!isAvailable}
                  >
                    {isAvailable ? "Start Exam" : "Not Available"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <DataTable
          title="Exam Directory"
          columns={[
            { key: "exam", label: "Exam" },
            { key: "course", label: "Course" },
            { key: "status", label: "Status" },
            { key: "actions", label: "Actions", align: "right" },
          ]}
          isEmpty={filteredExams.length === 0}
          empty={emptyState}
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        >
          {pageItems.map((exam: any) => {
            const status = getExamStatus(exam);
            const isAvailable = canTakeExam(exam);
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
                  <div className="flex items-center gap-1.5 text-[15px] text-[#2D3748]/90">
                    <Book className="h-3.5 w-3.5 text-[#A0AEC0]" />
                    <span className="truncate">{getCourseName(exam.courseId)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
                      status.color
                    )}
                  >
                    <span className="flex items-center">
                      {status.icon}
                      {status.label}
                    </span>
                  </Badge>
                </TableCell>
                <TableCell className="pr-5 text-right">
                  <Button
                    type="button"
                    size="sm"
                    variant={isAvailable ? "default" : "outline"}
                    className="h-9 rounded-xl"
                    onClick={() => handleStartExam(exam)}
                    disabled={!isAvailable}
                  >
                    {isAvailable ? "Start Exam" : "Unavailable"}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </DataTable>
      )}

      {selectedExam && (
        <ExamView
          open={isExamOpen}
          onOpenChange={setIsExamOpen}
          exam={selectedExam}
        />
      )}
    </DashboardLayout>
  );
}
