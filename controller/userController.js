const jwt = require("jsonwebtoken")
const mongoose = require('mongoose');
const bcrypt = require("bcrypt");
const userModel = require("../models/userModel");
const updateFiles = require('../aws/aws')

const validName = /^[a-zA-Z ]{3,20}$/
const validEmail = /^[a-z0-9]+@[a-z]+\.[a-z]{2,3}/
const validPhoneNumber = /^[0]?[6789]\d{9}$/
const validPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,15}$/;


const { isValid, isValidAddress, isValidPinCode } = require("../validators/validation");


const createUser = async function (req, res) {
    try {

        let data = req.body
        let file = req.files

        let { fname, lname, email, profileImage, phone, password, address, ...rest } = data
        let { shipping, billing, ...remaining } = address

        //-------------------------------------------- Mandatory Fields ---------------------------------------------//

        if (Object.keys(data).length == 0)
            return res.status(400).send({ status: false, message: "Please enter some data in request body" })

        if (Object.keys(rest).length > 0)
            return res.status(400).send({ status: false, message: "Invalid attribute in request body" })

        if (Object.keys(remaining).length > 0)
            return res.status(400).send({ status: false, message: "Invalid attribute in address body" })

        if (!fname)
            return res.status(400).send({ status: false, message: "The First Name Attributes must be required" })

        if (!lname)
            return res.status(400).send({ status: false, message: "The Last Name Attributes must be required" })

        if (!email)
            return res.status(400).send({ status: false, message: "The Email Attributes must be required" })

        if (!phone)
            return res.status(400).send({ status: false, message: "The phone Attributes must be required" })

        if (!password)
            return res.status(400).send({ status: false, message: "The Password Attributes must be required" });

        if (!address)
            return res.status(400).send({ status: false, message: "Shipping and Billing address required with details [ex- Street, City, Pincode]" })

        if (!shipping)
            return res.status(400).send({ status: false, message: "Shipping address required with details [ex- Street, City, Pincode]" })

        if (!billing)
            return res.status(400).send({ status: false, message: "Billing address required with details [ex- Street, City, Pincode]" })

        if (!shipping.street)
            return res.status(400).send({ status: false, message: "Shipping street is missing" })

        if (!shipping.city)
            return res.status(400).send({ status: false, message: "Shipping city is missing" })

        if (!shipping.pincode)
            return res.status(400).send({ status: false, message: "Shipping pincode is missing" })

        if (!billing.street)
            return res.status(400).send({ status: false, message: "Billing street is missing" })

        if (!billing.city)
            return res.status(400).send({ status: false, message: "Billing city is missing" })

        if (!billing.pincode)
            return res.status(400).send({ status: false, message: "Billing pincode is missing" })



        //-------------------------------------------- Validation Fields ---------------------------------------------//

        if (!validName.test(fname))
            return res.status(400).send({ status: false, message: "Please enter valid First Name, This is in only Alphabet Format" })

        if (!validName.test(lname))
            return res.status(400).send({ status: false, message: "Please enter valid Last Name This is in only alphabet format" })

        if (!validEmail.test(email))
            return res.status(400).send({ status: false, message: "Please enter valid Email" })

        if (!validPhoneNumber.test(phone))
            return res.status(400).send({ status: false, message: "Please enter valid Phone Number" })

        if (!validPassword.test(password)) {
            return res.status(400).send({
                status: false,
                message: "password must have atleast 1digit, 1uppercase, 1lowercase, special symbols(@$!%*?&) and between 8-15 range,ex:Vaibhav@123"
            })
        }
        if (!isValidAddress(shipping.street))
            return res.status(400).send({ status: false, message: "shipping street is not valid, this is only in alphabet format" })

        if (!validName.test(shipping.city))
            return res.status(400).send({ status: false, message: "shipping city is not valid, this is only in alphabet format" })

        if (!isValidPinCode(shipping.pincode))
            return res.status(400).send({ status: false, message: "pincode format not correct in shipping pincode" })

        if (!isValidAddress(billing.street))
            return res.status(400).send({ status: false, message: "billing street is not valid, this is only in alphabet format" })

        if (!validName.test(billing.city))
            return res.status(400).send({ status: false, message: "billing city is not valid, this is only in alphabet format" })

        if (!isValidPinCode(billing.pincode))
            return res.status(400).send({ status: false, message: "pincode format not correct in billing pincode" })


        //-------------------------------------------- Unique Fields ---------------------------------------------//

        const checkEmail = await userModel.findOne({ email: email })
        if (checkEmail) return res.status(400).send({ status: false, message: "Email Id already exists" })

        const checkPhone = await userModel.findOne({ phone: phone })
        if (checkPhone) return res.status(400).send({ status: false, message: "Phone Number already exists" })

        //-------------------------------------------- Image, Password, Saving Fields ---------------------------------------------//

        const saltRounds = 10;
        data.password = bcrypt.hashSync(password, saltRounds)

        if (!file.length) return res.status(400).send({ status: false, message: "Please Provide the Image file" })

        mimetype = file[0].mimetype.split("/")
        if (mimetype[0] !== "image") return res.status(400).send({ status: false, message: "Please Upload the Image File only" })
        if (file && file.length > 0) var uploadedFileURL = await updateFiles.uploadFile(file[0])
        data.profileImage = uploadedFileURL

        const user = await userModel.create(data);
        return res.status(201).send({ status: true, message: 'User Created Successfully', data: user });
    } catch (err) {
        res.status(500).send({ err: err.message })
    }
}



