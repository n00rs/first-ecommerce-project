const db = require('../config/dbconnect')
const collection = require('../config/collections')

module.exports={
 addProduct:(productData)=>{
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).insertOne(productData).then((data) => {
                console.log(data);
                resolve(data.insertedId)
            })
        })
    },
 getProducts: ()=>{
    return new Promise(async (resolve, reject) => {
        let product = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray();
        resolve(product);
    })
 }
}