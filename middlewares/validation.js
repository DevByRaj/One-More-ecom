import {body} from "express-validator";

export const validateSignup = [

    body("name")
        .trim()
        .notEmpty()
        .withMessage("Name is required")
        .isLength({min: 3, max: 30})
        .withMessage("Name must be between 3 and 30 characters")
        .matches(/^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/)
        .withMessage("Please enter a valid name"),

    body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Enter a valid email"),

    body("password")
        .notEmpty()
        .withMessage("Password is required")
        .isLength({min: 10})
        .withMessage("Password must be at least 10 characters")
        .matches(/[A-Z]/)
        .withMessage("Must contain at least one uppercase letter")
        .matches(/[a-z]/)
        .withMessage("Must contain at least one lowercase letter")
        .matches(/[0-9]/)
        .withMessage("Must contain at least one number")
        .matches(/[@$!%*?&]/)
        .withMessage("Must contain a special character"),

    body("confirmPassword")
        .notEmpty()
        .withMessage("Please confirm your password")
        .custom((value, {req}) => {
            if (value !== req.body.password) {
                throw new Error("Passwords do not match");
            }
            return true;
        }),

    body("refCode")
        .optional({checkFalsy: true})
        .trim()
];