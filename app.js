import "dotenv/config";   // ✅ only this needed

import express from "express";
import router from "./routes/userRoute.js";
import connectDB from "./config/db.js";
import path from "path";
import { fileURLToPath } from "url";
import passport from "passport";
import session from "express-session";

import "./config/passport.js";

const app = express();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) =>{
  res.set("Cache-Control", "no-store")
  next()
})

app.use(
  session({
    secret: "onemoreSecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/", router);

const startServer = async () => {
  try {
    console.log("connecting DB....")
    await connectDB();
    console.log("DB connected")
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();