const express = require('express')
const router = express.Router()
const db = require('../../server/db')
const hash = require('../../server/hash')
const { check, validationResult } = require('express-validator/check')
const { matchedData, sanitize } = require('express-validator/filter')
const nodemailer = require('nodemailer')
const uuidv4 = require('uuid/v4')

let smtpTransport = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: "himalhs1@gmail.com",
        pass: "Kiec1179"
    }
})
// router.post('/',function(req,res){
//   //validate the data from post
//   hash.encrypt(req.body.password).then(function(password){
//     let registerData = [req.body.email,req.body.username,req.body.roles,password,req.body.fname,req.body.lname]
//     db.getConn().then(function(conn){
//       conn.query('INSERT INTO admins (AdminEmail,AdminUsername,AdminRoles,AdminPassword,AdminFirstName,AdminLastName) VALUES (?,?,?,?,?,?)',registerData).then(function(result){
//         console.log(result[0]);
//         res.status(200).json({message:'admin.added'})
//       })
//     }).catch(function(err){
//       console.log(err);
//       res.send(err);
//     })
//   }).catch(function(err){
//     console.log(err);
//     res.send(err);
//   })
// })
function findUsername(user){
  return new Promise(function(resolve,reject){
    db.getConn().then(function(conn){
      conn.query('SELECT UserEmail AS username FROM users WHERE UserEmail=?',[user]).then(function(result){
        resolve(result[0])
      }).catch(function(err){
        reject(err)
      })
    }).catch(function(err){
      reject(err)
    })
  })
}

router.post('/register', [
  check('username')
    .isEmail().withMessage('must be an email')
    .trim()
    .normalizeEmail()
    .isLength({max:100,min:1}).withMessage('length not in limit')
    .custom(value => {
      return findUsername(value).then(user => {
        if(user.length!==0){
          throw new Error('this username is already in use');
        }
        else{
          return user
        }
      })
    }),
  check('password', 'must be at least 5 chars long and contain one number').trim().isLength({ min: 5,max:30 }).matches(/\d/),
  check('fname').exists().trim().isLength({max:45,min:1}).withMessage('length not in limit'),
  check('lname').exists().trim().isLength({max:45,min:1}).withMessage('length not in limit'),

], (req, res, next) => {
  // Get the validation result whenever you want; see the Validation Result API for all options!
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.mapped() });
  }


  // matchedData returns only the subset of data validated by the middleware
  const user = matchedData(req);
  console.log(req.query.redirect)
  if(req.query.redirect===undefined){
    var redirectPath = 'verify'
  }
  else{
    var redirectPath = req.query.redirect
  }
  // console.log(user)
  //   //validate the data from post
  hash.encrypt(user.password).then(function(password){
    let emailVerificationCode = uuidv4()
    let userIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    let registerData = [user.username,password,user.fname,user.lname,userIP,0,1,0,emailVerificationCode]
    db.getConn().then(function(conn){
      conn.query('INSERT INTO users (UserEmail,UserPassword,UserFirstName,UserLastName,UserIP,UserRole,UserStatus,UserEmailVerified,UserVerificationCode) VALUES (?,?,?,?,?,?,?,?,?)',registerData).then(function(result){
        //email UserVerificationCode
        host=req.get('host');
        link=req.protocol+"://"+req.get('host')+"/"+redirectPath+"?id="+emailVerificationCode;
        console.log(link)
        mailOptions={
            to : user.username,
            subject : "Please confirm your Email account",
            html : "Hello,<br> Please Click on the link to verify your email.<br><a href="+link+">Click here to verify</a>"
        }
        smtpTransport.sendMail(mailOptions, function(error, response){
         if(error){
                console.log(error);
            res.status(200).json({message:'user.added.email.not.sent',code:'Success'})
         }else{
            res.status(200).json({message:'user.added.email.sent',code:'Success'})
             }
        });
      })
    }).catch(function(err){
      console.log(err);
      res.send(err);
    })
  }).catch(function(err){
    console.log(err);
    res.send(err);
  })
});


