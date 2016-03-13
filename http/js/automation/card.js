/*jslint bitwise: true, node:true, plusplus:true*/
/*global field*/

var enums = enums || require('../../libs/enums.js');

function makeCard(buffer, start, controller) {
    'use strict';
    if (buffer.length < 4) {
        return {
            card: {
                Code: 'nocard'
            },
            readposition: start
        };
    }
    var flag = buffer.readUInt32LE(start),
        card,
        readposition,
        i,
        ii,
        iii;

    if (!flag) {
        return {
            card: {
                Code: 'cover',
                Position: 'FaceDownAttack'
            },
            readposition: start + 9
        };
    }
    card = {
        Code: 'cover',
        Position: 'FaceDownAttack'
    };

    //console.log('flag:', flag);
    readposition = start + 4;

    if (flag & enums.query.Code) {
        card.Code = buffer.readUInt32LE(readposition);
        readposition = readposition + 4;
    }
    if (flag & enums.query.Position) {
        card.Controller = buffer[readposition];
        card.Position = enums.Positions[buffer[readposition + 3]];
        readposition = readposition + 4;
    }
    if (flag & enums.query.Alias) {
        card.Alias = buffer.readUInt32LE(readposition);
        readposition = readposition + 4;
    }
    if (flag & enums.query.Type) {
        card.Type = enums.cardTypes[buffer.readUInt32LE(readposition)];
        readposition = readposition + 4;
    }
    if (flag & enums.query.Level) {
        card.Level = buffer.readUInt32LE(readposition);
        readposition = readposition + 4;
    }
    if (flag & enums.query.Rank) {
        card.Rank = buffer.readUInt32LE(readposition);
        readposition = readposition + 4;
    }
    if (flag & enums.query.Attribute) {
        card.Attribute = enums.cardAttributes[buffer.readUInt32LE(readposition)];
        readposition = readposition + 4;
    }
    if (flag & enums.query.Race) {
        card.Race = enums.race[buffer.readUInt32LE(readposition)];
        readposition = readposition + 4;
    }
    if (flag & enums.query.Attack) {
        card.Attack = buffer.readUInt32LE(readposition);
        readposition = readposition + 4;
    }
    if (flag & enums.query.Defense) {
        card.Defense = buffer.readUInt32LE(readposition);
        readposition = readposition + 4;
    }
    if (flag & enums.query.BaseAttack) {
        card.Attribute = buffer.readUInt32LE(readposition);
        readposition = readposition + 4;
    }
    if (flag & enums.query.BaseDefense) {
        card.Attribute = buffer.readUInt32LE(readposition);
        readposition = readposition + 4;
    }
    if (flag & enums.query.Reason) {
        card.Attribute = buffer.readUInt16LE(readposition);
        readposition = readposition + 4;
    }
    if (flag & enums.query.ReasonCard) {
        card.Attribute = buffer.readUInt32LE(readposition);
        readposition = readposition + 4;
    }
    if (flag & enums.query.EquipCard) {
        card.EquipCard = {
            c: buffer[readposition],
            l: buffer[readposition + 1],
            s: buffer[readposition + 2]
        };
        readposition = readposition + 4;
    }
    if (flag & enums.query.TargetCard) {
        card.TargetCard = [];
        for (i = 0; i < buffer.readUInt32LE(readposition); ++i) {
            card.TargetCard.push({
                c: buffer[readposition],
                l: buffer[readposition + 1],
                s: buffer[readposition + 2]
            });
            readposition = readposition + 4;
        }
    }
    if (flag & enums.query.OverlayCard) {
        card.OverlayCard = [];
        for (ii = 0; ii < buffer.readUInt32LE(readposition); ++ii) {
            card.OverlayCard.push(buffer.readUInt32LE(readposition));
            readposition = readposition + 4;
        }
    }
    if (flag & enums.query.Counters) {
        card.Counters = [];
        for (iii = 0; iii < buffer.readUInt32LE(readposition); ++iii) {
            card.Counters.push({
                counterType: buffer.readUInt16LE(readposition),
                amount: buffer.readUInt16LE(readposition + 2)
            });
            readposition = readposition + 4;
        }
    }
    if (flag & enums.query.Owner) {
        card.EquipCard = buffer.readUInt32LE(readposition);
        readposition = readposition + 4;
    }
    if (flag & enums.query.IsDisabled) {
        card.EquipCard = buffer.readUInt32LE(readposition);
        readposition = readposition + 4;
    }
    if (flag & enums.query.IsPublic) {
        card.EquipCard = buffer.readUInt32LE(readposition);
        readposition = readposition + 4;
    }
    if (flag & enums.query.LScale) {
        card.lscale = buffer.readUInt32LE(readposition);
        readposition = readposition + 4;
    }
    if (flag & enums.query.RScale) {
        card.rscale = buffer.readUInt32LE(readposition);
        readposition = readposition + 4;
    }
    return {
        card: card,
        readposition: readposition
    };


}


function updateFieldCard(controller, location, data) {
    'use strict';
    var i,
        cards = [],
        requiredIterations = field[controller][location].length;
    for (i = 0; requiredIterations > i; i++) {

    }
}

function updateMassCards(player, clocation, buffer) {
    //console.log("Location:", enums.locations[clocation], clocation, player);
    //if (enums.locations[clocation] === 'EXTRA')return;
    'use strict';
    var field = cardCollections(player),
        output = [],
        readposition = 3,
        failed = false,
        count,
        i;
    //console.log(field);
    if (field[enums.locations[clocation]] !== undefined) {
        for (i = 0, count = field[enums.locations[clocation]]; count > i; i++) {
            try {
                var len = buffer.readUInt8(readposition);
                readposition = readposition + 4;
                if (len > 8) {
                    output.push(makeCard(buffer, readposition, player).card);
                    readposition = readposition + len - 4;

                } else {
                    output.push({
                        Code: 'nocard'
                    });
                }
            } catch (e) {
                console.log('overshot', e);
                failed = true;

            }
        }

        //console.log(output);


    }
    return output;
}
var module = module || {};
module.exports = makeCard;