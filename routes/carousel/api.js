const express = require('express')
const path = require('path')
const router = express.Router()
const db = require('../../server/db')

router.get('/', function(req,res){
  db.pool.query(`SELECT CarouselID,CarouselImage,CarouselDesc,CarouselStatus FROM carousels`,function(err,result){
    if(err){
      console.log(err)
      return res.status(500).send(err)
    }
    res.status(200).send(result)
  })
})

router.get('/image/:id', function(req,res){
  let id = req.params.id
  db.pool.query(`SELECT CarouselBlob, CarouselFileType FROM carousels WHERE CarouselID=?`,[id]).then(function(result){
    if(result[0].length>0){

      var image = new Buffer(result[0][0].CarouselBlob).toString('binary')
      res.set('Content-Type',result[0][0].CarouselFileType);
      res.status(200).end(image,'base64')
      // res.status(200).sendFile(result[0][0].CarouselImage, { root: path.join(__dirname, '../../') })
    }
    else{
      res.end()
    }
  }).catch(function(err){
    console.log(err)
    res.send(err)
  })
})

module.exports = router
