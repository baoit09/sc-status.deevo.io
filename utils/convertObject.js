'use strict';

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