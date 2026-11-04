import logger from "./logger.js";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";

export const uploadCloudinary = async (filePath) => {

    try {


        const result = await cloudinary.uploader.upload(
            filePath,
            {
                folder: "onemore-products",
                resource_type: "image",
                quality: "auto"
            }
        );

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
        }

        return result.secure_url

    } catch (error) {
        logger.error("Cloudinary upload error details", {
            message: error.message,
            stack: error.stack
        });

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
        }

        return null
    }
};