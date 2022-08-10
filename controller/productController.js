const productModel = require("../models/productModel")
const updateFiles = require('../aws/aws')
const mongoose = require('mongoose');
const { isValidName, isValid, isValidImageType, isValidInstallment, isValidTitle,
    isValidDescription, isValidPrice } = require("../validators/validation");

const validTitle = /^[a-zA-Z0-9 ]{3,50}$/


const createProduct = async function (req, res) {
    try {
        let data = req.body
        let file = req.files

        let { title, description, price, currencyId, currencyFormat, productImage,
            style, availableSizes, installments, isFreeShipping, ...rest } = data

        if (Object.keys(data).length == 0)
            return res.status(400).send({ status: false, message: "Please enter some data in request body" })

        if (Object.keys(rest).length > 0)
            return res.status(400).send({ status: false, message: "Invalid attribute in request body" })

        //-------------------------------------------- Mandatory Fields ---------------------------------------------//

        if (!title)
            return res.status(400).send({ status: false, message: "The Title is required" })

        if (!description)
            return res.status(400).send({ status: false, message: "The description is required" })

        if (!price)
            return res.status(400).send({ status: false, message: "The price is required" })

        if (!currencyId)
            return res.status(400).send({ status: false, message: "The currencyId is required" })

        if (!currencyFormat)
            return res.status(400).send({ status: false, message: "The currencyformat is required" })


        //-------------------------------------------- Validation Fields ---------------------------------------------//

        if (!validTitle.test(title))
            return res.status(400).send({ status: false, msg: "Please enter valid Title" })

        const checkTitle = await productModel.findOne({ title: data.title })
        if (checkTitle) return res.status(400).send({ status: false, message: "This Title is already exists, please try with anothor Title" })

        if (!isValidDescription(description.trim()))
            return res.status(400).send({ status: false, message: "Please enter valid description and is in only alphabet format" })

        if (!isValidPrice(price))
            return res.status(400).send({ status: false, message: "Please enter valid price length between 1 - 6 and only in Number format" })

        if (currencyId.trim() != "INR")
            return res.status(400).send({ status: false, message: "Please enter currencyId In Format INR" })

        if (currencyFormat.trim() != "₹")
            return res.status(400).send({ status: false, message: "Please enter currencyFormat In Format ₹" })

        if (!isValidName(data.style))
            return res.status(400).send({ status: false, message: "Please enter valid style and is in only alphabet format" })

        if ("isFreeShipping" in data) {
            if (!((isFreeShipping == "true") || (isFreeShipping == "false")))
                return res.status(400).send({ status: false, messsage: "isFreeShipping should be in boolean value" })
            data.isFreeShipping = isFreeShipping
        }


        if (!file.length) return res.status(400).send({ status: false, message: "Please Provide the Image file" })

        mimetype = file[0].mimetype.split("/")
        if (mimetype[0] !== "image") return res.status(400).send({ status: false, message: "Please Upload the Image File only" })
        if (file && file.length > 0) var uploadedFileURL = await updateFiles.uploadFile(file[0])
        data.productImage = uploadedFileURL


        if ("availableSizes" in data) {
            availableSizes = availableSizes.toUpperCase().split(",");
            data.availableSizes = availableSizes
            for (i of availableSizes) {
                if (!["S", "XS", "M", "X", "L", "XXL", "XL"].includes(i)) {
                    return res.status(400).send({
                        status: false,
                        message: " Enter a valid availableSizes S, XS, M, X, L, XXL, XL "
                    })
                }
            }
        }


        if ("installments" in data) {
            if (!isValid(installments))
                return res.status(400).send({ status: false, message: "Installments is Missing" })

            if (!isValidInstallment(data.installments))
                return res.status(400).send({ status: false, msg: "installments in only number format" })

            if (data.installments >= 37 || data.installments <= 4)
                return res.status(400).send({ status: false, msg: "installment Between 5 to 36 month" })
        }
        const saveData = await productModel.create(data);
        return res.status(201).send({ status: true, message: 'Product Created Successfully', data: saveData });
    } catch (err) {
        res.status(500).send({ err: err.message })
    }
}



