import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ArrowUpRight, TrendingUp, BookOpen } from "lucide-react";

type CoursePerformanceData = {
  name: string;
  percentage: number;
};

type PerformanceMetricsProps = {
  courses: CoursePerformanceData[];
  className?: string;
};

const COURSE_ICON_COLORS = [
  "bg-gradient-to-br from-[#4ECDC4] to-[#1976d2]",
  "bg-gradient-to-br from-violet-500 to-purple-600",
  "bg-gradient-to-br from-amber-500 to-orange-600",
  "bg-gradient-to-br from-pink-500 to-rose-600",
  "bg-gradient-to-br from-sky-500 to-blue-600",
];

export default function PerformanceMetrics({ courses, className }: PerformanceMetricsProps) {
  const getColorClasses = (percentage: number) => {
    if (percentage >= 80) return "from-green-500 to-emerald-600 shadow-green-200";
    if (percentage >= 60) return "from-yellow-500 to-amber-600 shadow-yellow-200";
    return "from-red-500 to-pink-600 shadow-red-200";
  };

  const getTextColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-100 text-green-700";
    if (percentage >= 60) return "bg-amber-100 text-amber-700";
    return "bg-red-100 text-red-700";
  };

  return (
    <Card className={cn("border border-white/20 bg-white/70 shadow-xl backdrop-blur-sm", className)}>
      <CardHeader className="px-6 pb-0 pt-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 p-2.5 shadow-lg">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <CardTitle className="bg-gradient-to-br from-gray-900 to-gray-700 bg-clip-text font-heading font-semibold text-transparent">
            Course Performance
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6 pt-5">
        <div className="space-y-6">
          {courses.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              No enrolled courses yet. Progress will show here after courses are assigned.
            </p>
          ) : (
            courses.map((course, index) => (
              <motion.div
                key={`${course.name}-${index}`}
                className="group cursor-pointer"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ x: 5 }}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-md",
                        COURSE_ICON_COLORS[index % COURSE_ICON_COLORS.length]
                      )}
                    >
                      <BookOpen className="h-4 w-4 text-white" />
                    </div>
                    <span className="line-clamp-1 text-sm font-medium text-gray-900 transition-colors group-hover:text-gray-700">
                      {course.name}
                    </span>
                  </div>
                  <motion.span
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-1 text-sm font-bold",
                      getTextColor(course.percentage)
                    )}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 + 0.3 }}
                  >
                    {course.percentage}%
                  </motion.span>
                </div>

                <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                  <motion.div
                    className={cn(
                      "h-3 rounded-full bg-gradient-to-r shadow-inner",
                      getColorClasses(course.percentage)
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${course.percentage}%` }}
                    transition={{ duration: 1, delay: index * 0.1 + 0.2, ease: "easeOut" }}
                    whileHover={{ scaleY: 1.2 }}
                  >
                    <div className="h-full w-full animate-pulse bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                  </motion.div>
                </div>

                <div className="mt-1 flex justify-between text-xs text-gray-400">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </CardContent>
      {courses.length > 0 ? (
        <CardFooter className="px-6 pb-6 pt-0">
          <Button
            variant="outline"
            className="group w-full rounded-xl border-gray-300 bg-white/50 py-3 text-sm font-medium text-gray-700 backdrop-blur-sm transition-all duration-200 hover:border-gray-400 hover:shadow-lg"
            asChild
          >
            <a href="/student/results">
              View Detailed Report
              <ArrowUpRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}
