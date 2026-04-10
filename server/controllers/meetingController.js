import Meeting from "../models/Meeting.js";
import redis from "../config/redis.js";

export const createMeeting = async (req, res) => {
  try {
    const { title, date, status } = req.body;

    const meeting = await Meeting.create({
      title: title || "Untitled Meeting",
      hostId: req.user._id,
      participants: [req.user._id],
      date: date ? new Date(date) : new Date(),
      status: status || "scheduled",
    });

    await redis.set(`meeting:${meeting.meetingId}`, JSON.stringify(meeting));

    res.status(201).json({
      message: "Meeting created successfully",
      meeting,
    });
  } catch (err) {
    console.error("createMeeting error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find({
      $or: [{ hostId: req.user._id }, { participants: req.user._id }],
    })
      .populate("hostId", "name email avatar")
      .populate("participants", "name email avatar")
      .sort({ date: 1 });

    res.json(meetings);
  } catch (err) {
    console.error("getMeetings error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const joinMeeting = async (req, res) => {
  try {
    const meetingId = req.params.meetingId;

    const cached = await redis.get(`meeting:${meetingId}`);
    let meeting = null;

    if (cached) {
      meeting = JSON.parse(cached);
    } else {
      meeting = await Meeting.findOne({ meetingId })
        .populate("hostId", "name email avatar")
        .populate("participants", "name email avatar");

      if (!meeting) {
        return res.status(404).json({ msg: "Meeting not found" });
      }
    }

    const existingMeeting =
      meeting._id
        ? await Meeting.findById(meeting._id)
        : await Meeting.findOne({ meetingId });

    const alreadyJoined = existingMeeting.participants.some(
      (id) => id.toString() === req.user._id.toString()
    );

    if (!alreadyJoined) {
      existingMeeting.participants.push(req.user._id);
      await existingMeeting.save();
    }

    const updatedMeeting = await Meeting.findById(existingMeeting._id)
      .populate("hostId", "name email avatar")
      .populate("participants", "name email avatar");

    await redis.set(
      `meeting:${meetingId}`,
      JSON.stringify(updatedMeeting)
    );

    res.json(updatedMeeting);
  } catch (err) {
    console.error("joinMeeting error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const updateMeeting = async (req, res) => {
  try {
    const updated = await Meeting.findOneAndUpdate(
      { _id: req.params.id, hostId: req.user._id },
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    await redis.set(`meeting:${updated.meetingId}`, JSON.stringify(updated));

    res.json(updated);
  } catch (err) {
    console.error("updateMeeting error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const deleteMeeting = async (req, res) => {
  try {
    const deleted = await Meeting.findOneAndDelete({
      _id: req.params.id,
      hostId: req.user._id,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    await redis.del(`meeting:${deleted.meetingId}`);

    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("deleteMeeting error:", err);
    res.status(500).json({ error: err.message });
  }
};