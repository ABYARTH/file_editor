var express = require('express'),
	app = express(),
	path = require('path'),
	cookieParser = require('cookie-parser'),
	session = require('express-session'),
	config = require('./config/config.js'),
	ConnectMongo = require('connect-mongo/es5')(session),
	mongoose = require('mongoose'),
    bodyParser = require("body-parser"),
    passport = require('passport'),
	rooms = [],
    AutoIncrement = require('mongoose-sequence'),
    cache = require('rediscache'),
    dl = require('delivery'),
    redis = require("redis"),
	FacebookStrategy = require('passport-facebook').Strategy,
    router = express.Router(),
    TwitterStrategy = require('passport-twitter').Strategy,
    multer = require('multer'),
    upload = multer({ dest: './uploads/' });    

app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('hogan-express'));
app.set('view engine', 'html');
app.use(express.static(path.join(__dirname,'public')));
app.use(cookieParser());
app.use(session({secret:'gfobjjre'}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({"extended" : false}));

mongoose.connect(config.dbURL, {authMechanism: 'ScramSHA1'});
var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", function(callback) {
    console.log("Connection succeeded.");
});

// set variables for development and production environments
var env =  process.env.NODE_ENV || 'development';
if(env === 'development'){
	// development settings
	app.use(session({secret:'config.sessionSecret'}))
}else{
	// production settings
	app.use(session({
		secret:'config.sessionSecret',
		store: new ConnectMongo({
			//url:config.dbURL,
			mongoose_connection:mongoose.connections[0],
			stringify:true
		})
	}))
}


// Schema for Auth login
var chatUser = new mongoose.Schema({
    _id:Number,
	profileID: String,
	fullname: String,
    username: String,
	profilePic: String
}, { _id: false });
chatUser.plugin(AutoIncrement);


// Schema defination for storing the booklet data
var messageSchema = new mongoose.Schema({
	room_no: Number,
    room_name: String,
	fullname: {type: String, ref:'userModel'},
	message: [{ type: mongoose.Schema.Types.ObjectId, ref: 'mesgs' }],
    content:String,
    datetime: {type: Date, default: Date.now}
});

// schema for storing booklet messages
var chatMessages = new mongoose.Schema({
    room_no: {type: Number, ref:'msgs'},
    sender : {type: String, ref:'userModel'},
    reciever : {type: String, ref:'userModel'},
    msg: String,
    senderpic:String,
});


var content = new mongoose.Schema({
    work_id : {type: String, ref:'workModel'},
    subheading : String,
    date_time : {type: Date, default: Date.now},
    context : [{
        content_type: String,
        content_matter: String,
        content_dt:{type: Date, default: Date.now},
    }],
})

var work = new mongoose.Schema({
    created_by : {type: String, ref:'userModel'},
    visible : Boolean,
    discussion_enable: Boolean,
    start_date: {type: Date, default: Date.now},
    description: String,
    domain: String,
    material: [{
        content: {type : mongoose.Schema.Types.ObjectId, ref:'contentModel'}
    }],
    participants: {type : mongoose.Schema.Types.ObjectId, ref:'userModel'},
    likes: Number,
    followers:[{
        noof_followers: Number,
        follower : {type : mongoose.Schema.Types.ObjectId, ref:'userModel'}
    }],
    forkes:[{
        noof_forks: Number,
        forker : {type : mongoose.Schema.Types.ObjectId, ref:'userModel'}
    }]
})



var userModel = mongoose.model('userModel', chatUser);
var msgs = mongoose.model('msgs', messageSchema);
var mesgs = mongoose.model('mesgs', chatMessages);
var workModel = mongoose.model('workModel', work);
var contentModel = mongoose.model('contentModel', content);

// Configure Redis client connection
var redis = require('redis');
// pass the port no. and localhost ip
var host = "127.0.0.1";
var portno = "6379";
var redisClient = redis.createClient(portno, host);
if (redisClient){
	console.log("redis server connected");
}


//testing api

router.route("/users").get(function(req,res){
        var response = {};
        msgs.find({},function(err,data){
        // Mongo command to fetch all data from collection.
            if(err) {
                response = {"error" : true,"message" : "Error fetching data"};
            } else {
                response = {"error" : false,"message" : data};
            }
            res.json(response);
        });
    });

//API FOR GETTING BOOKLETS DATA
    router.get('/booklets', function(req, res, next){
		var response = {};
        msgs.find({},function(err,data){
        // Mongo command to fetch all data from collection.
            if(err) {
                response = {"error" : true,"message" : "Error fetching data"};
            } else {
                response = {"error" : false,"message" : data};
            }
            res.json(response);
        });
    });


    var sess;
    router.get('/booklet/:id', function(req, res, next){
		var response = {};

        msgs.findById(req.params.id,function(err,data){
        // Mongo command to fetch all data from collection.
            if(err) {
                response = {"error" : true,"message" : "Error fetching data"};
            } else {
                response = {"error" : false,"message" : data};
            }
            res.json(response);
        });
    });
    
    router.get('/login/:id', function(req,res,next){
        sess=req.session;
        var id = req.params.id;
        var usersProjection = { 
            __v: false,
            _id: false,
//            profileID: false,
//            profilePic: false
        };
        // find if the use exists in database
        userModel.findOne({username:id}, usersProjection, function(err,data){
        // Mongo command to fetch all data from collection.
            if(data) {
                uO = JSON.stringify(data);
                userO = '['+uO+']';
                uObj = JSON.parse(uO);

                //Set session variables
                sess.fullname = uObj.fullname;
                sess.username = uObj.username;
                sess.profileID = uObj.profileID;
                sess.profilePic = uObj.profilePic;
                
                res.render('chatroom', {user : uObj});
            } else {
                console.log(err);
                res.render('index', {"messages" : "Error : We couldnot find you in our database."});
            }            
        });
	})
    
    
        // call the chatrooms page || 
	router.get('/snippets/:user', function(req, res, next){
		var sess = req.session;
        var username = req.params.user;
        // get data from db
        msgs.find({fullname:username}, function (err, userObj) {
            if (err) {
                console.log(err);
            } else if (userObj) {
//                uO = JSON.stringify(userObj);
                res.json({booklets: userObj });
            } else {
                console.log('User not found!');
            }
        });            
	})
    
    

app.use('/',router);


// passport is user for oauth...  in this case for facebook login
app.use(passport.initialize());
app.use(passport.session());

require('./auth/passportAuth.js')(passport, FacebookStrategy, TwitterStrategy, config, mongoose, userModel, session);

require('./routes/routes.js')(express,app, passport, config, rooms, redisClient, dl, msgs, mesgs, userModel, workModel, contentModel, session);


//socket.io starts here
app.set('port', process.env.PORT||4000);
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
if(io){
	console.log('socket.io connected');
}

io.on('connection', function (socket) {
  socket.emit('server event', { foo: 'bar' });
  socket.on('client event', function (data) {
    console.log(data);
  });
});



require('./socket/socket.js')(io, rooms, redisClient, config, mongoose, msgs, dl, workModel, contentModel, mesgs);

server.listen(app.get('port'),function(){
	console.log('Chatbot working on port :'+ app.get('port'));
})
