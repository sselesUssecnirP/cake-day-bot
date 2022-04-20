const { getFromDB, pushToDB } = require('../../../../functions/funcs/database');
const secret = require('../../../../saves/config/secret.json');
const db = require('nano')(secret.sql.url.replace(/{access}/,`${secret.sql.username}:${secret.sql.password}@`)).use('cake_day_bot');

module.exports = {
    // Name of the command (legacy)
    name: "removemilestone",
    // Category of the command
    category: "moderation",
    // Description of the command
    description: "Removes a milestone from the list of Karma Milestones",
    // Other calls for the command
    aliases: ["rm", "removem", "rmilestone"],
    // The way to use the command
    usage: "cdb!removemilestone <id_of_role>",
    // The run function of the command
    run: async (client, msg, args) => {
        let gSave = (await getFromDB({ design: 'saves', view: 'guild' })).rows.filter(f => f.key == msg.guild.id)[0].value
        args[0] = Number.parseInt(args[0])

        if (gSave.karmaRoles[0].default == false) return msg.reply({ content: 'There are no milestones for this guild.', ephemeral: true });

        if (gSave.karmaRoles.filter(r => r.role == args[0]).length > 0) {
            let index = gSave.karmaRoles.findIndex(f => f == gSave.karmaRoles.filter(r => r.role == args[0])[0])
            gSave.karmaRoles.splice(index,1)
            if (gSave.karmaRoles.length == 0) gSave.karmaRoles[0] = {milestone: 0, role: 'empty', default: false}
            gSave.karmaRoles.sort((a, b) => a.milestone - b.milestone)

            let guildsdb = (await getFromDB({ design: 'saves', view: 'guild' })).rows.filter(f => f.key == gSave.id)[0];
            let _rev = await db.get(guildsdb.id)._rev;
            await pushToDB({ _id: guildsdb.id, _rev: _rev, data: gSave, isGuild: true });
            msg.reply({ content: 'Successfully removed the milestone.', ephemeral: true })
        } else {
            msg.reply({ content: 'There is no milestone using that role id or the given "id" is not a valid role id.', ephemeral: true })
        }
    }
}