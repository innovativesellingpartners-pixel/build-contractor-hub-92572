import { useState } from 'react';
import { useJobs, Job } from '@/hooks/useJobs';
import { useJobPhotos } from '@/hooks/useJobPhotos';
import { useJobCosts } from '@/hooks/useJobCosts';
import { useDailyLogs } from '@/hooks/useDailyLogs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Plus, 
  Trash2, 
  MapPin, 
  Calendar, 
  DollarSign,
  Image as ImageIcon,
  FileText,
  Calculator
} from 'lucide-react';

interface JobDetailViewProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function JobDetailView({ job, open, onOpenChange }: JobDetailViewProps) {
  const { updateJob } = useJobs();
  const { photos, uploading, uploadPhoto, deletePhoto } = useJobPhotos(job?.id);
  const { costs, totalCosts, addCost, deleteCost } = useJobCosts(job?.id);
  const { logs, addLog, deleteLog } = useDailyLogs(job?.id);

  const [photoCaption, setPhotoCaption] = useState('');
  const [newCost, setNewCost] = useState({
    category: '',
    description: '',
    amount: '',
    cost_date: new Date().toISOString().split('T')[0],
  });
  const [newLog, setNewLog] = useState({
    log_date: new Date().toISOString().split('T')[0],
    weather: '',
    crew_count: '',
    hours_worked: '',
    work_completed: '',
    materials_used: '',
    equipment_used: '',
    notes: '',
  });

  if (!job) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await uploadPhoto(file, photoCaption);
      setPhotoCaption('');
      e.target.value = '';
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const handleAddCost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addCost({
        category: newCost.category,
        description: newCost.description,
        amount: parseFloat(newCost.amount),
        cost_date: newCost.cost_date,
      });
      
      // Update job total cost
      await updateJob(job.id, {
        total_cost: totalCosts + parseFloat(newCost.amount),
      });

