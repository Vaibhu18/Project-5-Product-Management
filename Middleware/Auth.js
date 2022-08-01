const jwt = require('jsonwebtoken')
const userModel = require('../models/userModel')
const Validator = require("../validators/validation");




const authentication = async function (req, res, next) {
  try {
    let token = req.headers["authorization"];
    if (!token)
    return res.status(403).send({ status: false, msg: "Token is required" });
    if (token.length != 183) return res.status(400).send({status:false,msg:"Token is not Valid"})
    let token1 = token.split(" ").pop()
    
    
    jwt.verify(token1, "MedPlus",  function (err, decoded) {
        if (err) { return res.status(400).send({ status: false, meessage: "Token Expired" }) }
        else {
            if (Date.now() > decoded.exp * 1000) {
                return res.status(401).send({ status: false, msg: "Session Expired", });
            }   
            verifyUser = decoded.userId;            
        next();
      }
    });
  }
  catch (err) {
    return res.status(500).send({ err: err.message })
  }
}

module.exports = { authentication}