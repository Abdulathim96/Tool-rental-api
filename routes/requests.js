const express = require("express")
// const checkAdmin = require("../middleware/checkAdmin")
const checkId = require("../middleware/checkId")
const checkToken = require("../middleware/checkToken")
const validateBody = require("../middleware/validateBody")
const validateId = require("../middleware/validateId")
const { Comment, commentJoi } = require("../models/Comment")
const { Request, requestAddJoi, requestEditJoi } = require("../models/Request")
const { User } = require("../models/User")
const { Category } = require("../models/Category")
const router = express.Router()

/* Requests */

router.get("/", async (req, res) => {
  const requests = await Request.find()
    .select("-__v")
    .populate("categorys")
    .populate({
      path: "comments",
      populate: {
        path: "owner",
        select: "-password -email -role",
      },
    })
  res.json(requests)
})

router.get("/:id", checkId, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate("categorys")
      .populate({
        path: "comments",
        populate: {
          path: "owner",
          select: "-__v -password -email -role",
        },
      })
    if (!request) return res.status(404).send("request not found")

    res.json(request)
  } catch (error) {
    console.log(error)
    res.status(500).send(error.message)
  }
})

router.post("/", checkToken, validateBody(requestAddJoi), async (req, res) => {
  try {
    const { title, description, photo, phoneNumber, categorys } = req.body

    const categorysSet = new Set(categorys)
    if (categorysSet.size < categorys.length) return res.status(400).send("threr is a duplicated category")
    const categorysFound = await Category.find({ _id: { $in: categorys }, type: "Category" })
    if (categorysFound.length < categorys.length) return res.status(404).send("some of the categorys is not found")

    const request = new Request({
      title,
      description,
      photo,
      phoneNumber,
      owner: req.userId,
      categorys,
    })
    await request.save()
    res.json(request)
  } catch (error) {
    console.log(error)
    res.status(500).send(error.message)
  }
})

router.put("/:id", checkToken, checkId, validateBody(requestEditJoi), async (req, res) => {
  try {
    const { title, description, photo, phoneNumber, categorys } = req.body

    const requestfound = await Request.findById(req.params.id)
    if (!requestfound) return res.status(404).send("request not found")

    if (requestfound.owner != req.userId) return res.status(403).send("unauthorized action")

    if (categorys) {
      const categorysSet = new Set(categorys)
      if (categorysSet.size < categorys.length) return res.status(400).send("threr is a duplicated category")
      const categorysFound = await Category.find({ _id: { $in: categorys }, type: "Category" })
      if (categorysFound.length < categorys.length) return res.status(404).send("some of the categorys is not found")
    }

    const request = await Request.findByIdAndUpdate(
      req.params.id,
      { $set: { title, description, photo, phoneNumber, categorys } },
      { new: true }
    )
    if (!request) return res.status(404).send("request not found")

    res.json(request)
  } catch (error) {
    console.log(error)
    res.status(500).send(error.message)
  }
})

router.delete("/:id", checkToken, checkId, async (req, res) => {
  try {
    const requestfound = await Request.findById(req.params.id)
    if (!requestfound) return res.status(404).send("request not found")

    // if (request.owner != req.userId) return res.status(403).send("unauthorized action")
    // await Comment.deleteMany({ requestId: req.params.id })

    const request = await Request.findByIdAndRemove(req.params.id)
    if (!request) return res.status(404).send("request not found")
    res.send("request is removed")
  } catch (error) {
    console.log(error)
    res.status(500).send(error.message)
  }
})

/* Comments */

router.get("/:requestId/comments", validateId("requestId"), async (req, res) => {
  try {
    const request = await Request.findById(req.params.requestId)
    if (!request) return res.status(404).send("request not found")

    const comments = await Comment.find({ requestId: req.params.requestId })
    res.json(comments)
  } catch (error) {
    console.log(error)
    res.status(500).send(error.message)
  }
})

router.post("/:requestId/comments", checkToken, validateId("requestId"), validateBody(commentJoi), async (req, res) => {
  try {
    const { comment } = req.body

    const request = await Request.findById(req.params.requestId)
    if (!request) return res.status(404).send("request not found")

    const newComment = new Comment({ comment, owner: req.userId, requestId: req.params.requestId })

    await Request.findByIdAndUpdate(req.params.requestId, { $push: { comments: newComment._id } })

    await newComment.save()

    res.json(newComment)
  } catch (error) {
    console.log(error)
    res.status(500).send(error.message)
  }
})

router.put(
  "/:requestId/comments/:commentId",
  checkToken,
  validateId("requestId", "commentId"),
  validateBody(commentJoi),
  async (req, res) => {
    try {
      const request = await Request.findById(req.params.requestId)
      if (!request) return res.status(404).send("request not found")
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

router.delete("/:requestId/comments/:commentId", checkToken, validateId("requestId", "commentId"), async (req, res) => {
  try {
    const request = await Request.findById(req.params.requestId)
    if (!request) return res.status(404).send("request not found")

    const commentFound = await Comment.findById(req.params.commentId)
    if (!commentFound) return res.status(404).send("comment not found")

    const user = await User.findById(req.userId)

    if (commentFound.owner != req.userId) return res.status(403).send("unauthorized action")

    await Request.findByIdAndUpdate(req.params.requestId, { $pull: { comments: commentFound._id } })

    await Comment.findByIdAndRemove(req.params.commentId)

    res.send("comment is removed")
  } catch (error) {
    console.log(error)
    res.status(500).send(error.message)
  }
})

module.exports = router
