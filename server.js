const
  express = require('express')
  app = express(),
  ejsLayouts = require('express-ejs-layouts'),
  mongoose = require('mongoose'),
  flash = require('connect-flash'),
  logger = require('morgan'),
  cookieParser = require('cookie-parser'),
  bodyParser = require('body-parser'),
  session = require('express-session'),
  MongoDBStore = require('connect-mongodb-session')(session),
  
  require('dotenv').config(),
  passport = require('passport'),
  FacebookStrategy = require('passport-facebook').Strategy,
  passportConfig = require('./config/passport.js'),
  methodOverride = require('method-override'),

  appId = process.env.APP_ID,
  appSecret = process.env.APP_SECRET,

// Routes:
  userRoutes = require('./routes/users.js'),
  guruRoutes = require('./routes/gurus.js'),
  activityRoutes = require('./routes/activities.js'),
  gurusAllRoutes = require('./routes/gurusAll.js'),

// Models:
  Guru = require('./models/Guru.js'),
  Activity = require('./models/Activity.js'),
  Studio = require('./models/Studio.js')
  


// environment port
const
  port = process.env.PORT || 3000,
  mongoConnectionString = process.env.MONGODB_URI || 'mongodb://localhost/guru'

// mongoose connection:
mongoose.connect(mongoConnectionString, (err) => {
  console.log(err || "Connected to MongoDB (guru)")
})

// store session info in sessions collection in Mongo:
const store = new MongoDBStore({
  uri: mongoConnectionString,
  collection: 'sessions'
})

// middleware
app.use(logger('dev'))
app.use(cookieParser())
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())
app.use(flash())
app.use(methodOverride('_method'))  //Method Override
app.use(express.static(`${__dirname}/views`))

app.get('/auth/facebook',
  passport.authenticate('facebook'));
 
app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/' }),
  function(req, res) {
    // Successful authentication, redirect home. 
    res.redirect('/activities');
  });


// ejs configuration
app.set('view engine', 'ejs')
app.use(ejsLayouts)
app.use(session({
  secret: "i am your guru",
  cookie: {maxAge: 8000000},
  resave: true,
  saveUninitialized: false,
  store: store
}))

app.use(passport.initialize())
app.use(passport.session())

/// USER AUTHORIZATION =====================
//is User logged in?
function isLoggedIn( req, res, next){
  if(req.isAuthenticated()) return next()
  res.redirect('/user-login')
}

app.use(function(req, res, next) {
  app.locals.currentUser = req.user
  app.locals.loggedIn = !!req.user
  next()
})

// root route
app.get('/', (req, res) => {
  res.render('splash')
})

/////USERS ROUTES ------
app.use('/', userRoutes)

// Guru Login Routes:
app.use('/', guruRoutes)

// Gurus All Routes:
app.use('/gurus', gurusAllRoutes)

// Activity Routes:
app.use('/activities', activityRoutes)

// Studios:
app.get('/studios', (req, res) => {
  Studio.find({}, (err, allDemStudios) => {
    if(err) return console.log(err)
    res.render('studios-index', {studios: allDemStudios})
  })
})

// Create Studio:
app.post('/studios', (req, res) => {
  Studio.create(req.body, (err, brandNewStudio) => {
    res.json({message: "Studio created", Studio: brandNewStudio})
  })
})


app.listen(port, (err) => {
  console.log(err || "Running on port: " + port)
})


