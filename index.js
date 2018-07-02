const express = require('express'),
  app = express(),
  http = require('http').Server(app),
  io = require('socket.io')(http),
  path = require('path'),
  bodyParser = require('body-parser'),
  mongoose = require('mongoose'),
  User = require('./models/user'),
  passport = require('passport'),
  JWTStrategy = require('passport-jwt').Strategy,
  ExtractJwt = require('passport-jwt').ExtractJwt,
  jwt = require('jsonwebtoken'),
  socketIOJwt = require('socketio-jwt');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chat');
mongoose.Promise = Promise;
// mongoose.set("debug", true);
// let messages = [];
let users = {};
app.use(express.static('client'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Strategy Configuration
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.SECRET || 'keyboardcat'
};
passport.use(
  new JWTStrategy(jwtOptions, async (payload, next) => {
    let user;
    try {
      user = await User.findById(payload.id);
    } catch (err) {
      console.log(err);
      next(err);
    }
    if (user) {
      return next(null, user);
    }
    return next(null, false);
  })
);
app.use(passport.initialize());

app.get('/register', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'client', 'register.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'client', 'login.html'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'client', 'profile.html'));
});

app.post('/api/login', async (req, res) => {
  // console.log('request received', req.body);
  let name, password;
  if (req.body.username && req.body.password) {
    name = req.body.username;
    password = req.body.password;
  } else {
    return res.json({
      error: true,
      message: 'Username or password not supplied'
    });
  }
  let user;
  try {
    user = await User.findByUsername(name);
  } catch (err) {
    console.error(err);
  }
  if (!user) {
    return res.json({ error: true, message: 'No such user found' });
  }

  user.authenticate(password, (err1, user, err2) => {
    //console.log("arguments to cb: ", args);
    const err = err1 || err2;
    if (err) return res.json({ message: err.message });
    const payload = { id: user._id };
    const token = jwt.sign(payload, jwtOptions.secretOrKey);
    return res.json({
      error: false,
      message: 'Login successful',
      token: token
    });
  });
});

app.post('/api/register', (req, res) => {
  User.register(
    new User({ username: req.body.username }),
    req.body.password,
    function(err, user) {
      if (err) {
        console.log(err);
        return res.json({ error: true, message: err.message });
      }
      const payload = { id: user._id };
      const token = jwt.sign(payload, jwtOptions.secretOrKey);
      return res.json({
        error: false,
        message: 'Account created successfully',
        token: token
      });
    }
  );
});

app.get(
  '/api/profileinfo',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    res.json(req.user);
  }
);

app.get('/logout', (req, res) => res.redirect('login'));

app.get('/', (req, res) =>
  res.sendFile(path.resolve(__dirname, 'client', 'register.html'))
);

io.sockets
  .on(
    'connection',
    socketIOJwt.authorize({
      secret: jwtOptions.secretOrKey,
      timeout: 15000
    })
  )
  .on('authenticated', function(socket) {
    User.findById(socket.decoded_token.id)
      .then(function(user) {
        socket.username = user.username;
        if (!users.hasOwnProperty(user.username)) users[user.username] = {};
        if (users[user.username].sockets) {
          users[user.username].sockets.push(socket.id);
        } else {
          users[user.username].sockets = [socket.id];
        }
      })
      .catch(console.log);

    socket.on('disconnect', () => {
      users[socket.username].sockets = users[socket.username].sockets.filter(
        id => id !== socket.id
      );
    });

    socket.on('message', msg => {
      io.emit('message', { name: socket.username, message: msg });
    });
  });

http.listen(process.env.PORT || 3000, () => console.log('Server listening'));
