const secret = require('../../saves/config/secret.json');
const db = require('nano')(secret.sql.url.replace(/{access}/,`${secret.sql.username}:${secret.sql.password}@`)).use(secret.sql.database.name);
const nano = require('nano')

module.exports = {
    database: require('nano')(secret.sql.url.replace(/{access}/,`${secret.sql.username}:${secret.sql.password}@`)).use(secret.sql.database.name),
    getFromDB: async (opts) => {
        let body = await db.view(opts.design, opts.view);
        return body;
    
      },
    getDB: async (opts) => {
        return (await db.get(opts))

    },
    pushToDB: async (opts) => {
        await db.insert(opts)
        return;
      }
}