const { formatDate, formatDateTime, getFromDB, pushToDB } = require('../../../functions/basic/basic');
const secret = require('../../../saves/config/secret.json');
const db = require('nano')(secret.sql.url.replace(/{access}/,`${secret.sql.username}:${secret.sql.password}@`)).use('cake_day_bot');
const config = require('../../../saves/config/config.json')

module.exports = {
    // Name of the event
    name: "cakeDayCheck",
    // Description of the event
    description: "An event checking cake days on several different events.",
    // Should the event run instantly/constantly, or be called manually?
    isNormal: true,
    // The event's run function (what the event does)
    run: async (client) => {
    
        client.on('messageCreate', async msg => {

            if (!client.GuildSaves.some(g => g.id == msg.guild.id)) return;
            if (!client.UserSaves.some(u => u.guildCakeDays.some(uGCD => uGCD.id == msg.guild.id))) return;
            if (config.blocked.some(i => i == msg.author.id)) return;
            if (msg.author.bot) return;

            let uSave = client.UserSaves.get(msg.author.id);
            let gSave = client.GuildSaves.get(msg.guild.id);

            if (gSave.exemptChannels.some(i => i == msg.channel.id)) return;

            let curDate = formatDate()
            curDate = curDate.split(/\//g)
            curDate.pop()
            curDate = curDate.join('/')
            let cakeDay = formatDate(Date.parse(uSave.cakeDay));
            cakeDay = cakeDay.split(/\//g)
            cakeDay.pop()
            cakeDay = cakeDay.join('/')
            let gCakeDay = formatDate(Date.parse(uSave.guildCakeDays.filter(i => i.guildId == msg.guild.id)[0].guildCakeDay));
            gCakeDay = gCakeDay.split(/\//g)
            gCakeDay.pop()
            gCakeDay = cakeDay.join('/')

            if (curDate == cakeDay && !uSave.cakeDayMsg) {
                msg.reply(`Happy Discord Cake Day ${msg.member.displayName}! 🍰`);
                uSave.cakeDayMsg = true;
            } else if (uSave.cakeDayMsg) {
                uSave.cakeDayMsg = false;
            }

            if (curDate == gCakeDay && !uSave.guildCakeDays.filter(cd => cd.guildId == msg.guild.id)[0].cakeDayMsg) {
                msg.reply(`Happy ${msg.guild.name} Cake Day ${msg.member.displayName}! 🍰`);
                uSave.guildCakeDays.each(cd => {
                    if (cd.guildId == msg.guild.id) {
                        cd.cakeDayMsg = true;
                    }
                });
            } else if (uSave.guildCakeDays.filter(cd => cd.guildId == msg.guild.id)[0].cakeDayMsg) {
                uSave.guildCakeDays.filter(cd => cd.guildId == msg.guild.id)[0].cakeDayMsg = false;
            }

            let usersdb = await getFromDB({ design: 'saves', view: 'user' })
            usersdb = usersdb.rows.filter(f => f.key == msg.author.id)[0];
            let _rev = await db.get(usersdb.id)._rev
            pushToDB({ id: usersdb.id, rev: _rev, data: usersdb.value })
            client.UserSaves.set(msg.author.id, uSave);
        });
    }
}