import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  CheckCircle, 
  Lock,
  Play,
  MessageCircle,
  Trophy,
  Zap,
  Settings,
  DollarSign as DollarSignIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ct1Logo from '@/assets/ct1-logo-main.png';

interface Video {
  id: string;
  title: string;
  url: string;
  duration: number; // in seconds
}

interface Module {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  videos: Video[];
}

const modules: Record<string, Module> = {
  communication: {
    id: 'communication',
    title: 'Communication',
    description: 'Master effective communication strategies for your team and clients',
    icon: <MessageCircle className="h-6 w-6" />,
    color: 'blue',
    videos: [
      {
        id: '1',
        title: 'Introduction to Communication',
        url: 'https://drive.google.com/file/d/19FEPOjjvZIxW4yoECNyTGo8DvdMNo33n/preview',
        duration: 600 // 10 minutes - adjust as needed
      }
    ]
  },
  leadership: {
    id: 'leadership',
    title: 'Leadership',
    description: 'Develop leadership skills to inspire and guide your team to success',
    icon: <Trophy className="h-6 w-6" />,
    color: 'purple',
    videos: [
      {
        id: '1',
        title: 'Introduction to Leadership',
        url: 'https://drive.google.com/file/d/1A8BvqRgsL7nZZAxcH7Sfy_zxZB3OKj-h/preview',
        duration: 600
      }
    ]
  },
  performance: {
    id: 'performance',
    title: 'Performance',
    description: 'Optimize performance metrics and achieve operational excellence',
    icon: <Zap className="h-6 w-6" />,
    color: 'green',
    videos: [
      {
        id: '1',
        title: 'Introduction to Performance',
        url: 'https://drive.google.com/file/d/10GxFb62dfLRodA5Scbg30joL2xFBvL52/preview',
        duration: 600
      }
    ]
  },
  process: {
    id: 'process',
    title: 'Process - Systems That Scale',
    description: 'Build systems that scale your business efficiently and consistently',
    icon: <Settings className="h-6 w-6" />,
    color: 'orange',
    videos: [
      {
        id: '1',
        title: 'Introduction to Process',
        url: 'https://drive.google.com/file/d/10sSL_A96eAuuEGWhd7UL-oM1fl3iJqMQ/preview',
        duration: 600
      }
    ]
  },
  sales: {
    id: 'sales',
    title: 'Super Effective Sales Methodology',
    description: 'Learn proven sales methodologies to close more deals effectively',
    icon: <DollarSignIcon className="h-6 w-6" />,
    color: 'red',
    videos: [
      {
        id: '1',
        title: 'Introduction to Sales',
        url: 'https://drive.google.com/file/d/1R2bv-qZN3kUckO03uiSXsgvT_OIFjgF-/preview',
        duration: 600
      }
    ]
  }
};

