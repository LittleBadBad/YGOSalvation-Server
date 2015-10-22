/*jslint  node: true, plusplus: true, white: false*/
// Gamelist object acts similar to a Redis server, could be replaced with on but its the gamelist state.
'use strict';
var http = require('http');
var primus,
    gamelist = {},
    userdata = {},
    stats = {},
    validationCache = {},
    registry = {
        //People that have read this source code.
        SnarkyChild: '::ffff:127.0.0.1',
        AccessDenied: '::ffff:127.0.0.1',
        Irate: '::ffff:127.0.0.1',
        Chibi: '::ffff:127.0.0.1',
        OmniMage: '::ffff:127.0.0.1'
    },
    online = 0,
    activeDuels = 0,
    booting = true,
    Primus = require('primus'),
    Rooms = require('primus-rooms'),
    primusServer = http.createServer().listen(24555),
    duelserv = require('./duelserv.js'),
    cluster = require('cluster'),
    previousAnnouncement = "",
    domain = require('domain'),
    path = require('path'),
    request = require('request'),
    ps = require('ps-node'),

    currentGlobalMessage = '';

var logger = require('./logger.js');

setTimeout(function () {
    //give the system ten seconds to figure itself out.
    booting = false;
}, 10000);

function announce(announcement) {

    if (previousAnnouncement === announcement) {
        return;
    } else {
        primus.room('activegames').write(announcement);
        previousAnnouncement = announcement;
    }
}

function internalMessage(announcement) {
    primus.room('internalservers').write(announcement);
}

function handleCoreMessage(core_message_raw, port, pid) {

    var handleCoreMessageWatcher = domain.create();
    handleCoreMessageWatcher.on('error', function (err) {});
    handleCoreMessageWatcher.run(function () {

        if (core_message_raw.toString().indexOf("::::") < 0) {
            return gamelist; //means its not a message pertaining to the gamelist API.
        }

        var chat,
            join_slot,
            leave_slot,
            lock_slot,
            core_message = core_message_raw.toString().split('|');
        core_message[0] = core_message[0].trim();
        if (core_message[1] === undefined) {
            return gamelist;
        }
        if (gamelist[core_message[1]] === undefined) {
            gamelist[core_message[1]] = {
                players: [],
                locked: [false, false, false, false],
                spectators: 0,
                started: false,
                time: new Date(),
                pid: pid || undefined
            };
            //if the room its talking about isnt on the gamelist, put it on the gamelist.
        }
        switch (core_message[0]) {

        case ('::::join-slot'):
            join_slot = parseInt(core_message[2], 10);
            if (join_slot === -1) {
                return;
            }
            gamelist[core_message[1]].players[join_slot] = core_message[3].trim();
            gamelist[core_message[1]].time = new Date();
            gamelist[core_message[1]].port = port;
            break;

        case ('::::left-slot'):
            leave_slot = parseInt(core_message[2], 10);
            if (leave_slot === -1) {
                return;
            }
            gamelist[core_message[1]].players[leave_slot] = null;
            break;

        case ('::::spectator'):
            gamelist[core_message[1]].spectators = parseInt(core_message[2], 10);
            break;

        case ('::::lock-slot'):
            lock_slot = parseInt(core_message[2], 10);
            gamelist[core_message[1]].locked[lock_slot] = Boolean(core_message[2]);
            break;

        case ('::::endduel'):
            //ps.kill(gamelist[core_message[1]].pid, function (error) {});
            delete gamelist[core_message[1]];
            //process.kill(pid);
            break;

        case ('::::startduel'):
            gamelist[core_message[1]].started = true;
            gamelist[core_message[1]].time = new Date();
            duelserv.bot.say('#public', gamelist[core_message[1]].pid + '|Duel starting|' + JSON.stringify(gamelist[core_message[1]].players));
            break;

        case ('::::chat'):
            chat = core_message.join(' ');

            process.nextTick(function () {
                logger.info(gamelist[core_message[1]].pid + '|' + core_message[2] + ': ' + core_message[3]);
            });
            process.nextTick(function () {
                duelserv.bot.say('#public', gamelist[core_message[1]].pid + '|' + core_message[2] + ': ' + core_message[3]);
            });
            break;
        }
    });
}

