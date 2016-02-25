/*jslint browser:true, plusplus:true, bitwise : true*/
/*globals WebSocket, Buffer, enums, makeCard, BufferStreamReader, EventEmitter*/
// buffer.js
// card.js

function Framemaker() {
    "use strict";
    var memory = new Buffer([]);

    this.input = function (buffer) {
        var x = true,
            output = [],
            recordOfBuffer,
            frame_length;
        //console.log('before', memory.length, 'bytes in memory');
        memory = Buffer.concat([memory, buffer]);
        //console.log('concated', memory.length);
        while (x === true && memory.length > 2) {
            frame_length = memory.readUInt16LE(0);
            //console.log('read', frame_length, '(+2) of', memory.length, 'bytes');
            if ((memory.length - 2) < frame_length) {
                //console.log('not enough');
                x = false;
            } else {
                recordOfBuffer = memory.slice(2).toJSON();
                output.push(recordOfBuffer);
                if (memory.length === (frame_length + 2)) {
                    memory = new Buffer([]);
                    x = false;
                } else {
                    memory = memory.slice((frame_length + 2));
                }
                //console.log('after', memory.length);
            }
        }
        //console.log('----',output);
        return output;
    };
    return this;
}

function BufferStreamReader(packet) {
    'use strict';
    /* FH, Buttys, and Tenkei have very annoying code to replicate
    in JavaScript of and around the reading of streammed network
    buffers, this should make it easier. */
    var readposition = 0;
    this.packet = packet; // maybe this should be read only.
    this.readposition = function () {
        return readposition;
    };
    this.setReadposition = function (value) {
        readposition = Number(value);
        return readposition;
    };
    this.ReadInt8 = function () {
        // read 1 byte
        var output = packet[readposition];
        readposition++;
        return output;
    };
    this.ReadUInt8 = this.ReadInt8;
    this.ReadInt16 = function () {
        var output = packet.readUInt16LE(readposition);
        readposition += 2;
        return output;
    };
    this.ReadInt32 = function () {
        var output = packet.readUInt32LE(readposition);
        readposition += 4;
        return output;
    };
    return this;
    // I should later comeback and make this completely array based.
}

