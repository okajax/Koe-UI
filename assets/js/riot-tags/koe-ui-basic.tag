<koe-ui-basic>

    <!--***********************************************************-->

    <!-- Google Material Icon -->
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">

    <div class="chatScreen">

        <div class="message _welcome">
            <span>Hi, I am a bot! How are you?</span>
        </div>

        <div each="{ msgObj.messages }">
            <div class="message {filter_me( from )}">
                <span>{ text }</span>
            </div>
        </div>

    </div>

    <div>
        <form onsubmit="{ send_and_polling }">

            <input type="text" onkeyup="{ edit }">

            <div class='loader'>loading</div>

            <button disabled="{ !text }">
                <i class="material-icons">send</i>
            </button>

        </form>
    </div>


    <!--***********************************************************-->

    <style scoped>
        :scope {
            display: block;
            border: 2px solid #d9d9d9;
            border-radius: 7px;
            padding: 10px;
            box-sizing: border-box;
            overflow: hidden;
        }

        * {
            box-sizing: border-box;
        }

        .chatScreen {
            display: block;
            padding: 10px;
            height: 300px;
            margin-bottom: 10px;
            overflow: auto;
        }

        .message {
            margin: 10px;
        }

        .message > span {
            display: inline-block;
            background: #F1F0F0;
            padding: 5px 15px;
            border-radius: 20px;
        }

        .message._me {
            text-align: right;
        }

        .message._me > span {
            color: #fff;
            background: #41e667;
        }

        form {
            display: block;
            position: relative;
        }

        input {
            display: block;
            width: 100%;
            border: 2px solid #d9d9d9;
            border-radius: 7px;
            padding: 8px;
            font-size: 16px;
        }

        input:active,
        input:focus {
            outline: none;
            border: 2px solid #afafaf;
        }

        button {
            display: block;
            position: absolute;
            right: 7px;
            top: 5px;
            background: none;
            border: none;
            outline: none;
            cursor: pointer;
            color: #848484;
        }
        button[disabled="disabled"] {
            opacity: 0.3;
        }

        /* CSS spiner */
        /* Based on http://projects.lukehaas.me/css-loaders/ */
        .loader {
            display: none;
            margin: 0;
            font-size: 10px;
            position: absolute;
            right: 44px;
            bottom: 8px;
            z-index: 3;
            text-indent: -9999em;
            border-top: 3px solid rgba(195, 195, 195, 0.2);
            border-right: 3px solid rgba(195, 195, 195, 0.2);
            border-bottom: 3px solid rgba(195, 195, 195, 0.2);
            border-left: 3px solid #41e667;
            -webkit-transform: translateZ(0);
            -ms-transform: translateZ(0);
            transform: translateZ(0);
            -webkit-animation: load8 0.6s infinite linear;
            animation: load8 0.6s infinite linear;
        }
        .loader,
        .loader:after {
            border-radius: 50%;
            width: 23px;
            height: 23px;
        }
        @-webkit-keyframes load8 {
            0% {
                -webkit-transform: rotate(0deg);
                transform: rotate(0deg);
            }
            100% {
                -webkit-transform: rotate(360deg);
                transform: rotate(360deg);
            }
        }
        @keyframes load8 {
            0% {
                -webkit-transform: rotate(0deg);
                transform: rotate(0deg);
            }
            100% {
                -webkit-transform: rotate(360deg);
                transform: rotate(360deg);
            }
        }
    </style>

    <!--***********************************************************-->

    <script>
        // mixin
        this.mixin(koeUIcore);

        // vars of View
        this.text = '';
        this.flag_firstMsgGet = false;
        this.c_polling = 0;
        this.polling_max = 100;
        this.msgAmount = 0;
        this.latestMsg = {};
        this.lastestBotMsgId = '';

        // フィールド編集時、テキストを取得する (値があれば、Viewの送信ボタンのdisabledがfalseになる)
        edit(e) {
            this.text = e.target.value;
        }

        // メッセージ受信
        get_prms() {
            var that = this;
            return new Promise(function (resolve, reject) {
                // conversationIdをもとに、メッセージの取得
                that.getMessage(that.convID);
                resolve();
            });
        }

        // メッセージ送信
        send() {
            var that = this;
            return new Promise(function (resolve, reject) {
                // フィールドに入力されたテキストで、メッセージ送信
                that.sendMessage(that.convID, that.text, that.from);
                that.root.querySelectorAll('input')[0].value = '';
                resolve();
            });
        }

        // 送信とポーリングの開始
        send_and_polling() {

            var that = this;

            // メッセージの送信
            var d_send = this.send();

            // メッセージ送信が終わったら
            d_send.then(function () {
                // ここでポーリング呼出
                $(".loader").fadeIn(200);
                that.polling();
            });
        }

        // ポーリング
        polling() {
            var that = this;
            return new Promise(function (resolve, reject) {
                Promise.all([that.get_prms(), that.sleep(300)])
                    .then(function () {

                        // 再帰処理
                        // カウンタが最大より、まだ小さい。or Botからの新しいメッセージが取得されていない場合

                        if (that.c_polling < that.polling_max && that.lastestBotMsgId != that.latestMsg.id) {
                            that.c_polling++; //カウンタ更新
                            that.polling(); //再帰呼出し
                        } else {
                            $(".loader").fadeOut(200);
                            that.c_polling = 0;
                            that.scrollToBottom();

                            console.log('koe-ui-basic: Polling end. LatestBotMsgId is '+ that.lastestBotMsgId);

                            // 最新Botメッセージの記録用変数をリセット
                            that.lastestBotMsgId = '';
                        }

                        // メッセージ数のチェック
                        if (that.msgAmount < that.msgObj.messages.length) {

                            // 新しいものがあれば、下までスクロール
                            that.scrollToBottom();

                            // 最新のMsgを取得
                            that.getLatestMsg();

                            // 発言がBotのものならば、最新のBotメッセージIdを記録
                            if( that.latestMsg.from != that.from){
                                that.lastestBotMsgId = that.latestMsg.id;

                                console.log('koe-ui-basic: There is a new message.');

                            }

                        }


                        // メッセージ総数の更新
                        that.msgAmount = that.msgObj.messages.length;


                    });
                resolve();
            });
        }

        // スリープ
        sleep(time) {
            return new Promise(function (resolve, reject) {
                setTimeout(function () {
                    resolve();
                }, time);
            });
        }

        // 自分の発言か否か判定するフィルター
        filter_me(user) {
            if (user == this.from) {
                return "_me"; // 真ならば、"_me"を返す。(CSSとリンクしている)
            }
        }

        // 最新のMsgを取得
        getLatestMsg() {
            if(this.msgObj.messages.length){
                this.latestMsg = this.msgObj.messages[this.msgObj.messages.length-1];
            }else{
                this.latestMsg = 'no messages';
            }
        }

        // .chatScreen を下までスクロールさせる
        scrollToBottom() {
            $(".chatScreen").animate({
                scrollTop: $(".chatScreen")[0].scrollHeight
            });
        }

        // Viewのアップデート時に行う処理
        this.on('update', function () {

            // 初回呼出時のみ処理
            if (this.convID && this.flag_firstMsgGet == false) {

                var that = this;
                var getMsgCallback = function(){
                    that.msgAmount = that.msgObj.messages.length;
                    that.scrollToBottom();
                    that.getLatestMsg();
                }

                // メッセージの取得
                this.getMessage(this.convID, null, getMsgCallback);

                // flagオン
                this.flag_firstMsgGet = true;

            }

        });
    </script>

    <!--***********************************************************-->

</koe-ui-basic>
