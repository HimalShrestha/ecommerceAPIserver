const express = require('express')
const router = express.Router()
var passport = require('passport')
var checkAuth = require('../../server/authenticate')

router.post('/login/user',checkAuth.checkApi())
// router.post('/login/user',function(req,res){
//   console.log(req.body)
// })



// router.post('/login/user',
//   passport.authenticate('user-local', { successRedirect: '/auth/success',
//                                           failureRedirect: '/auth/failed',
//                                           failureFlash: true }))
router.get('/success',function(req,res){
  res.json(req.user)
})
router.get('/failed',function(req,res){
  // console.log(req.flash())
  // let error = req.flash('error')
  res.status(401).json({error:req.flash('error')})
})
router.get('/checkLogin',function(req,res){
  console.log(req.user)
  res.status(200).json(req.user ? { user: req.user} : null);
})
router.get('/logout',function(req,res){
  req.logout()
  req.session.destroy()
  res.status(200).send()
})
module.exports = router
