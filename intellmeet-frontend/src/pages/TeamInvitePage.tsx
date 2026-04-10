import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { joinTeamByTokenApi } from '@/lib/teamApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function TeamInvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const data = await joinTeamByTokenApi(token);

      toast({
        title: 'Team Joined',
        description: data.message || 'You joined the team successfully',
        variant: 'success',
      });

      navigate('/teams');
    } catch (error: any) {
      toast({
        title: 'Join failed',
        description:
          error?.response?.data?.error || 'Could not join team',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleJoin();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Joining Team</CardTitle>
          <CardDescription>Please wait while we process your invite</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" disabled={loading} onClick={handleJoin}>
            {loading ? 'Joining...' : 'Join Team'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}