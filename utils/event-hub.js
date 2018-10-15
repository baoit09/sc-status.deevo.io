'use strict';

const mongo = require(__dirname + '/mongo');
const fabricHelper = require(__dirname + '/../fabricClient/fabricHelper');

const readline = require('readline');
const fs = require('fs');

const latestBlockID = 'latest_block_id';

// ======================================================

function registerEventHub(org, channelID) {
    const collectionName = `latest-block-${channelID}`;
    return mongo.findByID(latestBlockID, collectionName)
        .then((doc) => {
            if (doc === null || doc === undefined) {
                doc = {
                    _id: latestBlockID,
                    num: -1
                };
                return mongo.insert(doc, collectionName);
            }
            return doc;
        })
        .then((doc) => {
            console.log('doc ' + JSON.stringify(doc));
            return fabricHelper.encroll(org)
                .then((client) => {
                    return client.getChannel(channelID);
                })
                .then((channel) => {
                    let peer = channel.getPeers()[0];
                    // peer._request_timeout = 10000;
                    let eventHub = channel.newChannelEventHub(peer);

                    let block_reg = eventHub.registerBlockEvent((block) => {
                        console.log(`Successfully received the block #${block.header.number} from channel ${channelID}`);
                        doc.num = block.header.number;
                        mongo.update({ _id: latestBlockID }, { num: block.header.number }, collectionName);
                        mongo.saveTransactionFromBlock(block, channelID);
                    }, (error) => {
                        console.log('Failed to receive the block event ::' + error);
                    },
                        { startBlock: parseInt(doc.num), unregister: true, disconnect: true } // get the latest block to avod timeout
                    );
                    eventHub.connect(true);
                    return [eventHub, block_reg];
                })
                .catch(err => {
                    console.log(err);
                });
        })
}

class BlockListener {
    constructor() {
        this._hubs = {}
        this._block_reg = {}

        const rl = readline.createInterface({
            input: fs.createReadStream(__dirname + '/../configs/fabric-network-config/channels.txt'),
            crlfDelay: Infinity
        });
    
        rl.on('line', (channelID) => {
            registerEventHub('org1', channelID)
            .then((results) => {
                this._hubs[`${channelID}`] = results[0];
                this._block_reg[`${channelID}`] = results[1];
            });
            console.log(channelID);
        });
    }

    restartEventHubs() {
        for (let channel in this._hubs) {
            console.log(`${channel}, connected ${this._hubs[channel].isconnected()}`);
            // console.log(this._block_reg[channel]);
            if (!this._hubs[channel].isconnected()) {
                this._hubs[channel].connect(true);
            }
        }
    }
}

module.exports = BlockListener;