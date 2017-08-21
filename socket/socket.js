module.exports = function(io, rooms, redisClient, config, mongoose, msgs, dl, mesgs,  workModel, contentModel) {
    
    
	var chatrooms = io.of('/roomlist').on('connection', function(socket){	
		socket.emit('roomupdate', JSON.stringify(rooms));
		socket.emit('roomupdate',JSON.stringify(rooms));
        
        socket.emit('server event', { foo: 'bar' });
        socket.on('client event', function (data) {
            socket.broadcast.emit('update label', data);
        });

        // create new room
		socket.on('newroom', function(data){
			rooms.push(data);
			redisClient.lpush('livroom', JSON.stringify(data));
			redisClient.ltrim('livroom', 0, 99);
            redisClient.expire('livroom', 3600);            
			socket.broadcast.emit('roomupdate', JSON.stringify(rooms)); // sends to everyone except the sender
			socket.emit('roomupdate', JSON.stringify(rooms)); // sends to everyone including the sender
		})
	})
    
	var messages = io.of('/messages').on('connection', function(socket){
		socket.on('joinroom', function(data){
			socket.username = data.user;
			socket.userPic = data.userPic;
			socket.join(data.room);
		})		
        
        // when new messages are entered
		socket.on('newMessage', function(data){
            
            //save current session message on redis temporary data
            dta = JSON.stringify(data);
            daaata = '['+dta+']';
//            console.log(daaata);
            dtttt = JSON.parse(daaata);

            redisClient.lpush('currSession_'+dtttt[0].room_name+'msg', dta);
            redisClient.expire('currSession_'+dtttt[0].room_name+'msg', 3600);
            
            // save new data in redis db...... and trim it to store last 99 messages 
			redisClient.lpush('messages', JSON.stringify(data));
			redisClient.ltrim('messages', 0, 599);
            redisClient.expire('messages', 3600);
            // send message to display in rooms page
            socket.broadcast.to(data.room_number).emit('messagefeed', JSON.stringify(data));
		})
        
        // when new content is entered
		socket.on('newcontent', function(data){
            
            //save current session message on redis temporary data
            
            dta = JSON.stringify(data);
            daaata = '['+dta+']';
            dtttt = JSON.parse(daaata);

            redisClient.lpush('currSession_'+dtttt[0].room_name+'content', dta);
            redisClient.expire('currSession_'+dtttt[0].room_name+'content', 3600);
            
            // save new data in redis db...... and trim it to store last 99 content 
			redisClient.lpush('content', JSON.stringify(data));
			redisClient.ltrim('content', 0, 500);
            // send contrnt to display in rooms page
			socket.broadcast.to(data.room_number).emit('contentfeed', JSON.stringify(data));
		})
	})
    
    // save session data from redis data to mongodb
	var saveSession = io.of('/savesession').on('connection', function(socket){
		// enter data from redin into database ...............
		socket.on('saveTheSession', function(data){
			// send the content to mongodb
            var cont = JSON.stringify(data);
            var contin = '['+cont+']';
            var cotin = JSON.parse(contin);

//            // call the redis data that you want to save
			var messages = redisClient.lrange('currSession_'+cotin[0].room_name+'msg', 0,-1, function(err, reply){
	        if(!err) {        
		          var result = [];
		          // Loop through the list, parsing each item into an object
		        	for(var msg in reply){
		        		result.push(reply[msg]);	
		        	}
                    m_db = '['+result+']';
                    msg_db = JSON.parse(m_db);
                    console.log(m_db);
                    //  Pass the room content list to the room collection
                    var newMessage = new msgs({
                        room_no: msg_db[0].room_number,
                        room_name:msg_db[0].room_name,
                        fullname:msg_db[0].room_creator,
                        content:cotin[0].content,
                    });

                    newMessage.save(function(err){
                        //done(null, newMessage);
                    })
                
                    console.log(newMessage._id);
                
                    // for inserting room messages into the room's message collection            
                    for (var w=0;w<msg_db.length;w++){            
                        var newMessages = new mesgs({
                            room_no: newMessage.room_no,
                            sender:msg_db[w].user,
                            reciever:msg_db[w].room_creator,
                            msg: msg_db[w].message,
                            senderpic:msg_db[w].userPic,
                        });
                        newMessages.save(function(err){
                            //done(null, newMessage);
                        })
                    }console.log('uploaded to mongodb');
		        } else console.log('error');
	      	});
		})
	})
    
    
    
}