const getProduct = async function (req, res) {
    try {
        let querydata = req.query

        var { name, size, priceGreaterThan, priceLessThan, Sorting } = querydata
        let obj = { isDeleted: false };


        if ("name" in querydata) {

            if (name.length == 0) {
                return res.status(400).send({ status: false, msg: "name cant be empty" })
            } else {
                obj.title = { $regex: `${name.toLowerCase()}` }
            }

        }

        if ("size" in querydata) {

            if (size.length != 0) {
                let newSize = size.split(",")
                for (i = 0; i < newSize.length; i++) {
                    if (!["S", "XS", "M", "X", "L", "XXL", "XL"].includes(newSize[i].trim())) { return res.status(400).send({ status: false, msg: `please provide valid Size in between [ S , XS , M , X , L , XXL , XL ]` }) }
                    else {
                        obj.availableSizes = { $in: newSize }
                    }
                }
            } else {

                return res.status(400).send({ status: false, msg: "size cant be empty" })
            }
        }
        if (priceGreaterThan) {
            obj.price = { $gt: priceGreaterThan }
        }

        if (priceLessThan) {
            obj.price = { $lt: priceLessThan }
        }

        if (priceGreaterThan && priceLessThan) {
            obj.price = { $gt: priceGreaterThan, $lt: priceLessThan }
        }

        const productData = await productModel.find(obj).sort({ price: Sorting }).select({ deletedAt: 0 })

        if (productData.length == 0) {
            return res.status(404).send({ status: false, message: "No product found" })
        }

        return res.status(200).send({ status: true, message: 'Success', data: productData })
    }
    catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
}



const getProductById = async function (req, res) {
    try {
        const productId = req.params.productId;

        if (!mongoose.Types.ObjectId.isValid(productId)) return res.status(400).send({ status: false, msg: "provided productId is not valid" })

        const productById = await productModel.findOne({ _id: productId, isDeleted: false })

        if (!productById) {
            return res.status(404).send({
                status: false, message: "No product found by this Product id",
            });
        }
        return res.status(200).send({ status: true, message: "success", data: productById });
    } catch (err) {
        res.status(500).send({ status: false, message: err.message });
    }
}



