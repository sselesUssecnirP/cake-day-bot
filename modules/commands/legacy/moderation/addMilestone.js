

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
    usage: "cdb!addmilestone <karma_#_to_achieve> <id_of_role_to_give>",
    // The run function of the command
    run: async (client, msg, args) => {
        let gSave = await client.GuildSaves.get(msg.guild.id);
        let karmaNum = Number.parseInt(args[0])
        if (typeof karmaNum !== 'number') return msg.reply({ content: '<karma_#_to_achieve> was not a number.', ephemeral: true });
        let role;
        try {
            role = await msg.guild.roles.cache.get(args[1])
        } catch {
            return msg.reply({ content: '<id_of_role_to_give> could not be identified as a role.', ephemeral: true });
        }

        if (!role)
            return msg.reply({ content: '<id_of_role_to_give> could not be identified as a role.', ephemeral: true })

        if (gSave.karmaRoles[0].default == false) {
            gSave.karmaRoles[0] = {milestone: karmaNum, role: role.id}
        } else {
            gSave.karmaRoles.push({ milestone: karmaNum, role: role.id })
        }

        gSave.karmaRoles.sort((a, b) => a.milestone - b.milestone)

        client.GuildSaves.set(msg.guild.id, gSave)
        msg.reply({ content: 'Successfully added a new milestone.', ephemeral: true })
    }
}