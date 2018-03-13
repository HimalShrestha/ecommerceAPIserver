const express = require('express')
const router = express.Router()
const db = require('../../server/db')
const { check, validationResult } = require('express-validator/check')
const { matchedData, sanitize } = require('express-validator/filter')

var validate = [
  check('paymentType').exists().withMessage('is.required').trim().isLength({max:20,min:1}).withMessage('length not in limit')
  .custom(value => {
    return findPaymentType(value).then(type => {
      if(type.length>0){
        throw new Error('type.already.exist');
      }
      else{
        return type
      }
    })
  })]


//product category
//get the method
router.get('/', function(req,res){
  db.pool.query(`SELECT * FROM paymentmethods ORDER BY PaymentID DESC LIMIT 100`).then(function(result){
    res.status(200).send(result[0])
  }).catch(function(err){
    console.log(err)
    res.send(err)
  })
})





//post the methods
router.post('/', validate, (req, res, next) => {
  // Get the validation result whenever you want; see the Validation Result API for all options!
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.mapped() });
  }


  // matchedData returns only the subset of data validated by the middleware
  const paymentMethod = matchedData(req);
  //   //validate the data from post
  let paymentData = [paymentMethod.paymentType]
  db.pool.query(`INSERT INTO paymentmethods (PaymentType) VALUES (?)`,paymentData).then(function(result){
    console.log(result[0]);
    res.status(200).json({message:'paymentType.added',code:'Success'})
  }).catch(function(err){
    console.log(err);
    res.send(err);
  })
});

//delete the product
router.delete('/:id',function(req,res){
  let id = req.params.id
  db.pool.query('DELETE FROM paymentmethods WHERE PaymentID = ?',[id]).then(function(result){
    if(result[0].affectedRows===0){
      res.status(422).json({message:'paymentType.no.exist',code:'Failed'})
    }
    else{
      res.status(200).json({message:'paymentType.deleted',code:'Success'})
    }
  }).catch(function(err){
    res.send(err)
  })
})

//update the product
router.put('/:id', validate,(req, res, next) => {
  let id = req.params.id
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.mapped() });
  }
  // matchedData returns only the subset of data validated by the middleware
  const paymentMethod = matchedData(req);
  //   //validate the data from post
  let paymentData = [paymentMethod.paymentType,id]
  db.pool.query(`UPDATE paymentmethods SET PaymentType=? WHERE PaymentID = ?`,paymentData).then(function(result){
    console.log(result[0])
    if(result[0].affectedRows===0){
      res.status(422).json({message:'paymentType.no.exist',code:'Failed'})
    }
    else{
      res.status(200).json({message:'paymentType.updated',code:'Success'})
    }
  }).catch(function(err){
    res.send(err)
  })
})


function findPaymentType(type){
  return new Promise(function(resolve,reject){
    db.pool.query('SELECT PaymentType AS type FROM paymentmethods WHERE PaymentType=?',[type]).then(function(result){
      resolve(result[0])
    }).catch(function(err){
      reject(err)
    })
  })
}


module.exports = router
