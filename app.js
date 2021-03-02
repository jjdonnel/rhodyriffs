if (process.env.NODE_ENV !== "production") {
    require("DOTENV").config();
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
const session = require('express-session');
const Song = require('./models/song');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const MongoDBStore = require('connect-mongo')(session);
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

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    // console.log(req.session);
    res.locals.currentUser = req.user;
    next();
})

const isLoggedIn = (req, res, next) => {
    req.session.returnTo = req.originalUrl;
    // console.log("REQ.USER...", req.user);
    if (!req.isAuthenticated()) {
        return res.redirect('/login');
    }
    next();
}

const isAuthor = async (req, res, next) => {
    const { id } = req.params;
    const song = await Song.findById(id);
    if (!song.author.equals(req.user._id)) {
        return res.redirect(`/songs/${id}`);
    }
    next();
}

const catchAsync = func => {
    return (req, res, next) => {
        func(req, res, next).catch(next);
    }
}

// app.get('/fakeUser', async (req, res) => {
//     const user = new User({ email: 'jak@gmail.com', username: 'jakkk' });
//     const newUser = await User.register(user, 'chicken');
//     res.send(newUser);
// })

app.get('/', (req, res) => {
    res.render('home');
})

app.get('/register', (req, res) => {
    res.render('register');
})

app.post('/register', async (req, res) => {
    try {
        const { email, username, password } = req.body;
        const user = new User({ email, username });
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, err => {
            if (err) return next(err);
            res.redirect('/songs');
        })
    } catch (e) {
        // req.session.user_id = user._id;
        res.redirect('register');
    }
    });

app.get('/login', (req, res) => {
    res.render('login');
})

app.post('/login', passport.authenticate('local', { failureRedirect: '/login' }), (req, res) => {
    // const { username, password } = req.body;
    // const foundUser = await User.findAndValidate(username, password);
    // console.log(username);
    // if (foundUser) {
    //     req.session.user_id = foundUser._id;
    const redirectUrl = req.session.returnTo || '/songs';
    delete req.session.returnTo;
        res.redirect(redirectUrl);
    // } else {
    //     res.redirect('login');
    // }
});

app.get('/logout', (req, res) => {
    req.logout();
    // req.session.user_id = null;
    res.redirect('/');
})
app.get('/songs', async (req, res) => {
    const songs = await (await Song.find({})).reverse();
    res.render('songs/index', { songs });
})

app.get('/songs/new', async (req, res) => {
    res.render('songs/new');
})

app.post('/songs', isLoggedIn, upload.single('image'), async (req, res) => {
    const song = new Song(req.body.song);
    console.log(song._id);
    song.author = req.user._id;
    song.image = req.file.path;
    // res.locals.poster = song.image+'#t=0.1';
    // console.log(song.image);
    await song.save();
    // console.log(req.body.song);
    res.redirect(`/songs/${song._id}`);
})

app.get('/songs/:id', async function(req, res) {
    const song = await Song.findById(req.params.id).populate('author');
    // console.log(song);
    // console.log(song.user.username);
    res.render('songs/show', { song });
});

app.get('/songs/:id/edit', async (req, res) => {
    const song = await Song.findById(req.params.id);
    
    // res.send("It Worked!")
    res.render('songs/edit', { song });
})

app.put('/songs/:id', isLoggedIn, upload.single('image'), async (req, res) => {
    try {
     let song = await Song.findById(req.params.id);
     let music = req.body.song;
     console.log(req.body.song);
        await cloudinary.uploader.destroy(song._id);
            const result = await cloudinary.uploader.upload(req.file.path, { resource_type: 'video' });
            const data = {
                image: result.secure_url,
                imageId: result.public_id
            };
            // const { id } = req.params;
            song = await Song.findByIdAndUpdate(req.params.id, data, { ...req.body.song });
            song.title = music.title;
            song.description = music.description;
            await song.save();
            res.redirect(`/songs/${song._id}`); 
            
            } catch (err) {
                console.log(err);
            }
        });

app.delete('/songs/:id', isLoggedIn, async (req, res) => {
    const { id } = req.params;
    await Song.findByIdAndDelete(id);
    res.redirect('/songs');
})

app.use((error, req, res, next) => {
    res.status(error.status || 500).send({
      error: {
        status: error.status || 500,
        message: error.message || 'Internal Server Error',
      },
      
    });
    // console.log(error);

  });

app.listen(process.env.PORT || 3000, () => {
  console.log('Serving on port 3000')  
})