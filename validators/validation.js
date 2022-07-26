const isValid = (value) => {
    if (typeof value === "undefined" || value === null) return false
    if (typeof value === "string" && value.trim().length === 0) return false
    return true
}

const isValidNameNumber = (namenumber) => {

    return true
}

const isValidName = (name) => {
    if (/^[a-zA-Z]+(([',. -][a-zA-Z ])?[a-zA-Z]*)*$/i.test(name))
        return true
}
const isValidImageType = function (data) {
    const reg = /image\/png|image\/jpeg|image\/jpg/;
    return reg.test(data)
}

const isValidEmail = (email) => {
    if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))
        return true
}

function isValidPhone(phone) {
    if (/^[6-9][0-9]{9}$/.test(phone))
        return true
    else return false
}

const isValidPassword = (pw) => {
    if (/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#$^+=!*()@%&]).{8,15}$/.test(pw))
        return true
}

const isValidPinCode = (pincode) => {
    if (/^[1-9][0-9]{5}$/.test(pincode))
        return true
}

module.exports = { isValid, isValidNameNumber, isValidEmail, isValidName, isValidPhone, isValidPassword, isValidImageType,isValidPinCode }