function recieveSTOC(packet) {
    // OK!!!! HARD PART!!!!
    // recieve.js should have create obejects with all the parameters as properites, then emit them.
    // its done here because we might need to pass in STATE to the functions also.
    // again if you are fiddling with a state/gui you are doing it wrong!!!
    // data decode and command execution are different conserns.
    'use strict';
    var task = {},
        //makeCard = require('../http/js/card.js'),
        command,
        bitreader = 0,
        iter = 0,
        errorCode,
        i = 0,
        BufferIO = new BufferStreamReader(packet.message);

    task.command = packet.STOC;
    task.packet = packet;

    switch (task.command) {
    case ("STOC_UNKNOWN"):
        break;

    case ("STOC_GAME_MSG"):
        command = enums.STOC.STOC_GAME_MSG[BufferIO.ReadInt8()];
        task.command = command;
        bitreader++;
        switch (command) {
        case ('MSG_RETRY'):
            break;

        case ('MSG_START'):
            task.playertype = BufferIO.ReadInt8();
            task.lifepoints1 = BufferIO.ReadInt32();
            task.lifepoints2 = BufferIO.ReadInt32();
            task.player1decksize = BufferIO.ReadInt16();
            task.player1extrasize = BufferIO.ReadInt16();
            task.player2decksize = BufferIO.ReadInt16();
            task.player2extrasize = BufferIO.ReadInt16();
            break;

        case ('MSG_HINT'):
            task.command = enums.STOC.STOC_GAME_MSG.MSG_HINT[BufferIO.ReadInt8()];
            task.player = BufferIO.ReadInt8(); /* defunct in the code */
            task.data = BufferIO.ReadInt32();
            task.hintforce = BufferIO.ReadInt8();

            switch (task.command) {
            case 'HINT_EVENT':
                //myswprintf(event_string, L"%ls", dataManager.GetDesc(data));
                //this is a rabbit hole, the hint system takes bytes and uses that to 
                //calculate (hurr, god why) the string that should be used from strings.conf
                // like a direct reference would be hard....
                break;
            case 'HINT_MESSAGE':
                //display task.data after processing it against the DB.
                break;
            case 'HINT_SELECTMSG':
                task.select_hint = task.data;
                break;

            case 'HINT_OPSELECTED':
                break;
            case 'HINT_EFFECT':
                task.showcardcode = task.data;
                task.showcarddif = 0;
                task.showcard = 1;
                break;
            }

            break;

        case ('MSG_NEW_TURN'):
            task.player = BufferIO.ReadInt8();
            break;

        case ('MSG_WIN'):
            task.win = BufferIO.ReadInt8();
            //need to double check for more variables
            break;

        case ('MSG_NEW_PHASE'):
            task.phase = BufferIO.ReadInt8();
            break;

        case ('MSG_DRAW'):
            task.player = BufferIO.ReadInt8();
            task.count = BufferIO.ReadInt8();
            task.cardslist = [];
            for (i = 0; i < task.count; ++i) {
                task.cardslist.push({
                    code: BufferIO.ReadInt32()
                });
            }
            break;

        case ('MSG_SHUFFLE_DECK'):
            task.player = BufferIO.ReadInt8();
            break;

        case ('MSG_SHUFFLE_HAND'):
            task.player = BufferIO.ReadInt8();
            task.count = BufferIO.ReadInt8();
            //for some number that cant be determined here because the count was not sent (getting it from the state like an idiot)
            // readint32 off.
            break;

        case ('MSG_CHAINING'):
            task.code = BufferIO.ReadInt32();
            task.pcc = BufferIO.ReadInt8();
            task.pcl = BufferIO.ReadInt8();
            task.pcs = BufferIO.ReadInt8();
            task.subs = BufferIO.ReadInt8();
            task.cc = BufferIO.ReadInt8();
            task.cl = BufferIO.ReadInt8();
            task.cs = BufferIO.ReadInt8();
            task.desc = BufferIO.ReadInt32();
            task.ct = BufferIO.ReadInt8(); // defunct in code
            break;
        case ('MSG_CHAINED'):
            task.ct = BufferIO.ReadInt8();
            break;

        case ('MSG_CHAIN_SOLVING'):
            task.ct = BufferIO.ReadInt8();
            break;

        case ('MSG_CHAIN_SOLVED'):
            task.ct = BufferIO.ReadInt8(); // defunct in the code
            break;

        case ('MSG_CHAIN_END'):
            // remove any liggering chain parts with a graphical command
            break;

        case ('MSG_CHAIN_NEGATED'):
            task.ct = BufferIO.ReadInt8();
            break; //graphical and trigger only for replay

        case ('MSG_CHAIN_DISABLED'):
            task.ct = BufferIO.ReadInt8();
            break; //graphical and trigger only for replay

        case ('MSG_CARD_SELECTED'):
            task.player = BufferIO.ReadInt8();
            task.count = BufferIO.ReadInt8();
            break;
        case ('MSG_RANDOM_SELECTED'):
            task.player = BufferIO.ReadInt8();
            task.count = BufferIO.ReadInt8();
            task.selections = [];
            for (i = 0; i < task.count; ++i) {
                task.selections.push({
                    c: BufferIO.ReadInt8(),
                    l: BufferIO.ReadInt8(),
                    s: BufferIO.ReadInt8(),
                    ss: BufferIO.ReadInt8()
                });
            }
            break;
        case ('MSG_BECOME_TARGET'):
            task.count = BufferIO.ReadInt8();
            task.selections = [];
            for (i = 0; i < task.count; ++i) {
                task.selections.push({
                    c: BufferIO.ReadInt8(),
                    l: BufferIO.ReadInt8(),
                    s: BufferIO.ReadInt8(),
                    ss: BufferIO.ReadInt8() // defunct in code
                });
            }
            break;

        case ('MSG_PAY_LPCOST'):
            task.player = BufferIO.ReadInt8();
            task.lp = BufferIO.ReadInt32();
            task.multiplier = -1;
            break;

        case ('MSG_DAMAGE'):
            task.player = BufferIO.ReadInt8();
            task.lp = BufferIO.ReadInt32();
            task.multiplier = -1;
            break;

        case ('MSG_RECOVER'):
            task.player = BufferIO.ReadInt8();
            task.lp = BufferIO.ReadInt32();
            task.multiplier = 1;
            break;
        case ('MSG_LPUPDATE'):
            task.player = BufferIO.ReadInt8();
            task.lp = BufferIO.ReadInt32();
            task.multiplier = 1;
            break;

        case ('MSG_SUMMONING '):
            task.player = BufferIO.ReadInt8();
            task.code = BufferIO.ReadInt32();
            task.cc = BufferIO.ReadInt8(); //defunct in code
            task.cl = BufferIO.ReadInt8(); //defunct in code
            task.cs = BufferIO.ReadInt8(); //defunct in code
            task.cp = BufferIO.ReadInt8(); //defunct in code
            break;

        case ('MSG_EQUIP'):
            task.c1 = BufferIO.ReadInt8();
            task.l1 = BufferIO.ReadInt8();
            task.s1 = BufferIO.ReadInt8();
            BufferIO.ReadInt8(); //padding wtf
            task.c2 = BufferIO.ReadInt8();
            task.l2 = BufferIO.ReadInt8();
            task.s2 = BufferIO.ReadInt8();
            BufferIO.ReadInt8(); //padding wtf
            break;

        case ('MSG_UNEQUIP'):
            task.c1 = BufferIO.ReadInt8();
            task.l1 = BufferIO.ReadInt8();
            task.s1 = BufferIO.ReadInt8();
            BufferIO.ReadInt8(); //padding wtf
            task.c1 = BufferIO.ReadInt8();
            task.l1 = BufferIO.ReadInt8();
            task.s1 = BufferIO.ReadInt8();
            BufferIO.ReadInt8(); //padding wtf
            break;

        case ('MSG_CANCEL_TARGET'):
            task.c1 = BufferIO.ReadInt8();
            task.l1 = BufferIO.ReadInt8();
            task.s1 = BufferIO.ReadInt8();
            BufferIO.ReadInt8(); //padding wtf
            task.c2 = BufferIO.ReadInt8();
            task.l2 = BufferIO.ReadInt8();
            task.s2 = BufferIO.ReadInt8();
            BufferIO.ReadInt8(); //padding wtf
            break;

        case ('MSG_ADD_COUNTER'):
            task.type = BufferIO.ReadInt16();
            task.c = BufferIO.ReadInt8();
            task.l = BufferIO.ReadInt8();
            task.s = BufferIO.ReadInt8();
            task.count = BufferIO.ReadInt8();
            break;

        case ('MSG_REMOVE_COUNTER'):
            task.type = BufferIO.ReadInt16();
            task.c = BufferIO.ReadInt8();
            task.l = BufferIO.ReadInt8();
            task.s = BufferIO.ReadInt8();
            task.count = BufferIO.ReadInt8();
            break;

        case ('MSG_ATTACK'):
            task.ca = BufferIO.ReadInt8();
            task.la = BufferIO.ReadInt8();
            task.sa = BufferIO.ReadInt8();
            BufferIO.ReadInt8();
            task.cd = BufferIO.ReadInt8();
            task.ld = BufferIO.ReadInt8();
            task.sd = BufferIO.ReadInt8();
            BufferIO.ReadInt8();
            break;
        case ('MSG_BATTLE'):
            task.ca = BufferIO.ReadInt8();
            task.la = BufferIO.ReadInt8();
            task.sa = BufferIO.ReadInt8();
            BufferIO.ReadInt8(); // padding
            task.aatk = BufferIO.ReadInt32();
            task.adef = BufferIO.ReadInt32();
            task.da = BufferIO.ReadInt8(); //defunct
            task.cd = BufferIO.ReadInt8();
            task.ld = BufferIO.ReadInt8();
            task.sd = BufferIO.ReadInt8();
            BufferIO.ReadInt8(); //padding
            task.datk = BufferIO.ReadInt32();
            task.ddef = BufferIO.ReadInt32();
            task.dd = BufferIO.ReadInt8(); //defunct
            break;

        case ('MSG_ATTACK_DISABLED'):
            //myswprintf(event_string, dataManager.GetSysString(1621), dataManager.GetName(mainGame->dField.attacker->code));
            break;

        case ('MSG_DAMAGE_STEP_START'):
            //no code, just a trigger
            break;

        case ('MSG_DAMAGE_STEP_END'):
            //no code just a trigger
            break;
        case ('MSG_MISSED_EFFECT'):
            BufferIO.ReadInt8(); //padding
            task.code = BufferIO.ReadInt32();
            break;
        case ('MSG_TOSS_COIN'):
            //ugh....new BufferIO stuff. Does it take all this to flip a coin?
            break;
        case ('MSG_SELECT_IDLECMD'):
            task.command = 'MSG_SELECT_IDLECMD';
            //https://github.com/Fluorohydride/ygopro/blob/d9450dbb35676db3d5b7c2a5241a54d7f2c21e98/ocgcore/playerop.cpp#L69
            task.idleplayer = BufferIO.ReadInt8();
            task.summonable_cards = [];
            task.spsummonable_cards = [];
            task.repositionable_cards = [];
            task.msetable_cards = [];
            task.ssetable_cards = [];
            task.select_chains = [];
            task.select_chains = [];
            task.count = BufferIO.ReadInt8();
            for (i = 0; i < task.count; ++i) {
                task.summonable_cards.push({
                    code: BufferIO.ReadInt32(),
                    controller: BufferIO.ReadInt8(),
                    location: BufferIO.ReadInt8(),
                    sequence: BufferIO.ReadInt8()
                });
            }
            task.count = BufferIO.ReadInt8();
            for (i = 0; i < task.count; ++i) {
                task.spsummonable_cards.push({
                    code: BufferIO.ReadInt32(),
                    controller: BufferIO.ReadInt8(),
                    location: BufferIO.ReadInt8(),
                    sequence: BufferIO.ReadInt8()
                });
            }

            task.count = BufferIO.ReadInt8();

            for (i = 0; i < task.count; ++i) {
                task.repositionable_cards.push({
                    code: BufferIO.ReadInt32(),
                    controller: BufferIO.ReadInt8(),
                    location: BufferIO.ReadInt8(),
                    sequence: BufferIO.ReadInt8()
                });

            }
            task.count = BufferIO.ReadInt8();

            for (i = 0; i < task.count; ++i) {
                task.msetable_cards.push({
                    code: BufferIO.ReadInt32(),
                    controller: BufferIO.ReadInt8(),
                    location: BufferIO.ReadInt8(),
                    sequence: BufferIO.ReadInt8()
                });

            }
            task.count = BufferIO.ReadInt8();

            for (i = 0; i < task.count; ++i) {
                task.select_chains.push({
                    code: BufferIO.ReadInt32(),
                    controller: BufferIO.ReadInt8(),
                    location: BufferIO.ReadInt8(),
                    sequence: BufferIO.ReadInt8()
                });

            }
            task.count = BufferIO.ReadInt8();

            for (i = 0; i < task.count; ++i) {
                task.ssetable_cards.push({
                    code: BufferIO.ReadInt32(),
                    controller: BufferIO.ReadInt8(),
                    location: BufferIO.ReadInt8(),
                    sequence: BufferIO.ReadInt8()
                });

            }

            task.count = BufferIO.ReadInt8();
            for (i = 0; i < task.count; ++i) {
                task.select_chains.push({
                    code: BufferIO.ReadInt32(),
                    controller: BufferIO.ReadInt8(),
                    location: BufferIO.ReadInt8(),
                    sequence: BufferIO.ReadInt8()
                });

            }
            task.bp = BufferIO.ReadInt8();
            task.ep = BufferIO.ReadInt8();
            task.shufflecount = BufferIO.ReadInt8();
            break;

        case ('MSG_MOVE'):
            task.code = BufferIO.ReadInt32();
            task.pc = BufferIO.ReadInt8(); // original controller
            task.pl = BufferIO.ReadInt8(); // original cLocation
            task.ps = BufferIO.ReadInt8(); // original sequence (index)
            task.pp = BufferIO.ReadInt8(); // padding??
            task.cc = BufferIO.ReadInt8(); // current controller
            task.cl = BufferIO.ReadInt8(); // current cLocation
            task.cs = BufferIO.ReadInt8(); // current sequence (index)
            task.cp = BufferIO.ReadInt8(); // current position
            task.reason = BufferIO.ReadInt32(); //debug data??
            break;

        case ('MSG_POS_CHANGE'):
            task.code = BufferIO.ReadInt32();
            task.cc = BufferIO.ReadInt8(); // current controller
            task.cl = BufferIO.ReadInt8(); // current cLocation
            task.cs = BufferIO.ReadInt8(); // current sequence (index)
            task.pp = BufferIO.ReadInt8(); // padding??
            task.cp = BufferIO.ReadInt8(); // current position
            break;

        case ('MSG_SET'):
            //check for variables
            break;

        case ('MSG_SWAP'):
            task.code1 = BufferIO.ReadInt8(); // defunct in the code
            task.c1 = BufferIO.ReadInt8();
            task.l1 = BufferIO.ReadInt8();
            task.s1 = BufferIO.ReadInt8();
            task.p1 = BufferIO.ReadInt8(); //defunct in the code
            task.code2 = BufferIO.ReadInt8(); //defunct in the code
            task.c2 = BufferIO.ReadInt8();
            task.l2 = BufferIO.ReadInt8();
            task.s2 = BufferIO.ReadInt8();
            task.p2 = BufferIO.ReadInt8(); //defunct in the code
            break;

        case ('MSG_FIELD_DISABLED'):
            task.disabled = BufferIO.ReadInt8();
            task.ifisfirst_disabled = (task.disabled >> 16) | (task.disabled << 16);
            break;
        case ('MSG_SUMMONING'):
            task.code = BufferIO.ReadInt32();
            //check for variables
            break;

        case ('MSG_SPSUMMONING'):
            task.code = BufferIO.ReadInt32();
            task.cc = BufferIO.ReadInt8();
            task.cl = BufferIO.ReadInt8();
            task.cs = BufferIO.ReadInt8();
            task.cp = BufferIO.ReadInt8();
            break;

        case ('MSG_SUMMONED'):
            //myswprintf(event_string, dataManager.GetSysString(1604));
            //graphical only
            break;

        case ('MSG_SPSUMMONED'):
            //myswprintf(event_string, dataManager.GetSysString(1606));
            //graphical only
            break;

        case ('MSG_FLIPSUMMONED'):
            //myswprintf(event_string, dataManager.GetSysString(1608));
            //graphical only
            break;
        case ('MSG_FLIPSUMMONING'):
            // notice pp is missing, and everything is upshifted; not repeating code.
            task.code = BufferIO.ReadInt32();
            task.cc = BufferIO.ReadInt8(); // current controller
            task.cl = BufferIO.ReadInt8(); // current cLocation
            task.cs = BufferIO.ReadInt8(); // current sequence (index)
            task.cp = BufferIO.ReadInt8(); // current position
            break;

        case ('MSG_REQUEST_DECK'):

            break;
        case ('MSG_SELECT_BATTLECMD'):
            task.selecting_player = BufferIO.ReadInt8(); // defunct in the code, just reading ahead.
            task.count = BufferIO.ReadInt8();
            task.cardsThatCanBattle = [];
            for (i = 0; i < task.count; ++i) {
                task.cardsThatCanBattle.push({
                    con: BufferIO.ReadInt8(),
                    loc: BufferIO.ReadInt8(),
                    seq: BufferIO.ReadInt8(),
                    desc: BufferIO.ReadInt32()
                });
                // client looks at the field, gets a cmdflag, does bytemath on it to see if it can activate.
                // if it can do the can activate animations.

            }
            task.cardsThatAreAttackable = [];
            task.count = BufferIO.ReadInt8();
            for (i = 0; i < task.count; ++i) {
                task.cardsThatAreAttackable.push({
                    code: BufferIO.ReadInt32(),
                    con: BufferIO.ReadInt8(),
                    loc: BufferIO.ReadInt8(),
                    seq: BufferIO.ReadInt8(),
                    diratt: BufferIO.ReadInt32() // defuct in code
                });
            }
            break;
        case ('MSG_SELECT_EFFECTYN'):

            break;

        case ('MSG_SELECT_YESNO'):

            break;
        case ('MSG_SELECT_OPTION'):

            break;
        case ('MSG_SELECT_CARD'):

            break;
        case ('MSG_SELECT_CHAIN'):

            break;
        case ('MSG_SELECT_PLACE'):

            break;
        case ('MSG_SELECT_POSITION'):

            break;
        case ('MSG_SELECT_TRIBUTE'):

            break;

        case ('MSG_SORT_CHAIN'):

            break;
        case ('MSG_SELECT_COUNTER'):

            break;
        case ('MSG_SELECT_SUM'):

            break;
        case ('MSG_SELECT_DISFIELD'):

            break;
        case ('MSG_SORT_CARD'):

            break;
        case ('MSG_CONFIRM_DECKTOP'):

            break;
        case ('MSG_CONFIRM_CARDS'):
            task.player = BufferIO.ReadInt8(); /* defunct in code */
            task.count = BufferIO.ReadInt8();
            task.c = undefined;
            task.l = undefined;
            task.s = undefined;
            for (i = 0; i < task.count; ++i) {
                /*sigh this goes into something extremely complex and that overwrites itself*/
            }
            break;


        case ('MSG_UPDATE_DATA'):
            task.player = BufferIO.ReadInt8();
            task.fieldlocation = BufferIO.ReadInt8();
            task.fieldmodel = enums.locations[task.fieldlocation];
            task.message = packet.message;
            task.cards = updateMassCards(task.player, task.fieldlocation, packet.message);
            //mainGame->dField.UpdateFieldCard(player, location, pbuf);
            // ^ problem.
            break;

        case ('MSG_UPDATE_CARD'):
            task.player = BufferIO.ReadInt8();
            task.fieldlocation = BufferIO.ReadInt8();
            task.index = BufferIO.ReadInt8();
            task.card = makeCard(packet.message, 8, task.udplayer).card;
            task.fieldmodel = enums.locations[task.fieldlocation];
            break;

        case ('MSG_WAITING'):
            //mainGame->stHintMsg->setText(dataManager.GetSysString(1390));
            break;
        case ('MSG_SWAP_GRAVE_DECK'):
            task.player = BufferIO.ReadInt8();
            break;

        case ('MSG_REVERSE_DECK'):
            //all graphical from what I can tell.
            break;
        case ('MSG_DECK_TOP'):
            task.player = BufferIO.ReadInt8();
            task.seq = BufferIO.ReadInt8();
            task.code = BufferIO.ReadInt32();
            task.rev = ((task.code & 0x80000000) !== 0);
            break;

        default:
            //console.log('bad', command, packet, task);
            break;
        }
        return task;



    case ("STOC_ERROR_MSG"):
        command = enums.STOC.STOC_ERROR_MSG[BufferIO.ReadInt8()];
        task.command = command;
        // set the screen back to the join screen.
        switch (command) {

        case ('ERRMSG_JOINERROR'):
            break;
        case ('ERRMSG_DECKERROR'):
            task.errorCode = packet.message[1];
            task.cardID = packet.message.readUInt32LE(1);
            // complain about deck error. Invalid Deck.
            task.error = (task.errorCode === 1) ? 'Invalid Deck' : 'Invalid Card, ' + task.cardID; // 
            break;

        case ('ERRMSG_SIDEERROR'):
            // complain about side deck error.
            break;
        case ('ERRMSG_VERERROR'):
            //wierd math to get the version number, displays and complains about it then resets.
            break;
        default:
        }

        break;

    case ("STOC_SELECT_HAND"):
        //visual only trigger
        break;

    case ("STOC_SELECT_TP"):
        //prompt turn player trigger
        break;

    case ("STOC_HAND_RESULT"):
        task.showcardcode = (packet.message[0] - 1) + ((packet.message[1] - 1) << 16);
        task.showcarddif = 50;
        task.showcardp = 0;
        task.showcard = 100;
        task.res1 = packet.message[0];
        task.res2 = packet.message[1];
        break;

    case ("STOC_TP_RESULT"):
        break;
        //Literally exact code in duelist.cpp for STOC_TP_RESULT

    case ("STOC_CHANGE_SIDE"):
        //display the deck builder
        break;

    case ("STOC_WAITING_SIDE"):
        // graphical reset
        break;

    case ("STOC_CREATE_GAME"):
        break;

    case ("STOC_JOIN_GAME"):
        console.log(packet.message);
        task.banlistHashCode = packet.message.readUInt16LE(0);
        task.rule = packet.message[4];
        task.mode = packet.message[5];
        task.prio = packet.message[8];
        task.deckcheck = packet.message[7];
        task.noshuffle = packet.message[8];
        task.startLP = packet.message.readUInt16LE(12);
        task.starthand = packet.message[16];
        task.drawcount = packet.message[17];
        task.timelimit = packet.message.readUInt16LE(18);
        task.message = packet.message;
        break;
    case ("STOC_TYPE_CHANGE"):
        task.typec = packet.message[0];
        task.pos = task.typec & 0xF;
        task.ishost = ((task.typec >> 4) & 0xF) !== 0;
        break;

    case ("STOC_LEAVE_GAME"):
        break;

    case ("STOC_DUEL_START"):
        //trigger to start duel, nothing more.
        break;

    case ("STOC_DUEL_END"):
        //trigger to close the duel, nothing more.
        break;

    case ("STOC_REPLAY"):
        break;

    case ("STOC_TIME_LIMIT"):
        task.player = packet.message[0];
        task.time = packet.message[1] + packet.message[2];
        break;

    case ("STOC_CHAT"):
        task.from = packet.message[0] + packet.message[1];
        task.chat = packet.message.toString('utf16le', 2).replace(/\0/g, '');
        task.len = task.chat.length;
        break;

    case ("STOC_HS_PLAYER_ENTER"):
        task.person = packet.message.toString('utf16le', 0, 39).replace(/\0/g, '');
        task.messagelen = task.person.length;
        task.person = task.person.replace("\u0000", "");
        break;

    case ("STOC_HS_PLAYER_CHANGE"):
        task.change = packet.message[0];
        task.changepos = (task.change >> 4) & 0xF;
        task.state = task.change & 0xF;
        task.stateText = enums.lobbyStates[task.state];

        break;

    case ("STOC_HS_WATCH_CHANGE"):
        task.spectators = packet.message[0];
        break;

    }
    return task;
}


function CommandParser() {
    'use strict';
    var output = {};
    output = new EventEmitter();
    output.input = function (input) {
        output.emit(input.command, input);
    };
    return output;
}