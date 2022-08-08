const mongoose = require ("mongoose")
const userModel = require("../models/userModel");
const cartModel = require("../models/cartModel");
const orderModel = require("../models/orderModel");

const createOrder = async function (req, res) {
    try {
        let userId = req.params.userId;
        let requestBody = req.body;

        let { cartId, status, cancellable } = requestBody;

        if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).send({ status: false, msg: "provided userId is not valid" })

        if (verifyUser != userId) {
            return res.status(400).send({ status: false, msg: "You are not authorised" })
        }
      
        if (!cartId) {
            return res.status(400).send({ status: false, message: `Cart Id is required` });
        }

    
        if (!mongoose.Types.ObjectId.isValid(cartId)) return res.status(400).send({ status: false, msg: "provided cartId is not valid" })

        
        if (status) {
            if (status !== 'pending') {
                return res.status(400).send({ status: false, message: "status must be Pending during creation of order" })
            }
        }

            const searchUser = await userModel.findOne({ _id: userId });

            if (!searchUser) {
                return res.status(404).send({ status: false, message: `user doesn't exist for ${userId}` });
            }

            const searchCartDetails = await cartModel.findOne({ _id: cartId, userId: userId });

            if (!searchCartDetails) {
                return res.status(404).send({ status: false, message: `Cart doesn't belongs to ${userId}` });
            }

            if (!searchCartDetails.items.length) {
                return res.status(404).send({ status: false, message: `Please add some product in cart to make an order.` });
            }

            //adding quantity of every products

            const reducer = (previousValue, currentValue) => previousValue + currentValue;

            let totalQuantity = searchCartDetails.items.map((x) => x.quantity).reduce(reducer);

            const orderDetails = {
                userId: userId,
                items: searchCartDetails.items,
                totalPrice: searchCartDetails.totalPrice,
                totalItems: searchCartDetails.totalItems,
                totalQuantity: totalQuantity,
                cancellable,
                status,
            };
            const savedOrder = await orderModel.create(orderDetails);

            //Empty the cart after the successfull order

            // if (status == 'pending' || savedOrder.status == 'pending') {
            //     await cartModel.findOneAndUpdate({ _id: cartId, userId: userId }, {
            //         $set: {
            //             items: [],
            //             totalPrice: 0,
            //             totalItems: 0,
            //         },
            //     })
            // };
            return res.status(201).send({ status: true, message: "Order Placed Successfully.", data: savedOrder });
        }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}



const updateOrder = async function (req,res){
    try {
        let userId = req.params.userId
        let data = req.body
        
        let {orderId , status} = data

        if (verifyUser != userId) {
            return res.status(400).send({ status: false, msg: "You are not authorised" })
        }

        let checkdata = await orderModel.findOne({_id:orderId, isDeleted: false})
        if(!checkdata){
            return res.status(400).send({status:false,msg:"Order is Not Found in OrderCollection "})
        }
        if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).send({ status: false, msg: "provided userId is not valid" })

        if (!mongoose.Types.ObjectId.isValid(orderId)) return res.status(400).send({ status: false, msg: "provided orderId is not valid" })

        if(!["pending" , "completed" , "cancelled"].includes(status)){
            return res.status(400).send({status:false,msg:`status should be from [ pending , completed , cancelled ]`})
        }

        if(checkdata.status === "completed"){
            return res.status(400).send ({status:false,msg:"Order Alredy Completed"})
        }
        
        if (status === "cancelled" && checkdata.cancellable === false) {
            return res.status(400).send({ status: false, message: "This order can not be cancelled" });
        }

        if (status == "completed" && (checkdata.status == 'completed' || checkdata.status == 'cancelled')) {
            return res.status(400).send({ status: false, message: `Order status can not be changed after ${checkdata.status}`})
        }
        if (status == "cancelled" && (checkdata.status == 'cancelled' || checkdata.status == 'cancelled')) {
            return res.status(400).send({ status: false, message: `Order Alredy ${checkdata.status}`})
        }

        if(status === "pending"){
            return res.status(400).send ({status:false,msg:"Order Alredy in pending Proccess"})
        }

        const updateStatus = await orderModel.findOneAndUpdate({ _id: orderId }, { $set: { status: status } }, { new: true });

        res.status(200).send({status: true,message: "order status updated",data: updateStatus,
        });
        
        
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}


module.exports = { createOrder, updateOrder }