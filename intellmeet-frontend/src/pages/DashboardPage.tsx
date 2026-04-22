import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMeetingsApi, createMeetingApi, joinMeetingApi } from '@/lib/meetingApi';
import {
  getMyTeamMeetingsApi,
  joinTeamMeetingApi,
  getMyPendingInvitesApi,
  acceptInviteApi,
} from '@/lib/teamApi';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import MeetingCreationDialog from '@/components/MeetingCreationDialog';
import {
  Video,
  Calendar,
  Clock,
  Users,
  LogOut,
  LayoutDashboard,
  Copy,
  Check,
  Zap,
} from 'lucide-react';

interface BackendUser {
  _id: string;
  name: string;
  email?: string;
  avatar?: string;
}

interface BackendMeeting {
  _id: string;
  title: string;
  date: string;
  meetingId: string;
  status?: 'scheduled' | 'instant' | 'completed';
  participants?: BackendUser[] | string[];
  hostId?: BackendUser | string;
}

interface TeamInfo {
  _id: string;
  name: string;
}

interface TeamMeeting {
  _id: string;
  title: string;
  date: string;
  meetingId: string;
  status?: 'scheduled' | 'instant' | 'completed';
  participants?: BackendUser[] | string[];
  hostId?: BackendUser | string;
  teamId?: TeamInfo | string;
}

interface PendingInvite {
  _id: string;
  token: string;
  status: 'pending' | 'accepted' | 'rejected';
  team: {
    _id: string;
    name: string;
  };
  invitedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [meetingLink, setMeetingLink] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const [meetings, setMeetings] = useState<BackendMeeting[]>([]);
  const [teamMeetings, setTeamMeetings] = useState<TeamMeeting[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);

  const [loadingMeetings, setLoadingMeetings] = useState(true);
  const [loadingTeamMeetings, setLoadingTeamMeetings] = useState(true);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [joiningInviteId, setJoiningInviteId] = useState<string | null>(null);
  const [joiningTeamMeetingId, setJoiningTeamMeetingId] = useState<string | null>(null);

