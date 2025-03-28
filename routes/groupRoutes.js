const router = require("express").Router()
const groupController = require("../controllers/groupController")

// Create a new group
router.post("/create", groupController.createGroup)

// Get all groups for a user
router.get("/user/:userId", groupController.getGroups)

// Get a specific group by ID
router.get("/:groupId", groupController.getGroupById)

// Add a member to a group
router.post("/add-member", groupController.addMember)

// Remove a member from a group
router.post("/remove-member", groupController.removeMember)



module.exports = router

