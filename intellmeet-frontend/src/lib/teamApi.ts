// import api from '@/lib/api';

// export const createTeamApi = async (payload: { name: string }) => {
//   const res = await api.post('/teams', payload);
//   return res.data;
// };

// export const getTeamsApi = async () => {
//   const res = await api.get('/teams');
//   return res.data;
// };

// export const getTeamByIdApi = async (teamId: string) => {
//   const res = await api.get(`/teams/${teamId}`);
//   return res.data;
// };

// export const inviteTeamUserApi = async (teamId: string, email: string) => {
//   const res = await api.post(`/teams/${teamId}/invite`, { email });
//   return res.data;
// };

// export const joinTeamByTokenApi = async (token: string) => {
//   const res = await api.get(`/teams/join/${token}`);
//   return res.data;
// };

// export const createTeamMeetingApi = async (payload: {
//   title: string;
//   date: string;
//   status: 'scheduled' | 'instant';
//   teamId: string;
// }) => {
//   const res = await api.post('/meetings', payload);
//   return res.data.meeting;
// };

// export const getTeamMeetingsApi = async (teamId: string) => {
//   const res = await api.get(`/meetings?teamId=${teamId}`);
//   return res.data;
// };

// export const getMyTeamMeetingsApi = async () => {
//   const { data } = await api.get('/teams/my-meetings');
//   return data;
// };

import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface CreateTeamPayload {
  name: string;
}

export interface CreateTeamMeetingPayload {
  title: string;
  date: string;
  status: 'scheduled' | 'instant' | 'completed';
  teamId: string;
}

export const createTeamApi = async (payload: CreateTeamPayload) => {
  const { data } = await API.post('/teams', payload);
  return data;
};

export const getTeamsApi = async () => {
  const { data } = await API.get('/teams');
  return data;
};

export const getTeamByIdApi = async (teamId: string) => {
  const { data } = await API.get(`/teams/${teamId}`);
  return data;
};

export const inviteTeamUserApi = async (teamId: string, email: string) => {
  const { data } = await API.post(`/teams/${teamId}/invite`, { email });
  return data;
};

export const joinTeamByTokenApi = async (token: string) => {
  const { data } = await API.get(`/teams/join/${token}`);
  return data;
};

export const getMyTeamMeetingsApi = async () => {
  const { data } = await API.get('/teams/my-meetings');
  return data;
};

export const getTeamMeetingsApi = async (teamId: string) => {
  const { data } = await API.get(`/team-meetings/team/${teamId}`);
  return data;
};

export const createTeamMeetingApi = async (payload: CreateTeamMeetingPayload) => {
  const { data } = await API.post('/team-meetings', payload);
  return data;
};

export const joinTeamMeetingApi = async (meetingId: string) => {
  const { data } = await API.get(`/team-meetings/join/${meetingId}`);
  return data;
};

export const getMyPendingInvitesApi = async () => {
  const { data } = await API.get('/teams/my-invites');
  return data;
};

export const acceptInviteApi = async (inviteId: string) => {
  const { data } = await API.post(`/teams/invites/${inviteId}/accept`);
  return data;
};

export default API;