import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getTeamByIdApi,
  inviteTeamUserApi,
  getTeamMeetingsApi,
  createTeamMeetingApi,
  joinTeamMeetingApi,
} from '@/lib/teamApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Mail, Calendar, Video, Copy, Check, Link as LinkIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TeamUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface TeamMember {
  user: TeamUser;
  role: 'admin' | 'member';
}

interface Team {
  _id: string;
  name: string;
  owner: any;
  members: TeamMember[];
}

interface Meeting {
  _id: string;
  title: string;
  meetingId: string;
  date: string;
  status: 'scheduled' | 'instant' | 'completed';
  participants?: TeamUser[];
  teamId?: {
    _id: string;
    name: string;
  };
}

export default function TeamDetailsPage() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [team, setTeam] = useState<Team | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [meetingInviteLink, setMeetingInviteLink] = useState('');
  const [activeMeetingId, setActiveMeetingId] = useState('');

  const fetchData = async () => {
    if (!teamId) return;

    try {
      setLoading(true);
      const [teamData, meetingData] = await Promise.all([
        getTeamByIdApi(teamId),
        getTeamMeetingsApi(teamId),
      ]);

      setTeam(teamData);
      const allMeetings = Array.isArray(meetingData) ? meetingData : [];
      setMeetings(allMeetings);

      const activeInstantMeeting = allMeetings.find(
        (meeting) => meeting.status === 'instant'
      );

      if (activeInstantMeeting) {
        setActiveMeetingId(activeInstantMeeting.meetingId);
        setMeetingInviteLink(
          `${window.location.origin}/teams/${teamId}/meeting/${activeInstantMeeting.meetingId}`
        );
      }
    } catch (error: any) {
      toast({
        title: 'Failed to load team',
        description: error?.response?.data?.error || 'Could not fetch team data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [teamId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId || !inviteEmail.trim()) return;

    try {
      const data = await inviteTeamUserApi(teamId, inviteEmail);

      const linkToShare =
        meetingInviteLink ||
        data?.inviteLink ||
        `${window.location.origin}/teams/${teamId}`;

      setMeetingInviteLink((prev) => prev || linkToShare);

      await navigator.clipboard.writeText(linkToShare);
      setCopied(true);
      setInviteEmail('');

      toast({
        title: 'Invite link copied',
        description: meetingInviteLink
          ? 'Active meeting invite link copied to clipboard'
          : 'Invite link copied to clipboard',
        variant: 'success',
      });

      setTimeout(() => setCopied(false), 2000);
    } catch (error: any) {
      toast({
        title: 'Invite failed',
        description: error?.response?.data?.error || 'Could not invite user',
        variant: 'destructive',
      });
    }
  };

  const handleStartInstantMeeting = async () => {
    if (!teamId || !team) return;

    try {
      const meeting = await createTeamMeetingApi({
        title: `${team.name} Instant Meeting`,
        date: new Date().toISOString(),
        status: 'instant',
        teamId,
      });

      setMeetings((prev) => [meeting, ...prev]);

      const newMeetingLink = `${window.location.origin}/teams/${teamId}/meeting/${meeting.meetingId}`;
      setMeetingInviteLink(newMeetingLink);
      setActiveMeetingId(meeting.meetingId);

      toast({
        title: 'Meeting Started',
        description: `Meeting ID: ${meeting.meetingId}`,
        variant: 'success',
      });

      navigate(`/teams/${teamId}/meeting/${meeting.meetingId}`);
    } catch (error: any) {
      toast({
        title: 'Failed to start',
        description: error?.response?.data?.error || 'Could not start meeting',
        variant: 'destructive',
      });
    }
  };

  const handleJoinMeeting = async (meetingId: string) => {
    try {
      await joinTeamMeetingApi(meetingId);
      setActiveMeetingId(meetingId);
      setMeetingInviteLink(`${window.location.origin}/teams/${teamId}/meeting/${meetingId}`);
      navigate(`/teams/${teamId}/meeting/${meetingId}`);
    } catch (error: any) {
      toast({
        title: 'Join failed',
        description: error?.response?.data?.error || 'Could not join meeting',
        variant: 'destructive',
      });
    }
  };

  const copyMeetingLink = async (meetingId: string) => {
    const link = `${window.location.origin}/teams/${teamId}/meeting/${meetingId}`;
    await navigator.clipboard.writeText(link);
    setMeetingInviteLink(link);
    setActiveMeetingId(meetingId);

    toast({
      title: 'Link copied',
      description: 'Meeting link copied to clipboard',
      variant: 'success',
    });
  };

  const copyActiveMeetingInviteLink = async () => {
    if (!meetingInviteLink) return;

    await navigator.clipboard.writeText(meetingInviteLink);
    toast({
      title: 'Link copied',
      description: 'Active meeting invite link copied',
      variant: 'success',
    });
  };

  if (loading) {
    return <div className="p-8 text-muted-foreground">Loading team...</div>;
  }

  if (!team) {
    return <div className="p-8 text-destructive">Team not found</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">{team.name}</h1>
            <p className="text-muted-foreground">Manage members and team meetings</p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/teams')}>
              Back
            </Button>

            <Button onClick={handleStartInstantMeeting}>
              <Video className="h-4 w-4 mr-2" />
              Start Instant Meeting
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Invite Member
              </CardTitle>
              <CardDescription>
                Invite member by email
                {activeMeetingId ? ' to the current active meeting' : ' to the team'}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleInvite} className="space-y-3">
                <Input
                  type="email"
                  placeholder="Enter member email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />

                <Button type="submit" className="w-full">
                  {copied ? (
                    <Check className="h-4 w-4 mr-2" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  {copied ? 'Copied Invite Link' : 'Copy Invite Link'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Members
              </CardTitle>
              <CardDescription>{team.members?.length || 0} total members</CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {meetingInviteLink && (
                  <div className="rounded-xl border bg-primary/5 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <LinkIcon className="h-4 w-4 text-primary" />
                          <p className="text-sm font-semibold text-primary">
                            Active Meeting Invite Link
                          </p>
                        </div>

                        <p className="text-xs text-muted-foreground mb-3">
                          Share this link with invited members so they can join the same meeting
                        </p>

                        <div className="rounded-md border bg-background px-3 py-2 text-sm break-all">
                          {meetingInviteLink}
                        </div>
                      </div>

                      <Button type="button" variant="outline" onClick={copyActiveMeetingInviteLink}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {team.members?.map((member) => (
                    <div
                      key={member.user._id}
                      className="flex items-center justify-between border rounded-lg p-3"
                    >
                      <div className="flex items-center gap-3">
                        {member.user.avatar ? (
                          <img
                            src={member.user.avatar}
                            alt={member.user.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-medium">
                              {member.user.name?.charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                        )}

                        <div>
                          <p className="font-medium">{member.user.name}</p>
                          <p className="text-sm text-muted-foreground">{member.user.email}</p>
                        </div>
                      </div>

                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                        {member.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Team Meetings
              </CardTitle>
              <CardDescription>Upcoming and previous team meetings</CardDescription>
            </CardHeader>

            <CardContent>
              {meetings.length === 0 ? (
                <div className="text-muted-foreground">No team meetings yet.</div>
              ) : (
                <div className="space-y-4">
                  {meetings.map((meeting) => (
                    <div
                      key={meeting._id}
                      className="flex items-center justify-between border rounded-lg p-4"
                    >
                      <div>
                        <h3 className="font-semibold">{meeting.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(meeting.date).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {meeting.participants?.length || 0} participants
                        </p>
                        <p className="text-xs mt-1">
                          <span className="px-2 py-1 rounded-full bg-primary/10 text-primary">
                            {meeting.status}
                          </span>
                          {activeMeetingId === meeting.meetingId && (
                            <span className="ml-2 px-2 py-1 rounded-full bg-green-100 text-green-700">
                              Active Invite Link
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => copyMeetingLink(meeting.meetingId)}
                        >
                          Copy Link
                        </Button>

                        <Button onClick={() => handleJoinMeeting(meeting.meetingId)}>
                          Join
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}