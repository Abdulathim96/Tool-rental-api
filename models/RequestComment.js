const mongoose = require("mongoose")
const Joi = require("joi")

const requestcommentSchema = new mongoose.Schema({
  requestcomment: String,
  requestId: {
    type: mongoose.Types.ObjectId,
    ref: "Request",
  },
  owner: {
    type: mongoose.Types.ObjectId,
    ref: "User",
  },
})

const requestCommentJoi = Joi.object({
  requestcomment: Joi.string().min(3).max(1000).required(),
})

const RequestComment = mongoose.model("RequestComment", requestcommentSchema)

module.exports.RequestComment = RequestComment
module.exports.requestCommentJoi = requestCommentJoi
