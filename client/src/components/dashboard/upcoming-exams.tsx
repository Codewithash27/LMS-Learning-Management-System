import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Calendar, Plus, ClipboardList, FileText, Award } from "lucide-react";

type Urgency = "high" | "medium" | "low";

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
  showScheduleButton = true,
}: UpcomingExamsProps) {
  const getUrgencyClasses = (urgency: Urgency) => {
    switch (urgency) {
      case "high":
        return "bg-gradient-to-br from-red-500 to-pink-600 text-white shadow-lg";
      case "medium":
        return "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg";
      case "low":
        return "bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-lg";
    }
  };

  const getIconConfig = (urgency: Urgency) => {
    switch (urgency) {
      case "high":
        return {
          bg: "bg-gradient-to-br from-red-500 to-pink-600",
          icon: <ClipboardList className="h-4 w-4 text-white" />,
        };
      case "medium":
        return {
          bg: "bg-gradient-to-br from-amber-500 to-orange-600",
          icon: <FileText className="h-4 w-4 text-white" />,
        };
      case "low":
        return {
          bg: "bg-gradient-to-br from-blue-500 to-cyan-600",
          icon: <Award className="h-4 w-4 text-white" />,
        };
    }
  };

  const getBorderColor = (urgency: Urgency) => {
    switch (urgency) {
      case "high":
        return "hover:border-red-200";
      case "medium":
        return "hover:border-amber-200";
      case "low":
        return "hover:border-blue-200";
    }
  };

  return (
    <Card className={cn("border border-white/20 bg-white/70 shadow-xl backdrop-blur-sm", className)}>
      <CardHeader className="px-6 pb-4 pt-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 p-2.5 shadow-lg">
            <ClipboardList className="h-5 w-5 text-white" />
          </div>
          <CardTitle className="bg-gradient-to-br from-gray-900 to-gray-700 bg-clip-text font-heading font-semibold text-transparent">
            Upcoming Exams
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-4">
        <div className="space-y-4">
          {exams.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              No exams yet for your assigned courses.
            </p>
          ) : (
            <AnimatePresence>
              {exams.map((exam, index) => {
                const iconCfg = getIconConfig(exam.urgency);
                return (
                  <motion.div
                    key={exam.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className={cn(
                      "group cursor-pointer rounded-xl border border-gray-200/50 bg-white/50 p-4 backdrop-blur-sm transition-all duration-300",
                      getBorderColor(exam.urgency)
                    )}
                    whileHover={{
                      scale: 1.02,
                      y: -2,
                      boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.1)",
                    }}
                    onClick={() => {
                      window.location.href = "/student/upcoming-exams";
                    }}
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <motion.div
                          className={cn("shrink-0 rounded-xl p-2.5 shadow-lg", iconCfg.bg)}
                          whileHover={{ rotate: 5, scale: 1.1 }}
                        >
                          {iconCfg.icon}
                        </motion.div>
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-lg font-bold text-gray-900 transition-colors group-hover:text-gray-700">
                            {exam.title}
                          </h3>
                          <p className="mt-1 truncate text-sm text-gray-600">{exam.subtitle}</p>
                        </div>
                      </div>
                      <motion.span
                        className={cn(
                          "ml-1 flex-shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold",
                          getUrgencyClasses(exam.urgency)
                        )}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {exam.urgencyLabel}
                      </motion.span>
                    </div>

                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="mr-2 h-4 w-4 text-gray-400" />
                      <span>{exam.time}</span>
                      <Calendar className="ml-4 mr-2 h-4 w-4 text-gray-400" />
                      <span className="font-medium">{exam.urgencyLabel}</span>
                    </div>

                    <motion.div
                      className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-200"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.1 + 0.5 }}
                    >
                      <motion.div
                        className={cn(
                          "h-1.5 rounded-full",
                          exam.urgency === "high"
                            ? "bg-red-500"
                            : exam.urgency === "medium"
                              ? "bg-amber-500"
                              : "bg-blue-500"
                        )}
                        initial={{ width: 0 }}
                        animate={{
                          width:
                            exam.urgency === "high"
                              ? "90%"
                              : exam.urgency === "medium"
                                ? "60%"
                                : "30%",
                        }}
                        transition={{ duration: 1, delay: index * 0.1 + 0.7 }}
                      />
                    </motion.div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </CardContent>
      {showScheduleButton && (
        <CardFooter className="px-6 pb-6 pt-0">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="w-full"
          >
            <Button
              className="group w-full rounded-xl border-0 bg-accent-brand py-3 text-sm font-bold text-white transition-all duration-300 hover:shadow-xl"
              onClick={onScheduleExam}
            >
              <Plus className="mr-2 h-4 w-4 transition-transform group-hover:rotate-90" />
              Schedule New Exam
            </Button>
          </motion.div>
        </CardFooter>
      )}
    </Card>
  );
}
