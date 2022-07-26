const express = require("express")
const router = express.Router()
const userController = require("../controller/userController.js")
const {authentication , authorization} = require("../Middleware/Auth")



router.post("/register",userController.createUser)
router.post("/loginUser",userController.loginUser)

router.get("/user/:userId/profile",authentication,userController.getUser)

router.put("/user/:userId/profile",authentication,userController.updateUser)

 




module.exports = router;