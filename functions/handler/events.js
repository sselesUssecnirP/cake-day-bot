
const { readdirSync } = require('fs');
const ascii = require('ascii-table');
const events = new ascii().setHeading('Event', 'isNormal?', 'Load Status')

module.exports = client => {

    readdirSync('./modules/events/').forEach(dir => {
        const commands = readdirSync(`./modules/events/${dir}/`).filter(f => f.endsWith('.js'))

        for (let file of commands) {
            let pull = require(`../../modules/events/${dir}/${file}`);

            console.log(`File ${file} located at ./modules/events/${dir}`);

            if (pull.name && pull.isNormal) {
                client.events.set(pull.name, pull);
                console.log(`Created event ${pull.name}`)
                events.addRow(`${pull.name}`, `${pull.isNormal}`, '✅')
            } else if (pull.name && !pull.isNormal) {
                client.manualEvents.set(pull.name, pull);
                console.log(`Created manual event ${pull.name}`);
                events.addRow(`${pull.name}`, `${pull.isNormal}`, '✅')
            } else {
                events.addRow(file, '', '❌ -> missing something??')
                continue;
            }
        }
    });

    console.log(events.toString())
}