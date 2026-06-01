import multer from "multer";
import path from "path";
import crypto from "crypto";

const storage = multer.diskStorage({

    destination: (req, file, cb) => {

        cb(null, "public/uploads/");
    },

    filename: (req, file, cb) => {

        const uniqueName =
            crypto.randomUUID();

        cb(
            null,

            uniqueName +
            path.extname(
                file.originalname
            )
        );
    }
});

const fileFilter = (req, file, cb) => {

    const allowed =
        /jpg|jpeg|png|webp/;

    const ext =
        allowed.test(
            path.extname(
                file.originalname
            ).toLowerCase()
        );

        const mime =  allowed.test(file.mimetype)

    if (ext && mime) { 

        cb(null, true);

    } else {

        cb(
            new Error(
                "Only JPG, JPEG, PNG and WEBP images are allowed"
            )
        );
    }
};

const upload = multer({
    storage,
    fileFilter
});

export default upload;