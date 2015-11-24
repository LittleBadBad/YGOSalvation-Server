/*
Start various sub-servers.
--------------------------
- Game List on port 24555
- YGOPro listener on port 8911, YGOPro applications connect to this port
- YGOPro Web listener on port 8913, browser version connects to this port, 
  and is stripped and routed to the same place as the application. *disabled
- HTTP server running static files out of port 80
- IRC bot connects to #lobby, is named DuelServ
- Update Server is running on port 12000
- Ports 8911, 8913, *80, 12000 need to be free for the server to run.

Installation
------------
Run `npm install` in the directory above.
*/

/*jslint  node: true, plusplus: true*/
'use strict';
var CONFIGURATION = {
    FORUM: 'localforum',
    SITE: 'localhost',
    ProductionFORUM: 'forum.ygopro.us',
    ProductionSITE: 'ygopro.us'
};





var colors = require('colors'), // oo pretty colors!
    domain = require('domain'), // yay error handling
    processManager = require('child_process'), // making babies
    request = require('request'), //talking HTTP here
    needHTTPMicroService = false, //if there is an HTTPD then dont do anything.
    net = require('net'), // ping!
    segfaultHandler = require('segfault-handler'); //http://imgs.xkcd.com/comics/compiler_complaint.png
//https://www.npmjs.com/package/segfault-handler


function bootlogger() {
    console.log('    Logging Enabled @ ../logs'.bold.gold);
    processManager.fork('./logger.js', [], {
        cwd: 'libs'
    }).on('exit', bootlogger);
}

function manualModeBoot() {
    console.log('    Logging Enabled @ ../logs'.bold.gold);
    processManager.fork('./manualMode.js', [], {
        cwd: 'libs'
    }).on('exit', manualModeBoot);
}

function bootHTTPServer() {
    console.log('    HTTP Server @ port 80'.bold.gold);
    processManager.fork('./httpserver.js', [], {
        cwd: 'libs',
        env: CONFIGURATION
    }).on('exit', bootHTTPServer);
}

function bootGameList() {
    console.log('    Primus Server Game Manager @ port 24555'.bold.yellow);
    processManager.fork('./gamelist.js', [], {
        cwd: 'libs'
    }).on('exit', bootGameList);
}

function bootManager() {
    console.log('    YGOSharp Service @ port 8911'.bold.yellow);
    processManager.fork('./game-manager.js', [], {
        cwd: 'libs'
    }).on('exit', bootManager);
}

function bootUpdateSystem() {
    console.log('    Update System @ port 12000'.bold.yellow);
    processManager.fork('../libs/update.js', [], {
        cwd: 'http'
    }).on('exit', bootUpdateSystem);
}

function bootAISystem() {
    setTimeout(function () {
        console.log('    AI[SnarkyChild] connecting to port 127.0.0.1:24555 '.bold.yellow);
        processManager.fork('./ai.js', [], {
            cwd: 'libs'
        }).on('exit', bootAISystem);
    }, 10000);
}

function bootFlashPolicyServer() {
    console.log('    Flash Policy @ Port 843'.bold.yellow);
    processManager.fork('./policyserver.js', [], {
        cwd: 'libs'
    }).on('exit', bootFlashPolicyServer);
}

function bootIRC() {
    console.log('    IRCServer Started'.bold.yellow);
    processManager.exec('./inspircd.exe', [], {
        cwd: '../../Salvation-inspire-ws-binary'
    }, bootIRC);
}


(function main() {
    var mainStack = domain.create();
    mainStack.on('error', function (err) {
        console.error((new Date()).toUTCString(), ' mainStackException:', err.message);
    });
    mainStack.run(function () {

        segfaultHandler.registerHandler("crash.log"); // With no argument, SegfaultHandler will generate a generic log file name
        process.title = 'YGOPro Salvation Server ' + new Date();
        console.log('YGOPro Salvation Server - Saving Yu-Gi-Oh!'.bold.yellow);

        //boot the microservices

        //boot IRC
        //boot anope
        //boot 
        setTimeout(function () {
            bootGameList();
            bootManager();
            bootUpdateSystem();
            bootAISystem();
            bootFlashPolicyServer();
            //manualModeBoot();
            bootlogger();
        }, 5000);

        var httpcheck = net.createServer(),
            localhost = process.env.MAINSITE || '127.0.0.1';

        httpcheck.once('error', function (err) {
            httpcheck.close();
            return;
        });

        httpcheck.once('listening', function () {
            // close the server if listening doesn't fail
            httpcheck.close();
            process.title = 'YGOPro Salvation Server ' + new Date() + ' HTTP SERVER ACTIVE';
            bootHTTPServer();
        });
        httpcheck.listen(80, localhost);

    });
    delete process.send; // in case we're a child process
}());
//
//
///* This is bad code */
//process.on('uncaughtException', function (err) {
//    console.error((new Date()).toUTCString() + ' uncaughtException:', err.message);
//    console.error(err.stack);
//});