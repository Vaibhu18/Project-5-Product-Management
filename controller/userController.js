const jwt = require("jsonwebtoken");
const jwt_decode = require("jwt-decode")
const bcrypt = require("bcrypt");
const userModel = require("../models/userModel");
const updateFiles = require('../aws/aws')

const { isValidName, isValid, isValidEmail, isValidImageType, isValidPhone, isValidPassword, isValidPinCode } = require("../validators/validation");
const { update } = require("../models/userModel");

const createUser = async function (req, res) {
    try {
        let data = req.body
        let file = req.files

        if (!isValid(data.fname))
            return res.status(400).send({ status: false, msg: "The First Name Attributes must be required, don't be left blank" })
        if (!isValidName(data.fname))
            return res.status(400).send({ status: false, msg: "Please enter valid first name and is in only alphabet format" })


        if (!isValid(data.lname))
            return res.status(400).send({ status: false, msg: "The Last Name Attributes must be required, don't be left blank" })
        if (!isValidName(data.lname))
            return res.status(400).send({ status: false, msg: "Please enter valid last name and is in only alphabet format" })


        if (!isValid(data.email))
            return res.status(400).send({ status: false, msg: "The Email Attributes must be required, don't be left blank" })

        if (!isValidEmail(data.email))
            return res.status(400).send({ status: false, msg: "Please enter valid Email" })

        const checkEmail = await userModel.findOne({ email: data.email })
        if (checkEmail) return res.status(400).send({ status: false, message: "Email already exists, please enter anothor Email" })

        if (!file || file.length == 0) {
            return res.status(400).send({ status: false, message: "Image File must be require, Please Provide it" });
        }

        if (!isValidImageType(file[0].mimetype))
            return res.status(400).send({ status: false, msg: "Please Provide Valid Image Files in Format of [ jpg , jpge ,png ]" })

        data.profileImage = await updateFiles.uploadFile(req.files[0])


        if (!isValid(data.phone))
            return res.status(400).send({ status: false, msg: "The phone Attributes must be required, don't left blank" })
        if (!isValidPhone(data.phone))
            return res.status(400).send({ status: false, msg: "Please enter valid phone number" })

        const checkPhone = await userModel.findOne({ phone: data.phone })
        if (checkPhone) return res.status(400).send({ status: false, message: "Phone already exists, please enter anothor Phone Number" })


        if (!data.password) return res.status(400).send({ status: false, message: "Password is missing" });
        if (!isValidPassword(data.password)) return res.status(400).send({ status: false, message: "Password should be within 8-15 Characters and must contain special, number, upper and lower character" })


        if (!data.address) {
            return res.status(400).send({ status: false, msg: "Shipping and Billing address required with details [ex- Street, City, Pincode]" })
        }

        let shipping = data.address.shipping
        let billing = data.address.billing

        if (!shipping.street) return res.status(400).send({ status: false, msg: "shipping street is missing" })
        if (!shipping.city) return res.status(400).send({ status: false, msg: "shipping city is missing" })
        if (!shipping.pincode) return res.status(400).send({ status: false, msg: "shipping pincode is missing" })


        if (!billing.street) return res.status(400).send({ status: false, msg: "billing street is missing" })
        if (!billing.city) return res.status(400).send({ status: false, msg: "billing city is missing" })
        if (!billing.pincode) return res.status(400).send({ status: false, msg: "billing pincode is missing" })


        if (!isValidName(shipping.street)) return res.status(400).send({ status: false, msg: "shipping street is not valid, this is only in alphabet format" })

        if (!isValidName(billing.street)) return res.status(400).send({ status: false, msg: "billing street is not valid, this is only in alphabet format" })


        if (!isValidName(shipping.city)) return res.status(400).send({ status: false, msg: "shipping city is not valid, this is only in alphabet format" })

        if (!isValidName(billing.city)) return res.status(400).send({ status: false, msg: "billing city is not valid, this is only in alphabet format" })


        if (!isValidPinCode(shipping.pincode))
            return res.status(400).send({ status: false.valueOf, message: "pincode format not correct in shipping pincode" })

        if (!isValidPinCode(billing.pincode))
            return res.status(400).send({ status: false.valueOf, message: "pincode format not correct in billing pincode" })


        const saltRounds = 10;
        let encryptedPassword = bcrypt
            .hash(data.password, saltRounds)
            .then((hash) => {
                console.log(`Hash: ${hash}`);
                return hash;
            });

        data.password = await encryptedPassword;

        const user = await userModel.create(data);
        return res.status(201).send({ status: true, message: 'User Created Successfully', data: user });
    } catch (err) {
        res.status(500).send({ err: err.message })
    }
}





