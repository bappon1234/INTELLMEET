import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getTeamByIdApi,
  inviteTeamUserApi,
  getTeamMeetingsApi,
  createTeamMeetingApi,
} from '@/lib/teamApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Mail, Calendar, Video, Copy, Check } from 'lucide-react';
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
  owner: string;
  members: TeamMember[];
}

interface Meeting {
  _id: string;
  title: string;
  meetingId: string;
  date: string;
  status: 'scheduled' | 'instant' | 'completed';
  participants?: TeamUser[];
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

  const fetchData = async () => {
    if (!teamId) return;

    try {
      setLoading(true);
      const [teamData, meetingData] = await Promise.all([
        getTeamByIdApi(teamId),
        getTeamMeetingsApi(teamId),
      ]);
      setTeam(teamData);
      setMeetings(Array.isArray(meetingData) ? meetingData : []);
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
      await navigator.clipboard.writeText(data.inviteLink);
      setCopied(true);
      setInviteEmail('');

      toast({
        title: 'Invite link copied',
        description: 'Invite link copied to clipboard',
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
              <CardDescription>Invite member by email</CardDescription>
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
  {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
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
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() =>
                            navigator.clipboard.writeText(
                              `${window.location.origin}/teams/${teamId}/meeting/${meeting.meetingId}`
                            )
                          }
                        >
                          Copy Link
                        </Button>
                        <Button onClick={() => navigate(`/teams/${teamId}/meeting/${meeting.meetingId}`)}>
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