const { Client, Intents } = require('discord.js');
const token = process.env.TOKEN || require('./saves/config/secret.json').TOKEN;
const config = require('./saves/config/config.json');

const handlers = ["collections", "events", "commands"]

const client = new Client({
    partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_BANS,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILD_PRESENCES,
        Intents.FLAGS.GUILD_SCHEDULED_EVENTS
    ],
    allowedMentions: { parse: ['users', 'roles'], repliedUser: true },
    presence: {
        status: 'online',
        activities: [
            {
                name: `${config.prefix} | Cake Day ${config.version}`,
                type: 'LISTENING'
            }
        ],
        afk: false
    }
});

handlers.forEach(handler => {
    require(`./functions/handler/${handler}`)(client)
})

client.events.each(e => e.run(client))

client.login(token)