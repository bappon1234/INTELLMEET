import Team from "../models/Team.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

// Create Team
export const createTeam = async (req, res) => {
  try {
    const team = await Team.create({
      name: req.body.name,
      owner: req.user._id,
      members: [
        {
          user: req.user._id,
          role: "admin",
        },
      ],
    });

    const populatedTeam = await Team.findById(team._id).populate(
      "members.user",
      "name email avatar"
    );

    res.status(201).json(populatedTeam);
  } catch (err) {
    console.error("createTeam error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get All Teams of Logged In User
export const getTeams = async (req, res) => {
  try {
    const teams = await Team.find({
      "members.user": req.user._id,
    })
      .populate("owner", "name email avatar")
      .populate("members.user", "name email avatar")
      .sort({ createdAt: -1 });

    res.json(teams);
  } catch (err) {
    console.error("getTeams error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get Single Team By ID
export const getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId)
      .populate("owner", "name email avatar")
      .populate("members.user", "name email avatar");

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    const isMember = team.members.some(
      (member) => member.user._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json(team);
  } catch (err) {
    console.error("getTeamById error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Invite User
export const inviteUser = async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId);

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    if (team.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not allowed" });
    }

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const token = jwt.sign(
      { email, teamId: req.params.teamId },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      inviteLink: `http://localhost:5173/join/${token}`,
      message: "Invite link generated successfully",
    });
  } catch (err) {
    console.error("inviteUser error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Join Team
export const joinTeam = async (req, res) => {
  try {
    const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET);

    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return res.status(404).json({ error: "User not found for this invite" });
    }

    const team = await Team.findById(decoded.teamId);
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    const exists = team.members.find(
      (m) => m.user.toString() === user._id.toString()
    );

    if (!exists) {
      team.members.push({ user: user._id, role: "member" });
      await team.save();
    }

    res.json({ message: "Joined Team successfully" });
  } catch (err) {
    console.error("joinTeam error:", err);
    res.status(500).json({ error: err.message });
  }
};