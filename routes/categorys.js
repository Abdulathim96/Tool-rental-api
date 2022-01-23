const express = require("express")
const checkAdmin = require("../middleware/checkAdmin")
const checkId = require("../middleware/checkId")
const validateBody = require("../middleware/validateBody")
const validateId = require("../middleware/validateId")
const { Category, categoryJoi } = require("../models/Category")
const { SubCategory, subcategoryJoi } = require("../models/SubCategory")

const router = express.Router()

router.get("/", async (req, res) => {
  const categorys = await Category.find().select("-__v").populate("subCategories")
  res.json(categorys)
})

router.get("/subCategories", async (req, res) => {
  const categorys = await SubCategory.find().select("-__v").populate("category")
  res.json(categorys)
})

router.post("/", checkAdmin, validateBody(categoryJoi), async (req, res) => {
  try {
    const { name } = req.body

    const category = new Category({
      name,
    })
    await category.save()

    res.json(Category)
  } catch (error) {
    res.status(500).send(error.message)
  }
})
router.put("/:id", checkAdmin, checkId, validateBody(categoryJoi), async (req, res) => {
  try {
    const { name } = req.body

    const category = await Category.findByIdAndUpdate(req.params.id, { $set: { name } }, { new: true })
    if (!Category) return res.status(404).send("Category not found")

    res.json(category)
  } catch (error) {
    res.status(500).send(error)
  }
})

router.delete("/:id", checkAdmin, checkId, async (req, res) => {
  try {
    const category = await Category.findByIdAndRemove(req.params.id)
    if (!category) return res.status(404).send("category not found")

    res.send("category removed")
  } catch (error) {
    res.status(500).send(error)
  }
})

// subCategory

router.get("/:categoryId/subCategory", validateId("categoryId"), async (req, res) => {
  try {
    const category = await Offer.findById(req.params.categoryId)
    if (!category) return res.status(404).send("category not found")

    const subCategory = await SubCategory.find({ categoryId: req.params.categoryId })
    res.json(subCategory)
  } catch (error) {
    console.log(error)
    res.status(500).send(error.message)
  }
})

router.post(
  "/:categoryId/subCategory",
  checkAdmin,
  validateId("categoryId"),
  validateBody(subcategoryJoi),
  async (req, res) => {
    try {
      const { name } = req.body

      const category = await Category.findById(req.params.categoryId)
      if (!category) return res.status(404).send("category not found")

      const newSubCategory = new SubCategory({ name, category: req.params.categoryId })

      await Category.findByIdAndUpdate(req.params.categoryId, { $push: { subCategories: newSubCategory._id } })

      await newSubCategory.save()

      res.json(newSubCategory)
    } catch (error) {
      console.log(error)
      res.status(500).send(error.message)
    }
  }
)

router.put(
  "/:categoryId/subCategory/:subCategoryId",
  checkAdmin,
  validateId("categoryId", "subCategoryId"),
  validateBody(subcategoryJoi),
  async (req, res) => {
    try {
      const category = await Category.findById(req.params.categoryId)
      if (!category) return res.status(404).send("category not found")
      const { name } = req.body

      const subCategoryFound = await SubCategory.findById(req.params.subCategoryId)
      if (!subCategoryFound) return res.status(404).send("subCategory not found")

      const updatedSubCategory = await SubCategory.findByIdAndUpdate(
        req.params.subCategoryId,
        { $set: { name } },
        { new: true }
      )

      res.json(updatedSubCategory)
    } catch (error) {
      console.log(error)
      res.status(500).send(error.message)
    }
  }
)

router.delete(
  "/:categoryId/subCategory/:subCategoryId",
  checkAdmin,
  validateId("categoryId", "subCategoryId"),
  async (req, res) => {
    try {
      const category = await Category.findById(req.params.categoryId)
      if (!category) return res.status(404).send("category not found")

      const subCategoryFound = await SubCategory.findById(req.params.subCategoryId)
      if (!subCategoryFound) return res.status(404).send("subCategory not found")

      await Category.findByIdAndUpdate(req.params.categoryId, { $pull: { subCategory: subCategoryFound._id } })

      await SubCategory.findByIdAndRemove(req.params.subCategoryId)

      res.send("subCategory is removed")
    } catch (error) {
      console.log(error)
      res.status(500).send(error.message)
    }
  }
)

module.exports = router
