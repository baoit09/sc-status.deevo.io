$(document).ready(function () {
    getChannels();
});

function getChannels() {
    $.get("/api/v1/status/network",
        {},
        function (result) {
            var menu = $('#side-menu');
            menu.html("");
            $.each(result.channels, function (index, channel) {
                let id = channel.channel_id;
                let html = `<li class="channel-item nav-item" id="${id}">
                    <a class="btn"><i class="fa fa-sitemap" style="margin-right:8px"></i> ${id}</a>
                    </li>`;
                menu.append(html);
                if (index === 0) {
                    $("#side-menu").find(`#${id}`).addClass("active");
                    getChannelInfo(id);
                }
            })
            $(".channel-item").on("click", function () {
                $("#side-menu").find(".active").removeClass("active");
                $(this).addClass("active");
                getChannelInfo(this.id);
            });
        })
}