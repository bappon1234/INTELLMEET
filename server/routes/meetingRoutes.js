import express from "express";
import {
  createMeeting,
  getMeetings,
  updateMeeting,
  deleteMeeting,
  joinMeeting,
} from "../controllers/meetingController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createMeeting);
router.get("/", protect, getMeetings);
router.get("/join/:meetingId", protect, joinMeeting);
router.put("/:id", protect, updateMeeting);
router.delete("/:id", protect, deleteMeeting);

export default router;