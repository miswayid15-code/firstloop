const { db } = require('./config/firebase');

(async () => {
    try {

        const snapshot =
            await db.collection('chats').get();

        console.log('Chats:', snapshot.size);

    } catch (err) {

        console.error(err);

    }
})();