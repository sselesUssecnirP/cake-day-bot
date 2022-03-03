

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
        client.GuildSaves.set(msg.guild.id, gSave)
    }
}