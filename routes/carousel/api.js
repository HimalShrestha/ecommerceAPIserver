const express = require('express')
const router = express.Router()
const db = require('../../server/db')

router.get('/', function(req,res){
  db.getConn().then(function(conn){
    conn.query(`SELECT * FROM carousels`).then(function(result){
      if(result[0].length>0){
        res.status(200).send(result[0])
      }
      else{
        res.status(422).json({message:'id.no.exist',code:'Failed'})
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

router.get('/image/:id', function(req,res){
  let id = req.params.id
  db.getConn().then(function(conn){
    conn.query(`SELECT CarouselImage FROM carousels WHERE CarouselID=?`,[id]).then(function(result){
      if(result[0].length>0){
        res.status(200).sendFile(result[0][0].CarouselImage,{root: __dirname + '../../../'})
      }
      else{
        res.end()
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
