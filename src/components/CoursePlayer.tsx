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
  BookOpen
} from 'lucide-react';
import { useTrainingCourses, useUserEnrollments, useEnrollInCourse, useUpdateLessonProgress, useLessonProgress } from '@/hooks/useTrainingData';

// Helper functions for YouTube URL handling
const isYouTubeUrl = (url: string): boolean => {
  if (!url) return false;
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
  return youtubeRegex.test(url);
};

const getYouTubeEmbedUrl = (url: string): string => {
  if (!isYouTubeUrl(url)) return url;
  
  // Extract video ID from various YouTube URL formats
  const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
  const videoId = videoIdMatch ? videoIdMatch[1] : null;
  
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}`;
  }
  
  return url;
};

export const CoursePlayer = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { data: courses } = useTrainingCourses();
  const { data: enrollments } = useUserEnrollments();
  const { mutate: enrollInCourse } = useEnrollInCourse();
  const { mutate: updateProgress } = useUpdateLessonProgress();

  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const course = courses?.find(c => c.id === courseId);
  const enrollment = enrollments?.find(e => e.course_id === courseId);
  const { data: lessonProgress } = useLessonProgress(enrollment?.id || '');
  
  const currentModule = course?.course_modules?.[currentModuleIndex];
  const currentLesson = currentModule?.course_lessons?.[currentLessonIndex];

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

  const handleEnroll = () => {
    if (courseId) {
      enrollInCourse(courseId);
    }
  };

  const handleMarkComplete = () => {
    if (currentLesson && enrollment) {
      updateProgress({
        lessonId: currentLesson.id,
        enrollmentId: enrollment.id,
        isCompleted: true,
        timeSpentMinutes: currentLesson.duration_minutes || 0,
      });
    }
  };

  const goToNextLesson = () => {
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
        <div className="container mx-auto px-4 py-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard/training')}
            className="mb-6"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Training Hub
          </Button>

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
                      <Badge variant="outline">
                        <Clock className="h-3 w-3 mr-1" />
                        {course.duration_minutes} min
                      </Badge>
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
                                  {lesson.duration_minutes && (
                                    <Badge variant="outline" className="text-xs">
                                      {lesson.duration_minutes}min
                                    </Badge>
                                  )}
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
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/dashboard/training')}
          className="mb-6"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Training Hub
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Course Content Area */}
          <div className="lg:col-span-3">
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
                    <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                      {isYouTubeUrl(currentLesson.video_url) ? (
                        <iframe 
                          src={getYouTubeEmbedUrl(currentLesson.video_url)}
                          className="w-full h-full rounded-lg"
                          title={currentLesson.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <video 
                          controls 
                          className="w-full h-full rounded-lg"
                          src={currentLesson.video_url}
                          poster="/placeholder.svg"
                        >
                          Your browser does not support the video tag.
                        </video>
                      )}
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
                        <Button variant="outline" size="sm" asChild>
                          <a href={currentLesson.pdf_url} download>
                            <Download className="h-4 w-4 mr-2" />
                            Download PDF
                          </a>
                        </Button>
                      </div>
                      <div className="aspect-[3/4] bg-muted rounded-lg flex items-center justify-center">
                        <iframe 
                          src={currentLesson.pdf_url} 
                          className="w-full h-full rounded-lg"
                          title={currentLesson.title}
                        />
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
                      Previous
                    </Button>

                    {!isLessonCompleted && (
                      <Button onClick={handleMarkComplete}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark Complete
                      </Button>
                    )}

                    <Button 
                      onClick={goToNextLesson}
                      disabled={
                        currentModuleIndex === (course?.course_modules?.length || 0) - 1 &&
                        currentLessonIndex === (currentModule?.course_lessons.length || 0) - 1
                      }
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Course Progress</CardTitle>
                <div className="space-y-2">
                  <Progress value={progressPercentage} />
                  <p className="text-sm text-muted-foreground">
                    {completedLessons} of {totalLessons} lessons completed
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {course.course_modules?.map((module, moduleIdx) => (
                      <div key={module.id}>
                        <h4 className="font-semibold text-sm mb-2">{module.title}</h4>
                        <div className="space-y-1 ml-2">
                          {module.course_lessons.map((lesson, lessonIdx) => {
                            const isCompleted = lessonProgress?.some(
                              p => p.lesson_id === lesson.id && p.is_completed
                            );
                            const isCurrent = moduleIdx === currentModuleIndex && lessonIdx === currentLessonIndex;
                            
                            return (
                              <button
                                key={lesson.id}
                                onClick={() => {
                                  setCurrentModuleIndex(moduleIdx);
                                  setCurrentLessonIndex(lessonIdx);
                                }}
                                className={`w-full text-left p-2 rounded text-sm transition-colors ${
                                  isCurrent 
                                    ? 'bg-primary text-primary-foreground' 
                                    : 'hover:bg-muted'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {isCompleted ? (
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                  ) : (
                                    <div className="h-3 w-3 rounded-full border-2 border-muted-foreground" />
                                  )}
                                  <span className="flex-1 truncate">{lesson.title}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        {moduleIdx < (course.course_modules?.length || 0) - 1 && (
                          <Separator className="mt-3" />
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};