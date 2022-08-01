const productModel = require("../models/productModel")
const updateFiles = require('../aws/aws')
const mongoose = require('mongoose');
const { isValidName, isValid, isValidEmail, isValidImageType, isValidInstallment, isValidTitle,
    isValidPassword, isValidDescription, isValidSizes, isValidPrice } = require("../validators/validation");

const createProduct = async function (req, res) {
    try {
        let data = req.body
        let file = req.files

        if (!isValid(data.title))
            return res.status(400).send({ status: false, msg: "The Title is Missing" })
        if (!isValidTitle(data.title))
            return res.status(400).send({ status: false, msg: "Please enter valid Title and is in only alphabet format" })
        const checkTitle = await productModel.findOne({ title: data.title })
        if (checkTitle) return res.status(400).send({ status: false, message: "This Title already exists, please try with anothor Title" })


        if (!isValid(data.description))
            return res.status(400).send({ status: false, msg: "The description is Missing" })
        if (!isValidDescription(data.description))
            return res.status(400).send({ status: false, msg: "Please enter valid description and is in only alphabet format" })

        if (!isValid(data.price))
            return res.status(400).send({ status: false, msg: "The price is Missing" })
        if (!isValidPrice(data.price))
            return res.status(400).send({ status: false, msg: "Please enter valid price length between 1 - 4 and only in Number format" })

        if (!isValid(data.currencyId))
            return res.status(400).send({ status: false, msg: "The currencyId is Missing" })
        if (data.currencyId != "INR")
            return res.status(400).send({ status: false, msg: "Please enter currencyId In Format INR" })

        if (!isValid(data.currencyFormat))
            return res.status(400).send({ status: false, msg: "The currencyformat is Missing" })
        if (data.currencyFormat != "₹")
            return res.status(400).send({ status: false, msg: "Please enter currencyFormat In Format ₹" })

        if (!file || file.length == 0) {
            return res.status(400).send({ status: false, message: "Image File must be require, Please Provide it" });
        }
        if (!isValidImageType(file[0].mimetype))
            return res.status(400).send({ status: false, msg: "Please Provide Valid Image Files in Format of [ jpg , jpge ,png ]" })

        data.productImage = await updateFiles.uploadFile(req.files[0])


        if (!isValidName(data.style))
            return res.status(400).send({ status: false, msg: "Please enter valid style and is in only alphabet format" })

        if (data.availableSizes.length == 0) {
            return res.status(400).send({ status: false, message: "AvailableSizes is Missing" });
        }

        let enumSize = ['S', 'XS', 'M', 'X', 'L', 'XXL', 'XL'];

        data.availableSizes = data.availableSizes.split(",")

        const multipleExist = data.availableSizes.every(value => {
            return enumSize.includes(value);
        })
        if (multipleExist != true) {
            return res.status(400).send({ status: false, msg: "availableSizes should be-[S, XS,M,X, L,XXL, XL]" })
        }

        if (!data.installments || data.installments.length == 0) return res.status(400).send({ status: false, message: "Installments is Missing" })


        if (!isValidInstallment(data.installments)) return res.status(400).send({ status: false, msg: "installments in only number format" })

        if (data.installments >= 37 || data.installments <= 0) return res.status(400).send({ status: false, msg: "installment Between 1 to 36 month" })


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

        if (Object.keys(querydata).length == 0) {
            return res.status(400).send({ status: false, msg: "Body cant be empty" })
        }


        if ("name" in querydata) {

            if (name.length == 0) {
                return res.status(400).send({ status: false, msg: "name cant be empty" })
            } else {
                obj.title = { $regex: name }
            }

        }

        if ("size" in querydata) {

            if (size.length != 0) {
                console.log(size.length)
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
        let { title, description, price, isFreeShipping, style, availableSizes, installments } = data


        if (!mongoose.Types.ObjectId.isValid(productId)) return res.status(400).send({ status: false, msg: "provided productId is not valid" })

        let productDoc = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!productDoc) { return res.status(404).send({ status: false, msg: "no such product available" }) }

        if (Object.keys(data).length == 0 && !imageUrl) { return res.status(400).send({ status: false, msg: "body can not be empty" }) }

        if ("title" in data) {
            if (!isValid(title)) { return res.status(400).send({ status: false, msg: "Title can't be Empty" }) }
            if (!isValidTitle(title))
                return res.status(400).send({ status: false, msg: "Please enter valid Title" })
            let uniqueTitle = await productModel.findOne({ title: title })
            if (uniqueTitle) { return res.status(400).send({ status: false, msg: "Title is already exist" }) }
            productDoc.title = title
        }


        if ("description" in data) {
            if (!isValid(description)) { return res.status(400).send({ status: false, msg: "Description cant be empty" }) }
            if (!isValidDescription(description))
                return res.status(400).send({ status: false, msg: "Please enter valid Description and is in only alphabet format" })
            productDoc.description = description
        }


        if ("price" in data) {
            if (!isValid(price)) { return res.status(400).send({ status: false, msg: "Price cant be empty" }) }
            if (!isValidPrice(data.price))
                return res.status(400).send({ status: false, msg: "Please enter valid price length between 1 - 4 and only in Number format" })
            productDoc.price = price
        }


        if ("isFreeShipping" in data) {
            if (!isValid(isFreeShipping)) { return res.status(400).send({ status: false, msg: "isFreeShipping cant be empty" }) }
            if (!(isFreeShipping == "false" || isFreeShipping == "true")) { return res.status(400).send({ status: false, msg: "isFreeShipping cant be empty" }) }
            if (isFreeShipping == "false") { productDoc.isFreeShipping = false }
            if (isFreeShipping == "true") { productDoc.isFreeShipping = true }
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

        if ("style" in data) {
            if (!isValid(style)) { return res.status(400).send({ status: false, msg: "style cant be empty" }) }
            productDoc.style = style
        }

        if ("installments" in data) {
            if (!isValid(installments)) { return res.status(400).send({ status: false, msg: "installment cant be empty" }) }
            productDoc.installments = installments
        }

        if (!isValid(imageUrl[0])) { return res.status(400).send({ status: false, msg: "Files cant be empty" }) }
        if (!isValidImageType(imageUrl[0].mimetype))
            return res.status(400).send({ status: false, msg: "Please Provide Valid Image Files in Format of [ jpg , jpge ,png ]" })

        // if (imageUrl && imageUrl.length > 0) {
        //     let uploadFileUrl = await updateFiles.uploadFile(imageUrl[0])
        //     productDoc.productImage = uploadFileUrl
        // }
        // else if ("productImage" in data) { return res.status(400).send({ status: false, msg: "please select product image" }) }

        productDoc.save()
        return res.status(200).send({ status: false, msg: "success", data: productDoc })

    } catch (err) {
        res.status(500).send({ status: false, message: err.message });
    }

}

const DeleteProduct = async function (req, res) {
    try {
        let productId = req.params.productId
        if (!mongoose.Types.ObjectId.isValid(productId)) return res.status(400).send({ status: false, msg: "provided productId is not valid" })

        let checkProduct = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!checkProduct) return res.status(404).send({ status: false, message: "No Such Book Found" })


        deletedTime = new Date().toISOString();

        let deletedProduct = await productModel.findByIdAndUpdate({ _id: productId }, { isDeleted: true, deletedAt: deletedTime }, { new: true, })


        res.status(200).send({ status: true, message: "Book Deleted Successfully", data: deletedProduct })
    }
    catch (err) {
        console.log(err)
        return res.status(500).send({ status: false, message: err.message })
    }
}


module.exports = { createProduct, getProduct, getProductById, updateProduct, DeleteProduct }