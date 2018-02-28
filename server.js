const express = require('express')
const app = express()
const appAdmin = express()
const port = 8888
const bodyParser = require('body-parser')
var flash = require('connect-flash');
var session = require('express-session');
var FileStore = require('session-file-store')(session)
var passport = require('passport')
const autho = require('./server/authenticate/index')
const db = require('./server/db/index')
const swaggerUi = require('swagger-ui-express')

if(process.env.NODE_ENV==='production'){
  var swaggerDocument = require('./swagger.json')
}else{
  var swaggerDocument = require('./swagger_local.json')
}



const apiPassport = new passport.Passport()
const adminPassport = new passport.Passport()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
appAdmin.use(bodyParser.json())
appAdmin.use(bodyParser.urlencoded({ extended: false }))
appAdmin.use(session({
    store: new FileStore({
			ttl: 60*60,//s
			reapInterval:60*60,
      path:'./sessions/admin'//s
	  }),
    name: 'admin.sid',
		resave: false,
		saveUninitialized: true,
	  secret: 'my secret admin'
}));
app.use('/api*',session({
    store: new FileStore({
			ttl: 60*60,//s
			reapInterval:60*60,//s
      path:'./sessions'//s
	  }),
    name: 'sid',
		resave: false,
		saveUninitialized: true,
	  secret: 'my secret app'
}));

app.use('/api*',apiPassport.initialize());
app.use('/api*',apiPassport.session());
app.use(flash());
appAdmin.use(adminPassport.initialize());
appAdmin.use(adminPassport.session());
appAdmin.use(flash())

autho.init(apiPassport,adminPassport)
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
 });
 appAdmin.use(function(req, res, next) {
   res.header("Access-Control-Allow-Origin", "*");
   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
   next();
  });

appAdmin.use(function(req, res, next){
  if(req.url.split('/').includes('auth')){
    next();
  }
  else if(req.user){
    next();
  }
  else{
    res.status(401).json({code: "Unauthorized"});
  }
});
app.use('/api-documentation', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
const routes = require('./routes/api')
const admin = require('./routes/auth/admin')
const api = require('./routes/auth/api')
const registerAdmin = require('./routes/member/admin')
const registerUser = require('./routes/member/user')
const verifyEmail = require('./routes/verifyUser')
const productAdmin = require('./routes/product/admin')
const productApi = require('./routes/product/api')
const sellerAdmin = require('./routes/seller/admin')
const sellerApi = require('./routes/seller/api')
const payment = require('./routes/payment')
const orderApi = require('./routes/orders/api')
const orderAdmin = require('./routes/orders/admin')
const carouselApi = require('./routes/carousel/api')
const carouselAdmin = require('./routes/carousel/admin')

app.use('/api/v1/auth',api)
appAdmin.use('/admin/auth',admin)
appAdmin.use('/admin/member',registerAdmin)
app.use('/api/v1/member',registerUser)
app.use('/api/v1/verify',verifyEmail)
appAdmin.use('/admin/product',productAdmin)
app.use('/api/v1/product',productApi)
appAdmin.use('/admin/seller',sellerAdmin)
app.use('/api/v1/seller',sellerApi)
appAdmin.use('/admin/payment',payment)
app.use('/api/v1/payment',payment)
app.use('/api/v1/order',orderApi)
appAdmin.use('/admin/order',orderAdmin)
app.use('/api/v1/carousel',carouselApi)
appAdmin.use('/admin/carousel',carouselAdmin)





//listen to port
app.use('/',appAdmin).listen(process.env.port || port, function(){
  console.log('API server is up and running...')
})
