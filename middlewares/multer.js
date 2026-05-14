import multer from "multer";
import path from "path";

const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, "public/uploads/");
    },

    filename: (req, file, cb) => {

        const uniqueName =
            Date.now() +
            path.extname(file.originalname);

        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {

    const allowed =
        /jpg|jpeg|png|webp/;

    const ext =
        allowed.test(
            path.extname(file.originalname).toLowerCase()
        );

    if (ext) {
        cb(null, true);
    } else {
        cb(new Error("Only images allowed"));
    }
};

const upload = multer({
    storage,
    fileFilter
});

export default upload;  
