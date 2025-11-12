import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  Clock, 
  FileText,
  Download,
  BookOpen,
  ChevronDown, 
  StickyNote, 
  Save, 
  Trash2,
  Award,
  HelpCircle,
  Menu
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Link } from 'react-router-dom';
import { useTrainingCourses, useUserEnrollments, useEnrollInCourse, useUpdateLessonProgress, useLessonProgress } from '@/hooks/useTrainingData';
import { useSignedUrl } from '@/hooks/useSignedUrl';
import { useUserNotes, useAutoSaveNote, useDeleteNote } from '@/hooks/useNotes';
import { useQuizQuestions, useUserQuizAnswers, useSubmitQuizAnswer } from '@/hooks/useQuizData';
import { generateCertificate, downloadCertificatePDF } from '@/lib/certificates';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import ct1Logo from '@/assets/ct1-logo-main.png';
// YouTube helpers
const isYouTubeUrl = (url: string): boolean => {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be');
  } catch {
    return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//.test(url);
  }
};

const getYouTubeEmbedUrl = (url: string): string => {
  if (!isYouTubeUrl(url)) return url;
  let id: string | null = null;
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) {
      id = u.pathname.slice(1);
    } else if (u.pathname.startsWith('/shorts/')) {
      id = u.pathname.split('/')[2] || null;
    } else if (u.pathname.startsWith('/embed/')) {
      id = u.pathname.split('/')[2] || null;
    } else {
      id = u.searchParams.get('v');
    }
  } catch {
    const m = url.match(/(?:watch\?v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{6,})/);
    id = m ? m[1] : null;
  }
  if (!id) return url;
  const params = 'modestbranding=1&rel=0';
  return `https://www.youtube-nocookie.com/embed/${id}?${params}`;
};

const isGoogleDriveUrl = (url: string): boolean => {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('drive.google.com');
  } catch {
    return false;
  }
};

