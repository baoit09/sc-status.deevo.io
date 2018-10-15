var express = require('express');
var bodyParser = require('body-parser');
const convertObject = require('../utils/convertObject');
const mongo = require(__dirname + '/../utils/mongo');

var Client = require('fabric-client');
var client = Client.loadFromConfig('configs/fabric-network-config/connection-profile.yaml');
// ======================================================

function encroll(org) {
    var caService;
    let username = `admin-${org}`;
    let password = `admin-${org}pw`;
    console.log(`Encroll with username ${username}`);
    client.loadFromConfig(`configs/fabric-network-config/${org}-profile.yaml`);

    // init the storages for client's state and cryptosuite state based on connection profile configuration 
    return client.initCredentialStores()
        .then(() => {
            // tls-enrollment
            caService = client.getCertificateAuthority();
            return caService.enroll({
                enrollmentID: username,
                enrollmentSecret: password,
                profile: 'tls',
                attr_reqs: [
                    { name: "hf.Registrar.Roles" },
                    { name: "hf.Registrar.Attributes" }
                ]
            }).then((enrollment) => {
                console.log('Successfully called the CertificateAuthority to get the TLS material');
                let key = enrollment.key.toBytes();
                let cert = enrollment.certificate;

                // set the material on the client to be used when building endpoints for the user
                client.setTlsClientCertAndKey(cert, key);
                return client.setUserContext({ username: username, password: password });
            })
        })
}
// ======================================================

var router = express.Router();
router.use(bodyParser.json());

// ======================================================
router.route('/network')
    .get(function (req, res, next) {
        let org = 'org1';
        return encroll(org)
            .then(() => {
                let peers = client.getPeersForOrg();
                return client.queryChannels(peers[0])
                    .then(channelQueryResponses => {
                        return res.json(channelQueryResponses);
                    }).catch(err => {
                        if (err) return next(err);
                    });
            })
    });
// ======================================================

router.route('/channel/:channel_name')
    .get(function (req, res, next) {
        let org = 'org1';
        let channel_name = req.params.channel_name;
        return encroll(org)
            .then(() => {
                return client.getChannel(channel_name);
            })
            .then((channel) => {
                let channelInfo = channel.queryInfo()
                    .then(queryResponses => {
                        return convertObject.convertChannelInfo2JSON(queryResponses);
                    }).catch(err => {
                        if (err) return next(err);
                    });
                let allTransactionCount = mongo.countAllTransactionInChannel(channel_name);
                let todayTransactionCount = mongo.countTodayTransactionInChannel(channel_name);

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

router.route('/channel/:channel_name/orderers')
    .get(function (req, res, next) {
        let org = 'org1';
        let channel_name = req.params.channel_name;
        return encroll(org)
            .then(() => {
                return client.getChannel(channel_name);
            })
            .then((channel) => {
                return res.json(convertObject.convertNodeArray2JSON(channel.getOrderers()));
            })
            .catch(err => {
                if (err) return next(err);
            });
    });
// ======================================================

router.route('/channel/:channel_name/peers')
    .get(function (req, res, next) {
        let org = 'org1';
        let channel_name = req.params.channel_name;
        return encroll(org)
            .then(() => {
                return client.getChannel(channel_name);
            })
            .then((channel) => {
                return res.json(convertObject.convertNodeArray2JSON(channel.getPeers()));
            })
            .catch(err => {
                if (err) return next(err);
            });
    });
// ======================================================

module.exports = router;