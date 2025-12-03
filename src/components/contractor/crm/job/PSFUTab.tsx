import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Phone, Calendar, CheckCircle, Clock, X, MessageSquare } from 'lucide-react';
import { usePSFU, PSFU } from '@/hooks/usePSFU';
import { format } from 'date-fns';

interface PSFUTabProps {
  jobId: string;
  customerId?: string;
}

export default function PSFUTab({ jobId, customerId }: PSFUTabProps) {
  const { psfus, loading, addPSFU, updatePSFU, deletePSFU, completePSFU } = usePSFU(jobId);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newPSFU, setNewPSFU] = useState({
    next_contact_date: '',
    contact_method: 'phone',
    notes: '',
  });

  const handleAddPSFU = async () => {
    try {
      await addPSFU({
        job_id: jobId,
        customer_id: customerId,
        status: 'open',
        next_contact_date: newPSFU.next_contact_date || undefined,
        contact_method: newPSFU.contact_method,
        notes: newPSFU.notes || undefined,
      });
      setNewPSFU({ next_contact_date: '', contact_method: 'phone', notes: '' });
      setIsAdding(false);
    } catch (error) {
      console.error('Error adding PSFU:', error);
    }
  };

  const handleComplete = async (psfu: PSFU, outcome: string) => {
    try {
      await completePSFU(psfu.id, outcome);
      setEditingId(null);
    } catch (error) {
      console.error('Error completing PSFU:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-500';
      case 'scheduled':
        return 'bg-yellow-500';
      case 'in_progress':
        return 'bg-purple-500';
      case 'completed':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'scheduled':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading follow-ups...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Post-Sale Follow-Ups</h3>
        <Button onClick={() => setIsAdding(!isAdding)} size="sm">
          {isAdding ? (
            <>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Add Follow-Up
            </>
          )}
        </Button>
      </div>

      {/* Add New PSFU Form */}
      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Follow-Up</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Next Contact Date</label>
                <Input
                  type="date"
                  value={newPSFU.next_contact_date}
                  onChange={(e) => setNewPSFU({ ...newPSFU, next_contact_date: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Contact Method</label>
                <Select
                  value={newPSFU.contact_method}
                  onValueChange={(value) => setNewPSFU({ ...newPSFU, contact_method: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phone">Phone Call</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="text">Text Message</SelectItem>
                    <SelectItem value="in_person">In Person</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Notes</label>
              <Textarea
                placeholder="What do you want to follow up about?"
                value={newPSFU.notes}
                onChange={(e) => setNewPSFU({ ...newPSFU, notes: e.target.value })}
                rows={3}
              />
            </div>
            <Button onClick={handleAddPSFU} className="w-full">
              Create Follow-Up
            </Button>
          </CardContent>
        </Card>
      )}

      {/* PSFU List */}
      <div className="space-y-3">
        {psfus.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No follow-ups scheduled yet.</p>
              <p className="text-sm mt-2">Create a follow-up to stay in touch with your customer after the job.</p>
            </CardContent>
          </Card>
        ) : (
          psfus.map((psfu) => (
            <Card key={psfu.id} className={psfu.status === 'completed' ? 'opacity-75' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className={`${getStatusColor(psfu.status)} text-white gap-1`}>
                        {getStatusIcon(psfu.status)}
                        {psfu.status.replace('_', ' ')}
                      </Badge>
                      {psfu.contact_method && (
                        <Badge variant="outline" className="gap-1">
                          <Phone className="h-3 w-3" />
                          {psfu.contact_method.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>
                    
                    {psfu.next_contact_date && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {format(new Date(psfu.next_contact_date), 'MMMM d, yyyy')}
                        </span>
                      </div>
                    )}
                    
                    {psfu.notes && (
                      <p className="text-sm text-muted-foreground">{psfu.notes}</p>
                    )}
                    
                    {psfu.outcome && (
                      <div className="p-2 bg-green-50 rounded border border-green-200 text-sm">
                        <strong>Outcome:</strong> {psfu.outcome}
                      </div>
                    )}
                    
                    <p className="text-xs text-muted-foreground">
                      Created {format(new Date(psfu.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {psfu.status !== 'completed' && psfu.status !== 'cancelled' && (
                      <>
                        {editingId === psfu.id ? (
                          <div className="space-y-2">
                            <Input
                              placeholder="Outcome..."
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleComplete(psfu, (e.target as HTMLInputElement).value);
                                }
                              }}
                              autoFocus
                            />
                            <div className="flex gap-1">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setEditingId(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(psfu.id)}
                            className="gap-1"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Complete
                          </Button>
                        )}
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deletePSFU(psfu.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
