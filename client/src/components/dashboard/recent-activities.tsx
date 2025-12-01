import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Edit, 
  CheckCircle, 
  Clock, 
  UserPlus,
  ArrowRight
} from 'lucide-react';

type ActivityType = 'new-course' | 'exam-results' | 'deadline' | 'new-students';

type ActivityItem = {
  id: string | number;
  type: ActivityType;
  title: string;
  description: string;
  time: string;
};

type RecentActivitiesProps = {
  activities: ActivityItem[];
  className?: string;
};

export default function RecentActivities({ activities, className }: RecentActivitiesProps) {
  // Enhanced icon system with gradients
  const getActivityConfig = (type: ActivityType) => {
    switch (type) {
      case 'new-course':
        return {
          bg: 'bg-gradient-to-br from-blue-500 to-purple-600',
          icon: <Edit className="h-4 w-4 text-white" />,
          pulse: 'bg-blue-100'
        };
      case 'exam-results':
        return {
          bg: 'bg-gradient-to-br from-green-500 to-emerald-600',
          icon: <CheckCircle className="h-4 w-4 text-white" />,
          pulse: 'bg-green-100'
        };
      case 'deadline':
        return {
          bg: 'bg-gradient-to-br from-amber-500 to-orange-600',
          icon: <Clock className="h-4 w-4 text-white" />,
          pulse: 'bg-amber-100'
        };
      case 'new-students':
        return {
          bg: 'bg-gradient-to-br from-cyan-500 to-blue-600',
          icon: <UserPlus className="h-4 w-4 text-white" />,
          pulse: 'bg-cyan-100'
        };
    }
  };

  return (
    <Card className={cn("backdrop-blur-sm bg-white/70 border border-white/20 shadow-xl", className)}>
      <CardHeader className="px-6 pt-6 pb-4">
        <CardTitle className="font-heading font-semibold bg-gradient-to-br from-gray-900 to-gray-700 bg-clip-text text-transparent">
          Recent Activities
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-4">
        <div className="space-y-4">
          <AnimatePresence>
            {activities.map((activity, index) => {
              const { bg, icon, pulse } = getActivityConfig(activity.type);
              const isLast = index === activities.length - 1;
              
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className={cn(
                    "flex items-start p-4 rounded-xl group cursor-pointer transition-all duration-300 hover:shadow-lg border border-transparent hover:border-white/30 bg-white/50 backdrop-blur-sm",
                    !isLast && "mb-2"
                  )}
                  whileHover={{ scale: 1.02, x: 5 }}
                >
                  {/* Animated icon with pulse */}
                  <div className="relative mr-4">
                    <motion.div 
                      className={cn("p-2 rounded-xl shadow-lg", bg)}
                      whileHover={{ rotate: 5, scale: 1.1 }}
                    >
                      {icon}
                    </motion.div>
                    <div className={cn("absolute inset-0 rounded-xl animate-ping opacity-20", pulse)} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                          {activity.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {activity.description}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 font-medium px-2 py-1 bg-gray-100 rounded-full whitespace-nowrap ml-2">
                        {activity.time}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </CardContent>
      <CardFooter className="px-6 pt-0 pb-6">
        <Button 
          variant="ghost" 
          className="mt-2 text-gray-700 hover:text-gray-900 text-sm font-medium hover:bg-white/50 rounded-xl transition-all duration-200 group w-full justify-between py-3"
        >
          View All Activities
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </CardFooter>
    </Card>
  );
}