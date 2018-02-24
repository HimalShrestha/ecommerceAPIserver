
if(process.env.NODE_ENV==='production'){
  module.exports = {
    poolLimit: 100,
    host     : '182.93.95.99',
    user     : 'himal',
    password : 'P@ssw0rd2',
    database : 'ecommerceTest'
  }
}else{
  module.exports = {
    poolLimit: 100,
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'ecommerceTest'
  }
}
