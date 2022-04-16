

module.exports = {
    // Name of the event
    name: "ready",
    // Description of the event
    description: "An event that runs when the bot is ready for work.",
    // Should the event run instantly/constantly, or be called manually?
    isNormal: true,
    // The event's run function (what the event does)
    run: async (client) => {
        
        client.on('ready', () => {

            console.log('Cake Day Bot is ready for work!')
        });
    }
}