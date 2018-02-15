const express = require('express')
const router = express.Router()
const db = require('../../server/db')

//get the product
router.get('/', function(req,res){
  db.getConn().then(function(conn){
    conn.query(`SELECT products.ProductID,products.ProductName,products.ProductPrice,products.ProductCartDesc,
      products.ProductShortDesc,products.ProductLongDesc,products.ProductThumb,products.ProductImage,products.ProductRegisterDate,products.ProductStock,
      products.ProductLocation,products.ProductVisible,products.ProductUpdateDate,sellers.SellerID,sellers.SellerName,sellers.SellerDesc,sellers.SellerAccountName,
      productcategories.CategoryName FROM products INNER JOIN sellers ON products.ProductSellerID = sellers.SellerID
      INNER JOIN productcategories ON products.ProductCategoryID = productcategories.CategoryID`).then(function(result){
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

router.get('/:id', function(req,res){
  db.getConn().then(function(conn){
    conn.query(`SELECT products.ProductID,products.ProductName,products.ProductPrice,products.ProductCartDesc,
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
  }).catch(function(err){
    console.log(err)
    res.send(err)
  })
})

router.get('/image/:id',function(req,res){
  db.getConn().then(function(conn){
    conn.query(`SELECT ProductImage FROM products WHERE ProductID=?`,[req.params.id]).then(function(result){
        if(result[0].length>0){
          res.status(200).sendFile(result[0][0].ProductImage,{root: __dirname + '../../../'})
        }
        else{
          res.status(404).end()
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
router.get('/thumbnail/:id',function(req,res){
  db.getConn().then(function(conn){
    conn.query(`SELECT ProductThumb FROM products WHERE ProductID=?`,[req.params.id]).then(function(result){
        if(result[0].length>0){
          res.status(200).sendFile(result[0][0].ProductThumb,{root: __dirname + '../../../'})
        }
        else{
          res.status(404).end()
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
