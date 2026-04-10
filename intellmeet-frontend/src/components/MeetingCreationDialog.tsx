import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, Clock, Video, Zap, Share2, Copy, Check } from 'lucide-react';

interface MeetingCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScheduleMeeting?: (title: string, scheduledAt: string) => string;
  onStartNow?: (title?: string) => void;
}

export default function MeetingCreationDialog({ open, onOpenChange, onScheduleMeeting, onStartNow }: MeetingCreationDialogProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [meetingTitle, setMeetingTitle] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [step, setStep] = useState<'options' | 'schedule-form' | 'start-now-form' | 'share-link'>('options');
  const [createdMeetingId, setCreatedMeetingId] = useState<string | null>(null);

  const handleStartNow = () => {
    // Move to title input step first
    setStep('start-now-form');
  };

  const handleStartNowFinal = () => {
    if (onStartNow) {
      onStartNow(meetingTitle);
    } else {
      const meetingId = Math.random().toString(36).substring(2, 8).toUpperCase();
      toast({
        title: "Meeting Started!",
        description: meetingTitle ? `${meetingTitle} - Meeting ID: ${meetingId}` : `Meeting ID: ${meetingId}`,
        variant: "success",
      });
      navigate(`/meeting/${meetingId}`);
    }
    onOpenChange(false);
    setMeetingTitle('');
    setStep('options');
  };

  const handleScheduleMeeting = () => {
    if (!scheduledDate || !scheduledTime) {
      toast({
        title: "Missing Information",
        description: "Please select both date and time",
        variant: "destructive",
      });
      return;
    }

    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
    
    if (onScheduleMeeting) {
      const meetingId = onScheduleMeeting(meetingTitle, scheduledDateTime);
      setCreatedMeetingId(meetingId);
    } else {
      const meetingId = Math.random().toString(36).substring(2, 8).toUpperCase();
      setCreatedMeetingId(meetingId);
      toast({
        title: "Meeting Scheduled!",
        description: `Meeting ID: ${meetingId} on ${new Date(scheduledDateTime).toLocaleString()}`,
        variant: "success",
      });
    }
    
    // Move to share link step
    setStep('share-link');
  };

  const copyMeetingLink = () => {
    if (createdMeetingId) {
      const link = `${window.location.origin}/meeting/${createdMeetingId}`;
      navigator.clipboard.writeText(link);
      toast({
        title: "Link Copied!",
        description: "Meeting link copied to clipboard",
        variant: "success",
      });
    }
  };

  const resetDialog = () => {
    setMeetingTitle('');
    setScheduledDate('');
    setScheduledTime('');
    setStep('options');
    setCreatedMeetingId(null);
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) resetDialog();
      onOpenChange(newOpen);
    }}>
      <DialogContent className="sm:max-w-[500px]">
        {step === 'options' ? (
          <>
            <DialogHeader>
              <DialogTitle>Start or Schedule a Meeting</DialogTitle>
              <DialogDescription>
                Choose how you want to create your meeting
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <Button
                onClick={() => setStep('schedule-form')}
                className="h-auto p-6 flex flex-col items-start space-y-3 border-2 hover:border-primary transition-all"
                variant="outline"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-lg">Schedule Meeting</div>
                    <div className="text-sm text-muted-foreground">
                      Plan ahead - Choose date and time
                    </div>
                  </div>
                </div>
              </Button>

              <Button
                onClick={handleStartNow}
                className="h-auto p-6 flex flex-col items-start space-y-3 border-2 hover:border-primary transition-all"
                variant="outline"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-lg">Start Now</div>
                    <div className="text-sm text-muted-foreground">
                      Instant meeting - Join immediately
                    </div>
                  </div>
                </div>
              </Button>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </>
        ) : step === 'schedule-form' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Schedule Your Meeting</span>
              </DialogTitle>
              <DialogDescription>
                Set up your meeting details
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">
                  Meeting Title (optional)
                </label>
                <Input
                  id="title"
                  placeholder="Team Standup"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="date" className="text-sm font-medium">
                    Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="date"
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="pl-10"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="time" className="text-sm font-medium">
                    Time *
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="time"
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center space-x-2 text-sm">
                  <Video className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Meeting link will be generated and can be shared with participants
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setStep('options')}>
                Back
              </Button>
              <Button onClick={handleScheduleMeeting}>
                Schedule Meeting
              </Button>
            </DialogFooter>
          </>
        ) : step === 'start-now-form' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Start Your Meeting</span>
              </DialogTitle>
              <DialogDescription>
                Enter a title for your instant meeting
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label htmlFor="start-title" className="text-sm font-medium">
                  Meeting Title (optional)
                </label>
                <Input
                  id="start-title"
                  placeholder="Quick Standup"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start space-x-3">
                  <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Instant Meeting</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      Click "Start Meeting" to begin immediately. No scheduling required!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setStep('options')}>
                Back
              </Button>
              <Button onClick={handleStartNowFinal} className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700">
                <Zap className="h-4 w-4 mr-2" />
                Start Meeting
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Share2 className="h-5 w-5" />
                <span>Share Your Meeting Link</span>
              </DialogTitle>
              <DialogDescription>
                Share the meeting link with participants
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center space-x-2 text-sm">
                  <Video className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Meeting link will be generated and can be shared with participants
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Input
                  value={`${window.location.origin}/meeting/${createdMeetingId}`}
                  readOnly
                />
                <Button onClick={copyMeetingLink}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
