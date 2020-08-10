const { check, validationResult } = require("express-validator");
const InputValidator = {
    /**
     *
     *@param {array} fields
     * @param {array} rules
     * @param {*} req
     *
     * Example
     * validate(["email","password"],[{email:true,required:true},["required":true,"string":true,max:{state:true,length:10}]])
     */
    validate(
        fields = ["username"],
        rules = [{ string: true, max: { state: true, length: 10 } }],
        req = null
    ) {
        // loop through the fields and apply validation rules for each field
        fields.forEach((field, index) => {
            // get rules for current field from rules array
            let currentRules = rules[index];
            for (const rule in currentRules) {
                switch (rule) {
                    case "string":
                        if (currentRules[rule]) {
                            check(field)
                                .isString()
                                .withMessage(`${field} must be a string`)
                                .bail();
                        }
                        break;
                    case "required":
                        if (currentRules[rule]) {
                            check(field)
                                .not()
                                .notEmpty()
                                .withMessage(`${field} is required`)
                                .bail();
                        }
                        break;
                    case "email":
                        if (currentRules[rule]) {
                            check(field)
                                .isEmail()
                                .withMessage(`${field} must be a valid email`)
                                .bail();
                        }
                        break;
                    case "max":
                        if (currentRules[rule].state === true) {
                            check(field)
                                .isLength({ max: currentRules[rule].length })
                                .withMessage(
                                    `${field} must be at most ${currentRules[rule].length}`
                                )
                                .bail();
                        }
                        break;
                    case "min":
                        if (currentRules[rule].state === true) {
                            check(field)
                                .isLength({ min: currentRules[rule].length })
                                .withMessage(
                                    `${field} must be at least ${currentRules[rule].length}`
                                )
                                .bail();
                        }
                        break;
                    case "confirm_password":
                        if (currentRules[rule]) {
                            check(field)
                                .custom(value => {
                                    if (value !== req.body.confirm_password) {
                                        throw new Error("Passwords don't match");
                                    } else {
                                        return value;
                                    }
                                })
                                // eslint-disable-next-line quotes
                                .withMessage(`Password confirmation don't match`)
                                .bail();
                        }
                        break;
                    default:
                        break;
                }
            }
        });
    },
    error_bag(request) {
        return validationResult(request);
    },
    //{ format: "", am_pm: false }
    isDateTime(value, options = {}) {
        if (options.format === undefined) {
            options.format = " MM/DD/YYYY h:m:s";
        }
        if (options.am_pm === undefined) {
            options.am_pm = false;
        }
        // ^(1[0-2]|0?[1-9]):([0-5]?[0-9])(●?[AP]M)?$
        //08/10/2020 4:49 PM

        // const regex = /^(([0-2])-()-() ([][0-]):([0-5][0-9]))$/;
        //get date time components
        const [date, time] = value.split(" ");
        const [f_date, f_time] = options.split(" ");
        // get date separator
        const get_date_separator = function() {
            let _slash = date.split("/");
            let _dash = date.split("-");
            if (_slash.length > 1 && _dash.length <= 1) {
                return "/";
            } else if (_dash.length > 1 && _slash.length <= 1) {
                return "-";
            }
            return undefined;
        };
        const date_sep = get_date_separator(date);
        const f_date_sep = get_date_separator(f_date);
    }
};

module.exports = InputValidator;

InputValidator.isDateTime("08/10/2020 4:49 PM", { am_pm: true });
InputValidator.isDateTime("08/10/2020 4:49 PM", { am_pm: true });