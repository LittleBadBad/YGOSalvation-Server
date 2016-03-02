/*jslint plusplus: true*/
/*jslint nomen: true*/
/*global localStorage, $, Primus, console, writeDeckList, makeDeck, confirm, launcher, singlesitenav, startgame, _gaq, internalLocal, loggedIn, processServerCall, admin*/
/*exported connectToCheckmateServer, leaveGamelist, hostGame, connectgamelist, setHostSettings, setfilter*/
/*eslint no-alert: 2*/

var localstorageIter = 0;

function applySettings() {
    'use strict';
    $('[data-localhost]').each(function () {
        var property = $(this).attr('data-localhost'),
            value = ('1' === localStorage[property]) ? true : false;
        $(this).prop('checked', value);
    });
    $('#skinlist').append('<option selected value="' + localStorage.skin_index + '">' + localStorage.skin_text + '</option>');
    $('.currentdeck').append('<option selected value="' + localStorage.lastdeck + '">' + localStorage.lastdeck + '</option>');
    $('#fontlist').append('<option selected value="' + localStorage.textfont + '">' + localStorage.textfont + '</option>');
    $('#dblistlist').append('<option selected value="' + localStorage.database + '">' + localStorage.database + '</option>');
    $('#sound_volume').val(Number(localStorage.sound_volume));
    $('#music_volume').val(Number(localStorage.music_volume));
    $('#fontsize').val(Number(localStorage.textfontsize));
    $('#dblist').val(Number(localStorage.dblist));
}

applySettings();

function saveSettings() {
    'use strict';
    $('[data-localhost]').each(function () {
        var property = $(this).attr('data-localhost');
        localStorage[property] = Number($(this).prop('checked'));
    });
    localStorage.skin_index = $('#skinlist').val();
    localStorage.skin_text = $('#skinlist option:selected').text();
    localStorage.font_text = $('#cfontlist option:selected').text();
    localStorage.database = $('#dblist option:selected').text();
    localStorage.textfont = $('#fontlist').val();
    localStorage.sound_volume = $('#sound_volume').val();
    localStorage.music_volume = $('#music_volume').val();
    localStorage.textfontsize = $('#fontsize').val();
    localStorage.dblist = $('#dblist').val();
    localStorage.dbtext = $('#dblist option:selected').text();
}
var mode = "production",
    gamelistcache,
    screenMessage = $('#servermessages'),
    uniqueID = $('#uniqueid').html();

var primus = Primus.connect('ws://' + location.host + ':24555');


function isChecked(id) {
    'use strict';
    return ($(id).is(':checked'));
}

function ygopro() {
    'use strict';
    if (!loggedIn) {
        return;
    }
    if (localStorage.roompass) {
        if (localStorage.roompass[0] === '4') {
            //if battleback
            localStorage.battleback = writeDeckList(makeDeck(9));

        }
    }

    startgame(localStorage.roompass + '\u0000');
    console.log('sending details');


    window.internalLocal = 'YGOPro';
    try {
        _gaq.push(['_trackEvent', 'Launcher', 'YGOPro', parameter]);
        _gaq.push(['_trackEvent', 'Site', 'Navigation Movement', internalLocal + ' - YGOPro']);
    } catch (e) {
        window.console.log('Error with Google Analytics');
    }


}







$('#servermessages').text('Loading interface from server...');

function joinGamelist() {
    'use strict';
    primus.write({
        action: 'join',
        uniqueID: uniqueID
    });
}
joinGamelist();

setInterval(joinGamelist, 5000);


function leaveGamelist() {
    'use strict';
    primus.write({
        action: 'leave',
        uniqueID: uniqueID
    });
}

function hostGame(parameters) {
    'use strict';
    primus.write({
        serverEvent: 'hostgame',
        format: parameters,
        uniqueID: uniqueID
    });
}

function connectgamelist() {
    'use strict';
    primus.write({
        action: 'join',
        uniqueID: uniqueID
    });
    primus.write({
        action: 'register',
        nickname: localStorage.nickname,
        uniqueID: uniqueID
    });
}

