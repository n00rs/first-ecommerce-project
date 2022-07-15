const db = require('../config/dbconnect')
const collection = require('../config/collections')
const bcrypt = require('bcrypt')
const { resolve } = require('promise')
const objectId = require('mongodb').ObjectId

module.exports = {
    userDetails: () => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.USER_COLLECTION).find().toArray().then((data) => {
                resolve(data);
            })
        })
    },

    adminSignup: (signupData) => {

        return new Promise(async (resolve, reject) => {
            let admin = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ adminId: signupData.adminId });
            if (!admin) {
                signupData.password = await bcrypt.hash(signupData.password, 10);
                db.get().collection(collection.ADMIN_COLLECTION).insertOne(signupData).then((data) => {
                    resolve(data);

                })

            } else {
                let Error = "Id already Exists";
                reject(Error);
            }
        })
    },
    adminLogin: (loginData) => {
        let response = {};
        return new Promise(async (resolve, reject) => {
            let admin = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ adminId: loginData.adminId });
            if (admin) {
                await bcrypt.compare(loginData.password, admin.password).then((status) => {
                    if (status) {
                        response.admin = admin;
                        response.status = true;
                        resolve(response)
                    } else
                        resolve({ status: false });
                })
            } else
                resolve({ status: false });
        })
    },
    deleteItem: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({ _id: objectId(id) }).then((response) => {
                resolve(response);
            })
        })
    },
    getProduct: (id) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(id) }).then((data) => {
                resolve(data);
            })
        })
    },
    editProduct: (prodData) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(prodData.id) },
                {
                    $set: {
                        prodName: prodData.prodName,
                        category: prodData.category,
                        price: prodData.price,
                        description: prodData.description
                    }
                }).then((response) => {
                    resolve(response);
                })
        })
    },
    allOrders: () => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find().toArray()
            
            resolve(orders)

        })

    },
    itemShipped:(orderId)=>{
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({_id: objectId(orderId)},
            {
                $set:{
                    shipmentStatus:"Shipped"
                }
            }).then(()=>{
                resolve()
            })
        })
    },
    getUser:(userId)=>{
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(userId)}).then((userData)=>{
                resolve(userData)
            })
        })
    },
    editUser: (user)=>{
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(user.id)},
            {
                $set:{
                    fname: user.fname,
                    sname: user.sname,
                    address: user.address,
                    phone: user.phone,
                }
            }).then((data)=>{
                console.log(data);
                resolve()

            })
        })
    },
    deleteUser:(userId)=>{
        return new Promise((resolve, reject) => {
              db.get().collection(collection.USER_COLLECTION).deleteOne({_id:objectId(userId)}).then((response)=>{
                resolve(response);
              })
        })
    },

}