  const fetchMeetings = async () => {
    try {
      setLoadingMeetings(true);
      const data = await getMeetingsApi();
      setMeetings(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('fetchMeetings error:', error);
      toast({
        title: 'Failed to load meetings',
        description:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          'Could not fetch meetings from server',
        variant: 'destructive',
      });
    } finally {
      setLoadingMeetings(false);
    }
  };

  const fetchTeamMeetings = async () => {
    try {
      setLoadingTeamMeetings(true);
      const data = await getMyTeamMeetingsApi();
      setTeamMeetings(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('fetchTeamMeetings error:', error);
    } finally {
      setLoadingTeamMeetings(false);
    }
  };

  const fetchPendingInvites = async () => {
    try {
      setLoadingInvites(true);
      const data = await getMyPendingInvitesApi();
      setPendingInvites(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('fetchPendingInvites error:', error);
    } finally {
      setLoadingInvites(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
    fetchTeamMeetings();
    fetchPendingInvites();
  }, []);

  const now = new Date();

  const upcomingMeetings = meetings
    .filter((meeting) => new Date(meeting.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const previousMeetings = meetings
    .filter((meeting) => new Date(meeting.date) < now)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const addScheduledMeeting = async (title: string, scheduledAt: string) => {
    try {
      const meeting = await createMeetingApi({
        title: title || 'Scheduled Meeting',
        date: scheduledAt,
        status: 'scheduled',
      });

      setMeetings((prev) => [...prev, meeting]);

      toast({
        title: 'Meeting Scheduled!',
        description: `${meeting.title} on ${new Date(meeting.date).toLocaleString()}`,
        variant: 'success',
      });

      return meeting.meetingId;
    } catch (error: any) {
      console.error('addScheduledMeeting error:', error);
      toast({
        title: 'Schedule Failed',
        description:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          'Could not schedule meeting',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const startInstantMeeting = async (title?: string) => {
    try {
      const meeting = await createMeetingApi({
        title: title || 'Instant Meeting',
        date: new Date().toISOString(),
        status: 'instant',
      });

      setMeetings((prev) => [...prev, meeting]);

      toast({
        title: 'Meeting Started!',
        description: `Meeting ID: ${meeting.meetingId}`,
        variant: 'success',
      });

      navigate(`/meeting/${meeting.meetingId}`);
    } catch (error: any) {
      console.error('startInstantMeeting error:', error);
      toast({
        title: 'Start Failed',
        description:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          'Could not start meeting',
        variant: 'destructive',
      });
    }
  };

  const handleAcceptInvite = async (inviteId: string) => {
    try {
      setJoiningInviteId(inviteId);

      await acceptInviteApi(inviteId);

      toast({
        title: 'Team Joined',
        description: 'You joined the team successfully',
        variant: 'success',
      });

      await fetchPendingInvites();
      await fetchTeamMeetings();
    } catch (error: any) {
      toast({
        title: 'Join failed',
        description: error?.response?.data?.error || 'Could not join team',
        variant: 'destructive',
      });
    } finally {
      setJoiningInviteId(null);
    }
  };

  const handleJoinMeeting = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!meetingLink.trim()) return;

    try {
      const input = meetingLink.trim();

      if (input.includes('/join/')) {
        const token = input.split('/join/').pop();
        if (token) {
          navigate(`/join/${token}`);
          setMeetingLink('');
          return;
        }
      }

      if (input.includes('/meeting/')) {
        const meetingId = input.split('/meeting/').pop();
        if (meetingId) {
          const meeting = await joinMeetingApi(meetingId.trim());

          toast({
            title: 'Meeting Joined!',
            description: `${meeting.title || 'Meeting'} opened successfully`,
            variant: 'success',
          });

          navigate(`/meeting/${meeting.meetingId}`);
          setMeetingLink('');
          return;
        }
      }

      const meeting = await joinMeetingApi(input);

      toast({
        title: 'Meeting Joined!',
        description: `${meeting.title || 'Meeting'} opened successfully`,
        variant: 'success',
      });

      navigate(`/meeting/${meeting.meetingId}`);
      setMeetingLink('');
    } catch (error: any) {
      console.error('handleJoinMeeting error:', error);
      toast({
        title: 'Join Failed',
        description:
          error?.response?.data?.msg ||
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          'Invalid meeting link or meeting not found',
        variant: 'destructive',
      });
    }
  };

  const handleJoinUpcomingMeeting = async (meetingId: string) => {
    try {
      const meeting = await joinMeetingApi(meetingId);

      toast({
        title: 'Meeting Joined!',
        description: `${meeting.title || 'Meeting'} opened successfully`,
        variant: 'success',
      });

      navigate(`/meeting/${meeting.meetingId}`);
    } catch (error: any) {
      toast({
        title: 'Join failed',
        description: error?.response?.data?.error || 'Could not join meeting',
        variant: 'destructive',
      });
    }
  };

  const handleJoinTeamMeeting = async (meetingId: string) => {
    try {
      setJoiningTeamMeetingId(meetingId);

      const meeting = await joinTeamMeetingApi(meetingId);

      toast({
        title: 'Meeting Joined!',
        description: `${meeting.title || 'Team meeting'} opened successfully`,
        variant: 'success',
      });

      navigate(`/meeting/${meeting.meetingId}`);
    } catch (error: any) {
      toast({
        title: 'Join Failed',
        description: error?.response?.data?.error || 'Could not join team meeting',
        variant: 'destructive',
      });
    } finally {
      setJoiningTeamMeetingId(null);
    }
  };

  const copyMeetingLink = (meetingId: string) => {
    const link = `${window.location.origin}/meeting/${meetingId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(meetingId);

    toast({
      title: 'Link Copied!',
      description: 'Meeting link copied to clipboard',
    });

    setTimeout(() => setCopiedId(null), 2000);
  };

  const getParticipantCount = (participants?: BackendUser[] | string[]) => {
    if (!participants) return 0;
    return participants.length;
  };

  const getTeamName = (teamId?: TeamInfo | string) => {
    if (!teamId) return 'Team Meeting';
    if (typeof teamId === 'string') return 'Team Meeting';
    return teamId.name || 'Team Meeting';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => navigate('/dashboard')}
          >
            <div className="p-2 bg-primary/10 rounded-lg">
              <Video className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">IntellMeet</h1>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/')}>
              Home
            </Button>

            <Button variant="ghost" onClick={() => navigate('/teams')}>
              Teams
            </Button>

            <div
              className="flex items-center space-x-2 cursor-pointer hover:bg-accent px-3 py-2 rounded-lg transition"
              onClick={() => navigate('/profile')}
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover border"
                />
              ) : (
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-sm font-medium hidden md:inline">{user?.name}</span>
            </div>

            <Button variant="outline" size="icon" onClick={logout} title="Logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pendingInvites.length > 0 && (
            <Card className="md:col-span-2 lg:col-span-3 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Invitations
                </CardTitle>
                <CardDescription>
                  Teams that invited you. Click join to access team meetings.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingInvites.map((invite) => (
                    <div
                      key={invite._id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <h3 className="font-semibold">{invite.team?.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Invited by: {invite.invitedBy?.name || invite.invitedBy?.email}
                        </p>
                      </div>

                      <Button
                        onClick={() => handleAcceptInvite(invite._id)}
                        disabled={joiningInviteId === invite._id}
                      >
                        {joiningInviteId === invite._id ? 'Joining...' : 'Join Team'}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <LayoutDashboard className="h-5 w-5" />
                <span>Quick Actions</span>
              </CardTitle>
              <CardDescription>Start or join a meeting instantly</CardDescription>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Button
                  size="lg"
                  className="h-20 flex flex-col items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 border-0 shadow-lg"
                  onClick={() => {
                    setIsCreateDialogOpen(true);
                    setTimeout(() => {
                      const scheduleBtn = document.querySelector('[data-schedule-trigger]');
                      if (scheduleBtn) (scheduleBtn as HTMLElement).click();
                    }, 100);
                  }}
                >
                  <Calendar className="h-8 w-8" />
                  <span className="text-base font-semibold">Schedule Meeting</span>
                </Button>

                <Button
                  size="lg"
                  className="h-20 flex flex-col items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 border-0 shadow-lg"
                  onClick={() => {
                    setIsCreateDialogOpen(true);
                    setTimeout(() => {
                      const startNowBtn = document.querySelector('[data-start-now-trigger]');
                      if (startNowBtn) (startNowBtn as HTMLElement).click();
                    }, 100);
                  }}
                >
                  <Zap className="h-8 w-8" />
                  <span className="text-base font-semibold">Start Now</span>
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2"
                  onClick={() => navigate('/teams')}
                >
                  <Users className="h-8 w-8" />
                  <span className="text-base font-semibold">Open Teams</span>
                </Button>

                <form onSubmit={handleJoinMeeting} className="flex flex-col gap-2">
                  <Input
                    placeholder="Paste meeting link, meeting ID, or team invite link"
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    className="flex-1 h-full text-base"
                  />
                  <Button type="submit" variant="outline" className="h-12">
                    Join Meeting
                  </Button>
                </form>
              </div>

              <MeetingCreationDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                onScheduleMeeting={addScheduledMeeting}
                onStartNow={startInstantMeeting}
              />
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Upcoming Meetings</span>
              </CardTitle>
              <CardDescription>Your scheduled meetings for today and beyond</CardDescription>
            </CardHeader>

            <CardContent>
              {loadingMeetings ? (
                <div className="text-sm text-muted-foreground">Loading meetings...</div>
              ) : upcomingMeetings.length === 0 ? (
                <div className="text-sm text-muted-foreground">No upcoming meetings</div>
              ) : (
                <div className="space-y-4">
                  {upcomingMeetings.map((meeting) => (
                    <div
                      key={meeting._id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Video className="h-5 w-5 text-primary" />
                        </div>

                        <div className="flex-1">
                          <h3 className="font-semibold">{meeting.title}</h3>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{new Date(meeting.date).toLocaleString()}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Users className="h-3 w-3" />
                              <span>{getParticipantCount(meeting.participants)} participants</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyMeetingLink(meeting.meetingId)}
                          title="Copy meeting link"
                        >
                          {copiedId === meeting.meetingId ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>

                        <Button onClick={() => handleJoinUpcomingMeeting(meeting.meetingId)}>
                          Join
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Previous Meetings</span>
              </CardTitle>
              <CardDescription>Your completed or past meetings</CardDescription>
            </CardHeader>

            <CardContent>
              {loadingMeetings ? (
                <div className="text-sm text-muted-foreground">Loading meetings...</div>
              ) : previousMeetings.length === 0 ? (
                <div className="text-sm text-muted-foreground">No previous meetings</div>
              ) : (
                <div className="space-y-4">
                  {previousMeetings.map((meeting) => (
                    <div
                      key={meeting._id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                          <Video className="h-4 w-4 text-green-600" />
                        </div>

                        <div className="flex-1">
                          <h3 className="font-medium text-sm">{meeting.title}</h3>
                          <div className="flex items-center space-x-3 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{new Date(meeting.date).toLocaleDateString()}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Users className="h-3 w-3" />
                              <span>{getParticipantCount(meeting.participants)} participants</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyMeetingLink(meeting.meetingId)}
                          title="Copy meeting link"
                        >
                          {copiedId === meeting.meetingId ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/meeting/${meeting.meetingId}`)}
                        >
                          Rejoin
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Meetings
              </CardTitle>
              <CardDescription>
                Meetings from teams where you are a member
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTeamMeetings ? (
                <div className="text-sm text-muted-foreground">Loading team meetings...</div>
              ) : teamMeetings.length === 0 ? (
                <div className="text-sm text-muted-foreground">No team meetings available</div>
              ) : (
                <div className="space-y-4">
                  {teamMeetings.map((meeting) => (
                    <div
                      key={meeting._id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <h3 className="font-semibold">{meeting.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(meeting.date).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Team: {getTeamName(meeting.teamId)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Participants: {getParticipantCount(meeting.participants)}
                        </p>
                      </div>

                      <Button
                        onClick={() => handleJoinTeamMeeting(meeting.meetingId)}
                        disabled={joiningTeamMeetingId === meeting.meetingId}
                      >
                        {joiningTeamMeetingId === meeting.meetingId ? 'Joining...' : 'Join Now'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>


          {loadingInvites && pendingInvites.length === 0 && (
            <div className="hidden">Loading invites...</div>
          )}
        </div>
      </main>
    </div>
  );
}