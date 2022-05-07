const { getFromDB, pushToDB } = require('../../../../functions/funcs/database');
const secret = require('../../../../saves/config/secret.json');
const db = require('nano')(secret.sql.url.replace(/{access}/,`${secret.sql.username}:${secret.sql.password}@`)).use(secret.sql.database.name);

module.exports = {
    // Name of the command (legacy)
    name: "togglekarma",
    // Category of the command
    category: "moderation",
    // Description of the command
    description: "Enable/Disable karma.",
    // Other calls for the command
    aliases: ["tk", "tkarma"],
    // The way to use the command
    usage: "cdb!togglekarma",
    // The run function of the command
    run: async (client, msg, args) => {
        
        let gSave = (await getFromDB(secret.sql.database.views.guilds)).rows.filter(f => f.key == msg.guild.id)[0].value;

        if (gSave.isKarma) {
            gSave.isKarma = false
            msg.reply({ content: 'Disabled Karma.'}).then(reply => {
                setTimeout(() => { reply.delete(); msg.delete() }, 10000)
            })
        }
        else {
            gSave.isKarma = true
            msg.reply({ content: 'Enabled Karma.'}).then(reply => {
                setTimeout(() => { reply.delete(); msg.delete() }, 10000)
            })
        }
        
        let guildsdb = (await getFromDB(secret.sql.database.views.guilds)).rows.filter(f => f.key == gSave.id)[0];
        let _rev = (await db.get(guildsdb.id))._rev;
        await pushToDB({ _id: guildsdb.id, _rev: _rev, isGuild: true, data: gSave });
    }
}