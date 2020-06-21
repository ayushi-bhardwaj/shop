const path = require('path');
const fs=require('fs')
const express = require('express');
const bodyParser = require('body-parser');
const mongoose=require('mongoose')
const session=require('express-session')
const MongoDbStore=require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash=require('connect-flash');
const multer=require('multer');
const helmet=require('helmet')
const compression =require('compression');
const morgan=require('morgan');
const errorController = require('./controllers/error');
//const mongoConnect=require('./util/mongoose');
const User=require('./models/user')
const MONGODB_URI=`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.i3wis.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}?retryWrites=true&w=majority`;

const app = express();
const store=new MongoDbStore({
    uri:MONGODB_URI,
    collection:'sessions'
})
const csrfProtection=csrf();
const fileStorage=multer.diskStorage({
  destination:(req,file,cb)=>{
       cb(null,'images');
  },
  filename:(req,file,cb)=>{
      cb(null,file.filename+'-'+file.originalname)
  }
})
const fileFilter=(req,file,cb)=>{
  if(file.mimetype==='image/png'||file.mimetype==='image/jpg'||file.mimetype==='image/jpeg'){
    cb(null,true);
  }else{
    cb(null,false)
  }
}

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes=require('./routes/auth')
const accessLogStream=fs.createWriteStream(path.join(__dirname,'access.log'),{flags:'a'})
app.use(helmet())
app.use(compression())
app.use(morgan('combined',{stream:accessLogStream}))
app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({storage:fileStorage,fileFilter:fileFilter}).single('image'))
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images',express.static(path.join(__dirname, 'images')));
app.use(session({secret:'My secret',resave:false,saveUninitialized:false,store:store}));

app.use(csrfProtection);
app.use(flash());
  app.use((req,res,next)=>{
     if(!req.session.user){
       return next();
     }
       User.findById(req.session.user._id)
       .then(user=>{
         if(!user){
           return next();
         }
        req.user=user;
         next();
      })
       .catch(err=>{
         //console.log(err);
       next(new Error(err))
      })
  })

 app.use((req,res,next)=>{
   res.locals.isAuthenticated=req.session.isLoggedIn;
   res.locals.csrfToken=req.csrfToken();
   next();
 })
   

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);
app.get('/500',errorController.get500);
app.use(errorController.get404);

app.use((error,req,res,next)=>{

   res.redirect('/500');
})
// mongoose.connect('mongodb+srv://ayushi1234:3CQtUVs3IMConrvh@cluster0-i3wis.mongodb.net/test?retryWrites=true&w=majority')
// .then(result=>{
//     app.listen(3000);
// })
// .catch(err=>{
//     console.log(err);
// })

 mongoose
 .connect(MONGODB_URI)
 .then(result=>{
  app.listen(process.env.PORT||3000);
})
.catch(err=>{
    console.log(err);
})
  

// app.use((req,res,next)=>{

// });

// mongoConnect((client)=>{
//   console.log(client);
//   app.listen(3000);
// })
//



