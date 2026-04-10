import express from "express";
import {
  createTeam,
  getTeams,
  getTeamById,
  inviteUser,
  joinTeam,
} from "../controllers/teamController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/join/:token", joinTeam);
router.get("/", protect, getTeams);
router.get("/:teamId", protect, getTeamById);
router.post("/", protect, createTeam);
router.post("/:teamId/invite", protect, inviteUser);

export default router;