const express = require('express')
const router = express.Router()
const db = require('../../server/db')
const { check, validationResult } = require('express-validator/check')
const { matchedData, sanitize } = require('express-validator/filter')
const multer = require('multer')
const fs = require('fs')
const path = require('path')

var Storage = multer.diskStorage({
     destination: function(req, file, callback) {
         callback(null, "./images/carousel");
     },
     filename: function(req, file, callback) {
         callback(null, file.fieldname + "_" + Date.now() + "_" + path.extname(file.originalname));
     }
 });

 var upload = multer({
    storage: Storage,
    fileFilter: function (req, file, callback) {
        if(file.mimetype === 'image/gif' ||file.mimetype ==='image/jpeg'||file.mimetype ==='image/png'||file.mimetype ==='image/svg+xml'){
          callback(null, true)
        }
        else{
          callback(new Error('Only images are allowed with size less than 2 MB'))
        }

    },
    limits:{
        fileSize: 2*1024 * 1024
    }
})

var validate = [
  check('imageDesc').exists().withMessage('is.required').trim().isLength({max:45,min:1}).withMessage('length not in limit'),
  check('status').exists().withMessage('is.required').isInt().withMessage('not integer').trim().isLength({min:1}).withMessage('length not in limit')
]
//get the seller
router.get('/', function(req,res){
  db.pool.query(`SELECT * FROM carousels`).then(function(result){
    res.status(200).send(result[0])
  }).catch(function(err){
    console.log(err)
    res.send(err)
  })
})
router.get('/:id', function(req,res){
  let id = req.params.id
  db.pool.query(`SELECT * FROM carousels WHERE CarouselID=?`,[id]).then(function(result){
    if(result[0].length>0){
      res.status(200).send(result[0][0])
    }
    else{
      res.status(422).json({message:'id.no.exist',code:'Failed'})
    }
  }).catch(function(err){
    console.log(err)
    res.send(err)
  })
})


//post the seller
router.post('/',upload.single('image'),validate, (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    fs.unlink(req.files.path,function (err) {
      if (err) throw err;
    })
    return res.status(422).json({ errors: errors.mapped() });
  }
  // matchedData returns only the subset of data validated by the middleware
  const carousel = matchedData(req);

  let carouselData = [req.file.path,carousel.imageDesc,carousel.status]
  db.pool.query(`INSERT INTO carousels (CarouselImage,CarouselDesc,CarouselStatus)
   VALUES (?,?,?)`,carouselData).then(function(result){
    console.log(result[0]);
    res.status(200).json({message:'image.added',code:'Success'})
  }).catch(function(err){
    console.log(err);
    res.send(err);
  })
});

//delete the seller
router.delete('/:id',function(req,res){
  let id = req.params.id
  db.pool.query('SELECT CarouselImage FROM carousels WHERE CarouselID = ?',[id]).then(function(image){
    db.pool.query('DELETE FROM carousels WHERE CarouselID = ?',[id]).then(function(result){
      if(result[0].affectedRows===0){
        res.status(422).json({message:'image.no.exist',code:'Failed'})
      }
      else{
        fs.unlink(image[0][0].CarouselImage,function (err) {
          if (err) throw err;
        })
        res.status(200).json({message:'image.deleted',code:'Success'})
      }

    }).catch(function(err){
      res.send(err)
    })
  }).catch(function(err){
    res.send(err)
  })
})

//update the seller
router.put('/:id',upload.single('image'),validate,(req, res, next) => {
  let id = req.params.id
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    fs.unlink(req.files.path,function (err) {
      if (err) throw err;
    })
    return res.status(422).json({ errors: errors.mapped() });
  }
  // matchedData returns only the subset of data validated by the middleware
  const carousel = matchedData(req);
  //   //validate the data from post
  let carouselData = [carousel.imageDesc,carousel.status,id]
  db.pool.query('SELECT CarouselImage FROM carousels WHERE CarouselID = ?',[id]).then(function(images){
    var image=''
    if (req.file) image=`,CarouselImage="`+req.file.path+`"`
    db.pool.query(`UPDATE carousels SET CarouselDesc=?,CarouselStatus=?`+image+` WHERE CarouselID = ?`,carouselData).then(function(result){
        console.log(result[0])
      if(result[0].affectedRows===0){
        res.status(422).json({message:'id.no.exist',code:'Failed'})
      }
      else{
        if (req.file){
          fs.unlink(images[0][0].CarouselImage,function (err) {
            if (err) throw err;
          })
        }
        res.status(200).json({message:'image.updated',code:'Success'})
      }
    }).catch(function(err){
      res.send(err)
    })
  }).catch(function(err){
    res.send(err)
  })
})

router.get('/image/:id', function(req,res){
  let id = req.params.id
  db.pool.query(`SELECT CarouselImage FROM carousels WHERE CarouselID=?`,[id]).then(function(result){
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
})




module.exports = router
