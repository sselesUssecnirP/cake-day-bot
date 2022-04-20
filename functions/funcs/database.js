const secret = require('../../saves/config/secret.json');
const db = require('nano')(secret.sql.url.replace(/{access}/,`${secret.sql.username}:${secret.sql.password}@`)).use('cake_day_bot');

module.exports = {
    database: require('nano')(secret.sql.url.replace(/{access}/,`${secret.sql.username}:${secret.sql.password}@`)).use('cake_day_bot'),
    getFromDB: async (opts) => {
        let body = await db.view(opts.design, opts.view);
        return body;
    
      },
    pushToDB: async (opts) => {
        if (opts._rev) await db.insert(opts)
        else await db.insert(opts);
        return;
      }
}