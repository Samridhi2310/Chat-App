import User from "../models/userModel.js"
import Group from "../models/groupModel.js";
export const FetchGroupDetails=async (req,res)=>{
    const user=req.user.userId;
    try{
        const groups= await Group.find({members:user}).populate({
    path: 'members',
    select: 'username' // Only return the username field
  })
  .populate({
    path: 'creator',
    select: 'username' // Optional: also populate creator username
  });

        res.status(200).json({message:"Details fetched successfully",groups})
    }catch(err){
        res.status(400).json({message:"error fetching group details",err})
    }

}
export const CreateGroup=async (req,res)=>{
    const { name, members } = req.body;
  const creatorId = req.user.userId; // Get creator's ID from authenticated request

  try {
    // Find the user documents for all the provided usernames
    const userDocs = await User.find({ username: { $in: members } });

    if (userDocs.length !== members.length) {
      return res.status(400).json({ message: "One or more users not found." });
    }

    // Extract the user IDs from the found documents
    const memberIds = userDocs.map(user => user._id);

    // Create the new group
    const newGroup = new Group({
      name,
      members: memberIds,
      creator: creatorId,
    });

    const savedGroup = await newGroup.save();

    res.status(201).json(savedGroup); // Respond with the created group data
  } catch (error) {
    console.error("Error creating group:", error);
    res.status(500).json({ message: "Failed to create group." });
  }

}
export const LeaveGroup = async (req, res) => {
  const userId = req.user.userId;
  const { room } = req.body;

  try {
    const userExist = await User.findById(userId);
    const roomExist = await Group.findOne({ name: room });

    if (!userExist || !roomExist) {
      return res.status(404).json({ message: "User or group does not exist" });
    }

    // Remove the userId from the group's members array
    const updateGroupData = await Group.updateOne(
      { name: room },
      { $pull: { members: userId } }
    );

    res.status(200).json({ message: "User left the group", updateGroupData });

  } catch (err) {
    res.status(500).json({ message: "Error leaving the group", error: err.message });
  }
};
export const AddAdmin = async (req, res) => {
  const { roomName, Username } = req.body;

  try {
    // Check if group and user exist
    const roomExist = await Group.findOne({ name: roomName });
    const userExist = await User.findOne({ username: Username });

    if (!roomExist || !userExist) {
      return res.status(404).json({ message: "Group or user does not exist" });
    }

    // Check if user is already an admin
    if (roomExist.creator.includes(userExist._id)) {
      return res.status(400).json({ message: "User is already an admin" });
    }

    // Add user as admin
    const updateGroupData = await Group.updateOne(
      { name: roomName },
      { $addToSet: { creator: userExist._id } } // Use $addToSet to avoid duplicates
    );

    if (updateGroupData.modifiedCount === 0) {
      return res.status(400).json({ message: "Failed to add user as admin" });
    }

    res.status(200).json({ message: "User added as admin successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error adding user as admin", error: err.message });
  }
};
export const RemoveAdmin = async (req, res) => {
  const { roomName, Username } = req.body;

  try {
    // Check if group and user exist
    const roomExist = await Group.findOne({ name: roomName });
    const userExist = await User.findOne({ username: Username });

    if (!roomExist || !userExist) {
      return res.status(404).json({ message: "Group or user does not exist" });
    }

    // Check if user is an admin
    if (!roomExist.creator.includes(userExist._id)) {
      return res.status(400).json({ message: "User is not an admin" });
    }

    // Remove user as admin
    const updateGroupData = await Group.updateOne(
      { name: roomName },
      { $pull: { creator: userExist._id } } // Use $pull to remove the user ID
    );

    if (updateGroupData.modifiedCount === 0) {
      return res.status(400).json({ message: "Failed to remove user as admin" });
    }

    res.status(200).json({ message: "User removed as admin successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error removing user as admin", error: err.message });
  }
};
