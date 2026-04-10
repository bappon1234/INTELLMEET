import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  Monitor, 
  MonitorOff,
  MessageSquare,
  Users,
  MoreVertical,
  Send,
  Type
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Participant {
  id: string;
  name: string;
  isVideoOn: boolean;
  isAudioOn: boolean;
  isSpeaking: boolean;
  avatar?: string;
}

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: Date;
}

export default function MeetingRoomPage() {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  
  // State management
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([
    {
      id: '1',
      name: 'You',
      isVideoOn: true,
      isAudioOn: true,
      isSpeaking: false,
    },
    {
      id: '2',
      name: 'John Doe',
      isVideoOn: true,
      isAudioOn: true,
      isSpeaking: false,
    },
    {
      id: '3',
      name: 'Jane Smith',
      isVideoOn: true,
      isAudioOn: false,
      isSpeaking: true,
    },
  ]);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Initialize media stream
  useEffect(() => {
    const initMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing media devices:', error);
      }
    };

    initMedia();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioOn(audioTrack.enabled);
      }
    }
  };

  // Toggle screen sharing
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        
        if (localStream) {
          const screenTrack = screenStream.getVideoTracks()[0];
          const sender = localStream.getVideoTracks()[0];
          
          // In a real WebRTC implementation, you'd update the peer connection here
          screenTrack.onended = () => {
            setIsScreenSharing(false);
          };
          
          setIsScreenSharing(true);
        }
      } catch (error) {
        console.error('Error sharing screen:', error);
      }
    } else {
      // Stop screen sharing
      setIsScreenSharing(false);
    }
  };

  // Send chat message
  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const message: ChatMessage = {
        id: Date.now().toString(),
        userId: '1',
        userName: 'You',
        text: newMessage,
        timestamp: new Date(),
      };
      
      setChatMessages(prev => [...prev, message]);
      setNewMessage('');
      
      // Simulate typing indicator from other participants
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 2000);
      }, 1000);
    }
  };

  // Leave meeting
  const leaveMeeting = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    navigate('/dashboard');
  };

  // Scroll chat to bottom when new message arrives
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Video className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">IntellMeet</h1>
            <p className="text-xs text-muted-foreground">Meeting ID: {meetingId}</p>
          </div>
        </div>
        <Button variant="destructive" onClick={leaveMeeting}>
          <PhoneOff className="mr-2 h-4 w-4" />
          Leave Meeting
        </Button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Grid */}
        <div className="flex-1 p-4 overflow-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
            {participants.map((participant, index) => (
              <Card
                key={participant.id}
                className={cn(
                  "relative overflow-hidden bg-card border-2 transition-all duration-300",
                  participant.isSpeaking && "border-primary shadow-lg shadow-primary/20"
                )}
              >
                <div className="aspect-video bg-muted relative">
                  {participant.id === '1' ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className={cn(
                        "w-full h-full object-cover",
                        !isVideoOn && "hidden"
                      )}
                    />
                  ) : (
                    <video
                      ref={(el) => { remoteVideoRefs.current[index] = el; }}
                      autoPlay
                      playsInline
                      className={cn(
                        "w-full h-full object-cover",
                        !participant.isVideoOn && "hidden"
                      )}
                    />
                  )}
                  
                  {!participant.isVideoOn && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center">
                        <span className="text-2xl font-bold text-primary">
                          {participant.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Participant Info Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-white text-sm font-medium">
                          {participant.name}
                        </span>
                        {!participant.isAudioOn && (
                          <MicOff className="h-4 w-4 text-red-400" />
                        )}
                        {participant.isSpeaking && (
                          <div className="flex space-x-0.5">
                            <div className="w-1 h-3 bg-green-400 rounded-full animate-pulse" />
                            <div className="w-1 h-3 bg-green-400 rounded-full animate-pulse delay-75" />
                            <div className="w-1 h-3 bg-green-400 rounded-full animate-pulse delay-150" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <Card className="w-80 border-l rounded-none flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-semibold flex items-center space-x-2">
                <MessageSquare className="h-4 w-4" />
                <span>Chat</span>
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowChat(false)}
              >
                ×
              </Button>
            </div>
            
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex flex-col space-y-1",
                    message.userId === '1' && "items-end"
                  )}
                >
                  <div className="flex items-baseline space-x-2">
                    <span className="text-xs font-medium">
                      {message.userName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  <div
                    className={cn(
                      "px-3 py-2 rounded-lg max-w-[80%]",
                      message.userId === '1'
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    <p className="text-sm">{message.text}</p>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Type className="h-3 w-3 animate-pulse" />
                  <span className="text-xs">Someone is typing...</span>
                </div>
              )}
            </div>
            
            <form onSubmit={sendMessage} className="p-4 border-t">
              <div className="flex space-x-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Participants Sidebar */}
        {showParticipants && (
          <Card className="w-80 border-l rounded-none overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-semibold flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Participants ({participants.length})</span>
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowParticipants(false)}
              >
                ×
              </Button>
            </div>
            
            <div className="p-4 space-y-2">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {participant.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{participant.name}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        {participant.isAudioOn ? (
                          <Mic className="h-3 w-3 text-green-600" />
                        ) : (
                          <MicOff className="h-3 w-3 text-red-600" />
                        )}
                        {participant.isVideoOn ? (
                          <Video className="h-3 w-3 text-green-600" />
                        ) : (
                          <VideoOff className="h-3 w-3 text-red-600" />
                        )}
                      </div>
                    </div>
                  </div>
                  {participant.id !== '1' && (
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Control Bar */}
      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3">
        <div className="flex items-center justify-center space-x-4">
          <Button
            variant={isAudioOn ? "outline" : "destructive"}
            size="icon"
            onClick={toggleAudio}
            title={isAudioOn ? "Mute" : "Unmute"}
          >
            {isAudioOn ? (
              <Mic className="h-5 w-5" />
            ) : (
              <MicOff className="h-5 w-5" />
            )}
          </Button>
          
          <Button
            variant={isVideoOn ? "outline" : "destructive"}
            size="icon"
            onClick={toggleVideo}
            title={isVideoOn ? "Turn off camera" : "Turn on camera"}
          >
            {isVideoOn ? (
              <Video className="h-5 w-5" />
            ) : (
              <VideoOff className="h-5 w-5" />
            )}
          </Button>
          
          <Button
            variant={isScreenSharing ? "default" : "outline"}
            size="icon"
            onClick={toggleScreenShare}
            title={isScreenSharing ? "Stop sharing" : "Share screen"}
          >
            {isScreenSharing ? (
              <MonitorOff className="h-5 w-5" />
            ) : (
              <Monitor className="h-5 w-5" />
            )}
          </Button>
          
          <Button
            variant={showChat ? "default" : "outline"}
            size="icon"
            onClick={() => {
              setShowChat(!showChat);
              setShowParticipants(false);
            }}
            title="Chat"
          >
            <MessageSquare className="h-5 w-5" />
          </Button>
          
          <Button
            variant={showParticipants ? "default" : "outline"}
            size="icon"
            onClick={() => {
              setShowParticipants(!showParticipants);
              setShowChat(false);
            }}
            title="Participants"
          >
            <Users className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
