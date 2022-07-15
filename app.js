const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const hbs = require('express-handlebars');
const path = require('path');
const db = require("./config/dbconnect")
const PORT = 3000;
const app = express();
const nocache = require('nocache')

const adminRouter = require('./routes/admin');
const userRouter = require('./routes/user');


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.engine('hbs', hbs.engine({ extname: 'hbs', defaultLayout: 'layout',
layoutsDir: __dirname+'/views/layout/', partialsDir: __dirname+'/views/partials/'
}))

app.use(express.json());
app.use(cookieParser());
app.use(fileUpload());
app.use(session({secret:"key", cookie:{maxAge: 999999999}}))
app.use(express.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname,'public')))
app.use(express.static(path.join(__dirname)))
app.use(nocache())

db.connect((err) => {
    if(err) console.log("Error"+err);
    else console.log("mongoDB Conneted");
})

app.use('/',userRouter);
app.use('/admin',adminRouter);

app.listen(PORT,() => {console.log("listening at 3000");})

module.exports = app;