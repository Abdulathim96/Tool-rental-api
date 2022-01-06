const mongoose = require("mongoose")
const Joi = require("joi")

const subCategorySchema = new mongoose.Schema({
  name: String,
})
const supcategoryJoi = Joi.object({
  name: Joi.string().min(3).max(1000).required(),
})

const SubCategory = mongoose.model("Category", subCategorySchema)

module.exports.SubCategory = SubCategory
module.exports.supcategoryJoi = supcategoryJoi
