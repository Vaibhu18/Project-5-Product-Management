const cartModel = require("../models/cartModel");
const productModel = require("../models/productModel");
const userModel = require("../models/userModel");
const mongoose = require("mongoose")

const { isValidName, isValid, isValidQuantity, isValidInstallment, isValidAddress, isValidPhone, isValidPassword, isValidPinCode } = require("../validators/validation");

const createCart = async function (req, res) {
    try {

        const userId = req.params.userId;

        const data = req.body;
        let { quantity, productId, cartId } = data


        if (!isValid(data)) {
            return res.status(400).send({
                status: false,
                message: " data is required for cart",
            });
        }

        
        if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).send({ status: false, msg: "provided userId is not valid" })

        const finduser = await userModel.findById({ _id: userId })
        if (!finduser) {
            return res.status(400).send({ status: false, message: `user doesn't exist by ${userId}` })
        }


        if (!mongoose.Types.ObjectId.isValid(productId)) return res.status(400).send({ status: false, msg: "provided productId is not valid" })

        const findproduct = await productModel.findById({ _id: productId, isDeleted: false })
        if (!findproduct) {
            return res.status(400).send({ status: false, message: `productId doesn't exist by ${productId}` })
        }


        if (!quantity) {
            quantity = 1;
        } else {
            if (!isValid(quantity)) {
                return res.status(400).send({ status: false, message: "Please provide valid quantity & it must be greater than zero." });
            }
        }


        const findCartOfUser = await cartModel.findOne({ userId: userId, isDeleted: false });

        if (!findCartOfUser) {
            var cardData = {
                userId: userId,
                items: [
                    {
                        productId: productId,
                        quantity: quantity
                    }],

                totalPrice: findproduct.price * quantity,
                totalItems: 1,
            };
            const createCart = await cartModel.create(cardData);
            return res.status(201).send({ status: true, message: "Cart created Successfully", data: createCart })
        }

    
        if (findCartOfUser) {
            let arr = findCartOfUser.items;
            if (findCartOfUser.items.length > 0) {

                let noproductId = true

                for (i in arr) {
                    if (arr[i].productId == productId) {
                        findCartOfUser.items[i].quantity += quantity
                        noproductId = false
                    }
                }

                if (noproductId) {
                    let obj = {}
                    obj.productId = findproduct._id
                    obj.quantity = quantity
                    findCartOfUser.items.push(obj)
                }
            }
            else {
                let obj = {}
                obj.productId = findproduct._id
                obj.quantity = quantity
                findCartOfUser.items.push(obj)
            }

            findCartOfUser.totalPrice = findCartOfUser.totalPrice + findproduct.price;
            findCartOfUser.totalItems = findCartOfUser.items.length
            //-------------Update Cart---------------------//

            findCartOfUser.save()
            return res.status(200).send({ status: true, message: `Product Added Successfully`, data: findCartOfUser });
        }

    } catch (err) {
        res.status(500).send({ err: err.message })
    }
}




