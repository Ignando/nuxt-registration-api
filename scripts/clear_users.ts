import db from '../server/utils/db'
db.prepare('DELETE FROM users').run()
db.prepare('DELETE FROM sqlite_sequence WHERE name=?').run('users') // optional
console.log('Cleared users table.')
