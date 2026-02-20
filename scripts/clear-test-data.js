/**
 * One-time script to clear all test memorials and notifications from Firestore.
 * Run with: node scripts/clear-test-data.js
 * 
 * Uses the Firebase client SDK with the same config as the app.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch } from 'firebase/firestore';

// Read firebase config from the app's config file
const firebaseConfig = {
    apiKey: "AIzaSyAn6apvV6E4nrCU15vmgOWWtvyk2_Dr13w",
    authDomain: "wolo-5fbcd.firebaseapp.com",
    projectId: "wolo-5fbcd",
    storageBucket: "wolo-5fbcd.firebasestorage.app",
    messagingSenderId: "1010068919589",
    appId: "1:1010068919589:web:2d20b2a239b2b83a4e36cc",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clearCollection(collectionName) {
    console.log(`\n🔍 Fetching all ${collectionName}...`);
    const snapshot = await getDocs(collection(db, collectionName));

    if (snapshot.empty) {
        console.log(`✅ ${collectionName} is already empty.`);
        return 0;
    }

    console.log(`🗑️  Deleting ${snapshot.size} ${collectionName}...`);

    const batchSize = 500;
    const docs = snapshot.docs;
    let deleted = 0;

    for (let i = 0; i < docs.length; i += batchSize) {
        const batch = writeBatch(db);
        const chunk = docs.slice(i, i + batchSize);
        chunk.forEach(d => batch.delete(d.ref));
        await batch.commit();
        deleted += chunk.length;
        console.log(`   Deleted ${deleted}/${docs.length}`);
    }

    console.log(`✅ Cleared ${deleted} ${collectionName}.`);
    return deleted;
}

async function main() {
    console.log('═══════════════════════════════════════');
    console.log('  Kamgbunli Legacy — Test Data Cleanup');
    console.log('═══════════════════════════════════════');

    try {
        const memorials = await clearCollection('memorials');
        const notifications = await clearCollection('notifications');

        console.log('\n══════════════════════════════');
        console.log(`  Done! Cleared ${memorials} memorials, ${notifications} notifications.`);
        console.log('  The app is now production-ready.');
        console.log('══════════════════════════════\n');
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }

    process.exit(0);
}

main();
