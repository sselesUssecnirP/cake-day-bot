const { MessageEmbed } = require('discord.js')
const config = require('../../../../saves/config/config.json')

module.exports = {
    // Name of the command (legacy)
    name: "help",
    // Category of the command
    category: "info",
    // Description of the command
    description: "Displays a help embed",
    // Other calls for the command
    aliases: ["h", "?"],
    // The way to use the command
    usage: "",
    // The run function of the command
    run: async (client, msg, args) => {
        
        let fun = [];
        let info = [];
        let moderation = [];
        let owner = [];

        client.lcommands.each(i => {

            if (i.category == 'fun') {
                fun.push(`${i.name} **>>>** ${i.description}`)
            } else if (i.category == 'info') {
                info.push(`${i.name} **>>>** ${i.description}`)
            } else if (i.category == 'moderation' && msg.member.permissions.has('MANAGE_GUILD', true)) {
                moderation.push(`${i.name} **>>>** ${i.description}`)
            } else if (i.category == 'owner' && config.owner) {
                owner.push(`${i.name} **>>>** ${i.description}`)
            }
        });

        let embed = new MessageEmbed()
        .setTitle('Cake Day Bot Help')
        .setDescription('A helpful embed displaying Cake Day Bot\'s commands.')
        .setColor(msg.member.displayHexColor)
        .setAuthor({ name: msg.member.displayName, url: `https://discordapp.com/users/${msg.author.id}`, iconURL: msg.member.displayAvatarURL() })
        .setURL(`https://discordapp.com/users/${client.user.id}`)
        .setThumbnail(msg.member.displayAvatarURL())
        .setTimestamp(new Date())

        if (fun.length !== 0)
            embed.addField(`Fun`, fun.join('\n'))
        if (info.length !== 0)
            embed.addField(`Info`, info.join('\n'))
        if (moderation.length !== 0)
            embed.addField(`Moderation`, moderation.join('\n'))
        if (owner.length !== 0)
            embed.addField(`Owner`, owner.join('\n'))

        msg.channel.send({ content: `Help has arrived!`, embeds: [embed] })
    }
}