export const TrainingModulePage = () => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [completedVideos, setCompletedVideos] = useState<Set<string>>(new Set());
  const [videoWatchTime, setVideoWatchTime] = useState(0);
  const [isVideoComplete, setIsVideoComplete] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const module = moduleId ? modules[moduleId] : null;

  useEffect(() => {
    // Start timer when video loads
    timerRef.current = setInterval(() => {
      setVideoWatchTime(prev => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentVideoIndex]);

  useEffect(() => {
    // Check if video has been watched for the required duration
    if (module && videoWatchTime >= module.videos[currentVideoIndex].duration) {
      setIsVideoComplete(true);
    }
  }, [videoWatchTime, currentVideoIndex, module]);

  if (!module) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Module Not Found</h2>
            <p className="text-muted-foreground mb-6">The requested training module does not exist.</p>
            <Button onClick={() => navigate('/dashboard/training')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Training Hub
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentVideo = module.videos[currentVideoIndex];
  const progress = ((completedVideos.size + (isVideoComplete ? 1 : 0)) / module.videos.length) * 100;

  const handleNextVideo = () => {
    if (!isVideoComplete) {
      toast({
        title: "Please Complete Current Video",
        description: "You must watch the entire video before proceeding to the next one.",
        variant: "destructive"
      });
      return;
    }

    const newCompleted = new Set(completedVideos);
    newCompleted.add(currentVideo.id);
    setCompletedVideos(newCompleted);
    
    if (currentVideoIndex < module.videos.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
      setVideoWatchTime(0);
      setIsVideoComplete(false);
    } else {
      toast({
        title: "Module Complete!",
        description: "Congratulations on completing this training module.",
      });
    }
  };

  const handleVideoSelect = (index: number) => {
    if (index === 0 || completedVideos.has(module.videos[index - 1].id)) {
      setCurrentVideoIndex(index);
      setVideoWatchTime(0);
      setIsVideoComplete(false);
    } else {
      toast({
        title: "Video Locked",
        description: "Please complete the previous videos first.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* CT1 Branding Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 p-4 shadow-md mb-6">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={ct1Logo} alt="CT1 Logo" className="h-10 w-10" />
            <div>
              <h1 className="text-xl font-bold text-primary-foreground">CT1 Training</h1>
              <p className="text-xs text-primary-foreground/90">One-Up Your Business</p>
            </div>
          </div>
          <Button variant="ghost" onClick={() => navigate('/dashboard/training')} className="text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/10">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Training Hub
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Module Header */}
        <div className="mb-8">
          <div className="flex items-start gap-4">
            <div className={`h-16 w-16 rounded-full bg-${module.color}-100 flex items-center justify-center`}>
              {module.icon}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{module.title}</h1>
              <p className="text-muted-foreground">{module.description}</p>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex-1">
                  <Progress value={progress} className="h-2" />
                </div>
                <span className="text-sm font-medium">{Math.round(progress)}% Complete</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{currentVideo.title}</span>
                  {isVideoComplete && (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Complete
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="aspect-video w-full bg-black">
                  <iframe
                    key={currentVideo.id}
                    src={currentVideo.url}
                    className="w-full h-full"
                    allow="autoplay"
                    title={currentVideo.title}
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-muted-foreground">
                      Video {currentVideoIndex + 1} of {module.videos.length}
                    </div>
                    {!isVideoComplete && (
                      <div className="text-sm text-muted-foreground">
                        Watch time: {Math.floor(videoWatchTime / 60)}:{(videoWatchTime % 60).toString().padStart(2, '0')} / {Math.floor(currentVideo.duration / 60)}:{(currentVideo.duration % 60).toString().padStart(2, '0')}
                      </div>
                    )}
                  </div>
                  {!isVideoComplete && (
                    <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        Please watch the entire video to unlock the next lesson.
                      </p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    {currentVideoIndex < module.videos.length - 1 && (
                      <Button 
                        onClick={handleNextVideo}
                        disabled={!isVideoComplete}
                        className="flex-1"
                      >
                        Next Video
                      </Button>
                    )}
                    {currentVideoIndex === module.videos.length - 1 && isVideoComplete && (
                      <Button 
                        onClick={() => navigate('/dashboard/training')}
                        className="flex-1"
                      >
                        Complete Module
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Video Playlist */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Module Lessons</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {module.videos.map((video, index) => {
                  const isCompleted = completedVideos.has(video.id);
                  const isCurrent = index === currentVideoIndex;
                  const isLocked = index > 0 && !completedVideos.has(module.videos[index - 1].id);

                  return (
                    <button
                      key={video.id}
                      onClick={() => handleVideoSelect(index)}
                      disabled={isLocked}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        isCurrent
                          ? 'border-primary bg-primary/5'
                          : isLocked
                          ? 'border-muted bg-muted/50 opacity-50 cursor-not-allowed'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 ${isLocked ? 'text-muted-foreground' : 'text-primary'}`}>
                          {isCompleted ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : isLocked ? (
                            <Lock className="h-5 w-5" />
                          ) : (
                            <Play className="h-5 w-5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">
                            Lesson {index + 1}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {video.title}
                          </p>
                          <div className="text-xs text-muted-foreground mt-1">
                            {Math.floor(video.duration / 60)} min
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
