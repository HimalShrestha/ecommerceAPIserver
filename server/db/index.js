//connection to the mysql db
const dbConfig = require('../../config/config.database')
const mysql = require('mysql2/promise')
// const connection = mysql.createConnection({
//   host     : dbConfig.host,
//   user     : dbConfig.user,
//   password : dbConfig.password,
//   database : dbConfig.database
// });
let pool  = mysql.createPool({
  connectionLimit : dbConfig.poolLimit,
  host     : dbConfig.host,
  user     : dbConfig.user,
  password : dbConfig.password,
  database : dbConfig.database
});

// connection.connect(function(err){
//   if (err) {
//     console.log(err)
//     connection.end()
//   }
//   else {
//     console.log('db '+dbConfig.host+' is connected')
//   }
// })
// pool.getConnection(function(err,conn){
//   console.log('conn');
// })
exports.getConn= function(){
  return pool.getConnection()
}
exports.endPool = function(){
  return pool.end()
}
