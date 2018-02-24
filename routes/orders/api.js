const express = require('express')
const router = express.Router()
const db = require('../../server/db')
const { check, validationResult } = require('express-validator/check')
const { matchedData, sanitize } = require('express-validator/filter')

var validate = [
  check('amount').exists().withMessage('is.required').trim().isInt().withMessage('not.integer').isLength({max:20,min:1}).withMessage('length not in limit'),
  check('shipAddress').exists().withMessage('is.required').trim().isLength({max:100,min:1}).withMessage('length not in limit'),
  check('shipAddress2').exists().withMessage('is.required').trim().isLength({max:100}).withMessage('length not in limit'),
  check('city').exists().withMessage('is.required').trim().isLength({max:50,min:1}).withMessage('length not in limit'),
  check('state').exists().withMessage('is.required').trim().isLength({max:50,min:1}).withMessage('length not in limit'),
  check('zip').exists().withMessage('is.required').trim().isLength({max:20}).withMessage('length not in limit'),
  check('country').exists().withMessage('is.required').trim().isLength({max:50,min:1}).withMessage('length not in limit'),
  check('phone').exists().withMessage('is.required').trim().isLength({max:20,min:1}).withMessage('length not in limit'),
  check('tax').exists().withMessage('is.required').trim().isLength({min:1}).withMessage('cannot be empty'),
  check('email').exists().withMessage('is.required').isEmail().withMessage('must be an email').trim().normalizeEmail().isLength({max:100,min:1}).withMessage('length not in limit'),
  check('paymentId').exists().withMessage('is.required').trim().isInt().withMessage('not.integer').isLength({max:10,min:1}).withMessage('length not in limit')
  .custom(value => {
    return findPaymentID(value).then(id => {
      if(id.length>0){
        return id
      }
      else{
        throw new Error('id.no.exist');
      }
    })
  }),
  check('productId').exists().withMessage('is.required').trim().isInt().withMessage('not.integer').isLength({max:10,min:1}).withMessage('length not in limit')
  .custom(value => {
    return findProductID(value).then(id => {
      if(id.length>0){
        return id
      }
      else{
        throw new Error('id.no.exist');
      }
    })
  })
]

//post the product
router.post('/', validate, (req, res, next) => {
  // Get the validation result whenever you want; see the Validation Result API for all options!
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.mapped() });
  }
  //check for user
  if(!req.user){
    return res.status(401).json({code:'Unauthorized'})
  }

  // matchedData returns only the subset of data validated by the middleware
  const order = matchedData(req);
  console.log(order)
  //   //validate the data from post
  let user = req.user
  let orderData = [order.amount,user.username,order.shipAddress,order.shipAddress2,order.city,order.state,order.zip,order.country,order.phone,order.tax,order.email,0,user.id,order.paymentId]
  db.pool.query(`INSERT INTO orders (OrderAmount,OrderUsername,OrderShipAddress,OrderShipAddress2,OrderCity,OrderState,
      OrderZip,OrderCountry,OrderPhone,OrderTax,OrderEmail,OrderStatus,OrderUserID,OrderPaymentID)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,orderData).then(function(result){
        var detailData = [result[0].insertId,order.productId]
        db.pool.query(`INSERT INTO orderdetails (DetailOrderID,DetailProductID)
          VALUES (?,?)`,detailData).then(function(result){
          res.status(200).json({message:'order.added',code:'Success'})
        }).catch(function(err){
          console.log(err);
          res.send(err);
        })

    }).catch(function(err){
      console.log(err);
      res.send(err);
    })
})

router.get('/transaction', function(req,res){
  //check for user
  if(!req.user){
    return res.status(401).json({code:'Unauthorized'})
  }
  db.pool.query(`SELECT orderdetails.DetailID,products.ProductName,products.ProductPrice,orders.OrderAmount,orders.OrderDate,(orders.OrderAmount*products.productPrice) AS TotalPrice
      FROM orderdetails INNER JOIN products ON products.ProductID = orderdetails.DetailProductID INNER JOIN orders ON orders.OrderID = orderdetails.DetailOrderID WHERE orders.OrderUserID=?`,[req.user.id]).then(function(result){
    res.status(200).send(result[0])
  }).catch(function(err){
    console.log(err)
    res.send(err)
  })
})






function findPaymentID(id){
  return new Promise(function(resolve,reject){
    db.pool.query('SELECT PaymentID FROM paymentmethods WHERE PaymentID=?',[id]).then(function(result){
      resolve(result[0])
    }).catch(function(err){
      reject(err)
    })
  })
}

function findProductID(id){
  return new Promise(function(resolve,reject){
    db.pool.query('SELECT ProductID FROM products WHERE ProductID=?',[id]).then(function(result){
      resolve(result[0])
    }).catch(function(err){
      reject(err)
    })
  })
}


module.exports = router
