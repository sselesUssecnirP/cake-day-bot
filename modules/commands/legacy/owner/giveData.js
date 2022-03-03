const aZip = require('adm-zip')
const { writeFileSync } = require('fs')
module.exports = {
    // Name of the command (legacy)
    name: "givedata",
    // Category of the command
    category: "owner",
    // Description of the command
    description: "Starts the delivery of data on a timeout.",
    // Other calls for the command
    aliases: ["givedata", "gdata", "gived", "gd"],
    // The way to use the command
    usage: "cdb!givedata",
    // The run function of the command
    run: async (client, msg, args) => {
        
        const zip = new aZip();

        await client.GuildSaves.each(i => writeFileSync(`./saves/GuildSaves/${i.id}.json`, JSON.stringify(i, null, '\t')));
        await client.UserSaves.each(i => writeFileSync(`./saves/UserSaves/${i.id}.json`, JSON.stringify(i, null, '\t')))

        zip.addLocalFolder('./saves')
        zip.writeZip('./modules/commands/legacy/owner/BotSaves.zip')
        msg.author.createDM()
        msg.author.send({ content: `Here are the BotSaves in zip format! ${new Date().toLocaleString('en-US')}`, files: ['modules/commands/legacy/owner/BotSaves.zip'] })
    }
}