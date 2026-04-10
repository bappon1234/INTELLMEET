import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  MessageSquare,
  Users,
  Monitor,
  MonitorOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Participant {
  id: string;
  name: string;
  role: 'host' | 'admin' | 'member';
  isVideoOn: boolean;
  isAudioOn: boolean;
  avatar?: string;
}

export default function TeamMeetingRoomPage() {
  const navigate = useNavigate();
  const { teamId, meetingId } = useParams();

  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(true);

  const [participants] = useState<Participant[]>([
    { id: '1', name: 'You', role: 'host', isVideoOn: true, isAudioOn: true },
    { id: '2', name: 'John Doe', role: 'member', isVideoOn: true, isAudioOn: false },
    { id: '3', name: 'Jane Smith', role: 'admin', isVideoOn: false, isAudioOn: true },
  ]);

  const leaveMeeting = () => {
    navigate(`/teams/${teamId}`);
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      <header className="border-b bg-background/95 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Team Meeting Room</h1>
          <p className="text-xs text-muted-foreground">
            Team: {teamId} | Meeting: {meetingId}
          </p>
        </div>
        <Button variant="destructive" onClick={leaveMeeting}>
          <PhoneOff className="mr-2 h-4 w-4" />
          Leave
        </Button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-4 overflow-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {participants.map((participant) => (
              <Card key={participant.id} className="overflow-hidden">
                <div className="aspect-video bg-muted relative flex items-center justify-center">
                  {participant.isVideoOn ? (
                    <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                      <Video className="w-10 h-10 text-primary" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary">
                        {participant.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{participant.name}</p>
                        <p className="text-xs opacity-90">{participant.role}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!participant.isAudioOn && <MicOff className="h-4 w-4 text-red-400" />}
                        {!participant.isVideoOn && <VideoOff className="h-4 w-4 text-red-400" />}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {showParticipants && (
          <Card className="w-80 rounded-none border-l p-4 overflow-y-auto">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Participants ({participants.length})
            </h2>

            <div className="space-y-3">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between border rounded-lg p-3"
                >
                  <div>
                    <p className="font-medium text-sm">{participant.name}</p>
                    <p className="text-xs text-muted-foreground">{participant.role}</p>
                  </div>
                  <div className="flex gap-2">
                    {participant.isAudioOn ? (
                      <Mic className="h-4 w-4 text-green-600" />
                    ) : (
                      <MicOff className="h-4 w-4 text-red-600" />
                    )}
                    {participant.isVideoOn ? (
                      <Video className="h-4 w-4 text-green-600" />
                    ) : (
                      <VideoOff className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {showChat && (
          <Card className="w-80 rounded-none border-l p-4">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Team Chat
            </h2>
            <div className="text-sm text-muted-foreground">Realtime chat yahan aayega.</div>
          </Card>
        )}
      </div>

      <div className="border-t bg-background/95 px-4 py-3">
        <div className="flex items-center justify-center gap-4">
          <Button
            variant={isAudioOn ? 'outline' : 'destructive'}
            size="icon"
            onClick={() => setIsAudioOn((prev) => !prev)}
          >
            {isAudioOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>

          <Button
            variant={isVideoOn ? 'outline' : 'destructive'}
            size="icon"
            onClick={() => setIsVideoOn((prev) => !prev)}
          >
            {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>

          <Button
            variant={isScreenSharing ? 'default' : 'outline'}
            size="icon"
            onClick={() => setIsScreenSharing((prev) => !prev)}
          >
            {isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
          </Button>

          <Button
            variant={showChat ? 'default' : 'outline'}
            size="icon"
            onClick={() => {
              setShowChat((prev) => !prev);
              setShowParticipants(false);
            }}
          >
            <MessageSquare className="h-5 w-5" />
          </Button>

          <Button
            variant={showParticipants ? 'default' : 'outline'}
            size="icon"
            onClick={() => {
              setShowParticipants((prev) => !prev);
              setShowChat(false);
            }}
          >
            <Users className="h-5 w-5" />
          </Button>

          <Button variant="destructive" onClick={leaveMeeting}>
            <PhoneOff className="mr-2 h-4 w-4" />
            End / Leave
          </Button>
        </div>
      </div>
    </div>
  );
}