module.exports = function(express, app, passport, config, rooms, redisClient, dl, msgs,  workModel, contentModel, mesgs, users, session){
	var router = express.Router();
	router.get('/', function(req, res, next){
		var messages = redisClient.lrange('messages', 0, 99, function(err, reply) {
        if(!err) {        
	          var result = [];
	          // Loop through the list, parsing each item into an object
	        	for(var msg in reply){
	        		result.push(JSON.stringify(reply[msg]));	
	        	}
	          // Pass the message list to the view
	          res.render('index', { messages: result });    
	    } 
        else 
            res.render('index', {messages: err});
      	});    
	});

    
    function securePages(req, res, next){
		if(req.isAuthenticated()){
			next();
		}else{
			res.redirect('/');
		}
	}

    // facebook auth redirect
	router.get('/auth/facebook', passport.authenticate('facebook'));
    
    // twitter auth redirect
    router.get('/auth/twitter', passport.authenticate('twitter'));
	
    // facebook callback url redirect    
    router.get('/auth/facebook/callback', passport.authenticate('facebook',{
		successRedirect:'/chatroom',
		failureRedirect:'/'
	}))
    
    // twitter callback url redirect
    router.get('/auth/twitter/callback', passport.authenticate('twitter',{
		successRedirect:'/chatroom',
		failureRedirect:'/'
	}))

    
    // call the chatrooms page || 
	router.get('/chatroom', function(req, res, next){
		var sess = req.session;
        var liverooms = redisClient.lrange('livroom', 0, 99, function(err, reply) {
        if(!err) {        
	          var result = [];
	          // Loop through the list, parsing each item into an object
	        	for(var room in reply){
                    result.push(reply[room]);                    
	        	}
                // get data from db
                msgs.find({fullname: 'Abyarth Behera'}, function (err, userObj) {
                  if (err) {
                    console.log(err);
                  } else if (userObj) {
                      uO = JSON.stringify(userObj);
                      userO = '['+uO+']';
                      uObj = JSON.parse(uO);
//                    console.log("db connected :"+userO);                      
                      mesgs.find({reciever:'Abyarth Behera'},function(err, obj){
                        if (err) {
                            console.log(err);
                        } else if (obj) {
                            mO = JSON.stringify(obj);
                            muserO = '['+mO+']';
                            muObj = JSON.parse(mO);
                            // Pass the message list to the view
                            res.render('chatroom',{title:'Chatrooms', user:sess, config:config, liverooms: result, booklets: uO, messages:mO});
                        }
                      });
                  } else {
                    console.log('User not found!');
                  }
                });            
            } else res.render('chatroom',{title:'Chatrooms', user:sess, config:config, liverooms: 'koi nai', booklets: 'booklets not found'});
      	});
	})
    
    
    
    // call to rooms page
	router.get('/room/:id', function(req,res,next){
		var room_name = findTitle(req.params.id);
        var room_by = findCreator(req.params.id);
        var sess = req.session;
        
        // fetch current session data from redis            
        var messages = redisClient.lrange('currSession_'+room_name+'msg', 0,-1, function(err, reply){
            if(!err){
                var result = [];
                for (var msg in reply){
                    result.push(reply[msg]);
                }
                var cont = redisClient.lrange('currSession_'+room_name+'content', 0,-1, function(err, reply){
                    if(!err){
                        var resultcon = [];
                        for (var msg in reply){
                            resultcon.push(reply[msg]);
                        }
                        res.render('room',{user: sess, room_number:req.params.id, room_name:room_name, room_by: room_by, config:config, room_content: result, room_content_con: resultcon});
                    }
                })   
            }
            else res.render('room',{user: sess, room_number:req.params.id, room_name:room_name, room_by: room_by, config:config, room_content: 'result', room_content_con: 'no result'});
        });
    })
            
    // to derive the room name
	function findTitle(room_id){
		var n=0;
		while(n<rooms.length){
			if(rooms[n].room_number == room_id){
				return rooms[n].room_name;
				break;
			}else{
				n++;
				continue;
			}
		}
	}
    // to derive the room's creator name
    function findCreator(room_id){
		var n=0;
		while(n<rooms.length){
			if(rooms[n].room_number == room_id){
				return rooms[n].room_by;
				break;
			}else{
				n++;
				continue;
			}
		}
	}
    
    // logout redirect    
	router.get('/logout', function(req, res, next){
//		req.session.destroy(function(err) {
//        });
        req.logout();
		res.redirect('/');
	})	
    
	app.use('/',router);
    
	router.get('/dist/rmc3.min.js', function(req, res, next){
		res.redirect('/dist/rmc3.min.js');
	})
    
	router.get('/dev/FileBufferReader.js', function(req, res, next){
		res.redirect('/dev/FileBufferReader.js');
	})
    
    
    //API FOR GETTING BOOKLETS DATA
    router.get('/booklets', securePages, function(req, res, next){
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
    
    router.get('/booklet/:id', securePages, function(req, res, next){
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
    
    
    
    
    

}