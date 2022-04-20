const { getFromDB, pushToDB } = require('../../../functions/funcs/database');
const secret = require('../../../saves/config/secret.json');
const db = require('nano')(secret.sql.url.replace(/{access}/,`${secret.sql.username}:${secret.sql.password}@`)).use('cake_day_bot');

module.exports = {
    // Name of the event
    name: "memberAdd",
    // Description of the event
    description: "Runs an event on guildMemberAdd listener",
    // Should the event run instantly/constantly, or be called manually?
    isNormal: true,
    // The event's run function (what the event does)
    run: async (client) => {
        
        client.on('guildMemberAdd', async (member) => {
            


            if (!(await getFromDB({ design: 'saves', view: 'user' })).rows.some(u => u.key == member.id)) {
                let hasSave = false;
            } else {
                let hasSave = true;
            }

            if (hasSave) {
                let uSave = (await getFromDB({ design: 'saves', view: 'user' })).rows.filter(f => f.key == member.id)[0].value
            } else {
                let uSave = {
                    id: member.id,
                    username: member.user.username,
                    cakeDay: member.user.createdAt,
                    guildCakeDays: [
                        {
                            guildId: member.guild.id,
                            guildCakeDay: member.joinedAt,
                            cakeDayMsg: false,
                            karma: 0,
                            negKarma: 0,
                            posKarma: 0
                        }
                    ],
                    karmaAdd: false,
                    karma: 0,
                    negKarma: 0,
                    posKarma: 0
                }
            }

            if (!uSave.guildCakeDays.some(u => u.guildId == member.guild.id)) {
                let hasGCD = false;
            } else {
                let hasGCD = true;
            }

            if (!hasGCD) {
                uSave.guildCakeDays.push({
                    guildId: member.guild.id,
                    guildCakeDay: member.joinedAt,
                    cakeDayMsg: false,
                    karma: 0,
                    negKarma: 0,
                    posKarma: 0
                });
            }

            let usersdb = await getFromDB({ design: 'saves', view: 'user' })
            usersdb = usersdb.rows.filter(f => f.key == msg.author.id)[0];
            let _rev = await db.get(usersdb.id)._rev || false
            await pushToDB({ _id: usersdb.id, _rev: _rev, data: uSave, isUser: true })
        })
    }
}