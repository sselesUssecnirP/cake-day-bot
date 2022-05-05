const { getFromDB, pushToDB, getDB } = require('../../../functions/funcs/database');
const secret = require('../../../saves/config/secret.json');
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
            if (msg.content.toLowerCase().startsWith(config.prefix)) return;
            if (msg.author.bot) return;

            let lastMsg = false;
            let msgInd = false;
            
            if ((await getFromDB(secret.sql.database.views.lastMsg)).rows.filter(f => f.key == msg.guild.id)[0]) {
                lastMsg = (await getFromDB(secret.sql.database.views.lastMsg)).rows.filter(f => f.key == msg.guild.id)[0].value;
            } else {

                lastMsg = {
                    guildId: msg.guild.id,
                    messages: []
                };

                await pushToDB({ isLastMsg: true, data: lastMsg })
            };
            
            if (lastMsg.messages.filter(f => f.channelId == msg.channel.id)[0]) {
                if (lastMsg.messages.filter(f => f.channelId == msg.channel.id)[0].msg == msg.author.id) {
                    if (msg.content.length < 150) return;
                    else {
                        let msgInd = lastMsg.messages.findIndex(f => f.channelId == msg.channel.id);
                        lastMsg.messages[msgInd].msg = msg.author.id;
                    }
                }
                else {
                    let msgInd = lastMsg.messages.findIndex(f => f.channelId == msg.channel.id);
                    lastMsg.messages[msgInd].msg = msg.author.id;
                }
            } else {

                lastMsg.messages.push({
                    channelId: msg.channel.id,
                    msg: msg.author.id
                });
            };

            let lastmsgdb = (await getFromDB(secret.sql.database.views.lastMsg)).rows.filter(f => f.key == msg.guild.id)[0];
            let _rev3 = (await getDB(lastmsgdb.id))._rev || false;
            await pushToDB({ _id: lastmsgdb.id, _rev: _rev3, data: lastMsg, isLastMsg: true });

            if ((await getFromDB(secret.sql.database.views.guilds)).rows.filter(f => f.key == msg.guild.id).length == 0) {
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
                await pushToDB({ isGuild: true, data: gSave });
            } else {
                console.log(`gSave detected! -- karma.js`)

                gSave = (await getFromDB(secret.sql.database.views.guilds)).rows.filter(f => f.key == msg.guild.id)[0].value

                //console.log(`${JSON.stringify(gSave, null, '\t')}`)
            }

            if ((await getFromDB(secret.sql.database.views.users)).rows.filter(f => f.key == msg.author.id)[0]) {
                console.log(`uSave detected! -- karma.js`)

                uSave = (await getFromDB(secret.sql.database.views.users)).rows.filter(f => f.key == msg.author.id)[0].value

                //console.log(`${JSON.stringify(uSave, null, '\t')}`)
            } else {
                console.log(`uSave not detected -- karma.js`)

                let newUSave = {
                    id: msg.author.id,
                    username: msg.author.username,
                    cakeDay: msg.author.createdAt,
                    cakeDayMsg: false,
                    guildCakeDays: [{guildId: msg.guild.id, guildCakeDay: msg.member.joinedAt, cakeDayMsg: false, karma: 0, negKarma: 0, posKarma: 0}],
                    karma: 0,
                    negKarma: 0,
                    posKarma: 0
                }

                uSave = newUSave;
                await pushToDB({ isUser: true, data: uSave });
            }

            
            if (gSave.exemptChannels.length !== 0)
                if (gSave.exemptChannels.some(i => i == msg.channel.id)) return;
            if (!gSave.isKarma) return;

            if (!uSave.guildCakeDays.some(v => v.guildId == msg.guild.id)) {
                uSave.guildCakeDays.push({guildId: msg.guild.id, guildCakeDay: msg.member.joinedAt, cakeDayMsg: false, karma: 0, negKarma: 0, posKarma: 0});
            }

            if (uSave.karmaAdd) {
                delete uSave.karmaAdd;
            }

            let mSave = {
                msgId: msg.id,
                deleteDate: new Date().setDate(new Date().getDate() + 1)
            }
            
            let usersdb = (await getFromDB(secret.sql.database.views.users)).rows.filter(f => f.key == msg.author.id)[0];
            let _rev = (await getDB(usersdb.id))._rev || false;
            await pushToDB({ _id: usersdb.id, _rev: _rev, isUser: true, data: uSave });

            let guildsdb = (await getFromDB(secret.sql.database.views.guilds)).rows.filter(f => f.key == msg.guild.id)[0];
            let _rev2 = (await getDB(guildsdb.id))._rev || false;
            await pushToDB({ _id: guildsdb.id, _rev: _rev2, isGuild: true, data: gSave });

            await pushToDB({ isReactionMsg: true, data: mSave });

            msg.react(config.botEmojis.upvotes[0])
            msg.react(config.botEmojis.upvotes[1])
        });
    }
}