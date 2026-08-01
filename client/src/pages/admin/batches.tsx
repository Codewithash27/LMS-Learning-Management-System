import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Users, Clock, Plus, Eye, GraduationCap } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import DashboardLayout from "@/components/layout/dashboard-layout";
import Header from "@/components/layout/header";
import ListToolbar from "@/components/layout/list-toolbar";
import DataTable from "@/components/primitives/DataTable";
import { useClientPagination } from "@/hooks/use-client-pagination";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

// Define the form schema for batch creation
const batchFormSchema = z.object({
  name: z.string().min(3, { message: "Batch name must be at least 3 characters" }),
  batchCode: z.string().min(2, { message: "Batch code must be at least 2 characters" }),
  courseId: z.coerce.number({ required_error: "Please select a course" }),
  trainerId: z.coerce.number({ required_error: "Please select a trainer" }),
  startDate: z.date({ required_error: "Please select a start date" }),
  batchTime: z.string().min(1, { message: "Please enter batch time" }),
  description: z.string().optional(),
  maxStudents: z.coerce.number().optional(),
  isActive: z.boolean().default(true)
});

type BatchFormValues = z.infer<typeof batchFormSchema>;

export default function BatchesPage() {
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEnrollDialog, setOpenEnrollDialog] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
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

  // Mutation for batch enrollment
  const enrollStudentsMutation = useMutation({
    mutationFn: async ({ batchId, userIds }: { batchId: number; userIds: number[] }) => {
      return await apiRequest("POST", "/api/batch-enrollments/bulk", { batchId, userIds });
    },
    onSuccess: () => {
      toast({
        title: "🎉 Students enrolled successfully",
        description: "Students have been enrolled to the batch successfully.",
      });
      setOpenEnrollDialog(false);
      setSelectedStudents([]);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to enroll students",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  function onSubmit(values: BatchFormValues) {
    createBatchMutation.mutate(values);
  }

  // Handle student enrollment
  function enrollStudents() {
    if (selectedBatchId && selectedStudents.length > 0) {
      enrollStudentsMutation.mutate({ batchId: selectedBatchId, userIds: selectedStudents });
    } else {
      toast({
        title: "No students selected",
        description: "Please select at least one student to enroll.",
        variant: "destructive",
      });
    }
  }

  // Toggle student selection
  function toggleStudentSelection(studentId: number) {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  }

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
              <TableRow key={batch.id} className="hover:bg-[#FFF5E6]/70">
                <TableCell className="py-3.5 pl-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#4ECDC4]/15">
                      <Users className="h-5 w-5 text-[#4ECDC4]" />
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

      {/* Create Batch Dialog */}
      <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
        <DialogContent className="backdrop-blur-sm bg-white/95 border border-white/20 shadow-2xl rounded-3xl max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="p-3 bg-blue-100 rounded-2xl w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <DialogTitle className="text-xl font-bold text-center text-gray-900">
              Create New Batch
            </DialogTitle>
            <DialogDescription className="text-center text-gray-600">
              Fill in the details to create a new batch. All students in a batch will be enrolled
              in the associated course.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Batch Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter batch name" 
                          className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-xl"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        A descriptive name for the batch
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="batchCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Batch Code</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter batch code" 
                          className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-xl"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        A unique code for this batch
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="courseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-xl">
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
                              <SelectItem
                                key={course.id}
                                value={course.id.toString()}
                              >
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
                  name="trainerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trainer</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-xl">
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
                              <SelectItem
                                key={trainer.id}
                                value={trainer.id.toString()}
                              >
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={`w-full pl-3 text-left font-normal bg-white/70 backdrop-blur-sm border border-white/20 rounded-xl ${
                                !field.value && "text-muted-foreground"
                              }`}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
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
                  name="batchTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Batch Time</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., 09:00 AM" 
                          className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-xl"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter batch description" 
                        className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-xl"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-white/20 p-4 bg-white/50 backdrop-blur-sm">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Active Batch</FormLabel>
                      <FormDescription>
                        Is this batch currently active?
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setOpenCreateDialog(false)}
                  disabled={createBatchMutation.isPending}
                  className="flex-1 rounded-2xl border border-white/20 bg-white/50 backdrop-blur-sm"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createBatchMutation.isPending}
                  className="flex-1 rounded-2xl bg-accent-brand text-white hover:shadow-xl transition-all duration-300"
                >
                  {createBatchMutation.isPending ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-white mr-2" />
                      Creating...
                    </>
                  ) : (
                    "Create Batch"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Enrollment Dialog */}
      <Dialog open={openEnrollDialog} onOpenChange={setOpenEnrollDialog}>
        <DialogContent className="backdrop-blur-sm bg-white/95 border border-white/20 shadow-2xl rounded-3xl max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="p-3 bg-green-100 rounded-2xl w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="h-6 w-6 text-green-600" />
            </div>
            <DialogTitle className="text-xl font-bold text-center text-gray-900">
              Enroll Students to Batch
            </DialogTitle>
            <DialogDescription className="text-center text-gray-600">
              Select students to enroll in this batch. Students will also be enrolled in the
              associated course.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Show selected batch details */}
            {selectedBatchId && batches && (
              <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50 p-4">
                <h3 className="font-medium text-gray-900">Selected Batch:</h3>
                <p className="text-gray-600">
                  {batches.find(b => b.id === selectedBatchId)?.name} - 
                  {courses?.find(c => c.id === batches.find(b => b.id === selectedBatchId)?.courseId)?.title}
                </p>
              </div>
            )}

            {students.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No students available for enrollment</p>
              </div>
            ) : (
              <div>
                <div className="mb-4 flex justify-between items-center">
                  <h3 className="font-medium text-gray-900">Select Students:</h3>
                  <div className="text-sm text-gray-500 bg-white/70 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-1">
                    {selectedStudents.length} students selected
                  </div>
                </div>
                <div className="max-h-[300px] overflow-y-auto border border-white/20 rounded-2xl divide-y divide-white/20">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center p-4 hover:bg-gray-50/50 transition-colors duration-200"
                    >
                      <Checkbox
                        id={`student-${student.id}`}
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={() => toggleStudentSelection(student.id)}
                        className="mr-4 data-[state=checked]:bg-blue-600"
                      />
                      <label
                        htmlFor={`student-${student.id}`}
                        className="flex-1 flex items-center cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mr-3">
                          <span className="font-medium text-blue-600">
                            {student.firstName[0]}{student.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {student.firstName} {student.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{student.email}</p>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setOpenEnrollDialog(false)}
              disabled={enrollStudentsMutation.isPending}
              className="flex-1 rounded-2xl border border-white/20 bg-white/50 backdrop-blur-sm"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={
                enrollStudentsMutation.isPending || 
                selectedStudents.length === 0 || 
                !selectedBatchId
              }
              onClick={enrollStudents}
              className="flex-1 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-white hover:shadow-xl transition-all duration-300"
            >
              {enrollStudentsMutation.isPending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-white mr-2" />
                  Enrolling...
                </>
              ) : (
                "Enroll Selected Students"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
