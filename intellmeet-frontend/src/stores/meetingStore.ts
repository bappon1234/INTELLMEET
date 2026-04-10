import { create } from 'zustand';

interface Meeting {
  id: string;
  title: string;
  scheduledAt: Date;
  participants: string[];
  link: string;
  hostId: string;
  description?: string;
}

interface MeetingState {
  meetings: Meeting[];
  currentMeeting: Meeting | null;
  isCreatingMeeting: boolean;
  addMeeting: (meeting: Meeting) => void;
  updateMeeting: (id: string, updates: Partial<Meeting>) => void;
  deleteMeeting: (id: string) => void;
  setCurrentMeeting: (meeting: Meeting | null) => void;
  setCreatingMeeting: (isCreating: boolean) => void;
  getMeetingsByHost: (hostId: string) => Meeting[];
  getUpcomingMeetings: () => Meeting[];
}

export const useMeetingStore = create<MeetingState>((set, get) => ({
  meetings: [],
  currentMeeting: null,
  isCreatingMeeting: false,
  
  addMeeting: (meeting) =>
    set((state) => ({
      meetings: [...state.meetings, meeting],
    })),
  
  updateMeeting: (id, updates) =>
    set((state) => ({
      meetings: state.meetings.map((meeting) =>
        meeting.id === id ? { ...meeting, ...updates } : meeting
      ),
    })),
  
  deleteMeeting: (id) =>
    set((state) => ({
      meetings: state.meetings.filter((meeting) => meeting.id !== id),
    })),
  
  setCurrentMeeting: (meeting) => set({ currentMeeting: meeting }),
  
  setCreatingMeeting: (isCreating) => set({ isCreatingMeeting: isCreating }),
  
  getMeetingsByHost: (hostId) => {
    const state = get();
    return state.meetings.filter((meeting) => meeting.hostId === hostId);
  },
  
  getUpcomingMeetings: () => {
    const state = get();
    const now = new Date();
    return state.meetings
      .filter((meeting) => new Date(meeting.scheduledAt) > now)
      .sort((a, b) => 
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      );
  },
}));
