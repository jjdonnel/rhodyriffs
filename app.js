if (process.env.NODE_ENV !== "production") {
    require("DOTENV").config();
};

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
// const bcrypt = require('bcrypt');

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

const sessionConfig = {
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
    console.log(req.session);
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
    const songs = await Song.find({});
    res.render('songs/index', { songs });
})

app.get('/songs/new', async (req, res) => {
    res.render('songs/new');
})

app.post('/songs', isLoggedIn, upload.single('image'), async (req, res) => {
    const song = new Song(req.body.song);
    console.log(song);
    song.author = req.user._id;
    song.image = req.file.path;
    await song.save();
    console.log(req.body.song);
    res.redirect(`/songs/${song._id}`);
})

app.get('/songs/:id', async function(req, res) {
    const song = await Song.findById(req.params.id).populate('author');
    console.log(song);
    // console.log(song.user.username);
    res.render('songs/show', { song });
});

app.get('/songs/:id/edit', async (req, res) => {
    const song = await Song.findById(req.params.id)
    // res.send("It Worked!")
    res.render('songs/edit', { song });
})

app.put('/songs/:id', isLoggedIn, upload.single('image'), async (req, res) => {
    const { id } = req.params;
    const song = await Song.findByIdAndUpdate(id, { ...req.body.song });
    res.redirect(`/songs/${song._id}`);
})

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
    console.log(error);

  });

app.listen(3000, () => {
  console.log('Serving on port 3000')  
})