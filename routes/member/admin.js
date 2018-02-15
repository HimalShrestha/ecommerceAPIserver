const express = require('express')
const router = express.Router()
const db = require('../../server/db')
const hash = require('../../server/hash')
const { check, validationResult } = require('express-validator/check')
const { matchedData, sanitize } = require('express-validator/filter')


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
      conn.query('SELECT AdminUsername AS username FROM admins WHERE AdminUsername=?',[user]).then(function(result){
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
  check('email')
    .isEmail().withMessage('must be an email')
    .trim()
    .normalizeEmail()
    .isLength({max:100,min:1}).withMessage('length not in limit'),
  check('password', 'must be at least 5 chars long and contain one number').trim().isLength({ min: 5,max:30 }).matches(/\d/),
  check('username').exists().trim().isLength({max:45,min:1}).withMessage('length not in limit')
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
  check('roles').exists().trim().isLength({max:45,min:1}).withMessage('length not in limit'),
  check('fname').exists().trim().isLength({max:45,min:1}).withMessage('length not in limit'),
  check('lname').exists().trim().isLength({max:45,min:1}).withMessage('length not in limit'),
], (req, res, next) => {
  //check Login
  if(req.user===undefined){
    return res.status(401).json({code: "Unauthorized"});
  }
  // Get the validation result whenever you want; see the Validation Result API for all options!
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.mapped() });
  }


  // matchedData returns only the subset of data validated by the middleware
  const user = matchedData(req);
  // console.log(user)
  //   //validate the data from post
  hash.encrypt(user.password).then(function(password){
    let registerData = [user.email,user.username,user.roles,password,user.fname,user.lname]
    db.getConn().then(function(conn){
      conn.query('INSERT INTO admins (AdminEmail,AdminUsername,AdminRoles,AdminPassword,AdminFirstName,AdminLastName) VALUES (?,?,?,?,?,?)',registerData).then(function(result){
        // console.log(result[0]);
        res.status(200).json({message:'admin.added',code:'Success'})
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

router.get('/admin', function(req,res){
  db.getConn().then(function(conn){
    conn.query(`SELECT AdminID,AdminEmail, AdminUsername,AdminRoles,AdminFirstName,AdminLastName,AdminRegistrationDate FROM admins`).then(function(result){
        res.status(200).send(result[0])
    }).catch(function(err){
      console.log(err)
      res.send(err)
    })
  }).catch(function(err){
    console.log(err)
    res.send(err)
  })
})

router.get('/admin/:id', function(req,res){
  db.getConn().then(function(conn){
    conn.query(`SELECT AdminID, AdminEmail, AdminUsername,AdminRoles,AdminFirstName,AdminLastName,AdminRegistrationDate FROM admins WHERE AdminID=?`,[req.params.id]).then(function(result){
      if(result[0].length>0){
        res.status(200).send(result[0][0])
      }
      else{
        res.status(422).json({message:'user.no.exist',code:'Failed'})
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

router.put('/admin/:id',[
  check('email')
    .isEmail().withMessage('must be an email')
    .trim()
    .normalizeEmail()
    .isLength({max:100,min:1}).withMessage('length not in limit'),
  check('password', 'must be at least 5 chars long and contain one number').optional().trim().isLength({ min: 5,max:30 }).matches(/\d/),
  check('roles').exists().trim().isLength({max:45,min:1}).withMessage('length not in limit'),
  check('fname').exists().trim().isLength({max:45,min:1}).withMessage('length not in limit'),
  check('lname').exists().trim().isLength({max:45,min:1}).withMessage('length not in limit'),
],(req, res, next) => {
  let id = req.params.id
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.mapped() });
  }
  // matchedData returns only the subset of data validated by the middleware
  const admin = matchedData(req);
  if(!admin.password){
    let adminData = [admin.email,admin.roles,admin.fname,admin.lname,id]
    db.getConn().then(function(conn){
      conn.query('UPDATE admins SET AdminEmail=?,AdminRoles=?,AdminFirstName=?,AdminLastName=? WHERE AdminID=?',adminData).then(function(result){
        // console.log(result[0]);
        if(result[0].affectedRows===0){
          res.status(422).json({message:'admin.no.exist',code:'Failed'})
        }
        else{
          res.status(200).json({message:'admin.updated',code:'Success'})
        }
      })
    }).catch(function(err){
      console.log(err);
      res.send(err);
    })
  }
  else{
    hash.encrypt(admin.password).then(function(password){
      let adminData = [admin.email,admin.roles,password,admin.fname,admin.lname,id]
      db.getConn().then(function(conn){
        conn.query('UPDATE admins SET AdminEmail=?,AdminRoles=?,AdminPassword=?,AdminFirstName=?,AdminLastName=? WHERE AdminID=?',adminData).then(function(result){
          // console.log(result[0]);
          if(result[0].affectedRows===0){
            res.status(422).json({message:'admin.no.exist',code:'Failed'})
          }
          else{
            res.status(200).json({message:'admin.updated',code:'Success'})
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

})

//delete the product
router.delete('/admin/:id',function(req,res){
  let id = req.params.id
  db.getConn().then(function(conn){
    conn.query('DELETE FROM admins WHERE AdminID = ?',[id]).then(function(result){
      if(result[0].affectedRows===0){
        res.status(422).json({message:'admin.no.exist',code:'Failed'})
      }
      else{
        res.status(200).json({message:'admin.deleted',code:'Success'})
      }

    }).catch(function(err){
      res.send(err)
    })
  }).catch(function(err){
    res.send(err)
  })
})

//=============USERS=============

router.get('/user',function(req,res){
  db.getConn().then(function(conn){
    conn.query(`SELECT UserID,UserEmail,UserFirstName,UserLastName,UserEmailVerified,UserIP,UserPhone,UserCountry,
      UserRole,UserStatus,UserSellerID FROM users`).then(function(result){
        console.log(result)
        res.status(200).send(result[0])
    }).catch(function(err){
      console.log(err)
      res.send(err)
    })
  }).catch(function(err){
    console.log(err)
    res.send(err)
  })
})

router.get('/user/:id', function(req,res){
  db.getConn().then(function(conn){
    conn.query(`SELECT UserID,UserEmail,UserFirstName,UserLastName,UserCity,UserState,UserZip,UserEmailVerified,UserIP,UserPhone,UserCountry,
      UserAddress,UserAddress2,UserStatus,UserRole,UserSellerID FROM users WHERE UserID=?`,[req.params.id]).then(function(result){
        if(result[0].length>0){
          res.status(200).send(result[0][0])
        }
        else{
          res.status(422).json({message:'user.no.exist',code:'Failed'})
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

router.put('/user/:id',[
  check('password', 'must be at least 5 chars long and contain one number').optional().trim().isLength({ min: 5,max:30 }).matches(/\d/),
  check('fname').exists().withMessage('is.required').trim().isLength({max:50,min:1}).withMessage('length not in limit'),
  check('lname').exists().withMessage('is.required').trim().isLength({max:50,min:1}).withMessage('length not in limit'),
  check('city').exists().withMessage('is.required').trim().isLength({max:90,min:1}).withMessage('length not in limit'),
  check('state').exists().withMessage('is.required').trim().isLength({max:50,min:1}).withMessage('length not in limit'),
  check('zip').exists().withMessage('is.required').trim().isLength({max:12}).withMessage('length not in limit'),
  check('phone').exists().withMessage('is.required').trim().isLength({max:20,min:1}).withMessage('length not in limit'),
  check('country').exists().withMessage('is.required').trim().isLength({max:20,min:1}).withMessage('length not in limit'),
  check('address').exists().withMessage('is.required').trim().isLength({max:100}).withMessage('length not in limit'),
  check('address2').exists().withMessage('is.required').trim().isLength({max:50}).withMessage('length not in limit'),
  check('status').exists().withMessage('is.required').trim().isInt().withMessage('must be integer').isLength({min:1,max:12}).withMessage('length not in limit'),
  check('role').exists().withMessage('is.required').trim().isInt().withMessage('must be integer').isLength({max:10,min:1}).withMessage('length not in limit'),
],(req, res, next) => {
  let id = req.params.id
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.mapped() });
  }
  // matchedData returns only the subset of data validated by the middleware
  const user = matchedData(req);
  if(!user.password){
    let userData = [user.fname,user.lname,user.city,user.state,user.zip,user.phone,user.country,user.address,user.address2,user.status,user.role,id]
    db.getConn().then(function(conn){
      conn.query(`UPDATE users SET UserFirstName=?,UserLastName=?,UserCity=?,UserState=?,UserZip=?,UserPhone=?,UserCountry=?,
      UserAddress=?,UserAddress2=?,UserStatus=?,UserRole=? WHERE UserID=?`,userData).then(function(result){
        // console.log(result[0]);
        if(result[0].affectedRows===0){
          return res.status(422).json({message:'user.no.exist',code:'Failed'})
        }
        else{
          return res.status(200).json({message:'user.updated',code:'Success'})
        }
      }).catch(function(err){
        console.log(err)
      })
    }).catch(function(err){
      console.log(err);
      return res.send(err);
    })
  }else{
    hash.encrypt(user.password).then(function(password){
      let userData = [password,user.fname,user.lname,user.city,user.state,user.zip,user.phone,user.country,user.address,user.address2,user.status,user.role,id]
      db.getConn().then(function(conn){
        conn.query(`UPDATE users SET UserPassword=?,UserFirstName=?,UserLastName=?,UserCity=?,UserState=?,UserZip=?,UserPhone=?,UserCountry=?,
        UserAddress=?,UserAddress2=?,UserStatus=?,UserRole=? WHERE UserID=?`,userData).then(function(result){
          // console.log(result[0]);
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

})

//delete the product
router.delete('/user/:id',function(req,res){
  let id = req.params.id
  db.getConn().then(function(conn){
    conn.query('DELETE FROM users WHERE UserID = ?',[id]).then(function(result){
      if(result[0].affectedRows===0){
        res.status(422).json({message:'user.no.exist',code:'Failed'})
      }
      else{
        res.status(200).json({message:'user.deleted',code:'Success'})
      }

    }).catch(function(err){
      res.send(err)
    })
  }).catch(function(err){
    res.send(err)
  })
})





module.exports = router
