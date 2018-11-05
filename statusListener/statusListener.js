const appRoot = require('app-root-path');
const fabricHelper = require(__dirname + '/../fabricClient/fabricHelper');
const client_utils = require(`${appRoot}/node_modules/fabric-client/lib/client-utils`);
const grpc = require(`grpc`);

const _commonProto = grpc.load(
    `${appRoot}/node_modules/fabric-client/lib/protos/common/common.proto`
).common;
const _serviceProto = grpc.load(
    `${appRoot}/node_modules/fabric-client/lib/protos/peer/admin.proto`
).protos;

function getPeerStatus(org, channelID, name) {
    return fabricHelper.encroll(org)
        .then((client) => {
            const channel = client.getChannel(channelID);
            const signer = client._adminSigningIdentity;
            const txId = client.newTransactionID(true);
            // build the header for use with the seekInfo payload
            const seekInfoHeader = client_utils.buildChannelHeader(
                _commonProto.HeaderType.PEER_ADMIN_OPERATION,
                channel._name,
                txId.getTransactionID(),
                channel._initial_epoch,
                null,
                client_utils.buildCurrentTimestamp(),
                channel._clientContext.getClientCertHash()
            );

            const seekHeader = client_utils.buildHeader(
                signer,
                seekInfoHeader,
                txId.getNonce()
            );

            const seekPayload = new _commonProto.Payload();
            seekPayload.setHeader(seekHeader);
            const seekPayloadBytes = seekPayload.toBuffer();
            const sig = signer.sign(seekPayloadBytes);
            const signature = Buffer.from(sig);

            const envelope = {
                signature,
                payload: seekPayloadBytes
            };
            return {
                peers: client.getPeersForOrgOnChannel(channelID),
                envelope: envelope
            }
        }).then((result) => {
            var peer = null;

            for (let p of result.peers) {
                console.log(`node ${p.getName()}`);
                if (p.getName() === name) {
                    peer = p;
                }
            }

            if (peer === null) {
                throw new Error(`Can not find peer ${name}`);
            }
            return getStatus(peer, result.envelope);
        })
}

module.exports.getPeerStatus = getPeerStatus;

function getOrdererStatus(org, channelID, name) {
    return fabricHelper.encrollOrdering(org)
        .then((client) => {
            let channel = client.getChannel(channelID);
            return channel.getOrderers();
        }).then((orderers) => {
            var orderer = null;

            for (let o of orderers) {
                console.log(`node ${o.getName()}`);
                if (o.getName() === name) {
                    orderer = o;
                }
            }

            if (orderer === null) {
                throw new Error(`Can not find orderer ${name}`);
            }
            return orderer;
        }).then((orderer) => {
            return orderer.sendBroadcast()
                .then(
                    function () {
                        console.log('Should have noticed missing data.');
                        return { status: 'RUNNING', name };
                    },
                    function (err) {
                        console.log('Successfully found missing data: ' + err);
                        var status = 'DOWN';
                        if (err.message === 'Missing data - Nothing to broadcast') {
                            status = 'RUNNING';
                        }
                        return { status: status, name }
                    }
                ).catch(function (err) {
                    console.log('Caught Error: should not be here if we defined promise error function: ' + err);
                    return { status: 'DOWN', name }
                });
        })
}

module.exports.getOrdererStatus = getOrdererStatus;

function getStatus(node, envelope) {
    endorserClient = new _serviceProto.Admin(
        node._endpoint.addr,
        node._endpoint.creds,
        node._options
    );

    let rto = node._request_timeout;

    return new Promise((resolve, reject) => {
        const send_timeout = setTimeout(() => {
            console.log('GetStatus - timed out after:%s', rto);
            return reject(new Error('REQUEST_TIMEOUT'));
        }, rto);

        endorserClient.GetStatus(envelope, (err, serverStatus) => {
            clearTimeout(send_timeout);
            let server_hostname;
            if (node._options['grpc.default_authority']) {
                server_hostname = node._options['grpc.default_authority'];
            } else {
                server_hostname = node._options['grpc.ssl_target_name_override'];
            }
            if (err) {
                console.log(
                    'Error GetStatus response from: %s status: %s',
                    node._url,
                    err
                );
                if (err instanceof Error) {
                    resolve({ status: 'DOWN', server_hostname });
                } else {
                    resolve({ status: 'DOWN', server_hostname });
                }
            } else {
                console.log(
                    'Received GetStatus response from peer %s: status - %j',
                    node._url,
                    serverStatus
                );
                var status = serverStatus.status;
                if (status === 'STARTED') {
                    status = 'RUNNING';
                }
                resolve({ status: status, server_hostname });
            }
        });
    });
}
