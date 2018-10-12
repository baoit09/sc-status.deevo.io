$(document).ready(function () {
    // getChannelInfo();
});

function getErrorMessage(error) {
    const messageRe = /(message:.*\)<)/;
    const headerRe = /(<h1>(.|\n)*?<\/h1>)/;

    if (messageRe.test(error)) {
        let m = error.match(messageRe);
        if (m.length > 0) {
            var temp = m[0].split(")<")[0];
            temp = temp.split("message:")[1];
            return `<strong>${temp}</strong>`;
        }
    } else if (headerRe.test(error)) {
        let m = error.match(headerRe);
        if (m.length > 0) {
            var temp = m[0].split("</h1>")[0];
            temp = temp.split("<h1>")[1];
            return `<strong>${temp}</strong>`;
        }
    }

    return error
}

function showChannelError(e) {
    let info = $('#error-channel-div');
    info.html('');
    info.append(getErrorMessage(e.responseText));
    info.show();
}

function hideChannelError() {
    let info = $('#error-channel-div');
    info.html('');
    info.hide();
}

function getChannelInfo(channelID) {
    getPeers(channelID);
    getOrderers(channelID);

    $('#channel-root-container').show();
    hideChannelError();

    $.get(`/api/v1/status/channel/${channelID}`,
        {},
        function (result) {
            var info = $('#info');
            info.html("");
            info.append(`<tr>
                    <th>Block count</th>
                    <td>${result.count}</td>
                    </tr>`);
            info.append(`<tr>
                    <th>Current Block Hash</th>
                    <td>${result.currentBlockHash}</td>
                    </tr>`);
            info.append(`<tr>
                    <th>Previous Block Hash</th>
                    <td>${result.previousBlockHash}</td>
                    </tr>`);
        })
        .fail(function (e) {
            showChannelError(e);
        })
}

function getOrderers(channelID) {
    $.get(`/api/v1/status/channel/${channelID}/orderers`,
        {},
        function (result) {
            $('#orderer-root-container').show();
            var list = $('#orderer-info');
            list.html("");
            $.each(result, function (index, orderer) {
                let name = orderer.name;
                let html = `<li class="nav-item active">
                    <a><i class="fa fa-codepen" style="margin-right:8px"></i> <strong>${name}</strong></a>
                    </li>`;
                    list.append(html);
            })
            // $(".channel-item").on("click", function () {
            //     $("#side-menu").find(".active").removeClass("active");
            //     $(this).addClass("active");
            //     getChannelInfo(this.id);
            // });
        })
}

function getPeers(channelID) {
    $.get(`/api/v1/status/channel/${channelID}/peers`,
        {},
        function (result) {
            $('#peer-root-container').show();
            var list = $('#peer-info');
            list.html("");
            $.each(result, function (index, peer) {
                let name = peer.name;
                let html = `<li class="nav-item active">
                    <a><i class="fa fa-codepen" style="margin-right:8px"></i> <strong>${name}</strong></a>
                    </li>`;
                    list.append(html);
            })
            // $(".channel-item").on("click", function () {
            //     $("#side-menu").find(".active").removeClass("active");
            //     $(this).addClass("active");
            //     getChannelInfo(this.id);
            // });
        })
}
