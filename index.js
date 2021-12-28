const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
require("dotenv").config()
const Joi = require("joi")
const JoiObjectId = require("joi-objectid")
Joi.objectid = JoiObjectId(Joi)
const app = express()
const users = require("./routes/users")
const offers = require("./routes/offers")
const requests = require("./routes/requests")
const messages = require("./routes/messages")
const categorys = require("./routes/categorys")

mongoose
  .connect(`mongodb://localhost:27017/toolRentalDB`)
  .then(() => console.log("Connected to MongoDB"))
  .catch(error => console.log("Error connecting to MongoDB", error))

app.use(express.json())
app.use(cors())

app.use("/api/auth", users)
app.use("/api/offers", offers)
app.use("/api/requests", requests)
app.use("/api/messages", messages)
app.use("/api/categorys", categorys)

const port = 5000

app.listen(port, () => console.log("Server is listening on port " + port))
