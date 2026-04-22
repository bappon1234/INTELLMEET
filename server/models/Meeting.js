import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const MeetingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },

    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    date: { type: Date, required: true },

    status: {
      type: String,
      enum: ["scheduled", "instant", "completed"],
      default: "scheduled",
    },

    meetingId: {
      type: String,
      unique: true,
      default: uuidv4,
    },

    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Meeting", MeetingSchema);