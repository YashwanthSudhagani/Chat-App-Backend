const Room = require("../models/Room")

module.exports.createRoom = async (req, res) => {
  try {
    const { roomId, hostId, type } = req.body
    const room = new Room({ roomId, hostId, type })
    await room.save()
    res.status(201).json(room)
  } catch (error) {
    res.status(500).json({ message: "Error creating room", error: error.message })
  }
}

module.exports.getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find()
    res.status(200).json(rooms)
  } catch (error) {
    res.status(500).json({ message: "Error fetching rooms", error: error.message })
  }
}

module.exports.getRoomById = async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.id })
    if (!room) {
      return res.status(404).json({ message: "Room not found" })
    }
    res.status(200).json(room)
  } catch (error) {
    res.status(500).json({ message: "Error fetching room", error: error.message })
  }
}
