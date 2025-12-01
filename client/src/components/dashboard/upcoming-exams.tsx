import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Calendar, Plus } from 'lucide-react';

type Urgency = 'high' | 'medium' | 'low';

type ExamItem = {
  id: string | number;
  title: string;
  subtitle: string;
  urgency: Urgency;
  urgencyLabel: string;
  time: string;
};

type UpcomingExamsProps = {
  exams: ExamItem[];
  className?: string;
  onScheduleExam?: () => void;
  showScheduleButton?: boolean;
};

export default function UpcomingExams({ 
  exams, 
  className, 
  onScheduleExam, 
  showScheduleButton = true 
}: UpcomingExamsProps) {
  // Enhanced urgency system with gradients
  const getUrgencyClasses = (urgency: Urgency) => {
    switch (urgency) {
      case 'high':
        return 'bg-gradient-to-br from-red-500 to-pink-600 text-white shadow-lg';
      case 'medium':
        return 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg';
      case 'low':
        return 'bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-lg';
    }
  };

  const getBorderColor = (urgency: Urgency) => {
    switch (urgency) {
      case 'high': return 'hover:border-red-200';
      case 'medium': return 'hover:border-amber-200';
      case 'low': return 'hover:border-blue-200';
    }
  };

  return (
    <Card className={cn("backdrop-blur-sm bg-white/70 border border-white/20 shadow-xl", className)}>
      <CardHeader className="px-6 pt-6 pb-4">
        <CardTitle className="font-heading font-semibold bg-gradient-to-br from-gray-900 to-gray-700 bg-clip-text text-transparent">
          Upcoming Exams
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-4">
        <div className="space-y-4">
          <AnimatePresence>
            {exams.map((exam, index) => (
              <motion.div
                key={exam.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={cn(
                  "p-4 rounded-xl border border-gray-200/50 transition-all duration-300 group cursor-pointer bg-white/50 backdrop-blur-sm",
                  getBorderColor(exam.urgency)
                )}
                whileHover={{ 
                  scale: 1.02, 
                  y: -2,
                  boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.1)"
                }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-lg group-hover:text-gray-700 transition-colors truncate">
                      {exam.title}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1 truncate">
                      {exam.subtitle}
                    </p>
                  </div>
                  <motion.span 
                    className={cn(
                      "text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap ml-3 flex-shrink-0",
                      getUrgencyClasses(exam.urgency)
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {exam.urgencyLabel}
                  </motion.span>
                </div>
                
                <div className="flex items-center text-gray-500 text-sm">
                  <Clock className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{exam.time}</span>
                  <Calendar className="h-4 w-4 ml-4 mr-2 text-gray-400" />
                  <span className="font-medium">{exam.urgencyLabel}</span>
                </div>

                {/* Progress bar for urgency visualization */}
                <motion.div 
                  className="w-full bg-gray-200 rounded-full h-1.5 mt-3 overflow-hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 + 0.5 }}
                >
                  <motion.div 
                    className={cn(
                      "h-1.5 rounded-full",
                      exam.urgency === 'high' ? 'bg-red-500' :
                      exam.urgency === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: exam.urgency === 'high' ? '90%' : exam.urgency === 'medium' ? '60%' : '30%' }}
                    transition={{ duration: 1, delay: index * 0.1 + 0.7 }}
                  />
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </CardContent>
      {showScheduleButton && (
        <CardFooter className="px-6 pt-0 pb-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="w-full"
          >
            <Button 
              className="w-full py-3 bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-bold rounded-xl hover:shadow-xl transition-all duration-300 group border-0"
              onClick={onScheduleExam}
            >
              <Plus className="h-4 w-4 mr-2 transition-transform group-hover:rotate-90" />
              Schedule New Exam
            </Button>
          </motion.div>
        </CardFooter>
      )}
    </Card>
  );
}