const Group = require("../models/groupModels")
const User = require("../models/userModel")

module.exports.createGroup = async (req, res, next) => {
  try {
    const { name, members, createdBy } = req.body

    if (!name || !members || !createdBy) {
      return res.status(400).json({ msg: "Please provide all required fields" })
    }

    if (members.length < 2) {
      return res.status(400).json({ msg: "A group must have at least 2 members" })
    }

    // Create the group
    const newGroup = await Group.create({
      name,
      members,
      createdBy,
      isGroup: true, // Ensure isGroup is set to true
      avatar: "", // Default empty avatar
    })

    // Populate the group with member details
    const populatedGroup = await Group.findById(newGroup._id)
      .populate("members", "username email _id")
      .populate("createdBy", "username email _id")

    // Create a response object with a username field for compatibility with the frontend
    const responseGroup = {
      _id: populatedGroup._id,
      name: populatedGroup.name,
      username: populatedGroup.name, // Use the group name as username for frontend compatibility
      members: populatedGroup.members.map((member) => member._id), // Extract just the IDs for the frontend
      createdBy: populatedGroup.createdBy._id, // Extract just the ID for the frontend
      isGroup: true,
      avatar: populatedGroup.avatar || "",
      createdAt: populatedGroup.createdAt,
      updatedAt: populatedGroup.updatedAt,
    }

    return res.status(201).json(responseGroup)
  } catch (error) {
    console.error("Error creating group:", error)
    return res.status(500).json({ msg: "Internal server error" })
  }
}

module.exports.getGroups = async (req, res, next) => {
  try {
    const userId = req.params.userId

    if (!userId) {
      return res.status(400).json({ msg: "User ID is required" })
    }

    // Find all groups where the user is a member
    const groups = await Group.find({ members: userId })
      .populate("members", "username email _id")
      .populate("createdBy", "username email _id")

    // Format groups to match the expected frontend format
    const formattedGroups = groups.map((group) => ({
      _id: group._id,
      username: group.name, // Use group name as username for frontend compatibility
      name: group.name,
      members: group.members.map((member) => member._id), // Extract just the IDs for the frontend
      createdBy: group.createdBy._id, // Extract just the ID for the frontend
      isGroup: true,
      avatar: group.avatar || "",
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    }))

    return res.status(200).json(formattedGroups)
  } catch (error) {
    console.error("Error fetching groups:", error)
    return res.status(500).json({ msg: "Internal server error" })
  }
}

module.exports.getGroupById = async (req, res, next) => {
  try {
    const groupId = req.params.groupId

    if (!groupId) {
      return res.status(400).json({ msg: "Group ID is required" })
    }

    const group = await Group.findById(groupId)
      .populate("members", "username email _id")
      .populate("createdBy", "username email _id")

    if (!group) {
      return res.status(404).json({ msg: "Group not found" })
    }

    // Format group to match the expected frontend format
    const formattedGroup = {
      _id: group._id,
      username: group.name, // Use group name as username for frontend compatibility
      name: group.name,
      members: group.members.map((member) => member._id), // Extract just the IDs for the frontend
      createdBy: group.createdBy._id, // Extract just the ID for the frontend
      isGroup: true,
      avatar: group.avatar || "",
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    }

    return res.status(200).json(formattedGroup)
  } catch (error) {
    console.error("Error fetching group:", error)
    return res.status(500).json({ msg: "Internal server error" })
  }
}

module.exports.addMember = async (req, res, next) => {
  try {
    const { groupId, userId } = req.body

    if (!groupId || !userId) {
      return res.status(400).json({ msg: "Group ID and User ID are required" })
    }

    const group = await Group.findById(groupId)
    if (!group) {
      return res.status(404).json({ msg: "Group not found" })
    }

    // Check if user is already a member
    if (group.members.includes(userId)) {
      return res.status(400).json({ msg: "User is already a member of this group" })
    }

    // Add user to group
    group.members.push(userId)
    await group.save()

    const updatedGroup = await Group.findById(groupId)
      .populate("members", "username email _id")
      .populate("createdBy", "username email _id")

    // Format group to match the expected frontend format
    const formattedGroup = {
      _id: updatedGroup._id,
      username: updatedGroup.name, // Use group name as username for frontend compatibility
      name: updatedGroup.name,
      members: updatedGroup.members.map((member) => member._id), // Extract just the IDs for the frontend
      createdBy: updatedGroup.createdBy._id, // Extract just the ID for the frontend
      isGroup: true,
      avatar: updatedGroup.avatar || "",
      createdAt: updatedGroup.createdAt,
      updatedAt: updatedGroup.updatedAt,
    }

    return res.status(200).json(formattedGroup)
  } catch (error) {
    console.error("Error adding member to group:", error)
    return res.status(500).json({ msg: "Internal server error" })
  }
}

