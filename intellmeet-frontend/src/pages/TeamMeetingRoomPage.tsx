import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
  Send,
  Type,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Participant {
  id: string;
  userId?: string;
  name: string;
  role: 'host' | 'admin' | 'member';
  isVideoOn: boolean;
  isAudioOn: boolean;
  isSpeaking?: boolean;
  stream?: MediaStream;
}

interface ChatMessage {
  _id?: string;
  id?: string;
  sender: string;
  senderName: string;
  message: string;
  createdAt: string;
}

const SOCKET_URL = 'http://localhost:5000';

const rtcConfig: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export default function TeamMeetingRoomPage() {
  const navigate = useNavigate();
  const { teamId, meetingId } = useParams();

  const user = useMemo(() => {
    const raw = localStorage.getItem('user');
    return raw
      ? JSON.parse(raw)
      : {
          _id: 'guest-user',
          name: 'Guest',
          role: 'member',
        };
  }, []);

  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(true);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  const myLocalId = 'local-user';

  const upsertParticipant = (participant: Participant) => {
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

  const removeParticipant = (socketId: string) => {
    setParticipants((prev) => prev.filter((p) => p.id !== socketId));
  };

  const attachLocalStream = () => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  };

  const attachRemoteStream = (socketId: string, stream: MediaStream) => {
    const el = remoteVideoRefs.current[socketId];
    if (el && el.srcObject !== stream) {
      el.srcObject = stream;
    }
  };

  const createPeerConnection = (remoteSocketId: string, remoteName = 'Member') => {
    const existing = peersRef.current.get(remoteSocketId);
    if (existing) return existing;

    const pc = new RTCPeerConnection(rtcConfig);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current as MediaStream);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current && meetingId) {
        socketRef.current.emit('ice-candidate', {
          meetingId,
          to: remoteSocketId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      let stream = remoteStreamsRef.current.get(remoteSocketId);

      if (!stream) {
        stream = new MediaStream();
        remoteStreamsRef.current.set(remoteSocketId, stream);
      }

      event.streams[0].getTracks().forEach((track) => {
        const exists = stream!.getTracks().some((t) => t.id === track.id);
        if (!exists) stream!.addTrack(track);
      });

      upsertParticipant({
        id: remoteSocketId,
        name: remoteName,
        role: 'member',
        isVideoOn: stream.getVideoTracks().some((t) => t.enabled),
        isAudioOn: stream.getAudioTracks().some((t) => t.enabled),
        stream,
      });

      attachRemoteStream(remoteSocketId, stream);
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === 'failed' || state === 'closed' || state === 'disconnected') {
        peersRef.current.delete(remoteSocketId);
        remoteStreamsRef.current.delete(remoteSocketId);
        removeParticipant(remoteSocketId);
      }
    };

    peersRef.current.set(remoteSocketId, pc);
    return pc;
  };

  const createOffer = async (remoteSocketId: string, remoteName?: string) => {
    try {
      const pc = createPeerConnection(remoteSocketId, remoteName);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socketRef.current?.emit('offer', {
        meetingId,
        to: remoteSocketId,
        sdp: offer,
      });
    } catch (err) {
      console.error('createOffer error:', err);
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

      upsertParticipant({
        id: myLocalId,
        userId: user._id,
        name: user.name || 'You',
        role: user.role || 'member',
        isVideoOn: true,
        isAudioOn: true,
        stream,
      });
    } catch (err) {
      console.error('media access error:', err);
      setIsVideoOn(false);
      setIsAudioOn(false);
    }
  };

  const fetchOldMessages = async () => {
    try {
      if (!meetingId) return;
      const res = await fetch(`http://localhost:5000/api/meetings/${meetingId}/messages`, {
        credentials: 'include',
      });

      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) {
        setMessages(data);
      } else if (Array.isArray(data.messages)) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('fetchOldMessages error:', err);
    }
  };

  useEffect(() => {
    const start = async () => {
      await initLocalMedia();
      await fetchOldMessages();

      const socket = io(SOCKET_URL, {
        transports: ['websocket'],
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        socket.emit('join-user-room', { userId: user._id });

        socket.emit('join-meeting', {
          meetingId,
          userId: user._id,
          name: user.name,
        });
      });

      socket.on(
        'existing-users',
        (users: Array<{ socketId: string; userId?: string; name: string }>) => {
          users.forEach((u) => {
            upsertParticipant({
              id: u.socketId,
              userId: u.userId,
              name: u.name,
              role: 'member',
              isVideoOn: true,
              isAudioOn: true,
            });

            createOffer(u.socketId, u.name);
          });
        }
      );

      socket.on(
        'user-joined',
        (u: { socketId: string; userId?: string; name: string }) => {
          upsertParticipant({
            id: u.socketId,
            userId: u.userId,
            name: u.name,
            role: 'member',
            isVideoOn: true,
            isAudioOn: true,
          });
        }
      );

      socket.on(
        'offer',
        async ({
          from,
          sdp,
          name,
        }: {
          from: string;
          sdp: RTCSessionDescriptionInit;
          name: string;
        }) => {
          try {
            const pc = createPeerConnection(from, name);
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socket.emit('answer', {
              meetingId,
              to: from,
              sdp: answer,
            });
          } catch (err) {
            console.error('offer handler error:', err);
          }
        }
      );

      socket.on(
        'answer',
        async ({
          from,
          sdp,
        }: {
          from: string;
          sdp: RTCSessionDescriptionInit;
        }) => {
          try {
            const pc = peersRef.current.get(from);
            if (!pc) return;
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          } catch (err) {
            console.error('answer handler error:', err);
          }
        }
      );

      socket.on(
        'ice-candidate',
        async ({
          from,
          candidate,
        }: {
          from: string;
          candidate: RTCIceCandidateInit;
        }) => {
          try {
            const pc = peersRef.current.get(from);
            if (!pc) return;
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.error('ice handler error:', err);
          }
        }
      );

      socket.on('receive-message', (msg: ChatMessage) => {
        setMessages((prev) => [...prev, msg]);
      });

      socket.on('user-typing', ({ userId }: { userId: string }) => {
        if (userId === user._id) return;
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
          setParticipants((prev) =>
            prev.map((p) =>
              p.id === userId ? { ...p, isVideoOn, isAudioOn } : p
            )
          );
        }
      );

      socket.on('user-left', (socketId: string) => {
        const pc = peersRef.current.get(socketId);
        if (pc) pc.close();
        peersRef.current.delete(socketId);
        remoteStreamsRef.current.delete(socketId);
        removeParticipant(socketId);
      });
    };

    start();

    return () => {
      if (meetingId && socketRef.current) {
        socketRef.current.emit('leave-meeting', { meetingId });
      }

      socketRef.current?.disconnect();

      peersRef.current.forEach((pc) => pc.close());
      peersRef.current.clear();
      remoteStreamsRef.current.clear();

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [meetingId, user._id, user.name]);

  useEffect(() => {
    attachLocalStream();
  }, [localVideoRef.current]);

  useEffect(() => {
    participants.forEach((p) => {
      if (p.id !== myLocalId && p.stream) {
        attachRemoteStream(p.id, p.stream);
      }
    });
  }, [participants]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const toggleAudio = () => {
    const stream = localStreamRef.current;
    if (!stream) return;

    const track = stream.getAudioTracks()[0];
    if (!track) return;

    track.enabled = !track.enabled;
    const next = track.enabled;
    setIsAudioOn(next);

    setParticipants((prev) =>
      prev.map((p) => (p.id === myLocalId ? { ...p, isAudioOn: next } : p))
    );

    socketRef.current?.emit('media-state-changed', {
      meetingId,
      isVideoOn,
      isAudioOn: next,
    });
  };

  const toggleVideo = () => {
    const stream = localStreamRef.current;
    if (!stream) return;

    const track = stream.getVideoTracks()[0];
    if (!track) return;

    track.enabled = !track.enabled;
    const next = track.enabled;
    setIsVideoOn(next);

    setParticipants((prev) =>
      prev.map((p) => (p.id === myLocalId ? { ...p, isVideoOn: next } : p))
    );

    socketRef.current?.emit('media-state-changed', {
      meetingId,
      isVideoOn: next,
      isAudioOn,
    });
  };

  const replaceVideoTrackForAllPeers = async (newTrack: MediaStreamTrack) => {
    for (const [, pc] of peersRef.current) {
      const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
      if (sender) {
        await sender.replaceTrack(newTrack);
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });

        const screenTrack = screenStream.getVideoTracks()[0];
        if (!screenTrack || !localStreamRef.current) return;

        await replaceVideoTrackForAllPeers(screenTrack);

        const oldVideoTracks = localStreamRef.current.getVideoTracks();
        oldVideoTracks.forEach((t) => {
          localStreamRef.current?.removeTrack(t);
          t.stop();
        });

        localStreamRef.current.addTrack(screenTrack);
        attachLocalStream();
        setIsScreenSharing(true);

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
            attachLocalStream();
            setIsScreenSharing(false);
          } catch (err) {
            console.error('restore camera error:', err);
            setIsScreenSharing(false);
          }
        };
      } else {
        const track = localStreamRef.current?.getVideoTracks()[0];
        if (track) track.stop();
      }
    } catch (err) {
      console.error('screen share error:', err);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socketRef.current || !meetingId) return;

    socketRef.current.emit('send-message', {
      meetingId,
      sender: user._id,
      senderName: user.name,
      message: newMessage.trim(),
    });

    setNewMessage('');
  };

  const handleTyping = (value: string) => {
    setNewMessage(value);
    socketRef.current?.emit('typing', {
      meetingId,
      userId: user._id,
      name: user.name,
    });
  };

  const leaveMeeting = () => {
    if (meetingId) {
      socketRef.current?.emit('leave-meeting', { meetingId });
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    peersRef.current.forEach((pc) => pc.close());
    socketRef.current?.disconnect();

    navigate(`/teams/${teamId}`);
  };

  const localParticipant = participants.find((p) => p.id === myLocalId);
  const remoteParticipants = participants.filter((p) => p.id !== myLocalId);

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
            {localParticipant && (
              <Card key={localParticipant.id} className="overflow-hidden">
                <div className="aspect-video bg-muted relative flex items-center justify-center">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={cn(
                      'w-full h-full object-cover',
                      !localParticipant.isVideoOn && 'hidden'
                    )}
                  />

                  {!localParticipant.isVideoOn && (
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary">
                        {localParticipant.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          {localParticipant.name} (You)
                        </p>
                        <p className="text-xs opacity-90">{localParticipant.role}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!localParticipant.isAudioOn && (
                          <MicOff className="h-4 w-4 text-red-400" />
                        )}
                        {!localParticipant.isVideoOn && (
                          <VideoOff className="h-4 w-4 text-red-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {remoteParticipants.map((participant) => (
              <Card key={participant.id} className="overflow-hidden">
                <div className="aspect-video bg-muted relative flex items-center justify-center">
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
                        {!participant.isAudioOn && (
                          <MicOff className="h-4 w-4 text-red-400" />
                        )}
                        {!participant.isVideoOn && (
                          <VideoOff className="h-4 w-4 text-red-400" />
                        )}
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
          <Card className="w-80 rounded-none border-l flex flex-col">
            <div className="p-4 border-b">
              <h2 className="font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Team Chat
              </h2>
            </div>

            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, index) => {
                const own = msg.sender === user._id;
                return (
                  <div
                    key={msg._id || msg.id || index}
                    className={cn('flex flex-col gap-1', own && 'items-end')}
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-medium">{msg.senderName}</span>
                      <span className="text-muted-foreground">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div
                      className={cn(
                        'px-3 py-2 rounded-lg max-w-[85%] text-sm',
                        own ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      )}
                    >
                      {msg.message}
                    </div>
                  </div>
                );
              })}

              {isTyping && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Type className="h-3 w-3 animate-pulse" />
                  Someone is typing...
                </div>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => handleTyping(e.target.value)}
                  placeholder="Type a message..."
                />
                <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>

      <div className="border-t bg-background/95 px-4 py-3">
        <div className="flex items-center justify-center gap-4">
          <Button
            variant={isAudioOn ? 'outline' : 'destructive'}
            size="icon"
            onClick={toggleAudio}
          >
            {isAudioOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>

          <Button
            variant={isVideoOn ? 'outline' : 'destructive'}
            size="icon"
            onClick={toggleVideo}
          >
            {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>

          <Button
            variant={isScreenSharing ? 'default' : 'outline'}
            size="icon"
            onClick={toggleScreenShare}
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