const loginUser = async function (req, res) {
    try {
        let data = req.body
        let { Email, Password } = data

        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, message: "login credentials required [ Email , Password ]" });
        }

        if (!Email)
            return res.status(400).send({ status: false, msg: "Email must be required for Login" })

        if (!Password)
            return res.status(400).send({ status: false, msg: "Password must be required for Login" })


        if (!validEmail.test(Email))
            return res.status(400).send({ status: false, message: "Please enter valid Email" })

        if (!validPassword.test(Password)) {
            return res.status(400).send({
                status: false,
                message: "password must have atleast 1digit, 1uppercase, 1lowercase, special symbols(@$!%*?&) and between 8-15 range,ex:Vaibhav@123"
            })
        }

        let checkEmail = await userModel.findOne({ email: Email })

        if (!checkEmail)
            return res.status(404).send({ status: false, msg: "Provided Email is not present in database" })

        let compare = await bcrypt.compare(Password, checkEmail.password).then((res) => {
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

        let final = { userId: checkEmail._id, token: token }
        return res.status(200).send({ status: true, message: 'User login successfully', data: final })

    } catch (err) {
        res.status(500).send({ err: err.message })
    }
}



const getUser = async function (req, res) {
    try {
        let user = req.params.userId
        if (!mongoose.Types.ObjectId.isValid(user)) return res.status(400).send({ status: false, msg: "provided userId is not valid" })


        let checkuser = await userModel.findById({ _id: user })
        if (!checkuser) return res.status(404).send({ status: false, msg: "Provided userId not present in DB, Please try with Valid UserId" })


        if (verifyUser != user) {
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
        let userId = req.params.userId
        let files = req.files
        var data = req.body
        let { fname, lname, email, profileImage, phone, password, address, ...rest } = data



        //------------------------------ Authorization -------------------------------//

        if (verifyUser != userId) {
            return res.status(400).send({ status: false, msg: "You are not authorised" })
        }


        if (Object.keys(rest).length > 0)
            return res.status(400).send({ status: false, message: "Invalid attribute in request body" })

        if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).send({ status: false, msg: "provided userId is not valid" })

        var productDoc = await userModel.findOne({ _id: userId })
        if (!productDoc)
            return res.status(404).send({ status: false, msg: "no such product available" })


        if ("fname" in data) {
            if (!isValid(fname))
                return res.status(400).send({ status: false, msg: "First Name can't be Empty" })

            if (!validName.test(fname))
                return res.status(400).send({ status: false, msg: "Please enter valid First Name" })
            productDoc.fname = fname
        }


        if ("lname" in data) {
            if (!isValid(lname))
                return res.status(400).send({ status: false, msg: "Last Name can't be Empty" })

            if (!validName.test(lname))
                return res.status(400).send({ status: false, msg: "Please enter valid Last Name" })
            productDoc.lname = lname
        }

        if ("password" in data) {
            if (!isValid(password))
                return res.status(400).send({ status: false, msg: "Password can't be Empty" })

            if (!validPassword.test(password))
                return res.status(400).send({ status: false, msg: "Please enter valid Password" })

            const saltRounds = 10;
            productDoc.password = bcrypt.hashSync(password, saltRounds)
        } 

        if (files.length > 0) {
            mimetype = files[0].mimetype.split("/")
            if (mimetype[0] !== "image") return res.status(400).send({ status: false, message: "Please Upload the Image File only" })
            if (files && files.length > 0) var uploadedFileURL = await updateFiles.uploadFile(files[0])
            productDoc.profileImage = uploadedFileURL
        }

        
        if ("address" in data) {
            if (address.shipping) {
                const { street, city, pincode } = address.shipping;
                if (street) {
                    if (!isValid(street))
                        return res.status(400).send({ status: false, msg: "shipping street is not valid " });
                        productDoc.address.shipping.street = street;
                }
                if (city) {
                    if (!isValid(city))
                        return res.status(400).send({ status: false, msg: "shipping city is not valid " });
                        productDoc.address.shipping.city = city;
                }
                if (pincode) {
                    if (!isValidPinCode(pincode))
                        return res.status(400).send({ status: false, msg: "shipping pincode is not valid " });
                        productDoc.address.shipping.pincode = pincode;
                }
            }


            if (address.billing) {
                const { street, city, pincode } = address.billing;
                if (street) {
                    if (!isValid(street))
                        return res.status(400).send({ status: false, msg: "billing street is not valid " });
                        productDoc.address.billing.street = street;
                }
                if (city) {
                    if (!isValid(city))
                        return res.status(400).send({ status: false, msg: "billing city is not valid " });
                        productDoc.address.billing.city = city;
                }
                if (pincode) {
                    if (!isValidPinCode(pincode))
                        return res.status(400).send({ status: false, msg: "billing pincode is not valid " });
                        productDoc.address.billing.pincode = pincode;
                }
            }

        }
        productDoc.save()
        return res.status(200).send({ status: true, msg: "success", data: productDoc })

    } catch (err) {
        res.status(500).send({ status: false, message: err.message });
    }
}

module.exports = { createUser, loginUser, getUser, updateUser }