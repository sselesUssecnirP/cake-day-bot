const { getFromDB, pushToDB, getDB } = require('../../../../functions/funcs/database');
const secret = require('../../../../saves/config/secret.json');
const config = require('../../../../saves/config/config.json');

module.exports = {
    // Name of the command (legacy)
    name: "takekarma",
    // Category of the command
    category: "moderation",
    // Description of the command
    description: "Allows the user to remove karma from the mentioned user's count.",
    // Other calls for the command
    aliases: ["tk", "takek", "tkarma"],
    // The way to use the command
    usage: `cdb!tk <user_id | user_mention> <<+ | ->karma_amount>`,
    // The run function of the command
    run: async (client, msg, args) => {
        
        let testuser = /<@(\d+)>/;

        if (testuser.test(args[0])) args[0] = args[0].replace(testuser, `$1`);
        
        let user = msg.guild.members.cache.get(user)
        let isPositive;

        if (user && args[1]) {
            if (args[1].includes('-')) {
                isPositive = false;
                args[1] = Math.abs(Number.parseInt(args[1]))
            }
            else if (args[1].includes('+')) {
                isPositive = true;
                args[1] = Math.abs(Number.parseInt(args[1]))
            }


            let uSave = (await getFromDB(secret.sql.database.views.users)).rows.filter(f => f.key == user.id)[0].value
            let gcds = uSave.guildCakeDays.findIndex(f => f.guildId == msg.guild.id)

            if (isPositive) uSave.guildCakeDays[gcds].posKarma -= args[1];
            else uSave.guildCakeDays[gcds].negKarma -= args[1];
            uSave.guildCakeDays[gcds].karma = uSave.guildCakeDays[gcds].posKarma - uSave.guildCakeDays[gcds].negKarma

            msg.reply({ content: `<@${msg.author.id}> has removed ${args[1]} karma from <@${user.id}>'s count.` }).then(message => {
                setTimeout(() => { message.delete(); msg.delete(); }, 10000)
            })

            let usersdb = (await getFromDB(secret.sql.database.views.users)).rows.filter(f => f.key == user.id)[0];
            let _rev = (await getDB(usersdb.id))._rev || false;
            await pushToDB({ _id: usersdb.id, _rev: _rev, isUser: true, data: uSave });
        } else {
            msg.reply({ content: `One of the supplied arguments were not valid.\nArgument 1: ${args[0]}\nArgument 2: ${args[1]}` }).then(message => {
                setTimeout(() => { message.delete(); msg.delete(); }, 10000)
            })
        }
    }
}