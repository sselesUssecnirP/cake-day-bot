

module.exports = {
    // Name of the event
    name: "karmaReactionAdd",
    // Description of the event
    description: "An event that runs on messageReactionAdd for upvote/downvotes.",
    // Should the event run instantly/constantly, or be called manually?
    isNormal: false,
    // The event's run function (what the event does)
    run: async (client, msg) => {

        let day1 = await client.UserSaves.get(msg.author.id)
        day1 = day1['karmaAdd']['karmaAddDay']
        let nextDay = await client.UserSaves.get(msg.author.id)
        nextDay = nextDay['karmaAdd']['nextDay']

        let uSave = client.UserSaves.get(msg.author.id)
        let gSave = client.GuildSaves.get(msg.guild.id)

        let emojis = require('../../../saves/config/config.json').botEmojis.upvotes
        let rChannel = msg.channelId
        let rMessage = msg.id

        msg.react(emojis[0])
        msg.react(emojis[1])
    
        client.on('messageReactionAdd', async (reaction, user) => {

            if (day1 >= nextDay) return;

            if (reaction.message.partial) await reaction.message.fetch();
            if (reaction.partial) await reaction.fetch();
            if (user.bot) return;
            if (!reaction.message.guild) return;
            if (reaction.message.id != rMessage) return;

            if (uSave.karmaAdd)

            if (reaction.message.channel.id == rChannel) {

                if (reaction.emoji.toString() === emojis[0]) {
                    console.log(`Awarded 1 posKarma to ${msg.member.displayName}`)
                    uSave.posKarma += 1
                    uSave.karma = uSave.posKarma - uSave.negKarma
                    uSave.guildCakeDays.filter(g => g.guildId == reaction.message.guild.id).posKarma += 1
                    uSave.guildCakeDays.filter(g => g.guildId == reaction.message.guild.id).karma = await uSave.guildCakeDays.filter(g => g.guildId == reaction.message.guild.id).posKarma - await uSave.guildCakeDays.filter(g => g.guildId == reaction.message.guild.id).negKarma
                } else if (reaction.emoji.toString() === emojis[1]) {
                    console.log(`Awarded 1 negKarma to ${msg.member.displayName}`)
                    uSave.negKarma += 1
                    uSave.karma = uSave.posKarma - uSave.negKarma
                    uSave.guildCakeDays.filter(g => g.guildId == reaction.message.guild.id).negKarma += 1
                    uSave.guildCakeDays.filter(g => g.guildId == reaction.message.guild.id).karma = await uSave.guildCakeDays.filter(g => g.guildId == reaction.message.guild.id).posKarma - await uSave.guildCakeDays.filter(g => g.guildId == reaction.message.guild.id).negKarma
                }

                /*if (!gSave.karmaRoles[0].default == true) {
                    let nextRole = await gSave.karmaRoles.filter(r => msg.member.roles.cache.has(r.role))[0] || false
                    let previousRole = false;
                    if (nextRole) {
                        previousRole = nextRole;
                        nextRole = gSave.karmaRoles.indexOf(nextRole);
                        nextRole++;
                    }  else {
                        nextRole = 0;
                    }

                    nextRole = gSave.karmaRoles[nextRole]
                    if (uSave.karma >= nextRole['milestone']) {
                        msg.member.roles.add(nextRole['role'])
                        if (previousRole) msg.member.roles.remove(previousRole['role'])
                    }
                }*/

                client.UserSaves.set(msg.author.id, uSave)
                console.log(`Saved ${msg.member.displayName}'s new data.`)
            }
        });

        client.on('messageReactionRemove', async (reaction, user) => {

            if (day1 >= nextDay) return;

            let emojis = await client.config.get('config')['botEmojis']['upvotes']
            let rChannel = msg.channelId
            let rMessage = msg.id

            if (reaction.message.partial) await reaction.message.fetch();
            if (reaction.partial) await reaction.fetch();
            if (user.bot) return;
            if (!reaction.message.guild) return;
            if (reaction.message.id != rMessage) return;

            if (reaction.message.channel.id == rChannel) {

                if (reaction.emoji.toString() === emojis[0]) {
                    uSave.posKarma -= 1
                    uSave.karma = uSave.posKarma - uSave.negKarma
                    uSave.guildCakeDays.filter(g => g.guildId == reaction.message.guild.id).posKarma -= 1
                    uSave.guildCakeDays.filter(g => g.guildId == reaction.message.guild.id).karma = await uSave.guildCakeDays.filter(g => g.guildId == reaction.message.guild.id).posKarma - await uSave.guildCakeDays.filter(g => g.guildId == reaction.message.guild.id).negKarma
                } else if (reaction.emoji.toString() === emojis[1]) {
                    uSave.negKarma -= 1
                    uSave.karma = uSave.posKarma - uSave.negKarma
                    uSave.guildCakeDays.filter(g => g.guildId == reaction.message.guild.id).negKarma -= 1
                    uSave.guildCakeDays.filter(g => g.guildId == reaction.message.guild.id).karma = await uSave.guildCakeDays.filter(g => g.guildId == reaction.message.guild.id).posKarma - await uSave.guildCakeDays.filter(g => g.guildId == reaction.message.guild.id).negKarma
                }

                if (!gSave.karmaRoles[0].default == true) {
                    let nextRole = await gSave.karmaRoles.filter(r => msg.member.roles.cache.has(r.role))[0] || false
                    let previousRole = false;
                    if (nextRole) {
                        previousRole = nextRole;
                        nextRole = gSave.karmaRoles.indexOf(nextRole);
                        nextRole++;
                    }  else {
                        nextRole = 0;
                    }

                    nextRole = gSave.karmaRoles[nextRole]
                    if (uSave.karma >= nextRole['milestone']) {
                        msg.member.roles.add(nextRole['role'])
                        if (previousRole) msg.member.roles.remove(previousRole['role'])
                    }
                }

                client.UserSaves.set(msg.author.id, uSave)
            }
        });
    }
}
