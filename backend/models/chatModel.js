import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // For private chats
    content: { type: String, required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Group" }, // For group chats
    isPrivate: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["sent", "seen"],
      default: "sent",
    }, // Tracks message status for private chats
    seenBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        seenAt: { type: Date, default: Date.now },
      },
    ], // Tracks which users have seen the message (useful for group chats)
    timestamp: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;