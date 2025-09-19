import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Play, 
  Clock, 
  Users, 
  Award, 
  BookOpen, 
  CheckCircle,
  Star,
  ArrowLeft,
  Download
} from "lucide-react";
import { Link } from "react-router-dom";

interface Course {
  id: string;
  title: string;
  description: string;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  enrolled: number;
  rating: number;
  progress?: number;
  completed?: boolean;
  lessons: number;
  category: string;
}

export function TrainingHub() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const courses: Course[] = [
    {
      id: '1',
      title: 'Construction Business Fundamentals',
      description: 'Master the essential skills needed to run a profitable construction business.',
      duration: '4 hours',
      level: 'Beginner',
      enrolled: 1247,
      rating: 4.8,
      progress: 75,
      lessons: 12,
      category: 'business'
    },
    {
      id: '2',
      title: 'Project Management for Contractors',
      description: 'Learn advanced project management techniques to deliver projects on time and budget.',
      duration: '6 hours',
      level: 'Intermediate',
      enrolled: 892,
      rating: 4.9,
      progress: 30,
      lessons: 18,
      category: 'management'
    },
    {
      id: '3',
      title: 'Financial Planning & Budgeting',
      description: 'Take control of your finances with proper budgeting, cash flow, and profit strategies.',
      duration: '5 hours',
      level: 'Intermediate',
      enrolled: 734,
      rating: 4.7,
      lessons: 15,
      category: 'finance'
    },
    {
      id: '4',
      title: 'Digital Marketing for Contractors',
      description: 'Generate more leads with proven digital marketing strategies and tools.',
      duration: '3 hours',
      level: 'Beginner',
      enrolled: 956,
      rating: 4.6,
      lessons: 10,
      category: 'marketing'
    },
    {
      id: '5',
      title: 'Building High-Performance Teams',
      description: 'Recruit, train, and retain top talent to scale your construction business.',
      duration: '4.5 hours',
      level: 'Advanced',
      enrolled: 623,
      rating: 4.8,
      completed: true,
      lessons: 14,
      category: 'leadership'
    },
    {
      id: '6',
      title: 'Legal Compliance & Risk Management',
      description: 'Protect your business with proper legal structure, contracts, and insurance.',
      duration: '3.5 hours',
      level: 'Intermediate',
      enrolled: 512,
      rating: 4.5,
      lessons: 11,
      category: 'legal'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Courses', count: courses.length },
    { id: 'business', name: 'Business Basics', count: courses.filter(c => c.category === 'business').length },
    { id: 'management', name: 'Project Management', count: courses.filter(c => c.category === 'management').length },
    { id: 'finance', name: 'Financial Planning', count: courses.filter(c => c.category === 'finance').length },
    { id: 'marketing', name: 'Marketing & Sales', count: courses.filter(c => c.category === 'marketing').length },
    { id: 'leadership', name: 'Leadership', count: courses.filter(c => c.category === 'leadership').length },
    { id: 'legal', name: 'Legal & Compliance', count: courses.filter(c => c.category === 'legal').length }
  ];

  const filteredCourses = selectedCategory === 'all' 
    ? courses 
    : courses.filter(course => course.category === selectedCategory);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'bg-green-500';
      case 'Intermediate': return 'bg-yellow-500';
      case 'Advanced': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button variant="ghost" asChild className="mb-4">
              <Link to="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Training Hub</h1>
            <p className="text-muted-foreground mt-2">Master the business side of construction with expert-led training</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">67%</div>
            <p className="text-sm text-muted-foreground">Overall Progress</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="card-industrial">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-primary" />
                <div>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-muted-foreground">Courses Available</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-industrial">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">3</div>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-industrial">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-primary" />
                <div>
                  <div className="text-2xl font-bold">24h</div>
                  <p className="text-xs text-muted-foreground">Learning Time</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-industrial">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Award className="h-8 w-8 text-yellow-500" />
                <div>
                  <div className="text-2xl font-bold">5</div>
                  <p className="text-xs text-muted-foreground">Certificates</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Category Sidebar */}
          <div className="lg:col-span-1">
            <Card className="card-industrial">
              <CardHeader>
                <CardTitle className="text-lg">Course Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                      selectedCategory === category.id 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-muted'
                    }`}
                  >
                    <span className="text-sm font-medium">{category.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {category.count}
                    </Badge>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Featured Course */}
            <Card className="card-industrial mt-6 border-primary">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500 fill-current" />
                  <CardTitle className="text-lg">Featured</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <h4 className="font-semibold mb-2">Scaling Your Construction Business</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Advanced strategies for growing from solo contractor to successful business owner.
                </p>
                <Button variant="contractor" size="sm" className="w-full">
                  Start Learning
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Course Grid */}
          <div className="lg:col-span-3">
            <div className="grid gap-6">
              {filteredCourses.map((course) => (
                <Card key={course.id} className="card-industrial">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-semibold">{course.title}</h3>
                          {course.completed && (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          )}
                        </div>
                        <p className="text-muted-foreground mb-3">{course.description}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{course.duration}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4" />
                            <span>{course.lessons} lessons</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{course.enrolled.toLocaleString()} enrolled</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span>{course.rating}</span>
                          </div>
                        </div>

                        {course.progress !== undefined && (
                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">Progress</span>
                              <span className="text-sm text-muted-foreground">{course.progress}%</span>
                            </div>
                            <Progress value={course.progress} className="h-2" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 ml-6">
                        <Badge className={`${getLevelColor(course.level)} text-white text-xs`}>
                          {course.level}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <Button variant="contractor">
                          {course.progress ? 'Continue' : 'Start Course'}
                          <Play className="h-4 w-4 ml-2" />
                        </Button>
                        {course.completed && (
                          <Button variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            Certificate
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}