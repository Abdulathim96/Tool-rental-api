const express = require("express")
// const checkAdmin = require("../middleware/checkAdmin")
const checkId = require("../middleware/checkId")
const checkToken = require("../middleware/checkToken")
const validateBody = require("../middleware/validateBody")
const validateId = require("../middleware/validateId")
const { Comment, commentJoi } = require("../models/Comment")
const { Offer, offerAddJoi, offerEditJoi } = require("../models/Offer")
const { User } = require("../models/User")
const { Category } = require("../models/Category")
const router = express.Router()

/* Offers */

router.get("/", async (req, res) => {
  const offers = await Offer.find()
    .select("-__v")
    .populate("categorys")
    .populate("subCategories")
    .populate("owner")
    .populate({
      path: "comments",
      populate: {
        path: "owner",
        select: "-password -email -role",
      },
    })
  res.json(offers)
})

router.get("/:id", checkId, async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id)
      .populate("categorys")
      .populate({
        path: "comments",
        populate: {
          path: "owner",
          select: "-__v -password -email -role",
        },
      })
    if (!offer) return res.status(404).send("offer not found")

    res.json(offer)
  } catch (error) {
    console.log(error)
    res.status(500).send(error.message)
  }
})

router.post("/", checkToken, validateBody(offerAddJoi), async (req, res) => {
  try {
    const { title, description, photo, phoneNumber, price, categorys,subCategories,available } = req.body

    const categorysSet = new Set(categorys)
    if (categorysSet.size < categorys.length) return res.status(400).send("threr is a duplicated category")
    const categorysFound = await Category.find({ _id: { $in: categorys }, type: "Category" })
    if (categorysFound.length < categorys.length) return res.status(404).send("some of the categorys is not found")

    const offer = new Offer({
      title,
      description,
      photo,
      phoneNumber,
      price,
      owner: req.userId,
      categorys,
      subCategories,
      available,
    })
    await offer.save()
    res.json(offer)
  } catch (error) {
    console.log(error)
    res.status(500).send(error.message)
  }
})

router.put("/:id", checkToken, checkId, validateBody(offerEditJoi), async (req, res) => {
  try {
    const { title, description, photo, phoneNumber, price, categorys, subCategories , available } = req.body

    const offerfound = await Offer.findById(req.params.id)
    if (!offerfound) return res.status(404).send("offer not found")

    if (offerfound.owner != req.userId) return res.status(403).send("unauthorized action")

    if (categorys) {
      const categorysSet = new Set(categorys)
      if (categorysSet.size < categorys.length) return res.status(400).send("threr is a duplicated category")
      const categorysFound = await Category.find({ _id: { $in: categorys }, type: "Category" })
      if (categorysFound.length < categorys.length) return res.status(404).send("some of the categorys is not found")
    }

    const offer = await Offer.findByIdAndUpdate(
      req.params.id,
      { $set: { title, description, photo, phoneNumber, price, categorys, subCategories , available } },
      { new: true }
    )
    if (!offer) return res.status(404).send("offer not found")

    res.json(offer)
  } catch (error) {
    console.log(error)
    res.status(500).send(error.message)
  }
})

router.delete("/:id", checkToken, checkId, async (req, res) => {
  try {
    const offerfound = await Offer.findById(req.params.id)
    if (!offerfound) return res.status(404).send("offer not found")

    

    const offer = await Offer.findByIdAndRemove(req.params.id)
    if (!offer) return res.status(404).send("offer not found")
    res.send("offer is removed")
  } catch (error) {
    console.log(error)
    res.status(500).send(error.message)
  }
})

/* Comments */

router.get("/:offerId/comments", validateId("offerId"), async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.offerId)
    if (!offer) return res.status(404).send("offer not found")

    const comments = await Comment.find({ offerId: req.params.offerId })
    res.json(comments)
  } catch (error) {
    console.log(error)
    res.status(500).send(error.message)
  }
})

router.post("/:offerId/comments", checkToken, validateId("offerId"), validateBody(commentJoi), async (req, res) => {
  try {
    const { comment } = req.body

    const offer = await Offer.findById(req.params.offerId)
    if (!offer) return res.status(404).send("offer not found")

    const newComment = new Comment({ comment, owner: req.userId, offerId: req.params.offerId })

    await Offer.findByIdAndUpdate(req.params.offerId, { $push: { comments: newComment._id } })

    await newComment.save()

    res.json(newComment)
  } catch (error) {
    console.log(error)
    res.status(500).send(error.message)
  }
})

router.put(
  "/:offerId/comments/:commentId",
  checkToken,
  validateId("offerId", "commentId"),
  validateBody(commentJoi),
  async (req, res) => {
    try {
      const offer = await Offer.findById(req.params.offerId)
      if (!offer) return res.status(404).send("offer not found")
      const { comment } = req.body

      const commentFound = await Comment.findById(req.params.commentId)
      if (!commentFound) return res.status(404).send("comment not found")

      if (commentFound.owner != req.userId) return res.status(403).send("unauthorized action")

      const updatedComment = await Comment.findByIdAndUpdate(req.params.commentId, { $set: { comment } }, { new: true })

      res.json(updatedComment)
    } catch (error) {
      console.log(error)
      res.status(500).send(error.message)
    }
  }
)

router.delete("/:offerId/comments/:commentId", checkToken, validateId("offerId", "commentId"), async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.offerId)
    if (!offer) return res.status(404).send("offer not found")

    const commentFound = await Comment.findById(req.params.commentId)
    if (!commentFound) return res.status(404).send("comment not found")

    const user = await User.findById(req.userId)

    if (commentFound.owner != req.userId) return res.status(403).send("unauthorized action")

    await Offer.findByIdAndUpdate(req.params.offerId, { $pull: { comments: commentFound._id } })

    await Comment.findByIdAndRemove(req.params.commentId)

    res.send("comment is removed")
  } catch (error) {
    console.log(error)
    res.status(500).send(error.message)
  }
})

module.exports = router