function enterGame(string, pass) {
    'use strict';
    var guess = '';
    console.log('checking for pass');
    if (pass) {
        guess = window.prompt('Password?', guess);
        if (string.substring(26, 19) !== guess) {
            window.alert('Wrong Password!');
            return;
        }
    }
    console.log('entering duel');
    $('body').css('background-image', 'url(http://ygopro.us/img/bg.jpg)');
    localStorage.lastdeck = $('.currentdeck').val();
    localStorage.roompass = string;
    localStorage.lastip = "192.99.11.19";
    ygopro('-j');
    try {
        _gaq.push(['_trackEvent', 'Launcher', 'YGOPro', 'Join Duel']);
    } catch (e) {
        window.console.log('Error with Google Analytics');
    }
    setTimeout(function () {
        $('body').css('background-image', 'url(http://ygopro.us/img/brightx_bg.jpg)');
    }, 6000);
}

function joinTournament() {
    'use strict';
    primus.write({
        action: 'joinTournament',
        uniqueID: uniqueID
    });
}

function randomString(len, charSet) {
    'use strict';
    charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var randomPoz,
        i = 0,
        randomstring = '';
    for (i; i < len; i++) {
        randomPoz = Math.floor(Math.random() * charSet.length);
        randomstring += charSet.substring(randomPoz, randomPoz + 1);
    }
    return randomstring;
}

function setpass() {
    'use strict';
    var pass = randomString(5);
    do {
        if (pass.length !== 5) {
            pass = randomString(5);
        }
        pass = window.prompt('Password (5 char):', pass);
        pass.replace(/[^a-zA-Z0-9]/g, "");
    } while (pass.length !== 5);
    window.prompt('Give this Password to your Opponent(s)!', pass);
    return pass;
}

function getDuelRequest() {
    'use strict';
    var pretypecheck = '',
        out,
        stnds = isChecked('#usepass') ? ',5,1,L,' : ',5,1,U,',
        randneed = ($('#creategamebanlist').val() > 9) ? 4 : 5;
    out = {
        string: pretypecheck + $('#creategamecardpool').val() + $('#creategameduelmode').val() + $('#creategametimelimit').val(),
        prio: isChecked('#enableprio') ? ("T") : ("O"),
        checkd: isChecked('#discheckdeck') ? ("T") : ("O"),
        shuf: isChecked('#disshuffledeck') ? ("T") : ("O"),
        stnds: "," + $('#creategamebanlist').val() + stnds,
        pass: isChecked('#usepass') ? setpass() : randomString(randneed)

    };

    out.prio = ($('#creategamebanlist').val() === "4") ? "T" : out.prio;
    out.prio = ($('#creategamebanlist').val() === "5") ? "T" : out.prio;
    //out.string[0] = ($('#creategamebanlist').val() === "3") ? "1" : out.string[0];

    return out;
}

function secure(prio, checkd, shuf) {
    'use strict';
    if (prio + checkd + shuf !== "OOO" && $('input:radio[name=ranked]:checked').val() === 'R') {
        $('#servermessages').text('You may not cheat here.');
        return false;
    }
    if ($('#creategamecardpool').val() === 2 && $('input:radio[name=ranked]:checked').val() === 'R') {
        $('#servermessages').text('OCG/TCG is not a valid mode for ranked, please select a different mode for ranked play');
        return false;
    }
    return true;
}

function setHostSettings() {
    'use strict';
    var duelRequest = getDuelRequest();
    localStorage.roompass =
        (duelRequest.string + duelRequest.prio +
            duelRequest.checkd + duelRequest.shuf +
            $('#creategamelp').val() + duelRequest.stnds +
            duelRequest.pass).substring(0, 24);

    localStorage.lastip = '192.99.11.19';
    localStorage.serverport = '8911';
    localStorage.lastport = '8911';
    //PER CHIBI
    console.log(localStorage.roompass, 'affter calculation');
    localStorage.lastdeck = $('#hostSettings .currentdeck').val();

    if (isChecked('#useai')) {
        primus.write({
            action: 'ai',
            roompass: localStorage.roompass,
            deck: $("#aidecks option:selected").text()
        });
        ygopro('-j');
    } else {
        ygopro('-j');
    }
    try {
        _gaq.push(['_trackEvent', 'Launcher', 'YGOPro', 'Host']);
        _gaq.push(['_trackEvent', 'Launcher', 'YGOPro Host', duelRequest.string + duelRequest.prio +
            duelRequest.checkd + duelRequest.shuf +
            $('#creategamelp').val() + duelRequest.stnds]);
    } catch (e) {}
}


