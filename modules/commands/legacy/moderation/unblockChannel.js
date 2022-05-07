const { getFromDB, pushToDB } = require('../../../../functions/funcs/database');
const secret = require('../../../../saves/config/secret.json');
const db = require('nano')(secret.sql.url.replace(/{access}/, `${secret.sql.username}:${secret.sql.password}@`)).use(secret.sql.database.name);

module.exports = {
    // Name of the command (legacy)
    name: "unblockchannel",
    // Category of the command
    category: "moderation",
    // Description of the command
    description: "Stops the bot from do karma/cake day stuff in the specified channel.",
    // Other calls for the command
    aliases: ["ubc", "ubchannel", "ublockc"],
    // The way to use the command
    usage: "cdb!ubc <channel_id | channel_mention>",
    // The run function of the command
    run: async (client, msg, args) => {

        let gSave = (await getFromDB(secret.sql.database.views.guilds)).rows.filter(f => f.key == msg.guild.id)[0].value
        let testch = /<#(\d+)>/;

        if (testch.test(args[0])) args[0] = args[0].replace(testch, `$1`);

        let channel = msg.guild.channels.cache.get(args[0]) || undefined;
        let isChannel;
        if (channel)
            if (channel.id == args[0])
                isChannel = true;

        if (gSave) {
            if (isChannel) {
                let ind = gSave.exemptChannels.findIndex(f => f == channel.id);
                gSave.exemptChannels.splice(ind, 1)

                let guildsdb = (await getFromDB(secret.sql.database.views.guilds)).rows.filter(f => f.key == gSave.id)[0];
                let _rev = (await db.get(guildsdb.id))._rev;
                await pushToDB({ _id: guildsdb.id, _rev: _rev, isGuild: true, data: gSave });
            } else
                msg.reply(`The supplied argument doesn't seem to be a channel ID.`).then(reply => {
                    setTimeout(() => { reply.delete(); msg.delete() }, 10000)
                })
        } else {
            msg.reply(`Your guild has no save file.`).then(reply => {
                setTimeout(() => { reply.delete(); msg.delete() }, 10000)
            })
        }


    }
}