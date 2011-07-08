//    Aebleskiver
//    (c) 2011 Beau Sorensen
//    Aebleskiver may be freely distributed under the MIT license.
//    For all details and documentation:
//    https://github.com/sorensen/aebleskiver

(function() {
    // Application model
    // -----------------
    
    // The top-level namespace. All public classes and modules will
    // be attached to this. Exported for both CommonJS and the browser.
    var Models;
    if (typeof exports !== 'undefined') {
        Models = exports;
    } else {
        Models = this.Models || (this.Models = {});
    }
    
    // Extend the Backbone 'model' object and add it to the 
    // namespaced model container
    Models.ApplicationModel = Backbone.Model.extend({
    
        // Server communication settings
        type     : 'application',
        urlRoot  : 'app',
        
        // Model defaults
        defaults : {
            server  : 's1',
            visits  : 0,
            users   : [],
            rooms   : []
        },
        
        //###initialize
        // Model constructor
        initialize : function(options) {
            
            // Current user collection
            this.users     = new Models.UserCollection();
            this.users.url = this.url() + ':users';
            
            // Active room collection
            this.rooms     = new Models.RoomCollection();
            this.rooms.url = this.url() + ':rooms';
            
            // Create a new user for the current client, only the 
            // defaults will be used until the client authenticates
            // with valid credentials
            window.user = new Models.UserModel();
            
            // Conversations collections
            window.window.user.conversations     = new Models.ConversationCollection();
            window.window.user.conversations.url = this.url() + ':conversations';
            
            // Wait for three executions of history() before
            // starting, ensuring that rooms and users are loaded before
            // trying to execute the current hash location
            var history = _.after(3, function() {
                Backbone.history.start();
            });
            var self = this;
            
            // Sync up with the Server through DNode, Backbone will
            // supply the channel url if one is not supplied
            this.rooms.subscribe({}, function(resp) {
                self.rooms.fetch({
                    query    : {},
                    error    : function(code, msg, opt) {},
                    finished : function(resp) {
                        history();
                    },
                });
            });
            
            // Subscribing to a model can be continued by just 
            // passing a callback, though, it will still execute a
            // 'finished' function if you pass one in theim n options
            this.users.subscribe({}, function(resp) {
                self.users.fetch({
                    query    : {},
                    error    : function(code, msg, opt) {},
                    finished : function(resp) {
                        console.log('users fetched');
                        history();
                        
                        var params = {
                            token : self.view.sid,
                            error : function(code, data, options) {
                            },
                        };
                        Server.getSession({}, params, function(session, options) {
                        
                            console.log('got session');
                            if (!session) return;
                            options.password && (session.password = options.password);
                            session = _.getMongoId(session);
                            
                            window.user.set(session);
                            window.user.url = self.url() + ':users:' + session.id;
                            window.user.subscribe({}, function(resp) {
                            
                                // Current user bindings
                                window.user.friends.bind('add', self.view.addFriend);
                                window.user.friends.bind('reset', self.view.allFriends);
                                
                                window.user.favorites.bind('add', self.view.addFavorite);
                                window.user.favorites.bind('reset', self.view.allFavorites);
                            
                                window.user.collection = self.users;
                                window.user.loadFriends()
                                window.user.loadFavorites();
                            });
                            
                            history();
                            session._id && self.view.toggleNav();
                            
                            // Sync up with the Server through DNode, Backbone will
                            // supply the channel url if one is not supplied
                            /**
                            window.user.conversations.subscribe({}, function(resp) {
                                console.log('Conversation subbed', resp);
                                window.user.conversations.fetch({
                                    query    : {},
                                    error    : function(code, msg, opt) {},
                                    finished : function(resp) {
                                        console.log('Conversation fetched', resp);
                                    },
                                });
                            });
                            **/
                            
                            // Testing mechanics for retrieving the 
                            // number of all current connections
                            Server.onlineUsers(function(resp) {
                            });
                            
                            Server.activeSessions(function(resp) {
                                this.online = resp.length || 0;
                            });
                        });
                    },
                });
            });
            
            // Wait a while and then force-start history, on the off chance
            // that no users or rooms were loaded
            _.delay(function() {
                try {
                    Backbone.history.start();
                } catch (error) {
                    // Error's only occur when we try to 
                    // re-start backbone history
                }
            }, 5000);
        },
        
        //###createRoom
        // Create a new room
        createRoom : function(attr) {
            if (!attr) return;
            this.rooms.create(attr, {
                error    : function(msg, resp, options) {},
                finished : function(resp) {
                }
            });
        },
    });
})()