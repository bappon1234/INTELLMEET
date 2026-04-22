import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
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
  Type,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Participant {
  id: string;
  name: string;
  isVideoOn: boolean;
  isAudioOn: boolean;
  isSpeaking: boolean;
  stream?: MediaStream;
}

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
}

interface SignalOfferPayload {
  from: string;
  sdp: RTCSessionDescriptionInit;
  name?: string;
}

interface SignalAnswerPayload {
  from: string;
  sdp: RTCSessionDescriptionInit;
}

interface SignalIcePayload {
  from: string;
  candidate: RTCIceCandidateInit;
}

const SOCKET_URL = 'http://localhost:5000'; // apne backend socket server ka URL do
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export default function MeetingRoomPage() {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();

  const myName = useMemo(() => {
    return localStorage.getItem('userName') || 'You';
  }, []);

  const socketRef = useRef<Socket | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const remoteVideoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const updateParticipant = (id: string, updates: Partial<Participant>) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const addOrUpdateParticipant = (participant: Participant) => {
    setParticipants((prev) => {
      const exists = prev.find((p) => p.id === participant.id);
      if (exists) {
        return prev.map((p) =>
          p.id === participant.id ? { ...p, ...participant } : p
        );
      }
      return [...prev, participant];
    });
  };

  const removeParticipant = (id: string) => {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
  };

  const attachLocalStream = () => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  };

  const attachRemoteStreamToVideo = (userId: string, stream: MediaStream) => {
    const videoEl = remoteVideoRefs.current[userId];
    if (videoEl && videoEl.srcObject !== stream) {
      videoEl.srcObject = stream;
    }
  };

  const createPeerConnection = (remoteUserId: string, remoteUserName?: string) => {
    const existing = peersRef.current.get(remoteUserId);
    if (existing) return existing;

    const pc = new RTCPeerConnection(ICE_SERVERS);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current as MediaStream);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', {
          roomId: meetingId,
          to: remoteUserId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      let stream = remoteStreamsRef.current.get(remoteUserId);

      if (!stream) {
        stream = new MediaStream();
        remoteStreamsRef.current.set(remoteUserId, stream);
      }

      event.streams[0].getTracks().forEach((track) => {
        const alreadyExists = stream!
          .getTracks()
          .some((t) => t.id === track.id);

        if (!alreadyExists) {
          stream!.addTrack(track);
        }
      });

      addOrUpdateParticipant({
        id: remoteUserId,
        name: remoteUserName || `User ${remoteUserId.slice(0, 4)}`,
        isVideoOn: stream.getVideoTracks().some((t) => t.enabled),
        isAudioOn: stream.getAudioTracks().some((t) => t.enabled),
        isSpeaking: false,
        stream,
      });

      attachRemoteStreamToVideo(remoteUserId, stream);
    };

    pc.onconnectionstatechange = () => {
      if (
        pc.connectionState === 'failed' ||
        pc.connectionState === 'disconnected' ||
        pc.connectionState === 'closed'
      ) {
        peersRef.current.delete(remoteUserId);
        remoteStreamsRef.current.delete(remoteUserId);
        removeParticipant(remoteUserId);
      }
    };

    peersRef.current.set(remoteUserId, pc);
    return pc;
  };

  const createOffer = async (remoteUserId: string, remoteUserName?: string) => {
    try {
      const pc = createPeerConnection(remoteUserId, remoteUserName);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socketRef.current?.emit('offer', {
        roomId: meetingId,
        to: remoteUserId,
        sdp: offer,
      });
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  const handleIncomingOffer = async ({ from, sdp, name }: SignalOfferPayload) => {
    try {
      const pc = createPeerConnection(from, name);
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socketRef.current?.emit('answer', {
        roomId: meetingId,
        to: from,
        sdp: answer,
      });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  const handleIncomingAnswer = async ({ from, sdp }: SignalAnswerPayload) => {
    try {
      const pc = peersRef.current.get(from);
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  };

  const handleIncomingIce = async ({ from, candidate }: SignalIcePayload) => {
    try {
      const pc = peersRef.current.get(from);
      if (!pc || !candidate) return;
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  };

  const replaceVideoTrackForAllPeers = async (newTrack: MediaStreamTrack) => {
    for (const [, pc] of peersRef.current) {
      const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
      if (sender) {
        await sender.replaceTrack(newTrack);
      }
    }
  };

  const initLocalMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localStreamRef.current = stream;
      attachLocalStream();

      addOrUpdateParticipant({
        id: 'local',
        name: myName,
        isVideoOn: true,
        isAudioOn: true,
        isSpeaking: false,
        stream,
      });
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setIsVideoOn(false);
      setIsAudioOn(false);
    }
  };

  const initSocket = () => {
    if (!meetingId) return;

    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-room', {
        roomId: meetingId,
        name: myName,
      });
    });

    socket.on(
      'existing-users',
      (users: Array<{ socketId: string; name: string }>) => {
        users.forEach((user) => {
          addOrUpdateParticipant({
            id: user.socketId,
            name: user.name,
            isVideoOn: true,
            isAudioOn: true,
            isSpeaking: false,
          });

          createOffer(user.socketId, user.name);
        });
      }
    );

    socket.on(
      'user-joined',
      (user: { socketId: string; name: string }) => {
        addOrUpdateParticipant({
          id: user.socketId,
          name: user.name,
          isVideoOn: true,
          isAudioOn: true,
          isSpeaking: false,
        });
      }
    );

    socket.on('offer', handleIncomingOffer);
    socket.on('answer', handleIncomingAnswer);
    socket.on('ice-candidate', handleIncomingIce);

    socket.on('user-left', (userId: string) => {
      const pc = peersRef.current.get(userId);
      if (pc) {
        pc.close();
      }
      peersRef.current.delete(userId);
      remoteStreamsRef.current.delete(userId);
      removeParticipant(userId);
    });

    socket.on('chat-message', (message: ChatMessage) => {
      setChatMessages((prev) => [...prev, message]);
    });

    socket.on('typing', ({ userId }: { userId: string }) => {
      if (userId === socket.id) return;
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 1200);
    });

    socket.on(
      'media-state-changed',
      ({
        userId,
        isVideoOn,
        isAudioOn,
      }: {
        userId: string;
        isVideoOn: boolean;
        isAudioOn: boolean;
      }) => {
        updateParticipant(userId, { isVideoOn, isAudioOn });
      }
    );
  };

  useEffect(() => {
    const start = async () => {
      await initLocalMedia();
      initSocket();
    };

    start();

    return () => {
      socketRef.current?.disconnect();

      peersRef.current.forEach((pc) => pc.close());
      peersRef.current.clear();
      remoteStreamsRef.current.clear();

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [meetingId]);

  useEffect(() => {
    attachLocalStream();
  }, [localVideoRef.current]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, isTyping]);

  useEffect(() => {
    participants.forEach((participant) => {
      if (participant.id !== 'local' && participant.stream) {
        attachRemoteStreamToVideo(participant.id, participant.stream);
      }
    });
  }, [participants]);

  const toggleVideo = () => {
    const stream = localStreamRef.current;
    if (!stream) return;

    const track = stream.getVideoTracks()[0];
    if (!track) return;

    track.enabled = !track.enabled;
    setIsVideoOn(track.enabled);

    updateParticipant('local', { isVideoOn: track.enabled });

    socketRef.current?.emit('media-state-changed', {
      roomId: meetingId,
      isVideoOn: track.enabled,
      isAudioOn,
    });
  };

  const toggleAudio = () => {
    const stream = localStreamRef.current;
    if (!stream) return;

    const track = stream.getAudioTracks()[0];
    if (!track) return;

    track.enabled = !track.enabled;
    setIsAudioOn(track.enabled);

    updateParticipant('local', { isAudioOn: track.enabled });

    socketRef.current?.emit('media-state-changed', {
      roomId: meetingId,
      isVideoOn,
      isAudioOn: track.enabled,
    });
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });

        const screenTrack = screenStream.getVideoTracks()[0];
        if (!screenTrack || !localStreamRef.current) return;

        const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];

        await replaceVideoTrackForAllPeers(screenTrack);

        localStreamRef.current.removeTrack(oldVideoTrack);
        oldVideoTrack.stop();
        localStreamRef.current.addTrack(screenTrack);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }

        screenTrack.onended = async () => {
          try {
            const camStream = await navigator.mediaDevices.getUserMedia({
              video: true,
            });
            const camTrack = camStream.getVideoTracks()[0];
            if (!camTrack || !localStreamRef.current) return;

            await replaceVideoTrackForAllPeers(camTrack);

            const currentTracks = localStreamRef.current.getVideoTracks();
            currentTracks.forEach((t) => {
              localStreamRef.current?.removeTrack(t);
              t.stop();
            });

            localStreamRef.current.addTrack(camTrack);

            if (localVideoRef.current) {
              localVideoRef.current.srcObject = localStreamRef.current;
            }

            setIsScreenSharing(false);
          } catch (err) {
            console.error('Error restoring camera after screen share:', err);
            setIsScreenSharing(false);
          }
        };

        setIsScreenSharing(true);
      } else {
        const currentScreenTrack = localStreamRef.current?.getVideoTracks()[0];
        if (currentScreenTrack) {
          currentScreenTrack.stop();
        }
        setIsScreenSharing(false);
      }
    } catch (error) {
      console.error('Error during screen sharing:', error);
    }
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socketRef.current) return;

    const message: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      userId: socketRef.current.id || 'local',
      userName: myName,
      text: newMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    socketRef.current.emit('chat-message', {
      roomId: meetingId,
      message,
    });

    setChatMessages((prev) => [...prev, message]);
    setNewMessage('');
  };

  const handleTyping = (value: string) => {
    setNewMessage(value);
    socketRef.current?.emit('typing', {
      roomId: meetingId,
    });
  };

  const leaveMeeting = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    peersRef.current.forEach((pc) => pc.close());
    peersRef.current.clear();

    socketRef.current?.emit('leave-room', { roomId: meetingId });
    socketRef.current?.disconnect();

    navigate('/dashboard');
  };

  const remoteParticipants = participants.filter((p) => p.id !== 'local');
  const allParticipants = participants;

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Video className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">IntellMeet</h1>
            <p className="text-xs text-muted-foreground">
              Meeting ID: {meetingId}
            </p>
          </div>
        </div>

        <Button variant="destructive" onClick={leaveMeeting}>
          <PhoneOff className="mr-2 h-4 w-4" />
          Leave Meeting
        </Button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-4 overflow-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
            {/* Local video */}
            <Card
              className={cn(
                'relative overflow-hidden bg-card border-2 transition-all duration-300'
              )}
            >
              <div className="aspect-video bg-muted relative">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={cn(
                    'w-full h-full object-cover',
                    !isVideoOn && 'hidden'
                  )}
                />

                {!isVideoOn && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary">
                        {myName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-white text-sm font-medium">
                        {myName} (You)
                      </span>
                      {!isAudioOn && (
                        <MicOff className="h-4 w-4 text-red-400" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Remote videos */}
            {remoteParticipants.map((participant) => (
              <Card
                key={participant.id}
                className={cn(
                  'relative overflow-hidden bg-card border-2 transition-all duration-300',
                  participant.isSpeaking &&
                    'border-primary shadow-lg shadow-primary/20'
                )}
              >
                <div className="aspect-video bg-muted relative">
                  <video
                    ref={(el) => {
                      remoteVideoRefs.current[participant.id] = el;
                      if (el && participant.stream) {
                        el.srcObject = participant.stream;
                      }
                    }}
                    autoPlay
                    playsInline
                    className={cn(
                      'w-full h-full object-cover',
                      !participant.isVideoOn && 'hidden'
                    )}
                  />

                  {!participant.isVideoOn && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center">
                        <span className="text-2xl font-bold text-primary">
                          {participant.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  )}

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

            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4"
            >
              {chatMessages.map((message) => {
                const ownMessage =
                  message.userId === socketRef.current?.id ||
                  message.userName === myName;

                return (
                  <div
                    key={message.id}
                    className={cn(
                      'flex flex-col space-y-1',
                      ownMessage && 'items-end'
                    )}
                  >
                    <div className="flex items-baseline space-x-2">
                      <span className="text-xs font-medium">
                        {message.userName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div
                      className={cn(
                        'px-3 py-2 rounded-lg max-w-[80%]',
                        ownMessage
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      <p className="text-sm">{message.text}</p>
                    </div>
                  </div>
                );
              })}

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
                  onChange={(e) => handleTyping(e.target.value)}
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

        {showParticipants && (
          <Card className="w-80 border-l rounded-none overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-semibold flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Participants ({allParticipants.length})</span>
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
              {allParticipants.map((participant) => (
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

                  {participant.id !== 'local' && (
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

      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3">
        <div className="flex items-center justify-center space-x-4">
          <Button
            variant={isAudioOn ? 'outline' : 'destructive'}
            size="icon"
            onClick={toggleAudio}
            title={isAudioOn ? 'Mute' : 'Unmute'}
          >
            {isAudioOn ? (
              <Mic className="h-5 w-5" />
            ) : (
              <MicOff className="h-5 w-5" />
            )}
          </Button>

          <Button
            variant={isVideoOn ? 'outline' : 'destructive'}
            size="icon"
            onClick={toggleVideo}
            title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
          >
            {isVideoOn ? (
              <Video className="h-5 w-5" />
            ) : (
              <VideoOff className="h-5 w-5" />
            )}
          </Button>

          <Button
            variant={isScreenSharing ? 'default' : 'outline'}
            size="icon"
            onClick={toggleScreenShare}
            title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
          >
            {isScreenSharing ? (
              <MonitorOff className="h-5 w-5" />
            ) : (
              <Monitor className="h-5 w-5" />
            )}
          </Button>

          <Button
            variant={showChat ? 'default' : 'outline'}
            size="icon"
            onClick={() => {
              setShowChat((prev) => !prev);
              setShowParticipants(false);
            }}
            title="Chat"
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
            title="Participants"
          >
            <Users className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}