const express = require("express")
const router = express.Router()
const userController = require("../controller/userController.js")
const productController = require("../controller/productController.js")
const cartController = require("../controller/cartController.js")

const {authentication , authorization} = require("../Middleware/Auth")


router.post("/register",userController.createUser)
router.post("/loginUser",userController.loginUser)
router.get("/user/:userId/profile",authentication,userController.getUser)
router.put("/user/:userId/profile",authentication,userController.updateUser)


router.post("/Product",productController.createProduct)
router.get("/Product",productController.getProduct)
router.get("/products/:productId",productController.getProductById)
router.put("/products/:productId",productController.updateProduct)
router.delete("/products/:productId",productController.DeleteProduct)
 
router.post("/users/:userId/cart",authentication,cartController.createCart)
router.put("/users/:userId/cart",authentication,cartController.updateCart)
router.get("/users/:userId/cart",authentication,cartController.getCart)
router.delete("/users/:userId/cart",authentication,cartController.deleteCart)



module.exports = router;