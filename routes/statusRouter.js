var express = require('express');
var bodyParser = require('body-parser');
const convertObject = require('../utils/convertObject');
const mongo = require(__dirname + '/../utils/mongo');

const fabricHelper = require(__dirname + '/../fabricClient/fabricHelper');
const statusListener = require(__dirname + '/../statusListener/statusListener');

// ======================================================

var router = express.Router();
router.use(bodyParser.json());

// ======================================================
router.route('/network')
    .get(function (req, res, next) {
        let org = 'org1';
        return fabricHelper.encroll(org)
            .then((client) => {
                let peers = client.getPeersForOrg();
                return client.queryChannels(peers[0])
                    .then(channelQueryResponses => {
                        return res.json(convertObject.convertChannelArray2JSON(channelQueryResponses));
                    }).catch(err => {
                        if (err) return next(err);
                    });
            })
    });
// ======================================================

router.route('/channel/:channel_id')
    .get(function (req, res, next) {
        let org = 'org1';
        let channel_id = req.params.channel_id;
        return fabricHelper.encroll(org)
            .then((client) => {
                return client.getChannel(channel_id);
            })
            .then((channel) => {
                let channelInfo = channel.queryInfo()
                    .then(queryResponses => {
                        return convertObject.convertChannelInfo2JSON(queryResponses);
                    }).catch(err => {
                        if (err) return next(err);
                    });
                let allTransactionCount = mongo.countAllTransactionInChannel(channel_id);
                let todayTransactionCount = mongo.countTodayTransactionInChannel(channel_id);

                return Promise.all([channelInfo, allTransactionCount, todayTransactionCount]);
            })
            .then((results) => {
                let response = {
                    info: results[0],
                    tx_count: results[1],
                    tx_count_today: results[2]
                }
                return res.json(response)
            })
            .catch(err => {
                if (err) return next(err);
            });
    });
// ======================================================

router.route('/channel/:channel_id/orderers')
    .get(function (req, res, next) {
        let org = 'org1';
        let channel_id = req.params.channel_id;
        return fabricHelper.encroll(org)
            .then((client) => {
                return client.getChannel(channel_id);
            })
            .then((channel) => {
                return res.json(convertObject.convertNodeArray2JSON(channel.getOrderers()));
            })
            .catch(err => {
                if (err) return next(err);
            });
    });
// ======================================================

router.route('/channel/:channel_id/peers')
    .get(function (req, res, next) {
        let org = 'org1';
        let channel_id = req.params.channel_id;
        return fabricHelper.encroll(org)
            .then((client) => {
                return client.getChannel(channel_id);
            })
            .then((channel) => {
                return res.json(convertObject.convertNodeArray2JSON(channel.getPeers()));
            })
            .catch(err => {
                if (err) return next(err);
            });
    });
// ======================================================

router.route('/org/:org/channel/:channel/peer/:node')
    .get(function (req, res, next) {
        let org = req.params.org;
        let channel = req.params.channel;
        let node = req.params.node;
        return statusListener.getPeerStatus(org, channel, node)
            .then((response) => {
                return res.json(response);
            }).catch(err => {
                if (err) return next(err);
            });
    });
// ======================================================

router.route('/org/:org/channel/:channel/orderer/:node')
    .get(function (req, res, next) {
        let org = req.params.org;
        let channel = req.params.channel;
        let node = req.params.node;
        return statusListener.getOrdererStatus(org, channel, node)
            .then((response) => {
                return res.json(response);
            }).catch(err => {
                if (err) return next(err);
            });
    });
// ======================================================

module.exports = router;