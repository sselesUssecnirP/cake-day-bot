
const { readdirSync, readdir } = require('fs');
const ascii = require('ascii-table');
const acommands = new ascii().setHeading("Command (New)", "Load Status");
const lcommands = new ascii().setHeading("Commands (Legacy)", "Aliases", "Load Status")
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

module.exports = client => {
    const token = process.env.TOKEN || require('../../saves/config/token.json').TOKEN;


    (async () => {
        readdirSync('./modules/commands/legacy').forEach(dir => {
            const commands = readdirSync(`./modules/commands/legacy/${dir}/`).filter(f => f.endsWith('.js'))
    
            for (let file of commands) {
                let pull = require(`../../modules/commands/legacy/${dir}/${file}`);
    
                console.log(`File ${file} located at ./modules/legacy/${dir}`);
    
                if (pull.name) {
                    client.lcommands.set(pull.name, pull);
                    console.log(`Created legacy cmd ${pull.name}`)
                    lcommands.addRow(`${pull.name}`, `${pull.aliases}`, '✅')
                } else {
                    lcommands.addRow(file, '', '❌ -> missing something??')
                    continue;
                }

                if (pull.aliases && Array.isArray(pull))
                    pull.aliases.forEach(alias => client.aliases.set(alias, pull.name));
            }
        });

        console.log(lcommands.toString())
    })();

    (async () => {
        let files;
        let json = [];
        let commands;

        readdirSync('./modules/commands/slash/json').forEach(dir => {
            files = readdirSync(`./modules/commands/slash/json/${dir}/`).filter(f => f.endsWith('.js'))

            for (let file of files) {
                let pull = require(`../../modules/commands/slash/json/${dir}/${file}`);

                console.log(`File ${file} located at ./modules/slash/${dir}`);

                if (pull) {
                    json.push(pull);
                } else {
                    continue;
                };
            };
        });

        readdirSync('./modules/commands/slash/run').forEach(dir => {
            commands = readdirSync(`./modules/commands/slash/run/${dir}/`).filter(f => f.endsWith('.js'));

            for (let file in commands) {
                let pull = require(`../../modules/commands/slash/run/${dir}/${file}`);
    
                console.log(`File ${file} located at ./modules/slash/run/${dir}`);
    
                if (pull.name) {
                    client.commands.set(pull.name, pull);
                    console.log(`Created cmd ${pull.name}`)
                    acommands.addRow(`${pull.name}`, '✅')
                } else {
                    acommands.addRow(file, '❌ -> missing something??')
                    continue;
                };
            };

            console.log(acommands.toString());

            const rest = new REST({ version: '9' }).setToken(token);

            (async () => {
                try {
                    console.log('Started refreshing application (/) commands.')

                    await rest.put(
                        Routes.applicationCommands(''),
                        { body: json }
                    )

                    await rest.put(
                        Routes.applicationGuildCommands('', ''),
                        { body: json }
                    );

                    console.log('Successfully reloaded application (/) commands.');
                } catch (error) {
                    console.error(error)
                }
            });
        });
    })();
}