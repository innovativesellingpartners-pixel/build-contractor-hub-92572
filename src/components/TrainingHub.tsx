import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  Clock, 
  Star, 
  Play, 
  CheckCircle,
  Award,
  MessageCircle,
  Trophy,
  Zap,
  Settings,
  DollarSign as DollarSignIcon,
  Mail,
  GraduationCap,
  TrendingUp,
  ArrowLeft,
  Download
} from 'lucide-react';
import { useTrainingCourses, useUserEnrollments, useUserCertificates } from '@/hooks/useTrainingData';
import { useAuth } from '@/contexts/AuthContext';
import { downloadCertificatePDF } from '@/lib/certificates';
import communicationImg from '@/assets/training-communication.jpg';
import leadershipImg from '@/assets/training-leadership.jpg';
import performanceImg from '@/assets/training-performance.jpg';
import processImg from '@/assets/training-process.jpg';
import sellingImg from '@/assets/training-selling.jpg';
import videoThumbnail from '@/assets/training-video-thumbnail.png';
import ct1Logo from '@/assets/ct1-round-logo-new.png';

type TrainingSection = 'courses' | 'progress' | 'certificates' | 'support';

export const TrainingHub = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [activeSection, setActiveSection] = useState<TrainingSection>('courses');
  
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

  // Get thumbnail image for course
  const getThumbnailImage = (title: string) => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('communication')) return communicationImg;
    if (titleLower.includes('leadership')) return leadershipImg;
    if (titleLower.includes('performance')) return performanceImg;
    if (titleLower.includes('process')) return processImg;
    if (titleLower.includes('selling') || titleLower.includes('sales')) return sellingImg;
    return null;
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

  const renderCourses = () => (
    <>
      {/* Getting Started Section */}
      <div className="mb-6 md:mb-8">
        <div className="mb-4 md:mb-6">
          <h2 className="text-xl md:text-2xl font-bold">Getting Started</h2>
          <p className="text-sm md:text-base text-muted-foreground mt-1">New to contracting? Start here. Learn how to set up your LLC, get licensed, and launch your business.</p>
        </div>
        <Card 
          className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-2 hover:border-primary overflow-hidden"
          onClick={() => navigate('/contractor-hub/training/getting-started/starting-a-new-llc')}
        >
          <div className="bg-gradient-to-r from-primary to-primary/80 p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-white/80" />
              <span className="text-[11px] font-bold tracking-widest uppercase text-white/70">Training Module</span>
            </div>
            <h3 className="font-bold text-lg text-primary-foreground">Starting a New LLC</h3>
            <p className="text-xs text-primary-foreground/80">A State-by-State Training Course for Trades, Construction, and Home Improvement Professionals</p>
          </div>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-3">Your step-by-step guide to forming an LLC, getting licensed, and launching your contracting business. Covers all 50 states + D.C.</p>
            <Button variant="default" size="sm">
              <Play className="h-3 w-3 mr-2" />
              Start Module
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Welcome Section with Video and Stats */}
      <div className="mb-6 md:mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Welcome Video - Takes up 2 columns */}
          <Card className="lg:col-span-2 overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-primary/80 p-3 md:p-4">
              <h2 className="text-base md:text-xl font-bold text-primary-foreground flex items-center gap-2">
                <Star className="h-4 w-4 md:h-5 md:w-5 fill-yellow-500 text-yellow-500" />
                <span className="text-sm md:text-xl">Welcome to CT1&apos;s 5-Star Training</span>
                <Star className="h-4 w-4 md:h-5 md:w-5 fill-yellow-500 text-yellow-500" />
              </h2>
              <p className="text-primary-foreground/90 text-xs md:text-sm mt-1">
                Start your journey to becoming a top-performing contractor
              </p>
            </div>
            <CardContent className="p-3 md:p-4">
              <div className="aspect-video w-full relative rounded-lg overflow-hidden shadow-lg bg-muted">
                <iframe
                  src="https://drive.google.com/file/d/1eMBOcQ776JFxqniVIZ7g78DQxn5GzwbY/preview"
                  className="w-full h-full rounded-lg"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  title="Welcome to CT1's 5-Star Training"
                />
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats Card */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-br from-primary/10 to-primary/5 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Your Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-1">
                  {Math.round(progressPercentage)}%
                </div>
                <p className="text-sm text-muted-foreground">Overall Progress</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Total Courses</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">{totalCourses}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                  <div className="flex items-center gap-2">
                    <Play className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">Enrolled</span>
                  </div>
                  <span className="text-lg font-bold text-purple-600">{enrollments?.length || 0}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Completed</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">{completedCourses}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium">Certificates</span>
                  </div>
                  <span className="text-lg font-bold text-yellow-600">{certificates?.length || 0}</span>
                </div>
              </div>

              <div className="pt-4">
                <Progress value={progressPercentage} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Training Courses */}
      <div className="mb-6 md:mb-8">
        <div className="mb-4 md:mb-6">
          <h2 className="text-xl md:text-2xl font-bold">Course Overview</h2>
          <p className="text-sm md:text-base text-muted-foreground mt-1">Explore our comprehensive training curriculum</p>
        </div>
        
        {courses && courses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {courses.map((course, index) => {
              const Icon = getCategoryIcon(course.training_categories?.name || null);
              const colorScheme = getColorScheme(index);
              const thumbnailImg = getThumbnailImage(course.title);
              const isEnrolled = enrollments?.some(e => e.course_id === course.id);
              const isCompleted = enrollments?.find(e => e.course_id === course.id)?.completed_at;
              
              return (
                <Card 
                  key={course.id}
                  className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-2 hover:border-primary relative overflow-hidden"
                  onClick={() => navigate(`/dashboard/training/course/${course.id}`)}
                >
                  {isCompleted && (
                    <div className="absolute top-2 right-2 z-10">
                      <CheckCircle className="h-6 w-6 text-green-600 fill-green-600" />
                    </div>
                  )}
                  {thumbnailImg && (
                    <div className="w-full h-40 overflow-hidden">
                      <img 
                        src={thumbnailImg} 
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <CardContent className="p-4 text-center">
                    {!thumbnailImg && (
                      <div className="mb-4 flex justify-center">
                        <div className={`h-16 w-16 rounded-full ${colorScheme.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <Icon className={`h-8 w-8 ${colorScheme.text}`} />
                        </div>
                      </div>
                    )}
                    <h3 className="font-bold text-base mb-2">{course.title}</h3>
                    {course.description && (
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{course.description}</p>
                    )}
                    {course.difficulty_level && (
                      <Badge variant="secondary" className="mb-3 text-xs">
                        {course.difficulty_level}
                      </Badge>
                    )}
                    <Button variant="default" size="sm" className="w-full">
                      {isEnrolled ? (
                        <>
                          {isCompleted ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-2" />
                              Review
                            </>
                          ) : (
                            <>
                              <Play className="h-3 w-3 mr-2" />
                              Continue
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          <Play className="h-3 w-3 mr-2" />
                          Start Now
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
    </>
  );

  const renderProgress = () => (
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
  );

  const renderCertificates = () => (
    <div>
      <h2 className="text-2xl font-bold mb-6">Your Certificates</h2>
      {certificates && certificates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert) => (
            <Card key={cert.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <Award className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                <h3 className="font-bold text-lg mb-2">{cert.training_courses?.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Issued: {new Date(cert.issued_at).toLocaleDateString()}
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => downloadCertificatePDF(
                    cert.id,
                    profile?.contact_name || profile?.company_name || 'Student',
                    cert.training_courses?.title || 'Course',
                    cert.issued_at
                  )}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Award className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Certificates Yet</h3>
            <p className="text-muted-foreground">
              Complete courses to earn your certificates
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderSupport = () => (
    <Card className="max-w-md mx-auto">
      <CardContent className="p-8 text-center">
        <Mail className="h-16 w-16 text-primary mx-auto mb-4" />
        <h3 className="text-2xl font-semibold mb-2">Need Help?</h3>
        <p className="text-muted-foreground mb-6">
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
  );

  return (
    <div className="flex flex-col min-h-screen">
      {/* CT1 Branding Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 p-3 md:p-4 shadow-md">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-3 md:mb-0">
            <div className="flex items-center gap-2 md:gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="text-primary-foreground hover:bg-primary-foreground/10 text-xs md:text-sm"
              >
                <ArrowLeft className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
                <span className="hidden sm:inline">Back to CT1 Hub</span>
              </Button>
              <div className="flex items-center gap-2 md:gap-3">
                <img src={ct1Logo} alt="CT1 Logo" className="h-8 w-8 md:h-12 md:w-12" />
                <div>
                  <h1 className="text-base md:text-2xl font-bold text-primary-foreground">CT1 Training Hub</h1>
                  <p className="text-xs md:text-sm text-primary-foreground/90 hidden sm:block">One-Up Your Business</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 md:gap-2">
              <Star className="h-4 w-4 md:h-5 md:w-5 fill-yellow-400 text-yellow-400" />
              <span className="text-primary-foreground font-semibold text-xs md:text-base hidden sm:inline">5-Star Training</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 md:gap-6 flex-1 container mx-auto py-4 md:py-6 px-4">
        {/* Mobile Section Tabs */}
        <div className="lg:hidden flex overflow-x-auto gap-2 pb-2 border-b">
          <Button
            size="sm"
            variant={activeSection === 'courses' ? 'default' : 'outline'}
            onClick={() => setActiveSection('courses')}
            className="flex-shrink-0"
          >
            <BookOpen className="h-4 w-4 mr-1" />
            Courses
          </Button>
          <Button
            size="sm"
            variant={activeSection === 'progress' ? 'default' : 'outline'}
            onClick={() => setActiveSection('progress')}
            className="flex-shrink-0"
          >
            <TrendingUp className="h-4 w-4 mr-1" />
            Progress
          </Button>
          <Button
            size="sm"
            variant={activeSection === 'certificates' ? 'default' : 'outline'}
            onClick={() => setActiveSection('certificates')}
            className="flex-shrink-0"
          >
            <Award className="h-4 w-4 mr-1" />
            Certificates
          </Button>
          <Button
            size="sm"
            variant={activeSection === 'support' ? 'default' : 'outline'}
            onClick={() => setActiveSection('support')}
            className="flex-shrink-0"
          >
            <Mail className="h-4 w-4 mr-1" />
            Support
          </Button>
        </div>

        {/* Left Sidebar Navigation - Desktop Only */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <div className="space-y-2">
          <button
            onClick={() => setActiveSection('courses')}
            className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
              activeSection === 'courses'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                activeSection === 'courses' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">All Courses</h3>
                <p className="text-xs text-muted-foreground">Browse training</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveSection('progress')}
            className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
              activeSection === 'progress'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                activeSection === 'progress' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">My Progress</h3>
                <p className="text-xs text-muted-foreground">Track learning</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveSection('certificates')}
            className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
              activeSection === 'certificates'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                activeSection === 'certificates' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Certificates</h3>
                <p className="text-xs text-muted-foreground">View achievements</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveSection('support')}
            className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
              activeSection === 'support'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                activeSection === 'support' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Support</h3>
                <p className="text-xs text-muted-foreground">Get help</p>
              </div>
            </div>
          </button>

          {/* Divider */}
          {courses && courses.length > 0 && (
            <>
              <div className="pt-4 pb-2">
                <h4 className="text-sm font-semibold text-muted-foreground px-2">Available Courses</h4>
              </div>
              
              {/* Course Buttons */}
              {courses.map((course) => {
                const isEnrolled = enrollments?.some(e => e.course_id === course.id);
                const isCompleted = enrollments?.find(e => e.course_id === course.id)?.completed_at;
                
                return (
                  <button
                    key={course.id}
                    onClick={() => navigate(`/dashboard/training/course/${course.id}`)}
                    className="w-full p-3 rounded-lg border-2 border-border hover:border-primary/50 transition-all text-left"
                  >
                    <div className="flex items-start gap-2">
                      <div className={`h-8 w-8 rounded flex items-center justify-center flex-shrink-0 ${
                        isCompleted ? 'bg-green-100 dark:bg-green-950' : 'bg-muted'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-2">{course.title}</h4>
                      </div>
                    </div>
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* Main Content Panel */}
      <div className="flex-1 overflow-auto min-w-0">
        {activeSection === 'courses' && renderCourses()}
        {activeSection === 'progress' && renderProgress()}
        {activeSection === 'certificates' && renderCertificates()}
        {activeSection === 'support' && renderSupport()}
      </div>
      </div>
    </div>
  );
};
