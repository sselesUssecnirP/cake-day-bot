const { getFromDB, pushToDB } = require('../../../functions/basic/basic');
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

            if (!client.UserSaves.some(u => u.id == member.id)) {
                let hasSave = false;
            } else {
                let hasSave = true;
            }
            if (hasSave && !client.UserSaves.filter(u => u.id == member.id)[0].guildCakeDays.some(u => u.guildId == member.guild.id)) {
                let hasGCD = false;
            } else {
                let hasGCD = true;
            }

            if (hasSave) {
                let uSave = client.UserSaves.get(member.id)
            } else {
                let uSave = {
                    id: member.id,
                    username: member.user.username,
                    cakeDay: member.user.createdAt,
                    guildCakeDays: [],
                    karmaAdd: {},
                    karma: 0,
                    negKarma: 0,
                    posKarma: 0
                }
            }

            if (!hasGCD) {
                uSave.guildCakeDays.push({
                    guildId: member.guild.id,
                    guildCakeDay: member.joinedAt,
                    cakeDayMsg: false,
                    karma: 0,
                    negKarma: 0,
                    posKarma: 0
                })
            }

            let usersdb = await getFromDB({ design: 'saves', view: 'user' })
            usersdb = usersdb.rows.filter(f => f.key == msg.author.id)[0];
            let _rev = await db.get(usersdb.id)._rev
            pushToDB({ id: usersdb.id, rev: _rev, data: usersdb.value })
            client.UserSaves.set(msg.author.id, uSave);
        })
    }
}