const express = require('express')
const router = express.Router()
const db = require('../../server/db')

router.get('/', function(req,res){
  if(req.query.id===undefined){
    var verificationCode = null
  }
  else{
    var verificationCode = req.query.id
  }
  db.getConn().then(function(conn){
    conn.query('SELECT UserVerificationCode, UserID, UserEmailVerified FROM users WHERE UserVerificationCode=?',[verificationCode]).then(function(result){
      console.log(result[0])
      if(result[0].length>0){
        if(result[0][0].UserEmailVerified===1){
          res.status(200).json({message:'user.already.verified',code:'Success'})
        }
        else{
          conn.query('UPDATE users SET UserEmailVerified="1" WHERE UserID=?',[result[0][0].UserID]).then(function(data){
            console.log(data)
            res.status(200).json({message:'user.verified',code:'Success'})
          }).catch(function(err){
            console.log(err)
            res.send(err)
          })
        }
      }
      else{
        res.status(422).json({message:'user.id.not.exist',code:'Failed'})
      }
    }).catch(function(err){
      console.log(err)
      res.send(err)
    })
  }).catch(function(err){
    console.log(err)
    res.send(err)
  })
})

module.exports = router
