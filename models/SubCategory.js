const mongoose = require("mongoose")
const Joi = require("joi")

const subcategorySchema = new mongoose.Schema({
  name: String,
  category:{
    type: mongoose.Types.ObjectId,
    ref: "Category",
  }
})
const subcategoryJoi = Joi.object({
  name: Joi.string().min(3).max(1000).required(),
})

const SubCategory = mongoose.model("SubCategory", subcategorySchema)

module.exports.SubCategory = SubCategory
module.exports.subcategoryJoi = subcategoryJoi
