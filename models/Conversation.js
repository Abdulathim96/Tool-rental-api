const mongoose = require("mongoose")
const Joi = require("joi")

const conversationSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Types.ObjectId,
    ref: "User",
  },
  receive: {
    type: mongoose.Types.ObjectId,
    ref: "User",
  },
  messages: [{
    type: mongoose.Types.ObjectId,
    ref: "Message",
  }],
})

const conversationJoi = Joi.object({
  conversation: Joi.string().min(1).max(1000).required(),
})

const Conversation = mongoose.model("Conversation", conversationSchema)

module.exports.Conversation = Conversation
module.exports.conversationJoi = conversationJoi