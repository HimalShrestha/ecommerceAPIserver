const express = require('express')
const router = express.Router()
const db = require('../../server/db')
const { check, validationResult } = require('express-validator/check')
const { matchedData, sanitize } = require('express-validator/filter')

var validate = [
  check('email').exists().withMessage('is.required').isEmail().withMessage('must be an email')
  .trim()
  .normalizeEmail().isLength({max:100,min:1}).withMessage('length not in limit')
]


//post the methods
router.post('/', validate, (req, res, next) => {
  // Get the validation result whenever you want; see the Validation Result API for all options!
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.mapped() });
  }


  // matchedData returns only the subset of data validated by the middleware
  const subscriber = matchedData(req);

  let userIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  //   //validate the data from post
  let data = [subscriber.email,userIP]
  db.pool.query(`INSERT INTO newsletters (NewsletterEmail,NewsletterIP) VALUES (?,?)`,data).then(function(result){
    console.log(result[0]);
    res.status(200).json({message:'subscriber.added',code:'Success'})
  }).catch(function(err){
    console.log(err);
    res.send(err);
  })
});




module.exports = router
