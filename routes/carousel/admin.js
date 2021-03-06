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
  var size = 20
  var page = 0
  if(req.query.size){
    size=parseInt(req.query.size)
  }
  if(req.query.page){
    if(req.query.page>0){
      page=parseInt(req.query.page)-1
    }
  }
  var limit = ' LIMIT ' +size+' OFFSET '+(size*page)
  db.pool.query(`SELECT CarouselID,CarouselImage,CarouselDesc,CarouselStatus FROM carousels ORDER BY CarouselID DESC `+limit).then(function(result){
    db.pool.query(`SELECT COUNT(*) FROM carousels`).then(function(count){
          res.status(200).send({data:result[0],count:count[0][0]['COUNT(*)']})
        }).catch(function(err){
          console.log(err)
          res.send(err)
        })
  }).catch(function(err){
    console.log(err)
    res.send(err)
  })
})
router.get('/:id', function(req,res){
  let id = req.params.id
  db.pool.query(`SELECT CarouselID,CarouselImage,CarouselDesc,CarouselStatus FROM carousels WHERE CarouselID=?`,[id]).then(function(result){
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

// function getBase64(file) {
//   return new Promise((resolve, reject) => {
//   const reader =
//   reader.readAsDataURL(file);
//   reader.onload = () => resolve(reader.result);
//   reader.onerror = error => reject(error);
// });
// }

//post the seller
router.post('/',upload.single('image'),validate, (req, res, next) => {
  if(!req.file){
    return res.status(422).json({message:'must.have.image.field',code:'Failed'})
  }
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    fs.unlink(req.file.path,function (err) {
      if (err) throw err;
    })
    return res.status(422).json({ errors: errors.mapped() });
  }
  // matchedData returns only the subset of data validated by the middleware
  const carousel = matchedData(req);
  //convert image to base64
  // getBase64(req.file).then( data => {
  //
  var Base64Content = new Buffer(fs.readFileSync(req.file.path)).toString("base64")
  var ContentType = 'image/' + path.extname(req.file.originalname).split('.').pop();
    // })
  //finsih convert
  let carouselData = [req.file.path,carousel.imageDesc,carousel.status,Base64Content,ContentType]
  db.pool.query(`INSERT INTO carousels (CarouselImage,CarouselDesc,CarouselStatus,CarouselBlob,CarouselFileType)
   VALUES (?,?,?,?,?)`,carouselData).then(function(result){
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
    if (req.file) {
      fs.unlink(req.files.path,function (err) {
        if (err) throw err;
      })
    }
    return res.status(422).json({ errors: errors.mapped() });
  }
  // matchedData returns only the subset of data validated by the middleware
  const carousel = matchedData(req);
  if (req.file) {
    var Base64Content = new Buffer(fs.readFileSync(req.file.path)).toString("base64")
    var ContentType = 'image/' + path.extname(req.file.originalname).split('.').pop();
  }
  //   //validate the data from post
  let carouselData = [carousel.imageDesc,carousel.status,id]
  db.pool.query('SELECT CarouselImage FROM carousels WHERE CarouselID = ?',[id]).then(function(images){
    var image=''
    if (req.file) image=`,CarouselImage="`+req.file.path+`",CarouselBlob="`+Base64Content+`",CarouselFileType="`+ContentType+`"`
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
