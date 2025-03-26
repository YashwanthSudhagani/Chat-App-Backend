const User = require("../models/user")

exports.createUser = async (req, res) => {
  try {
    const { email, displayName, uid } = req.body

    // Log the incoming data to verify it's being received
    console.log("Creating/updating user with data:", { email, displayName, uid })

    let user = await User.findOne({ uid })

    if (user) {
      // Update existing user
      user.displayName = displayName
      user.email = email // Ensure email is updated
      await user.save()
      console.log("Updated existing user:", user)
    } else {
      // Create new user
      user = new User({ email, displayName, uid })
      await user.save()
      console.log("Created new user:", user)
    }

    res.status(201).json(user)
  } catch (error) {
    console.error("Error in createUser:", error)
    res.status(500).json({ message: "Error creating user", error: error.message })
  }
}

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
    res.status(200).json(users)
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error: error.message })
  }
}

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }
    res.status(200).json(user)
  } catch (error) {
    res.status(500).json({ message: "Error fetching user", error: error.message })
  }
}
