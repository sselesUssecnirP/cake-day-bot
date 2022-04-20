const { Collection } = require("discord.js")
const { readdirSync } = require('fs')
const secret = process.env.secret || require('../../saves/config/secret.json');
const config = require('../../saves/config/config.json');
const db = require('nano')(secret.sql.url.replace(/{access}/,`${secret.sql.username}:${secret.sql.password}@`)).use('cake_day_bot');
const { getFromDB, pushToDB } = require('../funcs/basic')
module.exports = async client => {

    client.events = new Collection;
    client.manualEvents = new Collection;
    client.commands = new Collection;
    client.json = new Collection;
    client.lcommands = new Collection;
    client.aliases = new Collection;
    client.config = new Collection;
    client.guildMessage = new Collection;
    // Setup
    client.config.set('config', config);
    client.config.set('TOKEN', secret.TOKEN);

    /*    
    const users = await getFromDB({ design: 'saves', view: 'user' });
    const guilds = await getFromDB({ design: 'saves', view: 'guild' });
    users.rows.forEach((doc, ind) => {
        client.UserSaves.set(doc.key, doc.value);
    });
    guilds.rows.forEach(async (doc, ind, arr) => {
        client.GuildSaves.set(doc.key, doc.value);
        if (ind == arr.length - 1) {
            let log = await db.get(doc.id);
            console.log(log)
        }
    });

    /*
    
    Grab a specific save:
    usersusersdb = usersdb.rows.filter(f => f.key == key)[0]
    
    */

    //console.log(`============== DB Request ==============`)
    //console.log(users)
    //console.log(`============== DB Request ==============`)
    //console.log(guilds)
    //console.log(`============== DB Request ==============`)
    /*
    readdirSync('./saves/GuildSaves/').filter(f => f.endsWith('.json')).forEach(file => {

        let fileId = file.slice(0, -5)
        let content = require(`../../saves/GuildSaves/${file}`)
        
        client.GuildSaves.set(`${fileId}`, content)
    })

    readdirSync('./saves/UserSaves/').filter(f => f.endsWith('.json')).forEach(file => {

        let fileId = file.slice(0, -5)
        let content = require(`../../saves/UserSaves/${file}`)
        
        client.UserSaves.set(`${fileId}`, content)
    })
    */
}