import cloudinary from "../config/cloudinary.js";
import fs from "fs";

export const uploadCloudinary = async (filePath) => {

    try {

        console.log("Uploading started...");

        const result = await cloudinary.uploader.upload(
            filePath,
            {
                folder: "onemore-products",
                resource_type: "image",
                timeout: 12000000,
                quality: "auto"
            }
        );

        console.log("Upload success");

        try {

            if (fs.existsSync(filePath)) {

                fs.unlinkSync(filePath)
            }

        } catch (err) {

            console.log(
                "File delete skipped"
            )
        }

        return result.secure_url;

    } catch (error) {

        console.log("Cloudinary Upload Error:");
        console.log(error);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        return null;
    }
};