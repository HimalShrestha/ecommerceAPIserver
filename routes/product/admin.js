const express = require('express')
const router = express.Router()
const db = require('../../server/db')
const { check, validationResult } = require('express-validator/check')
const { matchedData, sanitize } = require('express-validator/filter')

var validate = [
  check('name').exists().withMessage('is.required').trim().isLength({max:100,min:1}).withMessage('length not in limit'),
  check('price').exists().withMessage('is.required').trim().isInt().withMessage('not.integer').isLength({max:100,min:1}).withMessage('length not in limit'),
  check('cartDescription').exists().withMessage('is.required').trim().isLength({max:250,min:1}).withMessage('length not in limit'),
  check('shortDescription').exists().withMessage('is.required').trim().isLength({max:1000,min:1}).withMessage('length not in limit'),
  check('longDescription').exists().withMessage('is.required').trim().isLength({min:1}).withMessage('length not in limit'),
  check('location').exists().withMessage('is.required').trim().isLength({max:250,min:1}).withMessage('length not in limit'),
  check('stock').exists().withMessage('is.required').trim().isInt().withMessage('not.integer').isLength({min:1}).withMessage('cannot be empty'),
  check('visible').optional().isInt().withMessage('not.integer'),
  check('sellerID').exists().withMessage('is.required').trim().isInt().withMessage('not.integer').isLength({max:10,min:1}).withMessage('length not in limit')
  .custom(value => {
    return findSellerID(value).then(id => {
      if(id.length>0){
        return id
      }
      else{
        throw new Error('id.no.exist');
      }
    })
  }),
  check('categoryID').exists().withMessage('is.required').trim().isInt().withMessage('not.integer').isLength({max:10,min:1}).withMessage('length not in limit')
  .custom(value => {
    return findCategoryID(value).then(id => {
      if(id.length>0){
        return id
      }
      else{
        throw new Error('id.no.exist');
      }
    })
  })
]


const multer = require('multer')
const fs = require('fs')
const path = require('path')

