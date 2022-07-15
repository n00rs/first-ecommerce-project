const { Router, response } = require('express');
const express = require('express');
const router = express.Router();
const dbfunc = require('../func/proddbfunc')
const userdbFunc = require('../func/userdbFunc');
const verifyLogin = (req,res,next) =>{
    if(req.session.user) next()
    else res.redirect('/login')
}

router.get('/',async (req,res)=>{
    let user = req.session.user;
    let cartCount=null;
    if(user){
        
    cartCount = await userdbFunc.getCount(user._id);
    }
    dbfunc.getProducts().then((products) =>{
        res.render('user/view-product',{user,products,cartCount});
    })

})

router.get('/login', (req,res) => {
    if(req.session.user){
        
        res.redirect('/');
        }
     else {  
    res.render('user/user-login',{"Error":req.session.loginError});
    req.session.loginError = false ;
     }
})
router.post('/login',(req,res) =>{

userdbFunc.userLogin(req.body).then((response)=>{
    if(response.status){
        
        req.session.user = response.user;
        req.session.user.loggedIn = true;
        res.redirect('/');
    }else{
        req.session.loginError="invalid Id or Password";
        res.redirect('/login')
    }
})
})
router.get("/logout",(req,res) => {
req.session.user=null;
res.redirect('/')
})

router.get('/signup',(req,res)=>{
    res.render('user/user-signup',{"idError":req.session.idError})
    req.session.idError = false;
})
router.post('/signup',(req,res)=>{
    userdbFunc.userSignup(req.body).then(()=>{
        res.redirect('/login');
    }).catch((err)=>{
        req.session.idError = err;
        res.redirect('/signup')
    })
})

router.get('/add-to-cart/:id',(req,res) => {
let userId = req.session.user._id;
let prodId = req.params.id;

userdbFunc.userCart(prodId,userId).then(()=>{
    res.json({status: true})
})
})
router.get('/cart',verifyLogin,async (req,res) =>{
    
    let userId = req.session.user._id;
    let products =await userdbFunc.getCartItems(userId); 
    let total =0; 
    if (products.length>0) {
        total = await userdbFunc.totalAmount(userId) ;
    }  
   
   res.render('user/cart',{user:req.session.user, products,total});
    
})
router.post('/change-quantity',(req,res,next) => {
   
    userdbFunc.changeQuantity(req.body).then(async (response)=>{
         response.total = await userdbFunc.totalAmount(req.body.user)
        res.json(response)
    })
})
router.post('/remove-cart-item',(req,res)=>{
    
    userdbFunc.removeItem(req.body).then((response) => {
        res.json(response)
    })
})
router.get('/place-order',verifyLogin,async (req,res)=>{
    
    let userId = req.session.user._id;
    let total = await userdbFunc.totalAmount(userId) 


    res.render('user/place-order',{user:req.session.user,total})
})
router.post('/place-order',verifyLogin,async(req,res)=>{
    let total = await userdbFunc.totalAmount(req.body.userId);
    let product = await userdbFunc.getOrderList(req.body.userId);
   
    userdbFunc.placeOrder(req.body,product,total).then((orderId)=>{
        if(req.body.paymentOption =="cod"){
            res.json({codSuccess:true})
        }else{
            userdbFunc.generatePayment(orderId,total).then((response)=>{
                res.json(response);
            })
        }
    })
})

router.get('/order-success',(req,res)=>{
    res.render('user/order-success')
})

router.get('/view-orders', verifyLogin, async (req,res)=> {

    let userId = req.session.user._id
    let orderDetails = await userdbFunc.orderDetails(userId)
    res.render('user/orders',{orderDetails,user:req.session.user});
})

router.get('/view-order-details/:id',verifyLogin,async (req,res)=>{
    let orderId=req.params.id;
    let orderList = await userdbFunc.orderList(orderId);
    console.log(orderList);
    res.render('user/order-details',{user:req.session.user,orderList})
})

router.post('/verifyPayment',verifyLogin,(req,res)=>{
    console.log(req.body);
    userdbFunc.verifyPayment(req.body).then(()=>{
        console.log(req.body['order[receipt]']);
        userdbFunc.updatePaymentStatus(req.body['order[receipt]']).then(()=>{
            
            res.json({status:true})
        })

    }).catch((err)=>{
        console.log(err);
        res.json({status:false,err})
    })
})

router.get('/about-us',(req,res)=>{
    res.render('user/about-us',{user:req.session.user})
})
router.get('/contact-us',(req,res)=>{
    res.render('user/contact-us',{user:req.session.user})
})
module.exports = router;