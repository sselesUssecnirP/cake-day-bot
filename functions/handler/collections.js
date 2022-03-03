const { Collection } = require("discord.js")
const { readdirSync } = require('fs')
const config = require('../../saves/config/config.json')
const token = process.env.TOKEN || require('../../saves/config/token.json')

module.exports = client => {

    client.events = new Collection;
    client.manualEvents = new Collection;
    client.commands = new Collection;
    client.json = new Collection;
    client.lcommands = new Collection;
    client.aliases = new Collection;
    client.config = new Collection;
    client.UserSaves = new Collection;
    client.GuildSaves = new Collection;

    // Setup
    client.config.set('config', config)
    client.config.set('TOKEN', token)

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
}