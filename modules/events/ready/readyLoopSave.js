const { writeFileSync } = require('fs')
 
module.exports = {
    // Name of the event
    name: "readyLoopSave",
    // Description of the event
    description: "An event that runs on ready, and starts a loop.",
    // Should the event run instantly/constantly, or be called manually?
    isNormal: true,
    // The event's run function (what the event does)
    run: async (client) => {
        

        console.log(`Client ready to start saving data.`)

        const saveLoop = () => {

            client.GuildSaves.each(gS => {
                writeFileSync(`./saves/GuildSaves/${gS.id}.json`, JSON.stringify(gS, null, '\t'))
            });

            client.UserSaves.each(uS => {
                writeFileSync(`./saves/UserSaves/${uS.id}.json`, JSON.stringify(uS, null, '\t'))
            });
        };

        setInterval(saveLoop, 1800000)
    }
};