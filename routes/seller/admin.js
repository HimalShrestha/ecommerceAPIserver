const express = require('express')
const router = express.Router()
const db = require('../../server/db')
const { check, validationResult } = require('express-validator/check')
const { matchedData, sanitize } = require('express-validator/filter')

var validate = [
  //check name is disabled.
  // check('name').exists().withMessage('is.required').trim().isLength({max:45,min:1}).withMessage('length not in limit').custom(value => {
  //   return findSellerName(value).then(name => {
  //     if(name.length>0){
  //       throw new Error('name.already.exists');
  //     }
  //     else{
  //       return name
  //     }
  //   })
  // }),
  check('name').exists().withMessage('is.required').trim().isLength({max:45,min:1}).withMessage('length not in limit'),
  check('sellerDescription').exists().withMessage('is.required').trim().isLength({max:100,min:1}).withMessage('length not in limit'),
  check('accountName').exists().withMessage('is.required').trim().isLength({max:45,min:1}).withMessage('length not in limit'),
  check('accountNumber').exists().withMessage('is.required').trim().isLength({max:45,min:1}).withMessage('length not in limit')
]
//get the seller
router.get('/', function(req,res){
  db.pool.query(`SELECT * FROM sellers ORDER BY SellerID DESC LIMIT 100`).then(function(result){
    res.status(200).send(result[0])
  }).catch(function(err){
    console.log(err)
    res.send(err)
  })
})


//post the seller
router.post('/', validate, (req, res, next) => {
  // Get the validation result whenever you want; see the Validation Result API for all options!
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.mapped() });
  }


  // matchedData returns only the subset of data validated by the middleware
  const seller = matchedData(req);
  console.log(seller)
  //   //validate the data from post
  let sellerData = [seller.name,seller.sellerDescription,seller.accountName,seller.accountNumber]
  db.pool.query(`INSERT INTO sellers (SellerName,SellerDesc,SellerAccountName,SellerAccountNumber)
     VALUES (?,?,?,?)`,sellerData).then(function(result){
    console.log(result[0]);
    res.status(200).json({message:'seller.added',code:'Success'})
  }).catch(function(err){
    console.log(err);
    res.send(err);
  })
});

//delete the seller
router.delete('/:id',function(req,res){
  let id = req.params.id
  db.pool.query('DELETE FROM sellers WHERE SellerID = ?',[id]).then(function(result){
    if(result[0].affectedRows===0){
      res.status(422).json({message:'seller.no.exist',code:'Failed'})
    }
    else{
      res.status(200).json({message:'seller.deleted',code:'Success'})
    }
  }).catch(function(err){
    res.send(err)
  })
})

//update the seller
router.put('/:id',validate,(req, res, next) => {
  let id = req.params.id
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.mapped() });
  }
  // matchedData returns only the subset of data validated by the middleware
  const seller = matchedData(req);
  let sellerData = [seller.name,seller.sellerDescription,seller.accountName,seller.accountNumber,id]
  db.pool.query(`UPDATE sellers SET SellerName=?,SellerDesc=?,SellerAccountName=?,SellerAccountNumber=? WHERE SellerID = ?`,sellerData).then(function(result){
    console.log(result[0])
    if(result[0].affectedRows===0){
      res.status(422).json({message:'product.no.exist',code:'Failed'})
    }
    else{
      res.status(200).json({message:'product.updated',code:'Success'})
    }
  }).catch(function(err){
    res.send(err)
  })
})


function findSellerName(name){
  return new Promise(function(resolve,reject){
    db.pool.query('SELECT SellerName AS name FROM sellers WHERE SellerName=?',[name]).then(function(result){
      resolve(result[0])
    }).catch(function(err){
      reject(err)
    })
  })
}



module.exports = router
