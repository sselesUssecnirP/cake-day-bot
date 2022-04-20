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

            if ((await getFromDB({ design: 'saves', view: 'guild' })).rows.filter(f => f.key == msg.guild.id).length == 0) {
                console.log(`gSave not detected! -- karma.js`)

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

                db.insert({ isGuild: true, data: def });

                gSave = def;
            } else {
                //console.log(`gSave detected! -- karma.js`)

                gSave = (await getFromDB({ design: 'saves', view: 'guild'})).rows.filter(f => f.key == msg.guild.id)[0].value

                //console.log(`${JSON.stringify(gSave, null, '\t')}`)
            }

            if ((await getFromDB({ design: 'saves', view: 'user'})).rows.filter(f => f.key == msg.author.id).length >= 1) {
                //console.log(`uSave detected! -- karma.js`)

                uSave = (await getFromDB({ design: 'saves', view: 'user'})).rows.filter(f => f.key == msg.author.id)[0].value

                //console.log(`${JSON.stringify(uSave, null, '\t')}`)
            } else {
                console.log(`uSave not detected! -- karma.js`)

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

                db.insert({ isUser: true, data: newUSave });

                uSave = newUSave;
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