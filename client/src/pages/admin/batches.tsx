import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Users, Clock, Target, TrendingUp, Plus, Search, Filter, MoreVertical, Edit, Trash2, Eye, BarChart, GraduationCap, Sparkles, PlayCircle, BookOpen } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import DashboardLayout from "@/components/layout/dashboard-layout";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
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
  const [view, setView] = useState<"grid" | "table">("grid");

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

  // Get batch statistics
  const batchStats = {
    total: batches?.length || 0,
    active: batches?.filter(b => b.isActive).length || 0,
    upcoming: batches?.filter(b => new Date(b.startDate) > new Date()).length || 0,
    completed: batches?.filter(b => new Date(b.startDate) < new Date() && !b.isActive).length || 0,
  };

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
        title="Batch Management" 
        subtitle="Create and manage training batches for courses"
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
                <p className="text-sm font-medium text-gray-600">Total Batches</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{batchStats.total}</h3>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm text-green-600">
              <Sparkles className="h-4 w-4 mr-1" />
              <span>+2 new this month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-white/20 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Batches</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{batchStats.active}</h3>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                <PlayCircle className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm text-gray-600">
              <span>Currently running classes</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-sm border border-white/20 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">186</h3>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm text-green-600">
              <span>+8 this week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-white/20 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Progress</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">78%</h3>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg">
                <Target className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm text-gray-600">
              <span>Trending: +4% this month</span>
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
              placeholder="Search batches by name or code..."
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
                <SelectItem value="inactive">Inactive</SelectItem>
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
            <CalendarIcon size={16} />
            Table
          </Button>

          {/* Create Batch Button */}
          <Button 
            onClick={() => setOpenCreateDialog(true)}
            className="gap-2 bg-gradient-to-br from-blue-500 to-purple-600 text-white border-0 rounded-2xl hover:shadow-xl transition-all duration-300"
          >
            <Plus size={16} />
            Create Batch
          </Button>
        </div>
      </motion.div>
      
      {/* Batches View */}
      {isLoadingBatches ? (
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
      ) : filteredBatches.length === 0 ? (
        <motion.div 
          className="text-center py-16 backdrop-blur-sm bg-white/50 rounded-3xl border border-white/20 shadow-xl"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No batches found</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            {searchTerm ? "No batches match your search criteria. Try a different search term." : "Get started by creating your first batch."}
          </p>
          <Button 
            onClick={() => setOpenCreateDialog(true)}
            className="gap-2 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-2xl hover:shadow-xl"
          >
            <Plus className="h-4 w-4" />
            Create First Batch
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
            {filteredBatches.map((batch, index) => {
              const course = courses?.find(c => c.id === batch.courseId);
              const trainer = trainers?.find(t => t.id === batch.trainerId);
              const studentCount = getRandomStudents(batch.id);
              const progress = getRandomProgress(batch.id);
              
              return (
                <motion.div
                  key={batch.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="backdrop-blur-sm bg-white/70 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 group hover:scale-[1.02] overflow-hidden">
                    {/* Batch Header */}
                    <div className="h-40 relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-500/20 to-purple-500/20 group-hover:from-blue-500/30 group-hover:to-purple-500/30 transition-all duration-500">
                      <div className="text-center p-6">
                        <Badge className="mb-3 bg-white/80 backdrop-blur-sm text-gray-800 border border-white/20">
                          {batch.batchCode}
                        </Badge>
                        <h3 className="text-xl font-bold text-gray-900 line-clamp-2">
                          {batch.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-2">
                          {course?.title || "Unknown Course"}
                        </p>
                      </div>
                      
                      <div className="absolute top-3 right-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 bg-white/80 backdrop-blur-sm border border-white/20 hover:bg-white hover:shadow-lg transition-all duration-300">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-2xl border border-white/20 shadow-xl backdrop-blur-sm bg-white/95">
                            <DropdownMenuItem className="rounded-lg gap-2 hover:bg-purple-50 transition-colors">
                              <Edit className="h-4 w-4 text-purple-600" />
                              <span className="font-medium">Edit Batch</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-lg gap-2 hover:bg-blue-50 transition-colors">
                              <Eye className="h-4 w-4 text-blue-600" />
                              <span className="font-medium">View Details</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedBatchId(batch.id);
                                setOpenEnrollDialog(true);
                              }}
                              className="rounded-lg gap-2 hover:bg-green-50 transition-colors"
                            >
                              <Users className="h-4 w-4 text-green-600" />
                              <span className="font-medium">Enroll Students</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-gray-200/50" />
                            <DropdownMenuItem className="rounded-lg gap-2 hover:bg-red-50 text-red-600 focus:text-red-600 transition-colors">
                              <Trash2 className="h-4 w-4" />
                              <span className="font-medium">Delete Batch</span>
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
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Badge variant={batch.isActive ? "default" : "secondary"} className={cn(
                            batch.isActive 
                              ? "bg-green-100 text-green-800 border border-green-200" 
                              : "bg-gray-100 text-gray-800 border border-gray-200"
                          )}>
                            {batch.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <div className="text-sm text-gray-500">
                            {new Date(batch.startDate).toLocaleDateString()}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <BookOpen className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{course?.title || "Unknown Course"}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">
                              {trainer ? `${trainer.firstName} ${trainer.lastName}` : "Unknown Trainer"}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{batch.batchTime}</span>
                          </div>
                        </div>
                        
                        {batch.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {batch.description}
                          </p>
                        )}
                      </div>
                      
                      {/* Batch Stats */}
                      <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <GraduationCap className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{studentCount} students</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <TrendingUp className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{progress}% progress</span>
                        </div>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="border-t border-white/20 pt-4 bg-gradient-to-r from-gray-50/50 to-gray-100/50">
                      <div className="flex gap-2 w-full">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 gap-1 bg-white/50 backdrop-blur-sm border border-white/20 rounded-xl hover:shadow-lg transition-all duration-300"
                          asChild
                        >
                          <Link href={`/admin/batches/${batch.id}`}>
                            <Eye className="h-4 w-4" />
                            View
                          </Link>
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline" 
                          className="flex-1 gap-1 bg-white/50 backdrop-blur-sm border border-white/20 rounded-xl hover:shadow-lg transition-all duration-300"
                          onClick={() => {
                            setSelectedBatchId(batch.id);
                            setOpenEnrollDialog(true);
                          }}
                        >
                          <Users className="h-4 w-4" />
                          Enroll
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
                    <th className="text-left p-4 font-semibold text-gray-900">Batch</th>
                    <th className="text-left p-4 font-semibold text-gray-900">Course</th>
                    <th className="text-left p-4 font-semibold text-gray-900">Trainer</th>
                    <th className="text-left p-4 font-semibold text-gray-900">Start Date</th>
                    <th className="text-left p-4 font-semibold text-gray-900">Time</th>
                    <th className="text-left p-4 font-semibold text-gray-900">Students</th>
                    <th className="text-left p-4 font-semibold text-gray-900">Progress</th>
                    <th className="text-left p-4 font-semibold text-gray-900">Status</th>
                    <th className="text-left p-4 font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBatches.map((batch, index) => {
                    const course = courses?.find(c => c.id === batch.courseId);
                    const trainer = trainers?.find(t => t.id === batch.trainerId);
                    const studentCount = getRandomStudents(batch.id);
                    const progress = getRandomProgress(batch.id);
                    
                    return (
                      <motion.tr 
                        key={batch.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="border-b border-white/20 hover:bg-gray-50/50 transition-colors duration-200"
                      >
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                              <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{batch.name}</div>
                              <div className="text-sm text-gray-500">{batch.batchCode}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-gray-900">
                            {course?.title || "Unknown Course"}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-gray-600">
                            {trainer ? `${trainer.firstName} ${trainer.lastName}` : "Unknown Trainer"}
                          </div>
                        </td>
                        <td className="p-4 text-sm text-gray-600">
                          {new Date(batch.startDate).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{batch.batchTime}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <GraduationCap className="h-4 w-4 text-gray-400" />
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
                          <Badge className={cn(
                            batch.isActive 
                              ? "bg-green-100 text-green-800 border border-green-200" 
                              : "bg-gray-100 text-gray-800 border border-gray-200"
                          )}>
                            {batch.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 bg-white/50 backdrop-blur-sm border border-white/20 hover:shadow-lg transition-all duration-300"
                              asChild
                            >
                              <Link href={`/admin/batches/${batch.id}`}>
                                <Eye className="h-3 w-3" />
                              </Link>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 bg-white/50 backdrop-blur-sm border border-white/20 hover:shadow-lg transition-all duration-300"
                              onClick={() => {
                                setSelectedBatchId(batch.id);
                                setOpenEnrollDialog(true);
                              }}
                            >
                              <Users className="h-3 w-3" />
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
                  className="flex-1 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white hover:shadow-xl transition-all duration-300"
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