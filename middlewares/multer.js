import multer from "multer";
import path from "path";

const storage = multer.diskStorage({

    destination: function (req, file, cb) {

        cb(null, "public/uploads/");
    },

    filename: function (req, file, cb) {

        const uniqueName =
            Date.now() + path.extname(file.originalname);

        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {

    const allowedTypes =
        /jpeg|jpg|png|webp/

    const extname = allowedTypes.test(
        path.extname(file.originalname).toLowerCase()
    )

    const mimetype =
        allowedTypes.test(file.mimetype)

    if (extname && mimetype) {

        return cb(null, true)
    }

    cb(new Error("Only image files are allowed"))
}

const upload = multer({
    storage,
    fileFilter
})

export default upload;