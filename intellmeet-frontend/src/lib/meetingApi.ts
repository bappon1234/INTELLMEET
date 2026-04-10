import api from '@/lib/api';

export const createMeetingApi = async (payload: {
  title: string;
  date?: string;
  status: 'scheduled' | 'instant';
}) => {
  const res = await api.post('/meetings', payload);
  return res.data.meeting;
};

export const getMeetingsApi = async () => {
  const res = await api.get('/meetings');
  return res.data;
};

export const joinMeetingApi = async (meetingId: string) => {
  const res = await api.get(`/meetings/join/${meetingId}`);
  return res.data;
};