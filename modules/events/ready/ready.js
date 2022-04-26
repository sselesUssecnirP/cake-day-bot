const { getFromDB, pushToDB, getDB } = require('../../../functions/funcs/database');
const secret = require('../../../saves/config/secret.json');
const config = require('../../../saves/config/config.json');
const db = require('nano')(secret.sql.url.replace(/{access}/,`${secret.sql.username}:${secret.sql.password}@`)).use(secret.sql.database.name);

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

            const periodic = async () => {

                let mSaves = (await getFromDB(secret.sql.database.views.reactionMsgs))
                
                mSaves.rows.forEach(mSave => {
                    if (new Date(mSave.value.deleteDate) <= new Date()) {
                        db.destroy(mSave.id, mSave.doc._rev)
                    }
                });


            }

            setInterval(periodic, 3.6e+6)
            periodic();
        });
    }
}