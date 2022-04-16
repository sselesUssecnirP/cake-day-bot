const { getFromDB, pushToDB } = require('../../../functions/basic/basic');
const secret = require('../../../saves/config/secret.json');
const db = require('nano')(secret.sql.url.replace(/{access}/,`${secret.sql.username}:${secret.sql.password}@`)).use('cake_day_bot');

module.exports = {
    // Name of the command (legacy)
    name: "togglecakedays",
    // Category of the command
    category: "moderation",
    // Description of the command
    description: "Enable/Disable Cake Days.",
    // Other calls for the command
    aliases: ["tcg", "tcakedays"],
    // The way to use the command
    usage: "cdb!togglecakedays",
    // The run function of the command
    run: async (client, msg, args) => {
        
        let gSave = await client.GuildSaves.get(msg.guild.id);

        if (gSave.isCakeDays) {
            gSave.isCakeDays = false
            msg.reply({ content: 'Disabled Cake Days.', ephemeral: true })
        }
        else {
            gSave.isCakeDays = true
            msg.reply({ content: 'Enabled Cake Days.', ephemeral: true })
        }

        let guildsdb = await getFromDB({ design: 'saves', view: 'guild' }).rows.filter(f => f.key == gSave.id)[0];
        let _rev = await db.get(guildsdb.id)._rev;
        pushToDB({ id:guildsdb.id, rev: _rev, data: gSave });
        client.GuildSaves.set(msg.guild.id, gSave)
    }
}