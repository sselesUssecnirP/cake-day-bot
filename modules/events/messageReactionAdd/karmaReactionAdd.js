const { getFromDB, pushToDB } = require('../../../functions/funcs/basic');
const secret = require('../../../saves/config/secret.json');
const db = require('nano')(secret.sql.url.replace(/{access}/,`${secret.sql.username}:${secret.sql.password}@`)).use(secret.sql.database.name);
const config = require('../../../saves/config/config.json')

module.exports = {
    // Name of the event
    name: "karmaReactionAdd",
    // Description of the event
    description: "An event that runs on messageReactionAdd for upvote/downvotes.",
    // Should the event run instantly/constantly, or be called manually?
    isNormal: true,
    // The event's run function (what the event does)
    run: async (client) => {

        let messageReactionAdd = async (reaction, user) => {

            if (reaction.message.partial) await reaction.message.fetch();
            if (reaction.partial) await reaction.fetch();
            if (user.id == reaction.message.author.id) return;
            if (user.bot) return;
            if (!reaction.message.guild) return;

            if ((await getFromDB(secret.sql.database.views.reactionMsgs)).rows.filter(f => f.value.msgId == reaction.message.id).length == 0) return;

            //console.log('Hi there!')

            uSave = (await getFromDB(secret.sql.database.views.users)).rows.filter(f => f.key == reaction.message.author.id)[0].value
            gSave = (await getFromDB(secret.sql.database.views.guilds)).rows.filter(f => f.key == reaction.message.guildId)[0].value
            mSave = (await getFromDB(secret.sql.database.views.reactionMsgs)).rows.filter(f => f.value.msgId == reaction.message.id)[0].value

            if (new Date(mSave.deletionDate) <= new Date()) {
                db.destroy((await getFromDB(secret.sql.database.views.reactionMsgs)).rows.filter(f => f.value.msgId == reaction.message.id)[0].id)
                reaction.message.guild.channels.cache.each(ch => {
                    if (ch.name == 'botlog') {
                        ch.send(`Old Up/Down vote ticker deleted! (1 day old)`)
                        return;
                    }
                })
                return;
            }

            if (reaction.emoji.toString() === config.botEmojis.upvotes[0]) {
                console.log(`Awarded 1 posKarma to ${reaction.message.member.displayName}`)
                uSave.posKarma += 1;
                let gcds = uSave.guildCakeDays.filter(f => f.guildId == reaction.message.guild.id)[0]
                let indGCDS = uSave.guildCakeDays.findIndex(f => f == gcds);
                uSave.guildCakeDays[indGCDS].posKarma += 1;
                uSave.guildCakeDays[indGCDS].karma = uSave.guildCakeDays[indGCDS].posKarma - uSave.guildCakeDays[indGCDS].negKarma;

                uSave.karma = uSave.posKarma - uSave.negKarma
                uSave.guildCakeDays[indGCDS] = gcds
                console.log(`${reaction.message.author.username} Karma: ${uSave.karma}`)
            } else if (reaction.emoji.toString() === config.botEmojis.upvotes[1]) {
                console.log(`Awarded 1 negKarma to ${reaction.message.member.displayName}`)
                uSave.negKarma += 1;
                let gcds = uSave.guildCakeDays.filter(f => f.guildId == reaction.message.guild.id)[0]
                let indGCDS = uSave.guildCakeDays.findIndex(f => f == gcds);
                uSave.guildCakeDays[indGCDS].negKarma += 1;
                uSave.guildCakeDays[indGCDS].karma = uSave.guildCakeDays[indGCDS].posKarma - uSave.guildCakeDays[indGCDS].negKarma;

                uSave.karma = uSave.posKarma - uSave.negKarma
                uSave.guildCakeDays[indGCDS] = gcds
                console.log(`${reaction.message.author.username} Karma: ${uSave.karma}`)
            }

            if (gSave.karmaRoles[0].default == true && !reaction.message.member.permissions.has('MANAGE_GUILD', true)) {

                try { 
                    console.log(`Found Milestones for guild`)

                    let gcds = uSave.guildCakeDays.filter(f => f.guildId == reaction.message.guild.id)[0]
                    let roles = [];
    
                    /* 
                    
                        A D D I N G
                        R O L E S
    
                    */
                    roles = false;
    
                    gSave.karmaRoles.forEach((kr, index) => {
                            if (gcds.karma >= kr.milestone) {
                                roles = gSave.karmaRoles.findIndex(f => f == kr)
                            }
                    });
                    console.log(`${roles} || adding`)
                    if (reaction.message.member.roles.cache.has(gSave.karmaRoles[roles].role)) roles = false;

                    if (!roles && !gSave.karmaRoles.some(f => reaction.message.member.roles.cache.has(f.role))) {
                        console.log('!roles')
                        let role = reaction.message.guild.roles.cache.get(gSave.karmaRoles[0].role)
                        reaction.message.member.roles.add(role.id, `${reaction.message.author.username} has ranked up to ${role.name}`)
                        reaction.message.channel.send(`<@!${reaction.message.author.id}> has ranked up to ${role.name}`)
                    } else if (roles) {
                        console.log('roles')
                        let role = (await reaction.message.guild.roles.cache.get(gSave.karmaRoles[roles].role))
                        gSave.karmaRoles.forEach((kr, index) => {
                            reaction.message.member.roles.cache.each(r => {
                                if (r.id == kr.role) {
                                    if (index !== roles) reaction.message.member.roles.remove(role.id, `${reaction.message.author.username} has ranked up to ${role.name}`)
                                }
                            });
                        });
    
                        reaction.message.member.roles.add(role.id, `${reaction.message.author.username} has ranked up to ${role.name}`)
                        reaction.message.channel.send(`<@!${reaction.message.author.id}> has ranked up to ${role.name}`)
                    }
                    
                } catch (error) {
                    client.users.fetch('160424636369207296').then(user => {
                        user.send({ content: `I ran into this problem (adding roles): \n${error}` })
                    })
                }
                    /* 
                    
                        R E M O V I N G
                        R O L E S
    
                    */ 
                   try {
                        let gcds = uSave.guildCakeDays.filter(f => f.guildId == reaction.message.guild.id)[0]
                        let roles = [];
    
                        gSave.karmaRoles.forEach((kr, index) => {
                            reaction.message.member.roles.cache.each(role => {
                                if (gcds.karma > kr.milestone && role.id == kr.role && !roles.some(f => f == gSave.karmaRoles.findIndex(f => f == kr))) {
                                    roles.push(gSave.karmaRoles.findIndex(f => f == kr))
                                }
                            });
                        });
                        console.log(`[${roles}] || removing 1`)
                        roles.sort((a, b) => b - a);
                        console.log(`[${roles}] || removing 1`)
                        roles.shift()
    
                        roles.forEach(r => {
                            reaction.message.member.roles.remove(gSave.karmaRoles[r].role, `${reaction.message.author.username} meets the requirements for higher roles.`)
                            });
                    } catch (error) {
                        client.users.fetch('160424636369207296').then(user => {
                            user.send({ content: `I ran into this problem (removing roles 1): \n${error}` })
                        })
                    }

                    try {
                        let gcds = uSave.guildCakeDays.filter(f => f.guildId == reaction.message.guild.id)[0]
                        let roles = [];
    
                        gSave.karmaRoles.forEach((kr, index) => {
                            reaction.message.member.roles.cache.each(role => {
                                if (gcds.karma < kr.milestone && role.id == kr.role && !roles.some(f => gSave.karmaRoles.findIndex(f => f == kr))) {
                                    roles.push(gSave.karmaRoles.findIndex(f => f == kr))
                                }
                            });
                        });
                        console.log(`[${roles}] || removing 2`)
                        if (roles.length > 0) roles.sort((a, b) => a - b)
                        console.log(`[${roles}] || removing 2`)
                        if (roles.length == 0) roles = false 
        
                        if (roles) {
                            let role = reaction.message.guild.roles.cache.get(gSave.karmaRoles[roles[roles.length - 1]].role)
                            roles.forEach(r => {
                                reaction.message.member.roles.remove(gSave.karmaRoles[r].role, `${reaction.message.author.username} no longer meets the requirements for ${role.name}.`)
                            });
                            reaction.message.channel.send(`<@!${reaction.message.author.id}> has deranked from ${role.name}`)

                            if (roles[0] > 0) {
                                role = reaction.message.guild.roles.cache.get(gSave.karmaRoles[roles[roles[0] - 1]].role)
                                reaction.message.member.roles.add(role.id, `${reaction.message.author.username} no longer meets the requirements.`)
                                reaction.message.channel.send(`<@!${reaction.message.author.id}> has deranked to ${role.name}`)
                            } 
                        }
                    } catch (error) {
                        client.users.fetch('160424636369207296').then(user => {
                            user.send({ content: `I ran into this problem (removing roles 2): :\n${error}` })
                        })
                    }
            }

            let usersdb = (await getFromDB(secret.sql.database.views.users)).rows.filter(f => f.key == reaction.message.author.id)[0];
            let _rev = (await db.get(usersdb.id))._rev || false;
            await pushToDB({ _id: usersdb.id, _rev: _rev, isUser: true, data: uSave });

            console.log(`Saved ${reaction.message.member.displayName}'s new data.`)
    
        };

        let messageReactionRemove = async (reaction, user) => {

            if (reaction.message.partial) await reaction.message.fetch();
            if (reaction.partial) await reaction.fetch();
            if (user.id == reaction.message.author.id) return;
            if (user.bot) return;
            if (!reaction.message.guild) return;

            if (!(await getFromDB(secret.sql.database.views.reactionMsgs)).rows.some(f => f.value.msgId == reaction.message.id)) return;

            console.log('Hi there!')

            uSave = (await getFromDB(secret.sql.database.views.users)).rows.filter(f => f.key == reaction.message.author.id)[0].value
            gSave = (await getFromDB(secret.sql.database.views.guilds)).rows.filter(f => f.key == reaction.message.guildId)[0].value
            mSave = (await getFromDB(secret.sql.database.views.reactionMsgs)).rows.filter(f => f.value.msgId == reaction.message.id)[0].value

            if (new Date(mSave.deletionDate) <= new Date()) {
                db.destroy((await getFromDB(secret.sql.database.views.reactionMsgs)).rows.filter(f => f.value.msgId == reaction.message.id)[0].id)
                reaction.message.guild.channels.cache.each(ch => {
                    if (ch.name == 'botlog') {
                        ch.send(`Old Up/Down vote ticker deleted! (1 day old)`)
                        return;
                    }
                })
                return;
            }

            if (reaction.emoji.toString() === config.botEmojis.upvotes[0]) {
                console.log(`Awarded 1 posKarma to ${reaction.message.member.displayName}`)
                uSave.posKarma -= 1;
                let gcds = uSave.guildCakeDays.filter(f => f.guildId == reaction.message.guild.id)[0]
                let indGCDS = uSave.guildCakeDays.findIndex(f => f == gcds);
                uSave.guildCakeDays[indGCDS].posKarma -= 1;
                uSave.guildCakeDays[indGCDS].karma = uSave.guildCakeDays[indGCDS].posKarma - uSave.guildCakeDays[indGCDS].negKarma;
                
                uSave.karma = uSave.posKarma - uSave.negKarma
                uSave.guildCakeDays[indGCDS] = gcds
                console.log(`${reaction.message.author.username} Karma: ${uSave.karma}`)
            } else if (reaction.emoji.toString() === config.botEmojis.upvotes[1]) {
                console.log(`Awarded 1 negKarma to ${reaction.message.member.displayName}`)
                uSave.negKarma -= 1;
                let gcds = uSave.guildCakeDays.filter(f => f.guildId == reaction.message.guild.id)[0]
                let indGCDS = uSave.guildCakeDays.findIndex(f => f == gcds);
                uSave.guildCakeDays[indGCDS].negKarma -= 1;
                uSave.guildCakeDays[indGCDS].karma = uSave.guildCakeDays[indGCDS].posKarma - uSave.guildCakeDays[indGCDS].negKarma;

                uSave.karma = uSave.posKarma - uSave.negKarma
                uSave.guildCakeDays[indGCDS] = gcds
                console.log(`${reaction.message.author.username} Karma: ${uSave.karma}`)
            }

            if (gSave.karmaRoles[0].default == true && !reaction.message.member.permissions.has('MANAGE_GUILD', true)) {

                try { 
                    console.log(`Found Milestones for guild`)

                    let gcds = uSave.guildCakeDays.filter(f => f.guildId == reaction.message.guild.id)[0]
                    let roles = [];
    
                    /* 
                    
                        A D D I N G
                        R O L E S
    
                    */
                    roles = false;
    
                    gSave.karmaRoles.forEach((kr, index) => {
                            if (gcds.karma >= kr.milestone) {
                                roles = gSave.karmaRoles.findIndex(f => f == kr)
                            }
                    });
                    console.log(`${roles} || adding`)
                    if (reaction.message.member.roles.cache.has(gSave.karmaRoles[roles].role)) roles = false;

                    if (!roles && !gSave.karmaRoles.some(f => reaction.message.member.roles.cache.has(f.role))) {
                        console.log('!roles')
                        let role = reaction.message.guild.roles.cache.get(gSave.karmaRoles[0].role)
                        reaction.message.member.roles.add(role.id, `${reaction.message.author.username} has ranked up to ${role.name}`)
                        reaction.message.channel.send(`<@!${reaction.message.author.id}> has ranked up to ${role.name}`)
                    } else if (roles) {
                        console.log('roles')
                        let role = (await reaction.message.guild.roles.cache.get(gSave.karmaRoles[roles].role))
                        gSave.karmaRoles.forEach((kr, index) => {
                            reaction.message.member.roles.cache.each(r => {
                                if (r.id == kr.role) {
                                    if (index !== roles) reaction.message.member.roles.remove(role.id, `${reaction.message.author.username} has ranked up to ${role.name}`)
                                }
                            });
                        });
    
                        reaction.message.member.roles.add(role.id, `${reaction.message.author.username} has ranked up to ${role.name}`)
                        reaction.message.channel.send(`<@!${reaction.message.author.id}> has ranked up to ${role.name}`)
                    }
                    
                } catch (error) {
                    client.users.fetch('160424636369207296').then(user => {
                        user.send({ content: `I ran into this problem (adding roles): \n${error}` })
                    })
                }
                    /* 
                    
                        R E M O V I N G
                        R O L E S
    
                    */ 
                   try {
                        let gcds = uSave.guildCakeDays.filter(f => f.guildId == reaction.message.guild.id)[0]
                        let roles = [];
    
                        gSave.karmaRoles.forEach((kr, index) => {
                            reaction.message.member.roles.cache.each(role => {
                                if (gcds.karma > kr.milestone && role.id == kr.role && !roles.some(f => f == gSave.karmaRoles.findIndex(f => f == kr))) {
                                    roles.push(gSave.karmaRoles.findIndex(f => f == kr))
                                }
                            });
                        });
                        console.log(`[${roles}] || removing 1`)
                        roles.sort((a, b) => b - a);
                        console.log(`[${roles}] || removing 1`)
                        roles.shift()
    
                        roles.forEach(r => {
                            reaction.message.member.roles.remove(gSave.karmaRoles[r].role, `${reaction.message.author.username} meets the requirements for higher roles.`)
                            });
                    } catch (error) {
                        client.users.fetch('160424636369207296').then(user => {
                            user.send({ content: `I ran into this problem (removing roles 1): \n${error}` })
                        })
                    }

                    try {
                        let gcds = uSave.guildCakeDays.filter(f => f.guildId == reaction.message.guild.id)[0]
                        let roles = [];
    
                        gSave.karmaRoles.forEach((kr, index) => {
                            reaction.message.member.roles.cache.each(role => {
                                if (gcds.karma < kr.milestone && role.id == kr.role && !roles.some(f => gSave.karmaRoles.findIndex(f => f == kr))) {
                                    roles.push(gSave.karmaRoles.findIndex(f => f == kr))
                                }
                            });
                        });
                        console.log(`[${roles}] || removing 2`)
                        if (roles.length > 0) roles.sort((a, b) => a - b)
                        console.log(`[${roles}] || removing 2`)
                        if (roles.length == 0) roles = false 
        
                        if (roles) {
                            let role = reaction.message.guild.roles.cache.get(gSave.karmaRoles[roles[roles.length - 1]].role)
                            roles.forEach(r => {
                                reaction.message.member.roles.remove(gSave.karmaRoles[r].role, `${reaction.message.author.username} no longer meets the requirements for ${role.name}.`)
                            });
                            reaction.message.channel.send(`<@!${reaction.message.author.id}> has deranked from ${role.name}`)

                            if (roles[0] > 0) {
                                role = reaction.message.guild.roles.cache.get(gSave.karmaRoles[roles[roles[0] - 1]].role)
                                reaction.message.member.roles.add(role.id, `${reaction.message.author.username} no longer meets the requirements.`)
                                reaction.message.channel.send(`<@!${reaction.message.author.id}> has deranked to ${role.name}`)
                            } 
                        }
                    } catch (error) {
                        client.users.fetch('160424636369207296').then(user => {
                            user.send({ content: `I ran into this problem (removing roles 2): :\n${error}` })
                        })
                    }
            }

            let usersdb = (await getFromDB(secret.sql.database.views.users)).rows.filter(f => f.key == reaction.message.author.id)[0];
            let _rev = (await db.get(usersdb.id))._rev || false;
            await pushToDB({ _id: usersdb.id, _rev: _rev, isUser: true, data: uSave });

            console.log(`Saved ${reaction.message.member.displayName}'s new data.`)
    
        };
    
        client.on('messageReactionAdd', messageReactionAdd);

        client.on('messageReactionRemove', messageReactionRemove);
    }
}
