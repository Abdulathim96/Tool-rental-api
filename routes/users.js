const express = require("express")
const jwt = require("jsonwebtoken")
const nodemailer = require("nodemailer")
const bcrypt = require("bcrypt");
const router = express.Router()
const { User, signupJoi, loginJoi, profileJoi } = require("../models/User")
const checkToken = require("../middleware/checkToken")
const checkAdmin = require("../middleware/checkAdmin")
const validateBody = require("../middleware/validateBody")
const checkId = require("../middleware/checkId")
require('dotenv').config()
const { Comment } = require("../models/Comment")
const { Offer } = require("../models/Offer")

router.post("/signup", validateBody(signupJoi), async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNumber, password, avatar } = req.body

    const result = signupJoi.validate(req.body)
    if (result.error) return res.status(404).send(result.error.details[0].message)

    const userFound = await User.findOne({ email })
    if (userFound) return res.status(400).send("user already registered")

    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)

    const user = new User({
      firstName,
      lastName,
      email,
      phoneNumber,
      password: hash,
      avatar,
      role: "User",
    })

    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: "abdulathim96@gmail.com", // generated ethereal user
        pass: "Azeem1996", // generated ethereal password
      },
    })

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: "15d" })
    await transporter.sendMail({
      from: " 'testfgv' <abdulathim96@gmail.com>", // sender address
      to: email, // list of receivers
      subject: "Hello ✔", // Subject line

      html: `Hello please click on this link to verify your email.
      <a href="http://localhost:3000/email_verified/${token}>Verify email</a>`,
    })

    await user.save()

    delete user._doc.password

    res.send("user created please check your")
  } catch (error) {
    res.status(500).send(error.message)
  }
})

//get email verification 
router.get("/verify_email/:token" , async (req , res) => {
  try{
    const decryptedToken = jwt.verify(req.params.token, process.env.JWT_SECRET_KEY);
    const userId = decryptedToken.id;
  
    const user = await User.findByIdAndUpdate(userId , {$set :{emailVerified : true}})
    if (!user) return res.status(404).send("user not found");

    res.send("user verified")
  
  }catch (error) {
    res.status(500).send(error.message)
  }
  
})

//Admin 
router.post("/add-admin", checkAdmin, validateBody(signupJoi), async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNumber, password, avatar } = req.body

    const userFound = await User.findOne({ email })
    if (userFound) return res.status(400).send("user already registered")

    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)

    const user = new User({
      firstName,
      lastName,
      email,
      phoneNumber,
      password: hash,
      avatar,
      role: "Admin",
    })

    await user.save()

    delete user._doc.password

    res.json(user)
  } catch (error) {
    res.status(500).send(error.message)
  }
})

router.get("/users", checkAdmin, async (req, res) => {
  const users = await User.find().select("-password -__v")
  res.json(users)
})

router.delete("/users/:id", checkAdmin, checkId, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).send("user not found")

    if (user.role === "Admin") return res.status(403).send("unauthorized action")

    await User.findByIdAndRemove(req.params.id)

    await Comment.deleteMany({ owner: req.params.id })
    await Offer.deleteMany({ owner: req.params.id })

    res.send("user is deleted")
  } catch (error) {
    res.status(500).send(error.message)
  }
})

router.post("/login", validateBody(loginJoi), async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user) return res.status(404).send("user not found")

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(400).send("password incorrect")

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: "15d" })

    res.send(token)
  } catch (error) {
    res.status(500).send(error.message)
  }
})

router.post("/login/admin", validateBody(loginJoi), async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user) return res.status(404).send("user not found")
    if (user.role != "Admin") return res.status(403).send("you are not admin")

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(400).send("password incorrect")

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: "15d" })

    res.send(token)
  } catch (error) {
    res.status(500).send(error.message)
  }
})

router.get("/profile", checkToken, async (req, res) => {
  const user = await User.findById(req.userId).select("-__v -password")
  res.json(user)
})

router.put("/profile", checkToken, validateBody(profileJoi), async (req, res) => {
  const { firstName, lastName, password, avatar } = req.body

  let hash
  if (password) {
    const salt = await bcrypt.genSalt(10)
    hash = await bcrypt.hash(password, salt)
  }

  const user = await User.findByIdAndUpdate(
    req.userId,
    { $set: { firstName, lastName, password: hash, avatar } },
    { new: true }
  ).select("-__v -password")

  res.json(user)
})

module.exports = router