      setNewCost({
        category: '',
        description: '',
        amount: '',
        cost_date: new Date().toISOString().split('T')[0],
      });
    } catch (error) {
      console.error('Add cost error:', error);
    }
  };

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addLog({
        log_date: newLog.log_date,
        weather: newLog.weather,
        crew_count: newLog.crew_count ? parseInt(newLog.crew_count) : undefined,
        hours_worked: newLog.hours_worked ? parseFloat(newLog.hours_worked) : undefined,
        work_completed: newLog.work_completed,
        materials_used: newLog.materials_used,
        equipment_used: newLog.equipment_used,
        notes: newLog.notes,
      });

      setNewLog({
        log_date: new Date().toISOString().split('T')[0],
        weather: '',
        crew_count: '',
        hours_worked: '',
        work_completed: '',
        materials_used: '',
        equipment_used: '',
        notes: '',
      });
    } catch (error) {
      console.error('Add log error:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: 'bg-blue-500',
      in_progress: 'bg-yellow-500',
      completed: 'bg-green-500',
      on_hold: 'bg-orange-500',
      cancelled: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">{job.name}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">{job.job_number}</p>
            </div>
            <Badge className={getStatusColor(job.status)}>
              {job.status.replace('_', ' ')}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="photos">Photos ({photos.length})</TabsTrigger>
            <TabsTrigger value="costs">Costs</TabsTrigger>
            <TabsTrigger value="logs">Daily Logs</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Job Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {job.description && (
                  <div>
                    <Label className="text-muted-foreground">Description</Label>
                    <p className="mt-1">{job.description}</p>
                  </div>
                )}
                
                {job.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <Label className="text-muted-foreground">Location</Label>
                      <p className="mt-1">
                        {job.address}
                        {job.city && `, ${job.city}`}
                        {job.state && `, ${job.state}`}
                        {job.zip_code && ` ${job.zip_code}`}
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {job.start_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <Label className="text-muted-foreground">Start Date</Label>
                        <p className="mt-1">{new Date(job.start_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                  
                  {job.end_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <Label className="text-muted-foreground">End Date</Label>
                        <p className="mt-1">{new Date(job.end_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label className="text-muted-foreground">Total Cost</Label>
                    <p className="text-2xl font-bold text-primary mt-1">
                      ${job.total_cost.toLocaleString()}
                    </p>
                  </div>
                </div>

                {job.notes && (
                  <div>
                    <Label className="text-muted-foreground">Notes</Label>
                    <p className="mt-1 text-sm">{job.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Photos Tab */}
          <TabsContent value="photos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Photo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="caption">Caption (Optional)</Label>
                  <Input
                    id="caption"
                    value={photoCaption}
                    onChange={(e) => setPhotoCaption(e.target.value)}
                    placeholder="Add a description..."
                  />
                </div>
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={uploading}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {photos.map((photo) => (
                <Card key={photo.id} className="overflow-hidden">
                  <div className="aspect-square relative">
                    <img
                      src={photo.photo_url}
                      alt={photo.caption || 'Job photo'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {photo.caption && (
                    <CardContent className="p-3">
                      <p className="text-sm">{photo.caption}</p>
                    </CardContent>
                  )}
                  <CardContent className="p-3 pt-0">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      onClick={() => deletePhoto(photo.id, photo.photo_url)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {photos.length === 0 && (
              <Card className="p-12 text-center">
                <ImageIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No photos uploaded yet</p>
              </Card>
            )}
          </TabsContent>

          {/* Costs Tab */}
          <TabsContent value="costs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Add Cost
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    ${totalCosts.toLocaleString()}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddCost} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Input
                        id="category"
                        required
                        value={newCost.category}
                        onChange={(e) => setNewCost({ ...newCost, category: e.target.value })}
                        placeholder="e.g., Materials, Labor"
                      />
                    </div>
                    <div>
                      <Label htmlFor="amount">Amount *</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        required
                        value={newCost.amount}
                        onChange={(e) => setNewCost({ ...newCost, amount: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="cost-description">Description</Label>
                    <Input
                      id="cost-description"
                      value={newCost.description}
                      onChange={(e) => setNewCost({ ...newCost, description: e.target.value })}
                      placeholder="Details about this cost..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="cost-date">Date</Label>
                    <Input
                      id="cost-date"
                      type="date"
                      value={newCost.cost_date}
                      onChange={(e) => setNewCost({ ...newCost, cost_date: e.target.value })}
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Cost
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {costs.map((cost) => (
                <Card key={cost.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{cost.category}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(cost.cost_date).toLocaleDateString()}
                          </span>
                        </div>
                        {cost.description && (
                          <p className="text-sm text-muted-foreground">{cost.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-semibold">${cost.amount.toLocaleString()}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteCost(cost.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {costs.length === 0 && (
              <Card className="p-12 text-center">
                <Calculator className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No costs recorded yet</p>
              </Card>
            )}
          </TabsContent>

          {/* Daily Logs Tab */}
          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Add Daily Log
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddLog} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="log-date">Date *</Label>
                      <Input
                        id="log-date"
                        type="date"
                        required
                        value={newLog.log_date}
                        onChange={(e) => setNewLog({ ...newLog, log_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="weather">Weather</Label>
                      <Input
                        id="weather"
                        value={newLog.weather}
                        onChange={(e) => setNewLog({ ...newLog, weather: e.target.value })}
                        placeholder="Sunny, Rainy, etc."
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="crew-count">Crew Count</Label>
                      <Input
                        id="crew-count"
                        type="number"
                        value={newLog.crew_count}
                        onChange={(e) => setNewLog({ ...newLog, crew_count: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="hours-worked">Hours Worked</Label>
                      <Input
                        id="hours-worked"
                        type="number"
                        step="0.5"
                        value={newLog.hours_worked}
                        onChange={(e) => setNewLog({ ...newLog, hours_worked: e.target.value })}
                        placeholder="0.0"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="work-completed">Work Completed</Label>
                    <Textarea
                      id="work-completed"
                      value={newLog.work_completed}
                      onChange={(e) => setNewLog({ ...newLog, work_completed: e.target.value })}
                      placeholder="Describe the work completed today..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="materials">Materials Used</Label>
                    <Textarea
                      id="materials"
                      value={newLog.materials_used}
                      onChange={(e) => setNewLog({ ...newLog, materials_used: e.target.value })}
                      placeholder="List materials used..."
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="equipment">Equipment Used</Label>
                    <Textarea
                      id="equipment"
                      value={newLog.equipment_used}
                      onChange={(e) => setNewLog({ ...newLog, equipment_used: e.target.value })}
                      placeholder="List equipment used..."
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="log-notes">Notes</Label>
                    <Textarea
                      id="log-notes"
                      value={newLog.notes}
                      onChange={(e) => setNewLog({ ...newLog, notes: e.target.value })}
                      placeholder="Additional notes..."
                      rows={2}
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Log Entry
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {logs.map((log) => (
                <Card key={log.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {new Date(log.log_date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteLog(log.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      {log.weather && <span>Weather: {log.weather}</span>}
                      {log.crew_count && <span>Crew: {log.crew_count}</span>}
                      {log.hours_worked && <span>Hours: {log.hours_worked}</span>}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {log.work_completed && (
                      <div>
                        <Label className="text-muted-foreground">Work Completed</Label>
                        <p className="text-sm mt-1">{log.work_completed}</p>
                      </div>
                    )}
                    {log.materials_used && (
                      <div>
                        <Label className="text-muted-foreground">Materials</Label>
                        <p className="text-sm mt-1">{log.materials_used}</p>
                      </div>
                    )}
                    {log.equipment_used && (
                      <div>
                        <Label className="text-muted-foreground">Equipment</Label>
                        <p className="text-sm mt-1">{log.equipment_used}</p>
                      </div>
                    )}
                    {log.notes && (
                      <div>
                        <Label className="text-muted-foreground">Notes</Label>
                        <p className="text-sm mt-1">{log.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {logs.length === 0 && (
              <Card className="p-12 text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No daily logs recorded yet</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
