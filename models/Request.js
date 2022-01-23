const mongoose = require("mongoose")
const Joi = require("joi")

const requestSchema = new mongoose.Schema({
  title: String,
  description: String,
  photo: String,
  phoneNumber: String,
  owner:{
    type: mongoose.Types.ObjectId,
    ref: "User",
  },
  requestcomments: [
    {
      type: mongoose.Types.ObjectId,
      ref: "RequestComment",
    },
  ],
  categorys: [
    {
      type: mongoose.Types.ObjectId,
      ref: "Category",
    },
  ],
})

const requestAddJoi = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().min(5).max(1000).required(),
  photo: Joi.string().uri().min(5).max(1000).required(),
  phoneNumber: Joi.string().min(10),
})

const requestEditJoi = Joi.object({
  title: Joi.string().min(1).max(200),
  description: Joi.string().min(5).max(1000),
  photo: Joi.string().uri().min(5).max(1000),
  phoneNumber: Joi.string().min(10),  

})

const Request = mongoose.model("Request", requestSchema)

module.exports.Request = Request
module.exports.requestAddJoi = requestAddJoi
module.exports.requestEditJoi = requestEditJoi
