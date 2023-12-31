if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
};
const cloudinary = require('cloudinary').v2;
const express = require('express');
const path = require('path');
const methodOverride = require('method-override');
const mongoose = require('mongoose');
const multer = require('multer');
const { storage } = require('./cloudinary');
const upload = multer({ storage });
const ejsMate = require('ejs-mate');
const flash = require('connect-flash');
const session = require('express-session');
const { isLoggedIn, isAuthor, catchAsync } = require('./middleware');
const Song = require('./models/song');
const songs = require('./controllers/songs');
const users = require('./controllers/users');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const MongoDBStore = require('connect-mongo')(session);
const songRoutes = require('./routes/songs');
const userRoutes = require('./routes/users');
// const bcrypt = require('bcrypt');
// const dbUrl = 'mongodb+srv://jjdonnel:Florid@99@cluster0.dnozp.mongodb.net/vlogs?retryWrites=true&w=majority';

mongoose.connect('mongodb+srv://jjdonnel:Florid@99@cluster0.dnozp.mongodb.net/vlogs?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false

});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", ()=> {
    console.log("Database connected");
});

const app = express();

app.engine('ejs', ejsMate); 
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

const store = new MongoDBStore({
    url: 'mongodb+srv://jjdonnel:Florid@99@cluster0.dnozp.mongodb.net/vlogs?retryWrites=true&w=majority',
    secret: 'thisshouldbeabettersecret!',
    touchAfter: 24 * 60 * 60
});

store.on('error', function (e) {
    // console.log('SESSION STORE ERROR', e)
});

const sessionConfig = {
    store,
    secret: 'thisshouldbeabettersecret!',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
};

app.use(session(sessionConfig));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    // console.log(req.session);
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

app.use('/', songRoutes)
app.use('/', userRoutes)

app.use((error, req, res, next) => {
    res.status(error.status || 500).send({
      error: {
        status: error.status || 500,
        message: error.message || 'Internal Server Error',
      },
      
    });
    console.log(error);
  });

app.listen(process.env.PORT || 3000, () => {
  console.log('Serving on port 3000')  
})