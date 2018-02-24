const express = require('express')
const router = express.Router()
const db = require('../../server/db')

router.get('/', function(req,res){
  db.pool.query(`SELECT * FROM carousels`,function(err,result){
    if(err){
      console.log(err)
      return res.status(500).send(err)
    }
    res.status(200).send(result)
  })
})

router.get('/image/:id', function(req,res){
  let id = req.params.id
  db.pool.query(`SELECT CarouselImage FROM carousels WHERE CarouselID=`+id,function(err,result){
    console.log(result)
    if(err){
      console.log(err)
      return res.status(500).send(err)
    }
    if(result.length>0){
      res.status(200).sendFile(result[0].CarouselImage,{root: __dirname + '../../../'})
    }
    else{
      res.end()
    }
  })
})

module.exports = router
