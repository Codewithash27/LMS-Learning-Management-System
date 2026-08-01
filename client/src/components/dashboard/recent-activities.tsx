import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Edit,
  CheckCircle,
  Clock,
  UserPlus,
  ArrowRight,
  BookOpen,
  GraduationCap,
  ClipboardList,
  Activity,
} from "lucide-react";

type ActivityType = "new-course" | "exam-results" | "deadline" | "new-students" | "progress";

type ActivityItem = {
  id: string | number;
  type: ActivityType;
  title: string;
  description: string;
  time: string;
  /** Optional index to rotate course-assign colors */
  colorIndex?: number;
};

type RecentActivitiesProps = {
  activities: ActivityItem[];
  className?: string;
};

const COURSE_PALETTES = [
  {
    bg: "bg-gradient-to-br from-[#4ECDC4] to-[#1976d2]",
    icon: <BookOpen className="h-4 w-4 text-white" />,
    pulse: "bg-teal-100",
  },
  {
    bg: "bg-gradient-to-br from-violet-500 to-purple-600",
    icon: <Edit className="h-4 w-4 text-white" />,
    pulse: "bg-purple-100",
  },
  {
    bg: "bg-gradient-to-br from-pink-500 to-rose-600",
    icon: <GraduationCap className="h-4 w-4 text-white" />,
    pulse: "bg-pink-100",
  },
  {
    bg: "bg-gradient-to-br from-amber-500 to-orange-600",
    icon: <ClipboardList className="h-4 w-4 text-white" />,
    pulse: "bg-amber-100",
  },
  {
    bg: "bg-gradient-to-br from-sky-500 to-blue-600",
    icon: <BookOpen className="h-4 w-4 text-white" />,
    pulse: "bg-sky-100",
  },
];

export default function RecentActivities({ activities, className }: RecentActivitiesProps) {
  const getActivityConfig = (type: ActivityType, colorIndex = 0) => {
    switch (type) {
      case "new-course":
        return COURSE_PALETTES[colorIndex % COURSE_PALETTES.length];
      case "exam-results":
        return {
          bg: "bg-gradient-to-br from-green-500 to-emerald-600",
          icon: <CheckCircle className="h-4 w-4 text-white" />,
          pulse: "bg-green-100",
        };
      case "deadline":
        return {
          bg: "bg-gradient-to-br from-amber-500 to-orange-600",
          icon: <Clock className="h-4 w-4 text-white" />,
          pulse: "bg-amber-100",
        };
      case "progress":
        return {
          bg: "bg-gradient-to-br from-cyan-500 to-teal-600",
          icon: <Activity className="h-4 w-4 text-white" />,
          pulse: "bg-cyan-100",
        };
      case "new-students":
        return {
          bg: "bg-gradient-to-br from-cyan-500 to-blue-600",
          icon: <UserPlus className="h-4 w-4 text-white" />,
          pulse: "bg-cyan-100",
        };
      default:
        return COURSE_PALETTES[0];
    }
  };

  return (
    <Card className={cn("border border-white/20 bg-white/70 shadow-xl backdrop-blur-sm", className)}>
      <CardHeader className="px-6 pb-4 pt-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-[#4ECDC4] to-[#1976d2] p-2.5 shadow-lg">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <CardTitle className="bg-gradient-to-br from-gray-900 to-gray-700 bg-clip-text font-heading font-semibold text-transparent">
            Recent Activities
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-4">
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              No recent activity yet. Assigned courses and exam updates will appear here.
            </p>
          ) : (
            <AnimatePresence>
              {activities.map((activity, index) => {
                const { bg, icon, pulse } = getActivityConfig(
                  activity.type,
                  activity.colorIndex ?? index
                );
                const isLast = index === activities.length - 1;

                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4, delay: index * 0.08 }}
                    className={cn(
                      "group flex cursor-pointer items-start rounded-xl border border-transparent bg-white/50 p-4 backdrop-blur-sm transition-all duration-300 hover:border-white/30 hover:shadow-lg",
                      !isLast && "mb-2"
                    )}
                    whileHover={{ scale: 1.02, x: 5 }}
                  >
                    <div className="relative mr-4">
                      <motion.div
                        className={cn("rounded-xl p-2.5 shadow-lg", bg)}
                        whileHover={{ rotate: 5, scale: 1.1 }}
                      >
                        {icon}
                      </motion.div>
                      <div className={cn("absolute inset-0 animate-ping rounded-xl opacity-20", pulse)} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 transition-colors group-hover:text-gray-700">
                            {activity.title}
                          </p>
                          <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                            {activity.description}
                          </p>
                        </div>
                        <span className="ml-2 whitespace-nowrap rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-500">
                          {activity.time}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </CardContent>
      {activities.length > 0 ? (
        <CardFooter className="px-6 pb-6 pt-0">
          <Button
            variant="ghost"
            className="group mt-2 w-full justify-between rounded-xl py-3 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-white/50 hover:text-gray-900"
            asChild
          >
            <a href="/student/my-courses">
              View All Activities
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}
