const isValid = (value) => {
    if (typeof value === "undefined" || value === null) return false
    if (typeof value === "string" && value.trim().length === 0) return false
    return true
}

function isValidBody(data) {
    
    let omi = Object.keys(data).length
 

    if (omi== 0)
      return false
    else return true
  }

const isValidImageType = function (data) {
    const reg = /image\/png|image\/jpeg|image\/jpg/;
    return reg.test(data)
}

const isValidName = (name) => {
    if (/^[a-zA-Z\s]+$/i.test(name))
        return true
}


const isValidEmail = (email) => {
    if (/^[a-z]+@[a-z0-9-]+\.[a-z0-9-.]+$/.test(email))
        return true
}

function isValidPhone(phone) {
    if (/^(\+91[\-\s]?)?[0]?(91)?[789]\d{9}$/.test(phone))
        return true
    else return false
}

const isValidPassword = (pw) => {
    if (/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#$^+=!*()@%&]).{8,15}$/.test(pw))
        return true
}

const isValidAddress = (address) => {
    if (/^[a-zA-Z0-9\s\,\''\-]*$/i.test(address))
        return true
}

const isValidPinCode = (pincode) => {
    if (/^[1-9][0-9]{5}$/.test(pincode))
        return true
}

const isValidTitle = (name) => {
    if (/^[a-zA-Z\s\,\.\-\[.*\]\(.*\)\d]+$/i.test(name))
        return true
}

const isValidDescription = (name) => {
    if (/^[a-zA-Z\s\,\.\-\+\&\[.*\]\(.*\)\(/\\/)\d]+$/i.test(name))
        return true
}


const isValidSizes = function (size) {
    return ['S', 'XS', 'M', 'X', 'L', 'XXL', 'XL'].indexOf(size) !== -1
}


const isValidPrice = function (data) {
    if ((/^[1-9][0-9]{2,5}\.[0-9]{2}|^[1-9][0-9]{2,5}$/).test(data)) {
        return true
    }
    return false
}



const isValidInstallment = (pincode) => {
    if (/^[0-9]{1,36}$/.test(pincode))
        return true
}


const isValidQuantity = (quantity) => {
    if (/^[1-9]{1,5}$/.test(quantity))
        return true
}

module.exports = {
    isValid, isValidImageType, isValidName, isValidEmail, isValidPhone,
    isValidPassword, isValidAddress, isValidPinCode, isValidTitle, isValidDescription, 
    isValidSizes, isValidInstallment, isValidQuantity,
    isValidPrice, isValidBody
}