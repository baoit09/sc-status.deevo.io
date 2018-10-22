'use strict';
const constants = require(__dirname + '/constants');

function convertChannelInfo2JSON(info) {
    return {
        count: info.height.low,
        currentBlockHash: info.currentBlockHash.toString('hex'),
        previousBlockHash: info.previousBlockHash.toString('hex')
    }
}

module.exports.convertChannelInfo2JSON = convertChannelInfo2JSON;

function convertNode2JSON(node) {
    return {
        name: node._name,
        roles: node._roles,
    }
}

function convertNodeArray2JSON(nodes) {
    return nodes.map(convertNode2JSON);
}

module.exports.convertNodeArray2JSON = convertNodeArray2JSON;

function convertChannel2JSON(channel) {
    return {
        channel_name: constants.ChannelDict[channel.channel_id],
        channel_id: channel.channel_id,
    }
}

function convertChannelArray2JSON(channels) {
    return channels.channels.map(convertChannel2JSON).sort(function(a, b) {return a.channel_name.localeCompare(b.channel_name)});
}

module.exports.convertChannelArray2JSON = convertChannelArray2JSON;