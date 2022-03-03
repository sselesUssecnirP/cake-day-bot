

module.exports = {
    // Name of the command (legacy)
    name: "karma",
    // Category of the command
    category: "info",
    // Description of the command
    description: "Shows the user what their karma is.",
    // Other calls for the command
    aliases: ["points"],
    // The way to use the command
    usage: "cdb!karma",
    // The run function of the command
    run: async (client, msg, args) => {
        
        let uSave = client.UserSaves.get(msg.author.id);
        let uGSave = uSave.guildCakeDays.filter(s => s.guildId == msg.guild.id)[0];

        msg.reply({
            content: `Your karma is: +/-${uGSave.karma}, +${uGSave.posKarma}, -${uGSave.negKarma}\nYour Bot karma is: +/-${uSave.karma}, +${uSave.posKarma}, -${uSave.negKarma}`,
            ephemeral: true
        });
    }
};