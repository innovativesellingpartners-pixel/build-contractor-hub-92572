import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Edit, Trash2, Upload, Video, FileText, BookOpen, GripVertical, Save } from 'lucide-react';
import { toast } from 'sonner';

type Course = {
  id: string;
  title: string;
  description?: string;
  category_id?: string;
  difficulty_level?: string;
  duration_minutes?: number;
  is_published: boolean;
  created_at: string;
  training_categories?: { name: string };
};

type Module = {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  order_index: number;
  created_at: string;
};

type Lesson = {
  id: string;
  module_id: string;
  title: string;
  description?: string;
  content?: string;
  lesson_type: string;
  duration_minutes?: number;
  order_index: number;
  video_url?: string;
  pdf_url?: string;
  is_required: boolean;
  created_at: string;
};

interface CourseBuilderProps {
  courseId: string;
  onClose: () => void;
}

export const CourseBuilder = ({ courseId, onClose }: CourseBuilderProps) => {
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [isAddingLesson, setIsAddingLesson] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: course } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_courses')
        .select(`
          *,
          training_categories (
            id,
            name
          )
        `)
        .eq('id', courseId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: modules } = useQuery({
    queryKey: ['course-modules', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_modules')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index');

      if (error) throw error;
      return data;
    },
  });

  const { data: lessons } = useQuery({
    queryKey: ['course-lessons', selectedModule],
    queryFn: async () => {
      if (!selectedModule) return [];
      
      const { data, error } = await supabase
        .from('course_lessons')
        .select('*')
        .eq('module_id', selectedModule)
        .order('order_index');

      if (error) throw error;
      return data;
    },
    enabled: !!selectedModule,
  });

  const createModuleMutation = useMutation({
    mutationFn: async (moduleData: any) => {
      const { error } = await supabase
        .from('course_modules')
        .insert({ ...moduleData, course_id: courseId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-modules', courseId] });
      setIsAddingModule(false);
      toast.success('Module created successfully');
    },
  });

  const updateModuleMutation = useMutation({
    mutationFn: async ({ id, ...moduleData }: any) => {
      const { error } = await supabase
        .from('course_modules')
        .update(moduleData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-modules', courseId] });
      setEditingModule(null);
      toast.success('Module updated successfully');
    },
  });

  const deleteModuleMutation = useMutation({
    mutationFn: async (moduleId: string) => {
      const { error } = await supabase
        .from('course_modules')
        .delete()
        .eq('id', moduleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-modules', courseId] });
      setSelectedModule(null);
      toast.success('Module deleted successfully');
    },
  });

  const createLessonMutation = useMutation({
    mutationFn: async (lessonData: any) => {
      const { error } = await supabase
        .from('course_lessons')
        .insert({ ...lessonData, module_id: selectedModule });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-lessons', selectedModule] });
      setIsAddingLesson(false);
      toast.success('Lesson created successfully');
    },
  });

  const updateLessonMutation = useMutation({
    mutationFn: async ({ id, ...lessonData }: any) => {
      const { error } = await supabase
        .from('course_lessons')
        .update(lessonData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-lessons', selectedModule] });
      setEditingLesson(null);
      toast.success('Lesson updated successfully');
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      const { error } = await supabase
        .from('course_lessons')
        .delete()
        .eq('id', lessonId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-lessons', selectedModule] });
      toast.success('Lesson deleted successfully');
    },
  });

  const handleFileUpload = async (file: File, type: 'video' | 'pdf') => {
    setUploading(true);
    try {
      const bucket = type === 'video' ? 'training-videos' : 'training-pdfs';
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${courseId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const ModuleForm = ({ module, onSubmit }: { module?: Module | null; onSubmit: (data: any) => void }) => {
    const [formData, setFormData] = useState({
      title: module?.title || '',
      description: module?.description || '',
      order_index: module?.order_index || (modules?.length || 0),
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="title">Module Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />
        </div>
        <div>
          <Label htmlFor="order">Order</Label>
          <Input
            id="order"
            type="number"
            value={formData.order_index}
            onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
          />
        </div>
        <Button type="submit" className="w-full">
          {module ? 'Update Module' : 'Create Module'}
        </Button>
      </form>
    );
  };

  const LessonForm = ({ lesson, onSubmit }: { lesson?: Lesson | null; onSubmit: (data: any) => void }) => {
    const [formData, setFormData] = useState({
      title: lesson?.title || '',
      description: lesson?.description || '',
      content: lesson?.content || '',
      lesson_type: lesson?.lesson_type || 'text',
      duration_minutes: lesson?.duration_minutes || 0,
      order_index: lesson?.order_index || (lessons?.length || 0),
      video_url: lesson?.video_url || '',
      pdf_url: lesson?.pdf_url || '',
      is_required: lesson?.is_required ?? true,
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
    };

    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const url = await handleFileUpload(file, 'video');
        if (url) {
          setFormData({ ...formData, video_url: url, lesson_type: 'video' });
        }
      }
    };

    const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const url = await handleFileUpload(file, 'pdf');
        if (url) {
          setFormData({ ...formData, pdf_url: url, lesson_type: 'pdf' });
        }
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="title">Lesson Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={2}
          />
        </div>
        <div>
          <Label htmlFor="type">Lesson Type</Label>
          <Select
            value={formData.lesson_type}
            onValueChange={(value) => setFormData({ ...formData, lesson_type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text Content</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="pdf">PDF Document</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.lesson_type === 'text' && (
          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={8}
              placeholder="Enter the lesson content here..."
            />
          </div>
        )}

        {formData.lesson_type === 'video' && (
          <div className="space-y-2">
            <Label>Video Upload</Label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                className="hidden"
                id="video-upload"
              />
              <label htmlFor="video-upload">
                <Button type="button" variant="outline" className="flex items-center gap-2" disabled={uploading}>
                  <Video className="h-4 w-4" />
                  {uploading ? 'Uploading...' : 'Upload Video'}
                </Button>
              </label>
              {formData.video_url && (
                <Badge variant="secondary">Video uploaded</Badge>
              )}
            </div>
            {formData.video_url && (
              <Input
                placeholder="Video URL"
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
              />
            )}
          </div>
        )}

        {formData.lesson_type === 'pdf' && (
          <div className="space-y-2">
            <Label>PDF Upload</Label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".pdf"
                onChange={handlePdfUpload}
                className="hidden"
                id="pdf-upload"
              />
              <label htmlFor="pdf-upload">
                <Button type="button" variant="outline" className="flex items-center gap-2" disabled={uploading}>
                  <FileText className="h-4 w-4" />
                  {uploading ? 'Uploading...' : 'Upload PDF'}
                </Button>
              </label>
              {formData.pdf_url && (
                <Badge variant="secondary">PDF uploaded</Badge>
              )}
            </div>
            {formData.pdf_url && (
              <Input
                placeholder="PDF URL"
                value={formData.pdf_url}
                onChange={(e) => setFormData({ ...formData, pdf_url: e.target.value })}
              />
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              value={formData.duration_minutes}
              onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
            />
          </div>
          <div>
            <Label htmlFor="order">Order</Label>
            <Input
              id="order"
              type="number"
              value={formData.order_index}
              onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
            />
          </div>
        </div>

        <Button type="submit" className="w-full">
          {lesson ? 'Update Lesson' : 'Create Lesson'}
        </Button>
      </form>
    );
  };

  // Auto-select first module if available
  useEffect(() => {
    if (modules && modules.length > 0 && !selectedModule) {
      setSelectedModule(modules[0].id);
    }
  }, [modules, selectedModule]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Course Builder</h2>
          <p className="text-muted-foreground">{course?.title}</p>
        </div>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>

      <div className="flex-1 flex">
        {/* Modules Sidebar */}
        <div className="w-1/3 border-r bg-muted/20">
          <div className="p-4 border-b bg-background">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Modules</h3>
              <Dialog open={isAddingModule} onOpenChange={setIsAddingModule}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Module</DialogTitle>
                  </DialogHeader>
                  <ModuleForm onSubmit={(data) => createModuleMutation.mutate(data)} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="p-2">
              {modules?.map((module) => (
                <Card
                  key={module.id}
                  className={`mb-2 cursor-pointer transition-colors ${
                    selectedModule === module.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedModule(module.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">{module.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{module.description}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingModule(module);
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Module</DialogTitle>
                            </DialogHeader>
                            <ModuleForm
                              module={editingModule}
                              onSubmit={(data) => updateModuleMutation.mutate({ id: editingModule?.id, ...data })}
                            />
                          </DialogContent>
                        </Dialog>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteModuleMutation.mutate(module.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Lessons Content */}
        <div className="flex-1">
          {selectedModule ? (
            <>
              <div className="p-4 border-b bg-background">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Lessons</h3>
                  <Dialog open={isAddingLesson} onOpenChange={setIsAddingLesson}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Lesson
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Add Lesson</DialogTitle>
                      </DialogHeader>
                      <LessonForm onSubmit={(data) => createLessonMutation.mutate(data)} />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="p-4">
                  {lessons?.map((lesson) => (
                    <Card key={lesson.id} className="mb-4">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium">{lesson.title}</h4>
                              <Badge variant="outline">
                                {lesson.lesson_type}
                              </Badge>
                              <Badge variant="secondary">
                                {lesson.duration_minutes}min
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{lesson.description}</p>
                            {lesson.lesson_type === 'text' && lesson.content && (
                              <p className="text-xs text-muted-foreground line-clamp-2">{lesson.content}</p>
                            )}
                            {lesson.lesson_type === 'video' && lesson.video_url && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Video className="h-3 w-3" />
                                Video uploaded
                              </div>
                            )}
                            {lesson.lesson_type === 'pdf' && lesson.pdf_url && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <FileText className="h-3 w-3" />
                                PDF uploaded
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingLesson(lesson)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Edit Lesson</DialogTitle>
                                </DialogHeader>
                                <LessonForm
                                  lesson={editingLesson}
                                  onSubmit={(data) => updateLessonMutation.mutate({ id: editingLesson?.id, ...data })}
                                />
                              </DialogContent>
                            </Dialog>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteLessonMutation.mutate(lesson.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {lessons?.length === 0 && (
                    <div className="text-center py-12">
                      <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No lessons yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Start building your course by adding lessons to this module.
                      </p>
                      <Button onClick={() => setIsAddingLesson(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Lesson
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a module</h3>
                <p className="text-muted-foreground">Choose a module from the sidebar to view and edit its lessons.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};