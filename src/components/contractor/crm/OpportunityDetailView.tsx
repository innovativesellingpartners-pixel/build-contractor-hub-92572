import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Opportunity, OpportunityStage, useOpportunities } from '@/hooks/useOpportunities';
import { ArrowLeft, Calendar, DollarSign, FileText, Phone, Mail, MapPin, User, TrendingUp, Clock, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface OpportunityDetailViewProps {
  opportunity: Opportunity;
  onBack: () => void;
}

const stageConfig: Record<OpportunityStage, { label: string; color: string }> = {
  qualification: { label: 'Qualification', color: 'bg-slate-500' },
  lwe_discovery: { label: 'LWE/Discovery', color: 'bg-blue-500' },
  demo: { label: 'Demo', color: 'bg-cyan-500' },
  proposal: { label: 'Proposal', color: 'bg-yellow-500' },
  negotiation: { label: 'Negotiation', color: 'bg-orange-500' },
  close: { label: 'Close', color: 'bg-green-500' },
  psfu: { label: 'PSFU', color: 'bg-purple-500' },
};

export default function OpportunityDetailView({ opportunity, onBack }: OpportunityDetailViewProps) {
  const { updateOpportunity, fetchStageHistory } = useOpportunities();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedOpp, setEditedOpp] = useState(opportunity);
  const [stageHistory, setStageHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const handleStageChange = async (newStage: OpportunityStage) => {
    try {
      await updateOpportunity(opportunity.id, { stage: newStage });
      toast({
        title: 'Stage updated',
        description: `Opportunity moved to ${stageConfig[newStage].label}`,
      });
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleSaveChanges = async () => {
    try {
      await updateOpportunity(opportunity.id, editedOpp);
      setIsEditing(false);
      toast({
        title: 'Changes saved',
        description: 'Opportunity updated successfully',
      });
    } catch (error) {
      // Error handled by hook
    }
  };

  const loadStageHistory = async () => {
    const history = await fetchStageHistory(opportunity.id);
    setStageHistory(history);
    setShowHistory(true);
  };

  const getDaysInStage = () => {
    const entered = new Date(opportunity.stage_entered_at);
    const now = new Date();
    return Math.floor((now.getTime() - entered.getTime()) / (1000 * 60 * 60 * 24));
  };

  const isOverdue = opportunity.next_action_date && new Date(opportunity.next_action_date) < new Date();

  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{opportunity.title}</h1>
              <p className="text-muted-foreground">{opportunity.customer_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={stageConfig[opportunity.stage].color}>
              {stageConfig[opportunity.stage].label}
            </Badge>
            <Badge variant="outline">{opportunity.trade_type}</Badge>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{opportunity.customer_phone || 'No phone'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{opportunity.customer_email || 'No email'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{opportunity.job_address || 'No address'}</span>
              </div>
              {opportunity.decision_maker_name && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Decision Maker: {opportunity.decision_maker_name}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sales Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Sales Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estimated Value</span>
                <span className="text-lg font-semibold">
                  ${opportunity.estimated_value?.toLocaleString() || '0'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Probability</span>
                <span className="font-semibold">{opportunity.probability_percent}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Days in Stage</span>
                <Badge variant="outline">{getDaysInStage()} days</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Lead Source</span>
                <Badge variant="secondary">{opportunity.lead_source}</Badge>
              </div>
              {opportunity.estimated_close_date && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Expected Close</span>
                  <span className="text-sm">{format(new Date(opportunity.estimated_close_date), 'MMM d, yyyy')}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stage Management */}
        <Card>
          <CardHeader>
            <CardTitle>Stage Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Label>Move to Stage:</Label>
              <Select value={opportunity.stage} onValueChange={(value) => handleStageChange(value as OpportunityStage)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="qualification">Qualification</SelectItem>
                  <SelectItem value="lwe_discovery">LWE/Discovery</SelectItem>
                  <SelectItem value="demo">Demo</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                  <SelectItem value="negotiation">Negotiation</SelectItem>
                  <SelectItem value="close">Close</SelectItem>
                  <SelectItem value="psfu">PSFU</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={loadStageHistory}>
                <Clock className="h-4 w-4 mr-2" />
                View History
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Next Action */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Next Action
              {isOverdue && <Badge variant="destructive">Overdue</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label>Action Description</Label>
                  <Textarea
                    value={editedOpp.next_action_description || ''}
                    onChange={(e) => setEditedOpp({ ...editedOpp, next_action_description: e.target.value })}
                    placeholder="Describe the next action..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Action Date</Label>
                  <Input
                    type="date"
                    value={editedOpp.next_action_date || ''}
                    onChange={(e) => setEditedOpp({ ...editedOpp, next_action_date: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveChanges}>Save Changes</Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm">{opportunity.next_action_description || 'No action scheduled'}</p>
                {opportunity.next_action_date && (
                  <p className="text-sm text-muted-foreground">
                    Due: {format(new Date(opportunity.next_action_date), 'MMM d, yyyy')}
                  </p>
                )}
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  Edit Action
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Notes & Details */}
        <Card>
          <CardHeader>
            <CardTitle>Notes & Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {opportunity.need_description && (
              <div>
                <Label>Need Description</Label>
                <p className="text-sm mt-1">{opportunity.need_description}</p>
              </div>
            )}
            {opportunity.competing_options_description && (
              <div>
                <Label>Competing Options</Label>
                <p className="text-sm mt-1">{opportunity.competing_options_description}</p>
              </div>
            )}
            {opportunity.notes && (
              <div>
                <Label>Notes</Label>
                <p className="text-sm mt-1 whitespace-pre-wrap">{opportunity.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Proposal Document</span>
              {opportunity.proposal_document_url ? (
                <Button variant="outline" size="sm" asChild>
                  <a href={opportunity.proposal_document_url} target="_blank" rel="noopener noreferrer">
                    View
                  </a>
                </Button>
              ) : (
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Contract Document</span>
              {opportunity.contract_document_url ? (
                <Button variant="outline" size="sm" asChild>
                  <a href={opportunity.contract_document_url} target="_blank" rel="noopener noreferrer">
                    View
                  </a>
                </Button>
              ) : (
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stage History Dialog */}
        <Dialog open={showHistory} onOpenChange={setShowHistory}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Stage History</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {stageHistory.map((history) => (
                <div key={history.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {history.from_stage && (
                        <>
                          <Badge variant="outline">{stageConfig[history.from_stage as OpportunityStage].label}</Badge>
                          <span>→</span>
                        </>
                      )}
                      <Badge className={stageConfig[history.to_stage as OpportunityStage].color}>
                        {stageConfig[history.to_stage as OpportunityStage].label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {format(new Date(history.changed_at), 'MMM d, yyyy h:mm a')}
                    </p>
                    {history.note && <p className="text-sm mt-1">{history.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
