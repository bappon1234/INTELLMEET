import Team from "../models/Team.js";
import User from "../models/User.js";
import Meeting from "../models/Meeting.js";
import TeamInvite from "../models/TeamInvite.js";
import jwt from "jsonwebtoken";

// Create Team
export const createTeam = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: "Team name is required" });
    }

    const team = await Team.create({
      name: name.trim(),
      owner: req.user._id,
      members: [
        {
          user: req.user._id,
          role: "admin",
        },
      ],
    });

    const populatedTeam = await Team.findById(team._id)
      .populate("owner", "name email avatar")
      .populate("members.user", "name email avatar");

    return res.status(201).json(populatedTeam);
  } catch (err) {
    console.error("createTeam error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// Get all teams of logged in user
export const getTeams = async (req, res) => {
  try {
    const teams = await Team.find({
      "members.user": req.user._id,
    })
      .populate("owner", "name email avatar")
      .populate("members.user", "name email avatar")
      .sort({ createdAt: -1 });

    return res.json(teams);
  } catch (err) {
    console.error("getTeams error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// Get single team
export const getTeamById = async (req, res) => {
  try {
    const { teamId } = req.params;

    const team = await Team.findById(teamId)
      .populate("owner", "name email avatar")
      .populate("members.user", "name email avatar");

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    const isMember = team.members.some(
      (member) => member.user?._id?.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ error: "Access denied" });
    }

    return res.json(team);
  } catch (err) {
    console.error("getTeamById error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// Invite member
export const inviteUser = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { email } = req.body;

    if (!email?.trim()) {
      return res.status(400).json({ error: "Email is required" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    const isAdmin = team.members.some(
      (member) =>
        member.user.toString() === req.user._id.toString() &&
        member.role === "admin"
    );

    if (!isAdmin) {
      return res.status(403).json({ error: "Only team admin can invite users" });
    }

    const invitedUser = await User.findOne({ email: normalizedEmail });
    if (!invitedUser) {
      return res.status(404).json({
        error: "This email is not registered in the system",
      });
    }

    const alreadyMember = team.members.some(
      (member) => member.user.toString() === invitedUser._id.toString()
    );

    if (alreadyMember) {
      return res.status(400).json({ error: "User is already a team member" });
    }

    const existingPendingInvite = await TeamInvite.findOne({
      team: teamId,
      email: normalizedEmail,
      status: "pending",
      expiresAt: { $gt: new Date() },
    });

    if (existingPendingInvite) {
      const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
      return res.json({
        message: "Pending invite already exists",
        inviteLink: `${clientUrl}/join/${existingPendingInvite.token}`,
      });
    }

    const token = jwt.sign(
      {
        email: normalizedEmail,
        teamId,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await TeamInvite.create({
      team: teamId,
      email: normalizedEmail,
      invitedBy: req.user._id,
      token,
      expiresAt,
      status: "pending",
    });

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

    return res.json({
      message: "Invite created successfully",
      inviteLink: `${clientUrl}/join/${token}`,
    });
  } catch (err) {
    console.error("inviteUser error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// Join team by token
export const joinTeam = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Please login first" });
    }

    const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET);

    const loggedInEmail = req.user.email?.toLowerCase();
    const invitedEmail = decoded.email?.toLowerCase();

    if (loggedInEmail !== invitedEmail) {
      return res.status(403).json({
        error: "You must login with the invited email address",
      });
    }

    const invite = await TeamInvite.findOne({
      token: req.params.token,
      email: invitedEmail,
      status: "pending",
    });

    if (!invite) {
      return res.status(404).json({ error: "Invite not found or already used" });
    }

    if (invite.expiresAt < new Date()) {
      return res.status(400).json({ error: "Invite expired" });
    }

    const team = await Team.findById(decoded.teamId);
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    const exists = team.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );

    if (!exists) {
      team.members.push({
        user: req.user._id,
        role: "member",
      });
      await team.save();
    }

    invite.status = "accepted";
    await invite.save();

    const updatedTeam = await Team.findById(team._id)
      .populate("owner", "name email avatar")
      .populate("members.user", "name email avatar");

    return res.json({
      message: "Joined Team successfully",
      team: updatedTeam,
    });
  } catch (err) {
    console.error("joinTeam error:", err);

    if (err.name === "TokenExpiredError") {
      return res.status(400).json({ error: "Invite link expired" });
    }

    if (err.name === "JsonWebTokenError") {
      return res.status(400).json({ error: "Invalid invite link" });
    }

    return res.status(500).json({ error: err.message });
  }
};

// Get all team meetings for logged in user
export const getMyTeamMeetings = async (req, res) => {
  try {
    const teams = await Team.find({
      "members.user": req.user._id,
    }).select("_id name");

    const teamIds = teams.map((team) => team._id);

    if (!teamIds.length) {
      return res.json([]);
    }

    const meetings = await Meeting.find({
      teamId: { $in: teamIds },
    })
      .populate("participants", "name email avatar")
      .populate("hostId", "name email avatar")
      .populate("teamId", "name")
      .sort({ date: 1 });

    return res.json(meetings);
  } catch (err) {
    console.error("getMyTeamMeetings error:", err);
    return res.status(500).json({
      error: err.message || "Failed to fetch team meetings",
    });
  }
};

// Get pending invites for logged in user
export const getMyPendingInvites = async (req, res) => {
  try {
    const email = req.user.email?.toLowerCase();

    const invites = await TeamInvite.find({
      email,
      status: "pending",
      expiresAt: { $gt: new Date() },
    })
      .populate("team", "name")
      .populate("invitedBy", "name email")
      .sort({ createdAt: -1 });

    return res.json(invites);
  } catch (err) {
    console.error("getMyPendingInvites error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// Accept invite from dashboard
export const acceptInvite = async (req, res) => {
  try {
    const { inviteId } = req.params;

    const invite = await TeamInvite.findById(inviteId);
    if (!invite) {
      return res.status(404).json({ error: "Invite not found" });
    }

    if (invite.status !== "pending") {
      return res.status(400).json({ error: "Invite already processed" });
    }

    if (invite.expiresAt < new Date()) {
      return res.status(400).json({ error: "Invite expired" });
    }

    if (invite.email !== req.user.email.toLowerCase()) {
      return res.status(403).json({ error: "This invite is not for your account" });
    }

    const team = await Team.findById(invite.team);
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    const alreadyMember = team.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );

    if (!alreadyMember) {
      team.members.push({
        user: req.user._id,
        role: "member",
      });
      await team.save();
    }

    invite.status = "accepted";
    await invite.save();

    const updatedTeam = await Team.findById(team._id)
      .populate("owner", "name email avatar")
      .populate("members.user", "name email avatar");

    return res.json({
      message: "Joined team successfully",
      team: updatedTeam,
    });
  } catch (err) {
    console.error("acceptInvite error:", err);
    return res.status(500).json({ error: err.message });
  }
};