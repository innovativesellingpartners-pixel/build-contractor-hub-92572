import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, HelpCircle } from 'lucide-react';

interface QuizQuestion {
  id: string;
  lesson_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false';
  options: string[] | null;
  correct_answer: string;
  order_index: number;
  points: number;
}

interface QuizManagementProps {
  lessonId: string;
  lessonTitle: string;
}

export const QuizManagement = ({ lessonId, lessonTitle }: QuizManagementProps) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [formData, setFormData] = useState({
    question_text: '',
    question_type: 'multiple_choice' as 'multiple_choice' | 'true_false',
    options: ['', '', '', ''],
    correct_answer: '',
    points: 1,
  });

  // Fetch quiz questions
  const { data: questions, isLoading } = useQuery({
    queryKey: ['quiz-questions', lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lesson_quiz_questions')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order_index');
      
      if (error) throw error;
      return data as QuizQuestion[];
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const maxOrderIndex = questions?.length || 0;
      const { error } = await supabase
        .from('lesson_quiz_questions')
        .insert({
          lesson_id: lessonId,
          question_text: data.question_text,
          question_type: data.question_type,
          options: data.question_type === 'multiple_choice' ? data.options.filter(o => o.trim()) : null,
          correct_answer: data.correct_answer,
          order_index: maxOrderIndex,
          points: data.points,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-questions', lessonId] });
      toast.success('Question added successfully!');
      resetForm();
      setOpen(false);
    },
    onError: (error) => {
      toast.error('Failed to add question: ' + error.message);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from('lesson_quiz_questions')
        .update({
          question_text: data.question_text,
          question_type: data.question_type,
          options: data.question_type === 'multiple_choice' ? data.options.filter(o => o.trim()) : null,
          correct_answer: data.correct_answer,
          points: data.points,
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-questions', lessonId] });
      toast.success('Question updated successfully!');
      resetForm();
      setOpen(false);
    },
    onError: (error) => {
      toast.error('Failed to update question: ' + error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('lesson_quiz_questions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-questions', lessonId] });
      toast.success('Question deleted successfully!');
    },
    onError: (error) => {
      toast.error('Failed to delete question: ' + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      question_text: '',
      question_type: 'multiple_choice',
      options: ['', '', '', ''],
      correct_answer: '',
      points: 1,
    });
    setEditingQuestion(null);
  };

  const handleEdit = (question: QuizQuestion) => {
    setEditingQuestion(question);
    setFormData({
      question_text: question.question_text,
      question_type: question.question_type,
      options: question.options || ['', '', '', ''],
      correct_answer: question.correct_answer,
      points: question.points,
    });
    setOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.question_text.trim() || !formData.correct_answer.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.question_type === 'multiple_choice' && formData.options.filter(o => o.trim()).length < 2) {
      toast.error('Please provide at least 2 options for multiple choice questions');
      return;
    }

    if (editingQuestion) {
      updateMutation.mutate({ id: editingQuestion.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Quiz Questions for "{lessonTitle}"
          </h3>
          <p className="text-sm text-muted-foreground">
            {questions?.length || 0} question(s)
          </p>
        </div>
        <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingQuestion ? 'Edit' : 'Add'} Quiz Question</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Question Type</Label>
                <Select
                  value={formData.question_type}
                  onValueChange={(value: 'multiple_choice' | 'true_false') => 
                    setFormData({ ...formData, question_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                    <SelectItem value="true_false">True/False</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Question Text *</Label>
                <Textarea
                  value={formData.question_text}
                  onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                  placeholder="Enter your question..."
                  rows={3}
                />
              </div>

              {formData.question_type === 'multiple_choice' && (
                <div>
                  <Label>Answer Options *</Label>
                  <div className="space-y-2 mt-2">
                    {formData.options.map((option, idx) => (
                      <Input
                        key={idx}
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...formData.options];
                          newOptions[idx] = e.target.value;
                          setFormData({ ...formData, options: newOptions });
                        }}
                        placeholder={`Option ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label>Correct Answer *</Label>
                {formData.question_type === 'true_false' ? (
                  <Select
                    value={formData.correct_answer}
                    onValueChange={(value) => setFormData({ ...formData, correct_answer: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select correct answer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">True</SelectItem>
                      <SelectItem value="false">False</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={formData.correct_answer}
                    onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                    placeholder="Enter the exact correct answer"
                  />
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Must match one of the options exactly (case-insensitive)
                </p>
              </div>

              <div>
                <Label>Points</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 1 })}
                />
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit}>
                  {editingQuestion ? 'Update' : 'Add'} Question
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Loading questions...</p>
          </CardContent>
        </Card>
      ) : questions && questions.length > 0 ? (
        <div className="space-y-3">
          {questions.map((question, idx) => (
            <Card key={question.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">
                      Q{idx + 1}: {question.question_text}
                    </CardTitle>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary">{question.question_type.replace('_', ' ')}</Badge>
                      <Badge variant="outline">{question.points} point(s)</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(question)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this question?')) {
                          deleteMutation.mutate(question.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {question.question_type === 'multiple_choice' && question.options && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Options:</p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground">
                      {question.options.map((opt, i) => (
                        <li key={i} className={opt === question.correct_answer ? 'text-green-600 font-medium' : ''}>
                          {opt} {opt === question.correct_answer && '✓'}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {question.question_type === 'true_false' && (
                  <p className="text-sm">
                    Correct Answer: <span className="font-medium text-green-600">{question.correct_answer}</span>
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No quiz questions yet. Add your first question!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};