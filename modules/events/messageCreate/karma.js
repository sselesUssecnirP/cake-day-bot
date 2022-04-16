const { getFromDB, pushToDB } = require('../../../functions/basic/basic');
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
            

            if (config.blocked.some(i => i == msg.author.id)) return;
            let prefix = await client.config.get('config').prefix
            if (msg.content.toLowerCase().startsWith(prefix)) return;
            if (msg.author.bot) return;


            let uSave;

            if (!client.GuildSaves.has(msg.guild.id)) {
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

                client.GuildSaves.set(msg.guild.id, def);

                db.insert({ isGuild: true, data: def });
            }

            let gSave = await client.GuildSaves.get(msg.guild.id);


            if (gSave.exemptChannels.some(i => i == msg.channel.id)) return;
            if (!gSave.isKarma) return;

            if (client.UserSaves.has(msg.author.id)) {
                uSave = client.UserSaves.get(msg.author.id)
            } else {
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

            if (!uSave.guildCakeDays.some(v => v.guildId == msg.guild.id)) {
                uSave.guildCakeDays.push({guildId: msg.guild.id, guildCakeDay: msg.member.joinedAt, cakeDayMsg: false, karma: 0, negKarma: 0, posKarma: 0});
            }

            uSave.karmaAdd = { 
                karmaAdd: new Date(), 
                nextAdd: new Date().setMilliseconds(new Date().getMilliseconds += 8.64e+7)
            }
            
            let usersdb = await getFromDB({ design: 'saves', view: 'user' })
            usersdb = usersdb.rows.filter(f => f.key == msg.author.id)[0];
            let _rev = await db.get(usersdb.id)._rev
            pushToDB({ id: usersdb.id, rev: _rev, data: uSave });
            client.UserSaves.set(msg.author.id, uSave);
            client.manualEvents.get('karmaReactionAdd').run(client, msg);
        });
    }
}