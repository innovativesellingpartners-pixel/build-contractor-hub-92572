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

  // Track completed modules (for demo purposes, this would be stored in database)
  const completedModules = 0; // This will be dynamic based on user progress
  const totalModules = 5;
  const starRating = completedModules; // 0-5 stars based on completed modules

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
                  src="https://drive.google.com/file/d/1eMBOcQ776JFxqniVIZ7g78DQxn5GzwbY/preview"
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
            <Card 
              className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-2 hover:border-primary"
              onClick={() => navigate('/dashboard/training/module/communication')}
            >
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
                <Button variant="default" size="sm" className="w-full">
                  <Play className="h-4 w-4 mr-2" />
                  Watch Now
                </Button>
              </CardContent>
            </Card>

            {/* Module 2: Leadership */}
            <Card 
              className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-2 hover:border-primary"
              onClick={() => navigate('/dashboard/training/module/leadership')}
            >
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
                <Button variant="default" size="sm" className="w-full">
                  <Play className="h-4 w-4 mr-2" />
                  Watch Now
                </Button>
              </CardContent>
            </Card>

            {/* Module 3: Performance */}
            <Card 
              className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-2 hover:border-primary"
              onClick={() => navigate('/dashboard/training/module/performance')}
            >
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
                <Button variant="default" size="sm" className="w-full">
                  <Play className="h-4 w-4 mr-2" />
                  Watch Now
                </Button>
              </CardContent>
            </Card>

            {/* Module 4: Process - Systems That Scale */}
            <Card 
              className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-2 hover:border-primary"
              onClick={() => navigate('/dashboard/training/module/process')}
            >
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
                <Button variant="default" size="sm" className="w-full">
                  <Play className="h-4 w-4 mr-2" />
                  Watch Now
                </Button>
              </CardContent>
            </Card>

            {/* Module 5: Super Effective Sales Methodology */}
            <Card 
              className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-2 hover:border-primary"
              onClick={() => navigate('/dashboard/training/module/sales')}
            >
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
                <Button variant="default" size="sm" className="w-full">
                  <Play className="h-4 w-4 mr-2" />
                  Watch Now
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Progress Chart */}
        <div className="mt-12 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-2xl">Your 5-Star Progress</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center gap-2 mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      className={`h-12 w-12 ${
                        star <= starRating 
                          ? 'text-yellow-500 fill-yellow-500' 
                          : 'text-gray-300 fill-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {starRating} / {totalModules} Stars
                  </div>
                  <p className="text-muted-foreground">
                    Complete all 5 training modules to achieve your 5-star rating
                  </p>
                </div>
                <div className="w-full max-w-2xl">
                  <Progress value={(starRating / totalModules) * 100} className="h-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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