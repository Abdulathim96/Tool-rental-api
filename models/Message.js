const mongoose = require("mongoose")
const Joi = require("joi")

const messageSchema = new mongoose.Schema({
  message: String,
  sender: {
    type: mongoose.Types.ObjectId,
    ref: "User",
  },
  receive: {
    type: mongoose.Types.ObjectId,
    ref: "User",
  },
})

const messageJoi = Joi.object({
  message: Joi.string().min(1).max(1000).required(),
})

const Message = mongoose.model("Message", messageSchema)

module.exports.Message = Message
module.exports.messageJoi = messageJoi