var Storage = multer.diskStorage({
     destination: function(req, file, callback) {
       if(file.fieldname==='thumbnail'){
         callback(null, "./images/product/thumbnail");
       }else{
         callback(null, "./images/product/image");
       }
     },
     filename: function(req, file, callback) {
         callback(null, req.body.name + "_" + Date.now() + "_" + path.extname(file.originalname));
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
//get the product
router.get('/', function(req,res){
  db.pool.query(`SELECT products.ProductID,products.ProductName,products.ProductPrice,products.ProductCartDesc,
      products.ProductShortDesc,products.ProductLongDesc,products.ProductThumb,products.ProductImage,products.ProductRegisterDate,products.ProductStock,
      products.ProductLocation,products.ProductVisible,products.ProductUpdateDate,sellers.SellerID,sellers.SellerName,sellers.SellerDesc,sellers.SellerAccountName,
      productcategories.CategoryName FROM products INNER JOIN sellers ON products.ProductSellerID = sellers.SellerID
      INNER JOIN productcategories ON products.ProductCategoryID = productcategories.CategoryID`).then(function(result){
        res.status(200).send(result[0])
  }).catch(function(err){
    console.log(err)
    res.send(err)
  })
})


//post the product
router.post('/',upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'productImage', maxCount: 1 }]),validate, (req, res, next) => {
  if(!req.files['thumbnail']){
    return res.status(422).json({message:'must.have.thumbnail.field',code:'Failed'})
  }
  if(!req.files['productImage']){
    return res.status(422).json({message:'must.have.thumbnail.product',code:'Failed'})
  }
  // Get the validation result whenever you want; see the Validation Result API for all options!
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    //hack to delete the just uploaded file
    fs.unlink(req.files['thumbnail'][0].path,function (err) {
      if (err) throw err;
    })
    fs.unlink(req.files['productImage'][0].path,function (err) {
      if (err) throw err;
    })
    return res.status(422).json({ errors: errors.mapped() });
  }


  // matchedData returns only the subset of data validated by the middleware
  const product = matchedData(req);
  //   //validate the data from post
  let admin = req.user.id
  let visible = product.visible===undefined?1:product.visible
  let productData = [product.name,product.price,product.cartDescription,product.shortDescription,
                      product.longDescription,req.files['thumbnail'][0].path,req.files['productImage'][0].path,product.stock,product.location,visible,product.categoryID,product.sellerID,admin]
  db.pool.query(`INSERT INTO products (ProductName,ProductPrice,ProductCartDesc,ProductShortDesc,ProductLongDesc,ProductThumb,
      ProductImage,ProductStock,ProductLocation,ProductVisible,ProductCategoryID,ProductSellerID,ProductAdminID)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,productData).then(function(result){
      console.log(result[0]);
      res.status(200).json({message:'product.added',code:'Success'})
  }).catch(function(err){
    console.log(err);
    res.send(err);
  })
})


//delete the product
router.delete('/:id',function(req,res){
  let id = req.params.id
  db.pool.query('SELECT ProductThumb,ProductImage FROM products WHERE ProductID = ?',[id]).then(function(image){
      db.pool.query('DELETE FROM products WHERE ProductID = ?',[id]).then(function(result){
        if(result[0].affectedRows===0){
          res.status(422).json({message:'product.no.exist',code:'Failed'})
        }
        else{
          //delete image from server
          fs.unlink(image[0][0].ProductThumb,function (err) {
            if (err) throw err;
          })
          fs.unlink(image[0][0].ProductImage,function (err) {
            if (err) throw err;
          })
          res.status(200).json({message:'product.deleted',code:'Success'})
        }

      }).catch(function(err){
        res.send(err)
      })
    }).catch(function(err){
      res.send(err)
    })
})

//update the product
router.put('/:id',upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'productImage', maxCount: 1 }]),validate,(req, res, next) => {
  let id = req.params.id
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    //hack to delete the just uploaded file
    fs.unlink(req.files['thumbnail'][0].path,function (err) {
      if (err) throw err;
    })
    fs.unlink(req.files['productImage'][0].path,function (err) {
      if (err) throw err;
    })
    return res.status(422).json({ errors: errors.mapped() });
  }
  // matchedData returns only the subset of data validated by the middleware
  const product = matchedData(req);
  let admin = req.user.id
  let visible = product.visible===undefined?1:product.visible
  let productData = [product.name,product.price,product.cartDescription,product.shortDescription,
                      product.longDescription,product.stock,product.location,visible,product.categoryID,product.sellerID,admin,id]
  db.pool.query('SELECT ProductThumb,ProductImage FROM products WHERE ProductID = ?',[id]).then(function(images){
      var thumb = '',image = ''
      if (req.files['thumbnail']) thumb=`,ProductThumb="`+req.files['thumbnail'][0].path+`"`
      if (req.files['productImage']) image=`,ProductImage="`+req.files['productImage'][0].path+`"`
      db.pool.query(`UPDATE products SET ProductName=?,ProductPrice=?,ProductCartDesc=?,ProductShortDesc=?,ProductLongDesc=?,
        ProductStock=?,ProductLocation=?,ProductVisible=?,ProductCategoryID=?,
        ProductSellerID=?,ProductAdminID=? `+thumb+image+` WHERE ProductID = ?`,productData).then(function(result){
          console.log(result[0])
        if(result[0].affectedRows===0){
          res.status(422).json({message:'product.no.exist',code:'Failed'})
        }
        else{
          if (req.files['thumbnail']){
            fs.unlink(images[0][0].ProductThumb,function (err) {
              if (err) throw err;
            })
          }
          if (req.files['productImage']){
            fs.unlink(images[0][0].ProductImage,function (err) {
              if (err) throw err;
            })
          }
          res.status(200).json({message:'product.updated',code:'Success'})
        }

      }).catch(function(err){
        //hack to delete the just uploaded file
        fs.unlink(req.files['thumbnail'][0].path,function (err) {
          if (err) throw err;
        })
        fs.unlink(req.files['productImage'][0].path,function (err) {
          if (err) throw err;
        })
        res.send(err)
      })
    }).catch(function(err){
      res.send(err)
    })
})

//server the images
router.get('/image/:id',function(req,res){
  db.pool.query(`SELECT ProductImage FROM products WHERE ProductID=?`,[req.params.id]).then(function(result){
    if(result[0].length>0){
      // res.status(200).sendFile(result[0][0].ProductImage,{root: __dirname + '../../../'})
      res.status(200).sendFile(result[0][0].ProductImage, { root: path.join(__dirname, '../../') })
    }
    else{
      res.status(404).end()
    }
  }).catch(function(err){
    console.log(err)
    res.send(err)
  })
})
router.get('/thumbnail/:id',function(req,res){
  db.pool.query(`SELECT ProductThumb FROM products WHERE ProductID=?`,[req.params.id]).then(function(result){
    if(result[0].length>0){
      // res.status(200).sendFile(result[0][0].ProductThumb,{root: __dirname + '../../../'})
      res.status(200).sendFile(result[0][0].ProductThumb, { root: path.join(__dirname, '../../') })
    }
    else{
      res.status(404).end()
    }
  }).catch(function(err){
    console.log(err)
    res.send(err)
  })
})


function findSellerID(id){
  return new Promise(function(resolve,reject){
    db.pool.query('SELECT SellerID AS id FROM sellers WHERE SellerID=?',[id]).then(function(result){
      resolve(result[0])
    }).catch(function(err){
      reject(err)
    })
  })
}
function findCategoryID(id){
  return new Promise(function(resolve,reject){
    db.pool.query('SELECT CategoryID AS id FROM productcategories WHERE CategoryID=?',[id]).then(function(result){
      resolve(result[0])
    }).catch(function(err){
      reject(err)
    })
  })
}

//product category

//get the product
router.get('/category', function(req,res){
  db.pool.query(`SELECT * FROM productcategories`).then(function(result){
    res.status(200).send(result[0])
  }).catch(function(err){
    console.log(err)
    res.send(err)
  })
})


//post the product
router.post('/category', [
  check('categoryName').exists().withMessage('is.required').trim().isLength({max:50,min:1}).withMessage('length not in limit')
  .custom(value => {
    return findCategoryName(value).then(name => {
      if(name.length>0){
        throw new Error('name.already.exist');
      }
      else{
        return name
      }
    })
  })], (req, res, next) => {
  // Get the validation result whenever you want; see the Validation Result API for all options!
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.mapped() });
  }


  // matchedData returns only the subset of data validated by the middleware
  const productCategory = matchedData(req);
  //   //validate the data from post
  let categoryData = [productCategory.categoryName]
  db.pool.query(`INSERT INTO productcategories (CategoryName) VALUES (?)`,categoryData).then(function(result){
    console.log(result[0]);
    res.status(200).json({message:'category.added',code:'Success'})
  }).catch(function(err){
    console.log(err);
    res.send(err);
  })
})

//delete the product
router.delete('/category/:id',function(req,res){
  let id = req.params.id
  db.pool.query('DELETE FROM productcategories WHERE CategoryID = ?',[id]).then(function(result){
    if(result[0].affectedRows===0){
      res.status(422).json({message:'category.no.exist',code:'Failed'})
    }
    else{
      res.status(200).json({message:'category.deleted',code:'Success'})
    }
  }).catch(function(err){
    res.send(err)
  })
})

//update the product
router.put('/category/:id',[
  check('categoryName').exists().withMessage('is.required').trim().isLength({max:50,min:1}).withMessage('length not in limit')
  .custom(value => {
    return findCategoryName(value).then(name => {
      if(name.length>0){
        throw new Error('name.already.exist');
      }
      else{
        return name
      }
    })
  })],(req, res, next) => {
  let id = req.params.id
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.mapped() });
  }
  // matchedData returns only the subset of data validated by the middleware
  const productCategory = matchedData(req);
  //   //validate the data from post
  let categoryData = [productCategory.categoryName,id]
  db.pool.query(`UPDATE productcategories SET CategoryName=? WHERE CategoryID = ?`,categoryData).then(function(result){
    console.log(result[0])
    if(result[0].affectedRows===0){
      res.status(422).json({message:'product.no.exist',code:'Failed'})
    }
    else{
      res.status(200).json({message:'product.updated',code:'Success'})
    }
  }).catch(function(err){
    res.send(err)
  })
})

//get the product
router.get('/:id', function(req,res){
  db.pool.query(`SELECT products.ProductID,products.ProductName,products.ProductPrice,products.ProductCartDesc,
      products.ProductShortDesc,products.ProductLongDesc,products.ProductThumb,products.ProductImage,products.ProductRegisterDate,products.ProductStock,
      products.ProductLocation,products.ProductVisible,products.ProductUpdateDate,sellers.SellerID,sellers.SellerName,sellers.SellerDesc,sellers.SellerAccountName,
      productcategories.CategoryName FROM products INNER JOIN sellers ON products.ProductSellerID = sellers.SellerID
      INNER JOIN productcategories ON products.ProductCategoryID = productcategories.CategoryID WHERE products.ProductID=?`,[req.params.id]).then(function(result){
    if(result[0].length>0){
      res.status(200).send(result[0][0])
    }
    else{
      res.status(404).json({message:'product.no.exist',code:'Failed'})
    }
  }).catch(function(err){
    console.log(err)
    res.send(err)
  })
})

function findCategoryName(name){
  return new Promise(function(resolve,reject){
    db.pool.query('SELECT CategoryName AS name FROM productcategories WHERE CategoryName=?',[name]).then(function(result){
      resolve(result[0])
    }).catch(function(err){
      reject(err)
    })
  })
}


module.exports = router
