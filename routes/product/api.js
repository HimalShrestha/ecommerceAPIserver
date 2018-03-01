const express = require('express')
const router = express.Router()
const path = require('path')
const db = require('../../server/db')


//get the product
router.get('/', function(req,res){
  if(req.query.category){
    var category = req.query.category
    db.pool.query(`SELECT products.ProductID,products.ProductName,products.ProductPrice,products.ProductCartDesc,
        products.ProductShortDesc,products.ProductLongDesc,products.ProductThumb,products.ProductImage,products.ProductRegisterDate,products.ProductStock,
        products.ProductLocation,products.ProductVisible,products.ProductUpdateDate,sellers.SellerID,sellers.SellerName,sellers.SellerDesc,sellers.SellerAccountName,
        productcategories.CategoryName FROM products INNER JOIN sellers ON products.ProductSellerID = sellers.SellerID
        INNER JOIN productcategories ON products.ProductCategoryID = productcategories.CategoryID WHERE productCategories.CategoryID =`+category,function(err,result){
          if(err){
            console.log(err)
            return res.status(500).send(err)
          }
          res.status(200).send(result)
      })
  }else{
    db.pool.query(`SELECT products.ProductID,products.ProductName,products.ProductPrice,products.ProductCartDesc,
      products.ProductShortDesc,products.ProductLongDesc,products.ProductThumb,products.ProductImage,products.ProductRegisterDate,products.ProductStock,
      products.ProductLocation,products.ProductVisible,products.ProductUpdateDate,sellers.SellerID,sellers.SellerName,sellers.SellerDesc,sellers.SellerAccountName,
      productcategories.CategoryName FROM products INNER JOIN sellers ON products.ProductSellerID = sellers.SellerID
      INNER JOIN productcategories ON products.ProductCategoryID = productcategories.CategoryID`,function(err,result){
        if(err){
          console.log(err)
          return res.status(500).send(err)
        }
        res.status(200).send(result)
      })
  }

})

router.get('/category', function(req,res){
  db.pool.query(`SELECT * FROM productcategories`,function(err,result){
    if(err){
      console.log(err)
      return res.status(500).send(err)
    }
    res.status(200).send(result)
    })
})

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

router.get('/image/:id',function(req,res){
  db.pool.query(`SELECT ProductImageBlob, ProductImageFileType FROM products WHERE ProductID=?`,[req.params.id]).then(function(result){
    if(result[0].length>0){
      // res.status(200).sendFile(result[0][0].ProductImage,{root: __dirname + '../../../'})
      // res.status(200).sendFile(result[0][0].ProductImage, { root: path.join(__dirname, '../../') })
      var image = new Buffer(result[0][0].ProductImageBlob).toString('binary')
      res.set('Content-Type',result[0][0].ProductImageFileType);
      res.status(200).end(image,'base64')
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
  db.pool.query(`SELECT ProductThumbBlob, ProductThumbFileType FROM products WHERE ProductID=?`,[req.params.id]).then(function(result){
    if(result[0].length>0){
      // res.status(200).sendFile(result[0][0].ProductThumb,{root: __dirname + '../../../'})
      // res.status(200).sendFile(result[0][0].ProductThumb, { root: path.join(__dirname, '../../') })
      var image = new Buffer(result[0][0].ProductThumbBlob).toString('binary')
      res.set('Content-Type',result[0][0].ProductThumbFileType);
      res.status(200).end(image,'base64')
    }
    else{
      res.status(404).end()
    }
  }).catch(function(err){
    console.log(err)
    res.send(err)
  })
})



module.exports = router
