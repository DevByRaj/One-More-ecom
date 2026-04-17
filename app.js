import express from "express"
import router from "./routes/userRoute.js"
import dotenv from "dotenv"
import connectDB from "./config/db.js"
import path from "path"
import {fileURLToPath} from 'url'
import session from "express-session"

const app = express()

dotenv.config()

console.log("MONGO_URI RAW:", process.env.MONGO_URI);


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")))

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    session({
        secret: "onemoreSecret",
        resave: false,
        saveUninitialized: false,
        cookie:{
            maxAge: 1000*60*60^24
        }
    })
)


app.use("/", router)


const startServer = async () =>{
    try {
        await connectDB()
        const PORT =  3000
        app.listen(PORT, () =>{
            console.log(`Server is running on port ${PORT}`)
        })
    } catch (error) {
        console.error('Faild to start server:', error)
        process.exit(1)
    }
}
startServer()