const express = require("express")
// const checkAdmin = require("../middleware/checkAdmin")
const checkId = require("../middleware/checkId")
const checkToken = require("../middleware/checkToken")
const validateBody = require("../middleware/validateBody")
const validateId = require("../middleware/validateId")
const { RequestComment, requestCommentJoi } = require("../models/RequestComment")
const { Request, requestAddJoi, requestEditJoi } = require("../models/Request")
const { User } = require("../models/User")
const { Category } = require("../models/Category")
const router = express.Router()

/* Requests */

router.get("/", async (req, res) => {
  const requests = await Request.find()
    .select("-__v")
    // .populate("categorys")
    .populate({
      path: "requestcomments",
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
      // .populate("categorys")
      .populate({
        path: "requestcomments",
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
    const { title, description, photo, phoneNumber } = req.body

    // const categorysSet = new Set(categorys)
    // if (categorysSet.size < categorys.length) return res.status(400).send("threr is a duplicated category")
    // const categorysFound = await Category.find({ _id: { $in: categorys }, type: "Category" })
    // if (categorysFound.length < categorys.length) return res.status(404).send("some of the categorys is not found")

    const request = new Request({
      title,
      description,
      photo,
      phoneNumber,
      owner: req.userId,
      // categorys,
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
    const { title, description, photo, phoneNumber } = req.body

    const requestfound = await Request.findById(req.params.id)
    if (!requestfound) return res.status(404).send("request not found")

    if (requestfound.owner != req.userId) return res.status(403).send("unauthorized action")

    // if (categorys) {
    //   const categorysSet = new Set(categorys)
    //   if (categorysSet.size < categorys.length) return res.status(400).send("threr is a duplicated category")
    //   const categorysFound = await Category.find({ _id: { $in: categorys }, type: "Category" })
    //   if (categorysFound.length < categorys.length) return res.status(404).send("some of the categorys is not found")
    // }

    const request = await Request.findByIdAndUpdate(
      req.params.id,
      { $set: { title, description, photo, phoneNumber } },
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

/* RequestComment */

router.get("/:requestId/requestComments", validateId("requestId"), async (req, res) => {
  try {
    const request = await Request.findById(req.params.requestId)
    if (!request) return res.status(404).send("request not found")

    const requestRequestComments = await RequestComment.find({ requestId: req.params.requestId })
    res.json(requestRequestComments)
  } catch (error) {
    console.log(error)
    res.status(500).send(error.message)
  }
})

router.post(
  "/:requestId/requestComments",
  checkToken,
  validateId("requestId"),
  validateBody(requestCommentJoi),
  async (req, res) => {
    try {
      const { requestcomment } = req.body

      const request = await Request.findById(req.params.requestId)
      if (!request) return res.status(404).send("request not found")

      const newRequestComment = new RequestComment({
        requestcomment,
        owner: req.userId,
        requestId: req.params.requestId,
      })

      await Request.findByIdAndUpdate(req.params.requestId, {
        $push: { requestRequestComments: newRequestComment._id },
      })

      await newRequestComment.save()

      res.json(newRequestComment)
    } catch (error) {
      console.log(error)
      res.status(500).send(error.message)
    }
  }
)

router.put(
  "/:requestId/requestRequestComments/:requestCommentId",
  checkToken,
  validateId("requestId", "requestCommentId"),
  validateBody(requestCommentJoi),
  async (req, res) => {
    try {
      const request = await Request.findById(req.params.requestId)
      if (!request) return res.status(404).send("request not found")
      const { requestcomment } = req.body

      const requestCommentFound = await RequestComment.findById(req.params.requestCommentId)
      if (!requestCommentFound) return res.status(404).send("requestcomment not found")

      if (requestCommentFound.owner != req.userId) return res.status(403).send("unauthorized action")

      const updatedRequestComment = await RequestComment.findByIdAndUpdate(
        req.params.requestCommentId,
        { $set: { requestcomment } },
        { new: true }
      )

      res.json(updatedRequestComment)
    } catch (error) {
      console.log(error)
      res.status(500).send(error.message)
    }
  }
)

router.delete(
  "/:requestId/requestRequestComments/:requestCommentId",
  checkToken,
  validateId("requestId", "requestCommentId"),
  async (req, res) => {
    try {
      const request = await Request.findById(req.params.requestId)
      if (!request) return res.status(404).send("request not found")

      const requestCommentFound = await RequestComment.findById(req.params.requestCommentId)
      if (!requestCommentFound) return res.status(404).send("requestcomment not found")

      const user = await User.findById(req.userId)

      if (requestCommentFound.owner != req.userId) return res.status(403).send("unauthorized action")

      await Request.findByIdAndUpdate(req.params.requestId, {
        $pull: { requestRequestComments: requestCommentFound._id },
      })

      await RequestComment.findByIdAndRemove(req.params.requestCommentId)

      res.send("requestcomment is removed")
    } catch (error) {
      console.log(error)
      res.status(500).send(error.message)
    }
  }
)

module.exports = router
