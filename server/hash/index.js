const bcrypt = require('bcrypt');
const saltRounds = 10;

module.exports.encrypt = function(password){
  return bcrypt.hash(password, saltRounds)
}

module.exports.checkHash = function(hashed,unhashed){
  return bcrypt.compare(unhashed,hashed)
}
