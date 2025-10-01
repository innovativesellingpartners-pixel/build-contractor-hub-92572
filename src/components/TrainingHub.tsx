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
  Users, 
  Star, 
  Play, 
  Download, 
  CheckCircle,
  Award,
  Target,
  TrendingUp,
  FileText,
  ArrowLeft,
  MessageCircle,
  Trophy,
  Zap,
  Settings,
  DollarSign as DollarSignIcon
} from 'lucide-react';
import { useTrainingCourses, useUserEnrollments, useUserCertificates } from '@/hooks/useTrainingData';

export const TrainingHub = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const { data: courses, isLoading: coursesLoading } = useTrainingCourses();
  const { data: enrollments, isLoading: enrollmentsLoading } = useUserEnrollments();
  const { data: certificates } = useUserCertificates();

  // Extract categories from courses
  const categories = ['All', ...(courses?.reduce((cats, course) => {
    const categoryName = course.training_categories?.name;
    if (categoryName && !cats.includes(categoryName)) {
      cats.push(categoryName);
    }
    return cats;
  }, [] as string[]) || [])];

  const filteredCourses = selectedCategory === 'All' 
    ? courses || []
    : courses?.filter(course => course.training_categories?.name === selectedCategory) || [];

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEnrollmentForCourse = (courseId: string) => {
    return enrollments?.find(e => e.course_id === courseId);
  };

  const totalLessons = courses?.reduce((total, course) => 
    total + course.course_modules.reduce((moduleTotal, module) => 
      moduleTotal + module.course_lessons.length, 0), 0) || 0;
  
  const completedCourses = enrollments?.filter(e => e.completed_at).length || 0;
  const totalLearningTime = enrollments?.reduce((total, e) => total + e.time_spent_minutes, 0) || 0;
  const certificatesEarned = certificates?.length || 0;

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
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl md:text-4xl font-bold">Training Hub</h1>
            <p className="text-muted-foreground mt-2">Build your skills with professional construction training</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              {Math.round((completedCourses / Math.max(courses?.length || 1, 1)) * 100)}%
            </div>
            <p className="text-sm text-muted-foreground">Overall Progress</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="flex items-center p-6">
              <BookOpen className="h-8 w-8 text-primary mr-4" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Courses Available</p>
                <p className="text-2xl font-bold">{courses?.length || 0}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <CheckCircle className="h-8 w-8 text-green-500 mr-4" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{completedCourses}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <Clock className="h-8 w-8 text-blue-500 mr-4" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Learning Time</p>
                <p className="text-2xl font-bold">{Math.round(totalLearningTime / 60)}h</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <Award className="h-8 w-8 text-yellow-500 mr-4" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Certificates</p>
                <p className="text-2xl font-bold">{certificatesEarned}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Welcome Video Section */}
        <div className="mb-8">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-center">
              <h2 className="text-3xl font-bold text-primary-foreground">
                Welcome to CT1&apos;s 5-Star Training
              </h2>
            </div>
            <CardContent className="p-0">
              <div className="aspect-video w-full">
                <iframe
                  src="https://drive.google.com/file/d/1YIwwe3zaeu9Mcj4ftMuw3Kwu6PGdov2M/preview?t=781s"
                  className="w-full h-full"
                  allow="autoplay"
                  title="Welcome to CT1's 5-Star Training"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 5-Star Training Modules */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
            <h2 className="text-2xl font-bold">5-Star Training Modules</h2>
            <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Module 1: Communication */}
            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-2 hover:border-primary">
              <CardContent className="p-6 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <MessageCircle className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <h3 className="font-bold text-lg mb-2">Communication</h3>
                <p className="text-sm text-muted-foreground mb-4">Master effective communication strategies for your team and clients</p>
                <div className="flex items-center justify-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <Badge variant="outline" className="w-full justify-center">Coming Soon</Badge>
              </CardContent>
            </Card>

            {/* Module 2: Leadership */}
            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-2 hover:border-primary">
              <CardContent className="p-6 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Trophy className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
                <h3 className="font-bold text-lg mb-2">Leadership</h3>
                <p className="text-sm text-muted-foreground mb-4">Develop leadership skills to inspire and guide your team to success</p>
                <div className="flex items-center justify-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <Badge variant="outline" className="w-full justify-center">Coming Soon</Badge>
              </CardContent>
            </Card>

            {/* Module 3: Performance */}
            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-2 hover:border-primary">
              <CardContent className="p-6 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Zap className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <h3 className="font-bold text-lg mb-2">Performance</h3>
                <p className="text-sm text-muted-foreground mb-4">Optimize performance metrics and achieve operational excellence</p>
                <div className="flex items-center justify-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <Badge variant="outline" className="w-full justify-center">Coming Soon</Badge>
              </CardContent>
            </Card>

            {/* Module 4: Process - Systems That Scale */}
            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-2 hover:border-primary">
              <CardContent className="p-6 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Settings className="h-8 w-8 text-orange-600" />
                  </div>
                </div>
                <h3 className="font-bold text-lg mb-2">Process</h3>
                <p className="text-sm text-muted-foreground mb-4">Build systems that scale your business efficiently and consistently</p>
                <div className="flex items-center justify-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <Badge variant="outline" className="w-full justify-center">Coming Soon</Badge>
              </CardContent>
            </Card>

            {/* Module 5: Super Effective Sales Methodology */}
            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-2 hover:border-primary">
              <CardContent className="p-6 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <DollarSignIcon className="h-8 w-8 text-red-600" />
                  </div>
                </div>
                <h3 className="font-bold text-lg mb-2">Sales</h3>
                <p className="text-sm text-muted-foreground mb-4">Learn proven sales methodologies to close more deals effectively</p>
                <div className="flex items-center justify-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <Badge variant="outline" className="w-full justify-center">Coming Soon</Badge>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Course Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left ${
                      selectedCategory === category 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-muted'
                    }`}
                  >
                    <span className="font-medium">{category}</span>
                    <Badge variant="secondary">
                      {category === 'All' 
                        ? courses?.length || 0
                        : courses?.filter(c => c.training_categories?.name === category).length || 0
                      }
                    </Badge>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Featured Course */}
            {courses && courses.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">Featured Course</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{courses[0].title}</h4>
                      <p className="text-sm text-muted-foreground">{courses[0].description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary">{courses[0].difficulty_level}</Badge>
                        <span className="text-sm text-muted-foreground">{courses[0].duration_minutes} min</span>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => navigate(`/dashboard/training/course/${courses[0].id}`)}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Course Cards */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {filteredCourses.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No courses available</h3>
                    <p className="text-muted-foreground">
                      {selectedCategory === 'All' 
                        ? 'No courses have been published yet.' 
                        : `No courses found in the ${selectedCategory} category.`
                      }
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredCourses.map((course) => {
                  const enrollment = getEnrollmentForCourse(course.id);
                  const totalLessonsInCourse = course.course_modules.reduce((total, module) => 
                    total + module.course_lessons.length, 0);
                  
                  return (
                    <Card key={course.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
                            <p className="text-muted-foreground mb-3">{course.description}</p>
                            
                            <div className="flex items-center gap-4 mb-4">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{course.duration_minutes} min</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{totalLessonsInCourse} lessons</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{course.course_modules.length} modules</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Badge className={getLevelColor(course.difficulty_level || 'Beginner')}>
                                {course.difficulty_level || 'Beginner'}
                              </Badge>
                              <Badge variant="outline">{course.training_categories?.name}</Badge>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-3 ml-6">
                            {enrollment ? (
                              <div className="text-right">
                                <div className="flex items-center gap-2 mb-2">
                                  <Progress value={enrollment.progress_percentage} className="w-24" />
                                  <span className="text-sm font-medium">{enrollment.progress_percentage}%</span>
                                </div>
                                {enrollment.completed_at ? (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => {
                                      // Handle certificate download
                                      console.log('Download certificate for course:', course.id);
                                    }}
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Certificate
                                  </Button>
                                ) : (
                                  <Button 
                                    size="sm"
                                    onClick={() => navigate(`/dashboard/training/course/${course.id}`)}
                                  >
                                    <Play className="h-4 w-4 mr-2" />
                                    Continue
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <Button 
                                size="sm"
                                onClick={() => navigate(`/dashboard/training/course/${course.id}`)}
                              >
                                <Play className="h-4 w-4 mr-2" />
                                Start Course
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};