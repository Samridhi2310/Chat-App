// routes/chat.js or controller file
import Message from "../models/chatModel.js";
import Group from "../models/groupModel.js";
import User from "../models/userModel.js";


export const CreateChat = async (req, res) => {
  try {
    const { message, room, isPrivate = false, receiver } = req.body;
    console.log("Receiver",receiver)
    const sender = req.user.userId;

    // Validate message content
    if (!message || message.trim() === "") {
      return res.status(400).json({ success: false, error: "Message content is required." });
    }

    let roomData = null;
    let receiverData = null;

    if (isPrivate) {
      // Private chat: validate receiver
      if (!receiver) {
        return res.status(400).json({ success: false, error: "Receiver ID is required for private messages." });
      }

      receiverData = await User.findOne({username:receiver});
      console.log("receiver data",receiverData?.username)

      if (!receiverData) {
        return res.status(404).json({ success: false, error: "Receiver not found." });
      }
    } else {
      // Group chat: validate room
      if (!room) {
        return res.status(400).json({ success: false, error: "Room name is required for group messages." });
      }

      roomData = await Group.findOne({ name: room });
      if (!roomData) {
        return res.status(404).json({ success: false, error: "Group not found." });
      }
    }

    const newMsg = new Message({
      content: message,
      sender,
      room: roomData ? roomData?._id : null,
      isPrivate,
      receiver: receiverData ? receiverData?._id : null,
      seen: false,
      seenBy: [],
    });

    await newMsg.save();

    res.status(201).json({ success: true, message: "Message saved successfully." });
  } catch (error) {
    console.error("Error saving message:", error);
    res.status(500).json({ success: false, error: "An error occurred while saving the message." });
  }
};


export const fetchChat = async (req, res) => {
  try {
    const { room, receiverUsername } = req.query;
    const currentUserId = req.user.userId;

    if (room) {
      // Group chat: fetch messages for the specified room
      const roomData = await Group.findOne({ name: room });
      if (!roomData) {
        return res.status(404).json({ success: false, error: 'Group room not found.' });
      }
      console.log(roomData.name)

      const groupMessages = await Message.find({
        isPrivate: false,
        room: roomData._id,
      })
        .sort({ createdAt: 1 })
        .populate('sender', 'username')
         .populate('room','name')
         console.log(groupMessages)

      return res.status(200).json({ success: true, messages: groupMessages });
    }

    if (receiverUsername) {
      // Private chat: fetch messages between current user and receiver
      const receiver = await User.findOne({ username: receiverUsername });
      if (!receiver) {
        return res.status(404).json({ success: false, error: 'Receiver not found.' });
      }

      const privateMessages = await Message.find({
        isPrivate: true,
        $or: [
          { sender: currentUserId, receiver: receiver._id },
          { sender: receiver._id, receiver: currentUserId },
        ],
      })
        .sort({ createdAt: 1 })
        .populate('sender', 'username')
        .populate('receiver', 'username');
      console.log(privateMessages)
      return res.status(200).json({ success: true, messages: privateMessages });
    }

    return res.status(400).json({ success: false, error: 'Either room or receiverUsername must be provided.' });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({ success: false, error: 'An error occurred while fetching messages.', debug: error.message });
  }
};


export const MessageSeen = async (req, res) => {
  const  {messageId}  = req.body; // Expect messageId instead of content
  const userId = req.user.userId; // Assuming verifyToken sets req.user._id
  console.log("user ID",userId)

  try {
    const message = await Message.findById(messageId).populate("sender receiver room");
    console.log("message data",message)
    if (!message) {
      return res.status(404).json({ message: "Message does not exist" });
    }

    if (message.isPrivate) {
      // Private chat: Update status to seen
      if (!message.receiver || message.receiver._id.toString() !== userId.toString()) {
        return res.status(403).json({ message: "User not authorized to update this message" });
      }

      if (message.status !== "seen") {
        message.status = "seen";
        await message.save();
        return res.status(200).json({ message: "Message marked as seen" });
      }
      return res.status(400).json({ message: "Message already seen" });
    } else {
      // Group chat: Add user to seenBy
      const group = await Group.findById(message.room);
      if (!group || !group.members.includes(userId)) {
        return res.status(403).json({ message: "User not a member of the group" });
      }

      if (!message.seenBy.some((entry) => entry.user.toString() === userId.toString())) {
        message.seenBy.push({ user: userId });
        await message.save();
        return res.status(200).json({ message: "Message marked as seen by user" });
      }
      return res.status(400).json({ message: "Message already seen by user" });
    }
  } catch (error) {
    console.error("Error updating message status:", error);
    res.status(500).json({ message: "Failed to update message status" });
  }
};