const loginUser = async function (req, res) {
    try {
        let data = req.body

        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, message: "login credentials required [ Email , Password ]" });
        }

        if (!data.email) return res.status(400).send({ status: false, msg: "Email must be required for Login" })
        if (!data.password) return res.status(400).send({ status: false, msg: "Password must be required for Login" })


        let checkEmail = await userModel.findOne({ email: data.email }).collation({ locale: "en", strength: 2 });
        if (!checkEmail) return res.status(404).send({ status: false, msg: "Provided Email is not present in database" })

        let compare = await bcrypt.compare(data.password, checkEmail.password).then((res) => {
            return res;
        });
        if (!compare) {
            return res.status(401).send({ status: false, msg: "Incorrect Password" });
        }

        let token = jwt.sign(
            {
                userId: checkEmail._id.toString(),
                exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24),
                iat: Math.floor(Date.now() / 1000),
            },
            "MedPlus"
        );

        res.header("Authorization", "Bearer : " + token);
        return res.status(200).send({
            status: true,
            msg: "User logged in successfully",
            data: { userId: checkEmail._id, token: token },
        });

    } catch (err) {
        res.status(500).send({ err: err.message })
    }
}


const getUser = async function (req, res) {
    try {
        let user = req.params.userId

        if (user.length != 24) return res.status(400).send({ status: false, msg: "You are missing or adding some elements" })

        let checkuser = await userModel.findById({ _id: user })
        if (!checkuser) return res.status(404).send({ status: false, msg: "Provided userId not present in DB, Please try with Valid UserId" })


        if (veryfyUser != user) {
            return res.status(400).send({ status: false, msg: "You are not authorised" })
        } else {
            let data = await userModel.findById({ _id: user })
            return res.status(200).send({ status: true, msg: "User profile details", data: data })
        }

    } catch (err) {
        res.status(500).send({ err: err.message })
    }
}




const updateUser = async function (req, res) {
    try {
        let user = req.params.userId
        let data = req.body
        let file = req.files

        if (!file || file.length == 0) {
            return res.status(400).send({ status: false, message: "Image File must be require, Please Provide it" });
        }

        if (!isValidImageType(file[0].mimetype))
            return res.status(400).send({ status: false, msg: "Please Provide Valid Image Files in Format of [ jpg , jpge ,png ]" })

        data.profileImage = await updateFiles.uploadFile(req.files[0])


        if (!isValid(data.fname))
            return res.status(400).send({ status: false, msg: "The First Name Attributes must be required, don't be left blank" })
        if (!isValidName(data.fname))
            return res.status(400).send({ status: false, msg: "Please enter valid first name and is in only alphabet format" })

        if (!isValid(data.lname))
            return res.status(400).send({ status: false, msg: "The Last Name Attributes must be required, don't be left blank" })
        if (!isValidName(data.lname))
            return res.status(400).send({ status: false, msg: "Please enter valid last name and is in only alphabet format" })

        if (!data.password) return res.status(400).send({ status: false, message: "Password is missing" });
        if (!isValidPassword(data.password)) return res.status(400).send({ status: false, message: "Password should be within 8-15 Characters and must contain special, number, upper and lower character" })

        const saltRounds = 10;
        let encryptedPassword = bcrypt
            .hash(data.password, saltRounds)
            .then((hash) => {
                console.log(`Hash: ${hash}`);
                return hash;
            });
        data.password = await encryptedPassword;


        if (!data.address) {
            return res.status(400).send({ status: false, msg: "Shipping and Billing address required with details [ex- Street, City, Pincode]" })
        }

        let shipping = data.address.shipping
        let billing = data.address.billing

        if (!shipping.street) return res.status(400).send({ status: false, msg: "shipping street is missing" })
        if (!shipping.city) return res.status(400).send({ status: false, msg: "shipping city is missing" })
        if (!shipping.pincode) return res.status(400).send({ status: false, msg: "shipping pincode is missing" })


        if (!billing.street) return res.status(400).send({ status: false, msg: "billing street is missing" })
        if (!billing.city) return res.status(400).send({ status: false, msg: "billing city is missing" })
        if (!billing.pincode) return res.status(400).send({ status: false, msg: "billing pincode is missing" })


        if (!isValidName(shipping.street)) return res.status(400).send({ status: false, msg: "shipping street is not valid, this is only in alphabet format" })

        if (!isValidName(billing.street)) return res.status(400).send({ status: false, msg: "billing street is not valid, this is only in alphabet format" })


        if (!isValidName(shipping.city)) return res.status(400).send({ status: false, msg: "shipping city is not valid, this is only in alphabet format" })

        if (!isValidName(billing.city)) return res.status(400).send({ status: false, msg: "billing city is not valid, this is only in alphabet format" })


        if (!isValidPinCode(shipping.pincode))
            return res.status(400).send({ status: false.valueOf, message: "pincode format not correct in shipping pincode" })

        if (!isValidPinCode(billing.pincode))
            return res.status(400).send({ status: false.valueOf, message: "pincode format not correct in billing pincode" })


        let update = {}
        update.fname = data.fname,
            update.lname = data.lname,
            update.password = data.password,
            update.profileImage = data.profileImage,
            update.address = data.address


        if (veryfyUser != user) {
            return res.status(400).send({ status: false, msg: "You are not authorised Person to doing chenges in Profile" })
        } else {
            let result = await userModel.findOneAndUpdate({ _id: user }, update, { new: true })
            return res.status(200).send({ status: true, message: "Success", data: result })
        }

    } catch (err) {
        res.status(500).send({ err: err.message })
    }
}

module.exports = { createUser, loginUser, getUser, updateUser }