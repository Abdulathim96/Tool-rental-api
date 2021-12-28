const express = require("express")
const { cache } = require("joi")
// const checkId = require("../middleware/checkId")
const validateBody = require("../middleware/validateBody")
const checkToken = require("../middleware/checkToken")
const { Message, messageJoi } = require("../models/Message")
// const User = require("../models/User")
const router = express.Router()

router.get("/:id/directmessage", checkToken, async (req, res) => {
  try {
    const dmessage = await Message.find({
      $or: [
        { sender: req.userId, receive: req.params.id },
        { receive: req.params.id, sender: req.userId },
      ],
    })
    res.json(dmessage)
  } catch (error) {
    res.status(500).send(error.message)
  }
})
router.post("/:id/directmessage", checkToken, validateBody(messageJoi), async (req, res) => {
  try {
    const { message } = req.body

    const addmessage = new Message({
      message,
      sender: req.userId,
      receive: req.params.id,
    })
    await addmessage.save()

    res.json(addmessage)
  } catch (error) {
    res.status(500).send(error.message)
  }
})

router.delete("/directmessage/id", checkToken, async (req, res) => {
  try {
    const message = await Message.findByIdAndRemove(req.params.id)
    if (!message) return res.status(404).send("message not found")

    res.send("message removed")
  } catch (error) {
    res.status(500).send(error)
  }
})
module.exports = router
