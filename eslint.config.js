import globals from "globals"

export default [
    {
        files: ["**/*.js"],

        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",

            globals: {
                ...globals.node,
                ...globals.browser
            }
        },

        rules: {
            "no-undef": "error",
            "no-unused-vars": "warn",
            "no-unreachable": "error",
            "no-dupe-keys": "error"
        }
    }
]
