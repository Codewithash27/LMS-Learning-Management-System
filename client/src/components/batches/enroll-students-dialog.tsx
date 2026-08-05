import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { GraduationCap, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CreateFormDialog,
  CreateFormFooter,
  FormSection,
} from "@/components/ui/create-form-dialog";

export type EnrollStudentOption = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
};

type EnrollStudentsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchId: number | null;
  batchName?: string;
  courseTitle?: string;
  students: EnrollStudentOption[];
  onSuccess?: () => void;
};

export default function EnrollStudentsDialog({
  open,
  onOpenChange,
  batchId,
  batchName,
  courseTitle,
  students,
  onSuccess,
}: EnrollStudentsDialogProps) {
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open) {
      setSelectedStudents([]);
    }
  }, [open]);

  const enrollStudentsMutation = useMutation({
    mutationFn: async ({ batchId, userIds }: { batchId: number; userIds: number[] }) => {
      return await apiRequest("POST", "/api/batch-enrollments/bulk", { batchId, userIds });
    },
    onSuccess: () => {
      toast({
        title: "Students enrolled successfully",
        description: "Students have been enrolled to the batch successfully.",
      });
      onOpenChange(false);
      setSelectedStudents([]);
      if (batchId) {
        queryClient.invalidateQueries({ queryKey: [`/api/batches/${batchId}/enrollments`] });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/batches"] });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to enroll students",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  function toggleStudentSelection(studentId: number) {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  }

  function enrollStudents() {
    if (batchId && selectedStudents.length > 0) {
      enrollStudentsMutation.mutate({ batchId, userIds: selectedStudents });
    } else {
      toast({
        title: "No students selected",
        description: "Please select at least one student to enroll.",
        variant: "destructive",
      });
    }
  }

  return (
    <CreateFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Enroll Students"
      description="Select students to enroll in this batch. They will also be enrolled in the associated course."
      icon={<GraduationCap className="h-7 w-7 text-white" />}
      maxWidth="max-w-2xl"
      footer={
        <CreateFormFooter
          onCancel={() => onOpenChange(false)}
          submitLabel="Enroll Selected Students"
          pendingLabel="Enrolling..."
          isPending={enrollStudentsMutation.isPending}
          submitDisabled={selectedStudents.length === 0 || !batchId}
          submitType="button"
          onSubmit={enrollStudents}
        />
      }
    >
      <div className="space-y-4">
        {(batchName || courseTitle) && (
          <FormSection title="Selected batch">
            <p className="text-sm text-[#4A5568]">
              {[batchName, courseTitle].filter(Boolean).join(" — ")}
            </p>
          </FormSection>
        )}

        <FormSection
          title="Select students"
          description={`${selectedStudents.length} student${selectedStudents.length === 1 ? "" : "s"} selected`}
        >
          {students.length === 0 ? (
            <div className="py-8 text-center">
              <Users className="mx-auto mb-3 h-10 w-10 text-[#A0AEC0]" />
              <p className="text-sm text-muted-foreground">No students available for enrollment</p>
            </div>
          ) : (
            <div className="divide-y divide-[#D4DEE3] overflow-hidden rounded-xl border border-border bg-white">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center gap-3 p-3.5 transition-colors hover:bg-[#FFFBF5]"
                >
                  <Checkbox
                    id={`enroll-student-${student.id}`}
                    checked={selectedStudents.includes(student.id)}
                    onCheckedChange={() => toggleStudentSelection(student.id)}
                  />
                  <label
                    htmlFor={`enroll-student-${student.id}`}
                    className="flex flex-1 cursor-pointer items-center gap-3"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15">
                      <span className="text-sm font-semibold text-primary">
                        {student.firstName[0]}
                        {student.lastName[0]}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold text-[#2D3748]">
                        {student.firstName} {student.lastName}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">{student.email}</p>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          )}
        </FormSection>
      </div>
    </CreateFormDialog>
  );
}
