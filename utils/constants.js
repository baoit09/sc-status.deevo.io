'use strict';

var os = require('os');
var path = require('path');

var tempdir = path.join(os.tmpdir(), 'hfc');

module.exports = {
    tempdir: tempdir        
};

module.exports.ObjectTypes = {};
module.exports.ObjectTypes.Org = 'org';
module.exports.ObjectTypes.Party = 'party';
module.exports.ObjectTypes.Location = 'location';
module.exports.ObjectTypes.Asset = 'asset';
module.exports.ObjectTypes.Product = 'product';
module.exports.ObjectTypes.Log = 'log';
module.exports.ObjectTypes.Auditor = 'auditor';
module.exports.ObjectTypes.AuditAction = 'auditAction';
module.exports.ObjectTypes.Supplychain = 'supplychain';

// Deevo's test net
module.exports.ChannelDict = {
    mychannel: 'AimThaiFruit Channel',
    channel1: 'DEEVO Channel'
}
module.exports.ChannelName = 'mychannel'
module.exports.ChainCodeId = 'supplychain'

// Bao's traning net
// module.exports.ChannelName = 'baotestchannel'
// module.exports.ChainCodeId = 'food_supplychain'

module.exports.OrgAdmin = {}
module.exports.OrgAdmin.Username = 'admin-org1'
module.exports.OrgAdmin.Password = 'admin-org1pw'
