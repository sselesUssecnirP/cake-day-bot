const { getFromDB, pushToDB } = require('../../../functions/funcs/database');
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

            //let skipAntiAuthorReact = reaction.message.member.displayName == secret.secrets.antiAuthorReact || reaction.message.author.discriminator == secret.secrets.antiAuthorReactDiscrim

            if (reaction.message.partial) await reaction.message.fetch();
            if (reaction.partial) await reaction.fetch();
            if (user.id == reaction.message.author.id && !skipAntiAuthorReact && !client.user.id !== "805489417938010133") return;
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
                console.log(`${reaction.message.author.username} Karma: ${uSave.karma}`)
            } else if (reaction.emoji.toString() === config.botEmojis.upvotes[1]) {
                console.log(`Awarded 1 negKarma to ${reaction.message.member.displayName}`)
                uSave.negKarma += 1;
                let gcds = uSave.guildCakeDays.filter(f => f.guildId == reaction.message.guild.id)[0]
                let indGCDS = uSave.guildCakeDays.findIndex(f => f == gcds);
                uSave.guildCakeDays[indGCDS].negKarma += 1;
                uSave.guildCakeDays[indGCDS].karma = uSave.guildCakeDays[indGCDS].posKarma - uSave.guildCakeDays[indGCDS].negKarma;

                uSave.karma = uSave.posKarma - uSave.negKarma
                console.log(`${reaction.message.author.username} Karma: ${uSave.karma}`)
            }

            if (gSave.karmaRoles[0].default == true && !reaction.message.member.permissions.has('MANAGE_GUILD', true)) {

                /* 
                
                    A D D I N G 
                    R O L E S 
                
                */

                try { 

                    let gcds = uSave.guildCakeDays.findIndex(f => f.guildId == reaction.message.guild.id)
                    let currentRoles = [];
                    let role;
                    let removeRoles = [];


                    gSave.karmaRoles.forEach((r, ind) => {
                        if (uSave.guildCakeDays[gcds].karma > r.milestone) {
                            currentRoles.push({ role: ind, hasRole: !reaction.message.member.roles.has(r.role) });
                        };
                    });
                    
                    currentRoles.sort((a, b) => b.role - a.role);
                    if (currentRoles[0].hasRole) role = currentRoles.shift();
                    else currentRoles.shift();
                    removeRoles = currentRoles.filter(f => f.hasRole);

                    if (role.hasRole) {
                        reaction.message.member.roles.add(gSave.karmaRoles[role.role].role, `${reaction.message.author.username} has ranked up!`)
                        reaction.message.channel.send({ content: `${reaction.message.member.displayName} has ranked up to ${reaction.message.guild.roles.cache.get(gSave.karmaRoles[role.role].role).name}!` })
                    };

                    if (removeRoles.length > 0) {
                        removeRoles.forEach(r => {
                            reaction.message.member.roles.remove(gSave.karmaRoles[r.role].role, `${reaction.message.author.username} meets the requirements for a higher role.`)
                        });
                    };

                } catch (error) {
                    client.users.fetch('160424636369207296').then(user => {
                        user.send({ content: `I ran into this problem (role promotion++): :\n${error}` });
                    });
                };
                    /* 
                    
                        R E M O V I N G
                        R O L E S
    
                    */ 
                   try {
                            
                        let gcds = uSave.guildCakeDays.findIndex(f => f.guildId == reaction.message.guild.id)
                        let currentRoles = [];
                        let removeAllRoles;
                        let removeRoles = [];


                        gSave.karmaRoles.forEach((r, ind) => {
                            if (uSave.guildCakeDays[gcds].karma < r.milestone && reaction.message.member.roles.has(r.role)) {
                                currentRoles.push(ind);
                            };
                        });
                        
                        currentRoles.sort((a, b) => a.role - b.role);
                        if (currentRoles[0] == 0) {
                            removeAllRoles = true;
                        } else {
                            removeAllRoles = false;
                        }

                        if (removeAllRoles) {
                            currentRoles.forEach(r => {
                                reaction.message.member.roles.remove(gSave.karmaRoles[r].role, `${reaction.message.author.username} no longer meets the requirements for this role.`)
                            });
                        } else if (!removeAllRoles) {
                            currentRoles.forEach((r, ind) => {
                                reaction.message.member.roles.remove(gSave.karmaRoles[r].role, `${reaction.message.author.username} meets the requirements for a higher role.`)
                                reaction.message.member.roles.add(gSave.karmaRoles[currentRoles[0]], `${reaction.message.author.username} deranked.`)
                                reaction.message.channel.send({ content: `${reaction.message.member.displayName} has deranked to ${reaction.message.guild.roles.cache.get(gSave.karmaRoles[currentRoles[0]].role)}!` })
                            });
                        };

                    } catch (error) {
                        client.users.fetch('160424636369207296').then(user => {
                            user.send({ content: `I ran into this problem (role demotion++): :\n${error}` })
                        });
                    };
            };

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

                /* 
                
                    A D D I N G 
                    R O L E S 
                
                */

                    try { 

                        let gcds = uSave.guildCakeDays.findIndex(f => f.guildId == reaction.message.guild.id)
                        let currentRoles = [];
                        let role;
                        let removeRoles = [];
    
    
                        gSave.karmaRoles.forEach((r, ind) => {
                            if (uSave.guildCakeDays[gcds].karma > r.milestone) {
                                currentRoles.push({ role: ind, hasRole: !reaction.message.member.roles.has(r.role) });
                            };
                        });
                        
                        currentRoles.sort((a, b) => b.role - a.role);
                        if (currentRoles[0].hasRole) role = currentRoles.shift();
                        else currentRoles.shift();
                        removeRoles = currentRoles.filter(f => f.hasRole);
    
                        if (role.hasRole) {
                            reaction.message.member.roles.add(gSave.karmaRoles[role.role].role, `${reaction.message.author.username} has ranked up!`)
                            reaction.message.channel.send({ content: `${reaction.message.member.displayName} has ranked up to ${reaction.message.guild.roles.cache.get(gSave.karmaRoles[role.role].role).name}!` })
                        };
    
                        if (removeRoles.length > 0) {
                            removeRoles.forEach(r => {
                                reaction.message.member.roles.remove(gSave.karmaRoles[r.role].role, `${reaction.message.author.username} meets the requirements for a higher role.`)
                            });
                        };
    
                    } catch (error) {
                        client.application.owner.send({ content: `I ran into this problem (role promotion++): :\n${error}` });
                    };
                        /* 
                        
                            R E M O V I N G
                            R O L E S
        
                        */ 
                       try {
                                
                            let gcds = uSave.guildCakeDays.findIndex(f => f.guildId == reaction.message.guild.id)
                            let currentRoles = [];
                            let removeAllRoles;
                            let removeRoles = [];
    
    
                            gSave.karmaRoles.forEach((r, ind) => {
                                if (uSave.guildCakeDays[gcds].karma < r.milestone && reaction.message.member.roles.has(r.role)) {
                                    currentRoles.push(ind);
                                };
                            });
                            
                            currentRoles.sort((a, b) => a.role - b.role);
                            if (currentRoles[0] == 0) {
                                removeAllRoles = true;
                            } else {
                                removeAllRoles = false;
                            }
    
                            if (removeAllRoles) {
                                currentRoles.forEach(r => {
                                    reaction.message.member.roles.remove(gSave.karmaRoles[r].role, `${reaction.message.author.username} no longer meets the requirements for this role.`)
                                });
                            } else if (!removeAllRoles) {
                                currentRoles.forEach((r, ind) => {
                                    reaction.message.member.roles.remove(gSave.karmaRoles[r].role, `${reaction.message.author.username} meets the requirements for a higher role.`)
                                    reaction.message.member.roles.add(gSave.karmaRoles[currentRoles[0]], `${reaction.message.author.username} deranked.`)
                                    reaction.message.channel.send({ content: `${reaction.message.member.displayName} has deranked to ${reaction.message.guild.roles.cache.get(gSave.karmaRoles[currentRoles[0]].role)}!` })
                                });
                            };
    
                        } catch (error) {
                            client.users.fetch('160424636369207296').then(user => {
                                user.send({ content: `I ran into this problem (role demotion++): :\n${error}` })
                            });
                        };
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
