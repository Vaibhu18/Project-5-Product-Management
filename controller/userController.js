const jwt = require("jsonwebtoken");
const jwt_decode = require("jwt-decode")
const mongoose = require('mongoose');
const bcrypt = require("bcrypt");
const userModel = require("../models/userModel");
const updateFiles = require('../aws/aws')

const { isValidName, isValid, isValidEmail, isValidImageType, isValidAddress, isValidPhone, isValidPassword, isValidPinCode } = require("../validators/validation");
const { update } = require("../models/userModel");

const createUser = async function (req, res) {
    try {

        let data = req.body

        let file = req.files


        if (!file || file.length == 0) {
            return res.status(400).send({ status: false, message: "Image File must be require, Please Provide it" });
        }
        if (!isValidImageType(file[0].mimetype))
            return res.status(400).send({ status: false, msg: "Please Provide Valid Image Files in Format of [ jpg , jpge ,png ]" })

        data.profileImage = await updateFiles.uploadFile(req.files[0])



        if (!isValid(data.fname))
            return res.status(400).send({ status: false, msg: "The First Name Attributes must be required" })

        if (!isValidName(data.fname))
            return res.status(400).send({ status: false, msg: "Please enter valid First Name, This is in only Alphabet Format" })

        const checkFname = await userModel.findOne({ fname: data.fname })
        if (checkFname) return res.status(400).send({ status: false, message: "First Name already exists" })



        if (!isValid(data.lname))
            return res.status(400).send({ status: false, msg: "The Last Name Attributes must be required" })

        if (!isValidName(data.lname))
            return res.status(400).send({ status: false, msg: "Please enter valid Last Name This is in only alphabet format" })

        const checkLname = await userModel.findOne({ lname: data.lname })
        if (checkLname) return res.status(400).send({ status: false, message: "Last Name already exists" })



        if (!isValid(data.email))
            return res.status(400).send({ status: false, msg: "The Email Attributes must be required" })

        if (!isValidEmail(data.email))
            return res.status(400).send({ status: false, msg: "Please enter valid Email" })

        const checkEmail = await userModel.findOne({ email: data.email })
        if (checkEmail) return res.status(400).send({ status: false, message: "Email Id already exists" })


        if (!isValid(data.phone))
            return res.status(400).send({ status: false, msg: "The phone Attributes must be required" })
        if (!isValidPhone(data.phone))
            return res.status(400).send({ status: false, msg: "Please enter valid Phone Number" })

        const checkPhone = await userModel.findOne({ phone: data.phone })
        if (checkPhone) return res.status(400).send({ status: false, message: "Phone Number already exists" })


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


        if (!isValidAddress(shipping.street)) return res.status(400).send({ status: false, msg: "shipping street is not valid, this is only in alphabet format" })
        if (!isValidAddress(billing.street)) return res.status(400).send({ status: false, msg: "billing street is not valid, this is only in alphabet format" })


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


        let checkEmail = await userModel.findOne({ email: data.email })
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
        let { fname, lname, password, address } = data


//------------------------Authorization-------------------------//

        if (verifyUser != userId) {
            return res.status(400).send({ status: false, msg: "You are not authorised" })
        } 
        

        if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).send({ status: false, msg: "provided userId is not valid" })

        var productDoc = await userModel.findOne({ _id: userId })
        if (!productDoc) { return res.status(404).send({ status: false, msg: "no such product available" }) }

        if (files.length > 0) {
            if (!isValidImageType(files[0].mimetype))
                return res.status(400).send({ status: false, msg: "Please Provide Valid Image Files in Format of [ jpg , jpge ,png ]" })
            let profileImage = await updateFiles.uploadFile(req.files[0])
            let updateProfile = await userModel.findOneAndUpdate({ _id: userId }, { profileImage: profileImage }, { new: true })

            if (Object.keys(data).length == 0) {
                if (updateProfile) {
                    return res.send(updateProfile)
                }
            }
        }

        if ("fname" in data) {
            if (!isValid(fname)) { return res.status(400).send({ status: false, msg: "First Name can't be Empty" }) }
            if (!isValidName(fname))
                return res.status(400).send({ status: false, msg: "Please enter valid First Name" })
            let uniquefname = await userModel.findOne({ fname: fname })
            if (uniquefname) { return res.status(400).send({ status: false, msg: "First Name is already exist" }) }
            productDoc.fname = fname
        }


        if ("lname" in data) {
            if (!isValid(lname)) { return res.status(400).send({ status: false, msg: "Last Name can't be Empty" }) }
            if (!isValidName(lname))
                return res.status(400).send({ status: false, msg: "Please enter valid Last Name" })
            let uniquelname = await userModel.findOne({ lname: lname })
            if (uniquelname) { return res.status(400).send({ status: false, msg: "Last Name is already exist" }) }
            productDoc.lname = lname
        }

        if ("password" in data) {
            if (!isValid(password)) { return res.status(400).send({ status: false, msg: "Password can't be Empty" }) }
            if (!isValidPassword(password))
                return res.status(400).send({ status: false, msg: "Please enter valid Password" })

            const saltRounds = 10;
            let encryptedPassword = bcrypt
                .hash(data.password, saltRounds)
                .then((hash) => {
                    console.log(`Hash: ${hash}`);
                    return hash;
                });

            productDoc.password = await encryptedPassword;
        }

        const findAddress = await userModel.findOne({ _id: userId });

        if ("address" in data) {
            if (address.shipping) {
                const { street, city, pincode } = address.shipping;
                if (street) {
                    if (!isValid(street))
                        return res.status(400).send({ status: false, msg: "shipping street is not valid " });
                    findAddress.address.shipping.street = street;
                }
                if (city) {
                    if (!isValid(city))
                        return res.status(400).send({ status: false, msg: "shipping city is not valid " });
                    findAddress.address.shipping.city = city;
                }
                if (pincode) {
                    if (!isValidPinCode(pincode))
                        return res.status(400).send({ status: false, msg: "shipping pincode is not valid " });
                    findAddress.address.shipping.pincode = pincode;
                }
            }


            if (address.billing) {
                const { street, city, pincode } = address.billing;
                if (street) {
                    if (!isValid(street))
                        return res.status(400).send({ status: false, msg: "billing street is not valid " });
                    findAddress.address.billing.street = street;
                }
                if (city) {
                    if (!isValid(city))
                        return res.status(400).send({ status: false, msg: "billing city is not valid " });
                    findAddress.address.billing.city = city;
                }
                if (pincode) {
                    if (!isValidPinCode(pincode))
                        return res.status(400).send({ status: false, msg: "billing pincode is not valid " });
                    findAddress.address.billing.pincode = pincode;
                }
            }
            productDoc.address = findAddress.address;

        }


        productDoc.save()
        return res.status(200).send({ status: false, msg: "success", data: productDoc })

    } catch (err) {
        res.status(500).send({ status: false, message: err.message });
    }
}

module.exports = { createUser, loginUser, getUser, updateUser }