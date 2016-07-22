<koe-ui-prototype>

    <!--***********************************************************-->

    <p>convID is { convID }</p>

    <ul>
        <li each="{ msgObj.messages }">
            {text}
        </li>
    </ul>


    <div>
        <form onsubmit="{ send }">
            <input type="text" onkeyup="{ edit }">
            <button disabled="{ !text }">メッセージの送信</button>
        </form>
    </div>
    <div>
        <button onclick="{ get }">メッセージの取得</button>
    </div>


    <!--***********************************************************-->

    <style scoped>
        :scope {
            display: block
        }
        p {
            background-color: #d8d8d8;
        }
    </style>

    <!--***********************************************************-->

    <script>
        // mixin
        this.mixin(koeUIcore);

        // vars of view
        this.text = '';
        this.flag_firstMsgGet = false;

        // function
        edit(e) {
            this.text = e.target.value;
        }
        get() {
            // メッセージの取得
            this.getMessage(this.convID);
        }
        send() {
            // メッセージの送信
            this.sendMessage( this.convID, this.text, this.from );
            this.root.querySelectorAll('input')[0].value = '';
        }

        // bind
        this.on('update', function () {
            // 初回のメッセージ取得
            if (this.convID && this.flag_firstMsgGet == false) {

                // メッセージの取得
                this.getMessage(this.convID);
                // flagオン
                this.flag_firstMsgGet = true;
            }
        });
    </script>

    <!--***********************************************************-->

</koe-ui-prototype>