const updateProduct = async function (req, res) {
    try {
        let productId = req.params.productId
        let imageUrl = req.files
        let data = req.body

        if (!mongoose.Types.ObjectId.isValid(productId))
            return res.status(400).send({ status: false, msg: "provided productId is not valid" })

        let { title, description, price, currencyId, currencyFormat, productImage, style, availableSizes, installments, isFreeShipping, ...rest } = data

        if (Object.keys(data).length == 0 && (!imageUrl))
            return res.status(400).send({ status: false, message: "Please enter some data to update" })

        if (Object.keys(rest).length > 0)
            return res.status(400).send({ status: false, message: "Invalid attribute in request body" })


        let productDoc = await productModel.findOne({ _id: productId, isDeleted: false })

        if (!productDoc)
            return res.status(404).send({ status: false, msg: "no such product available" })


        if (Object.keys(data).length == 0 && !imageUrl) { return res.status(400).send({ status: false, msg: "body can not be empty" }) }

        if ("title" in data) {
            if (!isValid(title))
                return res.status(400).send({ status: false, msg: "Title can't be Empty" })

            if (!isValidTitle(title))
                return res.status(400).send({ status: false, msg: "Please enter valid Title" })

            let uniqueTitle = await productModel.findOne({ title: title })
            if (uniqueTitle) { return res.status(400).send({ status: false, msg: "Title is already exist" }) }
            productDoc.title = title
        }

        if ("description" in data) {
            if (!isValid(description))
                return res.status(400).send({ status: false, msg: "Description cant be empty" })

            if (!isValidDescription(description.trim()))
                return res.status(400).send({ status: false, msg: "Please enter valid Description and is in only alphabet format" })
            productDoc.description = description
        }

        if ("price" in data) {
            if (!isValid(price))
                return res.status(400).send({ status: false, msg: "Price cant be empty" })
            if (!isValidPrice(price.trim()))
                return res.status(400).send({ status: false, message: "Please enter valid price length between 1 - 6 and only in Number format" })
            productDoc.price = price
        }

        if ("currencyId" in data) {
            if (currencyId.trim() !== "INR")
                return res.status(400).send({ status: false, message: "currencyId is invalid " })
            productDoc.currencyId = currencyId
        }

        if ("currencyFormat" in data) {
            if (currencyFormat.trim() !== "₹") return res.status(400).send({ status: false, message: "currencyFormat is invalid " })
            productDoc.currencyFormat = currencyFormat
        }

        if ("style" in data) {
            if (!isValid(style))
                return res.status(400).send({ status: false, msg: "Style is invalid" })
            productDoc.style = style
        }

        if ("availableSizes" in data) {
            if (!isValid(availableSizes)) { return res.status(400).send({ status: false, msg: "availableSizes cant be empty" }) }
            let bodySizes = availableSizes.split(",")
            let docSizes = productDoc.availableSizes
            for (i = 0; i < bodySizes.length; i++) {
                if (!["S", "XS", "M", "X", "L", "XXL", "XL"].includes(bodySizes[i].trim())) { return res.status(400).send({ status: false, msg: "please provide valid" }) }
                bodySizes[i] = bodySizes[i].trim()
                if (!docSizes.includes(bodySizes[i])) {
                    productDoc.availableSizes.push(bodySizes[i])
                }
            }
        }

        if ("installments" in data) {
            if (!isValid(installments))
                return res.status(400).send({ status: false, message: "Installments is Missing" })

            if (!isValidInstallment(data.installments))
                return res.status(400).send({ status: false, msg: "installments in only number format" })

            if (data.installments >= 37 || data.installments <= 4)
                return res.status(400).send({ status: false, msg: "installment Between 5 to 36 month" })
            productDoc.installments = installments
        }

        if ("isFreeShipping" in data) {
            if (!((isFreeShipping == "true") || (isFreeShipping == "false")))
                return res.status(400).send({ status: false, messsage: "isFreeShipping should be in boolean value" })
            productDoc.isFreeShipping = isFreeShipping
        }
        
        if (imageUrl.length > 0) {
            if (!imageUrl.length) { return res.status(400).send({ status: false, msg: "Files cant be empty" }) }
            mimetype = imageUrl[0].mimetype.split("/")
            if (mimetype[0] !== "image") return res.status(400).send({ status: false, message: "Please Upload the Image File only" })
            if (imageUrl && imageUrl.length > 0) var uploadedFileURL = await updateFiles.uploadFile(imageUrl[0])
            productDoc.productImage = uploadedFileURL
        }
    
        let updatedata = await productModel.findOneAndUpdate({ _id: productId, isDeleted: false }, productDoc, { new: true })
        return res.status(200).send({ status: true, message: 'Product updated successfully', data: updatedata })

    } catch (err) {
        res.status(500).send({ status: false, message: err.message });
    }
}


const DeleteProduct = async function (req, res) {
    try {
        let productId = req.params.productId
        if (!mongoose.Types.ObjectId.isValid(productId)) return res.status(400).send({ status: false, msg: "ProductId is not valid" })

        let checkProduct = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!checkProduct) return res.status(404).send({ status: false, message: "No Such Product Found" })

        deletedTime = new Date().toISOString();

        let deletedProduct = await productModel.findByIdAndUpdate({ _id: productId }, { isDeleted: true, deletedAt: deletedTime }, { new: true, })

        res.status(200).send({ status: true, message: "Product Deleted Successfully", data: deletedProduct })
    }
    catch (err) {
        console.log(err)
        return res.status(500).send({ status: false, message: err.message })
    }
}


module.exports = { createProduct, getProduct, getProductById, updateProduct, DeleteProduct }