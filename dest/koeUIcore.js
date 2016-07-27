(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.koeUIcore = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
exports.defaults = {};

exports.set = function(name, value, options) {
  // Retrieve options and defaults
  var opts = options || {};
  var defaults = exports.defaults;

  // Apply default value for unspecified options
  var expires  = opts.expires || defaults.expires;
  var domain   = opts.domain  || defaults.domain;
  var path     = opts.path     != undefined ? opts.path     : (defaults.path != undefined ? defaults.path : '/');
  var secure   = opts.secure   != undefined ? opts.secure   : defaults.secure;
  var httponly = opts.httponly != undefined ? opts.httponly : defaults.httponly;

  // Determine cookie expiration date
  // If succesful the result will be a valid Date, otherwise it will be an invalid Date or false(ish)
  var expDate = expires ? new Date(
      // in case expires is an integer, it should specify the number of days till the cookie expires
      typeof expires == 'number' ? new Date().getTime() + (expires * 864e5) :
      // else expires should be either a Date object or in a format recognized by Date.parse()
      expires
  ) : '';

  // Set cookie
  document.cookie = name.replace(/[^+#$&^`|]/g, encodeURIComponent)                // Encode cookie name
  .replace('(', '%28')
  .replace(')', '%29') +
  '=' + value.replace(/[^+#$&/:<-\[\]-}]/g, encodeURIComponent) +                  // Encode cookie value (RFC6265)
  (expDate && expDate.getTime() >= 0 ? ';expires=' + expDate.toUTCString() : '') + // Add expiration date
  (domain   ? ';domain=' + domain : '') +                                          // Add domain
  (path     ? ';path='   + path   : '') +                                          // Add path
  (secure   ? ';secure'           : '') +                                          // Add secure option
  (httponly ? ';httponly'         : '');                                           // Add httponly option
};

exports.get = function(name) {
  var cookies = document.cookie.split(';');

  // Iterate all cookies
  for(var i = 0; i < cookies.length; i++) {
    var cookie = cookies[i];
    var cookieLength = cookie.length;

    // Determine separator index ("name=value")
    var separatorIndex = cookie.indexOf('=');

    // IE<11 emits the equal sign when the cookie value is empty
    separatorIndex = separatorIndex < 0 ? cookieLength : separatorIndex;

    // Decode the cookie name and remove any leading/trailing spaces, then compare to the requested cookie name
    if (decodeURIComponent(cookie.substring(0, separatorIndex).replace(/^\s+|\s+$/g, '')) == name) {
      return decodeURIComponent(cookie.substring(separatorIndex + 1, cookieLength));
    }
  }

  return null;
};

exports.erase = function(name, options) {
  exports.set(name, '', {
    expires:  -1,
    domain:   options && options.domain,
    path:     options && options.path,
    secure:   0,
    httponly: 0}
  );
};

},{}],2:[function(require,module,exports){
var cookies = require('browser-cookies');

var koeUIcore = {

    // UIのタイプの如何に関わらず、共通する機能をここに格納する

    // ***********************************************************
    // 変数
    // ***********************************************************
    convID: null, // カンバセーションID: DirectLineAPIが、会話を記録するためのID。30分で無効になる
    watermark: null, // ウォーターマーク: この指定をすると、新しい発言だけ取得できる
    msgObj: {}, // メッセージを格納するオブジェクト
    from: null, // ウォーターフォールの会話を正しく動作させるためには、送信するmessageにfromを指定します

    // ***********************************************************
    // カンバセーションIDの判定・作成をします
    // ***********************************************************

    init: function () {

        var that = this; // thatはRiotのカスタムタグを指す
        var cookie_ConvID = cookies.get('convID');

        // クッキーにカンバセーションIDがすでにあるか調べる
        if (cookie_ConvID == undefined) {

            // はーい。ない人はこちらへどうぞ〜

            // オプションを指定
            var myInit = {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'Authorization': 'Botconnector ' + this.opts.token
                },
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
                    cookies.set("convID", response.conversationId, {
                        expires: date
                    });

                    // カンバセーションIDをriotにわたして、update
                    that.convID = response.conversationId;
                    that.from = 'user_'+that.convID; // from用の文字列も作成
                    that.update();
                });

        } else {

            // え、あるの？ある？　あるんだ...
            // じゃあ既存のものをriotにわたして、update
            that.convID = cookie_ConvID;
            that.from = 'user_'+that.convID; // from用の文字列も作成
            that.update();

        }
    },
    getMessage: function (convID, watermark, callbackAction) {

        console.log('KoeUIcore.js: getMessage');

        if (convID == undefined) {
            console.log('KoeUIcore.js: カンバセーションIDがありません');
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

        // オプションを指定
        var myInit = {
            method: 'GET',
            headers: {
                'content-type': 'application/json',
                'Authorization': 'Botconnector ' + this.opts.token
            },
            contentType: 'application/json'
        };
        // リクエストを指定
        var myRequest = new Request(get_url, myInit);

        // fetch開始
        fetch(myRequest)
            .then(function (data) {
                return data.json() // JSONにする
            })
            .then(function (response) {

                // すでに格納しているwatermarkを更新
                that.watermark = response.watermark;

                // 取得した会話を格納
                that.msgObj = response;

                // Viewをアップデート
                that.update();

                if(callbackAction){
                    callbackAction();
                }

            });
    },
    sendMessage: function (convID, text, from) {

        console.log(text);
        console.log('KoeUIcore.js: sendMessage');

        var send_url = 'https://directline.botframework.com/api/conversations/' + convID + '/messages';

        // オプションを指定
        var myInit = {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'Authorization': 'Botconnector ' + this.opts.token
            },
            body: JSON.stringify({
                'text': text,
                'from': from
            })
        };
        // リクエストを指定
        var myRequest = new Request(send_url, myInit);

        // fetch開始だぽっぽ
        fetch(myRequest);

    }

};

module.exports = koeUIcore;

},{"browser-cookies":1}]},{},[2])(2)
});