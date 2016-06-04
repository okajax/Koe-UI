var koeUIcore = {

    // * js-cookie依存

    // UIのタイプの如何に関わらず、共通する機能をここに格納する

    // ***********************************************************
    // 変数
    // ***********************************************************
    convID: null, // カンバセーションID: DirectLineAPIが、会話を記録するためのID。30分で無効になる
    watermark: null, // ウォーターマーク: この指定をすると、新しい発言だけ取得できる
    //msgObj: null, // メッセージを格納するオブジェクト

    // ***********************************************************
    // カンバセーションIDの判定・作成をします
    // ***********************************************************

    init: function () {

        var that = this; // thatはRiotのカスタムタグを指す
        var cookie_ConvID = Cookies.get('convID');

        // クッキーにカンバセーションIDがすでにあるか調べる
        if (cookie_ConvID == undefined) {

            // はーい。ない人はこちらへどうぞ〜

            // ヘッダーを指定
            var myHeaders = new Headers();
            myHeaders.append('Authorization', 'Botconnector ' + this.opts.token);
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
                    that.convID = response.conversationId;
                    that.update();
                });

        } else {

            // え、あるの？ある？　あるんだ...
            // じゃあ既存のものをriotにわたして、update
            that.convID = cookie_ConvID;
            //that.update();

        }
    },
    getMessage: function (convID, watermark) {

        console.log('getMessage');

        if (convID == undefined) {
            console.log('カンバセーションIDがありません');
            return false;
        }

        var that = this; // thatはRiotのカスタムタグを指す
        var get_url;

        //ウォーターマーク指定があるか調べる
        if (watermark) {
            // 指定があれば、ウォーターマーク付きのURLでGETする。
            get_url = 'https://directline.botframework.com/api/conversations/' + convID + '/messages?watermark=' + watermark;
        } else {
            // なければそのまま。ウォーターマークがなければ、全てのメッセージを取得する。
            get_url = 'https://directline.botframework.com/api/conversations/' + convID + '/messages';
        }

        // ヘッダーを指定
        var myHeaders = new Headers();
        myHeaders.append('Authorization', 'Botconnector ' + this.opts.token);
        // オプションを指定
        var myInit = {
            method: 'GET',
            headers: myHeaders,
            contentType: 'application/json'
        };
        // リクエストを指定
        var myRequest = new Request(get_url, myInit);

        // fetch開始だぽっぽ
        fetch(myRequest)
            .then(function (data) {
                return data.json() // 紛らわしいからJSONにするぽっぽ
            })
            .then(function (response) {

                // すでに格納しているwatermarkを更新
                that.watermark = response.watermark;

                // 取得した会話を格納
                that.msgObj = response;

                 that.update();

                console.log(response);
                //return response.messages;

            });

    },
    sendMessage: function (convID, text, from) {

        console.log(text);
        console.log('sendMessage');

        var send_url = 'https://directline.botframework.com/api/conversations/' + convID + '/messages';

        // オプションを指定
        var myInit = {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'Authorization': 'Botconnector ' + this.opts.token
            },
            body: JSON.stringify({
                'text': text
            })
        };
        // リクエストを指定
        var myRequest = new Request(send_url, myInit);

        // fetch開始だぽっぽ
        fetch(myRequest);

    }


};
