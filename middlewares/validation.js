import {body} from "express-validator"

export const validateSignup = [
    body("name").trim().notEmpty().withMessage("Name Required"),

    body("email").trim()
    .isEmail().withMessage("Enter valid Email")
    .notEmpty().withMessage("Email is required")
    .matches(/^[a-zA-Z0-9._%+-]+@gmail\.com$/)
    .withMessage("Required valid email address"),

    body("password").notEmpty().withMessage("Password is required")
    .isLength({min: 10}).withMessage("Password must be atleast 10 characters")
    .matches(/[A-Z]/).withMessage("Must contain at least one uppercase letter")
    .matches(/[a-z]/).withMessage("Must contain at least one lowercase letter")
    .matches(/[0-9]/).withMessage("Must contain at least one number")
    .matches(/[@$!%*?&]/).withMessage("Must contain a special character"),

    body("confirmPassword").custom((value, {req}) =>{
        if(value !== req.body.password){
            throw new Error("Password do not match")
        }
        return true;
    }),
    body("refCode")
    .optional().trim()
]