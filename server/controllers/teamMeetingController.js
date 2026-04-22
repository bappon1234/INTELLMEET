import Meeting from "../models/Meeting.js";
import Team from "../models/Team.js";

// Create Team Meeting
export const createTeamMeeting = async (req, res) => {
  try {
    const { title, date, status, teamId } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ error: "Meeting title is required" });
    }

    if (!date) {
      return res.status(400).json({ error: "Meeting date is required" });
    }

    if (!teamId) {
      return res.status(400).json({ error: "teamId is required" });
    }

    const team = await Team.findById(teamId);

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    const isMember = team.members.some(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ error: "Access denied" });
    }

    const meeting = await Meeting.create({
      title: title.trim(),
      hostId: req.user._id,
      participants: [req.user._id],
      date,
      status: status || "scheduled",
      teamId,
    });

    const populatedMeeting = await Meeting.findById(meeting._id)
      .populate("participants", "name email avatar")
      .populate("hostId", "name email avatar")
      .populate("teamId", "name");

    return res.status(201).json(populatedMeeting);
  } catch (err) {
    console.error("createTeamMeeting error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// Get all meetings of a team
export const getTeamMeetings = async (req, res) => {
  try {
    const { teamId } = req.params;

    const team = await Team.findById(teamId);

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    const isMember = team.members.some(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ error: "Access denied" });
    }

    const meetings = await Meeting.find({ teamId })
      .populate("participants", "name email avatar")
      .populate("hostId", "name email avatar")
      .populate("teamId", "name")
      .sort({ date: -1 });

    return res.json(meetings);
  } catch (err) {
    console.error("getTeamMeetings error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// Join team meeting by meetingId
export const joinTeamMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;

    const meeting = await Meeting.findOne({ meetingId }).populate("teamId");

    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    if (!meeting.teamId) {
      return res.status(400).json({ error: "This is not a team meeting" });
    }

    const team = await Team.findById(meeting.teamId._id);

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    const isMember = team.members.some(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ error: "You are not a member of this team" });
    }

    const alreadyParticipant = meeting.participants.some(
      (participant) => participant.toString() === req.user._id.toString()
    );

    if (!alreadyParticipant) {
      meeting.participants.push(req.user._id);
      await meeting.save();
    }

    const updatedMeeting = await Meeting.findById(meeting._id)
      .populate("participants", "name email avatar")
      .populate("hostId", "name email avatar")
      .populate("teamId", "name");

    return res.json(updatedMeeting);
  } catch (err) {
    console.error("joinTeamMeeting error:", err);
    return res.status(500).json({ error: err.message });
  }
};