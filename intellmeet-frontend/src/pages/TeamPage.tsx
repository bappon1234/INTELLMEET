import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTeamApi, getTeamsApi } from '@/lib/teamApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Plus, Video } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TeamMember {
  user: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  role: 'admin' | 'member';
}

interface Team {
  _id: string;
  name: string;
  owner: string;
  members: TeamMember[];
}

export default function TeamsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [teams, setTeams] = useState<Team[]>([]);
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const data = await getTeamsApi();
      setTeams(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast({
        title: 'Failed to load teams',
        description: error?.response?.data?.error || 'Could not fetch teams',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    try {
      setCreating(true);
      const team = await createTeamApi({ name: teamName });
      setTeams((prev) => [team, ...prev]);
      setTeamName('');
      toast({
        title: 'Team Created',
        description: `${team.name} created successfully`,
        variant: 'success',
      });
    } catch (error: any) {
      toast({
        title: 'Create failed',
        description: error?.response?.data?.error || 'Could not create team',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Teams</h1>
            <p className="text-muted-foreground">Create and manage team meetings</p>
          </div>
          <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create Team
            </CardTitle>
            <CardDescription>Create a team for meetings and collaboration</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTeam} className="flex gap-3">
              <Input
                placeholder="Enter team name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
              />
              <Button type="submit" disabled={creating}>
                {creating ? 'Creating...' : 'Create'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-muted-foreground">Loading teams...</div>
        ) : teams.length === 0 ? (
          <div className="text-muted-foreground">No teams created yet.</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <Card key={team._id} className="hover:shadow-lg transition">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {team.name}
                  </CardTitle>
                  <CardDescription>{team.members?.length || 0} members</CardDescription>
                </CardHeader>
                <CardContent className="flex gap-3">
                  <Button onClick={() => navigate(`/teams/${team._id}`)}>Open Team</Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/teams/${team._id}/meeting/new`)}
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Start
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}