const updateCart = async function (req, res) {
    
    try {

        let data = req.body
        let userId = req.params.userId

        const { productId, cartId, removeProduct } = data

         if (!isValid(data)) {
            return res.status(400).send({status: false,message: " Data is required for UpdateCart"});
        }


        if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).send({ status: false, msg: "provided userId is not valid" })
        
        let checkingUser = await userModel.findById({ _id: userId })
        
        if (!checkingUser) {
            return res.status(404).send({ status: false, message: "UserId not found." })
        }

        
        if (!mongoose.Types.ObjectId.isValid(cartId)) return res.status(400).send({ status: false, msg: "provided cartId is not valid" })
        
        let cart = await cartModel.findOne({ _id: cartId })
        
        if (!cart) {
            return res.status(404).send({ status: false, message: "CartId not found." })
        }

        
        if (!mongoose.Types.ObjectId.isValid(productId)) return res.status(400).send({ status: false, msg: "provided productId is not valid" })

        let product = await productModel.findOne({ _id: productId, isDeleted: false })

        if (!product) {
            return res.status(404).send({ status: false, message: `Product is not available with this id ${productId}` })
        }


        //.......find if products exits in cart

        let isProductinCart = await cartModel.findOne({ items: { $elemMatch: { productId:productId } } });
       
        if (!isProductinCart) {
            return res.status(400).send({ status: false, message: `This ${productId} product does not exits in the cart` });
        }

        //*...... removeProduct validation

        if (isNaN(removeProduct)) {
            return res.status(400).send({ status: false, message: `removeProduct should be a valid number either 0 or 1` });
        }

        if (!(removeProduct === 0 || removeProduct === 1)) {
            return res.status(400).send({
                status: false, message: "removeProduct should be 0 (product is to be removed) or 1(quantity has to be decremented by 1) "
            });
        }


        let findProduct = cart.items.find((x) => x.productId.toString() === productId);

        if (removeProduct === 0) {
            let totalAmount = cart.totalPrice - product.price * findProduct.quantity; 

            await cartModel.findOneAndUpdate({ _id: cartId }, { $pull: { items: { productId: productId } } }, { new: true });

            let quantity = cart.totalItems - 1;

            let data = await cartModel.findOneAndUpdate({ _id: cartId }, { $set: { totalPrice: totalAmount, totalItems: quantity } }, { new: true }); 
            return res.status(200).send({ status: true, message: `${productId} has been removed`, data: data });
        }

        //* decrement quantity

        let totalAmount = cart.totalPrice - product.price;
        let arr = cart.items;
        for (i in arr) {
            if (arr[i].productId.toString() == productId) {
                arr[i].quantity = arr[i].quantity - 1;
                if (arr[i].quantity < 1) {
                    await cartModel.findOneAndUpdate({ _id: cartId }, { $pull: { items: { productId: productId } } }, { new: true });

                    let quantity = cart.totalItems - 1;
                    let data = await cartModel.findOneAndUpdate({ _id: cartId }, { $set: { totalPrice: totalAmount, totalItems: quantity } }, { new: true });
                    return res.status(400).send({ status: false, message: "No Such Quantity Present in Cart", data: data });
                }
            }
        }
        let datas = await cartModel.findOneAndUpdate({ _id: cartId }, { items: arr, totalPrice: totalAmount }, { new: true });
        return res.status(200).send({ status: true, message: `1 Quantity Removed Successfully`, data: datas });


    } catch (error) {

        res.status(500).send({ msg: error.message })
    }
}



const getCart = async function (req, res) {
    try {
        let userId = req.params.userId;

        if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).send({ status: false, msg: "provided userId is not valid" })

        if (verifyUser != userId) {
            return res.status(400).send({ status: false, msg: "You are not authorised" })
        }

        let cart = await cartModel.findOne({ userId: userId }).populate("items.productId");
        if (!cart) {
            return res.status(400).send({ status: false, msg: "No Cart Available for this userId" })
        } else {

            return res.status(200).send({ status: true, msg: "User profile details", data: cart })
        }
    } catch (err) {
        res.status(500).send({ err: err.message }) 
    }
}


const deleteCart = async function (req, res) {
    try {
        let userId = req.params.userId;

        if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).send({ status: false, msg: "provided userId is not valid" })

        if (verifyUser != userId) {
            return res.status(400).send({ status: false, msg: "You are not authorised" })
        }

        let deleteCart = await cartModel.findOneAndUpdate(
            { userId: userId },
            { items: [{}], totalPrice: 0, totalItems: 0 },
            { new: true }
        );
        if (!deleteCart) {
            return res.status(400).send({ status: false, msg: "No Cart Available for this UserId" })
        }
        return res.status(200).send({ status: true, msg: "success", data: deleteCart })

    } catch (err) {
        res.status(500).send({ err: err.message })
    }
}

module.exports = { createCart, updateCart, getCart, deleteCart }