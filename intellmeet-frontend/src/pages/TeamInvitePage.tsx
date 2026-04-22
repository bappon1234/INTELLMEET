import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { joinTeamByTokenApi } from '@/lib/teamApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function TeamInvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(false);
  const [hasTriedJoin, setHasTriedJoin] = useState(false);

  const handleJoin = async () => {
    if (!token || loading) return;

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
        description: error?.response?.data?.error || 'Could not join team',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token || authLoading) return;

    if (!user) {
      toast({
        title: 'Login required',
        description: 'Please login with the invited email first',
        variant: 'destructive',
      });

      navigate('/login', {
        state: { from: location.pathname },
        replace: true,
      });
      return;
    }

    if (!hasTriedJoin) {
      setHasTriedJoin(true);
      handleJoin();
    }
  }, [token, user, authLoading, hasTriedJoin, navigate, location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Joining Team</CardTitle>
          <CardDescription>
            Please login with the invited email to join this team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" disabled={loading || authLoading} onClick={handleJoin}>
            {loading ? 'Joining...' : 'Join Team'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}