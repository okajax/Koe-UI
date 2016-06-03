var koeUIcore = {

    // js-cookie依存

    // ***********************************************************
    // カンバセーションIDを作成します
    // ***********************************************************

    makeConvID: function (token) {

        var riot_self = this;
        var cookie_ConvID = Cookies.get('convID');

        console.log(cookie_ConvID);

        // クッキーにカンバセーションIDがすでにあるか調べる
        if (cookie_ConvID == undefined) {

            // はーい。ない人はこちらへどうぞ〜

            // ヘッダーを指定
            var myHeaders = new Headers();
            myHeaders.append('Authorization', 'Botconnector ' + token);

            // オプションを指定
            var myInit = {
                method: 'POST',
                headers: myHeaders,
                contentType: 'application/json'
            };

            // リクエストを指定
            var myRequest = new Request('https://directline.botframework.com/api/conversations', myInit);

            // fetch開始だぽっぽ
            fetch(myRequest)
                .then(function (data) {
                    return data.json() // 紛らわしいからJSONにするぽっぽ
                })
                .then(function (response) {

                    // 30分が期限のクッキーを発行、カンバセーションIDを記憶しておく
                    var date = new Date();
                    date.setTime(date.getTime() + (30 * 60 * 1000));
                    Cookies.set("convID", response.conversationId, {
                        expires: date
                    });

                    // カンバセーションIDをriotにわたして、update
                    riot_self.convID = response.conversationId;
                    riot_self.update();
                });

        } else {

            // え、あるの？ある？　あるんだ...
            // じゃあ既存のものをriotにわたして、update
            riot_self.convID = cookie_ConvID;
            riot_self.update();

        }
    }
};
