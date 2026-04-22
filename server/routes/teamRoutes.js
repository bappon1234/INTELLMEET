import express from "express";
import {
  createTeam,
  getTeams,
  getTeamById,
  inviteUser,
  joinTeam,
  getMyTeamMeetings,
  getMyPendingInvites,
  acceptInvite,
} from "../controllers/teamController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/join/:token", protect, joinTeam);
router.get("/my-meetings", protect, getMyTeamMeetings);
router.get("/my-invites", protect, getMyPendingInvites);

router.get("/", protect, getTeams);
router.get("/:teamId", protect, getTeamById);

router.post("/", protect, createTeam);
router.post("/:teamId/invite", protect, inviteUser);
router.post("/invites/:inviteId/accept", protect, acceptInvite);

export default router;