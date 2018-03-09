const express = require('express')
const router = express.Router()
const db = require('../../server/db')
// const { check, validationResult } = require('express-validator/check')
// const { matchedData, sanitize } = require('express-validator/filter')
//
// var validate = [
//   check('name').exists().withMessage('is.required').trim().isLength({max:45,min:1}).withMessage('length not in limit'),
//   check('email').exists().withMessage('is.required').trim().isLength({max:100,min:1}).withMessage('length not in limit'),
//   check('subject').exists().withMessage('is.required').trim().isLength({max:150,min:1}).withMessage('length not in limit'),
//   check('message').exists().withMessage('is.required').trim().isLength({max:500,min:1}).withMessage('length not in limit')
// ]


//product category
//get the method
router.get('/', function(req,res){
  db.pool.query(`SELECT * FROM contacts`).then(function(result){
    res.status(200).send(result[0])
  }).catch(function(err){
    console.log(err)
    res.send(err)
  })
})

router.get('/:id', function(req,res){
  var id = req.params.id
  db.pool.query(`SELECT * FROM contacts WHERE ContactID =?`,[id]).then(function(result){
    if(result[0].length>0){
      res.status(200).send(result[0][0])
    }
    else{
      res.status(422).json({message:'id.no.exist',code:'Failed'})
    }
  }).catch(function(err){
    console.log(err)
    res.send(err)
  })
})




// //post the methods
// router.post('/', validate, (req, res, next) => {
//   // Get the validation result whenever you want; see the Validation Result API for all options!
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(422).json({ errors: errors.mapped() });
//   }
//
//
//   // matchedData returns only the subset of data validated by the middleware
//   const paymentMethod = matchedData(req);
//   //   //validate the data from post
//   let paymentData = [paymentMethod.paymentType]
//   db.pool.query(`INSERT INTO paymentmethods (PaymentType) VALUES (?)`,paymentData).then(function(result){
//     console.log(result[0]);
//     res.status(200).json({message:'paymentType.added',code:'Success'})
//   }).catch(function(err){
//     console.log(err);
//     res.send(err);
//   })
// });

//delete the product
router.delete('/:id',function(req,res){
  let id = req.params.id
  db.pool.query('DELETE FROM contacts WHERE ContactID = ?',[id]).then(function(result){
    if(result[0].affectedRows===0){
      res.status(422).json({message:'contact.no.exist',code:'Failed'})
    }
    else{
      res.status(200).json({message:'contact.deleted',code:'Success'})
    }
  }).catch(function(err){
    res.send(err)
  })
})

// //update the product
// router.put('/:id', validate,(req, res, next) => {
//   let id = req.params.id
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(422).json({ errors: errors.mapped() });
//   }
//   // matchedData returns only the subset of data validated by the middleware
//   const paymentMethod = matchedData(req);
//   //   //validate the data from post
//   let paymentData = [paymentMethod.paymentType,id]
//   db.pool.query(`UPDATE paymentmethods SET PaymentType=? WHERE PaymentID = ?`,paymentData).then(function(result){
//     console.log(result[0])
//     if(result[0].affectedRows===0){
//       res.status(422).json({message:'paymentType.no.exist',code:'Failed'})
//     }
//     else{
//       res.status(200).json({message:'paymentType.updated',code:'Success'})
//     }
//   }).catch(function(err){
//     res.send(err)
//   })
// })



module.exports = router