function messageListener(message) {

    var messageListenerWatcher = domain.create();
    messageListenerWatcher.on('error', function (err) {});
    messageListenerWatcher.run(function () {
        activeDuels = 0;
        var brokenup = message.core_message_raw.toString().split('\r\n'),
            game,
            i = 0;
        for (i; brokenup.length > i; i++) {
            handleCoreMessage(brokenup[i], message.port, message.pid);
        }
        for (game in gamelist) {
            if (gamelist.hasOwnProperty(game)) {
                if (gamelist[game].players.length === 0 && gamelist[game].spectators === 0) {
                    //delete if no one is using the game.
                    duelserv.emit('del', gamelist[game].pid);
                }
            }
        }
        for (game in gamelist) {
            if (gamelist.hasOwnProperty(game)) {
                if (gamelist[game] && game.length !== 24) {
                    //delete if some wierd game makes it into the list somehow. Unlikely.
                    duelserv.emit('del', gamelist[game].pid);
                }
            }
        }
        for (game in gamelist) {
            if (gamelist.hasOwnProperty(game)) {
                if (new Date().getTime() - gamelist[game].time.getTime() > 2700000) {
                    //delete if the game is older than 45mins.
                    duelserv.emit('del', gamelist[game].pid);
                }
            }
        }
        for (game in gamelist) {
            if (gamelist.hasOwnProperty(game)) {
                activeDuels++;
            }
        }
        announce(JSON.stringify(gamelist));
    });
    return gamelist;
}


function sendRegistry() {

    Object.keys(cluster.workers).forEach(function (id) {
        cluster.workers[id].send({
            messagetype: 'registry',
            registry: registry
        });
    });
    primus.room('room').clients(function (error, rooms) {
        online = rooms.length;
    });
    internalMessage({
        messagetype: 'registry',
        registry: registry
    });
}

function forumValidate(data, socket, callback) {
    if (validationCache[data.username]) {
        callback(validationCache[data.username]);
        return;
    }
    process.nextTick(function () {
        var url = 'http://forum.ygopro.us/log.php',
            post = {
                ips_username: data.username,
                ips_password: data.password
            };
        request.post(url, {
            form: post
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                var info;
                try {
                    info = JSON.parse(body.trim());
                } catch (msgError) {
                    console.log('Error during validation', body, msgError, socket.address.ip);
                    callback('Error during validation', info);
                    return;
                }
                validationCache[data.username] = info;
                setTimeout(function () {
                    delete validationCache[data.username];
                }, 600000); // cache the forum request for 10 mins.
                callback(null, info);
                return;
            }
        });
    });
}

function registrationCall(data, socket) {
    forumValidate(data, socket, function (error, info) {
        if (info.success) {
            registry[info.displayname] = socket.address.ip;
            stats[info.displayname] = new Date().getTime();
            socket.username = data.username;
            sendRegistry();
            socket.write({
                clientEvent: 'global',
                message: currentGlobalMessage
            });
        } else {
            socket.write({
                clientEvent: 'servererror',
                message: currentGlobalMessage
            });
        }
    });
}

function globalCall(data, socket) {
    forumValidate(data, socket, function (error, info) {
        if (info.success && info.data.g_access_cp === "1") {
            duelserv.emit('announce', {
                clientEvent: 'global',
                message: data.message
            });
            currentGlobalMessage = data.message;
        }
    });
}

function genocideCall(data, socket) {
    forumValidate(data, socket, function (error, info) {
        if (info.success && info.data.g_access_cp === "1") {
            duelserv.emit('announce', {
                clientEvent: 'genocide',
                message: data.message
            });
        }
    });
}

function murderCall(data, socket) {
    forumValidate(data, socket, function (error, info) {
        if (info.success && info.data.g_access_cp === "1") {
            duelserv.emit('announce', {
                clientEvent: 'kill',
                target: data.target
            });
        }
    });
}

