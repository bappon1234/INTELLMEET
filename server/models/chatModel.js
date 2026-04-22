import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    meetingId: {
      type: String,
      required: true,
    },
    sender: {
      type: String,
      required: true,
    },
    senderName: {
      type: String,
      default: "Guest",
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;