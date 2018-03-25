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

router.get('/', function(req,res){
  db.pool.query(`SELECT orders.OrderID,orders.OrderUsername,orders.OrderAmount,orders.OrderStatus,orders.OrderDate,orders.OrderPaymentID,orders.orderUpdateDate,orders.OrderShipAddress,orders.OrderShipAddress2,orders.OrderCity,orders.OrderState,
      orders.OrderZip,orders.OrderCountry,orders.OrderPhone,orders.OrderTax,orders.OrderEmail,paymentmethods.PaymentType,admins.AdminUsername
      FROM orders INNER JOIN paymentmethods ON orders.OrderPaymentID = paymentmethods.PaymentID LEFT JOIN admins ON orders.OrderAdminID = admins.AdminID ORDER BY orders.OrderDate DESC LIMIT 100`).then(function(result){
    console.log(result)
    res.status(200).send(result[0])
  }).catch(function(err){
    console.log(err)
    res.send(err)
  })
})

router.get('/detail', function(req,res){
  var size = 20
  var page = 0
  if(req.query.size){
    size=parseInt(req.query.size)
  }
  if(req.query.page){
    if(req.query.page>0){
      page=parseInt(req.query.page)-1
    }
  }
  var limit = ' LIMIT ' +size+' OFFSET '+(size*page)
  db.pool.query(`SELECT orderdetails.DetailID,products.ProductID,orders.OrderID,orders.OrderStatus,products.ProductName,products.ProductPrice,orders.OrderAmount,orders.OrderDate,(orders.OrderAmount*products.productPrice) AS TotalPrice
      FROM orderdetails INNER JOIN products ON products.ProductID = orderdetails.DetailProductID INNER JOIN orders ON orders.OrderID = orderdetails.DetailOrderID ORDER BY orders.OrderDate DESC `+limit).then(function(result){
    db.pool.query(`SELECT COUNT(*) FROM orderdetails INNER JOIN products ON products.ProductID = orderdetails.DetailProductID INNER JOIN orders ON orders.OrderID = orderdetails.DetailOrderID`).then(function(count){
          res.status(200).send({data:result[0],count:count[0][0]['COUNT(*)']})
        }).catch(function(err){
          console.log(err)
          res.send(err)
        })
  }).catch(function(err){
    console.log(err)
    res.send(err)
  })
})

router.get('/detail/:id', function(req,res){
  var id = req.params.id
  db.pool.query(`SELECT orderdetails.DetailID,products.ProductID,orders.OrderID,orders.OrderStatus,products.ProductName,products.ProductPrice,orders.OrderAmount,orders.OrderDate,(orders.OrderAmount*products.productPrice) AS TotalPrice
      FROM orderdetails INNER JOIN products ON products.ProductID = orderdetails.DetailProductID INNER JOIN orders ON orders.OrderID = orderdetails.DetailOrderID WHERE orderdetails.DetailID = ?`,[id]).then(function(result){
    console.log(result[0])
    if(result[0].length > 0){
      res.status(200).send(result[0][0])
    }else{
      res.status(404).json({message:'id.no.exist',code:'Failed'})
    }
  }).catch(function(err){
    console.log(err)
    res.send(err)
  })
})

router.get('/:id', function(req,res){
  db.pool.query(`SELECT orders.OrderID,orders.OrderUsername,orders.OrderStatus,orders.OrderDate,orders.OrderPaymentID,orders.orderUpdateDate,orders.OrderAmount,orders.OrderShipAddress,orders.OrderShipAddress2,orders.OrderCity,orders.OrderState,
      orders.OrderZip,orders.OrderCountry,orders.OrderPhone,orders.OrderTax,orders.OrderEmail,paymentmethods.PaymentType,admins.AdminUsername
      FROM orders INNER JOIN paymentmethods ON orders.OrderPaymentID = paymentmethods.PaymentID LEFT JOIN admins ON orders.OrderAdminID = admins.AdminID WHERE orders.OrderID=?`,[req.params.id]).then(function(result){
    if(result[0].length > 0){
      res.status(200).send(result[0][0])
    }else{
      res.status(404).json({message:'id.no.exist',code:'Failed'})
    }
  }).catch(function(err){
    console.log(err)
    res.send(err)
  })
})


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

router.put('/:id', [
  check('status').exists().withMessage('is.required').trim().isInt().withMessage('not.integer').isLength({max:2,min:1}).withMessage('length not in limit'),
  check('amount').exists().withMessage('is.required').trim().isInt().withMessage('not.integer').isLength({max:20,min:1}).withMessage('length not in limit'),
  check('shipAddress').exists().withMessage('is.required').trim().isLength({max:100,min:1}).withMessage('length not in limit'),
  check('shipAddress2').exists().withMessage('is.required').trim().isLength({max:100}).withMessage('length not in limit'),
  check('city').exists().withMessage('is.required').trim().isLength({max:50,min:1}).withMessage('length not in limit'),
  check('state').exists().withMessage('is.required').trim().isLength({max:50,min:1}).withMessage('length not in limit'),
  check('zip').exists().withMessage('is.required').trim().isLength({max:20}).withMessage('length not in limit'),
  check('country').exists().withMessage('is.required').trim().isLength({max:50,min:1}).withMessage('length not in limit'),
  check('phone').exists().withMessage('is.required').trim().isLength({max:20,min:1}).withMessage('length not in limit'),
  check('tax').exists().withMessage('is.required').trim().isLength({min:1}).withMessage('cannot be empty'),
  check('email').exists().withMessage('is.required').isEmail().withMessage('must be an email').trim().normalizeEmail().isLength({max:100,min:1}).withMessage('length not in limit')
], (req, res, next) => {
  var id = req.params.id
  // Get the validation result whenever you want; see the Validation Result API for all options!
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.mapped() });
  }

  // matchedData returns only the subset of data validated by the middleware
  const order = matchedData(req);
  console.log(order)
  //   //validate the data from post
  let admin = req.user.id
  let orderData = [order.amount,order.shipAddress,order.shipAddress2,order.city,order.state,order.zip,order.country,order.phone,order.tax,order.email,order.status,admin,id]
  db.pool.query(`UPDATE orders SET OrderAmount=?,OrderShipAddress=?,OrderShipAddress2=?,OrderCity=?,OrderState=?,
      OrderZip=?,OrderCountry=?,OrderPhone=?,OrderTax=?,OrderEmail=?,OrderStatus=?,OrderAdminID=? WHERE OrderID=?`,orderData)
    .then(function(result){
    console.log(result[0]);
    if(result[0].affectedRows===0){
      res.status(422).json({message:'order.no.exist',code:'Failed'})
    }
    else{
      res.status(200).json({message:'order.updated',code:'Success'})
    }
  }).catch(function(err){
    console.log(err);
    res.send(err);
  })
})




// router.delete('/:id',function(req,res){
//   let id = req.params.id
//   db.getConn().then(function(conn){
//     conn.query('DELETE FROM orders WHERE OrderID = ?',[id]).then(function(result){
//       if(result[0].affectedRows===0){
//         res.status(422).json({message:'order.no.exist',code:'Failed'})
//       }
//       else{
//         res.status(200).json({message:'order.deleted',code:'Success'})
//       }
//
//     }).catch(function(err){
//       res.send(err)
//     })
//   }).catch(function(err){
//     res.send(err)
//   })
// })


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
