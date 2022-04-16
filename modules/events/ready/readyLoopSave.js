const { getFromDB, pushToDB } = require('../../../functions/basic/basic');
const secret = require('../../../saves/config/secret.json');
const db = require('nano')(secret.sql.url.replace(/{access}/,`${secret.sql.username}:${secret.sql.password}@`)).use('cake_day_bot');
 
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

            client.GuildSaves.each(async gS => {
                let guildsdb = await getFromDB({ design: 'saves', view: 'guild' })
                usersdb = usersdb.rows.filter(f => f.key == gS.id)[0];
                let _rev = await db.get(guildsdb.id)._rev;
                pushToDB({ id: guildsdb.id, rev: _rev, data: gS });
            });

            client.UserSaves.each(async uS => {
                let usersdb = await getFromDB({ design: 'saves', view: 'user' })
                usersdb = usersdb.rows.filter(f => f.key == uS.id)[0];
                let _rev = await db.get(usersdb.id)._rev;
                pushToDB({ id: usersdb.id, rev: _rev, data: uS });
            });
        };

        setInterval(saveLoop, 1800000)
    }
};