function parseFilters() {
    'use strict';
    return {
        banList: parseInt($('#filterbanlist option:selected').val(), 10),
        timeLimit: $('#filtertimelimit option:selected').text().toLocaleLowerCase(),
        allowedCards: $('#filercardpool option:selected').text().toLocaleLowerCase(),
        gameMode: $('#filterroundtype option:selected').text().toLocaleLowerCase(),
        userName: $('#filterusername').val()
    };

}

function parseDuelOptions(duelOptions) {
    'use strict';
    //{"200OOO8000,0,5,1,U,PaS5w":{"port":8000,"players":[],"started":false}}
    var duelOptionsParts = duelOptions.split(','),
        settings = { //Determine time limit
            timeLimit: (duelOptionsParts[0][2] === '0') ? '3 minutes' : '5 minutes',
            //Use classic TCG rules?
            isTCGRuled: (duelOptionsParts[0][3] === 'O') ? 'OCG rules' : 'TCG Rules',

            //Check Deck for Illegal cards?
            isDeckChecked: (duelOptionsParts[0][4] === 'O') ? 'Check' : 'Dont Check',

            //Shuffle deck at start?
            isShuffled: (duelOptionsParts[0][5] === 'O') ? 'Shuffle' : 'Dont Shuffle',

            //Choose Starting Life Points
            lifePoints: duelOptionsParts[0].substring(6),

            //Determine Banlist
            banList: parseInt(duelOptionsParts[1], 10),

            //Select how many cards to draw on first hand
            openDraws: duelOptionsParts[2],

            //Select how many cards to draw each turn
            turnDraws: duelOptionsParts[3],

            //Choose whether duel is locked
            isLocked: (duelOptionsParts[4] === 'U') ? false : true,

            //Copy password
            password: duelOptionsParts[5]
        };



    //Determine allowed cards
    if (duelOptionsParts[0][0] === '0') {
        settings.allowedCards = 'OCG';
    }
    if (duelOptionsParts[0][0] === '1') {
        settings.allowedCards = 'TCG';
    }
    if (duelOptionsParts[0][0] === '2') {
        settings.allowedCards = 'TCG/OCG';
    }
    if (duelOptionsParts[0][0] === '3') {
        settings.allowedCards = 'Anime';
    }
    if (duelOptionsParts[0][0] === '4') {
        settings.allowedCards = 'Sealed BP3';
    }
    if (duelOptionsParts[0][0] === '5') {
        settings.allowedCards = 'Constructed BP3';
    }

    //Determine game mode
    if (duelOptionsParts[0][1] === '0') {
        settings.gameMode = 'Single';
    }
    if (duelOptionsParts[0][1] === '1') {
        settings.gameMode = 'Match';
    }
    if (duelOptionsParts[0][1] === '2') {
        settings.gameMode = 'Tag';
    }

    //    if (settings.gameMode === 'single' || settings.gameMode === 'match') {
    //
    //    }
    settings.poolFormat = $('#creategamebanlist [value="' + duelOptionsParts[1] + '"]').html();
    return settings;

}

function sortMe(a, b) {
    'use strict';
    return a.className < b.className;
}

