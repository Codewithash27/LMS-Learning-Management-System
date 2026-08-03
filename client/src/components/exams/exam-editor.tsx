import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Trash, Plus, ClipboardList } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { examFormSchema, type ExamFormValues } from "@/lib/form-schemas";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  CreateFormDialog,
  CreateFormFooter,
  FormSection,
  createFormControlClass,
  createFormLabelClass,
} from "@/components/ui/create-form-dialog";

const EXAM_FORM_ID = "exam-editor-form";

type QuestionType = {
  id: number;
  text: string;
  order: number;
};

type ExamEditorProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses: { id: number; title: string }[];
  exam?: {
    id: number;
    title?: string;
    description?: string;
    courseId?: number;
    acceptingResponses?: boolean;
  };
};

export default function ExamEditor({ open, onOpenChange, courses, exam }: ExamEditorProps) {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<QuestionType[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const isEditing = !!exam?.id;

  const { data: fetchedExam, isLoading: isLoadingExam } = useQuery({
    queryKey: [`/api/exams/${exam?.id}`],
    queryFn: async () => {
      if (!exam?.id) return null;
      const response = await apiRequest("GET", `/api/exams/${exam.id}`);
      return await response.json();
    },
    enabled: !!exam?.id && open,
  });

  const { data: examQuestions, isLoading: isLoadingQuestions } = useQuery({
    queryKey: [`/api/exams/${exam?.id}/questions`],
    queryFn: async () => {
      if (!exam?.id) return [];
      const response = await apiRequest("GET", `/api/exams/${exam.id}/questions`);
      return await response.json();
    },
    enabled: !!exam?.id && open,
  });

  const form = useForm<ExamFormValues>({
    resolver: zodResolver(examFormSchema),
    defaultValues: {
      title: "",
      description: "",
      courseId: "",
      acceptingResponses: true,
    },
  });

  useEffect(() => {
    if (fetchedExam && exam?.id) {
      form.reset({
        title: fetchedExam.title,
        description: fetchedExam.description,
        courseId: String(fetchedExam.courseId),
        acceptingResponses: fetchedExam.acceptingResponses !== false,
      });
    } else if (!exam?.id && open) {
      form.reset({
        title: "",
        description: "",
        courseId: "",
        acceptingResponses: true,
      });
    }
  }, [fetchedExam, exam?.id, open, form]);

  useEffect(() => {
    if (examQuestions && exam?.id) {
      setQuestions(examQuestions);
    } else if (!exam?.id) {
      setQuestions([]);
    }
  }, [examQuestions, exam?.id]);

  const onSubmit = async (data: ExamFormValues) => {
    const emptyQuestions = questions.filter((q) => !q.text.trim());
    if (emptyQuestions.length > 0) {
      toast({
        title: "Incomplete questions",
        description: "Please fill in all question text before saving.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...data,
        courseId: parseInt(data.courseId),
      };

      let examId: number;

      if (exam?.id) {
        await apiRequest("PUT", `/api/exams/${exam.id}`, payload);
        examId = exam.id;
        toast({
          title: "Exam updated",
          description: "The exam has been updated successfully.",
        });
      } else {
        const response = await apiRequest("POST", "/api/exams", payload);
        const newExam = await response.json();
        examId = newExam.id;
        toast({
          title: "Exam created",
          description: "The exam has been created successfully.",
        });
      }

      if (examId) {
        try {
          await apiRequest("DELETE", `/api/exams/${examId}/questions`);

          for (let index = 0; index < questions.length; index++) {
            const question = questions[index];
            await apiRequest("POST", `/api/exams/${examId}/questions`, {
              text: question.text,
              order: index,
              examId,
            });
          }
        } catch (err) {
          console.error("Error saving questions:", err);
          toast({
            title: "Warning",
            description: "Exam was saved but there was an issue saving the questions.",
            variant: "destructive",
          });
        }
      }

      queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
      queryClient.invalidateQueries({ queryKey: [`/api/exams/${examId}/questions`] });
      onOpenChange(false);
    } catch {
      toast({
        title: "Error",
        description: "There was an error saving the exam.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addQuestion = () => {
    const newQuestionId =
      questions.length > 0 ? Math.max(...questions.map((q) => q.id)) + 1 : 1;

    setQuestions([
      ...questions,
      {
        id: newQuestionId,
        text: "",
        order: questions.length,
      },
    ]);
  };

  const updateQuestionText = (questionId: number, text: string) => {
    setQuestions(
      questions.map((question) =>
        question.id === questionId ? { ...question, text } : question
      )
    );
  };

  const removeQuestion = (questionId: number) => {
    setQuestions(questions.filter((question) => question.id !== questionId));
  };

  const isLoading = (isLoadingExam || isLoadingQuestions) && isEditing;

  return (
    <CreateFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Edit Exam" : "Create Exam"}
      description={
        isEditing
          ? "Update exam details and assignment questions."
          : "Create a new assignment exam with text-based questions."
      }
      icon={<ClipboardList className="h-7 w-7 text-white" />}
      maxWidth="max-w-3xl"
      footer={
        <CreateFormFooter
          formId={EXAM_FORM_ID}
          onCancel={() => onOpenChange(false)}
          submitLabel={isEditing ? "Update Exam" : "Create Exam"}
          pendingLabel={isEditing ? "Saving..." : "Creating..."}
          isPending={isSaving}
          submitDisabled={isLoading}
        />
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center p-6">
          <div className="flex flex-col items-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="mt-2 text-sm text-[#718096]">Loading exam data...</p>
          </div>
        </div>
      ) : (
        <Form {...form}>
          <form
            id={EXAM_FORM_ID}
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormSection
              title="Exam details"
              description="Title, course, description, and publish status"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={createFormLabelClass}>Exam Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Data Structures Mid-Term Exam"
                          className={createFormControlClass}
                          disabled={isSaving}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="courseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={createFormLabelClass}>Associated Course</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isSaving}
                      >
                        <FormControl>
                          <SelectTrigger className={createFormControlClass}>
                            <SelectValue placeholder="Select Course" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {courses.map((course) => (
                            <SelectItem key={course.id} value={String(course.id)}>
                              {course.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel className={createFormLabelClass}>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide a description for the exam"
                          rows={2}
                          className={createFormControlClass + " h-auto min-h-[72px] py-2.5"}
                          disabled={isSaving}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="acceptingResponses"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between gap-3 rounded-xl border border-[#D4DEE3] bg-white p-4 sm:col-span-2">
                      <FormLabel className={createFormLabelClass + " cursor-pointer"}>
                        Publish exam (students assigned to this course can take it)
                      </FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value === true}
                          onCheckedChange={field.onChange}
                          disabled={isSaving}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </FormSection>

            <FormSection
              title="Exam questions"
              description="Text-based questions for written student answers"
            >
              <div className="space-y-3">
                {questions.map((question, questionIndex) => (
                  <div
                    key={question.id}
                    className="rounded-xl border border-[#D4DEE3] bg-white p-4"
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <h5 className="text-sm font-semibold text-[#2D3748]">
                        Question {questionIndex + 1}
                      </h5>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-[#A0AEC0] hover:text-red-500"
                        onClick={() => removeQuestion(question.id)}
                        disabled={isSaving}
                        aria-label="Remove question"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>

                    <label
                      htmlFor={`question-${question.id}`}
                      className={createFormLabelClass + " mb-1.5 block"}
                    >
                      Question Text
                    </label>
                    <Textarea
                      id={`question-${question.id}`}
                      value={question.text}
                      onChange={(e) => updateQuestionText(question.id, e.target.value)}
                      rows={2}
                      className={createFormControlClass + " h-auto min-h-[72px] py-2.5"}
                      disabled={isSaving}
                      placeholder="Enter the question prompt"
                    />
                    <p className="mt-2 text-xs text-[#718096]">
                      Students will provide written answers.
                    </p>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  className="h-11 gap-2 rounded-xl border-[#D4DEE3] font-semibold text-[#2D3748]"
                  onClick={addQuestion}
                  disabled={isSaving}
                >
                  <Plus className="h-4 w-4" />
                  Add New Question
                </Button>
              </div>
            </FormSection>
          </form>
        </Form>
      )}
    </CreateFormDialog>
  );
}
