module.exports = function(passport, FacebookStrategy, TwitterStrategy, config, mongoose, userModel, session){

	passport.serializeUser(function(user, done){
		done(null, user.id);
	})
	passport.deserializeUser(function(id, done){
		userModel.findById(id, function(err, user){
			done(err, user);
		})
	})
	
	passport.use(new FacebookStrategy({
		clientID: config.fb.appID,
		clientSecret: config.fb.appSecret,
		callbackURL: config.fb.callbackURL,
		profileFields: ['id', 'displayName', 'photos']
	}, function(accessToken, refreshToken, profile, done){
		userModel.findOne({'profileID': profile.id},function(err, result){
			if(result){
				done(null, result);
                
                //Set session variables
                var sess = req.session;
                sess.fullname = profile.displayName;
                sess.profileID = profile.id;
                sess.profilePic = profile.photos[0].value || '';
			}else{
				var newChatUser = new userModel({
					profileID:profile.id,
					fullname:profile.displayName,					
					//email:profile.emails[0].value || '',
					profilePic:profile.photos[0].value || ''
				});
				newChatUser.save(function(err){
					done(null, newChatUser);
				})
			}
		})
	}))
    
    
    passport.use(new TwitterStrategy({
		consumerKey: config.twitter.consumerKey,
		consumerSecret: config.twitter.consumerSecret,
		callbackURL: config.twitter.callbackURL,
        profileFields: ['id', 'displayName', 'photos', 'username']
	}, function(token, tokenSecret, profile, done){
		userModel.findOne({'profileID': profile.id},function(req, err, result){
			if(result){
				done(null, result);
                //Set session variables
                var sess = req.session;
                sess.fullname = profile.displayName;
                sess.username = profile.username;
                sess.profileID = profile.id;
                sess.profilePic = profile.photos[0].value || '';
                
			}else{
				var newChatUser = new userModel({
					profileID:profile.id,
					fullname:profile.displayName,
					username:profile.username,
					profilePic:profile.photos[0].value || ''
				});
				newChatUser.save(function(err){
					done(null, newChatUser);
				})
			}
		})
	}))
        
}