function preformfilter(translated, players, rooms, started, pid, watchers) {
    'use strict';
    var OK = true,
        content = '',
        duelist = '',
        filterm = parseFilters(),
        game = (translated.poolFormat !== 'Goat Format') ? 'game' : 'nostalgia',
        pass = '',
        spectators = (watchers) ? ' +' + watchers : '';
    game = (translated.poolFormat !== 'Newgioh') ? game : 'newgioh';
    game = (translated.poolFormat !== 'ARG') ? game : 'arg';
    game = (translated.poolFormat !== 'Unlimited') ? game : 'bad';
    game = (translated.poolFormat !== 'Traditional') ? game : 'bad';
    game = (translated.poolFormat !== 'Mega-Banned') ? game : 'bad';

    if (translated.isLocked) {
        pass = translated.password;
    }

    //OK = (translated.gameMode !== filterm.gameMode && filterm.gameMode !== 'all') ? false : OK;
    //OK = (translated.allowedCards !== filterm.allowedCards && filterm.allowedCards !== 'all') ? false : OK;
    //OK = (translated.timeLimit !== filterm.timeLimit && filterm.timeLimit !== 'all') ? false : OK;
    //OK = (translated.banList !== filterm.banList && filterm.banList !== '20') ? false : OK;
    //OK = (players.searchFor(filterm.userName) === -1) ? false : OK;
    //OK = true; //disabling filter for now.

    if (OK) {
        duelist = (translated.gameMode === 'Single' || translated.gameMode === 'Match') ? players[0] + ' vs ' + players[1] : players[0] + ' &amp ' + players[1] + ' vs ' + players[2] + ' &amp ' + players[3];
        //console.log(translated);
        content = '<div class="game ' + rooms + ' ' + started + ' ' + translated.isLocked + ' ' + translated.gameMode;
        content += '"onclick=enterGame("' + rooms + '",' + translated.isLocked + ')';
        content += ' data-roomid="' + rooms + '" data-' + game + '="' + rooms + '"data-killpoint="' + pid + '">' + duelist + spectators;
        content += '<span class="subtext" style="font-size:.5em"><br>' + translated.gameMode;
        content += ' ' + $('#creategamebanlist option[value=' + translated.banlist + ']').text() + ' ' + translated.poolFormat + '</div>';
    }
    return content;
}

function renderList(JSONdata) {
    'use strict';
    var player1,
        player2,
        player3,
        player4,
        translated,
        players,
        rooms,
        content,
        started,
        elem,
        spectators = 0;

    $('#gamelistitems').html('');
    for (rooms in JSONdata) {
        if (JSONdata.hasOwnProperty(rooms)) {
            player1 = (JSONdata[rooms].players[0]) ? '<label class="playername">' + JSONdata[rooms].players[0] + '</label>' : '___';
            player2 = (JSONdata[rooms].players[1]) ? '<label class="playername">' + JSONdata[rooms].players[1] + '</label>' : '___';
            player3 = (JSONdata[rooms].players[2]) ? '<label class="playername">' + JSONdata[rooms].players[2] + '</label>' : '___';
            player4 = (JSONdata[rooms].players[3]) ? '<label class="playername">' + JSONdata[rooms].players[3] + '</label>' : '___';
            started = (JSONdata[rooms].started) ? 'started' : 'avaliable';
            translated = parseDuelOptions(rooms);
            players = [player1, player2, player3, player4];
            content = preformfilter(translated, players, rooms, started, JSONdata[rooms].pid, JSONdata[rooms].spectators);
            spectators = spectators + JSONdata[rooms].spectators;
            $('#gamelistitems').prepend(content);
        }
    }
    elem = $('#gamelistitems').find('div:not(.avaliable)').sort(sortMe);
    $('#gamelistitems').append(elem);
    $('.game.avaliable').first()
        .before('<br style="clear:both"><span class="gamelabel">' + window.jsLang.join + '<span><br style="clear:both">');
    $('.started')
        .first().before('<br style="clear:both"><span class="gamelabel">' + window.jsLang.spectate + '<span><br style="clear:both">');
    $('#activeduels').html($('.game').length);
    $('#activeduelist').html($('.playername').length + spectators - $('.playername:contains(SnarkyChild)').length);
    //$('#loginsinlast24').html(stats24);
}

function setfilter() {
    'use strict';
    renderList(gamelistcache);

}
var stats24 = 0,
    statsShut = 0,
    connected = 0;


