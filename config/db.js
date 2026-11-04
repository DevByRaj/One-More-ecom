
import mongoose from "mongoose"
import logger from "../utils/logger.js"

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI

    if (!mongoURI) {
      throw new Error("MONGO_URI is not defined")
    }

    const conn = await mongoose.connect(mongoURI)

    logger.info(`MongoDB Connected: ${conn.connection.host}`)

  } catch (error) {
    logger.error("Database connection failed", {
      message: error.message,
      stack: error.stack
    })

    process.exit(1)
  }
}

mongoose.connection.on("connected", () => {
  logger.info("MongoDB connection established")
})

mongoose.connection.on("error", (err) => {
  logger.error("MongoDB error", {
    message: err.message,
    stack: err.stack
  })
})

mongoose.connection.on("disconnected", () => {
  logger.warn("MongoDB disconnected")
})

export default connectDB
