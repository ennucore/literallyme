const firebase = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

firebase.initializeApp();
const firestore = getFirestore("generations-db");

module.exports = { firebase, firestore }