function processDeckMessage(data) {
    if (data.clientEvent === 'deck') {
        if (data.command === 'get') {
            window.deckfiles = data.decklist;
            injectDeck(window.deckfiles);

        }
        if (data.command === 'save') {
            getAllDecks();
            window.alert('Deck Saved');
        }
        if (data.command === 'delete') {
            getAllDecks();
            window.alert('Deck Deleted');
        }
    }
}

function processStats(data) {
    stats24 = 0;
    statsShut = 0;
    connected = data.online;

    time = new Date().getTime();
    for (player in data.stats.logged) {
        statsShut++;
        if (time - data.stats[player] < 86400000) { //within the last 24hrs
            stats24++;
        }
    }
}
primus.on('data', function processIncomingPrimusMessage(data) {
    'use strict';
    var join = false,
        time,
        player;
    console.log(data);
    if (!data.clientEvent) {
        gamelistcache = JSON.parse(data);
        renderList(gamelistcache);
    } else {

        if (data.clientEvent === 'global' && loggedIn) {
            $('footer, #popupbody').html(data.message).addClass('loud');
            if (data.message && data.message.length) {
                //singlesitenav('popup'); /* turned off per Stormwolf;*/
            }

        }
        if (data.clientEvent === 'registrationRequest') {
            if ($('#ips_username').val() && $('#ips_password').val()) {
                primus.write({
                    action: 'register',
                    username: $('#ips_username').val(),
                    password: $('#ips_password').val(),
                    uniqueID: uniqueID
                });
            }
        }
        if (data.clientEvent === 'kill' && data.target === localStorage.nickname) {
            ygopro('kk');
        }
        if (data.clientEvent === 'genocide') {
            ygopro('kk');
        }
        if (data.clientEvent === 'duelrequest' && data.target === localStorage.nickname) {
            if (data.from === 'SnarkyChild') {
                enterGame(data.roompass);
                return;
            } else if (window.confirm('Accept Duel Request from ' + data.from + '?')) {
                enterGame(data.roompass);
            }

        }
        processDeckMessage(data);

        if (data.stats) {
            processStats(data);
        } else {
            console.log(data);
        }
    }
});
primus.on('connect', function () {
    'use strict';
    console.log('!!!!!! connect');
    try {
        _gaq.push(['_trackEvent', 'Launcher', 'Primus', 'Init']);
    } catch (e) {
        window.console.log('Error with Google Analytics');
    }
});
primus.on('close', function () {
    'use strict';
    console.log('!!!!!! close');
    try {
        _gaq.push(['_trackEvent', 'Launcher', 'Primus', 'Failure']);
    } catch (e) {
        window.console.log('Error with Google Analytics');
    }
});

function killgame(target) {
    'use strict';
    primus.write({
        action: 'killgame',
        username: $('#ips_username').val(),
        password: $('#ips_password').val(),
        killTarget: target,
        uniqueID: uniqueID
    });
}

function sendglobal(message) {
    'use strict';
    primus.write({
        action: 'global',
        username: $('#ips_username').val(),
        password: $('#ips_password').val(),
        message: message,
        uniqueID: uniqueID
    });
}

function murder(username) {
    'use strict';
    primus.write({
        action: 'murder',
        username: $('#ips_username').val(),
        password: $('#ips_password').val(),
        target: username,
        uniqueID: uniqueID
    });
}

$('body').on('mousedown', '.game', function (ev) {
    'use strict';
    if (admin === "1" && launcher && ev.which === 3) {
        var killpoint = $(ev.target).attr('data-killpoint'),
            gameID = $(ev.target).attr('data-roomid');
        if (killpoint === undefined) {
            return;
        }
        if (confirm('Kill game ' + killpoint + ' : ' + gameID)) {
            killgame(killpoint);
        }
    }
});

$('body').on('mousedown', 'footer', function (ev) {
    'use strict';
    if (admin === "1" && launcher && ev.which === 3) {
        if (confirm('Send Global?')) {
            sendglobal(window.prompt('Global Message', 'Be nice, or else...'));
        } else {
            if (confirm('Murder someone then?')) {
                murder(window.prompt('Username', ''));
            }
        }
    }
});