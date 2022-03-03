const { formatDate, formatDateTime } = require('../../../functions/basic/basic');
const config = require('../../../saves/config/config.json')

module.exports = {
    // Name of the event
    name: "cakeDayCheck",
    // Description of the event
    description: "An event checking cake days on several different events.",
    // Should the event run instantly/constantly, or be called manually?
    isNormal: true,
    // The event's run function (what the event does)
    run: async (client) => {
    
        client.on('messageCreate', msg => {

            if (config.blocked.some(i => i == msg.author.id)) return;
            if (msg.author.bot) return;

            let uSave = client.UserSaves.get(msg.author.id);
            let gSave = client.GuildSaves.get(msg.guild.id);

            let curDate = formatDate();
            let cakeDay = formatDate(Date.parse(uSave.cakeDay));
            let gCakeDay = formatDate(Date.parse(uSave.guildCakeDays.filter(i => i.guildId == msg.guild.id)[0].guildCakeDay));

            if (curDate == cakeDay && !uSave.cakeDayMsg) {
                msg.reply(`Happy Discord Cake Day ${msg.member.displayName}! 🍰`);
                uSave.cakeDayMsg = true;
            }

            if (curDate == gCakeDay && !uSave.guildCakeDays.filter(cd => cd.guildId == msg.guild.id)[0].cakeDayMsg) {
                msg.reply(`Happy ${msg.guild.name} Cake Day ${msg.member.displayName}! 🍰`);
                uSave.guildCakeDays.each(cd => {
                    if (cd.guildId == msg.guild.id) {
                        cd.cakeDayMsg = true;
                    }
                });
            }

            client.UserSaves.set(msg.author.id, uSave);
        });
    }
}