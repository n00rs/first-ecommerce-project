const db = require('../config/dbconnect')
const collection = require('../config/collections')
const bcrypt = require('bcrypt')
const { resolve } = require('promise')
const objectId = require('mongodb').ObjectId
const razorpay = require('razorpay')
const collections = require('../config/collections')
const instance = new razorpay({
    key_id: 'rzp_test_mzbt0krwsqikEP',
    key_secret: 'PEKnNcOiHnyU2EA4MtvdeBOC'
})

module.exports = {

    userSignup: (signupData) => {
        let Error = "Id already Exists";
        return new Promise(async (resolve, reject) => {
            let userData = await db.get().collection(collection.USER_COLLECTION).findOne({ email: signupData.email })
            if (!userData) {
                signupData.password = await bcrypt.hash(signupData.password, 10);
                db.get().collection(collection.USER_COLLECTION).insertOne(signupData).then((data) => {
                    resolve(data);
                })
            } else reject(Error);
        })
    },
    userLogin: (loginData) => {
        let response = {};
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: loginData.email });
            if (user) {
                bcrypt.compare(loginData.password, user.password).then((status) => {
                    if (status) {
                        response.user = user;
                        response.status = true;
                        resolve(response);
                    } else {
                        resolve({ status: false });
                    }
                })
            } else {
                resolve({ status: false });
            }
        })
    },
    userCart: (prodId, userId) => {
        let prodObj = {
            item: objectId(prodId),
            quantity: 1,
        }
        return new Promise(async (resolve, reject) => {

            let cartItem = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) });
            if (!cartItem) {
                let cart = {
                    user: objectId(userId),
                    products: [prodObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cart).then((data) => {
                    resolve(data)
                })
            } else {
                let prodExists = cartItem.products.findIndex(product => product.item == prodId);
                if (prodExists != -1) {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId), 'products.item': objectId(prodId) },
                        {
                            $inc: { 'products.$.quantity': 1 }
                        })
                } else {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId) },
                        {
                            $push:
                            {
                                products: prodObj
                            }

                        }).then((data) => {
                            resolve(data);
                        })
                }
            }
        })
    },
    getCartItems: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                { $match: { user: objectId(userId) } },

                {
                    $unwind: "$products"
                },
                {
                    $project: {
                        item: "$products.item",
                        quantity: "$products.quantity"
                    }
                },
                {
                    $lookup:
                    {
                        from: collection.PRODUCT_COLLECTION,
                        localField: "item",
                        foreignField: "_id",
                        as: "product"
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ["$product", 0] }
                    }
                }


            ]).toArray()


            resolve(cartItems)
        })
    },
    getCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartCount = 0;
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (cart) {
                cartCount = cart.products.length
            }
            resolve(cartCount)
        })
    },
    changeQuantity: (data) => {
        let count = parseInt(data.count);
        let quantity = parseInt(data.quantity);
        return new Promise((resolve, reject) => {
            if (count == -1 && quantity == 1) {
                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(data.cart) },
                    {
                        $pull: { products: { item: objectId(data.product) } }
                    }).then((response) => {
                        resolve({ productRemoved: true })
                    })
            } else {
                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(data.cart), 'products.item': objectId(data.product) },
                    {
                        $inc: { 'products.$.quantity': count }
                    }).then((response) => {
                        resolve({ status: true })
                    })
            }
        })
    },
    removeItem: (data) => {

        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(data.cart) },
                {
                    $pull: { products: { item: objectId(data.product) } }
                }).then((response) => {
                    resolve({ itemRemoved: true })
                })
        })
    },
    totalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let totalAmount = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: "$products"
                },
                {
                    $project: {
                        item: "$products.item",
                        quantity: "$products.quantity"
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: "item",
                        foreignField: "_id",
                        as: "cartItems"
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, cartItems: { $arrayElemAt: ["$cartItems", 0] }
                    }
                },
                {
                    $project: {
                        quantity: 1, price: "$cartItems.price"
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: ["$quantity", { $toInt: "$price" }] } }
                    }
                }
            ]).toArray()
            console.log(totalAmount[0]);
            resolve(totalAmount[0].total);
        })
    },
    getOrderList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) });
            resolve(cart.products);
        })
    },
    placeOrder: (order, product, total) => {
        let status = order.paymentOption == 'cod' ? 'placed' : 'pending'      //if(pay=cod) placed else pending
        let orderObject = {
            address: {
                name: order.name,
                phone: order.phone,
                address: order.address1,
                address2: order.address2,
                pincode: order.pincode,
                city: order.city,
                state: order.state,
            },
            userId: order.userId,
            paymentOption: order.paymentOption,
            products: product,
            status: status,
            total: total,
            date: new Date()
        }
        console.log(orderObject);
        return new Promise((resolve, reject) => {


            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObject).then((response) => {
                db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(order.userId) })
                console.log(response.insertedId);
                resolve(response.insertedId)

            })
        })

    },
    orderDetails: (userId) => {

        return new Promise(async (resolve, reject) => {
            let order = await db.get().collection(collection.ORDER_COLLECTION).find({ userId: userId }).toArray();
            // console.log(order[0]);
            resolve(order);

        })
    },
    orderList: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let orderList = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        _id: objectId(orderId)
                    }
                },
                {
                    $unwind: "$products"
                },
                {
                    $project: {
                        item: "$products.item",
                        quantity: "$products.quantity"
                    }
                },
                {
                    $lookup:
                    {
                        from: collection.PRODUCT_COLLECTION,
                        localField: "item",
                        foreignField: "_id",
                        as: "product"
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ["$product", 0] }
                    }
                }

            ]).toArray()
            console.log(orderList);
            resolve(orderList)
        })
    },
    generatePayment: (orderId, total) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount: total * 100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: "" + orderId
            };
            instance.orders.create(options, function (err, order) {
                if (err) console.log(err);
                else {
                    console.log(order);
                    resolve(order)
                }
            });
        })
    },
    verifyPayment: (data) => {
        return new Promise((resolve, reject) => {
            const crypto = require("crypto");
            let hmac = crypto.createHmac('sha256', 'PEKnNcOiHnyU2EA4MtvdeBOC');

            hmac.update(data['payment[razorpay_order_id]'] + "|" + data['payment[razorpay_payment_id]']);
           hmac=hmac.digest('hex')
            if (hmac === data['payment[razorpay_signature]']) {
                console.log('succ');
                resolve()
            }else {
                console.log('reject');
                reject()
            }
        })
    },
    updatePaymentStatus:(orderId) =>{
        return new Promise((resolve, reject) => {
            db.get().collection(collections.ORDER_COLLECTION).
            updateOne({ _id:objectId(orderId)
            },
            {
                $set:{
                    status:'order placed'
                }
            }).then(()=>{
                resolve()
            })
        })
    }
}