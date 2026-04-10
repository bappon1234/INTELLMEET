import mongoose from "mongoose";

const teamSchema = new mongoose.Schema(
  {
    name: String,
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        role: { type: String, enum: ["admin", "member"], default: "member" },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Team", teamSchema);