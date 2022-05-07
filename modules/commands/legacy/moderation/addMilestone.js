const { getFromDB, pushToDB } = require('../../../../functions/funcs/database');
const secret = require('../../../../saves/config/secret.json');
const db = require('nano')(secret.sql.url.replace(/{access}/, `${secret.sql.username}:${secret.sql.password}@`)).use(secret.sql.database.name);

module.exports = {
    // Name of the command (legacy)
    name: "addmilestone",
    // Category of the command
    category: "moderation",
    // Description of the command
    description: "Adds a milestone to the list of Karma Milestones",
    // Other calls for the command
    aliases: ["am", "addm", "amilestone"],
    // The way to use the command
    usage: "cdb!addmilestone <required_amount_of_karma> <role_id | role_mention>",
    // The run function of the command
    run: async (client, msg, args) => {
        let gSave = (await getFromDB(secret.sql.database.views.guilds)).rows.filter(f => f.key == msg.guild.id)[0].value;
        let karmaNum = Number.parseInt(args[0])
        if (typeof karmaNum !== 'number') return msg.reply({ content: '<karma_#_to_achieve> was not a number.', ephemeral: true });
        let role;
        let testrole = /<@&(\d+)>/;

        if (testrole.test(args[1])) args[1] = args[1].replace(testrole, `$1`);


        try {
            role = await msg.guild.roles.cache.get(args[1])
        } catch {
            return msg.reply({ content: '<id_of_role_to_give> could not be identified as a role.'}).then(reply => {
                setTimeout(() => { reply.delete(); msg.delete() }, 10000);
            });
        }

        if (!role)
            return msg.reply({ content: '<id_of_role_to_give> could not be identified as a role.'}).then(reply => {
                setTimeout(() => { reply.delete(); msg.delete() }, 10000);
            });

        if (gSave.karmaRoles[0].default == false) {
            gSave.karmaRoles[0] = { milestone: karmaNum, role: role.id, default: true }
        } else {
            gSave.karmaRoles.push({ milestone: karmaNum, role: role.id })
        }

        gSave.karmaRoles.sort((a, b) => a.milestone - b.milestone)

        let guildsdb = (await getFromDB(secret.sql.database.views.guilds)).rows.filter(f => f.key == gSave.id)[0];
        let _rev = (await db.get(guildsdb.id))._rev;
        await pushToDB({ _id: guildsdb.id, _rev: _rev, isGuild: true, data: gSave });
        msg.reply({ content: 'Successfully added a new milestone.'}).then(reply => {
            setTimeout(() => { reply.delete(); msg.delete() }, 10000)
        })

    }
}