import api from '@/lib/api';

export const createTeamApi = async (payload: { name: string }) => {
  const res = await api.post('/teams', payload);
  return res.data;
};

export const getTeamsApi = async () => {
  const res = await api.get('/teams');
  return res.data;
};

export const getTeamByIdApi = async (teamId: string) => {
  const res = await api.get(`/teams/${teamId}`);
  return res.data;
};

export const inviteTeamUserApi = async (teamId: string, email: string) => {
  const res = await api.post(`/teams/${teamId}/invite`, { email });
  return res.data;
};

export const joinTeamByTokenApi = async (token: string) => {
  const res = await api.get(`/teams/join/${token}`);
  return res.data;
};

export const createTeamMeetingApi = async (payload: {
  title: string;
  date: string;
  status: 'scheduled' | 'instant';
  teamId: string;
}) => {
  const res = await api.post('/meetings', payload);
  return res.data.meeting;
};

export const getTeamMeetingsApi = async (teamId: string) => {
  const res = await api.get(`/meetings?teamId=${teamId}`);
  return res.data;
};