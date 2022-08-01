const cartModel = require("../models/cartModel");
const productModel = require("../models/productModel");
const userModel = require("../models/userModel");
const mongoose = require("mongoose")

const { isValidName, isValid, isValidQuantity, isValidInstallment, isValidAddress, isValidPhone, isValidPassword, isValidPinCode } = require("../validators/validation");

const createCart = async function (req, res) {
    try {

        let userId = req.params.userId;
        let requestBody = req.body;



        if (Object.keys(requestBody).length == 0) {
            return res.status(400).send({ status: false, msg: "Body can't empty" })
        }

        let { cartId, productId } = requestBody;
        productId = requestBody.items[0].productId

        cartId = cartId?.toString().trim()

        if (!mongoose.Types.ObjectId.isValid(productId)) return res.status(400).send({ status: false, msg: "provided productId is not valid" })

        var quan = requestBody.items[0].quantity
        if (!isValidQuantity(quan)) return res.status(400).send({ status: false, msg: "wrong quantity" })
        let quantity = parseInt(quan)

        const findUser = await userModel.findById({ _id: userId });
        if (!findUser) {
            return res.status(400).send({ status: false, message: `User doesn't exist by ${userId}` });
        }

        const findProduct = await productModel.findOne({ _id: productId, isDeleted: false });
        if (!findProduct) {
            return res.status(400).send({ status: false, message: `Product doesn't exist by ${productId}` });
        }

        const findCartOfUser = await cartModel.findOne({ userId: userId });
        if (!findCartOfUser) {
            let quan = 0 + quantity
            var cartData = {
                userId: userId,
                items: [
                    {
                        productId: productId,
                        quantity: quan,
                    }
                ],
                totalPrice: findProduct.price * quantity,

                totalItems: requestBody.items.length
            };

            const createCart = await cartModel.create(cartData);
            return res.status(201).send({ status: true, message: `Cart created successfully`, data: createCart });
        }

        if (findCartOfUser) {

            let price = findCartOfUser.totalPrice + quantity * findProduct.price;

            let arr = findCartOfUser.items;

            for (i in arr) {
                if (arr[i].productId.toString() === productId) {
                    arr[i].quantity += quantity;

                    let updatedCart = {
                        items: arr,
                        totalPrice: price,
                    };

                    let responseData = await cartModel.findOneAndUpdate({ _id: findCartOfUser._id }, updatedCart, { new: true });

                    return res.status(200).send({ status: true, message: `Product added successfully`, data: responseData });
                }
            }
        }

    } catch (err) {
        res.status(500).send({ err: err.message })
    }
}




const updateCart = async function (req, res) {
    try {
        let userId = req.params.userId;

        if (verifyUser != userId) {
            return res.status(400).send({ status: false, msg: "You are not authorised" })
        }

        let { cartId, productId, removeProduct } = req.body;
        var removedValue = removeProduct

        let product = await productModel.findOne({ _id: productId, isDeleted: false, })
        let cart = await cartModel.findOne({ userId: userId });

        let arr = cart.items;

        compareId = arr.findIndex((obj) => obj.productId == productId);

        if (compareId == -1) {
            return res
                .status(400)
                .send({
                    status: false,
                    msg: "The product is not available in this cart",
                });
        }

        let quantity1 = arr[compareId].quantity; // return quantity present quentity
        console.log(quantity1)
        if (removeProduct == 0) {
            //arr.splice( - 1, 1);
            cart.totalItems = arr.length
            cart.totalPrice = cart.totalPrice - product.price * quantity1;
            await cart.save();
            return res.status(200).send({ status: true, data: cart });

        } else if (removeProduct >= 1) {
            if (arr[compareId].quantity >= 1) {
                // arr.splice(compareId - 1, 1);
                arr[0].quantity = arr[0].quantity - removedValue
                cart.totalItems = arr.length;
                cart.totalPrice = cart.totalPrice - product.price * removedValue

                await cart.save();
                return res.status(200).send({ status: true, data: cart });

            } else if (arr[compareId].quantity > 1) arr[compareId].quantity -= 1;
            cart.totalItems = arr.length;
            cart.totalPrice -= product.price;
            await cart.save();
            return res.status(200).send({ status: true, data: cart });
        }

    } catch (err) {
        res.status(500).send({ err: err.message })
    }
}



const getCart = async function (req, res) {
    try {
        let userId = req.params.userId;

        if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).send({ status: false, msg: "provided userId is not valid" })

        if (verifyUser != userId) {
            return res.status(400).send({ status: false, msg: "You are not authorised" })
        }

        let cart = await cartModel.findOne({ userId: userId });
        if(!cart){
            return res.status(400).send({status:false, msg:"No Cart Available for this userId"})
        } else {
          
            return res.status(200).send({ status: true, msg: "User profile details", data: cart })
        }
    } catch (err) {
        res.status(500).send({ err: err.message })
    }
}


const deleteCart = async function (req,res){
    try {
        let userId = req.params.userId;

        if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).send({ status: false, msg: "provided userId is not valid" })

        if (verifyUser != userId) {
            return res.status(400).send({ status: false, msg: "You are not authorised" })
        }

        let deleteCart = await cartModel.findOneAndUpdate(
            { userId: userId },
            { items: [{ }], totalPrice: 0, totalItems: 0 },
            { new: true }
          );
          if(!deleteCart){
            return res.status(400).send({status:false, msg:"No Cart Available for this UserId"})
          }
          return res.status(200).send({status:true,msg:"success", data : deleteCart})
 
    } catch (err) {
        res.status(500).send({ err: err.message })
    }
}

module.exports = { createCart, updateCart, getCart, deleteCart }