//update user information

router.put('/update/:id', [
  check('password', 'must be at least 5 chars long and contain one number').optional().trim().isLength({ min: 5,max:30 }).matches(/\d/),
  check('fname').exists().withMessage('is.required').trim().isLength({max:50,min:1}).withMessage('length not in limit'),
  check('lname').exists().withMessage('is.required').trim().isLength({max:50,min:1}).withMessage('length not in limit'),
  check('city').exists().withMessage('is.required').trim().isLength({max:90,min:1}).withMessage('length not in limit'),
  check('state').exists().withMessage('is.required').trim().isLength({max:50,min:1}).withMessage('length not in limit'),
  check('zip').exists().withMessage('is.required').trim().isLength({max:12}).withMessage('length not in limit'),
  check('phone').exists().withMessage('is.required').trim().isLength({max:20,min:1}).withMessage('length not in limit'),
  check('country').exists().withMessage('is.required').trim().isLength({max:20,min:1}).withMessage('length not in limit'),
  check('address').exists().withMessage('is.required').trim().isLength({max:100}).withMessage('length not in limit'),
  check('address2').exists().withMessage('is.required').trim().isLength({max:50}).withMessage('length not in limit')


], (req, res, next) => {
  var id = req.params.id
  if(req.params.id!=req.user.id){
    return res.status(401).json({code:'Unauthorized'})
  }
  // Get the validation result whenever you want; see the Validation Result API for all options!
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.mapped() });
  }


  // matchedData returns only the subset of data validated by the middleware
  const user = matchedData(req);
  let userIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  // console.log(user)
  //   //validate the data from post
  if(!user.password){
    let updateData = [user.fname,user.lname,user.city,user.state,user.zip,user.phone,user.country,user.address,user.address2,userIP,id]
    db.getConn().then(function(conn){
      conn.query(`UPDATE users SET UserFirstName=?,UserLastName=?,UserCity=?,UserState=?,UserZip=?,UserPhone=?,
        UserCountry=?,UserAddress=?,UserAddress2=?,UserIP=? WHERE UserID=?`,updateData).then(function(result){
        console.log(result[0])
        if(result[0].affectedRows===0){
          res.status(422).json({message:'user.no.exist',code:'Failed'})
        }
        else{
          res.status(200).json({message:'user.updated',code:'Success'})
        }
      })
    }).catch(function(err){
      console.log(err);
      res.send(err);
    })
  }
  else{
    hash.encrypt(user.password).then(function(password){
      let updateData = [password,user.fname,user.lname,user.city,user.state,user.zip,user.phone,user.country,user.address,user.address2,userIP,id]
      db.getConn().then(function(conn){
        conn.query('UPDATE users SET UserPassword=?,UserFirstName=?,UserLastName=?,UserCity=?,UserState=?,UserZip=?,UserPhone=?,UserCountry=?,UserAddress=?,UserAddress2=?,UserIP=? WHERE UserID=?',updateData).then(function(result){
          console.log(result[0])
          if(result[0].affectedRows===0){
            res.status(422).json({message:'user.no.exist',code:'Failed'})
          }
          else{
            res.status(200).json({message:'user.updated',code:'Success'})
          }
        })
      }).catch(function(err){
        console.log(err);
        res.send(err);
      })
    }).catch(function(err){
      console.log(err);
      res.send(err);
    })
  }

});

router.get('/',function(req,res){
  if(!req.user){
    return res.status(401).json({code:'Unauthorized'})
  }
  db.getConn().then(function(conn){
    conn.query(`SELECT UserID,UserEmail,UserFirstName,UserLastName,UserCity,UserState,UserZip,UserPhone,UserCountry,UserAddress,UserAddress2,
      UserRole,UserSellerID FROM users WHERE UserID=?`,[req.user.id]).then(function(result){
        console.log(result)
        res.status(200).send(result[0][0])
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
