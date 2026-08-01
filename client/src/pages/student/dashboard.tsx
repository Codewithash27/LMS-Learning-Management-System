import { useEffect, useMemo } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import Header from "@/components/layout/header";
import StatCard from "@/components/dashboard/stat-card";
import PerformanceMetrics from "@/components/dashboard/performance-metrics";
import RecentActivities from "@/components/dashboard/recent-activities";
import UpcomingExams from "@/components/dashboard/upcoming-exams";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  GraduationCap,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { getCourseThumbnailSrc } from "@/lib/course-thumbnail";

type ActivityType = "new-course" | "exam-results" | "deadline" | "new-students" | "progress";

function formatRelativeTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "Recently";
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "Recently";

  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return "Just now";

  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function StudentDashboard() {
  const { user } = useAuth();

  const { data: enrollments = [], isLoading: isLoadingEnrollments } = useQuery<any[]>({
    queryKey: ["/api/enrollments/user"],
    enabled: !!user,
  });

  const { data: allCourses = [], isLoading: isLoadingCourses } = useQuery<any[]>({
    queryKey: ["/api/courses"],
    enabled: !!user,
  });

  const { data: exams = [] } = useQuery<any[]>({
    queryKey: ["/api/exams"],
    enabled: !!user,
  });

  const { data: examAttempts = [] } = useQuery<any[]>({
    queryKey: ["/api/exam-attempts/user"],
    enabled: !!user,
  });

  const { data: activityLogs = [] } = useQuery<any[]>({
    queryKey: ["/api/activity-logs/user"],
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    const logActivity = async () => {
      try {
        await apiRequest("POST", "/api/activity-logs", {
          activityType: "dashboard_view",
          resourceId: 0,
          resourceType: "dashboard",
        });
      } catch {
        // Activity logging should not disrupt the dashboard
      }
    };
    logActivity();
  }, [user]);

  const enrolledCourseIds = useMemo(
    () => new Set(enrollments.map((enrollment) => Number(enrollment.courseId))),
    [enrollments]
  );

  const enrolledCourses = useMemo(
    () => allCourses.filter((course) => enrolledCourseIds.has(Number(course.id))),
    [allCourses, enrolledCourseIds]
  );

  const courseById = useMemo(() => {
    const map = new Map<number, any>();
    for (const course of allCourses) map.set(Number(course.id), course);
    // Also index enrolled list in case catalog cache is filtered
    for (const course of enrolledCourses) map.set(Number(course.id), course);
    return map;
  }, [allCourses, enrolledCourses]);

  const examById = useMemo(() => {
    const map = new Map<number, any>();
    for (const exam of exams) map.set(Number(exam.id), exam);
    return map;
  }, [exams]);

  const completedCoursesCount = enrollments.filter(
    (e) => e.completedAt || Number(e.progress || 0) >= 100
  ).length;

  // Real course completion for this student
  const coursePerformance = useMemo(
    () =>
      enrolledCourses.map((course) => {
        const enrollment = enrollments.find(
          (e) => Number(e.courseId) === Number(course.id)
        );
        return {
          name: course.title,
          percentage: Math.min(100, Math.max(0, Number(enrollment?.progress || 0))),
        };
      }),
    [enrolledCourses, enrollments]
  );

  // Upcoming exams = exams for assigned courses (from API), prefer open / not finished
  const upcomingExams = useMemo(() => {
    const completedExamIds = new Set(
      examAttempts
        .filter((a) => a.completedAt)
        .map((a) => Number(a.examId))
    );
    const startedExamIds = new Set(examAttempts.map((a) => Number(a.examId)));

    return exams
      .filter((exam) => enrolledCourseIds.has(Number(exam.courseId)))
      .map((exam) => {
        const course = courseById.get(Number(exam.courseId));
        const isCompleted = completedExamIds.has(Number(exam.id));
        const isStarted = startedExamIds.has(Number(exam.id));
        const isOpen = exam.acceptingResponses !== false;

        let urgency: "high" | "medium" | "low" = "low";
        let urgencyLabel = "Available";

        if (isCompleted) {
          urgency = "low";
          urgencyLabel = "Completed";
        } else if (isStarted) {
          urgency = "medium";
          urgencyLabel = "In progress";
        } else if (isOpen) {
          urgency = "high";
          urgencyLabel = "Open";
        } else {
          urgency = "low";
          urgencyLabel = "Closed";
        }

        return {
          id: exam.id,
          title: exam.title,
          subtitle: course?.title || exam.description || "Assigned course exam",
          urgency,
          urgencyLabel,
          time: isOpen ? "Accepting responses" : "Not accepting responses",
          _sort: isCompleted ? 2 : isStarted ? 1 : 0,
        };
      })
      .sort((a, b) => a._sort - b._sort)
      .slice(0, 5)
      .map(({ _sort, ...exam }) => exam);
  }, [exams, enrolledCourseIds, courseById, examAttempts]);

  // Recent activities from assigns, logs, and exam results
  const recentActivities = useMemo(() => {
    type ActivityRow = {
      id: string | number;
      type: ActivityType;
      title: string;
      description: string;
      time: string;
      colorIndex?: number;
      sortAt: number;
    };

    const rows: ActivityRow[] = [];
    let courseColor = 0;

    const resolveCourseTitle = (courseId: number, enrollment?: any) =>
      enrollment?.course?.title ||
      courseById.get(courseId)?.title ||
      `Course #${courseId}`;

    // Course assignments (source of truth for "new course assigned")
    for (const enrollment of enrollments) {
      const courseId = Number(enrollment.courseId);
      const when = enrollment.enrolledAt ? new Date(enrollment.enrolledAt).getTime() : 0;
      rows.push({
        id: `enroll-${enrollment.id}`,
        type: "new-course",
        title: "Course Assigned",
        description: resolveCourseTitle(courseId, enrollment),
        time: formatRelativeTime(enrollment.enrolledAt),
        colorIndex: courseColor++,
        sortAt: when,
      });
    }

    // Activity logs (lesson / exam / assign events)
    for (const log of activityLogs) {
      if (log.activityType === "dashboard_view") continue;

      const when = log.timestamp ? new Date(log.timestamp).getTime() : 0;
      let type: ActivityType = "deadline";
      let title = "Activity";
      let description = log.resourceType || "";
      let colorIndex: number | undefined;

      if (log.activityType === "course_assign" || log.activityType === "course_enroll") {
        type = "new-course";
        title = "Course Assigned";
        description = resolveCourseTitle(Number(log.resourceId));
        colorIndex = courseColor++;
      } else if (log.activityType === "lesson_complete") {
        type = "progress";
        title = "Lesson Completed";
        description = resolveCourseTitle(Number(log.resourceId));
      } else if (log.activityType === "exam_start") {
        const exam = examById.get(Number(log.resourceId));
        type = "deadline";
        title = "Exam Started";
        description = exam?.title || `Exam #${log.resourceId}`;
      } else if (log.activityType === "exam_complete") {
        const exam = examById.get(Number(log.resourceId));
        type = "exam-results";
        title = "Exam Submitted";
        description = exam?.title || `Exam #${log.resourceId}`;
      } else if (log.activityType === "course_view") {
        type = "progress";
        title = "Course Viewed";
        description = resolveCourseTitle(Number(log.resourceId));
      } else {
        continue;
      }

      rows.push({
        id: `log-${log.id}`,
        type,
        title,
        description,
        time: formatRelativeTime(log.timestamp),
        colorIndex,
        sortAt: when,
      });
    }

    // Exam results / reviews
    for (const attempt of examAttempts) {
      const exam = examById.get(Number(attempt.examId));
      if (attempt.reviewedAt) {
        const when = new Date(attempt.reviewedAt).getTime();
        rows.push({
          id: `review-${attempt.id}`,
          type: "exam-results",
          title: "Exam Results Available",
          description: exam?.title || `Exam #${attempt.examId}`,
          time: formatRelativeTime(attempt.reviewedAt),
          sortAt: when,
        });
      } else if (attempt.completedAt) {
        const when = new Date(attempt.completedAt).getTime();
        rows.push({
          id: `attempt-${attempt.id}`,
          type: "exam-results",
          title: "Exam Submitted",
          description: exam?.title || `Exam #${attempt.examId}`,
          time: formatRelativeTime(attempt.completedAt),
          sortAt: when,
        });
      }
    }

    const seen = new Set<string>();
    return rows
      .sort((a, b) => b.sortAt - a.sortAt)
      .filter((row) => {
        const key = `${row.type}|${row.title}|${row.description}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 8)
      .map(({ sortAt, ...activity }, index) => ({
        ...activity,
        colorIndex: activity.colorIndex ?? index,
      }));
  }, [enrollments, activityLogs, examAttempts, courseById, examById]);

  return (
    <DashboardLayout>
      <Header
        title="Student Dashboard"
      />

      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <StatCard
            title="Enrolled Courses"
            value={enrolledCourses.length}
            icon={<BookOpen />}
            iconColor="primary"
          />

          <StatCard
            title="Completed Courses"
            value={completedCoursesCount}
            icon={<GraduationCap />}
            iconColor="accent"
          />

          <StatCard
            title="Upcoming Exams"
            value={upcomingExams.filter((e) => e.urgencyLabel !== "Completed").length}
            icon={<Clock />}
            iconColor="secondary"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="border border-white/20 bg-white/70 shadow-xl backdrop-blur-sm lg:col-span-2">
            <CardHeader>
              <CardTitle>My Courses</CardTitle>
              <CardDescription>Your enrolled and in-progress courses</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingEnrollments || isLoadingCourses ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="mb-2 h-5 w-1/4 rounded bg-gray-200" />
                      <div className="mb-2 h-3 rounded bg-gray-200" />
                      <div className="h-2 rounded bg-gray-200" />
                    </div>
                  ))}
                </div>
              ) : enrolledCourses.length === 0 ? (
                <div className="py-6 text-center">
                  <BookOpen className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <h3 className="mb-1 text-lg font-medium text-gray-900">No courses assigned</h3>
                  <p className="mb-4 text-gray-500">
                    Your administrator will assign courses to your account.
                  </p>
                  <Link href="/student/my-courses">
                    <Button variant="outline">View My Courses</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {enrolledCourses.map((course: any) => {
                    const enrollment = enrollments.find(
                      (e) => Number(e.courseId) === Number(course.id)
                    );
                    const progress = enrollment?.progress || 0;
                    const thumb = getCourseThumbnailSrc(course.thumbnail);

                    return (
                      <div key={course.id} className="space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#4ECDC4]/15">
                              {thumb ? (
                                <img
                                  src={thumb}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <BookOpen className="h-5 w-5 text-[#4ECDC4]" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-medium">{course.title}</h3>
                              <p className="text-sm text-gray-500">
                                {course.description?.substring(0, 100)}
                                {course.description?.length > 100 ? "..." : ""}
                              </p>
                            </div>
                          </div>
                          <Link href={`/student/my-courses/${course.id}`}>
                            <Button size="sm" variant="outline" className="shrink-0 gap-1">
                              <ArrowUpRight className="h-4 w-4" />
                              Continue
                            </Button>
                          </Link>
                        </div>
                        <div className="flex items-center space-x-4">
                          <Progress value={progress} className="flex-1" />
                          <span className="text-sm">{progress}% complete</span>
                        </div>
                      </div>
                    );
                  })}

                  <div className="pt-4 text-center">
                    <Link href="/student/my-courses">
                      <Button variant="outline">View All Courses</Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <PerformanceMetrics courses={coursePerformance} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <RecentActivities activities={recentActivities} className="lg:col-span-2" />

          <UpcomingExams exams={upcomingExams} showScheduleButton={false} />
        </div>
      </div>
    </DashboardLayout>
  );
}
