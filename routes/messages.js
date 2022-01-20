const express = require("express")
const { cache } = require("joi")
// const checkId = require("../middleware/checkId")
const validateBody = require("../middleware/validateBody")
const checkToken = require("../middleware/checkToken")
const { Message, messageJoi } = require("../models/Message")
const { Conversation } = require("../models/Conversation")
// const User = require("../models/User")
const router = express.Router()

router.get("/:id/directmessage", checkToken, async (req, res) => {
  try {
    // const dmessage = await Message.find({
    //   $or: [
    //     { sender: req.userId, receive: req.params.id },
    //     { receive: req.params.id, sender: req.userId },
    //   ],
    // }).populate("receive")
    const conversation = await Conversation.findOne({
      $or: [
        { sender: req.userId, receive: req.params.id },
        { sender: req.params.id, receive: req.userId },
      ],
    }).populate({
      path: "messages",
      populate: ["receive", "sender"],
    })

    res.json(conversation?.messages || [])
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

    let conversation = await Conversation.findOne({
      $or: [
        { sender: req.userId, receive: req.params.id },
        { sender: req.params.id, receive: req.userId },
      ],
    })
    if (!conversation) {
      conversation = new Conversation({ receive: req.params.id, sender: req.userId })
      await conversation.save()
    }

    await addmessage.save()
    await Conversation.findByIdAndUpdate(conversation._id, { $push: { messages: addmessage._id } })

    res.json(addmessage)
  } catch (error) {
    res.status(500).send(error.message)
  }
})

router.get("/conversations", checkToken, async (req, res) => {
  try {
    const conversation = await Conversation.find({
      $or: [{ sender: req.userId }, { receive: req.userId }],
    })
      .populate("sender")
      .populate("receive")

    res.json(conversation)
  } catch (error) {
    res.status(500).send(error.message)
  }
})

module.exports = router
