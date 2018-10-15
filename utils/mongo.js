'use strict';

const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const assert = require('assert');

// Connection URL
const url = 'mongodb://localhost:27017';
const dbName = 'network';

function insert(doc, collectionName) {
    return MongoClient.connect(url)                             // connect to mongo server
        .then(client => client.db(dbName)                       // get mongoClient object and connect to artbot db
            .collection(collectionName)                         // connect to the artistdb collection
            .insertOne(doc)                                     // perform your query
            .then(result => (client.close(), result.ops[0])))   // close db and return array from query result
        .catch(e => console.log(e));
}

module.exports.insert = insert;

function update(filter, newValues, collectionName) {
    return MongoClient.connect(url)                         // connect to mongo server
        .then(client => client.db(dbName)                   // get mongoClient object and connect to artbot db
            .collection(collectionName)                     // connect to the artistdb collection
            .updateOne(filter, { $set: newValues })           // perform your query
            .then(result => (client.close(), result)))      // close db and return array from query result
        .catch(e => console.log(e));
}

module.exports.update = update;

function findByID(id, collectionName) {
    return MongoClient.connect(url)                         // connect to mongo server
        .then(client => client.db(dbName)                   // get mongoClient object and connect to artbot db
            .collection(collectionName)                     // connect to the artistdb collection
            .findOne({ _id: id })                           // perform your query
            .then(result => (client.close(), result)))      // close db and return array from query result
        .catch(e => console.log(e));
}

module.exports.findByID = findByID;

function insertTransactionFromBlock(block, channelID) {
    let number = block.header.number;
    for (let data of block.data.data) {
        let tx_id = data.payload.header.channel_header.tx_id;
        let time = data.payload.header.channel_header.timestamp;
        let unix = Date.parse(time);
        let id;
        if (tx_id === '') {
            id = ObjectID();
        } else {
            id = tx_id;
        }
        let doc = {
            _id: id,
            block_number: number,
            tx_id: tx_id,
            time: unix
        }
        insert(doc, channelID);
    }
}

module.exports.insertTransactionFromBlock = insertTransactionFromBlock;

function countAllTransactionInChannel(channelID) {

    return MongoClient.connect(url)
        .then(client => client.db(dbName)
            .collection(channelID)
            .countDocuments({})
            .then(result => (client.close(), result)))
        .catch(e => console.log(e));
}

module.exports.countAllTransactionInChannel = countAllTransactionInChannel;

function countTodayTransactionInChannel(channelID) {
    var start = new Date();
    start.setHours(0, 0, 0, 0);
    var end = new Date();
    end.setHours(23, 59, 59, 999);

    const filter = {
        "time": {
            "$gte": start.getTime(),
            "$lt": end.getTime()
        }
    }
    return MongoClient.connect(url)
        .then(client => client.db(dbName)
            .collection(channelID)
            .countDocuments(filter)
            .then(result => (client.close(), result)))
        .catch(e => console.log(e));
}

module.exports.countTodayTransactionInChannel = countTodayTransactionInChannel;