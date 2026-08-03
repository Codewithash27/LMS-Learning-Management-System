import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Users, Clock, Plus, Eye, GraduationCap } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { batchFormSchema, type BatchFormValues } from "@/lib/form-schemas";
import DashboardLayout from "@/components/layout/dashboard-layout";
import Header from "@/components/layout/header";
import ListToolbar from "@/components/layout/list-toolbar";
import DataTable from "@/components/primitives/DataTable";
import EnrollStudentsDialog from "@/components/batches/enroll-students-dialog";
import { useClientPagination } from "@/hooks/use-client-pagination";
import { Button } from "@/components/ui/button";
import {
  TableCell,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import {
  CreateFormDialog,
  CreateFormFooter,
  FormSection,
  createFormControlClass,
  createFormLabelClass,
} from "@/components/ui/create-form-dialog";

const CREATE_BATCH_FORM_ID = "create-batch-form";

export default function BatchesPage() {
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEnrollDialog, setOpenEnrollDialog] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const queryClient = useQueryClient();

  // Define interface types for API responses
  interface User {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    tenantId: number;
  }

  interface Course {
    id: number;
    title: string;
    description: string;
    tenantId: number;
    createdBy: number;
    isEnrollmentRequired: boolean;
  }

  interface Batch {
    id: number;
    name: string;
    courseId: number;
    batchCode: string;
    trainerId: number;
    startDate: string;
    batchTime: string;
    tenantId: number;
    createdBy: number;
    description: string | null;
    maxStudents: number | null;
    isActive: boolean;
  }
  
  // Fetch batches
  const { data: batches, isLoading: isLoadingBatches } = useQuery<Batch[]>({
    queryKey: ['/api/batches'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch courses for the dropdown
  const { data: courses, isLoading: isLoadingCourses } = useQuery<Course[]>({
    queryKey: ['/api/courses'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch trainers (admins) for the dropdown
  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['/api/users'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Trainers are users with role 'admin'
  const trainers = users?.filter(user => user.role === 'admin' || user.role === 'superadmin') || [];
  
  // Students are users with role 'student'
  const students = users?.filter(user => user.role === 'student') || [];

  // Form for creating a new batch
  const form = useForm<BatchFormValues>({
    resolver: zodResolver(batchFormSchema),
    defaultValues: {
      name: "",
      batchCode: "",
      batchTime: "09:00 AM",
      description: "",
      isActive: true
    },
  });

  // Reset form when dialog is opened/closed
  useEffect(() => {
    if (!openCreateDialog) {
      form.reset();
    }
  }, [openCreateDialog, form]);

  // Mutation for creating a batch
  const createBatchMutation = useMutation({
    mutationFn: async (values: BatchFormValues) => {
      // Format the date for API
      const formattedValues = {
        ...values,
        startDate: format(values.startDate, "yyyy-MM-dd")
      };
      
      return await apiRequest("POST", "/api/batches", formattedValues);
    },
    onSuccess: () => {
      toast({
        title: "🎉 Batch created successfully",
        description: "The batch has been created successfully.",
      });
      setOpenCreateDialog(false);
      queryClient.invalidateQueries({ queryKey: ['/api/batches'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create batch",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  function onSubmit(values: BatchFormValues) {
    createBatchMutation.mutate(values);
  }

  const selectedBatch = batches?.find((b) => b.id === selectedBatchId);
  const selectedBatchCourse = courses?.find((c) => c.id === selectedBatch?.courseId);

  // Filter batches based on search term and filters
  const filteredBatches = batches?.filter((batch) => {
    const matchesSearch = 
      batch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.batchCode.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && batch.isActive) ||
      (statusFilter === "inactive" && !batch.isActive);
    
    return matchesSearch && matchesStatus;
  }) || [];

  const {
    page,
    pageSize,
    total,
    pageItems,
    setPage,
    setPageSize,
  } = useClientPagination(filteredBatches, 10);

  // Calculate random student count for demo
  const getRandomStudents = (batchId: number) => {
    const students = [12, 18, 24, 15, 20, 16, 22, 19];
    return students[batchId % students.length];
  };

  // Calculate random progress for demo
  const getRandomProgress = (batchId: number) => {
    const progress = [65, 78, 92, 45, 87, 72, 83, 68];
    return progress[batchId % progress.length];
  };

  return (
    <DashboardLayout>
      <Header
        title="Batches"
        actions={
          <ListToolbar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search batches..."
            filters={
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 w-[140px] rounded-xl border-warm-border bg-white shadow-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            }
            action={
              <Button
                type="button"
                onClick={() => setOpenCreateDialog(true)}
                className="h-11 w-11 shrink-0 rounded-xl p-0"
                aria-label="Create batch"
              >
                <Plus className="h-5 w-5" />
              </Button>
            }
          />
        }
      />

      {isLoadingBatches ? (
        <div className="flex min-h-[240px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <DataTable
          title="Batch Directory"
          columns={[
            { key: "batch", label: "Batch" },
            { key: "course", label: "Course" },
            { key: "trainer", label: "Trainer" },
            { key: "start", label: "Start Date" },
            { key: "time", label: "Time" },
            { key: "students", label: "Students" },
            { key: "progress", label: "Progress" },
            { key: "status", label: "Status" },
            { key: "actions", label: "Actions", align: "right" },
          ]}
          isEmpty={filteredBatches.length === 0}
          empty={
            <div className="text-center">
              <Users className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
              <h3 className="mb-1 text-lg font-semibold">No batches found</h3>
              <p className="mb-4 text-[15px] text-muted-foreground">
                {searchTerm
                  ? "No batches match your search."
                  : "Create your first batch to get started."}
              </p>
              {!searchTerm && (
                <Button type="button" onClick={() => setOpenCreateDialog(true)} className="gap-2 rounded-xl">
                  <Plus className="h-4 w-4" />
                  Create Batch
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
          {pageItems.map((batch) => {
            const course = courses?.find(c => c.id === batch.courseId);
            const trainer = trainers?.find(t => t.id === batch.trainerId);
            const studentCount = getRandomStudents(batch.id);
            const progress = getRandomProgress(batch.id);

            return (
              <TableRow key={batch.id} className="hover:bg-[#EEF3F5]/70">
                <TableCell className="py-3.5 pl-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0F766E]/15">
                      <Users className="h-5 w-5 text-[#0F766E]" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold text-[#2D3748]">{batch.name}</p>
                      <p className="text-xs text-[#718096]">{batch.batchCode}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-[15px] text-[#2D3748]/90">
                  {course?.title || "Unknown Course"}
                </TableCell>
                <TableCell className="text-[15px] text-[#2D3748]/90">
                  {trainer ? `${trainer.firstName} ${trainer.lastName}` : "Unknown Trainer"}
                </TableCell>
                <TableCell className="text-[15px] text-[#2D3748]/90">
                  {new Date(batch.startDate).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-[15px] text-[#2D3748]/90">
                    <Clock className="h-3.5 w-3.5 text-[#A0AEC0]" />
                    <span>{batch.batchTime}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-[15px] text-[#2D3748]/90">
                    <GraduationCap className="h-3.5 w-3.5 text-[#A0AEC0]" />
                    <span>{studentCount}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={progress} className="h-2 w-16" />
                    <span className="text-sm text-[#718096]">{progress}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
                      batch.isActive
                        ? "border-green-200 bg-green-100 text-green-800"
                        : "border-gray-200 bg-gray-100 text-gray-800"
                    )}
                  >
                    {batch.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="pr-5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/admin/batches/${batch.id}`}>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-9 w-9 p-0 text-[#0E7490] hover:bg-[#0E7490]/10"
                        aria-label="View"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-9 w-9 p-0 text-[#0F766E] hover:bg-[#0F766E]/10"
                      aria-label="Enroll students"
                      onClick={() => {
                        setSelectedBatchId(batch.id);
                        setOpenEnrollDialog(true);
                      }}
                    >
                      <Users className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </DataTable>
      )}

      <CreateFormDialog
        open={openCreateDialog}
        onOpenChange={setOpenCreateDialog}
        title="Create Batch"
        description="Fill in the details to create a new batch. Students in a batch will be enrolled in the associated course."
        icon={<Users className="h-7 w-7 text-white" />}
        maxWidth="max-w-2xl"
        footer={
          <CreateFormFooter
            formId={CREATE_BATCH_FORM_ID}
            onCancel={() => setOpenCreateDialog(false)}
            submitLabel="Create Batch"
            pendingLabel="Creating..."
            isPending={createBatchMutation.isPending}
          />
        }
      >
        <Form {...form}>
          <form
            id={CREATE_BATCH_FORM_ID}
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormSection
              title="Batch details"
              description="Name, code, course, and description"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={createFormLabelClass}>Batch Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter batch name"
                          className={createFormControlClass}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>A descriptive name for the batch</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="batchCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={createFormLabelClass}>Batch Code</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter batch code"
                          className={createFormControlClass}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>A unique code for this batch</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="courseId"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel className={createFormLabelClass}>Course</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger className={createFormControlClass}>
                            <SelectValue placeholder="Select a course" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingCourses ? (
                            <SelectItem value="loading" disabled>
                              Loading courses...
                            </SelectItem>
                          ) : (
                            courses?.map((course) => (
                              <SelectItem key={course.id} value={course.id.toString()}>
                                {course.title}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Course that will be taught in this batch
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel className={createFormLabelClass}>Description (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter batch description"
                          className={createFormControlClass}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </FormSection>

            <FormSection
              title="Schedule & trainer"
              description="When the batch runs and who leads it"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="trainerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={createFormLabelClass}>Trainer</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger className={createFormControlClass}>
                            <SelectValue placeholder="Select a trainer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingUsers ? (
                            <SelectItem value="loading" disabled>
                              Loading trainers...
                            </SelectItem>
                          ) : (
                            trainers.map((trainer) => (
                              <SelectItem key={trainer.id} value={trainer.id.toString()}>
                                {trainer.firstName} {trainer.lastName}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Admin who will be responsible for this batch
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="batchTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={createFormLabelClass}>Batch Time</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., 09:00 AM"
                          className={createFormControlClass}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className={createFormLabelClass}>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              className={cn(
                                createFormControlClass,
                                "w-full justify-start pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-[#D4DEE3] bg-white p-4 sm:col-span-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className={createFormLabelClass}>Active Batch</FormLabel>
                        <FormDescription>Is this batch currently active?</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </FormSection>
          </form>
        </Form>
      </CreateFormDialog>

      <EnrollStudentsDialog
        open={openEnrollDialog}
        onOpenChange={setOpenEnrollDialog}
        batchId={selectedBatchId}
        batchName={selectedBatch?.name}
        courseTitle={selectedBatchCourse?.title}
        students={students}
      />
    </DashboardLayout>
  );
}