module.exports.removeMember = async (req, res, next) => {
  try {
    const { groupId, userId, removedBy } = req.body

    if (!groupId || !userId) {
      return res.status(400).json({ msg: "Group ID and User ID are required" })
    }

    const group = await Group.findById(groupId)
    if (!group) {
      return res.status(404).json({ msg: "Group not found" })
    }

    // Check if the user removing members is the creator of the group (admin)
    if (removedBy && group.createdBy.toString() !== removedBy) {
      return res.status(403).json({ msg: "Only the group admin can remove members" })
    }

    // Check if user is a member
    if (!group.members.includes(userId)) {
      return res.status(400).json({ msg: "User is not a member of this group" })
    }

    // Prevent removing the group creator
    if (userId === group.createdBy.toString()) {
      return res.status(400).json({ msg: "Cannot remove the group creator" })
    }

    // Remove user from group
    group.members = group.members.filter((member) => member.toString() !== userId)
    await group.save()

    const updatedGroup = await Group.findById(groupId)
      .populate("members", "username email _id")
      .populate("createdBy", "username email _id")

    // Format group to match the expected frontend format
    const formattedGroup = {
      _id: updatedGroup._id,
      username: updatedGroup.name, // Use group name as username for frontend compatibility
      name: updatedGroup.name,
      members: updatedGroup.members.map((member) => member._id), // Extract just the IDs for the frontend
      createdBy: updatedGroup.createdBy._id, // Extract just the ID for the frontend
      isGroup: true,
      avatar: updatedGroup.avatar || "",
      createdAt: updatedGroup.createdAt,
      updatedAt: updatedGroup.updatedAt,
    }

    return res.status(200).json(formattedGroup)
  } catch (error) {
    console.error("Error removing member from group:", error)
    return res.status(500).json({ msg: "Internal server error" })
  }
}

// Add a new function to handle adding multiple members at once
module.exports.addMembers = async (req, res, next) => {
  try {
    const { groupId, newMembers, addedBy } = req.body

    if (!groupId || !newMembers || !newMembers.length) {
      return res.status(400).json({ msg: "Group ID and new members array are required" })
    }

    const group = await Group.findById(groupId)
    if (!group) {
      return res.status(404).json({ msg: "Group not found" })
    }

    // Check if the user adding members is the creator of the group (admin)
    if (addedBy && group.createdBy.toString() !== addedBy) {
      return res.status(403).json({ msg: "Only the group admin can add members" })
    }

    // Filter out users who are already members
    const membersToAdd = newMembers.filter((memberId) => !group.members.includes(memberId))

    if (membersToAdd.length === 0) {
      return res.status(400).json({ msg: "All users are already members of this group" })
    }

    // Add new members to the group
    group.members = [...group.members, ...membersToAdd]
    await group.save()

    const updatedGroup = await Group.findById(groupId)
      .populate("members", "username email _id")
      .populate("createdBy", "username email _id")

    // Format group to match the expected frontend format
    const formattedGroup = {
      _id: updatedGroup._id,
      username: updatedGroup.name, // Use group name as username for frontend compatibility
      name: updatedGroup.name,
      members: updatedGroup.members.map((member) => member._id), // Extract just the IDs for the frontend
      createdBy: updatedGroup.createdBy._id, // Extract just the ID for the frontend
      isGroup: true,
      avatar: updatedGroup.avatar || "",
      createdAt: updatedGroup.createdAt,
      updatedAt: updatedGroup.updatedAt,
    }

    return res.status(200).json(formattedGroup)
  } catch (error) {
    console.error("Error adding members to group:", error)
    return res.status(500).json({ msg: "Internal server error" })
  }
}

// Add a function to delete a group
module.exports.deleteGroup = async (req, res, next) => {
  try {
    const { groupId, userId } = req.body

    if (!groupId || !userId) {
      return res.status(400).json({ msg: "Group ID and User ID are required" })
    }

    const group = await Group.findById(groupId)
    if (!group) {
      return res.status(404).json({ msg: "Group not found" })
    }

    // Check if the user deleting the group is the creator (admin)
    if (group.createdBy.toString() !== userId) {
      return res.status(403).json({ msg: "Only the group admin can delete the group" })
    }

    // Delete the group
    await Group.findByIdAndDelete(groupId)

    return res.status(200).json({ msg: "Group deleted successfully" })
  } catch (error) {
    console.error("Error deleting group:", error)
    return res.status(500).json({ msg: "Internal server error" })
  }
}

