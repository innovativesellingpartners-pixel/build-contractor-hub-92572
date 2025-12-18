import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, Calendar, MessageSquare, Info, ChevronDown, ChevronUp, Voicemail, Briefcase, User, Link2 } from 'lucide-react';
import { formatPhoneNumber, calculateCallDuration, formatDuration } from '@/lib/phoneUtils';
import { format } from 'date-fns';
import { CallConversationDialog } from './CallConversationDialog';
import type { CallSession } from '@/hooks/useCallSessions';

type CallLogItemProps = {
  call: CallSession;
  onLinkToJob?: (call: CallSession) => void;
};

export const CallLogItem = ({ call, onLinkToJob }: CallLogItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showConversation, setShowConversation] = useState(false);

  const callDuration = call.status === 'completed' 
    ? calculateCallDuration(call.created_at, call.updated_at)
    : null;

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'default';
      case 'active':
        return 'secondary';
      case 'missed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getOutcomeIcon = (outcome: string | null) => {
    if (!outcome) return <Phone className="h-4 w-4" />;
    
    const lower = outcome.toLowerCase();
    if (lower.includes('meeting') || lower.includes('schedule')) {
      return <Calendar className="h-4 w-4" />;
    }
    if (lower.includes('message')) {
      return <MessageSquare className="h-4 w-4" />;
    }
    return <Info className="h-4 w-4" />;
  };

  const hasVoicemail = call.recording_url && call.recording_status === 'completed';
  
  // Check for transcript - handle both old format (config objects) and new format (messages)
  const conversationHistory = call.conversation_history;
  const hasTranscript = conversationHistory && Array.isArray(conversationHistory) && 
    conversationHistory.some((item: any) => item.role && item.content);
  
  const hasMeetingScheduled = call.outcome === 'meeting_scheduled' || 
    (call.action_taken && call.action_taken.toLowerCase().includes('appointment'));

  return (
    <>
      <Card className="p-4 hover:bg-accent/50 transition-colors">
        <div className="space-y-3">
          {/* Header Row - Phone & Caller Info */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <a 
                  href={`tel:${call.from_number}`}
                  className="font-medium text-primary hover:underline cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  {formatPhoneNumber(call.from_number)}
                </a>
                {call.caller_name && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {call.caller_name}
                  </span>
                )}
              </div>
              
              {/* Job Info */}
              {call.job && (
                <div className="flex items-center gap-2 mt-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  <span className="text-sm font-medium text-primary">
                    {call.job.job_number && `#${call.job.job_number} - `}
                    {call.job.name}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant={getStatusBadgeVariant(call.status)}>
                {call.status}
              </Badge>
              {callDuration && (
                <span className="text-sm text-muted-foreground">
                  {formatDuration(callDuration)}
                </span>
              )}
            </div>
          </div>

          {/* Date/Time and Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">
              {format(new Date(call.created_at), 'MMM d, yyyy \'at\' h:mm a')}
            </span>
            {hasVoicemail && (
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <Voicemail className="h-3 w-3" />
                Voicemail
              </Badge>
            )}
            {hasMeetingScheduled && (
              <Badge variant="default" className="text-xs flex items-center gap-1 bg-green-600">
                <Calendar className="h-3 w-3" />
                Meeting Scheduled
              </Badge>
            )}
            {call.outcome === 'voicemail' && !hasVoicemail && (
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                Message Taken
              </Badge>
            )}
            {!call.job && onLinkToJob && (
              <Badge 
                variant="outline" 
                className="text-xs flex items-center gap-1 cursor-pointer hover:bg-muted"
                onClick={(e) => {
                  e.stopPropagation();
                  onLinkToJob(call);
                }}
              >
                <Link2 className="h-3 w-3" />
                Link to Job
              </Badge>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex-1"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Hide Details
                </>
              ) : (
                <>
                  <Info className="h-4 w-4 mr-2" />
                  See Details
                </>
              )}
            </Button>
            {hasTranscript && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowConversation(true)}
                className="flex-1"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                View Transcript
              </Button>
            )}
          </div>

          {/* AI Summary */}
          {call.ai_summary && !isExpanded && (
            <div className="space-y-2 pt-2 border-t">
              <div className="text-sm font-medium">AI Summary:</div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {call.ai_summary}
              </p>
            </div>
          )}

          {/* Expanded Details */}
          {isExpanded && (
            <div className="space-y-3 pt-2 border-t">
              {call.ai_summary && (
                <p className="text-sm text-muted-foreground">
                  {call.ai_summary}
                </p>
              )}

              {/* Job details if linked */}
              {call.job && (
                <div className="flex items-start gap-2 p-2 bg-muted/50 rounded-md">
                  <Briefcase className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                  <div>
                    <span className="text-sm font-medium">Linked Job:</span>
                    <p className="text-sm text-muted-foreground">
                      {call.job.job_number && <span className="font-medium">#{call.job.job_number}</span>}
                      {call.job.job_number && ' - '}
                      {call.job.name}
                      {call.job.address && <span className="block text-xs">{call.job.address}</span>}
                    </p>
                  </div>
                </div>
              )}

              {call.outcome && (
                <div className="flex items-center gap-2">
                  {getOutcomeIcon(call.outcome)}
                  <span className="text-sm font-medium">Outcome:</span>
                  <span className="text-sm text-muted-foreground">{call.outcome}</span>
                </div>
              )}

              {call.action_taken && (
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-sm font-medium">Action:</span>
                    <p className="text-sm text-muted-foreground">{call.action_taken}</p>
                  </div>
                </div>
              )}

              {/* Audio Recording Playback */}
              {call.recording_url && call.recording_status === 'completed' && (
                <div className="space-y-2 pt-3 border-t">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span className="text-sm font-medium">Call Recording</span>
                    {call.recording_duration && (
                      <Badge variant="outline" className="text-xs">
                        {formatDuration(call.recording_duration)}
                      </Badge>
                    )}
                  </div>
                  <audio 
                    controls 
                    className="w-full h-10"
                    preload="metadata"
                  >
                    <source 
                      src={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/twilio-recording-proxy?url=${encodeURIComponent(call.recording_url)}`} 
                      type="audio/mpeg" 
                    />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}

              {call.recording_status === 'in-progress' && (
                <div className="text-sm text-muted-foreground italic pt-2 border-t">
                  Recording in progress...
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                >
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Hide Details
                </Button>
                {hasTranscript && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowConversation(true)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    View Full Transcript
                  </Button>
                )}
                {!call.job && onLinkToJob && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onLinkToJob(call)}
                  >
                    <Link2 className="h-4 w-4 mr-2" />
                    Link to Job
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      <CallConversationDialog
        call={call}
        open={showConversation}
        onOpenChange={setShowConversation}
      />
    </>
  );
};
