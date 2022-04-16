
module.exports = {
    // Name of the event
    name: "commands",
    // Description of the event
    description: "A messageCreate event that emits and tests for commands being run.",
    // Should the event run instantly/constantly, or be called manually?
    isNormal: true,
    // The event's run function (what the event does)
    run: async (client) => {

        let config = require('../../../saves/config/config.json')

        client.on('messageCreate', async msg => {

            if (config.blocked.some(i => i == msg.author.id)) return;
            if (msg.author.bot) return;

            if (msg.content.toLowerCase().startsWith(config.prefix)) {

                console.log(`Command Received`)

                let args = msg.content.slice(config.prefix.length).split(/ +/g);
                let command = args.shift();
                let cmd = await client.lcommands.get(command);
                
                console.log(`Arguments: ${args}Command: ${command}`)

                if (command.length === 0) return;

                if (!cmd)
                    cmd = await client.commands.get(await client.aliases.get(command));
            
                if (cmd.category !== 'owner' || cmd.category !== 'moderation')
                    cmd.run(client, msg, args);
                else if (cmd.category == 'moderation') 
                    if (msg.member.permissions.has('MANAGE_GUILD', true) || config.approved.some(i => i == msg.author.id))
                        cmd.run(client, msg, args);
                else if (cmd.category == 'owner')
                    if (msg.author.id == config.owner)
                        cmd.run(client, msg, args);
                else {
                    let reply = await msg.reply(`Your command provided was invalid.`);
                    setTimeout(() => reply.delete(), 5000);
                };
            }
        });
    }
};