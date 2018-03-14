var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authJwtController = require('./auth_jwt');
var User = require('./Users');
var Movie = require('./Movies');
var jwt = require('jsonwebtoken');
//var dotenv = require('dotenv').config();

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

var router = express.Router();

router.route('/postjwt')
    .post(authJwtController.isAuthenticated, function (req, res) {
            console.log(req.body);
            res = res.status(200);
            if (req.get('Content-Type')) {
                console.log("Content-Type: " + req.get('Content-Type'));
                res = res.type(req.get('Content-Type'));
            }
            res.send(req.body);
        }
    );

router.route('/users/:userId')
    .get(authJwtController.isAuthenticated, function (req, res) {
        var id = req.params.userId;
        User.findById(id, function(err, user) {
            if (err) res.send(err);

            var userJson = JSON.stringify(user);
            // return that user
            res.json(user);
        });
    });

router.route('/users')
    .get(authJwtController.isAuthenticated, function (req, res) {
        User.find(function (err, users) {
            if (err) res.send(err);
            // return the users
            res.json(users);
        });
    });

router.post('/signup', function(req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, msg: 'Please pass username and password.'});
    }
    else {
        var user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;
        // save the user
        user.save(function(err) {
            if (err) {
                // duplicate entry
                if (err.code == 11000)
                    return res.json({ success: false, message: 'A user with that username already exists. '});
                else
                    return res.send(err);
            }

            res.json({ message: 'User created!' });
        });
    }
});

router.post('/signin', function(req, res) {
    var userNew = new User();
    userNew.name = req.body.name;
    userNew.username = req.body.username;
    userNew.password = req.body.password;

    User.findOne({ username: userNew.username }).select('name username password').exec(function(err, user) {
        if (err) res.send(err);

        user.comparePassword(userNew.password, function(isMatch){
            if (isMatch) {
                var userToken = {id: user._id, username: user.username};
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json({success: true, token: 'JWT ' + token});
            }
            else {
                res.status(401).send({success: false, msg: 'Authentication failed. Wrong password.'});
            }
        });

    });
});


router.route('/movies')
    .post( authJwtController.isAuthenticated, function (req, res) {
        if (!req.body.title || !req.body.genre || !req.body.YearReleased || !req.body.actors && req.body.actors.length) {
            res.json({success: false, msg: 'Please pass movie title, year released, genre, and actors(character name and actor name)'});
        }
        else {
            if(req.body.actors.length < 3) {
                res.json({ success: false, message: 'Please include at least three actors!'});
            }
            else {
                var movie = new Movie(req, res);
                movie.title = req.body.title;
                movie.YearReleased = req.body.YearReleased;
                movie.genre = req.body.genre;
                movie.actors = req.body.actors;

                movie.save(function(err) {
                    if (err) {
                        if (err.code == 11000)
                            return res.json({ success: false, message: 'A movie with that title already exists!'});
                        else
                            return res.send(err);
                    }

                    res.json({ message: 'Movie Successfully created!' });
                });
            }
        }
    })

    .put( authJwtController.isAuthenticated, function (req, res) {
        var movieID = req.headers.id;
        Movie.findOne({ _id: movieId}).exec(function(err, movie) {
            if (err) res.send(err);

            movie.title = req.body.title;
            movie.YearReleased = req.body.YearReleased;
            movie.genre = req.body.genre;
            movie.actors = req.body.actors;

            movie.save(function(err) {
                if (err) res.send(err);

                res.json({ message: 'Movie Successfully updated!' });
            });
        });
    })


    .get( authJwtController.isAuthenticated, function (req, res) {
        Movie.find(function (err, movies) {
            if (err)
                res.send(err);

            res.json(movies);
        });
    })

    .delete( authJwtController.isAuthenticated, function (req, res) {
        var movieID = req.headers.id;
        //search title by movie id to delete
        Movie.remove({_id: movieID }, function(err, movie) {
            if (err)
            {
                res.json({msg: 'Movie could not be deleted!'});
            }
            res.json({ msg: 'Movie successfully deleted!' });
        });
    });


app.use('/', router);
app.listen(process.env.PORT || 8080);