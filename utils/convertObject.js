'use strict';

function convertChannelInfo2JSON(info) {
    return {
        count: info.height.low,
        currentBlockHash: info.currentBlockHash.toString('hex'),
        previousBlockHash: info.previousBlockHash.toString('hex')
    }
}

module.exports.convertChannelInfo2JSON = convertChannelInfo2JSON;