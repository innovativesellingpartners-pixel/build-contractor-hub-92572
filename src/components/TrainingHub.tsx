import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  BookOpen, 
  Clock, 
  Star, 
  Play, 
  CheckCircle,
  Award,
  ArrowLeft,
  MessageCircle,
  Trophy,
  Zap,
  Settings,
  DollarSign as DollarSignIcon,
  Mail
} from 'lucide-react';
import { useTrainingCourses, useUserEnrollments, useUserCertificates } from '@/hooks/useTrainingData';

export const TrainingHub = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const { data: courses, isLoading: coursesLoading } = useTrainingCourses();
  const { data: enrollments, isLoading: enrollmentsLoading } = useUserEnrollments();
  const { data: certificates } = useUserCertificates();

  // Calculate progress based on actual enrollments
  const completedCourses = enrollments?.filter(e => e.completed_at)?.length || 0;
  const totalCourses = courses?.length || 0;
  const progressPercentage = totalCourses > 0 ? (completedCourses / totalCourses) * 100 : 0;

  // Get icon for course category
  const getCategoryIcon = (categoryName: string | null) => {
    const name = categoryName?.toLowerCase() || '';
    if (name.includes('communication')) return MessageCircle;
    if (name.includes('leadership')) return Trophy;
    if (name.includes('performance')) return Zap;
    if (name.includes('process')) return Settings;
    if (name.includes('sales')) return DollarSignIcon;
    return BookOpen;
  };

  // Get color scheme for course
  const getColorScheme = (index: number) => {
    const schemes = [
      { bg: 'bg-blue-100', text: 'text-blue-600' },
      { bg: 'bg-purple-100', text: 'text-purple-600' },
      { bg: 'bg-green-100', text: 'text-green-600' },
      { bg: 'bg-orange-100', text: 'text-orange-600' },
      { bg: 'bg-red-100', text: 'text-red-600' },
    ];
    return schemes[index % schemes.length];
  };

  if (coursesLoading || enrollmentsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl md:text-4xl font-bold">Training Hub</h1>
          <p className="text-muted-foreground mt-2">Build your skills with professional construction training</p>
        </div>

        {/* Welcome Video Section */}
        <div className="mb-8 max-w-3xl mx-auto">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-primary/80 p-4 text-center">
              <h2 className="text-2xl font-bold text-primary-foreground">
                Welcome to CT1&apos;s 5-Star Training
              </h2>
            </div>
            <CardContent className="p-4">
              <div className="aspect-video w-full">
                <iframe
                  src="https://drive.google.com/file/d/1eMBOcQ776JFxqniVIZ7g78DQxn5GzwbY/preview"
                  className="w-full h-full rounded-lg"
                  allow="autoplay"
                  title="Welcome to CT1's 5-Star Training"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Training Courses */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
            <h2 className="text-2xl font-bold">Training Courses</h2>
            <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
          </div>
          
          {courses && courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {courses.map((course, index) => {
                const Icon = getCategoryIcon(course.training_categories?.name || null);
                const colorScheme = getColorScheme(index);
                const isEnrolled = enrollments?.some(e => e.course_id === course.id);
                const isCompleted = enrollments?.find(e => e.course_id === course.id)?.completed_at;
                
                return (
                  <Card 
                    key={course.id}
                    className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-2 hover:border-primary relative"
                    onClick={() => {
                      if (isEnrolled) {
                        navigate(`/dashboard/training/course/${course.id}`);
                      } else {
                        navigate(`/dashboard/training/course/${course.id}`);
                      }
                    }}
                  >
                    <CardContent className="p-6 text-center">
                      {isCompleted && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle className="h-6 w-6 text-green-600 fill-green-600" />
                        </div>
                      )}
                      <div className="mb-4 flex justify-center">
                        <div className={`h-16 w-16 rounded-full ${colorScheme.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <Icon className={`h-8 w-8 ${colorScheme.text}`} />
                        </div>
                      </div>
                      <h3 className="font-bold text-lg mb-2">{course.title}</h3>
                      {course.description && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{course.description}</p>
                      )}
                      {course.duration_minutes && (
                        <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-2">
                          <Clock className="h-4 w-4" />
                          <span>{course.duration_minutes} min</span>
                        </div>
                      )}
                      {course.difficulty_level && (
                        <Badge variant="secondary" className="mb-4">
                          {course.difficulty_level}
                        </Badge>
                      )}
                      <Button variant="default" size="sm" className="w-full">
                        {isEnrolled ? (
                          <>
                            {isCompleted ? (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Review Course
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4 mr-2" />
                                Continue
                              </>
                            )}
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Start Course
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Courses Available</h3>
                <p className="text-muted-foreground">
                  Training courses will appear here once they are published by administrators.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Progress Chart */}
        {totalCourses > 0 && (
          <div className="mt-12 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-center text-2xl">Your Training Progress</CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="flex flex-col items-center">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 w-full max-w-3xl">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary mb-1">{totalCourses}</div>
                      <p className="text-sm text-muted-foreground">Total Courses</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-1">{enrollments?.length || 0}</div>
                      <p className="text-sm text-muted-foreground">Enrolled</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-1">{completedCourses}</div>
                      <p className="text-sm text-muted-foreground">Completed</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-600 mb-1">{certificates?.length || 0}</div>
                      <p className="text-sm text-muted-foreground">Certificates</p>
                    </div>
                  </div>
                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold text-primary mb-2">
                      {Math.round(progressPercentage)}%
                    </div>
                    <p className="text-muted-foreground">
                      Complete all courses to earn your certificates
                    </p>
                  </div>
                  <div className="w-full max-w-2xl">
                    <Progress value={progressPercentage} className="h-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Contact Support */}
        <div className="flex justify-center mb-8">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Need Help?</h3>
              <p className="text-muted-foreground mb-4">
                Our support team is here to assist you with any questions about your training.
              </p>
              <Button 
                size="lg"
                className="w-full"
                onClick={() => window.location.href = 'mailto:sales@myct1.com'}
              >
                <Mail className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};