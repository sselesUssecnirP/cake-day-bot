const { getFromDB, pushToDB } = require('../../../functions/funcs/database');
const secret = require('../../../saves/config/secret.json');
const db = require('nano')(secret.sql.url.replace(/{access}/,`${secret.sql.username}:${secret.sql.password}@`)).use('cake_day_bot');
const config = require('../../../saves/config/config.json');

module.exports = {
    // Name of the event
    name: "karma",
    // Description of the event
    description: "An event that runs on created messages.",
    // Should the event run instantly/constantly, or be called manually?
    isNormal: true,
    // The event's run function (what the event does)
    run: async (client) => {
        
        client.on('messageCreate', async msg => {

            let gSave;
            let uSave;

            if (!msg.inGuild()) return console.log(`Message is not a guild.`);

            if (config.blocked.some(i => i == msg.author.id)) return;
            let prefix = await client.config.get('config').prefix
            if (msg.content.toLowerCase().startsWith(prefix)) return;
            if (msg.author.bot) return;

            /*
            if (msg.channel.messages.fetch({ limit: 1 }).then(message => {
                message = message.first()
                if (!message) return false;
                if (msg.content.length < 85 && message.author.id == msg.author.id)
                    return true;
                else
                    return false;
            })) return;
            */

            let lastMsg = false;
            let msgInd = false;

            if ((await getFromDB({ design: 'saves', view: 'lastmsg'})).rows.filter(f => f.key == msg.guild.id)[0]) {
                lastMsg = (await getFromDB({ design: 'saves', view: 'lastmsg'})).rows.filter(f => f.key == msg.guild.id)[0].value;
            } else {

                lastMsg = {
                    guildId: msg.guild.id,
                    messages: []
                };

                await db.insert({ isLastMsg: true, data: lastMsg })
            };
            
            if (lastMsg.messages.filter(f => f.channelId == msg.channel.id)[0]) {
                if (lastMsg.messages.filter(f => f.channelId == msg.channel.id)[0].msg == msg.author.id)
                    if (msg.content.length < 150) return;
                    else {
                        let msgInd = lastMsg.messages.findIndex(f => f.channelId == msg.channel.id)
                        lastMsg.messages[msgInd].msg = msg.author.id
                    }
                else {
                    let msgInd = lastMsg.messages.findIndex(f => f.channelId == msg.channel.id)
                    lastMsg.messages[msgInd].msg = msg.author.id
                }
            } else {

                lastMsg.messages.push({
                    channelId: msg.channel.id,
                    msg: msg.author.id
                });
            };
            

            let lastmsgdb = (await getFromDB({ design: 'saves', view: 'lastmsg' })).rows.filter(f => f.key == msg.guild.id)[0];
            let _rev3 = (await db.get(lastmsgdb.id))._rev || false;
            await pushToDB({ _id: lastmsgdb.id, _rev: _rev3, data: lastMsg, isLastMsg: true });
            


            if ((await getFromDB({ design: 'saves', view: 'guild' })).rows.filter(f => f.key == msg.guild.id).length == 0) {
                console.log(`gSave not detected -- karma.js`)

                let def = {
                    name: msg.guild.name,
                    id: msg.guild.id,
                    owner: msg.guild.ownerId,
                    karmaRoles: [
                        {
                            milestone: 0,
                            role: "empty",
                            default: false
                        }
                    ],
                    exemptChannels: [],
                    isCakeDays: true,
                    isKarma: true
                }

                gSave = def;
                await db.insert({ isGuild: true, data: gSave });
            } else {
                console.log(`gSave detected! -- karma.js`)

                gSave = (await getFromDB({ design: 'saves', view: 'guild'})).rows.filter(f => f.key == msg.guild.id)[0].value

                //console.log(`${JSON.stringify(gSave, null, '\t')}`)
            }

            if ((await getFromDB({ design: 'saves', view: 'user'})).rows.filter(f => f.key == msg.author.id)[0]) {
                console.log(`uSave detected! -- karma.js`)

                uSave = (await getFromDB({ design: 'saves', view: 'user'})).rows.filter(f => f.key == msg.author.id)[0].value

                //console.log(`${JSON.stringify(uSave, null, '\t')}`)
            } else {
                console.log(`uSave not detected -- karma.js`)

                let newUSave = {
                    id: msg.author.id,
                    username: msg.author.username,
                    cakeDay: msg.author.createdAt,
                    cakeDayMsg: false,
                    guildCakeDays: [{guildId: msg.guild.id, guildCakeDay: msg.member.joinedAt, cakeDayMsg: false, karma: 0, negKarma: 0, posKarma: 0}],
                    karmaAdd: false,
                    karma: 0,
                    negKarma: 0,
                    posKarma: 0
                }

                uSave = newUSave;
                await db.insert({ isUser: true, data: uSave });
            }

            
            if (gSave.exemptChannels.length !== 0)
                if (gSave.exemptChannels.some(i => i == msg.channel.id)) return;
            if (!gSave.isKarma) return;

            if (!uSave.guildCakeDays.some(v => v.guildId == msg.guild.id)) {
                uSave.guildCakeDays.push({guildId: msg.guild.id, guildCakeDay: msg.member.joinedAt, cakeDayMsg: false, karma: 0, negKarma: 0, posKarma: 0});
            }

            uSave.karmaAdd = { 
                karmaAdd: new Date(), 
                nextAdd: new Date().setDate(new Date().getDate() + 1)
            }
            
            let usersdb = (await getFromDB({ design: 'saves', view: 'user' })).rows.filter(f => f.key == msg.author.id)[0];
            let _rev = (await db.get(usersdb.id))._rev || false;
            await pushToDB({ _id: usersdb.id, _rev: _rev, data: uSave, isUser: true });

            let guildsdb = (await getFromDB({ design: 'saves', view: 'guild' })).rows.filter(f => f.key == msg.guild.id)[0];
            let _rev2 = (await db.get(guildsdb.id))._rev || false;
            await pushToDB({ _id: guildsdb.id, _rev: _rev2, data: gSave, isGuild: true });

            client.manualEvents.get('karmaReactionAdd').run(client, msg);
        });
    }
}