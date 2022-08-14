const { formatDate, formatDateTime } = require('../../../functions/funcs/basic')
const { getFromDB, pushToDB } = require('../../../functions/funcs/database');
const secret = require('../../../saves/config/secret.json');
const db = require('nano')(secret.sql.url.replace(/{access}/,`${secret.sql.username}:${secret.sql.password}@`)).use(secret.sql.database.name);
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

            let uSave;
            let gSave;

            if ((await getFromDB(secret.sql.database.views.guilds)).rows.filter(f => f.key == msg.guild.id)[0]) {
                gSave = (await getFromDB(secret.sql.database.views.guilds)).rows.filter(f => f.key == msg.guild.id)[0].value
            }
            else {
                return;
            }

            if ((await getFromDB(secret.sql.database.views.users)).rows.filter(f => f.key == msg.author.id)[0]) {
                uSave = (await getFromDB(secret.sql.database.views.users)).rows.filter(f => f.key == msg.author.id)[0].value
            } else {
                return;
            }

            if (uSave.guildCakeDays !== undefined || uSave.guildCakeDays !== [])
                if (!uSave.guildCakeDays.some(uGCD => uGCD.id == msg.guild.id)) return;
            if (config.blocked.some(i => i == msg.author.id)) return;
            if (msg.author.bot) return;

            if (gSave.exemptChannels.some(i => i == msg.channel.id)) return;

            let curDate = formatDate()
            curDate = curDate.split('/') // i.e 7/20/2022
            curDate.pop() // i.e [7, 20]
            curDate = curDate.join('/') // i.e 7/20
            let cakeDay = formatDate(new Date(uSave.cakeDay));
            cakeDay = cakeDay.split('/') // i.e 8/30/2033
            cakeDay.pop() // i.e [8, 30]
            cakeDay = cakeDay.join('/') // i.e 8/30
            let gCakeDay = formatDate(new Date(uSave.guildCakeDays.filter(i => i.guildId == msg.guild.id)[0].guildCakeDay));
            gCakeDay = gCakeDay.split('/') // i.e 6/10/2011
            gCakeDay.pop() // i.e [6, 10]
            gCakeDay = cakeDay.join('/') // i.e 6/10

            if (curDate == cakeDay && !uSave.cakeDayMsg) {
                msg.reply(`Happy Discord Cake Day ${msg.member.displayName}! 🍰`);
                uSave.cakeDayMsg = true;
            } else if (curDate != cakeDay && uSave.cakeDayMsg) {
                uSave.cakeDayMsg = false;
            }

            if (curDate == gCakeDay && !uSave.guildCakeDays.filter(cd => cd.guildId == msg.guild.id)[0].cakeDayMsg) {
                msg.reply(`Happy ${msg.guild.name} Cake Day ${msg.member.displayName}! 🍰`);
                uSave.guildCakeDays.each(cd => {
                    if (cd.guildId == msg.guild.id) {
                        cd.cakeDayMsg = true;
                    }
                });
            } else if (curDate != gCakeDay && uSave.guildCakeDays.filter(cd => cd.guildId == msg.guild.id)[0].cakeDayMsg) {
                uSave.guildCakeDays.filter(cd => cd.guildId == msg.guild.id)[0].cakeDayMsg = false;
            }

            let usersdb = await getFromDB(secret.sql.database.views.users)
            usersdb = usersdb.rows.filter(f => f.key == msg.author.id)[0];
            let _rev = await db.get(usersdb.id)._rev || false
            await pushToDB({ _id: usersdb.id, _rev: _rev, isUser: true, data: uSave })
        });
    }
}