export const CoursePlayer = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { data: courses } = useTrainingCourses();
  const { data: enrollments } = useUserEnrollments();
  const { mutate: enrollInCourse } = useEnrollInCourse();
  const { mutate: updateProgress } = useUpdateLessonProgress();

  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [hasWatchedVideo, setHasWatchedVideo] = useState(false);
  const [open, setOpen] = useState(false);

  const course = courses?.find(c => c.id === courseId);
  const enrollment = enrollments?.find(e => e.course_id === courseId);
  const { data: lessonProgress } = useLessonProgress(enrollment?.id || '');
  
  const currentModule = course?.course_modules?.[currentModuleIndex];
  const currentLesson = currentModule?.course_lessons?.[currentLessonIndex];
  
  // Notes functionality
  const { data: existingNote } = useUserNotes(currentLesson?.id || '', enrollment?.id || '');
  const { mutate: deleteNote } = useDeleteNote();
  const { content, setContent, isSaving, saveNote } = useAutoSaveNote(
    currentLesson?.id || '', 
    enrollment?.id || ''
  );
  
  const { url: signedVideoUrl } = useSignedUrl(currentLesson?.video_url || null);
  const { url: signedPdfUrl } = useSignedUrl(currentLesson?.pdf_url || null);

  // Quiz hooks
  const { data: quizQuestions } = useQuizQuestions(currentLesson?.id || '');
  const { data: userQuizAnswers } = useUserQuizAnswers(enrollment?.id || '', currentLesson?.id || '');
  const { mutate: submitQuizAnswer } = useSubmitQuizAnswer();

  const totalLessons = course?.course_modules?.reduce((total, module) => 
    total + module.course_lessons.length, 0) || 0;
  
  const completedLessons = lessonProgress?.filter(p => p.is_completed).length || 0;
  const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  const isLessonCompleted = lessonProgress?.some(
    p => p.lesson_id === currentLesson?.id && p.is_completed
  );

  useEffect(() => {
    if (course?.course_modules?.length) {
      // Find the first incomplete lesson to start from
      let foundIncomplete = false;
      for (let moduleIdx = 0; moduleIdx < course.course_modules.length; moduleIdx++) {
        const module = course.course_modules[moduleIdx];
        for (let lessonIdx = 0; lessonIdx < module.course_lessons.length; lessonIdx++) {
          const lesson = module.course_lessons[lessonIdx];
          const isCompleted = lessonProgress?.some(
            p => p.lesson_id === lesson.id && p.is_completed
          );
          if (!isCompleted) {
            setCurrentModuleIndex(moduleIdx);
            setCurrentLessonIndex(lessonIdx);
            foundIncomplete = true;
            break;
          }
        }
        if (foundIncomplete) break;
      }
    }
  }, [course, lessonProgress]);

  // Reset media errors when lesson changes and load existing note
  useEffect(() => {
    setVideoError(null);
    setPdfError(null);
    setQuizAnswers({});
    setShowQuizModal(false);
    setHasWatchedVideo(false);
    if (existingNote?.content) {
      setContent(existingNote.content);
      setNoteContent(existingNote.content);
    } else {
      setContent('');
      setNoteContent('');
    }
  }, [currentLesson?.id, existingNote, setContent]);

  // Simulate video watching (track after 10 seconds)
  useEffect(() => {
    if (currentLesson?.lesson_type === 'video' && isPlaying) {
      const timer = setTimeout(() => {
        setHasWatchedVideo(true);
      }, 10000); // 10 seconds
      return () => clearTimeout(timer);
    }
  }, [currentLesson, isPlaying]);

  // Helper: Get lesson status label
  const getLessonStatus = (moduleIdx: number, lessonIdx: number, lesson: any) => {
    const isCompleted = lessonProgress?.some(p => p.lesson_id === lesson.id && p.is_completed);
    
    if (isCompleted) return { label: 'Completed', variant: 'default' as const, className: 'bg-green-500 text-white' };
    
    // Check if this is the first uncompleted lesson
    let isFirstIncomplete = true;
    for (let mi = 0; mi < (course?.course_modules?.length || 0); mi++) {
      const mod = course?.course_modules?.[mi];
      if (!mod) continue;
      for (let li = 0; li < mod.course_lessons.length; li++) {
        const l = mod.course_lessons[li];
        const completed = lessonProgress?.some(p => p.lesson_id === l.id && p.is_completed);
        if (!completed) {
          if (mi === moduleIdx && li === lessonIdx) {
            return { 
              label: isFirstIncomplete ? 'Start Here' : 'Watch Next', 
              variant: 'default' as const,
              className: isFirstIncomplete ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-primary'
            };
          }
          isFirstIncomplete = false;
        }
      }
    }
    
    return { label: 'Locked', variant: 'secondary' as const, className: '' };
  };

  // Helper: Check if lesson is accessible
  const isLessonAccessible = (moduleIdx: number, lessonIdx: number, lesson: any) => {
    const isCompleted = lessonProgress?.some(p => p.lesson_id === lesson.id && p.is_completed);
    if (isCompleted) return true;

    // Check if all previous lessons are completed
    for (let mi = 0; mi < moduleIdx; mi++) {
      const mod = course?.course_modules?.[mi];
      if (!mod) continue;
      for (const l of mod.course_lessons) {
        const completed = lessonProgress?.some(p => p.lesson_id === l.id && p.is_completed);
        if (!completed) return false;
      }
    }

    // Check lessons in the same module before this one
    const currentMod = course?.course_modules?.[moduleIdx];
    if (currentMod) {
      for (let li = 0; li < lessonIdx; li++) {
        const l = currentMod.course_lessons[li];
        const completed = lessonProgress?.some(p => p.lesson_id === l.id && p.is_completed);
        if (!completed) return false;
      }
    }

    return true;
  };

  const handleEnroll = () => {
    if (courseId) {
      enrollInCourse(courseId);
    }
  };

  const handleMarkComplete = () => {
    // For video lessons, require watching and quiz completion
    if (currentLesson?.lesson_type === 'video') {
      if (!hasWatchedVideo) {
        toast.error('Please watch the video before marking as complete');
        return;
      }

      if (quizQuestions && quizQuestions.length > 0) {
        const allQuestionsAnswered = quizQuestions.every(q => 
          userQuizAnswers?.some(a => a.question_id === q.id && a.is_correct)
        );
        
        if (!allQuestionsAnswered) {
          setShowQuizModal(true);
          toast.info('Please complete the quiz to proceed');
          return;
        }
      }
    }

    // Mark lesson as complete
    if (currentLesson && enrollment && user) {
      updateProgress({
        lessonId: currentLesson.id,
        enrollmentId: enrollment.id,
        isCompleted: true,
        timeSpentMinutes: currentLesson.duration_minutes || 0,
      }, {
        onSuccess: async () => {
          toast.success('Lesson completed! 🎉');
          
          // Check if all lessons in the course are now completed
          const allLessons = course?.course_modules?.flatMap(m => m.course_lessons) || [];
          const completedLessonIds = new Set([
            ...lessonProgress.filter(p => p.is_completed).map(p => p.lesson_id),
            currentLesson.id
          ]);
          
          const allCompleted = allLessons.every(l => completedLessonIds.has(l.id));
          
          if (allCompleted && course && profile) {
            // Generate certificate
            await generateCertificate(
              user.id,
              course.id,
              course.title,
              profile.contact_name || profile.company_name || 'Student'
            );
          }
        }
      });
    }
  };

  const goToNextLesson = () => {
    // Check if there's a quiz for video lessons before proceeding
    if (currentLesson?.lesson_type === 'video' && quizQuestions && quizQuestions.length > 0) {
      const allQuestionsAnswered = quizQuestions.every(q => 
        userQuizAnswers?.some(a => a.question_id === q.id && a.is_correct)
      );
      
      if (!allQuestionsAnswered) {
        setShowQuizModal(true);
        return;
      }
    }

    if (!course?.course_modules) return;

    const currentModuleLessons = course.course_modules[currentModuleIndex]?.course_lessons.length || 0;
    
    if (currentLessonIndex < currentModuleLessons - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1);
    } else if (currentModuleIndex < course.course_modules.length - 1) {
      setCurrentModuleIndex(currentModuleIndex + 1);
      setCurrentLessonIndex(0);
    }
  };

  const goToPreviousLesson = () => {
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex(currentLessonIndex - 1);
    } else if (currentModuleIndex > 0) {
      setCurrentModuleIndex(currentModuleIndex - 1);
      const prevModule = course?.course_modules?.[currentModuleIndex - 1];
      setCurrentLessonIndex((prevModule?.course_lessons.length || 1) - 1);
    }
  };

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Course not found</h2>
          <Button onClick={() => navigate('/dashboard/training')}>
            Back to Training Hub
          </Button>
        </div>
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="min-h-screen bg-background">
        {/* CT1 Branding Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 p-3 shadow-md mb-6">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={ct1Logo} alt="CT1 Logo" className="h-10 w-10" />
              <div>
                <h1 className="text-xl font-bold text-primary-foreground">CT1 Training</h1>
                <p className="text-xs text-primary-foreground/90">One-Up Your Business</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard/training')}
              className="text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/10"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Training Hub
            </Button>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">

          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-3xl mb-2">{course.title}</CardTitle>
                    <p className="text-muted-foreground text-lg mb-4">{course.description}</p>
                    <div className="flex gap-2 mb-4">
                      <Badge variant="secondary">{course.training_categories?.name}</Badge>
                      <Badge variant="outline">{course.difficulty_level}</Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Course Content</h3>
                    <div className="space-y-4">
                      {course.course_modules?.map((module, moduleIdx) => (
                        <Card key={module.id} className="border-l-4 border-l-primary">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg">{module.title}</CardTitle>
                            {module.description && (
                              <p className="text-sm text-muted-foreground">{module.description}</p>
                            )}
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {module.course_lessons.map((lesson, lessonIdx) => (
                                <div key={lesson.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                                  {lesson.lesson_type === 'video' && <Play className="h-4 w-4" />}
                                  {lesson.lesson_type === 'pdf' && <FileText className="h-4 w-4" />}
                                  {lesson.lesson_type === 'text' && <BookOpen className="h-4 w-4" />}
                                  <span className="flex-1">{lesson.title}</span>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <Button size="lg" onClick={handleEnroll}>
                      Enroll in Course
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* CT1 Branding Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 p-3 shadow-md">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={ct1Logo} alt="CT1 Logo" className="h-10 w-10" />
            <div>
              <h1 className="text-xl font-bold text-primary-foreground">CT1 Course Player</h1>
              <p className="text-xs text-primary-foreground/90">One-Up Your Business</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/dashboard/training')}
            className="text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/10"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Training Hub
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Left Sidebar - Hidden on mobile, drawer on tablet/mobile */}
        <div className="hidden lg:block lg:w-80 border-r bg-card/50 backdrop-blur-sm min-h-screen overflow-y-auto">
          <div className="p-6 space-y-6">

            {/* Course Progress Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Course Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Progress value={progressPercentage} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  {completedLessons} of {totalLessons} lessons completed
                </p>
                <p className="text-2xl font-bold">{Math.round(progressPercentage)}%</p>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/dashboard/training" onClick={() => setOpen(false)}>
                  <Award className="h-4 w-4 mr-2" />
                  My Certificates
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="mailto:support@myct1.com">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Support
                </a>
              </Button>
            </div>

            {/* All Training Courses */}
            <div>
              <h3 className="font-semibold mb-3">All Courses</h3>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3 pr-4">
                  {courses?.map((c) => {
                    const isCurrentCourse = c.id === courseId;
                    const courseEnrollment = enrollments?.find(e => e.course_id === c.id);
                    
                    return (
                      <Card 
                        key={c.id} 
                        className={`cursor-pointer transition-all hover:border-primary ${
                          isCurrentCourse ? 'border-primary shadow-md' : ''
                        }`}
                        onClick={() => {
                          if (!isCurrentCourse) {
                            navigate(`/dashboard/training/course/${c.id}`);
                          }
                        }}
                      >
                        <CardHeader className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-sm font-medium line-clamp-2">
                              {c.title}
                            </CardTitle>
                            {isCurrentCourse && (
                              <Badge variant="default" className="text-xs flex-shrink-0">Active</Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="p-3 pt-0 space-y-2">
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="secondary" className="text-xs">
                              {c.training_categories?.name}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {c.difficulty_level}
                            </Badge>
                          </div>
                          {courseEnrollment && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="font-medium">{Math.round(courseEnrollment.progress_percentage)}%</span>
                              </div>
                              <Progress value={courseEnrollment.progress_percentage} className="h-1.5" />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto w-full">
          <div className="container mx-auto px-4 lg:px-6 py-4 lg:py-8">
            
            {/* Mobile Progress Button */}
            <div className="lg:hidden mb-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setOpen(true)}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Course Progress ({Math.round(progressPercentage)}%)
              </Button>
            </div>
            {/* Current Module Lessons Navigation */}
            <div className="mb-6">
              <h2 className="text-base lg:text-lg font-semibold mb-3">Course Progress Path</h2>
              <ScrollArea className="w-full">
                <div className="flex gap-2 lg:gap-3 pb-4">
                  {course?.course_modules?.map((module, moduleIdx) => 
                    module.course_lessons.map((lesson, lessonIdx) => {
                      const isCompleted = lessonProgress?.some(
                        p => p.lesson_id === lesson.id && p.is_completed
                      );
                      const isCurrent = moduleIdx === currentModuleIndex && lessonIdx === currentLessonIndex;
                      const isAccessible = isLessonAccessible(moduleIdx, lessonIdx, lesson);
                      const status = getLessonStatus(moduleIdx, lessonIdx, lesson);
                      
                      return (
                        <Card 
                          key={lesson.id} 
                          className={`flex-shrink-0 w-44 lg:w-52 transition-all ${
                            isCurrent ? 'border-primary shadow-lg ring-2 ring-primary/20' : ''
                          } ${
                            isAccessible ? 'cursor-pointer hover:border-primary' : 'opacity-60 cursor-not-allowed'
                          }`}
                          onClick={() => {
                            if (isAccessible) {
                              setCurrentModuleIndex(moduleIdx);
                              setCurrentLessonIndex(lessonIdx);
                            }
                          }}
                        >
                          <CardContent className="p-4 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2 flex-1">
                                {isCompleted ? (
                                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                ) : isAccessible ? (
                                  <Play className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                ) : (
                                  <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-xs text-muted-foreground">🔒</span>
                                  </div>
                                )}
                                <span className="text-sm font-medium line-clamp-2">{lesson.title}</span>
                              </div>
                            </div>
                            <Badge 
                              variant={status.variant}
                              className={`text-xs ${status.className}`}
                            >
                              {status.label}
                            </Badge>
                            {lesson.duration_minutes && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {lesson.duration_minutes} min
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="grid grid-cols-1 gap-6">
          {/* Course Content Area */}
          <div className="w-full">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl">{currentLesson?.title}</CardTitle>
                    <p className="text-muted-foreground mt-2">{currentLesson?.description}</p>
                  </div>
                  <Badge variant={isLessonCompleted ? "default" : "secondary"}>
                    {isLessonCompleted ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </>
                    ) : (
                      'In Progress'
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Video Player */}
                  {currentLesson?.video_url && (
                    <div className="space-y-4">
                      {/* Video Watch Status */}
                      {currentLesson.lesson_type === 'video' && !isLessonCompleted && (
                        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-0.5">
                                {hasWatchedVideo ? (
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : (
                                  <Clock className="h-5 w-5 text-blue-500" />
                                )}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm mb-1">
                                  {hasWatchedVideo ? '✓ Video Watched' : 'Watch the Video'}
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  {hasWatchedVideo 
                                    ? quizQuestions && quizQuestions.length > 0 
                                      ? 'Now complete the quiz below to proceed'
                                      : 'Click "Mark Complete" to finish this lesson'
                                    : 'Watch for at least 10 seconds to unlock completion'}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      <div 
                        className="aspect-video bg-black rounded-lg flex items-center justify-center"
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                      >
                        {isYouTubeUrl(currentLesson.video_url) ? (
                            <iframe
                              key={currentLesson.id}
                              src={getYouTubeEmbedUrl(currentLesson.video_url)}
                              className="w-full h-full rounded-lg"
                              title={currentLesson.title}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              referrerPolicy="strict-origin-when-cross-origin"
                              allowFullScreen
                              onLoad={() => setIsPlaying(true)}
                            />
                        ) : isGoogleDriveUrl(currentLesson.video_url) ? (
                            <iframe
                              key={currentLesson.id}
                              src={currentLesson.video_url}
                              className="w-full h-full rounded-lg"
                              title={currentLesson.title}
                              allow="autoplay"
                              allowFullScreen
                              onLoad={() => setIsPlaying(true)}
                            />
                        ) : (
                              <video
                                key={currentLesson.id}
                                controls
                                className="w-full h-full rounded-lg"
                                src={signedVideoUrl || currentLesson.video_url}
                                poster="/placeholder.svg"
                                onError={() => setVideoError('Failed to load video. You can try downloading it below.')}
                                onPlay={() => setIsPlaying(true)}
                                onPause={() => setIsPlaying(false)}
                              >
                                Your browser does not support the video tag.
                              </video>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Text Content */}
                  {currentLesson?.content && (
                    <div className="prose max-w-none">
                      <div dangerouslySetInnerHTML={{ __html: currentLesson.content }} />
                    </div>
                  )}

                  {/* PDF Viewer */}
                  {currentLesson?.pdf_url && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Course Material</h3>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <a href={signedPdfUrl || currentLesson.pdf_url} target="_blank" rel="noopener noreferrer">
                              Open in new tab
                            </a>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <a href={signedPdfUrl || currentLesson.pdf_url} download>
                              <Download className="h-4 w-4 mr-2" />
                              Download PDF
                            </a>
                          </Button>
                        </div>
                      </div>
                      <div className="aspect-[3/4] bg-muted rounded-lg flex items-center justify-center">
                        <iframe 
                          key={currentLesson.id}
                          src={signedPdfUrl || currentLesson.pdf_url}
                          className="w-full h-full rounded-lg"
                          title={currentLesson.title}
                        />
                      </div>
                    </div>
                  )}

                   {/* Notes Section */}
                   {enrollment && currentLesson && (
                     <div className="pt-6 border-t">
                       <Collapsible open={isNotesOpen} onOpenChange={setIsNotesOpen}>
                         <CollapsibleTrigger asChild>
                           <Button variant="outline" className="w-full justify-between">
                             <div className="flex items-center gap-2">
                               <StickyNote className="h-4 w-4" />
                               Lesson Notes
                               {existingNote && <Badge variant="secondary" className="text-xs">Saved</Badge>}
                             </div>
                             <ChevronDown className="h-4 w-4" />
                           </Button>
                         </CollapsibleTrigger>
                         <CollapsibleContent className="mt-4 space-y-3">
                           <Textarea
                             placeholder="Take notes about this lesson..."
                             value={content}
                             onChange={(e) => {
                               const newContent = e.target.value;
                               setContent(newContent);
                               setNoteContent(newContent);
                               // Auto-save after 2 seconds of no typing
                               setTimeout(() => {
                                 if (newContent.trim() && newContent === content) {
                                   saveNote(newContent);
                                 }
                               }, 2000);
                             }}
                             rows={6}
                             className="resize-none"
                           />
                           <div className="flex items-center justify-between">
                             <div className="flex items-center gap-2 text-sm text-muted-foreground">
                               {isSaving && (
                                 <>
                                   <Save className="h-3 w-3 animate-spin" />
                                   Saving...
                                 </>
                               )}
                               {existingNote && !isSaving && (
                                 <span>Last saved: {new Date(existingNote.updated_at).toLocaleString()}</span>
                               )}
                             </div>
                             <div className="flex gap-2">
                               <Button
                                 size="sm"
                                 variant="outline"
                                 onClick={async () => {
                                   try {
                                     const { data, error } = await supabase.functions.invoke('export-notes', {
                                       body: { enrollmentId: enrollment.id, format: 'text' }
                                     });
                                     if (error) throw error;
                                     
                                     // Create and download the file
                                     const blob = new Blob([data], { type: 'text/plain' });
                                     const url = URL.createObjectURL(blob);
                                     const a = document.createElement('a');
                                     a.href = url;
                                     a.download = `${course?.title || 'course'}-notes.txt`;
                                     document.body.appendChild(a);
                                     a.click();
                                     document.body.removeChild(a);
                                     URL.revokeObjectURL(url);
                                     toast.success('Notes exported successfully!');
                                   } catch (error) {
                                     console.error('Export error:', error);
                                     toast.error('Failed to export notes');
                                   }
                                 }}
                               >
                                 <Download className="h-3 w-3 mr-1" />
                                 Export
                               </Button>
                               {content.trim() && (
                                 <Button
                                   size="sm"
                                   variant="outline"
                                   onClick={() => saveNote(content)}
                                   disabled={isSaving}
                                 >
                                   <Save className="h-3 w-3 mr-1" />
                                   Save Now
                                 </Button>
                               )}
                               {existingNote && (
                                 <Button
                                   size="sm"
                                   variant="outline"
                                   onClick={() => {
                                     deleteNote({ 
                                       lessonId: currentLesson.id, 
                                       enrollmentId: enrollment.id 
                                     });
                                     setContent('');
                                     setNoteContent('');
                                   }}
                                 >
                                   <Trash2 className="h-3 w-3 mr-1" />
                                   Delete
                                 </Button>
                               )}
                             </div>
                           </div>
                         </CollapsibleContent>
                       </Collapsible>
                     </div>
                   )}

                   {/* Quiz Section - Inline */}
                   {currentLesson?.lesson_type === 'video' && quizQuestions && quizQuestions.length > 0 && hasWatchedVideo && (
                     <div className="pt-6 border-t space-y-4">
                       <div className="flex items-center justify-between mb-4">
                         <h3 className="text-lg font-semibold flex items-center gap-2">
                           <HelpCircle className="h-5 w-5 text-primary" />
                           Knowledge Check
                         </h3>
                         <Badge variant="outline">
                           {quizQuestions.filter(q => userQuizAnswers?.some(a => a.question_id === q.id && a.is_correct)).length} / {quizQuestions.length} Complete
                         </Badge>
                       </div>
                       <Card className="bg-primary/5">
                         <CardContent className="p-4">
                           <p className="text-sm text-muted-foreground">
                             Complete all quiz questions correctly to mark this lesson as complete and unlock the next lesson.
                           </p>
                         </CardContent>
                       </Card>
                       <div className="space-y-6">
                         {quizQuestions.map((question, idx) => {
                           const userAnswer = userQuizAnswers?.find(a => a.question_id === question.id);
                           const currentAnswer = quizAnswers[question.id];
                           const isAnswered = userAnswer?.is_correct || false;
                           
                           return (
                             <Card key={question.id} className={isAnswered ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-2 border-dashed'}>
                               <CardHeader>
                                 <CardTitle className="text-base flex items-center justify-between">
                                   <span>Question {idx + 1}: {question.question_text}</span>
                                   {isAnswered && <CheckCircle className="h-5 w-5 text-green-500" />}
                                 </CardTitle>
                               </CardHeader>
                               <CardContent className="space-y-4">
                                 {question.question_type === 'multiple_choice' && question.options && (
                                   <RadioGroup
                                     value={currentAnswer || ''}
                                     onValueChange={(value) => {
                                       setQuizAnswers(prev => ({ ...prev, [question.id]: value }));
                                     }}
                                     disabled={isAnswered}
                                   >
                                     {question.options.map((option, optIdx) => (
                                       <div key={optIdx} className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50">
                                         <RadioGroupItem value={option} id={`q-${question.id}-${optIdx}`} />
                                         <Label htmlFor={`q-${question.id}-${optIdx}`} className="cursor-pointer flex-1">{option}</Label>
                                       </div>
                                     ))}
                                   </RadioGroup>
                                 )}
                                 {question.question_type === 'true_false' && (
                                   <RadioGroup
                                     value={currentAnswer || ''}
                                     onValueChange={(value) => {
                                       setQuizAnswers(prev => ({ ...prev, [question.id]: value }));
                                     }}
                                     disabled={isAnswered}
                                   >
                                     <div className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50">
                                       <RadioGroupItem value="true" id={`q-${question.id}-true`} />
                                       <Label htmlFor={`q-${question.id}-true`} className="cursor-pointer flex-1">True</Label>
                                     </div>
                                     <div className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50">
                                       <RadioGroupItem value="false" id={`q-${question.id}-false`} />
                                       <Label htmlFor={`q-${question.id}-false`} className="cursor-pointer flex-1">False</Label>
                                     </div>
                                   </RadioGroup>
                                 )}
                                 {!isAnswered && currentAnswer && (
                                   <Button 
                                     onClick={() => {
                                       submitQuizAnswer({
                                         questionId: question.id,
                                         userAnswer: currentAnswer,
                                         correctAnswer: question.correct_answer,
                                         lessonId: currentLesson.id,
                                         enrollmentId: enrollment!.id,
                                       });
                                     }}
                                     size="sm"
                                     className="w-full"
                                   >
                                     Submit Answer
                                   </Button>
                                 )}
                                 {isAnswered && (
                                   <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                                     <CheckCircle className="h-4 w-4" />
                                     Correct! Well done.
                                   </div>
                                 )}
                               </CardContent>
                             </Card>
                           );
                         })}
                       </div>
                     </div>
                   )}

                   {/* Lesson Navigation */}
                   <div className="flex justify-between items-center pt-6 border-t">
                     <Button 
                       variant="outline" 
                       onClick={goToPreviousLesson}
                       disabled={currentModuleIndex === 0 && currentLessonIndex === 0}
                     >
                       <ChevronLeft className="h-4 w-4 mr-2" />
                       Previous Lesson
                     </Button>

                     <div className="flex gap-2">
                       {!isLessonCompleted && (
                         <Button 
                           onClick={handleMarkComplete}
                           variant="default"
                           className="bg-green-600 hover:bg-green-700"
                         >
                           <CheckCircle className="h-4 w-4 mr-2" />
                           Complete & Continue
                         </Button>
                       )}
                       {isLessonCompleted && (
                         <Button 
                           onClick={goToNextLesson}
                           disabled={
                             currentModuleIndex === (course?.course_modules?.length || 0) - 1 &&
                             currentLessonIndex === (currentModule?.course_lessons.length || 0) - 1
                           }
                         >
                           Next Lesson
                           <ChevronRight className="h-4 w-4 ml-2" />
                         </Button>
                       )}
                     </div>
                    </div>
                 </div>
               </CardContent>
              </Card>
           </div>
         </div>
       </div>
      </div>
      </div>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-80 overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Course Progress</SheetTitle>
          </SheetHeader>
          <div className="py-6 space-y-6">
            {/* Course Progress Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Course Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Progress value={progressPercentage} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  {completedLessons} of {totalLessons} lessons completed
                </p>
                <p className="text-2xl font-bold">{Math.round(progressPercentage)}%</p>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/dashboard/training" onClick={() => setOpen(false)}>
                  <Award className="h-4 w-4 mr-2" />
                  My Certificates
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="mailto:support@myct1.com">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Support
                </a>
              </Button>
            </div>

            {/* All Training Courses */}
            <div>
              <h3 className="font-semibold mb-3">All Courses</h3>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3 pr-4">
                  {courses?.map((c) => {
                    const isCurrentCourse = c.id === courseId;
                    const courseEnrollment = enrollments?.find(e => e.course_id === c.id);
                    
                    return (
                      <Card 
                        key={c.id} 
                        className={`cursor-pointer transition-all hover:border-primary ${
                          isCurrentCourse ? 'border-primary shadow-md' : ''
                        }`}
                        onClick={() => {
                          if (!isCurrentCourse) {
                            navigate(`/dashboard/training/course/${c.id}`);
                            setOpen(false);
                          }
                        }}
                      >
                        <CardHeader className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-sm font-medium line-clamp-2">
                              {c.title}
                            </CardTitle>
                            {isCurrentCourse && (
                              <Badge variant="default" className="text-xs flex-shrink-0">Active</Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="p-3 pt-0 space-y-2">
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="secondary" className="text-xs">
                              {c.training_categories?.name}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {c.difficulty_level}
                            </Badge>
                          </div>
                          {courseEnrollment && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="font-medium">{Math.round(courseEnrollment.progress_percentage)}%</span>
                              </div>
                              <Progress value={courseEnrollment.progress_percentage} className="h-1.5" />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>
        </SheetContent>
      </Sheet>

     {/* Quiz Modal */}
     <Dialog open={showQuizModal} onOpenChange={setShowQuizModal}>
       <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
         <DialogHeader>
           <DialogTitle>Complete the Quiz</DialogTitle>
           <DialogDescription>
             Please answer all questions correctly before proceeding to the next lesson.
           </DialogDescription>
         </DialogHeader>
         <div className="space-y-6 py-4">
           {quizQuestions?.map((question, idx) => {
             const userAnswer = userQuizAnswers?.find(a => a.question_id === question.id);
             const currentAnswer = quizAnswers[question.id];
             const isAnswered = !!userAnswer;
             
             return (
               <Card key={question.id} className={isAnswered && userAnswer.is_correct ? 'border-green-500' : ''}>
                 <CardHeader>
                   <CardTitle className="text-base">
                     Question {idx + 1}: {question.question_text}
                   </CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-4">
                   {question.question_type === 'multiple_choice' && question.options && (
                     <RadioGroup
                       value={currentAnswer || ''}
                       onValueChange={(value) => {
                         setQuizAnswers(prev => ({ ...prev, [question.id]: value }));
                       }}
                       disabled={isAnswered && userAnswer?.is_correct}
                     >
                       {question.options.map((option, optIdx) => (
                         <div key={optIdx} className="flex items-center space-x-2">
                           <RadioGroupItem value={option} id={`modal-${question.id}-${optIdx}`} />
                           <Label htmlFor={`modal-${question.id}-${optIdx}`}>{option}</Label>
                         </div>
                       ))}
                     </RadioGroup>
                   )}
                   
                   {question.question_type === 'true_false' && (
                     <RadioGroup
                       value={currentAnswer || ''}
                       onValueChange={(value) => {
                         setQuizAnswers(prev => ({ ...prev, [question.id]: value }));
                       }}
                       disabled={isAnswered && userAnswer?.is_correct}
                     >
                       <div className="flex items-center space-x-2">
                         <RadioGroupItem value="True" id={`modal-${question.id}-true`} />
                         <Label htmlFor={`modal-${question.id}-true`}>True</Label>
                       </div>
                       <div className="flex items-center space-x-2">
                         <RadioGroupItem value="False" id={`modal-${question.id}-false`} />
                         <Label htmlFor={`modal-${question.id}-false`}>False</Label>
                       </div>
                     </RadioGroup>
                   )}

                   <div className="flex items-center justify-between">
                     {(!isAnswered || !userAnswer?.is_correct) && (
                       <Button
                         size="sm"
                         onClick={() => {
                           if (currentAnswer && enrollment && currentLesson) {
                             submitQuizAnswer({
                               enrollmentId: enrollment.id,
                               lessonId: currentLesson.id,
                               questionId: question.id,
                               userAnswer: currentAnswer,
                               correctAnswer: question.correct_answer,
                             });
                           }
                         }}
                         disabled={!currentAnswer}
                       >
                         Submit Answer
                       </Button>
                     )}
                     {isAnswered && (
                       <div className="flex items-center gap-2">
                         {userAnswer.is_correct ? (
                           <>
                             <CheckCircle className="h-4 w-4 text-green-500" />
                             <span className="text-sm text-green-600">Correct!</span>
                           </>
                         ) : (
                           <span className="text-sm text-red-600">Incorrect - Please try again</span>
                         )}
                       </div>
                     )}
                   </div>
                 </CardContent>
               </Card>
             );
           })}
         </div>
         <div className="flex justify-end gap-2">
           <Button variant="outline" onClick={() => setShowQuizModal(false)}>
             Cancel
           </Button>
           <Button
             onClick={() => {
               const allCorrect = quizQuestions?.every(q => 
                 userQuizAnswers?.some(a => a.question_id === q.id && a.is_correct)
               );
               
               if (allCorrect) {
                 setShowQuizModal(false);
                 if (currentLesson && enrollment) {
                   updateProgress({
                     lessonId: currentLesson.id,
                     enrollmentId: enrollment.id,
                     isCompleted: true,
                     timeSpentMinutes: currentLesson.duration_minutes || 0,
                   });
                 }
               } else {
                 toast.error('Please answer all questions correctly before proceeding');
               }
             }}
           >
             Complete Lesson
           </Button>
         </div>
       </DialogContent>
     </Dialog>
   </div>
   );
};