function killgameCall(data, socket) {
    forumValidate(data, socket, function (error, info) {
        if (info.success && info.data.g_access_cp === "1") {
            ps.kill(data.killTarget, function (err) {
                if (err) {
                    duelserv.emit('del', data.killTarget);
                }
            });
        }
    });
}

primus = new Primus(primusServer, {
    parser: 'JSON'
});
primus.use('rooms', Rooms);



primus.on('connection', function (socket) {
    socket.on('disconnection', function (socket) {
        socket.leaveAll();
        console.log('deleting:', socket.username);

        //nothing required
    });
    socket.on('data', function (data) {
        var socketWatcher = domain.create();
        socketWatcher.on('error', function (err) {});
        socketWatcher.run(function () {
            data = data || {};
            var action = data.action;

            socket.join(socket.address.ip + data.uniqueID, function () {});
            switch (action) {
            case ('internalServerLogin'):
                if (data.password !== process.env.OPERPASS) {
                    return;
                }
                socket.join('internalservers', function () {

                });
                break;
            case ('gamelistEvent'):
                if (data.password === process.env.OPERPASS) {
                    messageListener(data.coreMessage);
                }
                break;
            case ('ai'):
                if (socket.username) {
                    duelserv.emit('announce', {
                        clientEvent: 'duelrequest',
                        target: 'SnarkyChild',
                        from: socket.username,
                        roompass: data.roompass
                    });
                }
                break;
            case ('join'):
                socket.join(socket.address.ip + data.uniqueID, function () {
                    socket.write({
                        clientEvent: 'privateServer',
                        serverUpdate: userdata[socket.address.ip + data.uniqueID],
                        ip: socket.address.ip + data.uniqueID,
                        stats: stats,
                        online: online
                    });
                    socket.write({
                        clientEvent: 'registrationRequest'
                    });

                });
                socket.join('activegames', function () {
                    socket.write(JSON.stringify(gamelist));
                });
                break;
            case ('leave'):
                socket.leave('activegames');
                break;
            case ('register'):
                registrationCall(data, socket);
                break;
            case ('global'):
                globalCall(data, socket);
                break;
            case ('genocide'):
                genocideCall(data, socket);
                break;
            case ('murder'):
                murderCall(data, socket);
                break;
            case ('killgame'):
                killgameCall(data, socket);
                break;
            case ('privateServerRequest'):
                primus.room(socket.address.ip + data.uniqueID).write({
                    clientEvent: 'privateServerRequest',
                    parameter: data.parameter,
                    local: data.local
                });
                break;
            case ('privateServer'):
                break;
            case ('joinTournament'):
                socket.join('tournament', function () {
                    socket.write(JSON.stringify(gamelist));
                });
                break;
            case ('privateUpdate'):
                primus.room(socket.address.ip + data.uniqueID).write({
                    clientEvent: 'privateServer',
                    serverUpdate: data.serverUpdate
                });
                userdata[socket.address.ip + data.uniqueID] = data.serverUpdate;
                break;
            case ('saveDeckRequest'):
                primus.room(socket.address.ip + data.uniqueID).write({
                    clientEvent: 'saveDeck',
                    deckList: data.deckList,
                    deckName: data.deckName
                });
                break;
            case ('unlinkDeckRequest'):
                primus.room(socket.address.ip + data.uniqueID).write({
                    clientEvent: 'unlinkDeck',
                    deckName: data.deckName
                });
                break;
            default:
                console.log(data);
            }
        });
    });
});


primus.on('error', function () {

    //nothing required
});

function primusListener(message) {

    //other stuff here maybe?
    announce(message);
}

duelserv.on('announce', function (message) {

    announce(message);
});

duelserv.on('del', function (pid) {

    var game;
    for (game in gamelist) {
        if (gamelist.hasOwnProperty(game)) {
            if (String() + gamelist[game].pid === pid) {
                delete gamelist[game];
                announce(JSON.stringify(gamelist));
            }
        }
    }
    ps.kill(pid, function (error) {});
});



module.exports = {
    messageListener: messageListener,
    primusListener: primusListener,
    announce: announce,
    getRegistry: sendRegistry
};


//This is down here on purpose.
setTimeout(function () {

    require('./ai.js');
}, 5000);