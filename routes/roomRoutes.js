const express = require("express")
const router = express.Router()
const roomController = require("../controllers/roomController")

router.post("/", roomController.createRoom)
router.get("/", roomController.getAllRooms)
router.get("/:id", roomController.getRoomById)

module.exports = router
