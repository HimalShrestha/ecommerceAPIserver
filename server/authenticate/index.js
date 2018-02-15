var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy
const db = require('../db/index')
const hash = require('../hash/index')
let passportApi,passportAdmin

module.exports.init = function(apiPassport,adminPassport){
  passportApi=apiPassport
  passportAdmin=adminPassport
  adminPassport.serializeUser(function(user, done) {
    done(null, user);
  });

  adminPassport.deserializeUser(function(user, done) {
    done(null, user)
  });
  apiPassport.serializeUser(function(user, done) {
    done(null, user);
  });

  apiPassport.deserializeUser(function(user, done) {
    done(null, user)
  });
  apiPassport.use('local',new LocalStrategy(
    function(username, password, done) {
      db.getConn().then(function(conn){
        conn.query('SELECT UserEmail, UserPassword, UserID, UserEmailVerified FROM users WHERE UserEmail="'+username+'"').then(function(result){
          if (result[0].length===0) {
            return done(null, false, { message: 'Incorrect username.' })
          }
          hash.checkHash(result[0][0].UserPassword,password).then(function(res){
            if(!res){
              return done(null, false, { message: 'Incorrect password.' })
            }
            //normalize result to username,password and id
            return done(null, {username:result[0][0].UserEmail,password:result[0][0].UserPassword,id:result[0][0].UserID,userVerified:result[0][0].UserEmailVerified})
          }).catch(function(err){
            return done(null,false,{message:'Hash error.'})
          })
        })
      }).catch(function(err){
        return done(err)
      })
    }
  ));
  adminPassport.use('local',new LocalStrategy(
    function(username, password, done) {
      db.getConn().then(function(conn){
        conn.query('SELECT AdminUsername, AdminPassword, AdminID,AdminRoles FROM admins WHERE AdminUsername="'+username+'"').then(function(result){
          if (result[0].length===0) {
            return done(null, false, { message: 'Incorrect username.' })
          }
          hash.checkHash(result[0][0].AdminPassword,password).then(function(res){
            if(!res){
              return done(null, false, { message: 'Incorrect password.' })
            }
            return done(null, {username:result[0][0].AdminUsername,password:result[0][0].AdminPassword,id:result[0][0].AdminID,roles:result[0][0].AdminRoles})
          }).catch(function(err){
            return done(null,false,{message:'Hash error.'})
          })
        })
      }).catch(function(err){
        return done(err)
      })
    }
  ));
}

module.exports.checkAdmin = function(){
  return passportAdmin.authenticate('local', { successRedirect: '/admin/auth/success',
                                          failureRedirect: '/admin/auth/failed',
                                          failureFlash: true })
}
module.exports.checkApi = function(){
  return passportApi.authenticate('local', { successRedirect: '/api/v1/auth/success',
                                          failureRedirect: '/api/v1/auth/failed',
                                          failureFlash: true })
}
