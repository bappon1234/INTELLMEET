import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createTeamMeeting,
  getTeamMeetings,
  joinTeamMeeting,
} from "../controllers/teamMeetingController.js";

const router = express.Router();

router.get("/team/:teamId", protect, getTeamMeetings);
router.get("/join/:meetingId", protect, joinTeamMeeting);
router.post("/", protect, createTeamMeeting);

export default router;