const express = require("express")
const router = express.Router()
const userController = require("../controller/userController.js")
const productController = require("../controller/productController.js")
const cartController = require("../controller/cartController.js")
const orderController = require("../controller/orderController.js")


const {authentication} = require("../Middleware/Auth")

//-------------------------------------User Api's-------------------------------------

router.post("/register",userController.createUser)
router.post("/login",userController.loginUser)
router.get("/user/:userId/profile",authentication,userController.getUser)
router.put("/user/:userId/profile",authentication,userController.updateUser)

//-------------------------------------Product Api's-------------------------------------

router.post("/Products",productController.createProduct)
router.get("/Products",productController.getProduct)
router.get("/products/:productId",productController.getProductById)
router.put("/products/:productId",productController.updateProduct)
router.delete("/products/:productId",productController.DeleteProduct)
 
//-------------------------------------Cart Api's-------------------------------------

router.post("/users/:userId/cart",authentication,cartController.createCart)
router.put("/users/:userId/cart",authentication,cartController.updateCart)
router.get("/users/:userId/cart",authentication,cartController.getCart)
router.delete("/users/:userId/cart",authentication,cartController.deleteCart)

//-------------------------------------Order Api's-------------------------------------

router.post("/users/:userId/orders",authentication,orderController.createOrder)
router.put("/users/:userId/orders",authentication,orderController.updateOrder)



module.exports = router;