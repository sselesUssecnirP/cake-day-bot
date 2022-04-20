const { getFromDB, pushToDB } = require('../../../functions/funcs/basic');
const secret = require('../../../saves/config/secret.json');
const db = require('nano')(secret.sql.url.replace(/{access}/,`${secret.sql.username}:${secret.sql.password}@`)).use('cake_day_bot');

module.exports = {
    // Name of the event
    name: "karmaReactionAdd",
    // Description of the event
    description: "An event that runs on messageReactionAdd for upvote/downvotes.",
    // Should the event run instantly/constantly, or be called manually?
    isNormal: false,
    // The event's run function (what the event does)
    run: async (client, msg) => {

        let uSave = (await getFromDB({ design: 'saves', view: 'user' })).rows.filter(f => f.key == msg.author.id)[0].value
        let gSave = (await getFromDB({ design: 'saves', view: 'guild' })).rows.filter(f => f.key == msg.guild.id)[0].value

        let day1 = Date.parse(uSave['karmaAdd']['karmaAdd']);
        let nextAdd = Date.parse(uSave['karmaAdd']['nextAdd']);

        let emojis = require('../../../saves/config/config.json').botEmojis.upvotes
        let rChannel = msg.channelId
        let rMessage = msg.id

        msg.react(emojis[0])
        msg.react(emojis[1])

        let messageReactionAdd = async (reaction, user) => {

            uSave = (await getFromDB({ design: 'saves', view: 'user' })).rows.filter(f => f.key == reaction.message.author.id)[0].value
            gSave = (await getFromDB({ design: 'saves', view: 'guild' })).rows.filter(f => f.key == reaction.message.guildId)[0].value

            if (day1 >= nextAdd) {
                client.off('messageReactionAdd', messageReactionAdd);
                return;
            }   

            if (msg.author.id == reaction.message.author.id) return;
            if (reaction.message.partial) await reaction.message.fetch();
            if (reaction.partial) await reaction.fetch();
            if (user.bot) return;
            if (!reaction.message.guild) return;
            if (reaction.message.id != rMessage) return;

            if (reaction.message.channel.id == rChannel) {

                if (reaction.emoji.toString() === emojis[0]) {
                    console.log(`Awarded 1 posKarma to ${msg.member.displayName}\nPosKarma: ${uSave.posKarma}\nNegKarma: ${uSave.negKarma}`)
                    uSave.posKarma += 1;
                    let gcds = uSave.guildCakeDays.filter(f => f.guildId == msg.guild.id)[0]
                    let indGCDS = uSave.guildCakeDays.findIndex(f => f == gcds);
                    uSave.guildCakeDays[indGCDS].posKarma += 1;
                    uSave.guildCakeDays[indGCDS].karma = uSave.guildCakeDays[indGCDS].posKarma - uSave.guildCakeDays[indGCDS].negKarma;

                    uSave.karma = uSave.posKarma - uSave.negKarma
                    uSave.guildCakeDays[indGCDS] = gcds
                    console.log(`PosKarma: ${uSave.posKarma}\nNegKarma: ${uSave.negKarma}`)
                } else if (reaction.emoji.toString() === emojis[1]) {
                    console.log(`Awarded 1 negKarma to ${msg.member.displayName}`)
                    uSave.negKarma += 1;
                    let gcds = uSave.guildCakeDays.filter(f => f.guildId == msg.guild.id)[0]
                    let indGCDS = uSave.guildCakeDays.findIndex(f => f == gcds);
                    uSave.guildCakeDays[indGCDS].negKarma += 1;
                    uSave.guildCakeDays[indGCDS].karma = uSave.guildCakeDays[indGCDS].posKarma - uSave.guildCakeDays[indGCDS].negKarma;

                    uSave.karma = uSave.posKarma - uSave.negKarma
                    uSave.guildCakeDays[indGCDS] = gcds
                }

                if (gSave.karmaRoles[0].default == true) {
                    let currentRole;
                    gSave.karmaRoles.forEach(kr => {
                        msg.member.roles.cache.each(cr => {
                            if (cr.id == kr.role) {
                                currentRole = cr.id;
                            }
                        });
                    });

                    let nextRole;
                    nextRoleInd
                    gSave.karmaRoles.forEach(kr => {
                        if (kr.role == currentRole) {
                            nextRole = gSave.karmaRoles.findIndex(f => f.role == kr.role) + 1;
                            nextRoleInd = nextRole;
                            if (gSave.karmaRoles[nextRole])
                                nextRole = gSave.karmaRoles[nextRole].role;
                            else
                                nextRole = false;
                        }
                    });

                    let guildInd;
                    uSave.guildCakeDays.forEach(g => {
                        if (g.guildId == msg.guild.id)
                            guildInd = uSave.guildCakeDays.findIndex(f => f == g)
                    })

                    if (nextRole) {
                        if (gSave.karmaRoles[nextRoleInd].milestone <= uSave.guildCakeDays[guildInd].karma)
                            reaction.message.member.roles.add(nextRole, `${reaction.message.author.username} has achieved ${gSave.karmaRoles[nextRoleInd].milestone} karma!`);
                        if (nextRoleInd !== 0) {
                            reaction.message.member.roles.remove(currentRole, `${reaction.message.author.username} has achived a new milestone! Removing previous role...`)
                        }
                    }
                }

                let usersdb = (await getFromDB({ design: 'saves', view: 'user' })).rows.filter(f => f.key == reaction.message.author.id)[0];
                let _rev = (await db.get(usersdb.id))._rev || false;
                await pushToDB({ _id: usersdb.id, _rev: _rev, data: uSave, isUser: true })

                console.log(`Saved ${msg.member.displayName}'s new data.`)
            }
        };

        let messageReactionRemove = async (reaction, user) => {

            uSave = (await getFromDB({ design: 'saves', view: 'user' })).rows.filter(f => f.key == reaction.message.author.id)[0].value
            gSave = (await getFromDB({ design: 'saves', view: 'guild' })).rows.filter(f => f.key == reaction.message.guildId)[0].value

            if (day1 >= nextAdd) {
                client.off('messageReactionRemove', messageReactionRemove);
                return;
            }

            let emojis = await client.config.get('config')['botEmojis']['upvotes']
            let rChannel = msg.channelId
            let rMessage = msg.id

            if (msg.author.id == reaction.message.author.id) return;
            if (reaction.message.partial) await reaction.message.fetch();
            if (reaction.partial) await reaction.fetch();
            if (user.bot) return;
            if (!reaction.message.guild) return;
            if (reaction.message.id != rMessage) return;

            if (reaction.message.channel.id == rChannel) {

                if (reaction.emoji.toString() === emojis[0]) {
                    uSave.posKarma -= 1;
                    let gcds = uSave.guildCakeDays.filter(f => f.guildId == msg.guild.id)[0]
                    let indGCDS = uSave.guildCakeDays.findIndex(f => f == gcds);
                    uSave.guildCakeDays[indGCDS].posKarma -= 1;
                    uSave.guildCakeDays[indGCDS].karma = uSave.guildCakeDays[indGCDS].posKarma - uSave.guildCakeDays[indGCDS].negKarma;

                    uSave.karma = uSave.posKarma - uSave.negKarma
                    uSave.guildCakeDays[indGCDS] = gcds
                } else if (reaction.emoji.toString() === emojis[1]) {
                    uSave.negKarma -= 1;
                    let gcds = uSave.guildCakeDays.filter(f => f.guildId == msg.guild.id)[0]
                    let indGCDS = uSave.guildCakeDays.findIndex(f => f == gcds);
                    uSave.guildCakeDays[indGCDS].negKarma -= 1;
                    uSave.guildCakeDays[indGCDS].karma = uSave.guildCakeDays[indGCDS].posKarma - uSave.guildCakeDays[indGCDS].negKarma;

                    uSave.karma = uSave.posKarma - uSave.negKarma
                    uSave.guildCakeDays[indGCDS] = gcds
                }

                if (gSave.karmaRoles[0].default == true) {
                    let currentRole;
                    gSave.karmaRoles.forEach(kr => {
                        msg.member.roles.cache.each(cr => {
                            if (cr.id == kr.role) {
                                currentRole = cr.id;
                            }
                        });
                    });

                    let nextRole;
                    nextRoleInd
                    gSave.karmaRoles.forEach(kr => {
                        if (kr.role == currentRole) {
                            nextRole = gSave.karmaRoles.findIndex(f => f.role == kr.role) - 1;
                            nextRoleInd = nextRole;
                            if (gSave.karmaRoles[nextRole])
                                nextRole = gSave.karmaRoles[nextRole].role;
                            else
                                nextRole = false;
                        }
                    });

                    let guildInd;
                    uSave.guildCakeDays.forEach(g => {
                        if (g.guildId == msg.guild.id)
                            guildInd = uSave.guildCakeDays.findIndex(f => f == g)
                    })

                    if (nextRole) {
                        if (gSave.karmaRoles[nextRoleInd].milestone > uSave.guildCakeDays[guildInd].karma)
                            reaction.message.member.roles.add(nextRole, `${reaction.message.author.username} has regressed under ${gSave.karmaRoles[nextRoleInd + 1].milestone} karma!`);
                        if (nextRoleInd !== 0) {
                            reaction.message.member.roles.remove(currentRole, `${reaction.message.author.username} has regressed to a previous milestone! Removing previous role...`)
                        }
                    }
                }

                let usersdb = (await getFromDB({ design: 'saves', view: 'user' })).rows.filter(f => f.key == reaction.message.author.id)[0];
                let _rev = (await db.get(usersdb.id))._rev || false;
                await pushToDB({ _id: usersdb.id, _rev: _rev, data: uSave, isUser: true })
            }
        };
    
        client.on('messageReactionAdd', messageReactionAdd);

        client.on('messageReactionRemove', messageReactionRemove);
    }
}
