const express = require('express');
const router = express.Router();
const dbfunc = require('../func/proddbfunc')
const adminFunc = require('../func/admindbFunc');
const userdbFunc = require('../func/userdbFunc');
const { route } = require('./user');
const verifyAdmin = (req, res, next) => {
    if (req.session.admin) next();

    else res.redirect('/admin/login');
}
router.get('/',verifyAdmin,(req,res)=>{
    let admin = req.session.admin;
    res.render('admin/admin-panel',{admin})
})
router.get('/products', verifyAdmin, (req, res) => {
    let admin = req.session.admin;
    dbfunc.getProducts().then((product) => {
        res.render('admin/products', { admin, product });
    })
})

router.get('/add-product', verifyAdmin, (req, res) => {
    let admin = req.session.admin;
    res.render('admin/add-product', { admin });
})
router.post('/add-product', (req, res) => {
    let img = req.files.image
    dbfunc.addProduct(req.body).then((data) => {

        img.mv('./public/product-image/' + data + '.jpg', (err, data) => {
            if (!err)
                res.redirect('/admin/add-product')
            else
                console.log(err);
        })
    })
})

router.get('/login', (req, res) => {
    if(req.session.admin){
        res.redirect('/admin')
    }else {
    res.render('admin/admin-login', {admin:true, 'idError': req.session.notAdmin });
    req.session.notAdmin = false;
    }
})
router.post('/login', (req, res) => {
    adminFunc.adminLogin(req.body).then((response) => {
        if (response.status) {
            
            req.session.admin = response.admin;
            req.session.admin.adminIn = true;
            res.redirect('/admin')
        } else {
            req.session.notAdmin = "invalid Admin Id or Passsword";
            res.redirect('/admin/login')
        }
    })
})
router.get('/logout', (req, res) => {
    req.session.admin=null;
    res.redirect('/admin/login');
})
router.get("/signup", (req, res) => {
    res.render('admin/admin-signup',{admin:true,"idError":req.session.idError})
    req.session.idError=false;
})
router.post('/signup', (req, res) => {
    adminFunc.adminSignup(req.body).then((respone) => {
        res.redirect('/admin/login')
    }).catch((err)=>{
        req.session.idError=err;
        res.redirect('/admin/signup')
    })
})
router.get('/edit-product', verifyAdmin, (req, res) => {
    let id = req.query.id;
    let admin = req.session.admin
    adminFunc.getProduct(id).then((product) => {
        console.log(product);
        res.render('admin/edit-product', { admin, product })
    })

})
router.post('/edit-product', (req, res) => {
    let id = req.body.id;

    adminFunc.editProduct(req.body).then((response) => {
        res.redirect('/admin');
        if (req.files.image) {
            let img = req.files.image;
            img.mv("./public/product-image/" + id + ".jpg")
        }
    })
})
router.get('/delete-product/:id', (req, res) => {
    let id = req.params.id;
    adminFunc.deleteItem(id).then((status) => {
        res.redirect('/admin');
    })
})

router.get("/users",verifyAdmin,(req,res) => {
    let admin = req.session.admin;
    adminFunc.userDetails().then((userData)=> {
        res.render('admin/user-details',{admin,userData})
    })  
})
router.get('/all-orders',verifyAdmin,async (req,res)=>{
    let admin = req.session.admin;
    let  orders = await adminFunc.allOrders().then()
     console.log(orders);
    res.render('admin/all-orders',{admin,orders})
})

router.get('/order-items/:id/:total', verifyAdmin, async (req,res)=>{
    let admin = req.session.admin;
    

    let total = req.params.total
    let orderItems = await userdbFunc.orderList(req.params.id);
    res.render('admin/order-items',{admin,orderItems,total});

})
router.post("/item-shipped",(req,res)=>{
    console.log(req.body);
    adminFunc.itemShipped(req.body).then((respone)=>{
        res.json({status:true})
    })
})

router.get('/edit-user',verifyAdmin,(req,res)=>{
     let userId=req.query.id;
     adminFunc.getUser(userId).then((user)=>{
        
        res.render('admin/edit-user',{user})
     })

})

router.post('/edit-user',(req,res)=>{
    let user=req.body;
    adminFunc.editUser(user).then(()=>{
        res.redirect('/admin/users')
    })
})
router.get('/delete-user/:id',(req,res)=>{
    console.log(req.params.id);
    adminFunc.deleteUser(userId).then(()=>{
        
    })
})
module.exports = router;