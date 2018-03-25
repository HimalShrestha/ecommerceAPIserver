const express = require('express')
const router = express.Router()
const path = require('path')
const db = require('../../server/db')

function getCount() {
  return new Promise((resolve,reject)=>{
    db.pool.query(`SELECT COUNT(*) FROM products INNER JOIN sellers ON products.ProductSellerID = sellers.SellerID
      INNER JOIN productcategories ON products.ProductCategoryID = productcategories.CategoryID`,function(err,count){
        if(err){
          reject(err)
        }
        resolve(count[0]['COUNT(*)'])
    })
  })
}
//get the product
router.get('/', function(req,res){
  var page = 0
  var size = 50
  if(req.query.size){
    size=parseInt(req.query.size)
  }
  if(req.query.page){
    if(req.query.page>0){
      page=parseInt(req.query.page)-1
    }
  }
  var limit = size+' OFFSET '+(size*page)
  console.log(limit)
  var sql = `SELECT products.ProductID,products.ProductName,products.ProductPrice,products.ProductCartDesc,
      products.ProductShortDesc,products.ProductLongDesc,products.ProductThumb,products.ProductImage,products.ProductRegisterDate,products.ProductStock,
      products.ProductLocation,products.ProductVisible,products.ProductUpdateDate,sellers.SellerID,sellers.SellerName,sellers.SellerDesc,sellers.SellerAccountName,
      productcategories.CategoryName,productcategories.CategoryID FROM products INNER JOIN sellers ON products.ProductSellerID = sellers.SellerID
      INNER JOIN productcategories ON products.ProductCategoryID = productcategories.CategoryID `
  if(req.query.category){
    var category = req.query.category
    db.pool.query(sql + `WHERE productCategories.CategoryID =`+category+` LIMIT `+limit,function(err,result){
          if(err){
            console.log(err)
            return res.status(500).send(err)
          }
          res.status(200).send(result)
      })
  }
  // else if(req.query.size){
  //   var size = req.query.size
  //   db.pool.query(sql+'ORDER BY products.ProductID DESC LIMIT '+size,function(err,result){
  //       if(err){
  //         console.log(err)
  //         return res.status(500).send(err)
  //       }
  //       res.status(200).send(result)
  //     })
  // }
  else if(req.query.low && req.query.high) {
    db.pool.query(sql + 'WHERE products.ProductPrice >= '+req.query.low+' AND products.ProductPrice <= '+req.query.high+` LIMIT `+limit,function(err,result){
        if(err){
          console.log(err)
          return res.status(500).send(err)
        }
        getCount().then((count)=>{
          res.status(200).send({data:result,count:count})
        }).catch((err)=>{
          return res.status(500).send(err)
        })
      })
  }
  else{
    db.pool.query(sql+` LIMIT `+limit,function(err,result){
        if(err){
          console.log(err)
          return res.status(500).send(err)
        }
        getCount().then((count)=>{
          res.status(200).send({data:result,count:count})
        }).catch((err)=>{
          return res.status(500).send(err)
        })
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
      productcategories.CategoryName,productcategories.CategoryID FROM products INNER JOIN sellers ON products.ProductSellerID = sellers.SellerID
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
