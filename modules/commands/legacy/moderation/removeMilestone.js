

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
        let gSave = client.GuildSaves.get(msg.guild.id);
        args[0] = args[0]

        if (!gSave.karmaRoles[0].default == false) return msg.reply({ content: 'There are no milestones for this guild.', ephemeral: true });

        if (gSave.karmaRoles.filter(r => r.role == args[0]).length > 0) {
            let index = gSave.karmaRoles.indexOf(gSave.karmaRoles.filter(r => r.role == args[0]))
            gSave.karmaRoles.splice(index,1)
            if (gSave.karmaRoles.length == 0) gSave.karmaRoles[0] = {milestone: 0, role: 'empty', default: false}
            gSave.karmaRoles.sort((a, b) => a - b)

            msg.reply({ content: 'Successfully removed the milestone.', ephemeral: true })
            client.GuildSaves.set(msg.guild.id, gSave)
        } else {
            msg.reply({ content: 'There is no milestone using that role id or the given "id" is not a valid role id.', ephemeral: true })
        }
    }
}