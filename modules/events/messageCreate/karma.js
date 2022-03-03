const { writeFileSync } = require('fs');
const config = require('../../../saves/config/config.json');

module.exports = {
    // Name of the event
    name: "karma",
    // Description of the event
    description: "An event that runs on created messages.",
    // Should the event run instantly/constantly, or be called manually?
    isNormal: true,
    // The event's run function (what the event does)
    run: async (client) => {
        
        client.on('messageCreate', async msg => {
            
            if (config.blocked.some(i => i == msg.author.id)) return;
            let prefix = await client.config.get('config').prefix
            if (msg.content.toLowerCase().startsWith(prefix)) return;
            if (msg.author.bot) return;

            if (!client.GuildSaves.some(g => g.id == msg.guild.id)) {
                const newGuildSave = {
                    name: msg.guild.name,
                    id: msg.guild.id,
                    owner: msg.guild.ownerId,
                    karmaRoles: [{milestone: 0, role: 'empty', default: false}],
                    isCakeDays: true,
                    isKarma: true
                }

                writeFileSync(`./saves/GuildSaves/${msg.guild.id}.json`, JSON.stringify(newGuildSave, null, '\t'))
                client.GuildSaves.set(msg.guild.id)
            }


            let uSave;
            let gSave = await client.GuildSaves.get(msg.guild.id);

            if (!gSave.isKarma) return;

            if (client.UserSaves.has(msg.author.id)) {
                uSave = client.UserSaves.get(msg.author.id)
            } else {
                let newUSave = {
                    id: msg.author.id,
                    username: msg.author.username,
                    cakeDay: msg.author.createdAt,
                    cakeDayMsg: false,
                    guildCakeDays: [{guildId: msg.guild.id, guildCakeDay: msg.member.joinedAt, cakeDayMsg: false, karma: 0, negKarma: 0, posKarma: 0}],
                    karmaAdd: false,
                    karma: 0,
                    negKarma: 0,
                    posKarma: 0
                }

                uSave = newUSave;
                writeFileSync(`./saves/UserSaves/${msg.author.id}.json`, JSON.stringify(newUSave, null, '\t'));
            }

            if (!uSave.guildCakeDays.some(v => v.guildId == msg.guild.id)) {
                uSave.guildCakeDays.push({guildId: msg.guild.id, guildCakeDay: msg.member.joinedAt});
            }

            if (!uSave.karmaAdd || uSave.karmaAdd['karmaAddDay'] >= uSave.karmaAdd['nextDay']) {
                uSave.karmaAdd = { 
                    karmaAddDay: new Date(), 
                    nextDay: new Date().setMilliseconds(new Date().getMilliseconds += 8.64e+7)
                }

                client.manualEvents.get('karmaReactionAdd').run(client, msg)
            }
        });
    }
}