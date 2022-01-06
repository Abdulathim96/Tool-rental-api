const mongoose = require("mongoose")
const Joi = require("joi")

const offerSchema = new mongoose.Schema({
  title: String,
  description: String,
  photo: String,
  phoneNumber: String,
  price: String,
  owner: {
    type: mongoose.Types.ObjectId,
    ref: "User",
  },
  comments: [
    {
      type: mongoose.Types.ObjectId,
      ref: "Comment",
    },
  ],
  categorys: [
    {
      type: mongoose.Types.ObjectId,
      ref: "Category",
    },
  ],
})

const offerAddJoi = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().min(5).max(1000).required(),
  photo: Joi.string().uri().min(5).max(1000).required(),
  phoneNumber: Joi.string().min(10),
  price: Joi.string().alphanum().min(1),
  categorys: Joi.array().items(Joi.objectid()).min(1),
})

const offerEditJoi = Joi.object({
  title: Joi.string().min(1).max(200),
  description: Joi.string().min(5).max(1000),
  photo: Joi.string().uri().min(5).max(1000),
  phoneNumber: Joi.string().min(10),
  price: Joi.string().alphanum().min(1),
  categorys: Joi.array().items(Joi.objectid()).min(1),
})

const Offer = mongoose.model("Offer", offerSchema)

module.exports.Offer = Offer
module.exports.offerAddJoi = offerAddJoi
module.exports.offerEditJoi = offerEditJoi
