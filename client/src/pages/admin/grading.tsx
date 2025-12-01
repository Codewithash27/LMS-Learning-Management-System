import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Search, FileText, Clock, User, CheckCircle2, XCircle, Eye, GraduationCap, Award, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/layout/dashboard-layout';
import Header from '@/components/layout/header';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

type ExamAttempt = {
  id: number;
  userId: number;
  examId: number;
  startedAt: string;
  completedAt: string | null;
  answers: Record<string, string>;
  feedback: string | null;
  reviewedAt: string | null;
  user: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
  };
  exam: {
    id: number;
    title: string;
    description: string;
  };
};

type Question = {
  id: number;
  text: string;
  order: number;
  examId: number;
};

export default function GradingPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAttempt, setSelectedAttempt] = useState<ExamAttempt | null>(null);
  const [isGradingOpen, setIsGradingOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Fetch all completed exam attempts
  const { data: examAttempts, isLoading } = useQuery({
    queryKey: ['/api/admin/exam-attempts'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/exam-attempts');
      return await response.json();
    },
  });

  // Fetch questions for the selected exam
  const { data: questions } = useQuery({
    queryKey: [`/api/exams/${selectedAttempt?.examId}/questions`],
    queryFn: async () => {
      if (!selectedAttempt?.examId) return [];
      const response = await apiRequest('GET', `/api/exams/${selectedAttempt.examId}/questions`);
      return await response.json();
    },
    enabled: !!selectedAttempt?.examId,
  });

  const filteredAttempts = examAttempts?.filter((attempt: ExamAttempt) =>
    attempt.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    attempt.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    attempt.exam.title.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleGrade = async () => {
    if (!selectedAttempt) return;

    setIsSubmitting(true);
    try {
      await apiRequest('PUT', `/api/admin/exam-attempts/${selectedAttempt.id}/grade`, {
        feedback,
      });

      toast({
        title: 'Grading completed',
        description: 'The exam has been graded successfully.',
      });

      queryClient.invalidateQueries({ queryKey: ['/api/admin/exam-attempts'] });
      setIsGradingOpen(false);
      setSelectedAttempt(null);
      setFeedback('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save grading. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openGrading = (attempt: ExamAttempt) => {
    setSelectedAttempt(attempt);
    setFeedback(attempt.feedback || '');
    setIsGradingOpen(true);
  };

  const getStatusBadge = (attempt: ExamAttempt) => {
    if (!attempt.completedAt) {
      return (
        <Badge className="bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1 rounded-full font-medium text-xs">
          <Clock className="h-3 w-3 mr-1" />
          In Progress
        </Badge>
      );
    }
    
    if (attempt.reviewedAt) {
      return (
        <Badge className="bg-green-100 text-green-800 border border-green-200 px-3 py-1 rounded-full font-medium text-xs">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Graded
        </Badge>
      );
    }
    
    return (
      <Badge className="bg-blue-100 text-blue-800 border border-blue-200 px-3 py-1 rounded-full font-medium text-xs">
        <FileText className="h-3 w-3 mr-1" />
        Needs Grading
      </Badge>
    );
  };

  // Calculate statistics
  const stats = {
    total: examAttempts?.length || 0,
    needsGrading: examAttempts?.filter((a: ExamAttempt) => a.completedAt && !a.reviewedAt).length || 0,
    graded: examAttempts?.filter((a: ExamAttempt) => a.reviewedAt).length || 0,
    inProgress: examAttempts?.filter((a: ExamAttempt) => !a.completedAt).length || 0,
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-2 text-gray-500">Loading exam submissions...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Header 
        title="Exam Grading" 
        subtitle="Review and grade student exam submissions"
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
                <p className="text-sm font-medium text-gray-600">Total Submissions</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</h3>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-sm border border-white/20 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Needs Grading</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.needsGrading}</h3>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-white/20 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Graded</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.graded}</h3>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-white/20 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.inProgress}</h3>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search and Filters */}
      <motion.div 
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <Input
            placeholder="Search by student name or exam title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </motion.div>

      {/* Exam Attempts List */}
      <motion.div 
        className="grid gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <AnimatePresence>
          {filteredAttempts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="backdrop-blur-sm bg-white/50 rounded-3xl border border-white/20 shadow-xl">
                <CardContent className="p-6 text-center py-16">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No submissions found</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    {searchTerm ? 'No submissions match your search criteria. Try a different search term.' : 'No exam submissions available yet.'}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            filteredAttempts.map((attempt: ExamAttempt, index: number) => (
              <motion.div
                key={attempt.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="backdrop-blur-sm bg-white/70 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 group hover:scale-[1.01]">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                            <FileText className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-heading text-lg font-semibold text-gray-900">{attempt.exam.title}</h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                              <div className="flex items-center space-x-1">
                                <User className="h-4 w-4 text-gray-400" />
                                <span className="font-medium">{attempt.user.firstName} {attempt.user.lastName}</span>
                                <span className="text-gray-400">({attempt.user.username})</span>
                              </div>
                              {attempt.completedAt && (
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-4 w-4 text-gray-400" />
                                  <span>Submitted {new Date(attempt.completedAt).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        {getStatusBadge(attempt)}
                        {attempt.completedAt && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openGrading(attempt)}
                            className="gap-2 bg-white/50 backdrop-blur-sm border border-white/20 rounded-xl hover:shadow-lg transition-all duration-300"
                          >
                            <Eye className="h-4 w-4" />
                            {attempt.reviewedAt ? 'View Grading' : 'Grade'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>

      {/* Grading Dialog */}
      <Dialog open={isGradingOpen} onOpenChange={setIsGradingOpen}>
        <DialogContent className="backdrop-blur-sm bg-white/95 border border-white/20 shadow-2xl rounded-3xl max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <DialogTitle className="text-xl font-bold text-center text-gray-900">
              Grade Exam: {selectedAttempt?.exam.title}
            </DialogTitle>
            <div className="text-sm text-gray-600 text-center mt-2">
              Student: <span className="font-semibold">{selectedAttempt?.user.firstName} {selectedAttempt?.user.lastName}</span> ({selectedAttempt?.user.username})
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Student Answers */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
                <Award className="h-5 w-5 text-blue-600" />
                Student Answers
              </h3>
              <div className="space-y-4">
                {questions?.map((question: Question, index: number) => (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="backdrop-blur-sm bg-white/50 border border-white/20 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <h4 className="font-semibold mb-2 text-gray-900">Question {index + 1}</h4>
                    <p className="text-gray-700 mb-3 leading-relaxed">{question.text}</p>
                    <div className="bg-gradient-to-br from-blue-50/50 to-purple-50/50 rounded-xl p-4 border border-blue-100/50">
                      <Label className="text-sm font-semibold text-gray-700">Student Answer:</Label>
                      <p className="mt-2 text-gray-900 leading-relaxed">
                        {selectedAttempt?.answers?.[question.id] || (
                          <span className="text-gray-400 italic">No answer provided</span>
                        )}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Feedback Section */}
            <div>
              <Label htmlFor="feedback" className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-purple-600" />
                Instructor Feedback
              </Label>
              <Textarea
                id="feedback"
                placeholder="Provide detailed feedback on the student's performance..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="mt-2 min-h-[120px] bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setIsGradingOpen(false)}
              disabled={isSubmitting}
              className="flex-1 rounded-2xl border border-white/20 bg-white/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGrade}
              disabled={isSubmitting}
              className="flex-1 gap-2 bg-gradient-to-br from-blue-500 to-purple-600 text-white border-0 rounded-2xl hover:shadow-xl transition-all duration-300"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent border-white" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Save Grading
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}