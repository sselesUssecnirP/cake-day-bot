const { getFromDB, pushToDB } = require('../../../../functions/basic/basic');
const secret = require('../../../../saves/config/secret.json');
const db = require('nano')(secret.sql.url.replace(/{access}/,`${secret.sql.username}:${secret.sql.password}@`)).use('cake_day_bot');

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
        
        let gSave = await client.GuildSaves.get(msg.guild.id);

        if (gSave.isKarma) {
            gSave.isKarma = false
            msg.reply({ content: 'Disabled Karma.', ephemeral: true })
        }
        else {
            gSave.isKarma = true
            msg.reply({ content: 'Enabled Karma.', ephemeral: true })
        }
        
        let guildsdb = await getFromDB({ design: 'saves', view: 'guild' }).rows.filter(f => f.key == gSave.id)[0];
        let _rev = await db.get(guildsdb.id)._rev;
        pushToDB({ id:guildsdb.id, rev: _rev, data: gSave });
        client.GuildSaves.set(msg.guild.id, gSave)
    }
}