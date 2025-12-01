import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

type CoursePerformanceData = {
  name: string;
  percentage: number;
};

type PerformanceMetricsProps = {
  courses: CoursePerformanceData[];
  className?: string;
};

export default function PerformanceMetrics({ courses, className }: PerformanceMetricsProps) {
  // Enhanced color system with gradients
  const getColorClasses = (percentage: number) => {
    if (percentage >= 80) return 'from-green-500 to-emerald-600 shadow-green-200';
    if (percentage >= 60) return 'from-yellow-500 to-amber-600 shadow-yellow-200';
    return 'from-red-500 to-pink-600 shadow-red-200';
  };

  const getTextColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-700';
    if (percentage >= 60) return 'text-amber-700';
    return 'text-red-700';
  };

  return (
    <Card className={cn("backdrop-blur-sm bg-white/70 border border-white/20 shadow-xl", className)}>
      <CardHeader className="px-6 pt-6 pb-0">
        <CardTitle className="font-heading font-semibold bg-gradient-to-br from-gray-900 to-gray-700 bg-clip-text text-transparent">
          Course Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="space-y-6">
          {courses.map((course, index) => (
            <motion.div 
              key={index}
              className="group cursor-pointer"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ x: 5 }}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-sm text-gray-900 group-hover:text-gray-700 transition-colors">
                  {course.name}
                </span>
                <motion.span 
                  className={cn("text-sm font-bold px-2 py-1 rounded-full", getTextColor(course.percentage))}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.3 }}
                >
                  {course.percentage}%
                </motion.span>
              </div>
              
              {/* Background track */}
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <motion.div 
                  className={cn(
                    "rounded-full h-3 bg-gradient-to-r shadow-inner",
                    getColorClasses(course.percentage)
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${course.percentage}%` }}
                  transition={{ duration: 1, delay: index * 0.1 + 0.2, ease: "easeOut" }}
                  whileHover={{ scaleY: 1.2 }}
                >
                  {/* Shimmer effect */}
                  <div className="w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                </motion.div>
              </div>
              
              {/* Performance indicator dots */}
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="px-6 pt-0 pb-6">
        <Button 
          variant="outline" 
          className="w-full py-3 text-gray-700 border-gray-300 hover:border-gray-400 text-sm font-medium rounded-xl hover:shadow-lg transition-all duration-200 group bg-white/50 backdrop-blur-sm"
        >
          View Detailed Report
          <ArrowUpRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Button>
      </CardFooter>
    </Card>
  );
}