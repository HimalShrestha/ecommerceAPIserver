const express = require('express')
const router = express.Router()
const db = require('../../server/db')
const { check, validationResult } = require('express-validator/check')
const { matchedData, sanitize } = require('express-validator/filter')

var validate = [
  check('name').exists().withMessage('is.required').trim().isLength({max:45,min:1}).withMessage('length not in limit'),
  check('email').exists().withMessage('is.required').isEmail().withMessage('must be an email')
  .trim()
  .normalizeEmail().isLength({max:100,min:1}).withMessage('length not in limit'),
  check('subject').exists().withMessage('is.required').trim().isLength({max:150,min:1}).withMessage('length not in limit'),
  check('message').exists().withMessage('is.required').trim().isLength({max:500,min:1}).withMessage('length not in limit')
]


//post the methods
router.post('/', validate, (req, res, next) => {
  // Get the validation result whenever you want; see the Validation Result API for all options!
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.mapped() });
  }


  // matchedData returns only the subset of data validated by the middleware
  const message = matchedData(req);

  let userIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  //   //validate the data from post
  let messageData = [message.name,message.email,message.subject,message.message,userIP]
  db.pool.query(`INSERT INTO contacts (ContactName,ContactEmail,ContactSubject,ContactMessage,ContactIP) VALUES (?,?,?,?,?)`,messageData).then(function(result){
    console.log(result[0]);
    res.status(200).json({message:'message.added',code:'Success'})
  }).catch(function(err){
    console.log(err);
    res.send(err);
  })
});




module.exports = router
