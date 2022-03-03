

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
        
        client.GuildSaves.set(msg.guild.id, gSave)
    }
}