const express = require("express")
const router = express.Router()
const userController = require("../controllers/usersController")

router.post("/", userController.createUser)
router.get("/", userController.getAllUsers)
router.get("/:id", userController.getUserById)

module.exports = router
