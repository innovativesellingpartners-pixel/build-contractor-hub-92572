import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { BookOpen, Plus, Edit, Trash2, Eye } from 'lucide-react';
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
  category?: { name: string };
};

type Category = {
  id: string;
  name: string;
  description?: string;
};

export const TrainingManagement = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const queryClient = useQueryClient();

  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['adminCourses'],
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['trainingCategories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  const createCourseMutation = useMutation({
    mutationFn: async (courseData: any) => {
      const { error } = await supabase
        .from('training_courses')
        .insert(courseData);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCourses'] });
      setIsCreateOpen(false);
      toast.success('Course created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create course');
      console.error('Error creating course:', error);
    },
  });

  const updateCourseMutation = useMutation({
    mutationFn: async ({ id, ...courseData }: any) => {
      const { error } = await supabase
        .from('training_courses')
        .update(courseData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCourses'] });
      setEditingCourse(null);
      toast.success('Course updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update course');
      console.error('Error updating course:', error);
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async (courseId: string) => {
      const { error } = await supabase
        .from('training_courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCourses'] });
      toast.success('Course deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete course');
      console.error('Error deleting course:', error);
    },
  });

  const CourseForm = ({ course, onSubmit }: { course?: Course | null; onSubmit: (data: any) => void }) => {
    const [formData, setFormData] = useState({
      title: course?.title || '',
      description: course?.description || '',
      category_id: course?.category_id || '',
      difficulty_level: course?.difficulty_level || 'beginner',
      duration_minutes: course?.duration_minutes || 0,
      is_published: course?.is_published || false,
      content: '',
      video_url: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="title">Course Title</Label>
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category_id}
              onValueChange={(value) => setFormData({ ...formData, category_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="difficulty">Difficulty</Label>
            <Select
              value={formData.difficulty_level}
              onValueChange={(value) => setFormData({ ...formData, difficulty_level: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="duration">Duration (minutes)</Label>
          <Input
            id="duration"
            type="number"
            value={formData.duration_minutes}
            onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="published"
            checked={formData.is_published}
            onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
          />
          <Label htmlFor="published">Published</Label>
        </div>

        <Button type="submit" className="w-full">
          {course ? 'Update Course' : 'Create Course'}
        </Button>
      </form>
    );
  };

  if (coursesLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Training Management</h2>
          <p className="text-muted-foreground">Manage training courses and content</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Course
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Course</DialogTitle>
            </DialogHeader>
            <CourseForm onSubmit={(data) => createCourseMutation.mutate(data)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Courses ({courses?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses?.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="font-medium">{course.title}</TableCell>
                  <TableCell>
                    {course.training_categories?.name || 'Uncategorized'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {course.difficulty_level || 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell>{course.duration_minutes || 0} min</TableCell>
                  <TableCell>
                    <Badge variant={course.is_published ? 'default' : 'secondary'}>
                      {course.is_published ? 'Published' : 'Draft'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(course.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setEditingCourse(course)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Course</DialogTitle>
                          </DialogHeader>
                          <CourseForm 
                            course={editingCourse}
                            onSubmit={(data) => updateCourseMutation.mutate({ 
                              id: editingCourse?.id, 
                              ...data 
                            })} 
                          />
                        </DialogContent>
                      </Dialog>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => deleteCourseMutation.mutate(course.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};