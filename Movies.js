var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var mongodb = 'mongodb://ayesha:perwaiz@ds213209.mlab.com:13209/moviedb';
mongoose.connect(mongodb);
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// Movie schema
var MovieSchema = new Schema({
    title: { type: String, required: true, index: { unique: true }},
    YearReleased: { type: String },
    genre: { type: String, required: true, enum:['action','adventure','comedy','fantasy','horror','mystery','thriller','drama','western']},
    actors : { type : Array }
});


// return the model
module.exports = mongoose.model('Movie', MovieSchema);