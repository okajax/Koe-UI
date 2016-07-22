(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var cookies = require('browser-cookies');

var koeUIcore = {

    // * js-cookie依存

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

},{"browser-cookies":4}],2:[function(require,module,exports){
var riot = require('riot');

require('./riot-tags/koe-ui-basicchat.tag');

riot.mount('*');

},{"./riot-tags/koe-ui-basicchat.tag":3,"riot":5}],3:[function(require,module,exports){
var riot = require('riot');
module.exports = riot.tag2('koe-ui-basicchat', '<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet"> <div class="chatScreen"> <div class="message _welcome"> <span>Hi, I am a bot! How are you?</span> </div> <div each="{msgObj.messages}"> <div class="message {filter_me( from )}"> <span>{text}</span> </div> </div> </div> <div> <form onsubmit="{send_and_polling}"> <input type="text" onkeyup="{edit}"> <button __disabled="{!text}"> <i class="material-icons">send</i> </button> </form> </div>', 'koe-ui-basicchat,[riot-tag="koe-ui-basicchat"],[data-is="koe-ui-basicchat"]{ display: block; border: 2px solid #d9d9d9; border-radius: 7px; padding: 10px; box-sizing: border-box; } koe-ui-basicchat *,[riot-tag="koe-ui-basicchat"] *,[data-is="koe-ui-basicchat"] *{ box-sizing: border-box; } koe-ui-basicchat .chatScreen,[riot-tag="koe-ui-basicchat"] .chatScreen,[data-is="koe-ui-basicchat"] .chatScreen{ display: block; padding: 10px; height: 200px; margin-bottom: 10px; overflow: auto; } koe-ui-basicchat .message,[riot-tag="koe-ui-basicchat"] .message,[data-is="koe-ui-basicchat"] .message{ margin: 10px; } koe-ui-basicchat .message > span,[riot-tag="koe-ui-basicchat"] .message > span,[data-is="koe-ui-basicchat"] .message > span{ display: inline-block; background: #F1F0F0; padding: 5px 15px; border-radius: 20px; } koe-ui-basicchat .message._me,[riot-tag="koe-ui-basicchat"] .message._me,[data-is="koe-ui-basicchat"] .message._me{ text-align: right; } koe-ui-basicchat .message._me > span,[riot-tag="koe-ui-basicchat"] .message._me > span,[data-is="koe-ui-basicchat"] .message._me > span{ color: #fff; background: #41e667; } koe-ui-basicchat form,[riot-tag="koe-ui-basicchat"] form,[data-is="koe-ui-basicchat"] form{ display: block; position: relative; } koe-ui-basicchat input,[riot-tag="koe-ui-basicchat"] input,[data-is="koe-ui-basicchat"] input{ display: block; width: 100%; border: 2px solid #d9d9d9; border-radius: 7px; padding: 8px; font-size: 16px; } koe-ui-basicchat input:active,[riot-tag="koe-ui-basicchat"] input:active,[data-is="koe-ui-basicchat"] input:active,koe-ui-basicchat input:focus,[riot-tag="koe-ui-basicchat"] input:focus,[data-is="koe-ui-basicchat"] input:focus{ outline: none; border: 2px solid #afafaf; } koe-ui-basicchat button,[riot-tag="koe-ui-basicchat"] button,[data-is="koe-ui-basicchat"] button{ display: block; position: absolute; right: 7px; top: 5px; background: none; border: none; outline: none; cursor: pointer; color: #848484; } koe-ui-basicchat button[disabled="disabled"],[riot-tag="koe-ui-basicchat"] button[disabled="disabled"],[data-is="koe-ui-basicchat"] button[disabled="disabled"]{ opacity: 0.3; } koe-ui-basicchat .loader,[riot-tag="koe-ui-basicchat"] .loader,[data-is="koe-ui-basicchat"] .loader{ margin: 60px auto; font-size: 10px; position: relative; text-indent: -9999em; border-top: 1.1em solid rgba(255, 255, 255, 0.2); border-right: 1.1em solid rgba(255, 255, 255, 0.2); border-bottom: 1.1em solid rgba(255, 255, 255, 0.2); border-left: 1.1em solid #ffffff; -webkit-transform: translateZ(0); -ms-transform: translateZ(0); transform: translateZ(0); -webkit-animation: load8 1.1s infinite linear; animation: load8 1.1s infinite linear; } koe-ui-basicchat .loader,[riot-tag="koe-ui-basicchat"] .loader,[data-is="koe-ui-basicchat"] .loader,koe-ui-basicchat .loader:after,[riot-tag="koe-ui-basicchat"] .loader:after,[data-is="koe-ui-basicchat"] .loader:after{ border-radius: 50%; width: 10em; height: 10em; } @-webkit-keyframes load8 { 0% { -webkit-transform: rotate(0deg); transform: rotate(0deg); } 100% { -webkit-transform: rotate(360deg); transform: rotate(360deg); } } @keyframes load8 { 0% { -webkit-transform: rotate(0deg); transform: rotate(0deg); } 100% { -webkit-transform: rotate(360deg); transform: rotate(360deg); } }', '', function(opts) {

        var koeUIcore = require('../koe-ui-core.js');
        this.mixin(koeUIcore);

        this.text = '';
        this.flag_firstMsgGet = false;
        this.c_polling = 0;
        this.polling_max = 30;
        this.msgAmount = 0;

        this.edit = function(e) {
            this.text = e.target.value;
        }.bind(this)

        this.get_prms = function() {
            var that = this;
            return new Promise(function (resolve, reject) {

                that.getMessage(that.convID);
                resolve();
            });
        }.bind(this)

        this.send = function() {
            var that = this;
            return new Promise(function (resolve, reject) {

                that.sendMessage(that.convID, that.text, that.from);
                that.root.querySelectorAll('input')[0].value = '';
                resolve();
            });
        }.bind(this)

        this.send_and_polling = function() {

            var that = this;

            var d_send = this.send();

            d_send.then(function () {

                that.polling();
            });
        }.bind(this)

        this.polling = function() {
            var that = this;
            return new Promise(function (resolve, reject) {
                Promise.all([that.get_prms(), that.sleep(300)])
                    .then(function () {

                        if (that.c_polling < that.polling_max) {
                            that.c_polling++;
                            that.polling();
                        } else {
                            console
                            that.c_polling = 0;
                            that.scrollToBottom();
                        }

                        if (that.msgAmount < that.msgObj.messages.length) {
                            that.scrollToBottom();
                        }
                        that.msgAmount = that.msgObj.messages.length;

                    });
                resolve();
            });
        }.bind(this)

        this.sleep = function(time) {
            return new Promise(function (resolve, reject) {
                setTimeout(function () {
                    resolve();
                }, time);
            });
        }.bind(this)

        this.filter_me = function(user) {
            if (user == this.from) {
                return "_me";
            }
        }.bind(this)

        this.scrollToBottom = function() {
            $(".chatScreen").animate({
                scrollTop: $(".chatScreen")[0].scrollHeight
            });
        }.bind(this)

        this.on('update', function () {

            if (this.convID && this.flag_firstMsgGet == false) {

                this.getMessage(this.convID, null, this.scrollToBottom);

                this.flag_firstMsgGet = true;

            }

        });
});

},{"../koe-ui-core.js":1,"riot":5}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
/* Riot v2.5.0, @license MIT */

;(function(window, undefined) {
  'use strict';
var riot = { version: 'v2.5.0', settings: {} },
  // be aware, internal usage
  // ATTENTION: prefix the global dynamic variables with `__`

  // counter to give a unique id to all the Tag instances
  __uid = 0,
  // tags instances cache
  __virtualDom = [],
  // tags implementation cache
  __tagImpl = {},

  /**
   * Const
   */
  GLOBAL_MIXIN = '__global_mixin',

  // riot specific prefixes
  RIOT_PREFIX = 'riot-',
  RIOT_TAG = RIOT_PREFIX + 'tag',
  RIOT_TAG_IS = 'data-is',

  // for typeof == '' comparisons
  T_STRING = 'string',
  T_OBJECT = 'object',
  T_UNDEF  = 'undefined',
  T_FUNCTION = 'function',
  // special native tags that cannot be treated like the others
  SPECIAL_TAGS_REGEX = /^(?:t(?:body|head|foot|[rhd])|caption|col(?:group)?|opt(?:ion|group))$/,
  RESERVED_WORDS_BLACKLIST = /^(?:_(?:item|id|parent)|update|root|(?:un)?mount|mixin|is(?:Mounted|Loop)|tags|parent|opts|trigger|o(?:n|ff|ne))$/,
  // SVG tags list https://www.w3.org/TR/SVG/attindex.html#PresentationAttributes
  SVG_TAGS_LIST = ['altGlyph', 'animate', 'animateColor', 'circle', 'clipPath', 'defs', 'ellipse', 'feBlend', 'feColorMatrix', 'feComponentTransfer', 'feComposite', 'feConvolveMatrix', 'feDiffuseLighting', 'feDisplacementMap', 'feFlood', 'feGaussianBlur', 'feImage', 'feMerge', 'feMorphology', 'feOffset', 'feSpecularLighting', 'feTile', 'feTurbulence', 'filter', 'font', 'foreignObject', 'g', 'glyph', 'glyphRef', 'image', 'line', 'linearGradient', 'marker', 'mask', 'missing-glyph', 'path', 'pattern', 'polygon', 'polyline', 'radialGradient', 'rect', 'stop', 'svg', 'switch', 'symbol', 'text', 'textPath', 'tref', 'tspan', 'use'],

  // version# for IE 8-11, 0 for others
  IE_VERSION = (window && window.document || {}).documentMode | 0,

  // detect firefox to fix #1374
  FIREFOX = window && !!window.InstallTrigger
/* istanbul ignore next */
riot.observable = function(el) {

  /**
   * Extend the original object or create a new empty one
   * @type { Object }
   */

  el = el || {}

  /**
   * Private variables
   */
  var callbacks = {},
    slice = Array.prototype.slice

  /**
   * Private Methods
   */

  /**
   * Helper function needed to get and loop all the events in a string
   * @param   { String }   e - event string
   * @param   {Function}   fn - callback
   */
  function onEachEvent(e, fn) {
    var es = e.split(' '), l = es.length, i = 0, name, indx
    for (; i < l; i++) {
      name = es[i]
      indx = name.indexOf('.')
      if (name) fn( ~indx ? name.substring(0, indx) : name, i, ~indx ? name.slice(indx + 1) : null)
    }
  }

  /**
   * Public Api
   */

  // extend the el object adding the observable methods
  Object.defineProperties(el, {
    /**
     * Listen to the given space separated list of `events` and
     * execute the `callback` each time an event is triggered.
     * @param  { String } events - events ids
     * @param  { Function } fn - callback function
     * @returns { Object } el
     */
    on: {
      value: function(events, fn) {
        if (typeof fn != 'function')  return el

        onEachEvent(events, function(name, pos, ns) {
          (callbacks[name] = callbacks[name] || []).push(fn)
          fn.typed = pos > 0
          fn.ns = ns
        })

        return el
      },
      enumerable: false,
      writable: false,
      configurable: false
    },

    /**
     * Removes the given space separated list of `events` listeners
     * @param   { String } events - events ids
     * @param   { Function } fn - callback function
     * @returns { Object } el
     */
    off: {
      value: function(events, fn) {
        if (events == '*' && !fn) callbacks = {}
        else {
          onEachEvent(events, function(name, pos, ns) {
            if (fn || ns) {
              var arr = callbacks[name]
              for (var i = 0, cb; cb = arr && arr[i]; ++i) {
                if (cb == fn || ns && cb.ns == ns) arr.splice(i--, 1)
              }
            } else delete callbacks[name]
          })
        }
        return el
      },
      enumerable: false,
      writable: false,
      configurable: false
    },

    /**
     * Listen to the given space separated list of `events` and
     * execute the `callback` at most once
     * @param   { String } events - events ids
     * @param   { Function } fn - callback function
     * @returns { Object } el
     */
    one: {
      value: function(events, fn) {
        function on() {
          el.off(events, on)
          fn.apply(el, arguments)
        }
        return el.on(events, on)
      },
      enumerable: false,
      writable: false,
      configurable: false
    },

    /**
     * Execute all callback functions that listen to
     * the given space separated list of `events`
     * @param   { String } events - events ids
     * @returns { Object } el
     */
    trigger: {
      value: function(events) {

        // getting the arguments
        var arglen = arguments.length - 1,
          args = new Array(arglen),
          fns

        for (var i = 0; i < arglen; i++) {
          args[i] = arguments[i + 1] // skip first argument
        }

        onEachEvent(events, function(name, pos, ns) {

          fns = slice.call(callbacks[name] || [], 0)

          for (var i = 0, fn; fn = fns[i]; ++i) {
            if (fn.busy) continue
            fn.busy = 1
            if (!ns || fn.ns == ns) fn.apply(el, fn.typed ? [name].concat(args) : args)
            if (fns[i] !== fn) { i-- }
            fn.busy = 0
          }

          if (callbacks['*'] && name != '*')
            el.trigger.apply(el, ['*', name].concat(args))

        })

        return el
      },
      enumerable: false,
      writable: false,
      configurable: false
    }
  })

  return el

}
/* istanbul ignore next */
;(function(riot) {

/**
 * Simple client-side router
 * @module riot-route
 */


var RE_ORIGIN = /^.+?\/\/+[^\/]+/,
  EVENT_LISTENER = 'EventListener',
  REMOVE_EVENT_LISTENER = 'remove' + EVENT_LISTENER,
  ADD_EVENT_LISTENER = 'add' + EVENT_LISTENER,
  HAS_ATTRIBUTE = 'hasAttribute',
  REPLACE = 'replace',
  POPSTATE = 'popstate',
  HASHCHANGE = 'hashchange',
  TRIGGER = 'trigger',
  MAX_EMIT_STACK_LEVEL = 3,
  win = typeof window != 'undefined' && window,
  doc = typeof document != 'undefined' && document,
  hist = win && history,
  loc = win && (hist.location || win.location), // see html5-history-api
  prot = Router.prototype, // to minify more
  clickEvent = doc && doc.ontouchstart ? 'touchstart' : 'click',
  started = false,
  central = riot.observable(),
  routeFound = false,
  debouncedEmit,
  base, current, parser, secondParser, emitStack = [], emitStackLevel = 0

/**
 * Default parser. You can replace it via router.parser method.
 * @param {string} path - current path (normalized)
 * @returns {array} array
 */
function DEFAULT_PARSER(path) {
  return path.split(/[/?#]/)
}

/**
 * Default parser (second). You can replace it via router.parser method.
 * @param {string} path - current path (normalized)
 * @param {string} filter - filter string (normalized)
 * @returns {array} array
 */
function DEFAULT_SECOND_PARSER(path, filter) {
  var re = new RegExp('^' + filter[REPLACE](/\*/g, '([^/?#]+?)')[REPLACE](/\.\./, '.*') + '$'),
    args = path.match(re)

  if (args) return args.slice(1)
}

/**
 * Simple/cheap debounce implementation
 * @param   {function} fn - callback
 * @param   {number} delay - delay in seconds
 * @returns {function} debounced function
 */
function debounce(fn, delay) {
  var t
  return function () {
    clearTimeout(t)
    t = setTimeout(fn, delay)
  }
}

/**
 * Set the window listeners to trigger the routes
 * @param {boolean} autoExec - see route.start
 */
function start(autoExec) {
  debouncedEmit = debounce(emit, 1)
  win[ADD_EVENT_LISTENER](POPSTATE, debouncedEmit)
  win[ADD_EVENT_LISTENER](HASHCHANGE, debouncedEmit)
  doc[ADD_EVENT_LISTENER](clickEvent, click)
  if (autoExec) emit(true)
}

/**
 * Router class
 */
function Router() {
  this.$ = []
  riot.observable(this) // make it observable
  central.on('stop', this.s.bind(this))
  central.on('emit', this.e.bind(this))
}

function normalize(path) {
  return path[REPLACE](/^\/|\/$/, '')
}

function isString(str) {
  return typeof str == 'string'
}

/**
 * Get the part after domain name
 * @param {string} href - fullpath
 * @returns {string} path from root
 */
function getPathFromRoot(href) {
  return (href || loc.href)[REPLACE](RE_ORIGIN, '')
}

/**
 * Get the part after base
 * @param {string} href - fullpath
 * @returns {string} path from base
 */
function getPathFromBase(href) {
  return base[0] == '#'
    ? (href || loc.href || '').split(base)[1] || ''
    : (loc ? getPathFromRoot(href) : href || '')[REPLACE](base, '')
}

function emit(force) {
  // the stack is needed for redirections
  var isRoot = emitStackLevel == 0
  if (MAX_EMIT_STACK_LEVEL <= emitStackLevel) return

  emitStackLevel++
  emitStack.push(function() {
    var path = getPathFromBase()
    if (force || path != current) {
      central[TRIGGER]('emit', path)
      current = path
    }
  })
  if (isRoot) {
    while (emitStack.length) {
      emitStack[0]()
      emitStack.shift()
    }
    emitStackLevel = 0
  }
}

function click(e) {
  if (
    e.which != 1 // not left click
    || e.metaKey || e.ctrlKey || e.shiftKey // or meta keys
    || e.defaultPrevented // or default prevented
  ) return

  var el = e.target
  while (el && el.nodeName != 'A') el = el.parentNode

  if (
    !el || el.nodeName != 'A' // not A tag
    || el[HAS_ATTRIBUTE]('download') // has download attr
    || !el[HAS_ATTRIBUTE]('href') // has no href attr
    || el.target && el.target != '_self' // another window or frame
    || el.href.indexOf(loc.href.match(RE_ORIGIN)[0]) == -1 // cross origin
  ) return

  if (el.href != loc.href) {
    if (
      el.href.split('#')[0] == loc.href.split('#')[0] // internal jump
      || base != '#' && getPathFromRoot(el.href).indexOf(base) !== 0 // outside of base
      || !go(getPathFromBase(el.href), el.title || doc.title) // route not found
    ) return
  }

  e.preventDefault()
}

/**
 * Go to the path
 * @param {string} path - destination path
 * @param {string} title - page title
 * @param {boolean} shouldReplace - use replaceState or pushState
 * @returns {boolean} - route not found flag
 */
function go(path, title, shouldReplace) {
  if (hist) { // if a browser
    path = base + normalize(path)
    title = title || doc.title
    // browsers ignores the second parameter `title`
    shouldReplace
      ? hist.replaceState(null, title, path)
      : hist.pushState(null, title, path)
    // so we need to set it manually
    doc.title = title
    routeFound = false
    emit()
    return routeFound
  }

  // Server-side usage: directly execute handlers for the path
  return central[TRIGGER]('emit', getPathFromBase(path))
}

/**
 * Go to path or set action
 * a single string:                go there
 * two strings:                    go there with setting a title
 * two strings and boolean:        replace history with setting a title
 * a single function:              set an action on the default route
 * a string/RegExp and a function: set an action on the route
 * @param {(string|function)} first - path / action / filter
 * @param {(string|RegExp|function)} second - title / action
 * @param {boolean} third - replace flag
 */
prot.m = function(first, second, third) {
  if (isString(first) && (!second || isString(second))) go(first, second, third || false)
  else if (second) this.r(first, second)
  else this.r('@', first)
}

/**
 * Stop routing
 */
prot.s = function() {
  this.off('*')
  this.$ = []
}

/**
 * Emit
 * @param {string} path - path
 */
prot.e = function(path) {
  this.$.concat('@').some(function(filter) {
    var args = (filter == '@' ? parser : secondParser)(normalize(path), normalize(filter))
    if (typeof args != 'undefined') {
      this[TRIGGER].apply(null, [filter].concat(args))
      return routeFound = true // exit from loop
    }
  }, this)
}

/**
 * Register route
 * @param {string} filter - filter for matching to url
 * @param {function} action - action to register
 */
prot.r = function(filter, action) {
  if (filter != '@') {
    filter = '/' + normalize(filter)
    this.$.push(filter)
  }
  this.on(filter, action)
}

var mainRouter = new Router()
var route = mainRouter.m.bind(mainRouter)

/**
 * Create a sub router
 * @returns {function} the method of a new Router object
 */
route.create = function() {
  var newSubRouter = new Router()
  // assign sub-router's main method
  var router = newSubRouter.m.bind(newSubRouter)
  // stop only this sub-router
  router.stop = newSubRouter.s.bind(newSubRouter)
  return router
}

/**
 * Set the base of url
 * @param {(str|RegExp)} arg - a new base or '#' or '#!'
 */
route.base = function(arg) {
  base = arg || '#'
  current = getPathFromBase() // recalculate current path
}

/** Exec routing right now **/
route.exec = function() {
  emit(true)
}

/**
 * Replace the default router to yours
 * @param {function} fn - your parser function
 * @param {function} fn2 - your secondParser function
 */
route.parser = function(fn, fn2) {
  if (!fn && !fn2) {
    // reset parser for testing...
    parser = DEFAULT_PARSER
    secondParser = DEFAULT_SECOND_PARSER
  }
  if (fn) parser = fn
  if (fn2) secondParser = fn2
}

/**
 * Helper function to get url query as an object
 * @returns {object} parsed query
 */
route.query = function() {
  var q = {}
  var href = loc.href || current
  href[REPLACE](/[?&](.+?)=([^&]*)/g, function(_, k, v) { q[k] = v })
  return q
}

/** Stop routing **/
route.stop = function () {
  if (started) {
    if (win) {
      win[REMOVE_EVENT_LISTENER](POPSTATE, debouncedEmit)
      win[REMOVE_EVENT_LISTENER](HASHCHANGE, debouncedEmit)
      doc[REMOVE_EVENT_LISTENER](clickEvent, click)
    }
    central[TRIGGER]('stop')
    started = false
  }
}

/**
 * Start routing
 * @param {boolean} autoExec - automatically exec after starting if true
 */
route.start = function (autoExec) {
  if (!started) {
    if (win) {
      if (document.readyState == 'complete') start(autoExec)
      // the timeout is needed to solve
      // a weird safari bug https://github.com/riot/route/issues/33
      else win[ADD_EVENT_LISTENER]('load', function() {
        setTimeout(function() { start(autoExec) }, 1)
      })
    }
    started = true
  }
}

/** Prepare the router **/
route.base()
route.parser()

riot.route = route
})(riot)
/* istanbul ignore next */

/**
 * The riot template engine
 * @version v2.4.0
 */
/**
 * riot.util.brackets
 *
 * - `brackets    ` - Returns a string or regex based on its parameter
 * - `brackets.set` - Change the current riot brackets
 *
 * @module
 */

var brackets = (function (UNDEF) {

  var
    REGLOB = 'g',

    R_MLCOMMS = /\/\*[^*]*\*+(?:[^*\/][^*]*\*+)*\//g,

    R_STRINGS = /"[^"\\]*(?:\\[\S\s][^"\\]*)*"|'[^'\\]*(?:\\[\S\s][^'\\]*)*'/g,

    S_QBLOCKS = R_STRINGS.source + '|' +
      /(?:\breturn\s+|(?:[$\w\)\]]|\+\+|--)\s*(\/)(?![*\/]))/.source + '|' +
      /\/(?=[^*\/])[^[\/\\]*(?:(?:\[(?:\\.|[^\]\\]*)*\]|\\.)[^[\/\\]*)*?(\/)[gim]*/.source,

    FINDBRACES = {
      '(': RegExp('([()])|'   + S_QBLOCKS, REGLOB),
      '[': RegExp('([[\\]])|' + S_QBLOCKS, REGLOB),
      '{': RegExp('([{}])|'   + S_QBLOCKS, REGLOB)
    },

    DEFAULT = '{ }'

  var _pairs = [
    '{', '}',
    '{', '}',
    /{[^}]*}/,
    /\\([{}])/g,
    /\\({)|{/g,
    RegExp('\\\\(})|([[({])|(})|' + S_QBLOCKS, REGLOB),
    DEFAULT,
    /^\s*{\^?\s*([$\w]+)(?:\s*,\s*(\S+))?\s+in\s+(\S.*)\s*}/,
    /(^|[^\\]){=[\S\s]*?}/
  ]

  var
    cachedBrackets = UNDEF,
    _regex,
    _cache = [],
    _settings

  function _loopback (re) { return re }

  function _rewrite (re, bp) {
    if (!bp) bp = _cache
    return new RegExp(
      re.source.replace(/{/g, bp[2]).replace(/}/g, bp[3]), re.global ? REGLOB : ''
    )
  }

  function _create (pair) {
    if (pair === DEFAULT) return _pairs

    var arr = pair.split(' ')

    if (arr.length !== 2 || /[\x00-\x1F<>a-zA-Z0-9'",;\\]/.test(pair)) { // eslint-disable-line
      throw new Error('Unsupported brackets "' + pair + '"')
    }
    arr = arr.concat(pair.replace(/(?=[[\]()*+?.^$|])/g, '\\').split(' '))

    arr[4] = _rewrite(arr[1].length > 1 ? /{[\S\s]*?}/ : _pairs[4], arr)
    arr[5] = _rewrite(pair.length > 3 ? /\\({|})/g : _pairs[5], arr)
    arr[6] = _rewrite(_pairs[6], arr)
    arr[7] = RegExp('\\\\(' + arr[3] + ')|([[({])|(' + arr[3] + ')|' + S_QBLOCKS, REGLOB)
    arr[8] = pair
    return arr
  }

  function _brackets (reOrIdx) {
    return reOrIdx instanceof RegExp ? _regex(reOrIdx) : _cache[reOrIdx]
  }

  _brackets.split = function split (str, tmpl, _bp) {
    // istanbul ignore next: _bp is for the compiler
    if (!_bp) _bp = _cache

    var
      parts = [],
      match,
      isexpr,
      start,
      pos,
      re = _bp[6]

    isexpr = start = re.lastIndex = 0

    while ((match = re.exec(str))) {

      pos = match.index

      if (isexpr) {

        if (match[2]) {
          re.lastIndex = skipBraces(str, match[2], re.lastIndex)
          continue
        }
        if (!match[3]) {
          continue
        }
      }

      if (!match[1]) {
        unescapeStr(str.slice(start, pos))
        start = re.lastIndex
        re = _bp[6 + (isexpr ^= 1)]
        re.lastIndex = start
      }
    }

    if (str && start < str.length) {
      unescapeStr(str.slice(start))
    }

    return parts

    function unescapeStr (s) {
      if (tmpl || isexpr) {
        parts.push(s && s.replace(_bp[5], '$1'))
      } else {
        parts.push(s)
      }
    }

    function skipBraces (s, ch, ix) {
      var
        match,
        recch = FINDBRACES[ch]

      recch.lastIndex = ix
      ix = 1
      while ((match = recch.exec(s))) {
        if (match[1] &&
          !(match[1] === ch ? ++ix : --ix)) break
      }
      return ix ? s.length : recch.lastIndex
    }
  }

  _brackets.hasExpr = function hasExpr (str) {
    return _cache[4].test(str)
  }

  _brackets.loopKeys = function loopKeys (expr) {
    var m = expr.match(_cache[9])

    return m
      ? { key: m[1], pos: m[2], val: _cache[0] + m[3].trim() + _cache[1] }
      : { val: expr.trim() }
  }

  _brackets.array = function array (pair) {
    return pair ? _create(pair) : _cache
  }

  function _reset (pair) {
    if ((pair || (pair = DEFAULT)) !== _cache[8]) {
      _cache = _create(pair)
      _regex = pair === DEFAULT ? _loopback : _rewrite
      _cache[9] = _regex(_pairs[9])
    }
    cachedBrackets = pair
  }

  function _setSettings (o) {
    var b

    o = o || {}
    b = o.brackets
    Object.defineProperty(o, 'brackets', {
      set: _reset,
      get: function () { return cachedBrackets },
      enumerable: true
    })
    _settings = o
    _reset(b)
  }

  Object.defineProperty(_brackets, 'settings', {
    set: _setSettings,
    get: function () { return _settings }
  })

  /* istanbul ignore next: in the browser riot is always in the scope */
  _brackets.settings = typeof riot !== 'undefined' && riot.settings || {}
  _brackets.set = _reset

  _brackets.R_STRINGS = R_STRINGS
  _brackets.R_MLCOMMS = R_MLCOMMS
  _brackets.S_QBLOCKS = S_QBLOCKS

  return _brackets

})()

/**
 * @module tmpl
 *
 * tmpl          - Root function, returns the template value, render with data
 * tmpl.hasExpr  - Test the existence of a expression inside a string
 * tmpl.loopKeys - Get the keys for an 'each' loop (used by `_each`)
 */

var tmpl = (function () {

  var _cache = {}

  function _tmpl (str, data) {
    if (!str) return str

    return (_cache[str] || (_cache[str] = _create(str))).call(data, _logErr)
  }

  _tmpl.haveRaw = brackets.hasRaw

  _tmpl.hasExpr = brackets.hasExpr

  _tmpl.loopKeys = brackets.loopKeys

  _tmpl.errorHandler = null

  function _logErr (err, ctx) {

    if (_tmpl.errorHandler) {

      err.riotData = {
        tagName: ctx && ctx.root && ctx.root.tagName,
        _riot_id: ctx && ctx._riot_id  //eslint-disable-line camelcase
      }
      _tmpl.errorHandler(err)
    }
  }

  function _create (str) {
    var expr = _getTmpl(str)

    if (expr.slice(0, 11) !== 'try{return ') expr = 'return ' + expr

/* eslint-disable */

    return new Function('E', expr + ';')
/* eslint-enable */
  }

  var
    CH_IDEXPR = '\u2057',
    RE_CSNAME = /^(?:(-?[_A-Za-z\xA0-\xFF][-\w\xA0-\xFF]*)|\u2057(\d+)~):/,
    RE_QBLOCK = RegExp(brackets.S_QBLOCKS, 'g'),
    RE_DQUOTE = /\u2057/g,
    RE_QBMARK = /\u2057(\d+)~/g

  function _getTmpl (str) {
    var
      qstr = [],
      expr,
      parts = brackets.split(str.replace(RE_DQUOTE, '"'), 1)

    if (parts.length > 2 || parts[0]) {
      var i, j, list = []

      for (i = j = 0; i < parts.length; ++i) {

        expr = parts[i]

        if (expr && (expr = i & 1

            ? _parseExpr(expr, 1, qstr)

            : '"' + expr
                .replace(/\\/g, '\\\\')
                .replace(/\r\n?|\n/g, '\\n')
                .replace(/"/g, '\\"') +
              '"'

          )) list[j++] = expr

      }

      expr = j < 2 ? list[0]
           : '[' + list.join(',') + '].join("")'

    } else {

      expr = _parseExpr(parts[1], 0, qstr)
    }

    if (qstr[0]) {
      expr = expr.replace(RE_QBMARK, function (_, pos) {
        return qstr[pos]
          .replace(/\r/g, '\\r')
          .replace(/\n/g, '\\n')
      })
    }
    return expr
  }

  var
    RE_BREND = {
      '(': /[()]/g,
      '[': /[[\]]/g,
      '{': /[{}]/g
    }

  function _parseExpr (expr, asText, qstr) {

    expr = expr
          .replace(RE_QBLOCK, function (s, div) {
            return s.length > 2 && !div ? CH_IDEXPR + (qstr.push(s) - 1) + '~' : s
          })
          .replace(/\s+/g, ' ').trim()
          .replace(/\ ?([[\({},?\.:])\ ?/g, '$1')

    if (expr) {
      var
        list = [],
        cnt = 0,
        match

      while (expr &&
            (match = expr.match(RE_CSNAME)) &&
            !match.index
        ) {
        var
          key,
          jsb,
          re = /,|([[{(])|$/g

        expr = RegExp.rightContext
        key  = match[2] ? qstr[match[2]].slice(1, -1).trim().replace(/\s+/g, ' ') : match[1]

        while (jsb = (match = re.exec(expr))[1]) skipBraces(jsb, re)

        jsb  = expr.slice(0, match.index)
        expr = RegExp.rightContext

        list[cnt++] = _wrapExpr(jsb, 1, key)
      }

      expr = !cnt ? _wrapExpr(expr, asText)
           : cnt > 1 ? '[' + list.join(',') + '].join(" ").trim()' : list[0]
    }
    return expr

    function skipBraces (ch, re) {
      var
        mm,
        lv = 1,
        ir = RE_BREND[ch]

      ir.lastIndex = re.lastIndex
      while (mm = ir.exec(expr)) {
        if (mm[0] === ch) ++lv
        else if (!--lv) break
      }
      re.lastIndex = lv ? expr.length : ir.lastIndex
    }
  }

  // istanbul ignore next: not both
  var // eslint-disable-next-line max-len
    JS_CONTEXT = '"in this?this:' + (typeof window !== 'object' ? 'global' : 'window') + ').',
    JS_VARNAME = /[,{][$\w]+:|(^ *|[^$\w\.])(?!(?:typeof|true|false|null|undefined|in|instanceof|is(?:Finite|NaN)|void|NaN|new|Date|RegExp|Math)(?![$\w]))([$_A-Za-z][$\w]*)/g,
    JS_NOPROPS = /^(?=(\.[$\w]+))\1(?:[^.[(]|$)/

  function _wrapExpr (expr, asText, key) {
    var tb

    expr = expr.replace(JS_VARNAME, function (match, p, mvar, pos, s) {
      if (mvar) {
        pos = tb ? 0 : pos + match.length

        if (mvar !== 'this' && mvar !== 'global' && mvar !== 'window') {
          match = p + '("' + mvar + JS_CONTEXT + mvar
          if (pos) tb = (s = s[pos]) === '.' || s === '(' || s === '['
        } else if (pos) {
          tb = !JS_NOPROPS.test(s.slice(pos))
        }
      }
      return match
    })

    if (tb) {
      expr = 'try{return ' + expr + '}catch(e){E(e,this)}'
    }

    if (key) {

      expr = (tb
          ? 'function(){' + expr + '}.call(this)' : '(' + expr + ')'
        ) + '?"' + key + '":""'

    } else if (asText) {

      expr = 'function(v){' + (tb
          ? expr.replace('return ', 'v=') : 'v=(' + expr + ')'
        ) + ';return v||v===0?v:""}.call(this)'
    }

    return expr
  }

  // istanbul ignore next: compatibility fix for beta versions
  _tmpl.parse = function (s) { return s }

  _tmpl.version = brackets.version = 'v2.4.0'

  return _tmpl

})()

/*
  lib/browser/tag/mkdom.js

  Includes hacks needed for the Internet Explorer version 9 and below
  See: http://kangax.github.io/compat-table/es5/#ie8
       http://codeplanet.io/dropping-ie8/
*/
var mkdom = (function _mkdom() {
  var
    reHasYield  = /<yield\b/i,
    reYieldAll  = /<yield\s*(?:\/>|>([\S\s]*?)<\/yield\s*>|>)/ig,
    reYieldSrc  = /<yield\s+to=['"]([^'">]*)['"]\s*>([\S\s]*?)<\/yield\s*>/ig,
    reYieldDest = /<yield\s+from=['"]?([-\w]+)['"]?\s*(?:\/>|>([\S\s]*?)<\/yield\s*>)/ig
  var
    rootEls = { tr: 'tbody', th: 'tr', td: 'tr', col: 'colgroup' },
    tblTags = IE_VERSION && IE_VERSION < 10
      ? SPECIAL_TAGS_REGEX : /^(?:t(?:body|head|foot|[rhd])|caption|col(?:group)?)$/

  /**
   * Creates a DOM element to wrap the given content. Normally an `DIV`, but can be
   * also a `TABLE`, `SELECT`, `TBODY`, `TR`, or `COLGROUP` element.
   *
   * @param   {string} templ  - The template coming from the custom tag definition
   * @param   {string} [html] - HTML content that comes from the DOM element where you
   *           will mount the tag, mostly the original tag in the page
   * @returns {HTMLElement} DOM element with _templ_ merged through `YIELD` with the _html_.
   */
  function _mkdom(templ, html) {
    var
      match   = templ && templ.match(/^\s*<([-\w]+)/),
      tagName = match && match[1].toLowerCase(),
      el = mkEl('div', isSVGTag(tagName))

    // replace all the yield tags with the tag inner html
    templ = replaceYield(templ, html)

    /* istanbul ignore next */
    if (tblTags.test(tagName))
      el = specialTags(el, templ, tagName)
    else
      setInnerHTML(el, templ)

    el.stub = true

    return el
  }

  /*
    Creates the root element for table or select child elements:
    tr/th/td/thead/tfoot/tbody/caption/col/colgroup/option/optgroup
  */
  function specialTags(el, templ, tagName) {
    var
      select = tagName[0] === 'o',
      parent = select ? 'select>' : 'table>'

    // trim() is important here, this ensures we don't have artifacts,
    // so we can check if we have only one element inside the parent
    el.innerHTML = '<' + parent + templ.trim() + '</' + parent
    parent = el.firstChild

    // returns the immediate parent if tr/th/td/col is the only element, if not
    // returns the whole tree, as this can include additional elements
    if (select) {
      parent.selectedIndex = -1  // for IE9, compatible w/current riot behavior
    } else {
      // avoids insertion of cointainer inside container (ex: tbody inside tbody)
      var tname = rootEls[tagName]
      if (tname && parent.childElementCount === 1) parent = $(tname, parent)
    }
    return parent
  }

  /*
    Replace the yield tag from any tag template with the innerHTML of the
    original tag in the page
  */
  function replaceYield(templ, html) {
    // do nothing if no yield
    if (!reHasYield.test(templ)) return templ

    // be careful with #1343 - string on the source having `$1`
    var src = {}

    html = html && html.replace(reYieldSrc, function (_, ref, text) {
      src[ref] = src[ref] || text   // preserve first definition
      return ''
    }).trim()

    return templ
      .replace(reYieldDest, function (_, ref, def) {  // yield with from - to attrs
        return src[ref] || def || ''
      })
      .replace(reYieldAll, function (_, def) {        // yield without any "from"
        return html || def || ''
      })
  }

  return _mkdom

})()

/**
 * Convert the item looped into an object used to extend the child tag properties
 * @param   { Object } expr - object containing the keys used to extend the children tags
 * @param   { * } key - value to assign to the new object returned
 * @param   { * } val - value containing the position of the item in the array
 * @returns { Object } - new object containing the values of the original item
 *
 * The variables 'key' and 'val' are arbitrary.
 * They depend on the collection type looped (Array, Object)
 * and on the expression used on the each tag
 *
 */
function mkitem(expr, key, val) {
  var item = {}
  item[expr.key] = key
  if (expr.pos) item[expr.pos] = val
  return item
}

/**
 * Unmount the redundant tags
 * @param   { Array } items - array containing the current items to loop
 * @param   { Array } tags - array containing all the children tags
 */
function unmountRedundant(items, tags) {

  var i = tags.length,
    j = items.length,
    t

  while (i > j) {
    t = tags[--i]
    tags.splice(i, 1)
    t.unmount()
  }
}

/**
 * Move the nested custom tags in non custom loop tags
 * @param   { Object } child - non custom loop tag
 * @param   { Number } i - current position of the loop tag
 */
function moveNestedTags(child, i) {
  Object.keys(child.tags).forEach(function(tagName) {
    var tag = child.tags[tagName]
    if (isArray(tag))
      each(tag, function (t) {
        moveChildTag(t, tagName, i)
      })
    else
      moveChildTag(tag, tagName, i)
  })
}

/**
 * Adds the elements for a virtual tag
 * @param { Tag } tag - the tag whose root's children will be inserted or appended
 * @param { Node } src - the node that will do the inserting or appending
 * @param { Tag } target - only if inserting, insert before this tag's first child
 */
function addVirtual(tag, src, target) {
  var el = tag._root, sib
  tag._virts = []
  while (el) {
    sib = el.nextSibling
    if (target)
      src.insertBefore(el, target._root)
    else
      src.appendChild(el)

    tag._virts.push(el) // hold for unmounting
    el = sib
  }
}

/**
 * Move virtual tag and all child nodes
 * @param { Tag } tag - first child reference used to start move
 * @param { Node } src  - the node that will do the inserting
 * @param { Tag } target - insert before this tag's first child
 * @param { Number } len - how many child nodes to move
 */
function moveVirtual(tag, src, target, len) {
  var el = tag._root, sib, i = 0
  for (; i < len; i++) {
    sib = el.nextSibling
    src.insertBefore(el, target._root)
    el = sib
  }
}


/**
 * Manage tags having the 'each'
 * @param   { Object } dom - DOM node we need to loop
 * @param   { Tag } parent - parent tag instance where the dom node is contained
 * @param   { String } expr - string contained in the 'each' attribute
 */
function _each(dom, parent, expr) {

  // remove the each property from the original tag
  remAttr(dom, 'each')

  var mustReorder = typeof getAttr(dom, 'no-reorder') !== T_STRING || remAttr(dom, 'no-reorder'),
    tagName = getTagName(dom),
    impl = __tagImpl[tagName] || { tmpl: getOuterHTML(dom) },
    useRoot = SPECIAL_TAGS_REGEX.test(tagName),
    root = dom.parentNode,
    ref = document.createTextNode(''),
    child = getTag(dom),
    isOption = tagName.toLowerCase() === 'option', // the option tags must be treated differently
    tags = [],
    oldItems = [],
    hasKeys,
    isVirtual = dom.tagName == 'VIRTUAL'

  // parse the each expression
  expr = tmpl.loopKeys(expr)

  // insert a marked where the loop tags will be injected
  root.insertBefore(ref, dom)

  // clean template code
  parent.one('before-mount', function () {

    // remove the original DOM node
    dom.parentNode.removeChild(dom)
    if (root.stub) root = parent.root

  }).on('update', function () {
    // get the new items collection
    var items = tmpl(expr.val, parent),
      // create a fragment to hold the new DOM nodes to inject in the parent tag
      frag = document.createDocumentFragment()

    // object loop. any changes cause full redraw
    if (!isArray(items)) {
      hasKeys = items || false
      items = hasKeys ?
        Object.keys(items).map(function (key) {
          return mkitem(expr, key, items[key])
        }) : []
    }

    // loop all the new items
    var i = 0,
      itemsLength = items.length

    for (; i < itemsLength; i++) {
      // reorder only if the items are objects
      var
        item = items[i],
        _mustReorder = mustReorder && typeof item == T_OBJECT && !hasKeys,
        oldPos = oldItems.indexOf(item),
        pos = ~oldPos && _mustReorder ? oldPos : i,
        // does a tag exist in this position?
        tag = tags[pos]

      item = !hasKeys && expr.key ? mkitem(expr, item, i) : item

      // new tag
      if (
        !_mustReorder && !tag // with no-reorder we just update the old tags
        ||
        _mustReorder && !~oldPos || !tag // by default we always try to reorder the DOM elements
      ) {

        tag = new Tag(impl, {
          parent: parent,
          isLoop: true,
          hasImpl: !!__tagImpl[tagName],
          root: useRoot ? root : dom.cloneNode(),
          item: item
        }, dom.innerHTML)

        tag.mount()

        if (isVirtual) tag._root = tag.root.firstChild // save reference for further moves or inserts
        // this tag must be appended
        if (i == tags.length || !tags[i]) { // fix 1581
          if (isVirtual)
            addVirtual(tag, frag)
          else frag.appendChild(tag.root)
        }
        // this tag must be insert
        else {
          if (isVirtual)
            addVirtual(tag, root, tags[i])
          else root.insertBefore(tag.root, tags[i].root) // #1374 some browsers reset selected here
          oldItems.splice(i, 0, item)
        }

        tags.splice(i, 0, tag)
        pos = i // handled here so no move
      } else tag.update(item, true)

      // reorder the tag if it's not located in its previous position
      if (
        pos !== i && _mustReorder &&
        tags[i] // fix 1581 unable to reproduce it in a test!
      ) {
        // update the DOM
        if (isVirtual)
          moveVirtual(tag, root, tags[i], dom.childNodes.length)
        else root.insertBefore(tag.root, tags[i].root)
        // update the position attribute if it exists
        if (expr.pos)
          tag[expr.pos] = i
        // move the old tag instance
        tags.splice(i, 0, tags.splice(pos, 1)[0])
        // move the old item
        oldItems.splice(i, 0, oldItems.splice(pos, 1)[0])
        // if the loop tags are not custom
        // we need to move all their custom tags into the right position
        if (!child && tag.tags) moveNestedTags(tag, i)
      }

      // cache the original item to use it in the events bound to this node
      // and its children
      tag._item = item
      // cache the real parent tag internally
      defineProperty(tag, '_parent', parent)
    }

    // remove the redundant tags
    unmountRedundant(items, tags)

    // insert the new nodes
    root.insertBefore(frag, ref)
    if (isOption) {

      // #1374 FireFox bug in <option selected={expression}>
      if (FIREFOX && !root.multiple) {
        for (var n = 0; n < root.length; n++) {
          if (root[n].__riot1374) {
            root.selectedIndex = n  // clear other options
            delete root[n].__riot1374
            break
          }
        }
      }
    }

    // set the 'tags' property of the parent tag
    // if child is 'undefined' it means that we don't need to set this property
    // for example:
    // we don't need store the `myTag.tags['div']` property if we are looping a div tag
    // but we need to track the `myTag.tags['child']` property looping a custom child node named `child`
    if (child) parent.tags[tagName] = tags

    // clone the items array
    oldItems = items.slice()

  })

}
/**
 * Object that will be used to inject and manage the css of every tag instance
 */
var styleManager = (function(_riot) {

  if (!window) return { // skip injection on the server
    add: function () {},
    inject: function () {}
  }

  var styleNode = (function () {
    // create a new style element with the correct type
    var newNode = mkEl('style')
    setAttr(newNode, 'type', 'text/css')

    // replace any user node or insert the new one into the head
    var userNode = $('style[type=riot]')
    if (userNode) {
      if (userNode.id) newNode.id = userNode.id
      userNode.parentNode.replaceChild(newNode, userNode)
    }
    else document.getElementsByTagName('head')[0].appendChild(newNode)

    return newNode
  })()

  // Create cache and shortcut to the correct property
  var cssTextProp = styleNode.styleSheet,
    stylesToInject = ''

  // Expose the style node in a non-modificable property
  Object.defineProperty(_riot, 'styleNode', {
    value: styleNode,
    writable: true
  })

  /**
   * Public api
   */
  return {
    /**
     * Save a tag style to be later injected into DOM
     * @param   { String } css [description]
     */
    add: function(css) {
      stylesToInject += css
    },
    /**
     * Inject all previously saved tag styles into DOM
     * innerHTML seems slow: http://jsperf.com/riot-insert-style
     */
    inject: function() {
      if (stylesToInject) {
        if (cssTextProp) cssTextProp.cssText += stylesToInject
        else styleNode.innerHTML += stylesToInject
        stylesToInject = ''
      }
    }
  }

})(riot)


function parseNamedElements(root, tag, childTags, forceParsingNamed) {

  walk(root, function(dom) {
    if (dom.nodeType == 1) {
      dom.isLoop = dom.isLoop ||
                  (dom.parentNode && dom.parentNode.isLoop || getAttr(dom, 'each'))
                    ? 1 : 0

      // custom child tag
      if (childTags) {
        var child = getTag(dom)

        if (child && !dom.isLoop)
          childTags.push(initChildTag(child, {root: dom, parent: tag}, dom.innerHTML, tag))
      }

      if (!dom.isLoop || forceParsingNamed)
        setNamed(dom, tag, [])
    }

  })

}

function parseExpressions(root, tag, expressions) {

  function addExpr(dom, val, extra) {
    if (tmpl.hasExpr(val)) {
      expressions.push(extend({ dom: dom, expr: val }, extra))
    }
  }

  walk(root, function(dom) {
    var type = dom.nodeType,
      attr

    // text node
    if (type == 3 && dom.parentNode.tagName != 'STYLE') addExpr(dom, dom.nodeValue)
    if (type != 1) return

    /* element */

    // loop
    attr = getAttr(dom, 'each')

    if (attr) { _each(dom, tag, attr); return false }

    // attribute expressions
    each(dom.attributes, function(attr) {
      var name = attr.name,
        bool = name.split('__')[1]

      addExpr(dom, attr.value, { attr: bool || name, bool: bool })
      if (bool) { remAttr(dom, name); return false }

    })

    // skip custom tags
    if (getTag(dom)) return false

  })

}
function Tag(impl, conf, innerHTML) {

  var self = riot.observable(this),
    opts = inherit(conf.opts) || {},
    parent = conf.parent,
    isLoop = conf.isLoop,
    hasImpl = conf.hasImpl,
    item = cleanUpData(conf.item),
    expressions = [],
    childTags = [],
    root = conf.root,
    tagName = root.tagName.toLowerCase(),
    attr = {},
    propsInSyncWithParent = [],
    dom

  // only call unmount if we have a valid __tagImpl (has name property)
  if (impl.name && root._tag) root._tag.unmount(true)

  // not yet mounted
  this.isMounted = false
  root.isLoop = isLoop

  // keep a reference to the tag just created
  // so we will be able to mount this tag multiple times
  root._tag = this

  // create a unique id to this tag
  // it could be handy to use it also to improve the virtual dom rendering speed
  defineProperty(this, '_riot_id', ++__uid) // base 1 allows test !t._riot_id

  extend(this, { parent: parent, root: root, opts: opts}, item)
  // protect the "tags" property from being overridden
  defineProperty(this, 'tags', {})

  // grab attributes
  each(root.attributes, function(el) {
    var val = el.value
    // remember attributes with expressions only
    if (tmpl.hasExpr(val)) attr[el.name] = val
  })

  dom = mkdom(impl.tmpl, innerHTML)

  // options
  function updateOpts() {
    var ctx = hasImpl && isLoop ? self : parent || self

    // update opts from current DOM attributes
    each(root.attributes, function(el) {
      var val = el.value
      opts[toCamel(el.name)] = tmpl.hasExpr(val) ? tmpl(val, ctx) : val
    })
    // recover those with expressions
    each(Object.keys(attr), function(name) {
      opts[toCamel(name)] = tmpl(attr[name], ctx)
    })
  }

  function normalizeData(data) {
    for (var key in item) {
      if (typeof self[key] !== T_UNDEF && isWritable(self, key))
        self[key] = data[key]
    }
  }

  function inheritFromParent () {
    if (!self.parent || !isLoop) return
    each(Object.keys(self.parent), function(k) {
      // some properties must be always in sync with the parent tag
      var mustSync = !RESERVED_WORDS_BLACKLIST.test(k) && contains(propsInSyncWithParent, k)
      if (typeof self[k] === T_UNDEF || mustSync) {
        // track the property to keep in sync
        // so we can keep it updated
        if (!mustSync) propsInSyncWithParent.push(k)
        self[k] = self.parent[k]
      }
    })
  }

  /**
   * Update the tag expressions and options
   * @param   { * }  data - data we want to use to extend the tag properties
   * @param   { Boolean } isInherited - is this update coming from a parent tag?
   * @returns { self }
   */
  defineProperty(this, 'update', function(data, isInherited) {

    // make sure the data passed will not override
    // the component core methods
    data = cleanUpData(data)
    // inherit properties from the parent
    inheritFromParent()
    // normalize the tag properties in case an item object was initially passed
    if (data && isObject(item)) {
      normalizeData(data)
      item = data
    }
    extend(self, data)
    updateOpts()
    self.trigger('update', data)
    update(expressions, self)

    // the updated event will be triggered
    // once the DOM will be ready and all the re-flows are completed
    // this is useful if you want to get the "real" root properties
    // 4 ex: root.offsetWidth ...
    if (isInherited && self.parent)
      // closes #1599
      self.parent.one('updated', function() { self.trigger('updated') })
    else rAF(function() { self.trigger('updated') })

    return this
  })

  defineProperty(this, 'mixin', function() {
    each(arguments, function(mix) {
      var instance,
        props = [],
        obj

      mix = typeof mix === T_STRING ? riot.mixin(mix) : mix

      // check if the mixin is a function
      if (isFunction(mix)) {
        // create the new mixin instance
        instance = new mix()
      } else instance = mix

      // build multilevel prototype inheritance chain property list
      do props = props.concat(Object.getOwnPropertyNames(obj || instance))
      while (obj = Object.getPrototypeOf(obj || instance))

      // loop the keys in the function prototype or the all object keys
      each(props, function(key) {
        // bind methods to self
        if (key != 'init' && !self[key])
          // apply method only if it does not already exist on the instance
          self[key] = isFunction(instance[key]) ?
            instance[key].bind(self) :
            instance[key]
      })

      // init method will be called automatically
      if (instance.init) instance.init.bind(self)()
    })
    return this
  })

  defineProperty(this, 'mount', function() {

    updateOpts()

    // add global mixins
    var globalMixin = riot.mixin(GLOBAL_MIXIN)
    if (globalMixin)
      for (var i in globalMixin)
        if (globalMixin.hasOwnProperty(i))
          self.mixin(globalMixin[i])

    // initialiation
    if (impl.fn) impl.fn.call(self, opts)

    // parse layout after init. fn may calculate args for nested custom tags
    parseExpressions(dom, self, expressions)

    // mount the child tags
    toggle(true)

    // update the root adding custom attributes coming from the compiler
    // it fixes also #1087
    if (impl.attrs)
      walkAttributes(impl.attrs, function (k, v) { setAttr(root, k, v) })
    if (impl.attrs || hasImpl)
      parseExpressions(self.root, self, expressions)

    if (!self.parent || isLoop) self.update(item)

    // internal use only, fixes #403
    self.trigger('before-mount')

    if (isLoop && !hasImpl) {
      // update the root attribute for the looped elements
      root = dom.firstChild
    } else {
      while (dom.firstChild) root.appendChild(dom.firstChild)
      if (root.stub) root = parent.root
    }

    defineProperty(self, 'root', root)

    // parse the named dom nodes in the looped child
    // adding them to the parent as well
    if (isLoop)
      parseNamedElements(self.root, self.parent, null, true)

    // if it's not a child tag we can trigger its mount event
    if (!self.parent || self.parent.isMounted) {
      self.isMounted = true
      self.trigger('mount')
    }
    // otherwise we need to wait that the parent event gets triggered
    else self.parent.one('mount', function() {
      // avoid to trigger the `mount` event for the tags
      // not visible included in an if statement
      if (!isInStub(self.root)) {
        self.parent.isMounted = self.isMounted = true
        self.trigger('mount')
      }
    })
  })


  defineProperty(this, 'unmount', function(keepRootTag) {
    var el = root,
      p = el.parentNode,
      ptag,
      tagIndex = __virtualDom.indexOf(self)

    self.trigger('before-unmount')

    // remove this tag instance from the global virtualDom variable
    if (~tagIndex)
      __virtualDom.splice(tagIndex, 1)

    if (p) {

      if (parent) {
        ptag = getImmediateCustomParentTag(parent)
        // remove this tag from the parent tags object
        // if there are multiple nested tags with same name..
        // remove this element form the array
        if (isArray(ptag.tags[tagName]))
          each(ptag.tags[tagName], function(tag, i) {
            if (tag._riot_id == self._riot_id)
              ptag.tags[tagName].splice(i, 1)
          })
        else
          // otherwise just delete the tag instance
          ptag.tags[tagName] = undefined
      }

      else
        while (el.firstChild) el.removeChild(el.firstChild)

      if (!keepRootTag)
        p.removeChild(el)
      else {
        // the riot-tag and the data-is attributes aren't needed anymore, remove them
        remAttr(p, RIOT_TAG_IS)
        remAttr(p, RIOT_TAG) // this will be removed in riot 3.0.0
      }

    }

    if (this._virts) {
      each(this._virts, function(v) {
        if (v.parentNode) v.parentNode.removeChild(v)
      })
    }

    self.trigger('unmount')
    toggle()
    self.off('*')
    self.isMounted = false
    delete root._tag

  })

  // proxy function to bind updates
  // dispatched from a parent tag
  function onChildUpdate(data) { self.update(data, true) }

  function toggle(isMount) {

    // mount/unmount children
    each(childTags, function(child) { child[isMount ? 'mount' : 'unmount']() })

    // listen/unlisten parent (events flow one way from parent to children)
    if (!parent) return
    var evt = isMount ? 'on' : 'off'

    // the loop tags will be always in sync with the parent automatically
    if (isLoop)
      parent[evt]('unmount', self.unmount)
    else {
      parent[evt]('update', onChildUpdate)[evt]('unmount', self.unmount)
    }
  }


  // named elements available for fn
  parseNamedElements(dom, this, childTags)

}
/**
 * Attach an event to a DOM node
 * @param { String } name - event name
 * @param { Function } handler - event callback
 * @param { Object } dom - dom node
 * @param { Tag } tag - tag instance
 */
function setEventHandler(name, handler, dom, tag) {

  dom[name] = function(e) {

    var ptag = tag._parent,
      item = tag._item,
      el

    if (!item)
      while (ptag && !item) {
        item = ptag._item
        ptag = ptag._parent
      }

    // cross browser event fix
    e = e || window.event

    // override the event properties
    if (isWritable(e, 'currentTarget')) e.currentTarget = dom
    if (isWritable(e, 'target')) e.target = e.srcElement
    if (isWritable(e, 'which')) e.which = e.charCode || e.keyCode

    e.item = item

    // prevent default behaviour (by default)
    if (handler.call(tag, e) !== true && !/radio|check/.test(dom.type)) {
      if (e.preventDefault) e.preventDefault()
      e.returnValue = false
    }

    if (!e.preventUpdate) {
      el = item ? getImmediateCustomParentTag(ptag) : tag
      el.update()
    }

  }

}


/**
 * Insert a DOM node replacing another one (used by if- attribute)
 * @param   { Object } root - parent node
 * @param   { Object } node - node replaced
 * @param   { Object } before - node added
 */
function insertTo(root, node, before) {
  if (!root) return
  root.insertBefore(before, node)
  root.removeChild(node)
}

/**
 * Update the expressions in a Tag instance
 * @param   { Array } expressions - expression that must be re evaluated
 * @param   { Tag } tag - tag instance
 */
function update(expressions, tag) {

  each(expressions, function(expr, i) {

    var dom = expr.dom,
      attrName = expr.attr,
      value = tmpl(expr.expr, tag),
      parent = expr.dom.parentNode

    if (expr.bool) {
      value = !!value
    } else if (value == null) {
      value = ''
    }

    // #1638: regression of #1612, update the dom only if the value of the
    // expression was changed
    if (expr.value === value) {
      return
    }
    expr.value = value

    // textarea and text nodes has no attribute name
    if (!attrName) {
      // about #815 w/o replace: the browser converts the value to a string,
      // the comparison by "==" does too, but not in the server
      value += ''
      // test for parent avoids error with invalid assignment to nodeValue
      if (parent) {
        if (parent.tagName === 'TEXTAREA') {
          parent.value = value                    // #1113
          if (!IE_VERSION) dom.nodeValue = value  // #1625 IE throws here, nodeValue
        }                                         // will be available on 'updated'
        else dom.nodeValue = value
      }
      return
    }

    // ~~#1612: look for changes in dom.value when updating the value~~
    if (attrName === 'value') {
      dom.value = value
      return
    }

    // remove original attribute
    remAttr(dom, attrName)

    // event handler
    if (isFunction(value)) {
      setEventHandler(attrName, value, dom, tag)

    // if- conditional
    } else if (attrName == 'if') {
      var stub = expr.stub,
        add = function() { insertTo(stub.parentNode, stub, dom) },
        remove = function() { insertTo(dom.parentNode, dom, stub) }

      // add to DOM
      if (value) {
        if (stub) {
          add()
          dom.inStub = false
          // avoid to trigger the mount event if the tags is not visible yet
          // maybe we can optimize this avoiding to mount the tag at all
          if (!isInStub(dom)) {
            walk(dom, function(el) {
              if (el._tag && !el._tag.isMounted)
                el._tag.isMounted = !!el._tag.trigger('mount')
            })
          }
        }
      // remove from DOM
      } else {
        stub = expr.stub = stub || document.createTextNode('')
        // if the parentNode is defined we can easily replace the tag
        if (dom.parentNode)
          remove()
        // otherwise we need to wait the updated event
        else (tag.parent || tag).one('updated', remove)

        dom.inStub = true
      }
    // show / hide
    } else if (attrName === 'show') {
      dom.style.display = value ? '' : 'none'

    } else if (attrName === 'hide') {
      dom.style.display = value ? 'none' : ''

    } else if (expr.bool) {
      dom[attrName] = value
      if (value) setAttr(dom, attrName, attrName)
      if (FIREFOX && attrName === 'selected' && dom.tagName === 'OPTION') {
        dom.__riot1374 = value   // #1374
      }

    } else if (value === 0 || value && typeof value !== T_OBJECT) {
      // <img src="{ expr }">
      if (startsWith(attrName, RIOT_PREFIX) && attrName != RIOT_TAG) {
        attrName = attrName.slice(RIOT_PREFIX.length)
      }
      setAttr(dom, attrName, value)
    }

  })

}
/**
 * Specialized function for looping an array-like collection with `each={}`
 * @param   { Array } els - collection of items
 * @param   {Function} fn - callback function
 * @returns { Array } the array looped
 */
function each(els, fn) {
  var len = els ? els.length : 0

  for (var i = 0, el; i < len; i++) {
    el = els[i]
    // return false -> current item was removed by fn during the loop
    if (el != null && fn(el, i) === false) i--
  }
  return els
}

/**
 * Detect if the argument passed is a function
 * @param   { * } v - whatever you want to pass to this function
 * @returns { Boolean } -
 */
function isFunction(v) {
  return typeof v === T_FUNCTION || false   // avoid IE problems
}

/**
 * Get the outer html of any DOM node SVGs included
 * @param   { Object } el - DOM node to parse
 * @returns { String } el.outerHTML
 */
function getOuterHTML(el) {
  if (el.outerHTML) return el.outerHTML
  // some browsers do not support outerHTML on the SVGs tags
  else {
    var container = mkEl('div')
    container.appendChild(el.cloneNode(true))
    return container.innerHTML
  }
}

/**
 * Set the inner html of any DOM node SVGs included
 * @param { Object } container - DOM node where we will inject the new html
 * @param { String } html - html to inject
 */
function setInnerHTML(container, html) {
  if (typeof container.innerHTML != T_UNDEF) container.innerHTML = html
  // some browsers do not support innerHTML on the SVGs tags
  else {
    var doc = new DOMParser().parseFromString(html, 'application/xml')
    container.appendChild(
      container.ownerDocument.importNode(doc.documentElement, true)
    )
  }
}

/**
 * Checks wether a DOM node must be considered part of an svg document
 * @param   { String }  name - tag name
 * @returns { Boolean } -
 */
function isSVGTag(name) {
  return ~SVG_TAGS_LIST.indexOf(name)
}

/**
 * Detect if the argument passed is an object, exclude null.
 * NOTE: Use isObject(x) && !isArray(x) to excludes arrays.
 * @param   { * } v - whatever you want to pass to this function
 * @returns { Boolean } -
 */
function isObject(v) {
  return v && typeof v === T_OBJECT         // typeof null is 'object'
}

/**
 * Remove any DOM attribute from a node
 * @param   { Object } dom - DOM node we want to update
 * @param   { String } name - name of the property we want to remove
 */
function remAttr(dom, name) {
  dom.removeAttribute(name)
}

/**
 * Convert a string containing dashes to camel case
 * @param   { String } string - input string
 * @returns { String } my-string -> myString
 */
function toCamel(string) {
  return string.replace(/-(\w)/g, function(_, c) {
    return c.toUpperCase()
  })
}

/**
 * Get the value of any DOM attribute on a node
 * @param   { Object } dom - DOM node we want to parse
 * @param   { String } name - name of the attribute we want to get
 * @returns { String | undefined } name of the node attribute whether it exists
 */
function getAttr(dom, name) {
  return dom.getAttribute(name)
}

/**
 * Set any DOM attribute
 * @param { Object } dom - DOM node we want to update
 * @param { String } name - name of the property we want to set
 * @param { String } val - value of the property we want to set
 */
function setAttr(dom, name, val) {
  dom.setAttribute(name, val)
}

/**
 * Detect the tag implementation by a DOM node
 * @param   { Object } dom - DOM node we need to parse to get its tag implementation
 * @returns { Object } it returns an object containing the implementation of a custom tag (template and boot function)
 */
function getTag(dom) {
  return dom.tagName && __tagImpl[getAttr(dom, RIOT_TAG_IS) ||
    getAttr(dom, RIOT_TAG) || dom.tagName.toLowerCase()]
}
/**
 * Add a child tag to its parent into the `tags` object
 * @param   { Object } tag - child tag instance
 * @param   { String } tagName - key where the new tag will be stored
 * @param   { Object } parent - tag instance where the new child tag will be included
 */
function addChildTag(tag, tagName, parent) {
  var cachedTag = parent.tags[tagName]

  // if there are multiple children tags having the same name
  if (cachedTag) {
    // if the parent tags property is not yet an array
    // create it adding the first cached tag
    if (!isArray(cachedTag))
      // don't add the same tag twice
      if (cachedTag !== tag)
        parent.tags[tagName] = [cachedTag]
    // add the new nested tag to the array
    if (!contains(parent.tags[tagName], tag))
      parent.tags[tagName].push(tag)
  } else {
    parent.tags[tagName] = tag
  }
}

/**
 * Move the position of a custom tag in its parent tag
 * @param   { Object } tag - child tag instance
 * @param   { String } tagName - key where the tag was stored
 * @param   { Number } newPos - index where the new tag will be stored
 */
function moveChildTag(tag, tagName, newPos) {
  var parent = tag.parent,
    tags
  // no parent no move
  if (!parent) return

  tags = parent.tags[tagName]

  if (isArray(tags))
    tags.splice(newPos, 0, tags.splice(tags.indexOf(tag), 1)[0])
  else addChildTag(tag, tagName, parent)
}

/**
 * Create a new child tag including it correctly into its parent
 * @param   { Object } child - child tag implementation
 * @param   { Object } opts - tag options containing the DOM node where the tag will be mounted
 * @param   { String } innerHTML - inner html of the child node
 * @param   { Object } parent - instance of the parent tag including the child custom tag
 * @returns { Object } instance of the new child tag just created
 */
function initChildTag(child, opts, innerHTML, parent) {
  var tag = new Tag(child, opts, innerHTML),
    tagName = getTagName(opts.root),
    ptag = getImmediateCustomParentTag(parent)
  // fix for the parent attribute in the looped elements
  tag.parent = ptag
  // store the real parent tag
  // in some cases this could be different from the custom parent tag
  // for example in nested loops
  tag._parent = parent

  // add this tag to the custom parent tag
  addChildTag(tag, tagName, ptag)
  // and also to the real parent tag
  if (ptag !== parent)
    addChildTag(tag, tagName, parent)
  // empty the child node once we got its template
  // to avoid that its children get compiled multiple times
  opts.root.innerHTML = ''

  return tag
}

/**
 * Loop backward all the parents tree to detect the first custom parent tag
 * @param   { Object } tag - a Tag instance
 * @returns { Object } the instance of the first custom parent tag found
 */
function getImmediateCustomParentTag(tag) {
  var ptag = tag
  while (!getTag(ptag.root)) {
    if (!ptag.parent) break
    ptag = ptag.parent
  }
  return ptag
}

/**
 * Helper function to set an immutable property
 * @param   { Object } el - object where the new property will be set
 * @param   { String } key - object key where the new property will be stored
 * @param   { * } value - value of the new property
* @param   { Object } options - set the propery overriding the default options
 * @returns { Object } - the initial object
 */
function defineProperty(el, key, value, options) {
  Object.defineProperty(el, key, extend({
    value: value,
    enumerable: false,
    writable: false,
    configurable: true
  }, options))
  return el
}

/**
 * Get the tag name of any DOM node
 * @param   { Object } dom - DOM node we want to parse
 * @returns { String } name to identify this dom node in riot
 */
function getTagName(dom) {
  var child = getTag(dom),
    namedTag = getAttr(dom, 'name'),
    tagName = namedTag && !tmpl.hasExpr(namedTag) ?
                namedTag :
              child ? child.name : dom.tagName.toLowerCase()

  return tagName
}

/**
 * Extend any object with other properties
 * @param   { Object } src - source object
 * @returns { Object } the resulting extended object
 *
 * var obj = { foo: 'baz' }
 * extend(obj, {bar: 'bar', foo: 'bar'})
 * console.log(obj) => {bar: 'bar', foo: 'bar'}
 *
 */
function extend(src) {
  var obj, args = arguments
  for (var i = 1; i < args.length; ++i) {
    if (obj = args[i]) {
      for (var key in obj) {
        // check if this property of the source object could be overridden
        if (isWritable(src, key))
          src[key] = obj[key]
      }
    }
  }
  return src
}

/**
 * Check whether an array contains an item
 * @param   { Array } arr - target array
 * @param   { * } item - item to test
 * @returns { Boolean } Does 'arr' contain 'item'?
 */
function contains(arr, item) {
  return ~arr.indexOf(item)
}

/**
 * Check whether an object is a kind of array
 * @param   { * } a - anything
 * @returns {Boolean} is 'a' an array?
 */
function isArray(a) { return Array.isArray(a) || a instanceof Array }

/**
 * Detect whether a property of an object could be overridden
 * @param   { Object }  obj - source object
 * @param   { String }  key - object property
 * @returns { Boolean } is this property writable?
 */
function isWritable(obj, key) {
  var props = Object.getOwnPropertyDescriptor(obj, key)
  return typeof obj[key] === T_UNDEF || props && props.writable
}


/**
 * With this function we avoid that the internal Tag methods get overridden
 * @param   { Object } data - options we want to use to extend the tag instance
 * @returns { Object } clean object without containing the riot internal reserved words
 */
function cleanUpData(data) {
  if (!(data instanceof Tag) && !(data && typeof data.trigger == T_FUNCTION))
    return data

  var o = {}
  for (var key in data) {
    if (!RESERVED_WORDS_BLACKLIST.test(key)) o[key] = data[key]
  }
  return o
}

/**
 * Walk down recursively all the children tags starting dom node
 * @param   { Object }   dom - starting node where we will start the recursion
 * @param   { Function } fn - callback to transform the child node just found
 */
function walk(dom, fn) {
  if (dom) {
    // stop the recursion
    if (fn(dom) === false) return
    else {
      dom = dom.firstChild

      while (dom) {
        walk(dom, fn)
        dom = dom.nextSibling
      }
    }
  }
}

/**
 * Minimize risk: only zero or one _space_ between attr & value
 * @param   { String }   html - html string we want to parse
 * @param   { Function } fn - callback function to apply on any attribute found
 */
function walkAttributes(html, fn) {
  var m,
    re = /([-\w]+) ?= ?(?:"([^"]*)|'([^']*)|({[^}]*}))/g

  while (m = re.exec(html)) {
    fn(m[1].toLowerCase(), m[2] || m[3] || m[4])
  }
}

/**
 * Check whether a DOM node is in stub mode, useful for the riot 'if' directive
 * @param   { Object }  dom - DOM node we want to parse
 * @returns { Boolean } -
 */
function isInStub(dom) {
  while (dom) {
    if (dom.inStub) return true
    dom = dom.parentNode
  }
  return false
}

/**
 * Create a generic DOM node
 * @param   { String } name - name of the DOM node we want to create
 * @param   { Boolean } isSvg - should we use a SVG as parent node?
 * @returns { Object } DOM node just created
 */
function mkEl(name, isSvg) {
  return isSvg ?
    document.createElementNS('http://www.w3.org/2000/svg', 'svg') :
    document.createElement(name)
}

/**
 * Shorter and fast way to select multiple nodes in the DOM
 * @param   { String } selector - DOM selector
 * @param   { Object } ctx - DOM node where the targets of our search will is located
 * @returns { Object } dom nodes found
 */
function $$(selector, ctx) {
  return (ctx || document).querySelectorAll(selector)
}

/**
 * Shorter and fast way to select a single node in the DOM
 * @param   { String } selector - unique dom selector
 * @param   { Object } ctx - DOM node where the target of our search will is located
 * @returns { Object } dom node found
 */
function $(selector, ctx) {
  return (ctx || document).querySelector(selector)
}

/**
 * Simple object prototypal inheritance
 * @param   { Object } parent - parent object
 * @returns { Object } child instance
 */
function inherit(parent) {
  function Child() {}
  Child.prototype = parent
  return new Child()
}

/**
 * Get the name property needed to identify a DOM node in riot
 * @param   { Object } dom - DOM node we need to parse
 * @returns { String | undefined } give us back a string to identify this dom node
 */
function getNamedKey(dom) {
  return getAttr(dom, 'id') || getAttr(dom, 'name')
}

/**
 * Set the named properties of a tag element
 * @param { Object } dom - DOM node we need to parse
 * @param { Object } parent - tag instance where the named dom element will be eventually added
 * @param { Array } keys - list of all the tag instance properties
 */
function setNamed(dom, parent, keys) {
  // get the key value we want to add to the tag instance
  var key = getNamedKey(dom),
    isArr,
    // add the node detected to a tag instance using the named property
    add = function(value) {
      // avoid to override the tag properties already set
      if (contains(keys, key)) return
      // check whether this value is an array
      isArr = isArray(value)
      // if the key was never set
      if (!value)
        // set it once on the tag instance
        parent[key] = dom
      // if it was an array and not yet set
      else if (!isArr || isArr && !contains(value, dom)) {
        // add the dom node into the array
        if (isArr)
          value.push(dom)
        else
          parent[key] = [value, dom]
      }
    }

  // skip the elements with no named properties
  if (!key) return

  // check whether this key has been already evaluated
  if (tmpl.hasExpr(key))
    // wait the first updated event only once
    parent.one('mount', function() {
      key = getNamedKey(dom)
      add(parent[key])
    })
  else
    add(parent[key])

}

/**
 * Faster String startsWith alternative
 * @param   { String } src - source string
 * @param   { String } str - test string
 * @returns { Boolean } -
 */
function startsWith(src, str) {
  return src.slice(0, str.length) === str
}

/**
 * requestAnimationFrame function
 * Adapted from https://gist.github.com/paulirish/1579671, license MIT
 */
var rAF = (function (w) {
  var raf = w.requestAnimationFrame    ||
            w.mozRequestAnimationFrame || w.webkitRequestAnimationFrame

  if (!raf || /iP(ad|hone|od).*OS 6/.test(w.navigator.userAgent)) {  // buggy iOS6
    var lastTime = 0

    raf = function (cb) {
      var nowtime = Date.now(), timeout = Math.max(16 - (nowtime - lastTime), 0)
      setTimeout(function () { cb(lastTime = nowtime + timeout) }, timeout)
    }
  }
  return raf

})(window || {})

/**
 * Mount a tag creating new Tag instance
 * @param   { Object } root - dom node where the tag will be mounted
 * @param   { String } tagName - name of the riot tag we want to mount
 * @param   { Object } opts - options to pass to the Tag instance
 * @returns { Tag } a new Tag instance
 */
function mountTo(root, tagName, opts) {
  var tag = __tagImpl[tagName],
    // cache the inner HTML to fix #855
    innerHTML = root._innerHTML = root._innerHTML || root.innerHTML

  // clear the inner html
  root.innerHTML = ''

  if (tag && root) tag = new Tag(tag, { root: root, opts: opts }, innerHTML)

  if (tag && tag.mount) {
    tag.mount()
    // add this tag to the virtualDom variable
    if (!contains(__virtualDom, tag)) __virtualDom.push(tag)
  }

  return tag
}
/**
 * Riot public api
 */

// share methods for other riot parts, e.g. compiler
riot.util = { brackets: brackets, tmpl: tmpl }

/**
 * Create a mixin that could be globally shared across all the tags
 */
riot.mixin = (function() {
  var mixins = {},
    globals = mixins[GLOBAL_MIXIN] = {},
    _id = 0

  /**
   * Create/Return a mixin by its name
   * @param   { String }  name - mixin name (global mixin if object)
   * @param   { Object }  mixin - mixin logic
   * @param   { Boolean } g - is global?
   * @returns { Object }  the mixin logic
   */
  return function(name, mixin, g) {
    // Unnamed global
    if (isObject(name)) {
      riot.mixin('__unnamed_'+_id++, name, true)
      return
    }

    var store = g ? globals : mixins

    // Getter
    if (!mixin) {
      if (typeof store[name] === T_UNDEF) {
        throw new Error('Unregistered mixin: ' + name)
      }
      return store[name]
    }
    // Setter
    if (isFunction(mixin)) {
      extend(mixin.prototype, store[name] || {})
      store[name] = mixin
    }
    else {
      store[name] = extend(store[name] || {}, mixin)
    }
  }

})()

/**
 * Create a new riot tag implementation
 * @param   { String }   name - name/id of the new riot tag
 * @param   { String }   html - tag template
 * @param   { String }   css - custom tag css
 * @param   { String }   attrs - root tag attributes
 * @param   { Function } fn - user function
 * @returns { String } name/id of the tag just created
 */
riot.tag = function(name, html, css, attrs, fn) {
  if (isFunction(attrs)) {
    fn = attrs
    if (/^[\w\-]+\s?=/.test(css)) {
      attrs = css
      css = ''
    } else attrs = ''
  }
  if (css) {
    if (isFunction(css)) fn = css
    else styleManager.add(css)
  }
  name = name.toLowerCase()
  __tagImpl[name] = { name: name, tmpl: html, attrs: attrs, fn: fn }
  return name
}

/**
 * Create a new riot tag implementation (for use by the compiler)
 * @param   { String }   name - name/id of the new riot tag
 * @param   { String }   html - tag template
 * @param   { String }   css - custom tag css
 * @param   { String }   attrs - root tag attributes
 * @param   { Function } fn - user function
 * @returns { String } name/id of the tag just created
 */
riot.tag2 = function(name, html, css, attrs, fn) {
  if (css) styleManager.add(css)
  //if (bpair) riot.settings.brackets = bpair
  __tagImpl[name] = { name: name, tmpl: html, attrs: attrs, fn: fn }
  return name
}

/**
 * Mount a tag using a specific tag implementation
 * @param   { String } selector - tag DOM selector
 * @param   { String } tagName - tag implementation name
 * @param   { Object } opts - tag logic
 * @returns { Array } new tags instances
 */
riot.mount = function(selector, tagName, opts) {

  var els,
    allTags,
    tags = []

  // helper functions

  function addRiotTags(arr) {
    var list = ''
    each(arr, function (e) {
      if (!/[^-\w]/.test(e)) {
        e = e.trim().toLowerCase()
        list += ',[' + RIOT_TAG_IS + '="' + e + '"],[' + RIOT_TAG + '="' + e + '"]'
      }
    })
    return list
  }

  function selectAllTags() {
    var keys = Object.keys(__tagImpl)
    return keys + addRiotTags(keys)
  }

  function pushTags(root) {
    if (root.tagName) {
      var riotTag = getAttr(root, RIOT_TAG_IS) || getAttr(root, RIOT_TAG)

      // have tagName? force riot-tag to be the same
      if (tagName && riotTag !== tagName) {
        riotTag = tagName
        setAttr(root, RIOT_TAG_IS, tagName)
        setAttr(root, RIOT_TAG, tagName) // this will be removed in riot 3.0.0
      }
      var tag = mountTo(root, riotTag || root.tagName.toLowerCase(), opts)

      if (tag) tags.push(tag)
    } else if (root.length) {
      each(root, pushTags)   // assume nodeList
    }
  }

  // ----- mount code -----

  // inject styles into DOM
  styleManager.inject()

  if (isObject(tagName)) {
    opts = tagName
    tagName = 0
  }

  // crawl the DOM to find the tag
  if (typeof selector === T_STRING) {
    if (selector === '*')
      // select all the tags registered
      // and also the tags found with the riot-tag attribute set
      selector = allTags = selectAllTags()
    else
      // or just the ones named like the selector
      selector += addRiotTags(selector.split(/, */))

    // make sure to pass always a selector
    // to the querySelectorAll function
    els = selector ? $$(selector) : []
  }
  else
    // probably you have passed already a tag or a NodeList
    els = selector

  // select all the registered and mount them inside their root elements
  if (tagName === '*') {
    // get all custom tags
    tagName = allTags || selectAllTags()
    // if the root els it's just a single tag
    if (els.tagName)
      els = $$(tagName, els)
    else {
      // select all the children for all the different root elements
      var nodeList = []
      each(els, function (_el) {
        nodeList.push($$(tagName, _el))
      })
      els = nodeList
    }
    // get rid of the tagName
    tagName = 0
  }

  pushTags(els)

  return tags
}

/**
 * Update all the tags instances created
 * @returns { Array } all the tags instances
 */
riot.update = function() {
  return each(__virtualDom, function(tag) {
    tag.update()
  })
}

/**
 * Export the Virtual DOM
 */
riot.vdom = __virtualDom

/**
 * Export the Tag constructor
 */
riot.Tag = Tag
  // support CommonJS, AMD & browser
  /* istanbul ignore next */
  if (typeof exports === T_OBJECT)
    module.exports = riot
  else if (typeof define === T_FUNCTION && typeof define.amd !== T_UNDEF)
    define(function() { return riot })
  else
    window.riot = riot

})(typeof window != 'undefined' ? window : void 0);

},{}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJqcy9zcmMva29lLXVpLWNvcmUuanMiLCJqcy9zcmMvbWFpbi5qcyIsImpzL3NyYy9yaW90LXRhZ3Mva29lLXVpLWJhc2ljY2hhdC50YWciLCJub2RlX21vZHVsZXMvYnJvd3Nlci1jb29raWVzL3NyYy9icm93c2VyLWNvb2tpZXMuanMiLCJub2RlX21vZHVsZXMvcmlvdC9yaW90LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBjb29raWVzID0gcmVxdWlyZSgnYnJvd3Nlci1jb29raWVzJyk7XG5cbnZhciBrb2VVSWNvcmUgPSB7XG5cbiAgICAvLyAqIGpzLWNvb2tpZeS+neWtmFxuXG4gICAgLy8gVUnjga7jgr/jgqTjg5fjga7lpoLkvZXjgavplqLjgo/jgonjgZrjgIHlhbHpgJrjgZnjgovmqZ/og73jgpLjgZPjgZPjgavmoLzntI3jgZnjgotcblxuICAgIC8vICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgLy8g5aSJ5pWwXG4gICAgLy8gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICBjb252SUQ6IG51bGwsIC8vIOOCq+ODs+ODkOOCu+ODvOOCt+ODp+ODs0lEOiBEaXJlY3RMaW5lQVBJ44GM44CB5Lya6Kmx44KS6KiY6Yyy44GZ44KL44Gf44KB44GuSUTjgIIzMOWIhuOBp+eEoeWKueOBq+OBquOCi1xuICAgIHdhdGVybWFyazogbnVsbCwgLy8g44Km44Kp44O844K/44O844Oe44O844KvOiDjgZPjga7mjIflrprjgpLjgZnjgovjgajjgIHmlrDjgZfjgYTnmbroqIDjgaDjgZHlj5blvpfjgafjgY3jgotcbiAgICBtc2dPYmo6IHt9LCAvLyDjg6Hjg4Pjgrvjg7zjgrjjgpLmoLzntI3jgZnjgovjgqrjg5bjgrjjgqfjgq/jg4hcbiAgICBmcm9tOiBudWxsLCAvLyDjgqbjgqnjg7zjgr/jg7zjg5Xjgqnjg7zjg6vjga7kvJroqbHjgpLmraPjgZfjgY/li5XkvZzjgZXjgZvjgovjgZ/jgoHjgavjga/jgIHpgIHkv6HjgZnjgottZXNzYWdl44GrZnJvbeOCkuaMh+WumuOBl+OBvuOBmVxuXG4gICAgLy8gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAvLyDjgqvjg7Pjg5Djgrvjg7zjgrfjg6fjg7NJROOBruWIpOWumuODu+S9nOaIkOOCkuOBl+OBvuOBmVxuICAgIC8vICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG5cbiAgICBpbml0OiBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzOyAvLyB0aGF044GvUmlvdOOBruOCq+OCueOCv+ODoOOCv+OCsOOCkuaMh+OBmVxuICAgICAgICB2YXIgY29va2llX0NvbnZJRCA9IGNvb2tpZXMuZ2V0KCdjb252SUQnKTtcblxuICAgICAgICAvLyDjgq/jg4Pjgq3jg7zjgavjgqvjg7Pjg5Djgrvjg7zjgrfjg6fjg7NJROOBjOOBmeOBp+OBq+OBguOCi+OBi+iqv+OBueOCi1xuICAgICAgICBpZiAoY29va2llX0NvbnZJRCA9PSB1bmRlZmluZWQpIHtcblxuICAgICAgICAgICAgLy8g44Gv44O844GE44CC44Gq44GE5Lq644Gv44GT44Gh44KJ44G444Gp44GG44Ge44CcXG5cbiAgICAgICAgICAgIC8vIOOCquODl+OCt+ODp+ODs+OCkuaMh+WumlxuICAgICAgICAgICAgdmFyIG15SW5pdCA9IHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICAgICAgICdjb250ZW50LXR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICAgICAgICAgICdBdXRob3JpemF0aW9uJzogJ0JvdGNvbm5lY3RvciAnICsgdGhpcy5vcHRzLnRva2VuXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLy8g44Oq44Kv44Ko44K544OI44KS5oyH5a6aXG4gICAgICAgICAgICB2YXIgbXlSZXF1ZXN0ID0gbmV3IFJlcXVlc3QoJ2h0dHBzOi8vZGlyZWN0bGluZS5ib3RmcmFtZXdvcmsuY29tL2FwaS9jb252ZXJzYXRpb25zJywgbXlJbml0KTtcblxuICAgICAgICAgICAgLy8gZmV0Y2jplovlp4vjgaDjgb3jgaPjgb1cbiAgICAgICAgICAgIGZldGNoKG15UmVxdWVzdClcbiAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGF0YS5qc29uKCkgLy8g57Sb44KJ44KP44GX44GE44GL44KJSlNPTuOBq+OBmeOCi+OBveOBo+OBvVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gMzDliIbjgYzmnJ/pmZDjga7jgq/jg4Pjgq3jg7zjgpLnmbrooYzjgIHjgqvjg7Pjg5Djgrvjg7zjgrfjg6fjg7NJROOCkuiomOaGtuOBl+OBpuOBiuOBj1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICAgICAgICAgIGRhdGUuc2V0VGltZShkYXRlLmdldFRpbWUoKSArICgzMCAqIDYwICogMTAwMCkpO1xuICAgICAgICAgICAgICAgICAgICBjb29raWVzLnNldChcImNvbnZJRFwiLCByZXNwb25zZS5jb252ZXJzYXRpb25JZCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXhwaXJlczogZGF0ZVxuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAvLyDjgqvjg7Pjg5Djgrvjg7zjgrfjg6fjg7NJROOCknJpb3Tjgavjgo/jgZ/jgZfjgabjgIF1cGRhdGVcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5jb252SUQgPSByZXNwb25zZS5jb252ZXJzYXRpb25JZDtcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5mcm9tID0gJ3VzZXJfJyt0aGF0LmNvbnZJRDsgLy8gZnJvbeeUqOOBruaWh+Wtl+WIl+OCguS9nOaIkFxuICAgICAgICAgICAgICAgICAgICB0aGF0LnVwZGF0ZSgpO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgIC8vIOOBiOOAgeOBguOCi+OBru+8n+OBguOCi++8n+OAgOOBguOCi+OCk+OBoC4uLlxuICAgICAgICAgICAgLy8g44GY44KD44GC5pei5a2Y44Gu44KC44Gu44KScmlvdOOBq+OCj+OBn+OBl+OBpuOAgXVwZGF0ZVxuICAgICAgICAgICAgdGhhdC5jb252SUQgPSBjb29raWVfQ29udklEO1xuICAgICAgICAgICAgdGhhdC5mcm9tID0gJ3VzZXJfJyt0aGF0LmNvbnZJRDsgLy8gZnJvbeeUqOOBruaWh+Wtl+WIl+OCguS9nOaIkFxuICAgICAgICAgICAgdGhhdC51cGRhdGUoKTtcblxuICAgICAgICB9XG4gICAgfSxcbiAgICBnZXRNZXNzYWdlOiBmdW5jdGlvbiAoY29udklELCB3YXRlcm1hcmssIGNhbGxiYWNrQWN0aW9uKSB7XG5cbiAgICAgICAgY29uc29sZS5sb2coJ0tvZVVJY29yZS5qczogZ2V0TWVzc2FnZScpO1xuXG4gICAgICAgIGlmIChjb252SUQgPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnS29lVUljb3JlLmpzOiDjgqvjg7Pjg5Djgrvjg7zjgrfjg6fjg7NJROOBjOOBguOCiuOBvuOBm+OCkycpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzOyAvLyB0aGF044GvUmlvdOOBruOCq+OCueOCv+ODoOOCv+OCsOOCkuaMh+OBmVxuICAgICAgICB2YXIgZ2V0X3VybDtcblxuICAgICAgICAvL+OCpuOCqeODvOOCv+ODvOODnuODvOOCr+aMh+WumuOBjOOBguOCi+OBi+iqv+OBueOCi1xuICAgICAgICBpZiAod2F0ZXJtYXJrKSB7XG4gICAgICAgICAgICAvLyDmjIflrprjgYzjgYLjgozjgbDjgIHjgqbjgqnjg7zjgr/jg7zjg57jg7zjgq/ku5jjgY3jga5VUkzjgadHRVTjgZnjgovjgIJcbiAgICAgICAgICAgIGdldF91cmwgPSAnaHR0cHM6Ly9kaXJlY3RsaW5lLmJvdGZyYW1ld29yay5jb20vYXBpL2NvbnZlcnNhdGlvbnMvJyArIGNvbnZJRCArICcvbWVzc2FnZXM/d2F0ZXJtYXJrPScgKyB3YXRlcm1hcms7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyDjgarjgZHjgozjgbDjgZ3jga7jgb7jgb7jgILjgqbjgqnjg7zjgr/jg7zjg57jg7zjgq/jgYzjgarjgZHjgozjgbDjgIHlhajjgabjga7jg6Hjg4Pjgrvjg7zjgrjjgpLlj5blvpfjgZnjgovjgIJcbiAgICAgICAgICAgIGdldF91cmwgPSAnaHR0cHM6Ly9kaXJlY3RsaW5lLmJvdGZyYW1ld29yay5jb20vYXBpL2NvbnZlcnNhdGlvbnMvJyArIGNvbnZJRCArICcvbWVzc2FnZXMnO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g44Kq44OX44K344On44Oz44KS5oyH5a6aXG4gICAgICAgIHZhciBteUluaXQgPSB7XG4gICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgICdjb250ZW50LXR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICAgICAgJ0F1dGhvcml6YXRpb24nOiAnQm90Y29ubmVjdG9yICcgKyB0aGlzLm9wdHMudG9rZW5cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgICAgIH07XG4gICAgICAgIC8vIOODquOCr+OCqOOCueODiOOCkuaMh+WumlxuICAgICAgICB2YXIgbXlSZXF1ZXN0ID0gbmV3IFJlcXVlc3QoZ2V0X3VybCwgbXlJbml0KTtcblxuICAgICAgICAvLyBmZXRjaOmWi+Wni1xuICAgICAgICBmZXRjaChteVJlcXVlc3QpXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkYXRhLmpzb24oKSAvLyBKU09O44Gr44GZ44KLXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG5cbiAgICAgICAgICAgICAgICAvLyDjgZnjgafjgavmoLzntI3jgZfjgabjgYTjgot3YXRlcm1hcmvjgpLmm7TmlrBcbiAgICAgICAgICAgICAgICB0aGF0LndhdGVybWFyayA9IHJlc3BvbnNlLndhdGVybWFyaztcblxuICAgICAgICAgICAgICAgIC8vIOWPluW+l+OBl+OBn+S8muipseOCkuagvOe0jVxuICAgICAgICAgICAgICAgIHRoYXQubXNnT2JqID0gcmVzcG9uc2U7XG5cbiAgICAgICAgICAgICAgICAvLyBWaWV344KS44Ki44OD44OX44OH44O844OIXG4gICAgICAgICAgICAgICAgdGhhdC51cGRhdGUoKTtcblxuICAgICAgICAgICAgICAgIGlmKGNhbGxiYWNrQWN0aW9uKXtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2tBY3Rpb24oKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH0pO1xuICAgIH0sXG4gICAgc2VuZE1lc3NhZ2U6IGZ1bmN0aW9uIChjb252SUQsIHRleHQsIGZyb20pIHtcblxuICAgICAgICBjb25zb2xlLmxvZyh0ZXh0KTtcbiAgICAgICAgY29uc29sZS5sb2coJ0tvZVVJY29yZS5qczogc2VuZE1lc3NhZ2UnKTtcblxuICAgICAgICB2YXIgc2VuZF91cmwgPSAnaHR0cHM6Ly9kaXJlY3RsaW5lLmJvdGZyYW1ld29yay5jb20vYXBpL2NvbnZlcnNhdGlvbnMvJyArIGNvbnZJRCArICcvbWVzc2FnZXMnO1xuXG4gICAgICAgIC8vIOOCquODl+OCt+ODp+ODs+OCkuaMh+WumlxuICAgICAgICB2YXIgbXlJbml0ID0ge1xuICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICAgJ2NvbnRlbnQtdHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgICAgICAnQXV0aG9yaXphdGlvbic6ICdCb3Rjb25uZWN0b3IgJyArIHRoaXMub3B0cy50b2tlblxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgICAndGV4dCc6IHRleHQsXG4gICAgICAgICAgICAgICAgJ2Zyb20nOiBmcm9tXG4gICAgICAgICAgICB9KVxuICAgICAgICB9O1xuICAgICAgICAvLyDjg6rjgq/jgqjjgrnjg4jjgpLmjIflrppcbiAgICAgICAgdmFyIG15UmVxdWVzdCA9IG5ldyBSZXF1ZXN0KHNlbmRfdXJsLCBteUluaXQpO1xuXG4gICAgICAgIC8vIGZldGNo6ZaL5aeL44Gg44G944Gj44G9XG4gICAgICAgIGZldGNoKG15UmVxdWVzdCk7XG5cbiAgICB9XG5cbn07XG5cbm1vZHVsZS5leHBvcnRzID0ga29lVUljb3JlO1xuIiwidmFyIHJpb3QgPSByZXF1aXJlKCdyaW90Jyk7XG5cbnJlcXVpcmUoJy4vcmlvdC10YWdzL2tvZS11aS1iYXNpY2NoYXQudGFnJyk7XG5cbnJpb3QubW91bnQoJyonKTtcbiIsInZhciByaW90ID0gcmVxdWlyZSgncmlvdCcpO1xubW9kdWxlLmV4cG9ydHMgPSByaW90LnRhZzIoJ2tvZS11aS1iYXNpY2NoYXQnLCAnPGxpbmsgaHJlZj1cImh0dHBzOi8vZm9udHMuZ29vZ2xlYXBpcy5jb20vaWNvbj9mYW1pbHk9TWF0ZXJpYWwrSWNvbnNcIiByZWw9XCJzdHlsZXNoZWV0XCI+IDxkaXYgY2xhc3M9XCJjaGF0U2NyZWVuXCI+IDxkaXYgY2xhc3M9XCJtZXNzYWdlIF93ZWxjb21lXCI+IDxzcGFuPkhpLCBJIGFtIGEgYm90ISBIb3cgYXJlIHlvdT88L3NwYW4+IDwvZGl2PiA8ZGl2IGVhY2g9XCJ7bXNnT2JqLm1lc3NhZ2VzfVwiPiA8ZGl2IGNsYXNzPVwibWVzc2FnZSB7ZmlsdGVyX21lKCBmcm9tICl9XCI+IDxzcGFuPnt0ZXh0fTwvc3Bhbj4gPC9kaXY+IDwvZGl2PiA8L2Rpdj4gPGRpdj4gPGZvcm0gb25zdWJtaXQ9XCJ7c2VuZF9hbmRfcG9sbGluZ31cIj4gPGlucHV0IHR5cGU9XCJ0ZXh0XCIgb25rZXl1cD1cIntlZGl0fVwiPiA8YnV0dG9uIF9fZGlzYWJsZWQ9XCJ7IXRleHR9XCI+IDxpIGNsYXNzPVwibWF0ZXJpYWwtaWNvbnNcIj5zZW5kPC9pPiA8L2J1dHRvbj4gPC9mb3JtPiA8L2Rpdj4nLCAna29lLXVpLWJhc2ljY2hhdCxbcmlvdC10YWc9XCJrb2UtdWktYmFzaWNjaGF0XCJdLFtkYXRhLWlzPVwia29lLXVpLWJhc2ljY2hhdFwiXXsgZGlzcGxheTogYmxvY2s7IGJvcmRlcjogMnB4IHNvbGlkICNkOWQ5ZDk7IGJvcmRlci1yYWRpdXM6IDdweDsgcGFkZGluZzogMTBweDsgYm94LXNpemluZzogYm9yZGVyLWJveDsgfSBrb2UtdWktYmFzaWNjaGF0ICosW3Jpb3QtdGFnPVwia29lLXVpLWJhc2ljY2hhdFwiXSAqLFtkYXRhLWlzPVwia29lLXVpLWJhc2ljY2hhdFwiXSAqeyBib3gtc2l6aW5nOiBib3JkZXItYm94OyB9IGtvZS11aS1iYXNpY2NoYXQgLmNoYXRTY3JlZW4sW3Jpb3QtdGFnPVwia29lLXVpLWJhc2ljY2hhdFwiXSAuY2hhdFNjcmVlbixbZGF0YS1pcz1cImtvZS11aS1iYXNpY2NoYXRcIl0gLmNoYXRTY3JlZW57IGRpc3BsYXk6IGJsb2NrOyBwYWRkaW5nOiAxMHB4OyBoZWlnaHQ6IDIwMHB4OyBtYXJnaW4tYm90dG9tOiAxMHB4OyBvdmVyZmxvdzogYXV0bzsgfSBrb2UtdWktYmFzaWNjaGF0IC5tZXNzYWdlLFtyaW90LXRhZz1cImtvZS11aS1iYXNpY2NoYXRcIl0gLm1lc3NhZ2UsW2RhdGEtaXM9XCJrb2UtdWktYmFzaWNjaGF0XCJdIC5tZXNzYWdleyBtYXJnaW46IDEwcHg7IH0ga29lLXVpLWJhc2ljY2hhdCAubWVzc2FnZSA+IHNwYW4sW3Jpb3QtdGFnPVwia29lLXVpLWJhc2ljY2hhdFwiXSAubWVzc2FnZSA+IHNwYW4sW2RhdGEtaXM9XCJrb2UtdWktYmFzaWNjaGF0XCJdIC5tZXNzYWdlID4gc3BhbnsgZGlzcGxheTogaW5saW5lLWJsb2NrOyBiYWNrZ3JvdW5kOiAjRjFGMEYwOyBwYWRkaW5nOiA1cHggMTVweDsgYm9yZGVyLXJhZGl1czogMjBweDsgfSBrb2UtdWktYmFzaWNjaGF0IC5tZXNzYWdlLl9tZSxbcmlvdC10YWc9XCJrb2UtdWktYmFzaWNjaGF0XCJdIC5tZXNzYWdlLl9tZSxbZGF0YS1pcz1cImtvZS11aS1iYXNpY2NoYXRcIl0gLm1lc3NhZ2UuX21leyB0ZXh0LWFsaWduOiByaWdodDsgfSBrb2UtdWktYmFzaWNjaGF0IC5tZXNzYWdlLl9tZSA+IHNwYW4sW3Jpb3QtdGFnPVwia29lLXVpLWJhc2ljY2hhdFwiXSAubWVzc2FnZS5fbWUgPiBzcGFuLFtkYXRhLWlzPVwia29lLXVpLWJhc2ljY2hhdFwiXSAubWVzc2FnZS5fbWUgPiBzcGFueyBjb2xvcjogI2ZmZjsgYmFja2dyb3VuZDogIzQxZTY2NzsgfSBrb2UtdWktYmFzaWNjaGF0IGZvcm0sW3Jpb3QtdGFnPVwia29lLXVpLWJhc2ljY2hhdFwiXSBmb3JtLFtkYXRhLWlzPVwia29lLXVpLWJhc2ljY2hhdFwiXSBmb3JteyBkaXNwbGF5OiBibG9jazsgcG9zaXRpb246IHJlbGF0aXZlOyB9IGtvZS11aS1iYXNpY2NoYXQgaW5wdXQsW3Jpb3QtdGFnPVwia29lLXVpLWJhc2ljY2hhdFwiXSBpbnB1dCxbZGF0YS1pcz1cImtvZS11aS1iYXNpY2NoYXRcIl0gaW5wdXR7IGRpc3BsYXk6IGJsb2NrOyB3aWR0aDogMTAwJTsgYm9yZGVyOiAycHggc29saWQgI2Q5ZDlkOTsgYm9yZGVyLXJhZGl1czogN3B4OyBwYWRkaW5nOiA4cHg7IGZvbnQtc2l6ZTogMTZweDsgfSBrb2UtdWktYmFzaWNjaGF0IGlucHV0OmFjdGl2ZSxbcmlvdC10YWc9XCJrb2UtdWktYmFzaWNjaGF0XCJdIGlucHV0OmFjdGl2ZSxbZGF0YS1pcz1cImtvZS11aS1iYXNpY2NoYXRcIl0gaW5wdXQ6YWN0aXZlLGtvZS11aS1iYXNpY2NoYXQgaW5wdXQ6Zm9jdXMsW3Jpb3QtdGFnPVwia29lLXVpLWJhc2ljY2hhdFwiXSBpbnB1dDpmb2N1cyxbZGF0YS1pcz1cImtvZS11aS1iYXNpY2NoYXRcIl0gaW5wdXQ6Zm9jdXN7IG91dGxpbmU6IG5vbmU7IGJvcmRlcjogMnB4IHNvbGlkICNhZmFmYWY7IH0ga29lLXVpLWJhc2ljY2hhdCBidXR0b24sW3Jpb3QtdGFnPVwia29lLXVpLWJhc2ljY2hhdFwiXSBidXR0b24sW2RhdGEtaXM9XCJrb2UtdWktYmFzaWNjaGF0XCJdIGJ1dHRvbnsgZGlzcGxheTogYmxvY2s7IHBvc2l0aW9uOiBhYnNvbHV0ZTsgcmlnaHQ6IDdweDsgdG9wOiA1cHg7IGJhY2tncm91bmQ6IG5vbmU7IGJvcmRlcjogbm9uZTsgb3V0bGluZTogbm9uZTsgY3Vyc29yOiBwb2ludGVyOyBjb2xvcjogIzg0ODQ4NDsgfSBrb2UtdWktYmFzaWNjaGF0IGJ1dHRvbltkaXNhYmxlZD1cImRpc2FibGVkXCJdLFtyaW90LXRhZz1cImtvZS11aS1iYXNpY2NoYXRcIl0gYnV0dG9uW2Rpc2FibGVkPVwiZGlzYWJsZWRcIl0sW2RhdGEtaXM9XCJrb2UtdWktYmFzaWNjaGF0XCJdIGJ1dHRvbltkaXNhYmxlZD1cImRpc2FibGVkXCJdeyBvcGFjaXR5OiAwLjM7IH0ga29lLXVpLWJhc2ljY2hhdCAubG9hZGVyLFtyaW90LXRhZz1cImtvZS11aS1iYXNpY2NoYXRcIl0gLmxvYWRlcixbZGF0YS1pcz1cImtvZS11aS1iYXNpY2NoYXRcIl0gLmxvYWRlcnsgbWFyZ2luOiA2MHB4IGF1dG87IGZvbnQtc2l6ZTogMTBweDsgcG9zaXRpb246IHJlbGF0aXZlOyB0ZXh0LWluZGVudDogLTk5OTllbTsgYm9yZGVyLXRvcDogMS4xZW0gc29saWQgcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjIpOyBib3JkZXItcmlnaHQ6IDEuMWVtIHNvbGlkIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4yKTsgYm9yZGVyLWJvdHRvbTogMS4xZW0gc29saWQgcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjIpOyBib3JkZXItbGVmdDogMS4xZW0gc29saWQgI2ZmZmZmZjsgLXdlYmtpdC10cmFuc2Zvcm06IHRyYW5zbGF0ZVooMCk7IC1tcy10cmFuc2Zvcm06IHRyYW5zbGF0ZVooMCk7IHRyYW5zZm9ybTogdHJhbnNsYXRlWigwKTsgLXdlYmtpdC1hbmltYXRpb246IGxvYWQ4IDEuMXMgaW5maW5pdGUgbGluZWFyOyBhbmltYXRpb246IGxvYWQ4IDEuMXMgaW5maW5pdGUgbGluZWFyOyB9IGtvZS11aS1iYXNpY2NoYXQgLmxvYWRlcixbcmlvdC10YWc9XCJrb2UtdWktYmFzaWNjaGF0XCJdIC5sb2FkZXIsW2RhdGEtaXM9XCJrb2UtdWktYmFzaWNjaGF0XCJdIC5sb2FkZXIsa29lLXVpLWJhc2ljY2hhdCAubG9hZGVyOmFmdGVyLFtyaW90LXRhZz1cImtvZS11aS1iYXNpY2NoYXRcIl0gLmxvYWRlcjphZnRlcixbZGF0YS1pcz1cImtvZS11aS1iYXNpY2NoYXRcIl0gLmxvYWRlcjphZnRlcnsgYm9yZGVyLXJhZGl1czogNTAlOyB3aWR0aDogMTBlbTsgaGVpZ2h0OiAxMGVtOyB9IEAtd2Via2l0LWtleWZyYW1lcyBsb2FkOCB7IDAlIHsgLXdlYmtpdC10cmFuc2Zvcm06IHJvdGF0ZSgwZGVnKTsgdHJhbnNmb3JtOiByb3RhdGUoMGRlZyk7IH0gMTAwJSB7IC13ZWJraXQtdHJhbnNmb3JtOiByb3RhdGUoMzYwZGVnKTsgdHJhbnNmb3JtOiByb3RhdGUoMzYwZGVnKTsgfSB9IEBrZXlmcmFtZXMgbG9hZDggeyAwJSB7IC13ZWJraXQtdHJhbnNmb3JtOiByb3RhdGUoMGRlZyk7IHRyYW5zZm9ybTogcm90YXRlKDBkZWcpOyB9IDEwMCUgeyAtd2Via2l0LXRyYW5zZm9ybTogcm90YXRlKDM2MGRlZyk7IHRyYW5zZm9ybTogcm90YXRlKDM2MGRlZyk7IH0gfScsICcnLCBmdW5jdGlvbihvcHRzKSB7XG5cbiAgICAgICAgdmFyIGtvZVVJY29yZSA9IHJlcXVpcmUoJy4uL2tvZS11aS1jb3JlLmpzJyk7XG4gICAgICAgIHRoaXMubWl4aW4oa29lVUljb3JlKTtcblxuICAgICAgICB0aGlzLnRleHQgPSAnJztcbiAgICAgICAgdGhpcy5mbGFnX2ZpcnN0TXNnR2V0ID0gZmFsc2U7XG4gICAgICAgIHRoaXMuY19wb2xsaW5nID0gMDtcbiAgICAgICAgdGhpcy5wb2xsaW5nX21heCA9IDMwO1xuICAgICAgICB0aGlzLm1zZ0Ftb3VudCA9IDA7XG5cbiAgICAgICAgdGhpcy5lZGl0ID0gZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgdGhpcy50ZXh0ID0gZS50YXJnZXQudmFsdWU7XG4gICAgICAgIH0uYmluZCh0aGlzKVxuXG4gICAgICAgIHRoaXMuZ2V0X3BybXMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG5cbiAgICAgICAgICAgICAgICB0aGF0LmdldE1lc3NhZ2UodGhhdC5jb252SUQpO1xuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LmJpbmQodGhpcylcblxuICAgICAgICB0aGlzLnNlbmQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG5cbiAgICAgICAgICAgICAgICB0aGF0LnNlbmRNZXNzYWdlKHRoYXQuY29udklELCB0aGF0LnRleHQsIHRoYXQuZnJvbSk7XG4gICAgICAgICAgICAgICAgdGhhdC5yb290LnF1ZXJ5U2VsZWN0b3JBbGwoJ2lucHV0JylbMF0udmFsdWUgPSAnJztcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfS5iaW5kKHRoaXMpXG5cbiAgICAgICAgdGhpcy5zZW5kX2FuZF9wb2xsaW5nID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgICAgICAgICAgdmFyIGRfc2VuZCA9IHRoaXMuc2VuZCgpO1xuXG4gICAgICAgICAgICBkX3NlbmQudGhlbihmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICAgICAgICB0aGF0LnBvbGxpbmcoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LmJpbmQodGhpcylcblxuICAgICAgICB0aGlzLnBvbGxpbmcgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICAgICAgUHJvbWlzZS5hbGwoW3RoYXQuZ2V0X3BybXMoKSwgdGhhdC5zbGVlcCgzMDApXSlcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhhdC5jX3BvbGxpbmcgPCB0aGF0LnBvbGxpbmdfbWF4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5jX3BvbGxpbmcrKztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0LnBvbGxpbmcoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuY19wb2xsaW5nID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0LnNjcm9sbFRvQm90dG9tKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGF0Lm1zZ0Ftb3VudCA8IHRoYXQubXNnT2JqLm1lc3NhZ2VzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuc2Nyb2xsVG9Cb3R0b20oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQubXNnQW1vdW50ID0gdGhhdC5tc2dPYmoubWVzc2FnZXMubGVuZ3RoO1xuXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LmJpbmQodGhpcylcblxuICAgICAgICB0aGlzLnNsZWVwID0gZnVuY3Rpb24odGltZSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgIH0sIHRpbWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0uYmluZCh0aGlzKVxuXG4gICAgICAgIHRoaXMuZmlsdGVyX21lID0gZnVuY3Rpb24odXNlcikge1xuICAgICAgICAgICAgaWYgKHVzZXIgPT0gdGhpcy5mcm9tKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiX21lXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0uYmluZCh0aGlzKVxuXG4gICAgICAgIHRoaXMuc2Nyb2xsVG9Cb3R0b20gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICQoXCIuY2hhdFNjcmVlblwiKS5hbmltYXRlKHtcbiAgICAgICAgICAgICAgICBzY3JvbGxUb3A6ICQoXCIuY2hhdFNjcmVlblwiKVswXS5zY3JvbGxIZWlnaHRcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LmJpbmQodGhpcylcblxuICAgICAgICB0aGlzLm9uKCd1cGRhdGUnLCBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmNvbnZJRCAmJiB0aGlzLmZsYWdfZmlyc3RNc2dHZXQgPT0gZmFsc2UpIHtcblxuICAgICAgICAgICAgICAgIHRoaXMuZ2V0TWVzc2FnZSh0aGlzLmNvbnZJRCwgbnVsbCwgdGhpcy5zY3JvbGxUb0JvdHRvbSk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLmZsYWdfZmlyc3RNc2dHZXQgPSB0cnVlO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSk7XG59KTtcbiIsImV4cG9ydHMuZGVmYXVsdHMgPSB7fTtcblxuZXhwb3J0cy5zZXQgPSBmdW5jdGlvbihuYW1lLCB2YWx1ZSwgb3B0aW9ucykge1xuICAvLyBSZXRyaWV2ZSBvcHRpb25zIGFuZCBkZWZhdWx0c1xuICB2YXIgb3B0cyA9IG9wdGlvbnMgfHwge307XG4gIHZhciBkZWZhdWx0cyA9IGV4cG9ydHMuZGVmYXVsdHM7XG5cbiAgLy8gQXBwbHkgZGVmYXVsdCB2YWx1ZSBmb3IgdW5zcGVjaWZpZWQgb3B0aW9uc1xuICB2YXIgZXhwaXJlcyAgPSBvcHRzLmV4cGlyZXMgfHwgZGVmYXVsdHMuZXhwaXJlcztcbiAgdmFyIGRvbWFpbiAgID0gb3B0cy5kb21haW4gIHx8IGRlZmF1bHRzLmRvbWFpbjtcbiAgdmFyIHBhdGggICAgID0gb3B0cy5wYXRoICAgICAhPSB1bmRlZmluZWQgPyBvcHRzLnBhdGggICAgIDogKGRlZmF1bHRzLnBhdGggIT0gdW5kZWZpbmVkID8gZGVmYXVsdHMucGF0aCA6ICcvJyk7XG4gIHZhciBzZWN1cmUgICA9IG9wdHMuc2VjdXJlICAgIT0gdW5kZWZpbmVkID8gb3B0cy5zZWN1cmUgICA6IGRlZmF1bHRzLnNlY3VyZTtcbiAgdmFyIGh0dHBvbmx5ID0gb3B0cy5odHRwb25seSAhPSB1bmRlZmluZWQgPyBvcHRzLmh0dHBvbmx5IDogZGVmYXVsdHMuaHR0cG9ubHk7XG5cbiAgLy8gRGV0ZXJtaW5lIGNvb2tpZSBleHBpcmF0aW9uIGRhdGVcbiAgLy8gSWYgc3VjY2VzZnVsIHRoZSByZXN1bHQgd2lsbCBiZSBhIHZhbGlkIERhdGUsIG90aGVyd2lzZSBpdCB3aWxsIGJlIGFuIGludmFsaWQgRGF0ZSBvciBmYWxzZShpc2gpXG4gIHZhciBleHBEYXRlID0gZXhwaXJlcyA/IG5ldyBEYXRlKFxuICAgICAgLy8gaW4gY2FzZSBleHBpcmVzIGlzIGFuIGludGVnZXIsIGl0IHNob3VsZCBzcGVjaWZ5IHRoZSBudW1iZXIgb2YgZGF5cyB0aWxsIHRoZSBjb29raWUgZXhwaXJlc1xuICAgICAgdHlwZW9mIGV4cGlyZXMgPT0gJ251bWJlcicgPyBuZXcgRGF0ZSgpLmdldFRpbWUoKSArIChleHBpcmVzICogODY0ZTUpIDpcbiAgICAgIC8vIGVsc2UgZXhwaXJlcyBzaG91bGQgYmUgZWl0aGVyIGEgRGF0ZSBvYmplY3Qgb3IgaW4gYSBmb3JtYXQgcmVjb2duaXplZCBieSBEYXRlLnBhcnNlKClcbiAgICAgIGV4cGlyZXNcbiAgKSA6ICcnO1xuXG4gIC8vIFNldCBjb29raWVcbiAgZG9jdW1lbnQuY29va2llID0gbmFtZS5yZXBsYWNlKC9bXisjJCZeYHxdL2csIGVuY29kZVVSSUNvbXBvbmVudCkgICAgICAgICAgICAgICAgLy8gRW5jb2RlIGNvb2tpZSBuYW1lXG4gIC5yZXBsYWNlKCcoJywgJyUyOCcpXG4gIC5yZXBsYWNlKCcpJywgJyUyOScpICtcbiAgJz0nICsgdmFsdWUucmVwbGFjZSgvW14rIyQmLzo8LVxcW1xcXS19XS9nLCBlbmNvZGVVUklDb21wb25lbnQpICsgICAgICAgICAgICAgICAgICAvLyBFbmNvZGUgY29va2llIHZhbHVlIChSRkM2MjY1KVxuICAoZXhwRGF0ZSAmJiBleHBEYXRlLmdldFRpbWUoKSA+PSAwID8gJztleHBpcmVzPScgKyBleHBEYXRlLnRvVVRDU3RyaW5nKCkgOiAnJykgKyAvLyBBZGQgZXhwaXJhdGlvbiBkYXRlXG4gIChkb21haW4gICA/ICc7ZG9tYWluPScgKyBkb21haW4gOiAnJykgKyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFkZCBkb21haW5cbiAgKHBhdGggICAgID8gJztwYXRoPScgICArIHBhdGggICA6ICcnKSArICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWRkIHBhdGhcbiAgKHNlY3VyZSAgID8gJztzZWN1cmUnICAgICAgICAgICA6ICcnKSArICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWRkIHNlY3VyZSBvcHRpb25cbiAgKGh0dHBvbmx5ID8gJztodHRwb25seScgICAgICAgICA6ICcnKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWRkIGh0dHBvbmx5IG9wdGlvblxufTtcblxuZXhwb3J0cy5nZXQgPSBmdW5jdGlvbihuYW1lKSB7XG4gIHZhciBjb29raWVzID0gZG9jdW1lbnQuY29va2llLnNwbGl0KCc7Jyk7XG5cbiAgLy8gSXRlcmF0ZSBhbGwgY29va2llc1xuICBmb3IodmFyIGkgPSAwOyBpIDwgY29va2llcy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBjb29raWUgPSBjb29raWVzW2ldO1xuICAgIHZhciBjb29raWVMZW5ndGggPSBjb29raWUubGVuZ3RoO1xuXG4gICAgLy8gRGV0ZXJtaW5lIHNlcGFyYXRvciBpbmRleCAoXCJuYW1lPXZhbHVlXCIpXG4gICAgdmFyIHNlcGFyYXRvckluZGV4ID0gY29va2llLmluZGV4T2YoJz0nKTtcblxuICAgIC8vIElFPDExIGVtaXRzIHRoZSBlcXVhbCBzaWduIHdoZW4gdGhlIGNvb2tpZSB2YWx1ZSBpcyBlbXB0eVxuICAgIHNlcGFyYXRvckluZGV4ID0gc2VwYXJhdG9ySW5kZXggPCAwID8gY29va2llTGVuZ3RoIDogc2VwYXJhdG9ySW5kZXg7XG5cbiAgICAvLyBEZWNvZGUgdGhlIGNvb2tpZSBuYW1lIGFuZCByZW1vdmUgYW55IGxlYWRpbmcvdHJhaWxpbmcgc3BhY2VzLCB0aGVuIGNvbXBhcmUgdG8gdGhlIHJlcXVlc3RlZCBjb29raWUgbmFtZVxuICAgIGlmIChkZWNvZGVVUklDb21wb25lbnQoY29va2llLnN1YnN0cmluZygwLCBzZXBhcmF0b3JJbmRleCkucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgJycpKSA9PSBuYW1lKSB7XG4gICAgICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KGNvb2tpZS5zdWJzdHJpbmcoc2VwYXJhdG9ySW5kZXggKyAxLCBjb29raWVMZW5ndGgpKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn07XG5cbmV4cG9ydHMuZXJhc2UgPSBmdW5jdGlvbihuYW1lLCBvcHRpb25zKSB7XG4gIGV4cG9ydHMuc2V0KG5hbWUsICcnLCB7XG4gICAgZXhwaXJlczogIC0xLFxuICAgIGRvbWFpbjogICBvcHRpb25zICYmIG9wdGlvbnMuZG9tYWluLFxuICAgIHBhdGg6ICAgICBvcHRpb25zICYmIG9wdGlvbnMucGF0aCxcbiAgICBzZWN1cmU6ICAgMCxcbiAgICBodHRwb25seTogMH1cbiAgKTtcbn07XG4iLCIvKiBSaW90IHYyLjUuMCwgQGxpY2Vuc2UgTUlUICovXG5cbjsoZnVuY3Rpb24od2luZG93LCB1bmRlZmluZWQpIHtcbiAgJ3VzZSBzdHJpY3QnO1xudmFyIHJpb3QgPSB7IHZlcnNpb246ICd2Mi41LjAnLCBzZXR0aW5nczoge30gfSxcbiAgLy8gYmUgYXdhcmUsIGludGVybmFsIHVzYWdlXG4gIC8vIEFUVEVOVElPTjogcHJlZml4IHRoZSBnbG9iYWwgZHluYW1pYyB2YXJpYWJsZXMgd2l0aCBgX19gXG5cbiAgLy8gY291bnRlciB0byBnaXZlIGEgdW5pcXVlIGlkIHRvIGFsbCB0aGUgVGFnIGluc3RhbmNlc1xuICBfX3VpZCA9IDAsXG4gIC8vIHRhZ3MgaW5zdGFuY2VzIGNhY2hlXG4gIF9fdmlydHVhbERvbSA9IFtdLFxuICAvLyB0YWdzIGltcGxlbWVudGF0aW9uIGNhY2hlXG4gIF9fdGFnSW1wbCA9IHt9LFxuXG4gIC8qKlxuICAgKiBDb25zdFxuICAgKi9cbiAgR0xPQkFMX01JWElOID0gJ19fZ2xvYmFsX21peGluJyxcblxuICAvLyByaW90IHNwZWNpZmljIHByZWZpeGVzXG4gIFJJT1RfUFJFRklYID0gJ3Jpb3QtJyxcbiAgUklPVF9UQUcgPSBSSU9UX1BSRUZJWCArICd0YWcnLFxuICBSSU9UX1RBR19JUyA9ICdkYXRhLWlzJyxcblxuICAvLyBmb3IgdHlwZW9mID09ICcnIGNvbXBhcmlzb25zXG4gIFRfU1RSSU5HID0gJ3N0cmluZycsXG4gIFRfT0JKRUNUID0gJ29iamVjdCcsXG4gIFRfVU5ERUYgID0gJ3VuZGVmaW5lZCcsXG4gIFRfRlVOQ1RJT04gPSAnZnVuY3Rpb24nLFxuICAvLyBzcGVjaWFsIG5hdGl2ZSB0YWdzIHRoYXQgY2Fubm90IGJlIHRyZWF0ZWQgbGlrZSB0aGUgb3RoZXJzXG4gIFNQRUNJQUxfVEFHU19SRUdFWCA9IC9eKD86dCg/OmJvZHl8aGVhZHxmb290fFtyaGRdKXxjYXB0aW9ufGNvbCg/Omdyb3VwKT98b3B0KD86aW9ufGdyb3VwKSkkLyxcbiAgUkVTRVJWRURfV09SRFNfQkxBQ0tMSVNUID0gL14oPzpfKD86aXRlbXxpZHxwYXJlbnQpfHVwZGF0ZXxyb290fCg/OnVuKT9tb3VudHxtaXhpbnxpcyg/Ok1vdW50ZWR8TG9vcCl8dGFnc3xwYXJlbnR8b3B0c3x0cmlnZ2VyfG8oPzpufGZmfG5lKSkkLyxcbiAgLy8gU1ZHIHRhZ3MgbGlzdCBodHRwczovL3d3dy53My5vcmcvVFIvU1ZHL2F0dGluZGV4Lmh0bWwjUHJlc2VudGF0aW9uQXR0cmlidXRlc1xuICBTVkdfVEFHU19MSVNUID0gWydhbHRHbHlwaCcsICdhbmltYXRlJywgJ2FuaW1hdGVDb2xvcicsICdjaXJjbGUnLCAnY2xpcFBhdGgnLCAnZGVmcycsICdlbGxpcHNlJywgJ2ZlQmxlbmQnLCAnZmVDb2xvck1hdHJpeCcsICdmZUNvbXBvbmVudFRyYW5zZmVyJywgJ2ZlQ29tcG9zaXRlJywgJ2ZlQ29udm9sdmVNYXRyaXgnLCAnZmVEaWZmdXNlTGlnaHRpbmcnLCAnZmVEaXNwbGFjZW1lbnRNYXAnLCAnZmVGbG9vZCcsICdmZUdhdXNzaWFuQmx1cicsICdmZUltYWdlJywgJ2ZlTWVyZ2UnLCAnZmVNb3JwaG9sb2d5JywgJ2ZlT2Zmc2V0JywgJ2ZlU3BlY3VsYXJMaWdodGluZycsICdmZVRpbGUnLCAnZmVUdXJidWxlbmNlJywgJ2ZpbHRlcicsICdmb250JywgJ2ZvcmVpZ25PYmplY3QnLCAnZycsICdnbHlwaCcsICdnbHlwaFJlZicsICdpbWFnZScsICdsaW5lJywgJ2xpbmVhckdyYWRpZW50JywgJ21hcmtlcicsICdtYXNrJywgJ21pc3NpbmctZ2x5cGgnLCAncGF0aCcsICdwYXR0ZXJuJywgJ3BvbHlnb24nLCAncG9seWxpbmUnLCAncmFkaWFsR3JhZGllbnQnLCAncmVjdCcsICdzdG9wJywgJ3N2ZycsICdzd2l0Y2gnLCAnc3ltYm9sJywgJ3RleHQnLCAndGV4dFBhdGgnLCAndHJlZicsICd0c3BhbicsICd1c2UnXSxcblxuICAvLyB2ZXJzaW9uIyBmb3IgSUUgOC0xMSwgMCBmb3Igb3RoZXJzXG4gIElFX1ZFUlNJT04gPSAod2luZG93ICYmIHdpbmRvdy5kb2N1bWVudCB8fCB7fSkuZG9jdW1lbnRNb2RlIHwgMCxcblxuICAvLyBkZXRlY3QgZmlyZWZveCB0byBmaXggIzEzNzRcbiAgRklSRUZPWCA9IHdpbmRvdyAmJiAhIXdpbmRvdy5JbnN0YWxsVHJpZ2dlclxuLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbnJpb3Qub2JzZXJ2YWJsZSA9IGZ1bmN0aW9uKGVsKSB7XG5cbiAgLyoqXG4gICAqIEV4dGVuZCB0aGUgb3JpZ2luYWwgb2JqZWN0IG9yIGNyZWF0ZSBhIG5ldyBlbXB0eSBvbmVcbiAgICogQHR5cGUgeyBPYmplY3QgfVxuICAgKi9cblxuICBlbCA9IGVsIHx8IHt9XG5cbiAgLyoqXG4gICAqIFByaXZhdGUgdmFyaWFibGVzXG4gICAqL1xuICB2YXIgY2FsbGJhY2tzID0ge30sXG4gICAgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2VcblxuICAvKipcbiAgICogUHJpdmF0ZSBNZXRob2RzXG4gICAqL1xuXG4gIC8qKlxuICAgKiBIZWxwZXIgZnVuY3Rpb24gbmVlZGVkIHRvIGdldCBhbmQgbG9vcCBhbGwgdGhlIGV2ZW50cyBpbiBhIHN0cmluZ1xuICAgKiBAcGFyYW0gICB7IFN0cmluZyB9ICAgZSAtIGV2ZW50IHN0cmluZ1xuICAgKiBAcGFyYW0gICB7RnVuY3Rpb259ICAgZm4gLSBjYWxsYmFja1xuICAgKi9cbiAgZnVuY3Rpb24gb25FYWNoRXZlbnQoZSwgZm4pIHtcbiAgICB2YXIgZXMgPSBlLnNwbGl0KCcgJyksIGwgPSBlcy5sZW5ndGgsIGkgPSAwLCBuYW1lLCBpbmR4XG4gICAgZm9yICg7IGkgPCBsOyBpKyspIHtcbiAgICAgIG5hbWUgPSBlc1tpXVxuICAgICAgaW5keCA9IG5hbWUuaW5kZXhPZignLicpXG4gICAgICBpZiAobmFtZSkgZm4oIH5pbmR4ID8gbmFtZS5zdWJzdHJpbmcoMCwgaW5keCkgOiBuYW1lLCBpLCB+aW5keCA/IG5hbWUuc2xpY2UoaW5keCArIDEpIDogbnVsbClcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUHVibGljIEFwaVxuICAgKi9cblxuICAvLyBleHRlbmQgdGhlIGVsIG9iamVjdCBhZGRpbmcgdGhlIG9ic2VydmFibGUgbWV0aG9kc1xuICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyhlbCwge1xuICAgIC8qKlxuICAgICAqIExpc3RlbiB0byB0aGUgZ2l2ZW4gc3BhY2Ugc2VwYXJhdGVkIGxpc3Qgb2YgYGV2ZW50c2AgYW5kXG4gICAgICogZXhlY3V0ZSB0aGUgYGNhbGxiYWNrYCBlYWNoIHRpbWUgYW4gZXZlbnQgaXMgdHJpZ2dlcmVkLlxuICAgICAqIEBwYXJhbSAgeyBTdHJpbmcgfSBldmVudHMgLSBldmVudHMgaWRzXG4gICAgICogQHBhcmFtICB7IEZ1bmN0aW9uIH0gZm4gLSBjYWxsYmFjayBmdW5jdGlvblxuICAgICAqIEByZXR1cm5zIHsgT2JqZWN0IH0gZWxcbiAgICAgKi9cbiAgICBvbjoge1xuICAgICAgdmFsdWU6IGZ1bmN0aW9uKGV2ZW50cywgZm4pIHtcbiAgICAgICAgaWYgKHR5cGVvZiBmbiAhPSAnZnVuY3Rpb24nKSAgcmV0dXJuIGVsXG5cbiAgICAgICAgb25FYWNoRXZlbnQoZXZlbnRzLCBmdW5jdGlvbihuYW1lLCBwb3MsIG5zKSB7XG4gICAgICAgICAgKGNhbGxiYWNrc1tuYW1lXSA9IGNhbGxiYWNrc1tuYW1lXSB8fCBbXSkucHVzaChmbilcbiAgICAgICAgICBmbi50eXBlZCA9IHBvcyA+IDBcbiAgICAgICAgICBmbi5ucyA9IG5zXG4gICAgICAgIH0pXG5cbiAgICAgICAgcmV0dXJuIGVsXG4gICAgICB9LFxuICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgICBjb25maWd1cmFibGU6IGZhbHNlXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZXMgdGhlIGdpdmVuIHNwYWNlIHNlcGFyYXRlZCBsaXN0IG9mIGBldmVudHNgIGxpc3RlbmVyc1xuICAgICAqIEBwYXJhbSAgIHsgU3RyaW5nIH0gZXZlbnRzIC0gZXZlbnRzIGlkc1xuICAgICAqIEBwYXJhbSAgIHsgRnVuY3Rpb24gfSBmbiAtIGNhbGxiYWNrIGZ1bmN0aW9uXG4gICAgICogQHJldHVybnMgeyBPYmplY3QgfSBlbFxuICAgICAqL1xuICAgIG9mZjoge1xuICAgICAgdmFsdWU6IGZ1bmN0aW9uKGV2ZW50cywgZm4pIHtcbiAgICAgICAgaWYgKGV2ZW50cyA9PSAnKicgJiYgIWZuKSBjYWxsYmFja3MgPSB7fVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBvbkVhY2hFdmVudChldmVudHMsIGZ1bmN0aW9uKG5hbWUsIHBvcywgbnMpIHtcbiAgICAgICAgICAgIGlmIChmbiB8fCBucykge1xuICAgICAgICAgICAgICB2YXIgYXJyID0gY2FsbGJhY2tzW25hbWVdXG4gICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBjYjsgY2IgPSBhcnIgJiYgYXJyW2ldOyArK2kpIHtcbiAgICAgICAgICAgICAgICBpZiAoY2IgPT0gZm4gfHwgbnMgJiYgY2IubnMgPT0gbnMpIGFyci5zcGxpY2UoaS0tLCAxKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgZGVsZXRlIGNhbGxiYWNrc1tuYW1lXVxuICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGVsXG4gICAgICB9LFxuICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgICBjb25maWd1cmFibGU6IGZhbHNlXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIExpc3RlbiB0byB0aGUgZ2l2ZW4gc3BhY2Ugc2VwYXJhdGVkIGxpc3Qgb2YgYGV2ZW50c2AgYW5kXG4gICAgICogZXhlY3V0ZSB0aGUgYGNhbGxiYWNrYCBhdCBtb3N0IG9uY2VcbiAgICAgKiBAcGFyYW0gICB7IFN0cmluZyB9IGV2ZW50cyAtIGV2ZW50cyBpZHNcbiAgICAgKiBAcGFyYW0gICB7IEZ1bmN0aW9uIH0gZm4gLSBjYWxsYmFjayBmdW5jdGlvblxuICAgICAqIEByZXR1cm5zIHsgT2JqZWN0IH0gZWxcbiAgICAgKi9cbiAgICBvbmU6IHtcbiAgICAgIHZhbHVlOiBmdW5jdGlvbihldmVudHMsIGZuKSB7XG4gICAgICAgIGZ1bmN0aW9uIG9uKCkge1xuICAgICAgICAgIGVsLm9mZihldmVudHMsIG9uKVxuICAgICAgICAgIGZuLmFwcGx5KGVsLCBhcmd1bWVudHMpXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGVsLm9uKGV2ZW50cywgb24pXG4gICAgICB9LFxuICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgICBjb25maWd1cmFibGU6IGZhbHNlXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEV4ZWN1dGUgYWxsIGNhbGxiYWNrIGZ1bmN0aW9ucyB0aGF0IGxpc3RlbiB0b1xuICAgICAqIHRoZSBnaXZlbiBzcGFjZSBzZXBhcmF0ZWQgbGlzdCBvZiBgZXZlbnRzYFxuICAgICAqIEBwYXJhbSAgIHsgU3RyaW5nIH0gZXZlbnRzIC0gZXZlbnRzIGlkc1xuICAgICAqIEByZXR1cm5zIHsgT2JqZWN0IH0gZWxcbiAgICAgKi9cbiAgICB0cmlnZ2VyOiB7XG4gICAgICB2YWx1ZTogZnVuY3Rpb24oZXZlbnRzKSB7XG5cbiAgICAgICAgLy8gZ2V0dGluZyB0aGUgYXJndW1lbnRzXG4gICAgICAgIHZhciBhcmdsZW4gPSBhcmd1bWVudHMubGVuZ3RoIC0gMSxcbiAgICAgICAgICBhcmdzID0gbmV3IEFycmF5KGFyZ2xlbiksXG4gICAgICAgICAgZm5zXG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmdsZW47IGkrKykge1xuICAgICAgICAgIGFyZ3NbaV0gPSBhcmd1bWVudHNbaSArIDFdIC8vIHNraXAgZmlyc3QgYXJndW1lbnRcbiAgICAgICAgfVxuXG4gICAgICAgIG9uRWFjaEV2ZW50KGV2ZW50cywgZnVuY3Rpb24obmFtZSwgcG9zLCBucykge1xuXG4gICAgICAgICAgZm5zID0gc2xpY2UuY2FsbChjYWxsYmFja3NbbmFtZV0gfHwgW10sIDApXG5cbiAgICAgICAgICBmb3IgKHZhciBpID0gMCwgZm47IGZuID0gZm5zW2ldOyArK2kpIHtcbiAgICAgICAgICAgIGlmIChmbi5idXN5KSBjb250aW51ZVxuICAgICAgICAgICAgZm4uYnVzeSA9IDFcbiAgICAgICAgICAgIGlmICghbnMgfHwgZm4ubnMgPT0gbnMpIGZuLmFwcGx5KGVsLCBmbi50eXBlZCA/IFtuYW1lXS5jb25jYXQoYXJncykgOiBhcmdzKVxuICAgICAgICAgICAgaWYgKGZuc1tpXSAhPT0gZm4pIHsgaS0tIH1cbiAgICAgICAgICAgIGZuLmJ1c3kgPSAwXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGNhbGxiYWNrc1snKiddICYmIG5hbWUgIT0gJyonKVxuICAgICAgICAgICAgZWwudHJpZ2dlci5hcHBseShlbCwgWycqJywgbmFtZV0uY29uY2F0KGFyZ3MpKVxuXG4gICAgICAgIH0pXG5cbiAgICAgICAgcmV0dXJuIGVsXG4gICAgICB9LFxuICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgICBjb25maWd1cmFibGU6IGZhbHNlXG4gICAgfVxuICB9KVxuXG4gIHJldHVybiBlbFxuXG59XG4vKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuOyhmdW5jdGlvbihyaW90KSB7XG5cbi8qKlxuICogU2ltcGxlIGNsaWVudC1zaWRlIHJvdXRlclxuICogQG1vZHVsZSByaW90LXJvdXRlXG4gKi9cblxuXG52YXIgUkVfT1JJR0lOID0gL14uKz9cXC9cXC8rW15cXC9dKy8sXG4gIEVWRU5UX0xJU1RFTkVSID0gJ0V2ZW50TGlzdGVuZXInLFxuICBSRU1PVkVfRVZFTlRfTElTVEVORVIgPSAncmVtb3ZlJyArIEVWRU5UX0xJU1RFTkVSLFxuICBBRERfRVZFTlRfTElTVEVORVIgPSAnYWRkJyArIEVWRU5UX0xJU1RFTkVSLFxuICBIQVNfQVRUUklCVVRFID0gJ2hhc0F0dHJpYnV0ZScsXG4gIFJFUExBQ0UgPSAncmVwbGFjZScsXG4gIFBPUFNUQVRFID0gJ3BvcHN0YXRlJyxcbiAgSEFTSENIQU5HRSA9ICdoYXNoY2hhbmdlJyxcbiAgVFJJR0dFUiA9ICd0cmlnZ2VyJyxcbiAgTUFYX0VNSVRfU1RBQ0tfTEVWRUwgPSAzLFxuICB3aW4gPSB0eXBlb2Ygd2luZG93ICE9ICd1bmRlZmluZWQnICYmIHdpbmRvdyxcbiAgZG9jID0gdHlwZW9mIGRvY3VtZW50ICE9ICd1bmRlZmluZWQnICYmIGRvY3VtZW50LFxuICBoaXN0ID0gd2luICYmIGhpc3RvcnksXG4gIGxvYyA9IHdpbiAmJiAoaGlzdC5sb2NhdGlvbiB8fCB3aW4ubG9jYXRpb24pLCAvLyBzZWUgaHRtbDUtaGlzdG9yeS1hcGlcbiAgcHJvdCA9IFJvdXRlci5wcm90b3R5cGUsIC8vIHRvIG1pbmlmeSBtb3JlXG4gIGNsaWNrRXZlbnQgPSBkb2MgJiYgZG9jLm9udG91Y2hzdGFydCA/ICd0b3VjaHN0YXJ0JyA6ICdjbGljaycsXG4gIHN0YXJ0ZWQgPSBmYWxzZSxcbiAgY2VudHJhbCA9IHJpb3Qub2JzZXJ2YWJsZSgpLFxuICByb3V0ZUZvdW5kID0gZmFsc2UsXG4gIGRlYm91bmNlZEVtaXQsXG4gIGJhc2UsIGN1cnJlbnQsIHBhcnNlciwgc2Vjb25kUGFyc2VyLCBlbWl0U3RhY2sgPSBbXSwgZW1pdFN0YWNrTGV2ZWwgPSAwXG5cbi8qKlxuICogRGVmYXVsdCBwYXJzZXIuIFlvdSBjYW4gcmVwbGFjZSBpdCB2aWEgcm91dGVyLnBhcnNlciBtZXRob2QuXG4gKiBAcGFyYW0ge3N0cmluZ30gcGF0aCAtIGN1cnJlbnQgcGF0aCAobm9ybWFsaXplZClcbiAqIEByZXR1cm5zIHthcnJheX0gYXJyYXlcbiAqL1xuZnVuY3Rpb24gREVGQVVMVF9QQVJTRVIocGF0aCkge1xuICByZXR1cm4gcGF0aC5zcGxpdCgvWy8/I10vKVxufVxuXG4vKipcbiAqIERlZmF1bHQgcGFyc2VyIChzZWNvbmQpLiBZb3UgY2FuIHJlcGxhY2UgaXQgdmlhIHJvdXRlci5wYXJzZXIgbWV0aG9kLlxuICogQHBhcmFtIHtzdHJpbmd9IHBhdGggLSBjdXJyZW50IHBhdGggKG5vcm1hbGl6ZWQpXG4gKiBAcGFyYW0ge3N0cmluZ30gZmlsdGVyIC0gZmlsdGVyIHN0cmluZyAobm9ybWFsaXplZClcbiAqIEByZXR1cm5zIHthcnJheX0gYXJyYXlcbiAqL1xuZnVuY3Rpb24gREVGQVVMVF9TRUNPTkRfUEFSU0VSKHBhdGgsIGZpbHRlcikge1xuICB2YXIgcmUgPSBuZXcgUmVnRXhwKCdeJyArIGZpbHRlcltSRVBMQUNFXSgvXFwqL2csICcoW14vPyNdKz8pJylbUkVQTEFDRV0oL1xcLlxcLi8sICcuKicpICsgJyQnKSxcbiAgICBhcmdzID0gcGF0aC5tYXRjaChyZSlcblxuICBpZiAoYXJncykgcmV0dXJuIGFyZ3Muc2xpY2UoMSlcbn1cblxuLyoqXG4gKiBTaW1wbGUvY2hlYXAgZGVib3VuY2UgaW1wbGVtZW50YXRpb25cbiAqIEBwYXJhbSAgIHtmdW5jdGlvbn0gZm4gLSBjYWxsYmFja1xuICogQHBhcmFtICAge251bWJlcn0gZGVsYXkgLSBkZWxheSBpbiBzZWNvbmRzXG4gKiBAcmV0dXJucyB7ZnVuY3Rpb259IGRlYm91bmNlZCBmdW5jdGlvblxuICovXG5mdW5jdGlvbiBkZWJvdW5jZShmbiwgZGVsYXkpIHtcbiAgdmFyIHRcbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICBjbGVhclRpbWVvdXQodClcbiAgICB0ID0gc2V0VGltZW91dChmbiwgZGVsYXkpXG4gIH1cbn1cblxuLyoqXG4gKiBTZXQgdGhlIHdpbmRvdyBsaXN0ZW5lcnMgdG8gdHJpZ2dlciB0aGUgcm91dGVzXG4gKiBAcGFyYW0ge2Jvb2xlYW59IGF1dG9FeGVjIC0gc2VlIHJvdXRlLnN0YXJ0XG4gKi9cbmZ1bmN0aW9uIHN0YXJ0KGF1dG9FeGVjKSB7XG4gIGRlYm91bmNlZEVtaXQgPSBkZWJvdW5jZShlbWl0LCAxKVxuICB3aW5bQUREX0VWRU5UX0xJU1RFTkVSXShQT1BTVEFURSwgZGVib3VuY2VkRW1pdClcbiAgd2luW0FERF9FVkVOVF9MSVNURU5FUl0oSEFTSENIQU5HRSwgZGVib3VuY2VkRW1pdClcbiAgZG9jW0FERF9FVkVOVF9MSVNURU5FUl0oY2xpY2tFdmVudCwgY2xpY2spXG4gIGlmIChhdXRvRXhlYykgZW1pdCh0cnVlKVxufVxuXG4vKipcbiAqIFJvdXRlciBjbGFzc1xuICovXG5mdW5jdGlvbiBSb3V0ZXIoKSB7XG4gIHRoaXMuJCA9IFtdXG4gIHJpb3Qub2JzZXJ2YWJsZSh0aGlzKSAvLyBtYWtlIGl0IG9ic2VydmFibGVcbiAgY2VudHJhbC5vbignc3RvcCcsIHRoaXMucy5iaW5kKHRoaXMpKVxuICBjZW50cmFsLm9uKCdlbWl0JywgdGhpcy5lLmJpbmQodGhpcykpXG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZShwYXRoKSB7XG4gIHJldHVybiBwYXRoW1JFUExBQ0VdKC9eXFwvfFxcLyQvLCAnJylcbn1cblxuZnVuY3Rpb24gaXNTdHJpbmcoc3RyKSB7XG4gIHJldHVybiB0eXBlb2Ygc3RyID09ICdzdHJpbmcnXG59XG5cbi8qKlxuICogR2V0IHRoZSBwYXJ0IGFmdGVyIGRvbWFpbiBuYW1lXG4gKiBAcGFyYW0ge3N0cmluZ30gaHJlZiAtIGZ1bGxwYXRoXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBwYXRoIGZyb20gcm9vdFxuICovXG5mdW5jdGlvbiBnZXRQYXRoRnJvbVJvb3QoaHJlZikge1xuICByZXR1cm4gKGhyZWYgfHwgbG9jLmhyZWYpW1JFUExBQ0VdKFJFX09SSUdJTiwgJycpXG59XG5cbi8qKlxuICogR2V0IHRoZSBwYXJ0IGFmdGVyIGJhc2VcbiAqIEBwYXJhbSB7c3RyaW5nfSBocmVmIC0gZnVsbHBhdGhcbiAqIEByZXR1cm5zIHtzdHJpbmd9IHBhdGggZnJvbSBiYXNlXG4gKi9cbmZ1bmN0aW9uIGdldFBhdGhGcm9tQmFzZShocmVmKSB7XG4gIHJldHVybiBiYXNlWzBdID09ICcjJ1xuICAgID8gKGhyZWYgfHwgbG9jLmhyZWYgfHwgJycpLnNwbGl0KGJhc2UpWzFdIHx8ICcnXG4gICAgOiAobG9jID8gZ2V0UGF0aEZyb21Sb290KGhyZWYpIDogaHJlZiB8fCAnJylbUkVQTEFDRV0oYmFzZSwgJycpXG59XG5cbmZ1bmN0aW9uIGVtaXQoZm9yY2UpIHtcbiAgLy8gdGhlIHN0YWNrIGlzIG5lZWRlZCBmb3IgcmVkaXJlY3Rpb25zXG4gIHZhciBpc1Jvb3QgPSBlbWl0U3RhY2tMZXZlbCA9PSAwXG4gIGlmIChNQVhfRU1JVF9TVEFDS19MRVZFTCA8PSBlbWl0U3RhY2tMZXZlbCkgcmV0dXJuXG5cbiAgZW1pdFN0YWNrTGV2ZWwrK1xuICBlbWl0U3RhY2sucHVzaChmdW5jdGlvbigpIHtcbiAgICB2YXIgcGF0aCA9IGdldFBhdGhGcm9tQmFzZSgpXG4gICAgaWYgKGZvcmNlIHx8IHBhdGggIT0gY3VycmVudCkge1xuICAgICAgY2VudHJhbFtUUklHR0VSXSgnZW1pdCcsIHBhdGgpXG4gICAgICBjdXJyZW50ID0gcGF0aFxuICAgIH1cbiAgfSlcbiAgaWYgKGlzUm9vdCkge1xuICAgIHdoaWxlIChlbWl0U3RhY2subGVuZ3RoKSB7XG4gICAgICBlbWl0U3RhY2tbMF0oKVxuICAgICAgZW1pdFN0YWNrLnNoaWZ0KClcbiAgICB9XG4gICAgZW1pdFN0YWNrTGV2ZWwgPSAwXG4gIH1cbn1cblxuZnVuY3Rpb24gY2xpY2soZSkge1xuICBpZiAoXG4gICAgZS53aGljaCAhPSAxIC8vIG5vdCBsZWZ0IGNsaWNrXG4gICAgfHwgZS5tZXRhS2V5IHx8IGUuY3RybEtleSB8fCBlLnNoaWZ0S2V5IC8vIG9yIG1ldGEga2V5c1xuICAgIHx8IGUuZGVmYXVsdFByZXZlbnRlZCAvLyBvciBkZWZhdWx0IHByZXZlbnRlZFxuICApIHJldHVyblxuXG4gIHZhciBlbCA9IGUudGFyZ2V0XG4gIHdoaWxlIChlbCAmJiBlbC5ub2RlTmFtZSAhPSAnQScpIGVsID0gZWwucGFyZW50Tm9kZVxuXG4gIGlmIChcbiAgICAhZWwgfHwgZWwubm9kZU5hbWUgIT0gJ0EnIC8vIG5vdCBBIHRhZ1xuICAgIHx8IGVsW0hBU19BVFRSSUJVVEVdKCdkb3dubG9hZCcpIC8vIGhhcyBkb3dubG9hZCBhdHRyXG4gICAgfHwgIWVsW0hBU19BVFRSSUJVVEVdKCdocmVmJykgLy8gaGFzIG5vIGhyZWYgYXR0clxuICAgIHx8IGVsLnRhcmdldCAmJiBlbC50YXJnZXQgIT0gJ19zZWxmJyAvLyBhbm90aGVyIHdpbmRvdyBvciBmcmFtZVxuICAgIHx8IGVsLmhyZWYuaW5kZXhPZihsb2MuaHJlZi5tYXRjaChSRV9PUklHSU4pWzBdKSA9PSAtMSAvLyBjcm9zcyBvcmlnaW5cbiAgKSByZXR1cm5cblxuICBpZiAoZWwuaHJlZiAhPSBsb2MuaHJlZikge1xuICAgIGlmIChcbiAgICAgIGVsLmhyZWYuc3BsaXQoJyMnKVswXSA9PSBsb2MuaHJlZi5zcGxpdCgnIycpWzBdIC8vIGludGVybmFsIGp1bXBcbiAgICAgIHx8IGJhc2UgIT0gJyMnICYmIGdldFBhdGhGcm9tUm9vdChlbC5ocmVmKS5pbmRleE9mKGJhc2UpICE9PSAwIC8vIG91dHNpZGUgb2YgYmFzZVxuICAgICAgfHwgIWdvKGdldFBhdGhGcm9tQmFzZShlbC5ocmVmKSwgZWwudGl0bGUgfHwgZG9jLnRpdGxlKSAvLyByb3V0ZSBub3QgZm91bmRcbiAgICApIHJldHVyblxuICB9XG5cbiAgZS5wcmV2ZW50RGVmYXVsdCgpXG59XG5cbi8qKlxuICogR28gdG8gdGhlIHBhdGhcbiAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIC0gZGVzdGluYXRpb24gcGF0aFxuICogQHBhcmFtIHtzdHJpbmd9IHRpdGxlIC0gcGFnZSB0aXRsZVxuICogQHBhcmFtIHtib29sZWFufSBzaG91bGRSZXBsYWNlIC0gdXNlIHJlcGxhY2VTdGF0ZSBvciBwdXNoU3RhdGVcbiAqIEByZXR1cm5zIHtib29sZWFufSAtIHJvdXRlIG5vdCBmb3VuZCBmbGFnXG4gKi9cbmZ1bmN0aW9uIGdvKHBhdGgsIHRpdGxlLCBzaG91bGRSZXBsYWNlKSB7XG4gIGlmIChoaXN0KSB7IC8vIGlmIGEgYnJvd3NlclxuICAgIHBhdGggPSBiYXNlICsgbm9ybWFsaXplKHBhdGgpXG4gICAgdGl0bGUgPSB0aXRsZSB8fCBkb2MudGl0bGVcbiAgICAvLyBicm93c2VycyBpZ25vcmVzIHRoZSBzZWNvbmQgcGFyYW1ldGVyIGB0aXRsZWBcbiAgICBzaG91bGRSZXBsYWNlXG4gICAgICA/IGhpc3QucmVwbGFjZVN0YXRlKG51bGwsIHRpdGxlLCBwYXRoKVxuICAgICAgOiBoaXN0LnB1c2hTdGF0ZShudWxsLCB0aXRsZSwgcGF0aClcbiAgICAvLyBzbyB3ZSBuZWVkIHRvIHNldCBpdCBtYW51YWxseVxuICAgIGRvYy50aXRsZSA9IHRpdGxlXG4gICAgcm91dGVGb3VuZCA9IGZhbHNlXG4gICAgZW1pdCgpXG4gICAgcmV0dXJuIHJvdXRlRm91bmRcbiAgfVxuXG4gIC8vIFNlcnZlci1zaWRlIHVzYWdlOiBkaXJlY3RseSBleGVjdXRlIGhhbmRsZXJzIGZvciB0aGUgcGF0aFxuICByZXR1cm4gY2VudHJhbFtUUklHR0VSXSgnZW1pdCcsIGdldFBhdGhGcm9tQmFzZShwYXRoKSlcbn1cblxuLyoqXG4gKiBHbyB0byBwYXRoIG9yIHNldCBhY3Rpb25cbiAqIGEgc2luZ2xlIHN0cmluZzogICAgICAgICAgICAgICAgZ28gdGhlcmVcbiAqIHR3byBzdHJpbmdzOiAgICAgICAgICAgICAgICAgICAgZ28gdGhlcmUgd2l0aCBzZXR0aW5nIGEgdGl0bGVcbiAqIHR3byBzdHJpbmdzIGFuZCBib29sZWFuOiAgICAgICAgcmVwbGFjZSBoaXN0b3J5IHdpdGggc2V0dGluZyBhIHRpdGxlXG4gKiBhIHNpbmdsZSBmdW5jdGlvbjogICAgICAgICAgICAgIHNldCBhbiBhY3Rpb24gb24gdGhlIGRlZmF1bHQgcm91dGVcbiAqIGEgc3RyaW5nL1JlZ0V4cCBhbmQgYSBmdW5jdGlvbjogc2V0IGFuIGFjdGlvbiBvbiB0aGUgcm91dGVcbiAqIEBwYXJhbSB7KHN0cmluZ3xmdW5jdGlvbil9IGZpcnN0IC0gcGF0aCAvIGFjdGlvbiAvIGZpbHRlclxuICogQHBhcmFtIHsoc3RyaW5nfFJlZ0V4cHxmdW5jdGlvbil9IHNlY29uZCAtIHRpdGxlIC8gYWN0aW9uXG4gKiBAcGFyYW0ge2Jvb2xlYW59IHRoaXJkIC0gcmVwbGFjZSBmbGFnXG4gKi9cbnByb3QubSA9IGZ1bmN0aW9uKGZpcnN0LCBzZWNvbmQsIHRoaXJkKSB7XG4gIGlmIChpc1N0cmluZyhmaXJzdCkgJiYgKCFzZWNvbmQgfHwgaXNTdHJpbmcoc2Vjb25kKSkpIGdvKGZpcnN0LCBzZWNvbmQsIHRoaXJkIHx8IGZhbHNlKVxuICBlbHNlIGlmIChzZWNvbmQpIHRoaXMucihmaXJzdCwgc2Vjb25kKVxuICBlbHNlIHRoaXMucignQCcsIGZpcnN0KVxufVxuXG4vKipcbiAqIFN0b3Agcm91dGluZ1xuICovXG5wcm90LnMgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5vZmYoJyonKVxuICB0aGlzLiQgPSBbXVxufVxuXG4vKipcbiAqIEVtaXRcbiAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIC0gcGF0aFxuICovXG5wcm90LmUgPSBmdW5jdGlvbihwYXRoKSB7XG4gIHRoaXMuJC5jb25jYXQoJ0AnKS5zb21lKGZ1bmN0aW9uKGZpbHRlcikge1xuICAgIHZhciBhcmdzID0gKGZpbHRlciA9PSAnQCcgPyBwYXJzZXIgOiBzZWNvbmRQYXJzZXIpKG5vcm1hbGl6ZShwYXRoKSwgbm9ybWFsaXplKGZpbHRlcikpXG4gICAgaWYgKHR5cGVvZiBhcmdzICE9ICd1bmRlZmluZWQnKSB7XG4gICAgICB0aGlzW1RSSUdHRVJdLmFwcGx5KG51bGwsIFtmaWx0ZXJdLmNvbmNhdChhcmdzKSlcbiAgICAgIHJldHVybiByb3V0ZUZvdW5kID0gdHJ1ZSAvLyBleGl0IGZyb20gbG9vcFxuICAgIH1cbiAgfSwgdGhpcylcbn1cblxuLyoqXG4gKiBSZWdpc3RlciByb3V0ZVxuICogQHBhcmFtIHtzdHJpbmd9IGZpbHRlciAtIGZpbHRlciBmb3IgbWF0Y2hpbmcgdG8gdXJsXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBhY3Rpb24gLSBhY3Rpb24gdG8gcmVnaXN0ZXJcbiAqL1xucHJvdC5yID0gZnVuY3Rpb24oZmlsdGVyLCBhY3Rpb24pIHtcbiAgaWYgKGZpbHRlciAhPSAnQCcpIHtcbiAgICBmaWx0ZXIgPSAnLycgKyBub3JtYWxpemUoZmlsdGVyKVxuICAgIHRoaXMuJC5wdXNoKGZpbHRlcilcbiAgfVxuICB0aGlzLm9uKGZpbHRlciwgYWN0aW9uKVxufVxuXG52YXIgbWFpblJvdXRlciA9IG5ldyBSb3V0ZXIoKVxudmFyIHJvdXRlID0gbWFpblJvdXRlci5tLmJpbmQobWFpblJvdXRlcilcblxuLyoqXG4gKiBDcmVhdGUgYSBzdWIgcm91dGVyXG4gKiBAcmV0dXJucyB7ZnVuY3Rpb259IHRoZSBtZXRob2Qgb2YgYSBuZXcgUm91dGVyIG9iamVjdFxuICovXG5yb3V0ZS5jcmVhdGUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIG5ld1N1YlJvdXRlciA9IG5ldyBSb3V0ZXIoKVxuICAvLyBhc3NpZ24gc3ViLXJvdXRlcidzIG1haW4gbWV0aG9kXG4gIHZhciByb3V0ZXIgPSBuZXdTdWJSb3V0ZXIubS5iaW5kKG5ld1N1YlJvdXRlcilcbiAgLy8gc3RvcCBvbmx5IHRoaXMgc3ViLXJvdXRlclxuICByb3V0ZXIuc3RvcCA9IG5ld1N1YlJvdXRlci5zLmJpbmQobmV3U3ViUm91dGVyKVxuICByZXR1cm4gcm91dGVyXG59XG5cbi8qKlxuICogU2V0IHRoZSBiYXNlIG9mIHVybFxuICogQHBhcmFtIHsoc3RyfFJlZ0V4cCl9IGFyZyAtIGEgbmV3IGJhc2Ugb3IgJyMnIG9yICcjISdcbiAqL1xucm91dGUuYmFzZSA9IGZ1bmN0aW9uKGFyZykge1xuICBiYXNlID0gYXJnIHx8ICcjJ1xuICBjdXJyZW50ID0gZ2V0UGF0aEZyb21CYXNlKCkgLy8gcmVjYWxjdWxhdGUgY3VycmVudCBwYXRoXG59XG5cbi8qKiBFeGVjIHJvdXRpbmcgcmlnaHQgbm93ICoqL1xucm91dGUuZXhlYyA9IGZ1bmN0aW9uKCkge1xuICBlbWl0KHRydWUpXG59XG5cbi8qKlxuICogUmVwbGFjZSB0aGUgZGVmYXVsdCByb3V0ZXIgdG8geW91cnNcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGZuIC0geW91ciBwYXJzZXIgZnVuY3Rpb25cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGZuMiAtIHlvdXIgc2Vjb25kUGFyc2VyIGZ1bmN0aW9uXG4gKi9cbnJvdXRlLnBhcnNlciA9IGZ1bmN0aW9uKGZuLCBmbjIpIHtcbiAgaWYgKCFmbiAmJiAhZm4yKSB7XG4gICAgLy8gcmVzZXQgcGFyc2VyIGZvciB0ZXN0aW5nLi4uXG4gICAgcGFyc2VyID0gREVGQVVMVF9QQVJTRVJcbiAgICBzZWNvbmRQYXJzZXIgPSBERUZBVUxUX1NFQ09ORF9QQVJTRVJcbiAgfVxuICBpZiAoZm4pIHBhcnNlciA9IGZuXG4gIGlmIChmbjIpIHNlY29uZFBhcnNlciA9IGZuMlxufVxuXG4vKipcbiAqIEhlbHBlciBmdW5jdGlvbiB0byBnZXQgdXJsIHF1ZXJ5IGFzIGFuIG9iamVjdFxuICogQHJldHVybnMge29iamVjdH0gcGFyc2VkIHF1ZXJ5XG4gKi9cbnJvdXRlLnF1ZXJ5ID0gZnVuY3Rpb24oKSB7XG4gIHZhciBxID0ge31cbiAgdmFyIGhyZWYgPSBsb2MuaHJlZiB8fCBjdXJyZW50XG4gIGhyZWZbUkVQTEFDRV0oL1s/Jl0oLis/KT0oW14mXSopL2csIGZ1bmN0aW9uKF8sIGssIHYpIHsgcVtrXSA9IHYgfSlcbiAgcmV0dXJuIHFcbn1cblxuLyoqIFN0b3Agcm91dGluZyAqKi9cbnJvdXRlLnN0b3AgPSBmdW5jdGlvbiAoKSB7XG4gIGlmIChzdGFydGVkKSB7XG4gICAgaWYgKHdpbikge1xuICAgICAgd2luW1JFTU9WRV9FVkVOVF9MSVNURU5FUl0oUE9QU1RBVEUsIGRlYm91bmNlZEVtaXQpXG4gICAgICB3aW5bUkVNT1ZFX0VWRU5UX0xJU1RFTkVSXShIQVNIQ0hBTkdFLCBkZWJvdW5jZWRFbWl0KVxuICAgICAgZG9jW1JFTU9WRV9FVkVOVF9MSVNURU5FUl0oY2xpY2tFdmVudCwgY2xpY2spXG4gICAgfVxuICAgIGNlbnRyYWxbVFJJR0dFUl0oJ3N0b3AnKVxuICAgIHN0YXJ0ZWQgPSBmYWxzZVxuICB9XG59XG5cbi8qKlxuICogU3RhcnQgcm91dGluZ1xuICogQHBhcmFtIHtib29sZWFufSBhdXRvRXhlYyAtIGF1dG9tYXRpY2FsbHkgZXhlYyBhZnRlciBzdGFydGluZyBpZiB0cnVlXG4gKi9cbnJvdXRlLnN0YXJ0ID0gZnVuY3Rpb24gKGF1dG9FeGVjKSB7XG4gIGlmICghc3RhcnRlZCkge1xuICAgIGlmICh3aW4pIHtcbiAgICAgIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09ICdjb21wbGV0ZScpIHN0YXJ0KGF1dG9FeGVjKVxuICAgICAgLy8gdGhlIHRpbWVvdXQgaXMgbmVlZGVkIHRvIHNvbHZlXG4gICAgICAvLyBhIHdlaXJkIHNhZmFyaSBidWcgaHR0cHM6Ly9naXRodWIuY29tL3Jpb3Qvcm91dGUvaXNzdWVzLzMzXG4gICAgICBlbHNlIHdpbltBRERfRVZFTlRfTElTVEVORVJdKCdsb2FkJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IHN0YXJ0KGF1dG9FeGVjKSB9LCAxKVxuICAgICAgfSlcbiAgICB9XG4gICAgc3RhcnRlZCA9IHRydWVcbiAgfVxufVxuXG4vKiogUHJlcGFyZSB0aGUgcm91dGVyICoqL1xucm91dGUuYmFzZSgpXG5yb3V0ZS5wYXJzZXIoKVxuXG5yaW90LnJvdXRlID0gcm91dGVcbn0pKHJpb3QpXG4vKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuXG4vKipcbiAqIFRoZSByaW90IHRlbXBsYXRlIGVuZ2luZVxuICogQHZlcnNpb24gdjIuNC4wXG4gKi9cbi8qKlxuICogcmlvdC51dGlsLmJyYWNrZXRzXG4gKlxuICogLSBgYnJhY2tldHMgICAgYCAtIFJldHVybnMgYSBzdHJpbmcgb3IgcmVnZXggYmFzZWQgb24gaXRzIHBhcmFtZXRlclxuICogLSBgYnJhY2tldHMuc2V0YCAtIENoYW5nZSB0aGUgY3VycmVudCByaW90IGJyYWNrZXRzXG4gKlxuICogQG1vZHVsZVxuICovXG5cbnZhciBicmFja2V0cyA9IChmdW5jdGlvbiAoVU5ERUYpIHtcblxuICB2YXJcbiAgICBSRUdMT0IgPSAnZycsXG5cbiAgICBSX01MQ09NTVMgPSAvXFwvXFwqW14qXSpcXCorKD86W14qXFwvXVteKl0qXFwqKykqXFwvL2csXG5cbiAgICBSX1NUUklOR1MgPSAvXCJbXlwiXFxcXF0qKD86XFxcXFtcXFNcXHNdW15cIlxcXFxdKikqXCJ8J1teJ1xcXFxdKig/OlxcXFxbXFxTXFxzXVteJ1xcXFxdKikqJy9nLFxuXG4gICAgU19RQkxPQ0tTID0gUl9TVFJJTkdTLnNvdXJjZSArICd8JyArXG4gICAgICAvKD86XFxicmV0dXJuXFxzK3woPzpbJFxcd1xcKVxcXV18XFwrXFwrfC0tKVxccyooXFwvKSg/IVsqXFwvXSkpLy5zb3VyY2UgKyAnfCcgK1xuICAgICAgL1xcLyg/PVteKlxcL10pW15bXFwvXFxcXF0qKD86KD86XFxbKD86XFxcXC58W15cXF1cXFxcXSopKlxcXXxcXFxcLilbXltcXC9cXFxcXSopKj8oXFwvKVtnaW1dKi8uc291cmNlLFxuXG4gICAgRklOREJSQUNFUyA9IHtcbiAgICAgICcoJzogUmVnRXhwKCcoWygpXSl8JyAgICsgU19RQkxPQ0tTLCBSRUdMT0IpLFxuICAgICAgJ1snOiBSZWdFeHAoJyhbW1xcXFxdXSl8JyArIFNfUUJMT0NLUywgUkVHTE9CKSxcbiAgICAgICd7JzogUmVnRXhwKCcoW3t9XSl8JyAgICsgU19RQkxPQ0tTLCBSRUdMT0IpXG4gICAgfSxcblxuICAgIERFRkFVTFQgPSAneyB9J1xuXG4gIHZhciBfcGFpcnMgPSBbXG4gICAgJ3snLCAnfScsXG4gICAgJ3snLCAnfScsXG4gICAgL3tbXn1dKn0vLFxuICAgIC9cXFxcKFt7fV0pL2csXG4gICAgL1xcXFwoeyl8ey9nLFxuICAgIFJlZ0V4cCgnXFxcXFxcXFwofSl8KFtbKHtdKXwofSl8JyArIFNfUUJMT0NLUywgUkVHTE9CKSxcbiAgICBERUZBVUxULFxuICAgIC9eXFxzKntcXF4/XFxzKihbJFxcd10rKSg/OlxccyosXFxzKihcXFMrKSk/XFxzK2luXFxzKyhcXFMuKilcXHMqfS8sXG4gICAgLyhefFteXFxcXF0pez1bXFxTXFxzXSo/fS9cbiAgXVxuXG4gIHZhclxuICAgIGNhY2hlZEJyYWNrZXRzID0gVU5ERUYsXG4gICAgX3JlZ2V4LFxuICAgIF9jYWNoZSA9IFtdLFxuICAgIF9zZXR0aW5nc1xuXG4gIGZ1bmN0aW9uIF9sb29wYmFjayAocmUpIHsgcmV0dXJuIHJlIH1cblxuICBmdW5jdGlvbiBfcmV3cml0ZSAocmUsIGJwKSB7XG4gICAgaWYgKCFicCkgYnAgPSBfY2FjaGVcbiAgICByZXR1cm4gbmV3IFJlZ0V4cChcbiAgICAgIHJlLnNvdXJjZS5yZXBsYWNlKC97L2csIGJwWzJdKS5yZXBsYWNlKC99L2csIGJwWzNdKSwgcmUuZ2xvYmFsID8gUkVHTE9CIDogJydcbiAgICApXG4gIH1cblxuICBmdW5jdGlvbiBfY3JlYXRlIChwYWlyKSB7XG4gICAgaWYgKHBhaXIgPT09IERFRkFVTFQpIHJldHVybiBfcGFpcnNcblxuICAgIHZhciBhcnIgPSBwYWlyLnNwbGl0KCcgJylcblxuICAgIGlmIChhcnIubGVuZ3RoICE9PSAyIHx8IC9bXFx4MDAtXFx4MUY8PmEtekEtWjAtOSdcIiw7XFxcXF0vLnRlc3QocGFpcikpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZVxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbnN1cHBvcnRlZCBicmFja2V0cyBcIicgKyBwYWlyICsgJ1wiJylcbiAgICB9XG4gICAgYXJyID0gYXJyLmNvbmNhdChwYWlyLnJlcGxhY2UoLyg/PVtbXFxdKCkqKz8uXiR8XSkvZywgJ1xcXFwnKS5zcGxpdCgnICcpKVxuXG4gICAgYXJyWzRdID0gX3Jld3JpdGUoYXJyWzFdLmxlbmd0aCA+IDEgPyAve1tcXFNcXHNdKj99LyA6IF9wYWlyc1s0XSwgYXJyKVxuICAgIGFycls1XSA9IF9yZXdyaXRlKHBhaXIubGVuZ3RoID4gMyA/IC9cXFxcKHt8fSkvZyA6IF9wYWlyc1s1XSwgYXJyKVxuICAgIGFycls2XSA9IF9yZXdyaXRlKF9wYWlyc1s2XSwgYXJyKVxuICAgIGFycls3XSA9IFJlZ0V4cCgnXFxcXFxcXFwoJyArIGFyclszXSArICcpfChbWyh7XSl8KCcgKyBhcnJbM10gKyAnKXwnICsgU19RQkxPQ0tTLCBSRUdMT0IpXG4gICAgYXJyWzhdID0gcGFpclxuICAgIHJldHVybiBhcnJcbiAgfVxuXG4gIGZ1bmN0aW9uIF9icmFja2V0cyAocmVPcklkeCkge1xuICAgIHJldHVybiByZU9ySWR4IGluc3RhbmNlb2YgUmVnRXhwID8gX3JlZ2V4KHJlT3JJZHgpIDogX2NhY2hlW3JlT3JJZHhdXG4gIH1cblxuICBfYnJhY2tldHMuc3BsaXQgPSBmdW5jdGlvbiBzcGxpdCAoc3RyLCB0bXBsLCBfYnApIHtcbiAgICAvLyBpc3RhbmJ1bCBpZ25vcmUgbmV4dDogX2JwIGlzIGZvciB0aGUgY29tcGlsZXJcbiAgICBpZiAoIV9icCkgX2JwID0gX2NhY2hlXG5cbiAgICB2YXJcbiAgICAgIHBhcnRzID0gW10sXG4gICAgICBtYXRjaCxcbiAgICAgIGlzZXhwcixcbiAgICAgIHN0YXJ0LFxuICAgICAgcG9zLFxuICAgICAgcmUgPSBfYnBbNl1cblxuICAgIGlzZXhwciA9IHN0YXJ0ID0gcmUubGFzdEluZGV4ID0gMFxuXG4gICAgd2hpbGUgKChtYXRjaCA9IHJlLmV4ZWMoc3RyKSkpIHtcblxuICAgICAgcG9zID0gbWF0Y2guaW5kZXhcblxuICAgICAgaWYgKGlzZXhwcikge1xuXG4gICAgICAgIGlmIChtYXRjaFsyXSkge1xuICAgICAgICAgIHJlLmxhc3RJbmRleCA9IHNraXBCcmFjZXMoc3RyLCBtYXRjaFsyXSwgcmUubGFzdEluZGV4KVxuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFtYXRjaFszXSkge1xuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKCFtYXRjaFsxXSkge1xuICAgICAgICB1bmVzY2FwZVN0cihzdHIuc2xpY2Uoc3RhcnQsIHBvcykpXG4gICAgICAgIHN0YXJ0ID0gcmUubGFzdEluZGV4XG4gICAgICAgIHJlID0gX2JwWzYgKyAoaXNleHByIF49IDEpXVxuICAgICAgICByZS5sYXN0SW5kZXggPSBzdGFydFxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChzdHIgJiYgc3RhcnQgPCBzdHIubGVuZ3RoKSB7XG4gICAgICB1bmVzY2FwZVN0cihzdHIuc2xpY2Uoc3RhcnQpKVxuICAgIH1cblxuICAgIHJldHVybiBwYXJ0c1xuXG4gICAgZnVuY3Rpb24gdW5lc2NhcGVTdHIgKHMpIHtcbiAgICAgIGlmICh0bXBsIHx8IGlzZXhwcikge1xuICAgICAgICBwYXJ0cy5wdXNoKHMgJiYgcy5yZXBsYWNlKF9icFs1XSwgJyQxJykpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwYXJ0cy5wdXNoKHMpXG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2tpcEJyYWNlcyAocywgY2gsIGl4KSB7XG4gICAgICB2YXJcbiAgICAgICAgbWF0Y2gsXG4gICAgICAgIHJlY2NoID0gRklOREJSQUNFU1tjaF1cblxuICAgICAgcmVjY2gubGFzdEluZGV4ID0gaXhcbiAgICAgIGl4ID0gMVxuICAgICAgd2hpbGUgKChtYXRjaCA9IHJlY2NoLmV4ZWMocykpKSB7XG4gICAgICAgIGlmIChtYXRjaFsxXSAmJlxuICAgICAgICAgICEobWF0Y2hbMV0gPT09IGNoID8gKytpeCA6IC0taXgpKSBicmVha1xuICAgICAgfVxuICAgICAgcmV0dXJuIGl4ID8gcy5sZW5ndGggOiByZWNjaC5sYXN0SW5kZXhcbiAgICB9XG4gIH1cblxuICBfYnJhY2tldHMuaGFzRXhwciA9IGZ1bmN0aW9uIGhhc0V4cHIgKHN0cikge1xuICAgIHJldHVybiBfY2FjaGVbNF0udGVzdChzdHIpXG4gIH1cblxuICBfYnJhY2tldHMubG9vcEtleXMgPSBmdW5jdGlvbiBsb29wS2V5cyAoZXhwcikge1xuICAgIHZhciBtID0gZXhwci5tYXRjaChfY2FjaGVbOV0pXG5cbiAgICByZXR1cm4gbVxuICAgICAgPyB7IGtleTogbVsxXSwgcG9zOiBtWzJdLCB2YWw6IF9jYWNoZVswXSArIG1bM10udHJpbSgpICsgX2NhY2hlWzFdIH1cbiAgICAgIDogeyB2YWw6IGV4cHIudHJpbSgpIH1cbiAgfVxuXG4gIF9icmFja2V0cy5hcnJheSA9IGZ1bmN0aW9uIGFycmF5IChwYWlyKSB7XG4gICAgcmV0dXJuIHBhaXIgPyBfY3JlYXRlKHBhaXIpIDogX2NhY2hlXG4gIH1cblxuICBmdW5jdGlvbiBfcmVzZXQgKHBhaXIpIHtcbiAgICBpZiAoKHBhaXIgfHwgKHBhaXIgPSBERUZBVUxUKSkgIT09IF9jYWNoZVs4XSkge1xuICAgICAgX2NhY2hlID0gX2NyZWF0ZShwYWlyKVxuICAgICAgX3JlZ2V4ID0gcGFpciA9PT0gREVGQVVMVCA/IF9sb29wYmFjayA6IF9yZXdyaXRlXG4gICAgICBfY2FjaGVbOV0gPSBfcmVnZXgoX3BhaXJzWzldKVxuICAgIH1cbiAgICBjYWNoZWRCcmFja2V0cyA9IHBhaXJcbiAgfVxuXG4gIGZ1bmN0aW9uIF9zZXRTZXR0aW5ncyAobykge1xuICAgIHZhciBiXG5cbiAgICBvID0gbyB8fCB7fVxuICAgIGIgPSBvLmJyYWNrZXRzXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG8sICdicmFja2V0cycsIHtcbiAgICAgIHNldDogX3Jlc2V0LFxuICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7IHJldHVybiBjYWNoZWRCcmFja2V0cyB9LFxuICAgICAgZW51bWVyYWJsZTogdHJ1ZVxuICAgIH0pXG4gICAgX3NldHRpbmdzID0gb1xuICAgIF9yZXNldChiKVxuICB9XG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KF9icmFja2V0cywgJ3NldHRpbmdzJywge1xuICAgIHNldDogX3NldFNldHRpbmdzLFxuICAgIGdldDogZnVuY3Rpb24gKCkgeyByZXR1cm4gX3NldHRpbmdzIH1cbiAgfSlcblxuICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dDogaW4gdGhlIGJyb3dzZXIgcmlvdCBpcyBhbHdheXMgaW4gdGhlIHNjb3BlICovXG4gIF9icmFja2V0cy5zZXR0aW5ncyA9IHR5cGVvZiByaW90ICE9PSAndW5kZWZpbmVkJyAmJiByaW90LnNldHRpbmdzIHx8IHt9XG4gIF9icmFja2V0cy5zZXQgPSBfcmVzZXRcblxuICBfYnJhY2tldHMuUl9TVFJJTkdTID0gUl9TVFJJTkdTXG4gIF9icmFja2V0cy5SX01MQ09NTVMgPSBSX01MQ09NTVNcbiAgX2JyYWNrZXRzLlNfUUJMT0NLUyA9IFNfUUJMT0NLU1xuXG4gIHJldHVybiBfYnJhY2tldHNcblxufSkoKVxuXG4vKipcbiAqIEBtb2R1bGUgdG1wbFxuICpcbiAqIHRtcGwgICAgICAgICAgLSBSb290IGZ1bmN0aW9uLCByZXR1cm5zIHRoZSB0ZW1wbGF0ZSB2YWx1ZSwgcmVuZGVyIHdpdGggZGF0YVxuICogdG1wbC5oYXNFeHByICAtIFRlc3QgdGhlIGV4aXN0ZW5jZSBvZiBhIGV4cHJlc3Npb24gaW5zaWRlIGEgc3RyaW5nXG4gKiB0bXBsLmxvb3BLZXlzIC0gR2V0IHRoZSBrZXlzIGZvciBhbiAnZWFjaCcgbG9vcCAodXNlZCBieSBgX2VhY2hgKVxuICovXG5cbnZhciB0bXBsID0gKGZ1bmN0aW9uICgpIHtcblxuICB2YXIgX2NhY2hlID0ge31cblxuICBmdW5jdGlvbiBfdG1wbCAoc3RyLCBkYXRhKSB7XG4gICAgaWYgKCFzdHIpIHJldHVybiBzdHJcblxuICAgIHJldHVybiAoX2NhY2hlW3N0cl0gfHwgKF9jYWNoZVtzdHJdID0gX2NyZWF0ZShzdHIpKSkuY2FsbChkYXRhLCBfbG9nRXJyKVxuICB9XG5cbiAgX3RtcGwuaGF2ZVJhdyA9IGJyYWNrZXRzLmhhc1Jhd1xuXG4gIF90bXBsLmhhc0V4cHIgPSBicmFja2V0cy5oYXNFeHByXG5cbiAgX3RtcGwubG9vcEtleXMgPSBicmFja2V0cy5sb29wS2V5c1xuXG4gIF90bXBsLmVycm9ySGFuZGxlciA9IG51bGxcblxuICBmdW5jdGlvbiBfbG9nRXJyIChlcnIsIGN0eCkge1xuXG4gICAgaWYgKF90bXBsLmVycm9ySGFuZGxlcikge1xuXG4gICAgICBlcnIucmlvdERhdGEgPSB7XG4gICAgICAgIHRhZ05hbWU6IGN0eCAmJiBjdHgucm9vdCAmJiBjdHgucm9vdC50YWdOYW1lLFxuICAgICAgICBfcmlvdF9pZDogY3R4ICYmIGN0eC5fcmlvdF9pZCAgLy9lc2xpbnQtZGlzYWJsZS1saW5lIGNhbWVsY2FzZVxuICAgICAgfVxuICAgICAgX3RtcGwuZXJyb3JIYW5kbGVyKGVycilcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBfY3JlYXRlIChzdHIpIHtcbiAgICB2YXIgZXhwciA9IF9nZXRUbXBsKHN0cilcblxuICAgIGlmIChleHByLnNsaWNlKDAsIDExKSAhPT0gJ3RyeXtyZXR1cm4gJykgZXhwciA9ICdyZXR1cm4gJyArIGV4cHJcblxuLyogZXNsaW50LWRpc2FibGUgKi9cblxuICAgIHJldHVybiBuZXcgRnVuY3Rpb24oJ0UnLCBleHByICsgJzsnKVxuLyogZXNsaW50LWVuYWJsZSAqL1xuICB9XG5cbiAgdmFyXG4gICAgQ0hfSURFWFBSID0gJ1xcdTIwNTcnLFxuICAgIFJFX0NTTkFNRSA9IC9eKD86KC0/W19BLVphLXpcXHhBMC1cXHhGRl1bLVxcd1xceEEwLVxceEZGXSopfFxcdTIwNTcoXFxkKyl+KTovLFxuICAgIFJFX1FCTE9DSyA9IFJlZ0V4cChicmFja2V0cy5TX1FCTE9DS1MsICdnJyksXG4gICAgUkVfRFFVT1RFID0gL1xcdTIwNTcvZyxcbiAgICBSRV9RQk1BUksgPSAvXFx1MjA1NyhcXGQrKX4vZ1xuXG4gIGZ1bmN0aW9uIF9nZXRUbXBsIChzdHIpIHtcbiAgICB2YXJcbiAgICAgIHFzdHIgPSBbXSxcbiAgICAgIGV4cHIsXG4gICAgICBwYXJ0cyA9IGJyYWNrZXRzLnNwbGl0KHN0ci5yZXBsYWNlKFJFX0RRVU9URSwgJ1wiJyksIDEpXG5cbiAgICBpZiAocGFydHMubGVuZ3RoID4gMiB8fCBwYXJ0c1swXSkge1xuICAgICAgdmFyIGksIGosIGxpc3QgPSBbXVxuXG4gICAgICBmb3IgKGkgPSBqID0gMDsgaSA8IHBhcnRzLmxlbmd0aDsgKytpKSB7XG5cbiAgICAgICAgZXhwciA9IHBhcnRzW2ldXG5cbiAgICAgICAgaWYgKGV4cHIgJiYgKGV4cHIgPSBpICYgMVxuXG4gICAgICAgICAgICA/IF9wYXJzZUV4cHIoZXhwciwgMSwgcXN0cilcblxuICAgICAgICAgICAgOiAnXCInICsgZXhwclxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcL2csICdcXFxcXFxcXCcpXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcclxcbj98XFxuL2csICdcXFxcbicpXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoL1wiL2csICdcXFxcXCInKSArXG4gICAgICAgICAgICAgICdcIidcblxuICAgICAgICAgICkpIGxpc3RbaisrXSA9IGV4cHJcblxuICAgICAgfVxuXG4gICAgICBleHByID0gaiA8IDIgPyBsaXN0WzBdXG4gICAgICAgICAgIDogJ1snICsgbGlzdC5qb2luKCcsJykgKyAnXS5qb2luKFwiXCIpJ1xuXG4gICAgfSBlbHNlIHtcblxuICAgICAgZXhwciA9IF9wYXJzZUV4cHIocGFydHNbMV0sIDAsIHFzdHIpXG4gICAgfVxuXG4gICAgaWYgKHFzdHJbMF0pIHtcbiAgICAgIGV4cHIgPSBleHByLnJlcGxhY2UoUkVfUUJNQVJLLCBmdW5jdGlvbiAoXywgcG9zKSB7XG4gICAgICAgIHJldHVybiBxc3RyW3Bvc11cbiAgICAgICAgICAucmVwbGFjZSgvXFxyL2csICdcXFxccicpXG4gICAgICAgICAgLnJlcGxhY2UoL1xcbi9nLCAnXFxcXG4nKVxuICAgICAgfSlcbiAgICB9XG4gICAgcmV0dXJuIGV4cHJcbiAgfVxuXG4gIHZhclxuICAgIFJFX0JSRU5EID0ge1xuICAgICAgJygnOiAvWygpXS9nLFxuICAgICAgJ1snOiAvW1tcXF1dL2csXG4gICAgICAneyc6IC9be31dL2dcbiAgICB9XG5cbiAgZnVuY3Rpb24gX3BhcnNlRXhwciAoZXhwciwgYXNUZXh0LCBxc3RyKSB7XG5cbiAgICBleHByID0gZXhwclxuICAgICAgICAgIC5yZXBsYWNlKFJFX1FCTE9DSywgZnVuY3Rpb24gKHMsIGRpdikge1xuICAgICAgICAgICAgcmV0dXJuIHMubGVuZ3RoID4gMiAmJiAhZGl2ID8gQ0hfSURFWFBSICsgKHFzdHIucHVzaChzKSAtIDEpICsgJ34nIDogc1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLnJlcGxhY2UoL1xccysvZywgJyAnKS50cmltKClcbiAgICAgICAgICAucmVwbGFjZSgvXFwgPyhbW1xcKHt9LD9cXC46XSlcXCA/L2csICckMScpXG5cbiAgICBpZiAoZXhwcikge1xuICAgICAgdmFyXG4gICAgICAgIGxpc3QgPSBbXSxcbiAgICAgICAgY250ID0gMCxcbiAgICAgICAgbWF0Y2hcblxuICAgICAgd2hpbGUgKGV4cHIgJiZcbiAgICAgICAgICAgIChtYXRjaCA9IGV4cHIubWF0Y2goUkVfQ1NOQU1FKSkgJiZcbiAgICAgICAgICAgICFtYXRjaC5pbmRleFxuICAgICAgICApIHtcbiAgICAgICAgdmFyXG4gICAgICAgICAga2V5LFxuICAgICAgICAgIGpzYixcbiAgICAgICAgICByZSA9IC8sfChbW3soXSl8JC9nXG5cbiAgICAgICAgZXhwciA9IFJlZ0V4cC5yaWdodENvbnRleHRcbiAgICAgICAga2V5ICA9IG1hdGNoWzJdID8gcXN0clttYXRjaFsyXV0uc2xpY2UoMSwgLTEpLnRyaW0oKS5yZXBsYWNlKC9cXHMrL2csICcgJykgOiBtYXRjaFsxXVxuXG4gICAgICAgIHdoaWxlIChqc2IgPSAobWF0Y2ggPSByZS5leGVjKGV4cHIpKVsxXSkgc2tpcEJyYWNlcyhqc2IsIHJlKVxuXG4gICAgICAgIGpzYiAgPSBleHByLnNsaWNlKDAsIG1hdGNoLmluZGV4KVxuICAgICAgICBleHByID0gUmVnRXhwLnJpZ2h0Q29udGV4dFxuXG4gICAgICAgIGxpc3RbY250KytdID0gX3dyYXBFeHByKGpzYiwgMSwga2V5KVxuICAgICAgfVxuXG4gICAgICBleHByID0gIWNudCA/IF93cmFwRXhwcihleHByLCBhc1RleHQpXG4gICAgICAgICAgIDogY250ID4gMSA/ICdbJyArIGxpc3Quam9pbignLCcpICsgJ10uam9pbihcIiBcIikudHJpbSgpJyA6IGxpc3RbMF1cbiAgICB9XG4gICAgcmV0dXJuIGV4cHJcblxuICAgIGZ1bmN0aW9uIHNraXBCcmFjZXMgKGNoLCByZSkge1xuICAgICAgdmFyXG4gICAgICAgIG1tLFxuICAgICAgICBsdiA9IDEsXG4gICAgICAgIGlyID0gUkVfQlJFTkRbY2hdXG5cbiAgICAgIGlyLmxhc3RJbmRleCA9IHJlLmxhc3RJbmRleFxuICAgICAgd2hpbGUgKG1tID0gaXIuZXhlYyhleHByKSkge1xuICAgICAgICBpZiAobW1bMF0gPT09IGNoKSArK2x2XG4gICAgICAgIGVsc2UgaWYgKCEtLWx2KSBicmVha1xuICAgICAgfVxuICAgICAgcmUubGFzdEluZGV4ID0gbHYgPyBleHByLmxlbmd0aCA6IGlyLmxhc3RJbmRleFxuICAgIH1cbiAgfVxuXG4gIC8vIGlzdGFuYnVsIGlnbm9yZSBuZXh0OiBub3QgYm90aFxuICB2YXIgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG1heC1sZW5cbiAgICBKU19DT05URVhUID0gJ1wiaW4gdGhpcz90aGlzOicgKyAodHlwZW9mIHdpbmRvdyAhPT0gJ29iamVjdCcgPyAnZ2xvYmFsJyA6ICd3aW5kb3cnKSArICcpLicsXG4gICAgSlNfVkFSTkFNRSA9IC9bLHtdWyRcXHddKzp8KF4gKnxbXiRcXHdcXC5dKSg/ISg/OnR5cGVvZnx0cnVlfGZhbHNlfG51bGx8dW5kZWZpbmVkfGlufGluc3RhbmNlb2Z8aXMoPzpGaW5pdGV8TmFOKXx2b2lkfE5hTnxuZXd8RGF0ZXxSZWdFeHB8TWF0aCkoPyFbJFxcd10pKShbJF9BLVphLXpdWyRcXHddKikvZyxcbiAgICBKU19OT1BST1BTID0gL14oPz0oXFwuWyRcXHddKykpXFwxKD86W14uWyhdfCQpL1xuXG4gIGZ1bmN0aW9uIF93cmFwRXhwciAoZXhwciwgYXNUZXh0LCBrZXkpIHtcbiAgICB2YXIgdGJcblxuICAgIGV4cHIgPSBleHByLnJlcGxhY2UoSlNfVkFSTkFNRSwgZnVuY3Rpb24gKG1hdGNoLCBwLCBtdmFyLCBwb3MsIHMpIHtcbiAgICAgIGlmIChtdmFyKSB7XG4gICAgICAgIHBvcyA9IHRiID8gMCA6IHBvcyArIG1hdGNoLmxlbmd0aFxuXG4gICAgICAgIGlmIChtdmFyICE9PSAndGhpcycgJiYgbXZhciAhPT0gJ2dsb2JhbCcgJiYgbXZhciAhPT0gJ3dpbmRvdycpIHtcbiAgICAgICAgICBtYXRjaCA9IHAgKyAnKFwiJyArIG12YXIgKyBKU19DT05URVhUICsgbXZhclxuICAgICAgICAgIGlmIChwb3MpIHRiID0gKHMgPSBzW3Bvc10pID09PSAnLicgfHwgcyA9PT0gJygnIHx8IHMgPT09ICdbJ1xuICAgICAgICB9IGVsc2UgaWYgKHBvcykge1xuICAgICAgICAgIHRiID0gIUpTX05PUFJPUFMudGVzdChzLnNsaWNlKHBvcykpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBtYXRjaFxuICAgIH0pXG5cbiAgICBpZiAodGIpIHtcbiAgICAgIGV4cHIgPSAndHJ5e3JldHVybiAnICsgZXhwciArICd9Y2F0Y2goZSl7RShlLHRoaXMpfSdcbiAgICB9XG5cbiAgICBpZiAoa2V5KSB7XG5cbiAgICAgIGV4cHIgPSAodGJcbiAgICAgICAgICA/ICdmdW5jdGlvbigpeycgKyBleHByICsgJ30uY2FsbCh0aGlzKScgOiAnKCcgKyBleHByICsgJyknXG4gICAgICAgICkgKyAnP1wiJyArIGtleSArICdcIjpcIlwiJ1xuXG4gICAgfSBlbHNlIGlmIChhc1RleHQpIHtcblxuICAgICAgZXhwciA9ICdmdW5jdGlvbih2KXsnICsgKHRiXG4gICAgICAgICAgPyBleHByLnJlcGxhY2UoJ3JldHVybiAnLCAndj0nKSA6ICd2PSgnICsgZXhwciArICcpJ1xuICAgICAgICApICsgJztyZXR1cm4gdnx8dj09PTA/djpcIlwifS5jYWxsKHRoaXMpJ1xuICAgIH1cblxuICAgIHJldHVybiBleHByXG4gIH1cblxuICAvLyBpc3RhbmJ1bCBpZ25vcmUgbmV4dDogY29tcGF0aWJpbGl0eSBmaXggZm9yIGJldGEgdmVyc2lvbnNcbiAgX3RtcGwucGFyc2UgPSBmdW5jdGlvbiAocykgeyByZXR1cm4gcyB9XG5cbiAgX3RtcGwudmVyc2lvbiA9IGJyYWNrZXRzLnZlcnNpb24gPSAndjIuNC4wJ1xuXG4gIHJldHVybiBfdG1wbFxuXG59KSgpXG5cbi8qXG4gIGxpYi9icm93c2VyL3RhZy9ta2RvbS5qc1xuXG4gIEluY2x1ZGVzIGhhY2tzIG5lZWRlZCBmb3IgdGhlIEludGVybmV0IEV4cGxvcmVyIHZlcnNpb24gOSBhbmQgYmVsb3dcbiAgU2VlOiBodHRwOi8va2FuZ2F4LmdpdGh1Yi5pby9jb21wYXQtdGFibGUvZXM1LyNpZThcbiAgICAgICBodHRwOi8vY29kZXBsYW5ldC5pby9kcm9wcGluZy1pZTgvXG4qL1xudmFyIG1rZG9tID0gKGZ1bmN0aW9uIF9ta2RvbSgpIHtcbiAgdmFyXG4gICAgcmVIYXNZaWVsZCAgPSAvPHlpZWxkXFxiL2ksXG4gICAgcmVZaWVsZEFsbCAgPSAvPHlpZWxkXFxzKig/OlxcLz58PihbXFxTXFxzXSo/KTxcXC95aWVsZFxccyo+fD4pL2lnLFxuICAgIHJlWWllbGRTcmMgID0gLzx5aWVsZFxccyt0bz1bJ1wiXShbXidcIj5dKilbJ1wiXVxccyo+KFtcXFNcXHNdKj8pPFxcL3lpZWxkXFxzKj4vaWcsXG4gICAgcmVZaWVsZERlc3QgPSAvPHlpZWxkXFxzK2Zyb209WydcIl0/KFstXFx3XSspWydcIl0/XFxzKig/OlxcLz58PihbXFxTXFxzXSo/KTxcXC95aWVsZFxccyo+KS9pZ1xuICB2YXJcbiAgICByb290RWxzID0geyB0cjogJ3Rib2R5JywgdGg6ICd0cicsIHRkOiAndHInLCBjb2w6ICdjb2xncm91cCcgfSxcbiAgICB0YmxUYWdzID0gSUVfVkVSU0lPTiAmJiBJRV9WRVJTSU9OIDwgMTBcbiAgICAgID8gU1BFQ0lBTF9UQUdTX1JFR0VYIDogL14oPzp0KD86Ym9keXxoZWFkfGZvb3R8W3JoZF0pfGNhcHRpb258Y29sKD86Z3JvdXApPykkL1xuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgRE9NIGVsZW1lbnQgdG8gd3JhcCB0aGUgZ2l2ZW4gY29udGVudC4gTm9ybWFsbHkgYW4gYERJVmAsIGJ1dCBjYW4gYmVcbiAgICogYWxzbyBhIGBUQUJMRWAsIGBTRUxFQ1RgLCBgVEJPRFlgLCBgVFJgLCBvciBgQ09MR1JPVVBgIGVsZW1lbnQuXG4gICAqXG4gICAqIEBwYXJhbSAgIHtzdHJpbmd9IHRlbXBsICAtIFRoZSB0ZW1wbGF0ZSBjb21pbmcgZnJvbSB0aGUgY3VzdG9tIHRhZyBkZWZpbml0aW9uXG4gICAqIEBwYXJhbSAgIHtzdHJpbmd9IFtodG1sXSAtIEhUTUwgY29udGVudCB0aGF0IGNvbWVzIGZyb20gdGhlIERPTSBlbGVtZW50IHdoZXJlIHlvdVxuICAgKiAgICAgICAgICAgd2lsbCBtb3VudCB0aGUgdGFnLCBtb3N0bHkgdGhlIG9yaWdpbmFsIHRhZyBpbiB0aGUgcGFnZVxuICAgKiBAcmV0dXJucyB7SFRNTEVsZW1lbnR9IERPTSBlbGVtZW50IHdpdGggX3RlbXBsXyBtZXJnZWQgdGhyb3VnaCBgWUlFTERgIHdpdGggdGhlIF9odG1sXy5cbiAgICovXG4gIGZ1bmN0aW9uIF9ta2RvbSh0ZW1wbCwgaHRtbCkge1xuICAgIHZhclxuICAgICAgbWF0Y2ggICA9IHRlbXBsICYmIHRlbXBsLm1hdGNoKC9eXFxzKjwoWy1cXHddKykvKSxcbiAgICAgIHRhZ05hbWUgPSBtYXRjaCAmJiBtYXRjaFsxXS50b0xvd2VyQ2FzZSgpLFxuICAgICAgZWwgPSBta0VsKCdkaXYnLCBpc1NWR1RhZyh0YWdOYW1lKSlcblxuICAgIC8vIHJlcGxhY2UgYWxsIHRoZSB5aWVsZCB0YWdzIHdpdGggdGhlIHRhZyBpbm5lciBodG1sXG4gICAgdGVtcGwgPSByZXBsYWNlWWllbGQodGVtcGwsIGh0bWwpXG5cbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICAgIGlmICh0YmxUYWdzLnRlc3QodGFnTmFtZSkpXG4gICAgICBlbCA9IHNwZWNpYWxUYWdzKGVsLCB0ZW1wbCwgdGFnTmFtZSlcbiAgICBlbHNlXG4gICAgICBzZXRJbm5lckhUTUwoZWwsIHRlbXBsKVxuXG4gICAgZWwuc3R1YiA9IHRydWVcblxuICAgIHJldHVybiBlbFxuICB9XG5cbiAgLypcbiAgICBDcmVhdGVzIHRoZSByb290IGVsZW1lbnQgZm9yIHRhYmxlIG9yIHNlbGVjdCBjaGlsZCBlbGVtZW50czpcbiAgICB0ci90aC90ZC90aGVhZC90Zm9vdC90Ym9keS9jYXB0aW9uL2NvbC9jb2xncm91cC9vcHRpb24vb3B0Z3JvdXBcbiAgKi9cbiAgZnVuY3Rpb24gc3BlY2lhbFRhZ3MoZWwsIHRlbXBsLCB0YWdOYW1lKSB7XG4gICAgdmFyXG4gICAgICBzZWxlY3QgPSB0YWdOYW1lWzBdID09PSAnbycsXG4gICAgICBwYXJlbnQgPSBzZWxlY3QgPyAnc2VsZWN0PicgOiAndGFibGU+J1xuXG4gICAgLy8gdHJpbSgpIGlzIGltcG9ydGFudCBoZXJlLCB0aGlzIGVuc3VyZXMgd2UgZG9uJ3QgaGF2ZSBhcnRpZmFjdHMsXG4gICAgLy8gc28gd2UgY2FuIGNoZWNrIGlmIHdlIGhhdmUgb25seSBvbmUgZWxlbWVudCBpbnNpZGUgdGhlIHBhcmVudFxuICAgIGVsLmlubmVySFRNTCA9ICc8JyArIHBhcmVudCArIHRlbXBsLnRyaW0oKSArICc8LycgKyBwYXJlbnRcbiAgICBwYXJlbnQgPSBlbC5maXJzdENoaWxkXG5cbiAgICAvLyByZXR1cm5zIHRoZSBpbW1lZGlhdGUgcGFyZW50IGlmIHRyL3RoL3RkL2NvbCBpcyB0aGUgb25seSBlbGVtZW50LCBpZiBub3RcbiAgICAvLyByZXR1cm5zIHRoZSB3aG9sZSB0cmVlLCBhcyB0aGlzIGNhbiBpbmNsdWRlIGFkZGl0aW9uYWwgZWxlbWVudHNcbiAgICBpZiAoc2VsZWN0KSB7XG4gICAgICBwYXJlbnQuc2VsZWN0ZWRJbmRleCA9IC0xICAvLyBmb3IgSUU5LCBjb21wYXRpYmxlIHcvY3VycmVudCByaW90IGJlaGF2aW9yXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGF2b2lkcyBpbnNlcnRpb24gb2YgY29pbnRhaW5lciBpbnNpZGUgY29udGFpbmVyIChleDogdGJvZHkgaW5zaWRlIHRib2R5KVxuICAgICAgdmFyIHRuYW1lID0gcm9vdEVsc1t0YWdOYW1lXVxuICAgICAgaWYgKHRuYW1lICYmIHBhcmVudC5jaGlsZEVsZW1lbnRDb3VudCA9PT0gMSkgcGFyZW50ID0gJCh0bmFtZSwgcGFyZW50KVxuICAgIH1cbiAgICByZXR1cm4gcGFyZW50XG4gIH1cblxuICAvKlxuICAgIFJlcGxhY2UgdGhlIHlpZWxkIHRhZyBmcm9tIGFueSB0YWcgdGVtcGxhdGUgd2l0aCB0aGUgaW5uZXJIVE1MIG9mIHRoZVxuICAgIG9yaWdpbmFsIHRhZyBpbiB0aGUgcGFnZVxuICAqL1xuICBmdW5jdGlvbiByZXBsYWNlWWllbGQodGVtcGwsIGh0bWwpIHtcbiAgICAvLyBkbyBub3RoaW5nIGlmIG5vIHlpZWxkXG4gICAgaWYgKCFyZUhhc1lpZWxkLnRlc3QodGVtcGwpKSByZXR1cm4gdGVtcGxcblxuICAgIC8vIGJlIGNhcmVmdWwgd2l0aCAjMTM0MyAtIHN0cmluZyBvbiB0aGUgc291cmNlIGhhdmluZyBgJDFgXG4gICAgdmFyIHNyYyA9IHt9XG5cbiAgICBodG1sID0gaHRtbCAmJiBodG1sLnJlcGxhY2UocmVZaWVsZFNyYywgZnVuY3Rpb24gKF8sIHJlZiwgdGV4dCkge1xuICAgICAgc3JjW3JlZl0gPSBzcmNbcmVmXSB8fCB0ZXh0ICAgLy8gcHJlc2VydmUgZmlyc3QgZGVmaW5pdGlvblxuICAgICAgcmV0dXJuICcnXG4gICAgfSkudHJpbSgpXG5cbiAgICByZXR1cm4gdGVtcGxcbiAgICAgIC5yZXBsYWNlKHJlWWllbGREZXN0LCBmdW5jdGlvbiAoXywgcmVmLCBkZWYpIHsgIC8vIHlpZWxkIHdpdGggZnJvbSAtIHRvIGF0dHJzXG4gICAgICAgIHJldHVybiBzcmNbcmVmXSB8fCBkZWYgfHwgJydcbiAgICAgIH0pXG4gICAgICAucmVwbGFjZShyZVlpZWxkQWxsLCBmdW5jdGlvbiAoXywgZGVmKSB7ICAgICAgICAvLyB5aWVsZCB3aXRob3V0IGFueSBcImZyb21cIlxuICAgICAgICByZXR1cm4gaHRtbCB8fCBkZWYgfHwgJydcbiAgICAgIH0pXG4gIH1cblxuICByZXR1cm4gX21rZG9tXG5cbn0pKClcblxuLyoqXG4gKiBDb252ZXJ0IHRoZSBpdGVtIGxvb3BlZCBpbnRvIGFuIG9iamVjdCB1c2VkIHRvIGV4dGVuZCB0aGUgY2hpbGQgdGFnIHByb3BlcnRpZXNcbiAqIEBwYXJhbSAgIHsgT2JqZWN0IH0gZXhwciAtIG9iamVjdCBjb250YWluaW5nIHRoZSBrZXlzIHVzZWQgdG8gZXh0ZW5kIHRoZSBjaGlsZHJlbiB0YWdzXG4gKiBAcGFyYW0gICB7ICogfSBrZXkgLSB2YWx1ZSB0byBhc3NpZ24gdG8gdGhlIG5ldyBvYmplY3QgcmV0dXJuZWRcbiAqIEBwYXJhbSAgIHsgKiB9IHZhbCAtIHZhbHVlIGNvbnRhaW5pbmcgdGhlIHBvc2l0aW9uIG9mIHRoZSBpdGVtIGluIHRoZSBhcnJheVxuICogQHJldHVybnMgeyBPYmplY3QgfSAtIG5ldyBvYmplY3QgY29udGFpbmluZyB0aGUgdmFsdWVzIG9mIHRoZSBvcmlnaW5hbCBpdGVtXG4gKlxuICogVGhlIHZhcmlhYmxlcyAna2V5JyBhbmQgJ3ZhbCcgYXJlIGFyYml0cmFyeS5cbiAqIFRoZXkgZGVwZW5kIG9uIHRoZSBjb2xsZWN0aW9uIHR5cGUgbG9vcGVkIChBcnJheSwgT2JqZWN0KVxuICogYW5kIG9uIHRoZSBleHByZXNzaW9uIHVzZWQgb24gdGhlIGVhY2ggdGFnXG4gKlxuICovXG5mdW5jdGlvbiBta2l0ZW0oZXhwciwga2V5LCB2YWwpIHtcbiAgdmFyIGl0ZW0gPSB7fVxuICBpdGVtW2V4cHIua2V5XSA9IGtleVxuICBpZiAoZXhwci5wb3MpIGl0ZW1bZXhwci5wb3NdID0gdmFsXG4gIHJldHVybiBpdGVtXG59XG5cbi8qKlxuICogVW5tb3VudCB0aGUgcmVkdW5kYW50IHRhZ3NcbiAqIEBwYXJhbSAgIHsgQXJyYXkgfSBpdGVtcyAtIGFycmF5IGNvbnRhaW5pbmcgdGhlIGN1cnJlbnQgaXRlbXMgdG8gbG9vcFxuICogQHBhcmFtICAgeyBBcnJheSB9IHRhZ3MgLSBhcnJheSBjb250YWluaW5nIGFsbCB0aGUgY2hpbGRyZW4gdGFnc1xuICovXG5mdW5jdGlvbiB1bm1vdW50UmVkdW5kYW50KGl0ZW1zLCB0YWdzKSB7XG5cbiAgdmFyIGkgPSB0YWdzLmxlbmd0aCxcbiAgICBqID0gaXRlbXMubGVuZ3RoLFxuICAgIHRcblxuICB3aGlsZSAoaSA+IGopIHtcbiAgICB0ID0gdGFnc1stLWldXG4gICAgdGFncy5zcGxpY2UoaSwgMSlcbiAgICB0LnVubW91bnQoKVxuICB9XG59XG5cbi8qKlxuICogTW92ZSB0aGUgbmVzdGVkIGN1c3RvbSB0YWdzIGluIG5vbiBjdXN0b20gbG9vcCB0YWdzXG4gKiBAcGFyYW0gICB7IE9iamVjdCB9IGNoaWxkIC0gbm9uIGN1c3RvbSBsb29wIHRhZ1xuICogQHBhcmFtICAgeyBOdW1iZXIgfSBpIC0gY3VycmVudCBwb3NpdGlvbiBvZiB0aGUgbG9vcCB0YWdcbiAqL1xuZnVuY3Rpb24gbW92ZU5lc3RlZFRhZ3MoY2hpbGQsIGkpIHtcbiAgT2JqZWN0LmtleXMoY2hpbGQudGFncykuZm9yRWFjaChmdW5jdGlvbih0YWdOYW1lKSB7XG4gICAgdmFyIHRhZyA9IGNoaWxkLnRhZ3NbdGFnTmFtZV1cbiAgICBpZiAoaXNBcnJheSh0YWcpKVxuICAgICAgZWFjaCh0YWcsIGZ1bmN0aW9uICh0KSB7XG4gICAgICAgIG1vdmVDaGlsZFRhZyh0LCB0YWdOYW1lLCBpKVxuICAgICAgfSlcbiAgICBlbHNlXG4gICAgICBtb3ZlQ2hpbGRUYWcodGFnLCB0YWdOYW1lLCBpKVxuICB9KVxufVxuXG4vKipcbiAqIEFkZHMgdGhlIGVsZW1lbnRzIGZvciBhIHZpcnR1YWwgdGFnXG4gKiBAcGFyYW0geyBUYWcgfSB0YWcgLSB0aGUgdGFnIHdob3NlIHJvb3QncyBjaGlsZHJlbiB3aWxsIGJlIGluc2VydGVkIG9yIGFwcGVuZGVkXG4gKiBAcGFyYW0geyBOb2RlIH0gc3JjIC0gdGhlIG5vZGUgdGhhdCB3aWxsIGRvIHRoZSBpbnNlcnRpbmcgb3IgYXBwZW5kaW5nXG4gKiBAcGFyYW0geyBUYWcgfSB0YXJnZXQgLSBvbmx5IGlmIGluc2VydGluZywgaW5zZXJ0IGJlZm9yZSB0aGlzIHRhZydzIGZpcnN0IGNoaWxkXG4gKi9cbmZ1bmN0aW9uIGFkZFZpcnR1YWwodGFnLCBzcmMsIHRhcmdldCkge1xuICB2YXIgZWwgPSB0YWcuX3Jvb3QsIHNpYlxuICB0YWcuX3ZpcnRzID0gW11cbiAgd2hpbGUgKGVsKSB7XG4gICAgc2liID0gZWwubmV4dFNpYmxpbmdcbiAgICBpZiAodGFyZ2V0KVxuICAgICAgc3JjLmluc2VydEJlZm9yZShlbCwgdGFyZ2V0Ll9yb290KVxuICAgIGVsc2VcbiAgICAgIHNyYy5hcHBlbmRDaGlsZChlbClcblxuICAgIHRhZy5fdmlydHMucHVzaChlbCkgLy8gaG9sZCBmb3IgdW5tb3VudGluZ1xuICAgIGVsID0gc2liXG4gIH1cbn1cblxuLyoqXG4gKiBNb3ZlIHZpcnR1YWwgdGFnIGFuZCBhbGwgY2hpbGQgbm9kZXNcbiAqIEBwYXJhbSB7IFRhZyB9IHRhZyAtIGZpcnN0IGNoaWxkIHJlZmVyZW5jZSB1c2VkIHRvIHN0YXJ0IG1vdmVcbiAqIEBwYXJhbSB7IE5vZGUgfSBzcmMgIC0gdGhlIG5vZGUgdGhhdCB3aWxsIGRvIHRoZSBpbnNlcnRpbmdcbiAqIEBwYXJhbSB7IFRhZyB9IHRhcmdldCAtIGluc2VydCBiZWZvcmUgdGhpcyB0YWcncyBmaXJzdCBjaGlsZFxuICogQHBhcmFtIHsgTnVtYmVyIH0gbGVuIC0gaG93IG1hbnkgY2hpbGQgbm9kZXMgdG8gbW92ZVxuICovXG5mdW5jdGlvbiBtb3ZlVmlydHVhbCh0YWcsIHNyYywgdGFyZ2V0LCBsZW4pIHtcbiAgdmFyIGVsID0gdGFnLl9yb290LCBzaWIsIGkgPSAwXG4gIGZvciAoOyBpIDwgbGVuOyBpKyspIHtcbiAgICBzaWIgPSBlbC5uZXh0U2libGluZ1xuICAgIHNyYy5pbnNlcnRCZWZvcmUoZWwsIHRhcmdldC5fcm9vdClcbiAgICBlbCA9IHNpYlxuICB9XG59XG5cblxuLyoqXG4gKiBNYW5hZ2UgdGFncyBoYXZpbmcgdGhlICdlYWNoJ1xuICogQHBhcmFtICAgeyBPYmplY3QgfSBkb20gLSBET00gbm9kZSB3ZSBuZWVkIHRvIGxvb3BcbiAqIEBwYXJhbSAgIHsgVGFnIH0gcGFyZW50IC0gcGFyZW50IHRhZyBpbnN0YW5jZSB3aGVyZSB0aGUgZG9tIG5vZGUgaXMgY29udGFpbmVkXG4gKiBAcGFyYW0gICB7IFN0cmluZyB9IGV4cHIgLSBzdHJpbmcgY29udGFpbmVkIGluIHRoZSAnZWFjaCcgYXR0cmlidXRlXG4gKi9cbmZ1bmN0aW9uIF9lYWNoKGRvbSwgcGFyZW50LCBleHByKSB7XG5cbiAgLy8gcmVtb3ZlIHRoZSBlYWNoIHByb3BlcnR5IGZyb20gdGhlIG9yaWdpbmFsIHRhZ1xuICByZW1BdHRyKGRvbSwgJ2VhY2gnKVxuXG4gIHZhciBtdXN0UmVvcmRlciA9IHR5cGVvZiBnZXRBdHRyKGRvbSwgJ25vLXJlb3JkZXInKSAhPT0gVF9TVFJJTkcgfHwgcmVtQXR0cihkb20sICduby1yZW9yZGVyJyksXG4gICAgdGFnTmFtZSA9IGdldFRhZ05hbWUoZG9tKSxcbiAgICBpbXBsID0gX190YWdJbXBsW3RhZ05hbWVdIHx8IHsgdG1wbDogZ2V0T3V0ZXJIVE1MKGRvbSkgfSxcbiAgICB1c2VSb290ID0gU1BFQ0lBTF9UQUdTX1JFR0VYLnRlc3QodGFnTmFtZSksXG4gICAgcm9vdCA9IGRvbS5wYXJlbnROb2RlLFxuICAgIHJlZiA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCcnKSxcbiAgICBjaGlsZCA9IGdldFRhZyhkb20pLFxuICAgIGlzT3B0aW9uID0gdGFnTmFtZS50b0xvd2VyQ2FzZSgpID09PSAnb3B0aW9uJywgLy8gdGhlIG9wdGlvbiB0YWdzIG11c3QgYmUgdHJlYXRlZCBkaWZmZXJlbnRseVxuICAgIHRhZ3MgPSBbXSxcbiAgICBvbGRJdGVtcyA9IFtdLFxuICAgIGhhc0tleXMsXG4gICAgaXNWaXJ0dWFsID0gZG9tLnRhZ05hbWUgPT0gJ1ZJUlRVQUwnXG5cbiAgLy8gcGFyc2UgdGhlIGVhY2ggZXhwcmVzc2lvblxuICBleHByID0gdG1wbC5sb29wS2V5cyhleHByKVxuXG4gIC8vIGluc2VydCBhIG1hcmtlZCB3aGVyZSB0aGUgbG9vcCB0YWdzIHdpbGwgYmUgaW5qZWN0ZWRcbiAgcm9vdC5pbnNlcnRCZWZvcmUocmVmLCBkb20pXG5cbiAgLy8gY2xlYW4gdGVtcGxhdGUgY29kZVxuICBwYXJlbnQub25lKCdiZWZvcmUtbW91bnQnLCBmdW5jdGlvbiAoKSB7XG5cbiAgICAvLyByZW1vdmUgdGhlIG9yaWdpbmFsIERPTSBub2RlXG4gICAgZG9tLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZG9tKVxuICAgIGlmIChyb290LnN0dWIpIHJvb3QgPSBwYXJlbnQucm9vdFxuXG4gIH0pLm9uKCd1cGRhdGUnLCBmdW5jdGlvbiAoKSB7XG4gICAgLy8gZ2V0IHRoZSBuZXcgaXRlbXMgY29sbGVjdGlvblxuICAgIHZhciBpdGVtcyA9IHRtcGwoZXhwci52YWwsIHBhcmVudCksXG4gICAgICAvLyBjcmVhdGUgYSBmcmFnbWVudCB0byBob2xkIHRoZSBuZXcgRE9NIG5vZGVzIHRvIGluamVjdCBpbiB0aGUgcGFyZW50IHRhZ1xuICAgICAgZnJhZyA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKVxuXG4gICAgLy8gb2JqZWN0IGxvb3AuIGFueSBjaGFuZ2VzIGNhdXNlIGZ1bGwgcmVkcmF3XG4gICAgaWYgKCFpc0FycmF5KGl0ZW1zKSkge1xuICAgICAgaGFzS2V5cyA9IGl0ZW1zIHx8IGZhbHNlXG4gICAgICBpdGVtcyA9IGhhc0tleXMgP1xuICAgICAgICBPYmplY3Qua2V5cyhpdGVtcykubWFwKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICByZXR1cm4gbWtpdGVtKGV4cHIsIGtleSwgaXRlbXNba2V5XSlcbiAgICAgICAgfSkgOiBbXVxuICAgIH1cblxuICAgIC8vIGxvb3AgYWxsIHRoZSBuZXcgaXRlbXNcbiAgICB2YXIgaSA9IDAsXG4gICAgICBpdGVtc0xlbmd0aCA9IGl0ZW1zLmxlbmd0aFxuXG4gICAgZm9yICg7IGkgPCBpdGVtc0xlbmd0aDsgaSsrKSB7XG4gICAgICAvLyByZW9yZGVyIG9ubHkgaWYgdGhlIGl0ZW1zIGFyZSBvYmplY3RzXG4gICAgICB2YXJcbiAgICAgICAgaXRlbSA9IGl0ZW1zW2ldLFxuICAgICAgICBfbXVzdFJlb3JkZXIgPSBtdXN0UmVvcmRlciAmJiB0eXBlb2YgaXRlbSA9PSBUX09CSkVDVCAmJiAhaGFzS2V5cyxcbiAgICAgICAgb2xkUG9zID0gb2xkSXRlbXMuaW5kZXhPZihpdGVtKSxcbiAgICAgICAgcG9zID0gfm9sZFBvcyAmJiBfbXVzdFJlb3JkZXIgPyBvbGRQb3MgOiBpLFxuICAgICAgICAvLyBkb2VzIGEgdGFnIGV4aXN0IGluIHRoaXMgcG9zaXRpb24/XG4gICAgICAgIHRhZyA9IHRhZ3NbcG9zXVxuXG4gICAgICBpdGVtID0gIWhhc0tleXMgJiYgZXhwci5rZXkgPyBta2l0ZW0oZXhwciwgaXRlbSwgaSkgOiBpdGVtXG5cbiAgICAgIC8vIG5ldyB0YWdcbiAgICAgIGlmIChcbiAgICAgICAgIV9tdXN0UmVvcmRlciAmJiAhdGFnIC8vIHdpdGggbm8tcmVvcmRlciB3ZSBqdXN0IHVwZGF0ZSB0aGUgb2xkIHRhZ3NcbiAgICAgICAgfHxcbiAgICAgICAgX211c3RSZW9yZGVyICYmICF+b2xkUG9zIHx8ICF0YWcgLy8gYnkgZGVmYXVsdCB3ZSBhbHdheXMgdHJ5IHRvIHJlb3JkZXIgdGhlIERPTSBlbGVtZW50c1xuICAgICAgKSB7XG5cbiAgICAgICAgdGFnID0gbmV3IFRhZyhpbXBsLCB7XG4gICAgICAgICAgcGFyZW50OiBwYXJlbnQsXG4gICAgICAgICAgaXNMb29wOiB0cnVlLFxuICAgICAgICAgIGhhc0ltcGw6ICEhX190YWdJbXBsW3RhZ05hbWVdLFxuICAgICAgICAgIHJvb3Q6IHVzZVJvb3QgPyByb290IDogZG9tLmNsb25lTm9kZSgpLFxuICAgICAgICAgIGl0ZW06IGl0ZW1cbiAgICAgICAgfSwgZG9tLmlubmVySFRNTClcblxuICAgICAgICB0YWcubW91bnQoKVxuXG4gICAgICAgIGlmIChpc1ZpcnR1YWwpIHRhZy5fcm9vdCA9IHRhZy5yb290LmZpcnN0Q2hpbGQgLy8gc2F2ZSByZWZlcmVuY2UgZm9yIGZ1cnRoZXIgbW92ZXMgb3IgaW5zZXJ0c1xuICAgICAgICAvLyB0aGlzIHRhZyBtdXN0IGJlIGFwcGVuZGVkXG4gICAgICAgIGlmIChpID09IHRhZ3MubGVuZ3RoIHx8ICF0YWdzW2ldKSB7IC8vIGZpeCAxNTgxXG4gICAgICAgICAgaWYgKGlzVmlydHVhbClcbiAgICAgICAgICAgIGFkZFZpcnR1YWwodGFnLCBmcmFnKVxuICAgICAgICAgIGVsc2UgZnJhZy5hcHBlbmRDaGlsZCh0YWcucm9vdClcbiAgICAgICAgfVxuICAgICAgICAvLyB0aGlzIHRhZyBtdXN0IGJlIGluc2VydFxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBpZiAoaXNWaXJ0dWFsKVxuICAgICAgICAgICAgYWRkVmlydHVhbCh0YWcsIHJvb3QsIHRhZ3NbaV0pXG4gICAgICAgICAgZWxzZSByb290Lmluc2VydEJlZm9yZSh0YWcucm9vdCwgdGFnc1tpXS5yb290KSAvLyAjMTM3NCBzb21lIGJyb3dzZXJzIHJlc2V0IHNlbGVjdGVkIGhlcmVcbiAgICAgICAgICBvbGRJdGVtcy5zcGxpY2UoaSwgMCwgaXRlbSlcbiAgICAgICAgfVxuXG4gICAgICAgIHRhZ3Muc3BsaWNlKGksIDAsIHRhZylcbiAgICAgICAgcG9zID0gaSAvLyBoYW5kbGVkIGhlcmUgc28gbm8gbW92ZVxuICAgICAgfSBlbHNlIHRhZy51cGRhdGUoaXRlbSwgdHJ1ZSlcblxuICAgICAgLy8gcmVvcmRlciB0aGUgdGFnIGlmIGl0J3Mgbm90IGxvY2F0ZWQgaW4gaXRzIHByZXZpb3VzIHBvc2l0aW9uXG4gICAgICBpZiAoXG4gICAgICAgIHBvcyAhPT0gaSAmJiBfbXVzdFJlb3JkZXIgJiZcbiAgICAgICAgdGFnc1tpXSAvLyBmaXggMTU4MSB1bmFibGUgdG8gcmVwcm9kdWNlIGl0IGluIGEgdGVzdCFcbiAgICAgICkge1xuICAgICAgICAvLyB1cGRhdGUgdGhlIERPTVxuICAgICAgICBpZiAoaXNWaXJ0dWFsKVxuICAgICAgICAgIG1vdmVWaXJ0dWFsKHRhZywgcm9vdCwgdGFnc1tpXSwgZG9tLmNoaWxkTm9kZXMubGVuZ3RoKVxuICAgICAgICBlbHNlIHJvb3QuaW5zZXJ0QmVmb3JlKHRhZy5yb290LCB0YWdzW2ldLnJvb3QpXG4gICAgICAgIC8vIHVwZGF0ZSB0aGUgcG9zaXRpb24gYXR0cmlidXRlIGlmIGl0IGV4aXN0c1xuICAgICAgICBpZiAoZXhwci5wb3MpXG4gICAgICAgICAgdGFnW2V4cHIucG9zXSA9IGlcbiAgICAgICAgLy8gbW92ZSB0aGUgb2xkIHRhZyBpbnN0YW5jZVxuICAgICAgICB0YWdzLnNwbGljZShpLCAwLCB0YWdzLnNwbGljZShwb3MsIDEpWzBdKVxuICAgICAgICAvLyBtb3ZlIHRoZSBvbGQgaXRlbVxuICAgICAgICBvbGRJdGVtcy5zcGxpY2UoaSwgMCwgb2xkSXRlbXMuc3BsaWNlKHBvcywgMSlbMF0pXG4gICAgICAgIC8vIGlmIHRoZSBsb29wIHRhZ3MgYXJlIG5vdCBjdXN0b21cbiAgICAgICAgLy8gd2UgbmVlZCB0byBtb3ZlIGFsbCB0aGVpciBjdXN0b20gdGFncyBpbnRvIHRoZSByaWdodCBwb3NpdGlvblxuICAgICAgICBpZiAoIWNoaWxkICYmIHRhZy50YWdzKSBtb3ZlTmVzdGVkVGFncyh0YWcsIGkpXG4gICAgICB9XG5cbiAgICAgIC8vIGNhY2hlIHRoZSBvcmlnaW5hbCBpdGVtIHRvIHVzZSBpdCBpbiB0aGUgZXZlbnRzIGJvdW5kIHRvIHRoaXMgbm9kZVxuICAgICAgLy8gYW5kIGl0cyBjaGlsZHJlblxuICAgICAgdGFnLl9pdGVtID0gaXRlbVxuICAgICAgLy8gY2FjaGUgdGhlIHJlYWwgcGFyZW50IHRhZyBpbnRlcm5hbGx5XG4gICAgICBkZWZpbmVQcm9wZXJ0eSh0YWcsICdfcGFyZW50JywgcGFyZW50KVxuICAgIH1cblxuICAgIC8vIHJlbW92ZSB0aGUgcmVkdW5kYW50IHRhZ3NcbiAgICB1bm1vdW50UmVkdW5kYW50KGl0ZW1zLCB0YWdzKVxuXG4gICAgLy8gaW5zZXJ0IHRoZSBuZXcgbm9kZXNcbiAgICByb290Lmluc2VydEJlZm9yZShmcmFnLCByZWYpXG4gICAgaWYgKGlzT3B0aW9uKSB7XG5cbiAgICAgIC8vICMxMzc0IEZpcmVGb3ggYnVnIGluIDxvcHRpb24gc2VsZWN0ZWQ9e2V4cHJlc3Npb259PlxuICAgICAgaWYgKEZJUkVGT1ggJiYgIXJvb3QubXVsdGlwbGUpIHtcbiAgICAgICAgZm9yICh2YXIgbiA9IDA7IG4gPCByb290Lmxlbmd0aDsgbisrKSB7XG4gICAgICAgICAgaWYgKHJvb3Rbbl0uX19yaW90MTM3NCkge1xuICAgICAgICAgICAgcm9vdC5zZWxlY3RlZEluZGV4ID0gbiAgLy8gY2xlYXIgb3RoZXIgb3B0aW9uc1xuICAgICAgICAgICAgZGVsZXRlIHJvb3Rbbl0uX19yaW90MTM3NFxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBzZXQgdGhlICd0YWdzJyBwcm9wZXJ0eSBvZiB0aGUgcGFyZW50IHRhZ1xuICAgIC8vIGlmIGNoaWxkIGlzICd1bmRlZmluZWQnIGl0IG1lYW5zIHRoYXQgd2UgZG9uJ3QgbmVlZCB0byBzZXQgdGhpcyBwcm9wZXJ0eVxuICAgIC8vIGZvciBleGFtcGxlOlxuICAgIC8vIHdlIGRvbid0IG5lZWQgc3RvcmUgdGhlIGBteVRhZy50YWdzWydkaXYnXWAgcHJvcGVydHkgaWYgd2UgYXJlIGxvb3BpbmcgYSBkaXYgdGFnXG4gICAgLy8gYnV0IHdlIG5lZWQgdG8gdHJhY2sgdGhlIGBteVRhZy50YWdzWydjaGlsZCddYCBwcm9wZXJ0eSBsb29waW5nIGEgY3VzdG9tIGNoaWxkIG5vZGUgbmFtZWQgYGNoaWxkYFxuICAgIGlmIChjaGlsZCkgcGFyZW50LnRhZ3NbdGFnTmFtZV0gPSB0YWdzXG5cbiAgICAvLyBjbG9uZSB0aGUgaXRlbXMgYXJyYXlcbiAgICBvbGRJdGVtcyA9IGl0ZW1zLnNsaWNlKClcblxuICB9KVxuXG59XG4vKipcbiAqIE9iamVjdCB0aGF0IHdpbGwgYmUgdXNlZCB0byBpbmplY3QgYW5kIG1hbmFnZSB0aGUgY3NzIG9mIGV2ZXJ5IHRhZyBpbnN0YW5jZVxuICovXG52YXIgc3R5bGVNYW5hZ2VyID0gKGZ1bmN0aW9uKF9yaW90KSB7XG5cbiAgaWYgKCF3aW5kb3cpIHJldHVybiB7IC8vIHNraXAgaW5qZWN0aW9uIG9uIHRoZSBzZXJ2ZXJcbiAgICBhZGQ6IGZ1bmN0aW9uICgpIHt9LFxuICAgIGluamVjdDogZnVuY3Rpb24gKCkge31cbiAgfVxuXG4gIHZhciBzdHlsZU5vZGUgPSAoZnVuY3Rpb24gKCkge1xuICAgIC8vIGNyZWF0ZSBhIG5ldyBzdHlsZSBlbGVtZW50IHdpdGggdGhlIGNvcnJlY3QgdHlwZVxuICAgIHZhciBuZXdOb2RlID0gbWtFbCgnc3R5bGUnKVxuICAgIHNldEF0dHIobmV3Tm9kZSwgJ3R5cGUnLCAndGV4dC9jc3MnKVxuXG4gICAgLy8gcmVwbGFjZSBhbnkgdXNlciBub2RlIG9yIGluc2VydCB0aGUgbmV3IG9uZSBpbnRvIHRoZSBoZWFkXG4gICAgdmFyIHVzZXJOb2RlID0gJCgnc3R5bGVbdHlwZT1yaW90XScpXG4gICAgaWYgKHVzZXJOb2RlKSB7XG4gICAgICBpZiAodXNlck5vZGUuaWQpIG5ld05vZGUuaWQgPSB1c2VyTm9kZS5pZFxuICAgICAgdXNlck5vZGUucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQobmV3Tm9kZSwgdXNlck5vZGUpXG4gICAgfVxuICAgIGVsc2UgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXS5hcHBlbmRDaGlsZChuZXdOb2RlKVxuXG4gICAgcmV0dXJuIG5ld05vZGVcbiAgfSkoKVxuXG4gIC8vIENyZWF0ZSBjYWNoZSBhbmQgc2hvcnRjdXQgdG8gdGhlIGNvcnJlY3QgcHJvcGVydHlcbiAgdmFyIGNzc1RleHRQcm9wID0gc3R5bGVOb2RlLnN0eWxlU2hlZXQsXG4gICAgc3R5bGVzVG9JbmplY3QgPSAnJ1xuXG4gIC8vIEV4cG9zZSB0aGUgc3R5bGUgbm9kZSBpbiBhIG5vbi1tb2RpZmljYWJsZSBwcm9wZXJ0eVxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoX3Jpb3QsICdzdHlsZU5vZGUnLCB7XG4gICAgdmFsdWU6IHN0eWxlTm9kZSxcbiAgICB3cml0YWJsZTogdHJ1ZVxuICB9KVxuXG4gIC8qKlxuICAgKiBQdWJsaWMgYXBpXG4gICAqL1xuICByZXR1cm4ge1xuICAgIC8qKlxuICAgICAqIFNhdmUgYSB0YWcgc3R5bGUgdG8gYmUgbGF0ZXIgaW5qZWN0ZWQgaW50byBET01cbiAgICAgKiBAcGFyYW0gICB7IFN0cmluZyB9IGNzcyBbZGVzY3JpcHRpb25dXG4gICAgICovXG4gICAgYWRkOiBmdW5jdGlvbihjc3MpIHtcbiAgICAgIHN0eWxlc1RvSW5qZWN0ICs9IGNzc1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogSW5qZWN0IGFsbCBwcmV2aW91c2x5IHNhdmVkIHRhZyBzdHlsZXMgaW50byBET01cbiAgICAgKiBpbm5lckhUTUwgc2VlbXMgc2xvdzogaHR0cDovL2pzcGVyZi5jb20vcmlvdC1pbnNlcnQtc3R5bGVcbiAgICAgKi9cbiAgICBpbmplY3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHN0eWxlc1RvSW5qZWN0KSB7XG4gICAgICAgIGlmIChjc3NUZXh0UHJvcCkgY3NzVGV4dFByb3AuY3NzVGV4dCArPSBzdHlsZXNUb0luamVjdFxuICAgICAgICBlbHNlIHN0eWxlTm9kZS5pbm5lckhUTUwgKz0gc3R5bGVzVG9JbmplY3RcbiAgICAgICAgc3R5bGVzVG9JbmplY3QgPSAnJ1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG59KShyaW90KVxuXG5cbmZ1bmN0aW9uIHBhcnNlTmFtZWRFbGVtZW50cyhyb290LCB0YWcsIGNoaWxkVGFncywgZm9yY2VQYXJzaW5nTmFtZWQpIHtcblxuICB3YWxrKHJvb3QsIGZ1bmN0aW9uKGRvbSkge1xuICAgIGlmIChkb20ubm9kZVR5cGUgPT0gMSkge1xuICAgICAgZG9tLmlzTG9vcCA9IGRvbS5pc0xvb3AgfHxcbiAgICAgICAgICAgICAgICAgIChkb20ucGFyZW50Tm9kZSAmJiBkb20ucGFyZW50Tm9kZS5pc0xvb3AgfHwgZ2V0QXR0cihkb20sICdlYWNoJykpXG4gICAgICAgICAgICAgICAgICAgID8gMSA6IDBcblxuICAgICAgLy8gY3VzdG9tIGNoaWxkIHRhZ1xuICAgICAgaWYgKGNoaWxkVGFncykge1xuICAgICAgICB2YXIgY2hpbGQgPSBnZXRUYWcoZG9tKVxuXG4gICAgICAgIGlmIChjaGlsZCAmJiAhZG9tLmlzTG9vcClcbiAgICAgICAgICBjaGlsZFRhZ3MucHVzaChpbml0Q2hpbGRUYWcoY2hpbGQsIHtyb290OiBkb20sIHBhcmVudDogdGFnfSwgZG9tLmlubmVySFRNTCwgdGFnKSlcbiAgICAgIH1cblxuICAgICAgaWYgKCFkb20uaXNMb29wIHx8IGZvcmNlUGFyc2luZ05hbWVkKVxuICAgICAgICBzZXROYW1lZChkb20sIHRhZywgW10pXG4gICAgfVxuXG4gIH0pXG5cbn1cblxuZnVuY3Rpb24gcGFyc2VFeHByZXNzaW9ucyhyb290LCB0YWcsIGV4cHJlc3Npb25zKSB7XG5cbiAgZnVuY3Rpb24gYWRkRXhwcihkb20sIHZhbCwgZXh0cmEpIHtcbiAgICBpZiAodG1wbC5oYXNFeHByKHZhbCkpIHtcbiAgICAgIGV4cHJlc3Npb25zLnB1c2goZXh0ZW5kKHsgZG9tOiBkb20sIGV4cHI6IHZhbCB9LCBleHRyYSkpXG4gICAgfVxuICB9XG5cbiAgd2Fsayhyb290LCBmdW5jdGlvbihkb20pIHtcbiAgICB2YXIgdHlwZSA9IGRvbS5ub2RlVHlwZSxcbiAgICAgIGF0dHJcblxuICAgIC8vIHRleHQgbm9kZVxuICAgIGlmICh0eXBlID09IDMgJiYgZG9tLnBhcmVudE5vZGUudGFnTmFtZSAhPSAnU1RZTEUnKSBhZGRFeHByKGRvbSwgZG9tLm5vZGVWYWx1ZSlcbiAgICBpZiAodHlwZSAhPSAxKSByZXR1cm5cblxuICAgIC8qIGVsZW1lbnQgKi9cblxuICAgIC8vIGxvb3BcbiAgICBhdHRyID0gZ2V0QXR0cihkb20sICdlYWNoJylcblxuICAgIGlmIChhdHRyKSB7IF9lYWNoKGRvbSwgdGFnLCBhdHRyKTsgcmV0dXJuIGZhbHNlIH1cblxuICAgIC8vIGF0dHJpYnV0ZSBleHByZXNzaW9uc1xuICAgIGVhY2goZG9tLmF0dHJpYnV0ZXMsIGZ1bmN0aW9uKGF0dHIpIHtcbiAgICAgIHZhciBuYW1lID0gYXR0ci5uYW1lLFxuICAgICAgICBib29sID0gbmFtZS5zcGxpdCgnX18nKVsxXVxuXG4gICAgICBhZGRFeHByKGRvbSwgYXR0ci52YWx1ZSwgeyBhdHRyOiBib29sIHx8IG5hbWUsIGJvb2w6IGJvb2wgfSlcbiAgICAgIGlmIChib29sKSB7IHJlbUF0dHIoZG9tLCBuYW1lKTsgcmV0dXJuIGZhbHNlIH1cblxuICAgIH0pXG5cbiAgICAvLyBza2lwIGN1c3RvbSB0YWdzXG4gICAgaWYgKGdldFRhZyhkb20pKSByZXR1cm4gZmFsc2VcblxuICB9KVxuXG59XG5mdW5jdGlvbiBUYWcoaW1wbCwgY29uZiwgaW5uZXJIVE1MKSB7XG5cbiAgdmFyIHNlbGYgPSByaW90Lm9ic2VydmFibGUodGhpcyksXG4gICAgb3B0cyA9IGluaGVyaXQoY29uZi5vcHRzKSB8fCB7fSxcbiAgICBwYXJlbnQgPSBjb25mLnBhcmVudCxcbiAgICBpc0xvb3AgPSBjb25mLmlzTG9vcCxcbiAgICBoYXNJbXBsID0gY29uZi5oYXNJbXBsLFxuICAgIGl0ZW0gPSBjbGVhblVwRGF0YShjb25mLml0ZW0pLFxuICAgIGV4cHJlc3Npb25zID0gW10sXG4gICAgY2hpbGRUYWdzID0gW10sXG4gICAgcm9vdCA9IGNvbmYucm9vdCxcbiAgICB0YWdOYW1lID0gcm9vdC50YWdOYW1lLnRvTG93ZXJDYXNlKCksXG4gICAgYXR0ciA9IHt9LFxuICAgIHByb3BzSW5TeW5jV2l0aFBhcmVudCA9IFtdLFxuICAgIGRvbVxuXG4gIC8vIG9ubHkgY2FsbCB1bm1vdW50IGlmIHdlIGhhdmUgYSB2YWxpZCBfX3RhZ0ltcGwgKGhhcyBuYW1lIHByb3BlcnR5KVxuICBpZiAoaW1wbC5uYW1lICYmIHJvb3QuX3RhZykgcm9vdC5fdGFnLnVubW91bnQodHJ1ZSlcblxuICAvLyBub3QgeWV0IG1vdW50ZWRcbiAgdGhpcy5pc01vdW50ZWQgPSBmYWxzZVxuICByb290LmlzTG9vcCA9IGlzTG9vcFxuXG4gIC8vIGtlZXAgYSByZWZlcmVuY2UgdG8gdGhlIHRhZyBqdXN0IGNyZWF0ZWRcbiAgLy8gc28gd2Ugd2lsbCBiZSBhYmxlIHRvIG1vdW50IHRoaXMgdGFnIG11bHRpcGxlIHRpbWVzXG4gIHJvb3QuX3RhZyA9IHRoaXNcblxuICAvLyBjcmVhdGUgYSB1bmlxdWUgaWQgdG8gdGhpcyB0YWdcbiAgLy8gaXQgY291bGQgYmUgaGFuZHkgdG8gdXNlIGl0IGFsc28gdG8gaW1wcm92ZSB0aGUgdmlydHVhbCBkb20gcmVuZGVyaW5nIHNwZWVkXG4gIGRlZmluZVByb3BlcnR5KHRoaXMsICdfcmlvdF9pZCcsICsrX191aWQpIC8vIGJhc2UgMSBhbGxvd3MgdGVzdCAhdC5fcmlvdF9pZFxuXG4gIGV4dGVuZCh0aGlzLCB7IHBhcmVudDogcGFyZW50LCByb290OiByb290LCBvcHRzOiBvcHRzfSwgaXRlbSlcbiAgLy8gcHJvdGVjdCB0aGUgXCJ0YWdzXCIgcHJvcGVydHkgZnJvbSBiZWluZyBvdmVycmlkZGVuXG4gIGRlZmluZVByb3BlcnR5KHRoaXMsICd0YWdzJywge30pXG5cbiAgLy8gZ3JhYiBhdHRyaWJ1dGVzXG4gIGVhY2gocm9vdC5hdHRyaWJ1dGVzLCBmdW5jdGlvbihlbCkge1xuICAgIHZhciB2YWwgPSBlbC52YWx1ZVxuICAgIC8vIHJlbWVtYmVyIGF0dHJpYnV0ZXMgd2l0aCBleHByZXNzaW9ucyBvbmx5XG4gICAgaWYgKHRtcGwuaGFzRXhwcih2YWwpKSBhdHRyW2VsLm5hbWVdID0gdmFsXG4gIH0pXG5cbiAgZG9tID0gbWtkb20oaW1wbC50bXBsLCBpbm5lckhUTUwpXG5cbiAgLy8gb3B0aW9uc1xuICBmdW5jdGlvbiB1cGRhdGVPcHRzKCkge1xuICAgIHZhciBjdHggPSBoYXNJbXBsICYmIGlzTG9vcCA/IHNlbGYgOiBwYXJlbnQgfHwgc2VsZlxuXG4gICAgLy8gdXBkYXRlIG9wdHMgZnJvbSBjdXJyZW50IERPTSBhdHRyaWJ1dGVzXG4gICAgZWFjaChyb290LmF0dHJpYnV0ZXMsIGZ1bmN0aW9uKGVsKSB7XG4gICAgICB2YXIgdmFsID0gZWwudmFsdWVcbiAgICAgIG9wdHNbdG9DYW1lbChlbC5uYW1lKV0gPSB0bXBsLmhhc0V4cHIodmFsKSA/IHRtcGwodmFsLCBjdHgpIDogdmFsXG4gICAgfSlcbiAgICAvLyByZWNvdmVyIHRob3NlIHdpdGggZXhwcmVzc2lvbnNcbiAgICBlYWNoKE9iamVjdC5rZXlzKGF0dHIpLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgICBvcHRzW3RvQ2FtZWwobmFtZSldID0gdG1wbChhdHRyW25hbWVdLCBjdHgpXG4gICAgfSlcbiAgfVxuXG4gIGZ1bmN0aW9uIG5vcm1hbGl6ZURhdGEoZGF0YSkge1xuICAgIGZvciAodmFyIGtleSBpbiBpdGVtKSB7XG4gICAgICBpZiAodHlwZW9mIHNlbGZba2V5XSAhPT0gVF9VTkRFRiAmJiBpc1dyaXRhYmxlKHNlbGYsIGtleSkpXG4gICAgICAgIHNlbGZba2V5XSA9IGRhdGFba2V5XVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGluaGVyaXRGcm9tUGFyZW50ICgpIHtcbiAgICBpZiAoIXNlbGYucGFyZW50IHx8ICFpc0xvb3ApIHJldHVyblxuICAgIGVhY2goT2JqZWN0LmtleXMoc2VsZi5wYXJlbnQpLCBmdW5jdGlvbihrKSB7XG4gICAgICAvLyBzb21lIHByb3BlcnRpZXMgbXVzdCBiZSBhbHdheXMgaW4gc3luYyB3aXRoIHRoZSBwYXJlbnQgdGFnXG4gICAgICB2YXIgbXVzdFN5bmMgPSAhUkVTRVJWRURfV09SRFNfQkxBQ0tMSVNULnRlc3QoaykgJiYgY29udGFpbnMocHJvcHNJblN5bmNXaXRoUGFyZW50LCBrKVxuICAgICAgaWYgKHR5cGVvZiBzZWxmW2tdID09PSBUX1VOREVGIHx8IG11c3RTeW5jKSB7XG4gICAgICAgIC8vIHRyYWNrIHRoZSBwcm9wZXJ0eSB0byBrZWVwIGluIHN5bmNcbiAgICAgICAgLy8gc28gd2UgY2FuIGtlZXAgaXQgdXBkYXRlZFxuICAgICAgICBpZiAoIW11c3RTeW5jKSBwcm9wc0luU3luY1dpdGhQYXJlbnQucHVzaChrKVxuICAgICAgICBzZWxmW2tdID0gc2VsZi5wYXJlbnRba11cbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSB0aGUgdGFnIGV4cHJlc3Npb25zIGFuZCBvcHRpb25zXG4gICAqIEBwYXJhbSAgIHsgKiB9ICBkYXRhIC0gZGF0YSB3ZSB3YW50IHRvIHVzZSB0byBleHRlbmQgdGhlIHRhZyBwcm9wZXJ0aWVzXG4gICAqIEBwYXJhbSAgIHsgQm9vbGVhbiB9IGlzSW5oZXJpdGVkIC0gaXMgdGhpcyB1cGRhdGUgY29taW5nIGZyb20gYSBwYXJlbnQgdGFnP1xuICAgKiBAcmV0dXJucyB7IHNlbGYgfVxuICAgKi9cbiAgZGVmaW5lUHJvcGVydHkodGhpcywgJ3VwZGF0ZScsIGZ1bmN0aW9uKGRhdGEsIGlzSW5oZXJpdGVkKSB7XG5cbiAgICAvLyBtYWtlIHN1cmUgdGhlIGRhdGEgcGFzc2VkIHdpbGwgbm90IG92ZXJyaWRlXG4gICAgLy8gdGhlIGNvbXBvbmVudCBjb3JlIG1ldGhvZHNcbiAgICBkYXRhID0gY2xlYW5VcERhdGEoZGF0YSlcbiAgICAvLyBpbmhlcml0IHByb3BlcnRpZXMgZnJvbSB0aGUgcGFyZW50XG4gICAgaW5oZXJpdEZyb21QYXJlbnQoKVxuICAgIC8vIG5vcm1hbGl6ZSB0aGUgdGFnIHByb3BlcnRpZXMgaW4gY2FzZSBhbiBpdGVtIG9iamVjdCB3YXMgaW5pdGlhbGx5IHBhc3NlZFxuICAgIGlmIChkYXRhICYmIGlzT2JqZWN0KGl0ZW0pKSB7XG4gICAgICBub3JtYWxpemVEYXRhKGRhdGEpXG4gICAgICBpdGVtID0gZGF0YVxuICAgIH1cbiAgICBleHRlbmQoc2VsZiwgZGF0YSlcbiAgICB1cGRhdGVPcHRzKClcbiAgICBzZWxmLnRyaWdnZXIoJ3VwZGF0ZScsIGRhdGEpXG4gICAgdXBkYXRlKGV4cHJlc3Npb25zLCBzZWxmKVxuXG4gICAgLy8gdGhlIHVwZGF0ZWQgZXZlbnQgd2lsbCBiZSB0cmlnZ2VyZWRcbiAgICAvLyBvbmNlIHRoZSBET00gd2lsbCBiZSByZWFkeSBhbmQgYWxsIHRoZSByZS1mbG93cyBhcmUgY29tcGxldGVkXG4gICAgLy8gdGhpcyBpcyB1c2VmdWwgaWYgeW91IHdhbnQgdG8gZ2V0IHRoZSBcInJlYWxcIiByb290IHByb3BlcnRpZXNcbiAgICAvLyA0IGV4OiByb290Lm9mZnNldFdpZHRoIC4uLlxuICAgIGlmIChpc0luaGVyaXRlZCAmJiBzZWxmLnBhcmVudClcbiAgICAgIC8vIGNsb3NlcyAjMTU5OVxuICAgICAgc2VsZi5wYXJlbnQub25lKCd1cGRhdGVkJywgZnVuY3Rpb24oKSB7IHNlbGYudHJpZ2dlcigndXBkYXRlZCcpIH0pXG4gICAgZWxzZSByQUYoZnVuY3Rpb24oKSB7IHNlbGYudHJpZ2dlcigndXBkYXRlZCcpIH0pXG5cbiAgICByZXR1cm4gdGhpc1xuICB9KVxuXG4gIGRlZmluZVByb3BlcnR5KHRoaXMsICdtaXhpbicsIGZ1bmN0aW9uKCkge1xuICAgIGVhY2goYXJndW1lbnRzLCBmdW5jdGlvbihtaXgpIHtcbiAgICAgIHZhciBpbnN0YW5jZSxcbiAgICAgICAgcHJvcHMgPSBbXSxcbiAgICAgICAgb2JqXG5cbiAgICAgIG1peCA9IHR5cGVvZiBtaXggPT09IFRfU1RSSU5HID8gcmlvdC5taXhpbihtaXgpIDogbWl4XG5cbiAgICAgIC8vIGNoZWNrIGlmIHRoZSBtaXhpbiBpcyBhIGZ1bmN0aW9uXG4gICAgICBpZiAoaXNGdW5jdGlvbihtaXgpKSB7XG4gICAgICAgIC8vIGNyZWF0ZSB0aGUgbmV3IG1peGluIGluc3RhbmNlXG4gICAgICAgIGluc3RhbmNlID0gbmV3IG1peCgpXG4gICAgICB9IGVsc2UgaW5zdGFuY2UgPSBtaXhcblxuICAgICAgLy8gYnVpbGQgbXVsdGlsZXZlbCBwcm90b3R5cGUgaW5oZXJpdGFuY2UgY2hhaW4gcHJvcGVydHkgbGlzdFxuICAgICAgZG8gcHJvcHMgPSBwcm9wcy5jb25jYXQoT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMob2JqIHx8IGluc3RhbmNlKSlcbiAgICAgIHdoaWxlIChvYmogPSBPYmplY3QuZ2V0UHJvdG90eXBlT2Yob2JqIHx8IGluc3RhbmNlKSlcblxuICAgICAgLy8gbG9vcCB0aGUga2V5cyBpbiB0aGUgZnVuY3Rpb24gcHJvdG90eXBlIG9yIHRoZSBhbGwgb2JqZWN0IGtleXNcbiAgICAgIGVhY2gocHJvcHMsIGZ1bmN0aW9uKGtleSkge1xuICAgICAgICAvLyBiaW5kIG1ldGhvZHMgdG8gc2VsZlxuICAgICAgICBpZiAoa2V5ICE9ICdpbml0JyAmJiAhc2VsZltrZXldKVxuICAgICAgICAgIC8vIGFwcGx5IG1ldGhvZCBvbmx5IGlmIGl0IGRvZXMgbm90IGFscmVhZHkgZXhpc3Qgb24gdGhlIGluc3RhbmNlXG4gICAgICAgICAgc2VsZltrZXldID0gaXNGdW5jdGlvbihpbnN0YW5jZVtrZXldKSA/XG4gICAgICAgICAgICBpbnN0YW5jZVtrZXldLmJpbmQoc2VsZikgOlxuICAgICAgICAgICAgaW5zdGFuY2Vba2V5XVxuICAgICAgfSlcblxuICAgICAgLy8gaW5pdCBtZXRob2Qgd2lsbCBiZSBjYWxsZWQgYXV0b21hdGljYWxseVxuICAgICAgaWYgKGluc3RhbmNlLmluaXQpIGluc3RhbmNlLmluaXQuYmluZChzZWxmKSgpXG4gICAgfSlcbiAgICByZXR1cm4gdGhpc1xuICB9KVxuXG4gIGRlZmluZVByb3BlcnR5KHRoaXMsICdtb3VudCcsIGZ1bmN0aW9uKCkge1xuXG4gICAgdXBkYXRlT3B0cygpXG5cbiAgICAvLyBhZGQgZ2xvYmFsIG1peGluc1xuICAgIHZhciBnbG9iYWxNaXhpbiA9IHJpb3QubWl4aW4oR0xPQkFMX01JWElOKVxuICAgIGlmIChnbG9iYWxNaXhpbilcbiAgICAgIGZvciAodmFyIGkgaW4gZ2xvYmFsTWl4aW4pXG4gICAgICAgIGlmIChnbG9iYWxNaXhpbi5oYXNPd25Qcm9wZXJ0eShpKSlcbiAgICAgICAgICBzZWxmLm1peGluKGdsb2JhbE1peGluW2ldKVxuXG4gICAgLy8gaW5pdGlhbGlhdGlvblxuICAgIGlmIChpbXBsLmZuKSBpbXBsLmZuLmNhbGwoc2VsZiwgb3B0cylcblxuICAgIC8vIHBhcnNlIGxheW91dCBhZnRlciBpbml0LiBmbiBtYXkgY2FsY3VsYXRlIGFyZ3MgZm9yIG5lc3RlZCBjdXN0b20gdGFnc1xuICAgIHBhcnNlRXhwcmVzc2lvbnMoZG9tLCBzZWxmLCBleHByZXNzaW9ucylcblxuICAgIC8vIG1vdW50IHRoZSBjaGlsZCB0YWdzXG4gICAgdG9nZ2xlKHRydWUpXG5cbiAgICAvLyB1cGRhdGUgdGhlIHJvb3QgYWRkaW5nIGN1c3RvbSBhdHRyaWJ1dGVzIGNvbWluZyBmcm9tIHRoZSBjb21waWxlclxuICAgIC8vIGl0IGZpeGVzIGFsc28gIzEwODdcbiAgICBpZiAoaW1wbC5hdHRycylcbiAgICAgIHdhbGtBdHRyaWJ1dGVzKGltcGwuYXR0cnMsIGZ1bmN0aW9uIChrLCB2KSB7IHNldEF0dHIocm9vdCwgaywgdikgfSlcbiAgICBpZiAoaW1wbC5hdHRycyB8fCBoYXNJbXBsKVxuICAgICAgcGFyc2VFeHByZXNzaW9ucyhzZWxmLnJvb3QsIHNlbGYsIGV4cHJlc3Npb25zKVxuXG4gICAgaWYgKCFzZWxmLnBhcmVudCB8fCBpc0xvb3ApIHNlbGYudXBkYXRlKGl0ZW0pXG5cbiAgICAvLyBpbnRlcm5hbCB1c2Ugb25seSwgZml4ZXMgIzQwM1xuICAgIHNlbGYudHJpZ2dlcignYmVmb3JlLW1vdW50JylcblxuICAgIGlmIChpc0xvb3AgJiYgIWhhc0ltcGwpIHtcbiAgICAgIC8vIHVwZGF0ZSB0aGUgcm9vdCBhdHRyaWJ1dGUgZm9yIHRoZSBsb29wZWQgZWxlbWVudHNcbiAgICAgIHJvb3QgPSBkb20uZmlyc3RDaGlsZFxuICAgIH0gZWxzZSB7XG4gICAgICB3aGlsZSAoZG9tLmZpcnN0Q2hpbGQpIHJvb3QuYXBwZW5kQ2hpbGQoZG9tLmZpcnN0Q2hpbGQpXG4gICAgICBpZiAocm9vdC5zdHViKSByb290ID0gcGFyZW50LnJvb3RcbiAgICB9XG5cbiAgICBkZWZpbmVQcm9wZXJ0eShzZWxmLCAncm9vdCcsIHJvb3QpXG5cbiAgICAvLyBwYXJzZSB0aGUgbmFtZWQgZG9tIG5vZGVzIGluIHRoZSBsb29wZWQgY2hpbGRcbiAgICAvLyBhZGRpbmcgdGhlbSB0byB0aGUgcGFyZW50IGFzIHdlbGxcbiAgICBpZiAoaXNMb29wKVxuICAgICAgcGFyc2VOYW1lZEVsZW1lbnRzKHNlbGYucm9vdCwgc2VsZi5wYXJlbnQsIG51bGwsIHRydWUpXG5cbiAgICAvLyBpZiBpdCdzIG5vdCBhIGNoaWxkIHRhZyB3ZSBjYW4gdHJpZ2dlciBpdHMgbW91bnQgZXZlbnRcbiAgICBpZiAoIXNlbGYucGFyZW50IHx8IHNlbGYucGFyZW50LmlzTW91bnRlZCkge1xuICAgICAgc2VsZi5pc01vdW50ZWQgPSB0cnVlXG4gICAgICBzZWxmLnRyaWdnZXIoJ21vdW50JylcbiAgICB9XG4gICAgLy8gb3RoZXJ3aXNlIHdlIG5lZWQgdG8gd2FpdCB0aGF0IHRoZSBwYXJlbnQgZXZlbnQgZ2V0cyB0cmlnZ2VyZWRcbiAgICBlbHNlIHNlbGYucGFyZW50Lm9uZSgnbW91bnQnLCBmdW5jdGlvbigpIHtcbiAgICAgIC8vIGF2b2lkIHRvIHRyaWdnZXIgdGhlIGBtb3VudGAgZXZlbnQgZm9yIHRoZSB0YWdzXG4gICAgICAvLyBub3QgdmlzaWJsZSBpbmNsdWRlZCBpbiBhbiBpZiBzdGF0ZW1lbnRcbiAgICAgIGlmICghaXNJblN0dWIoc2VsZi5yb290KSkge1xuICAgICAgICBzZWxmLnBhcmVudC5pc01vdW50ZWQgPSBzZWxmLmlzTW91bnRlZCA9IHRydWVcbiAgICAgICAgc2VsZi50cmlnZ2VyKCdtb3VudCcpXG4gICAgICB9XG4gICAgfSlcbiAgfSlcblxuXG4gIGRlZmluZVByb3BlcnR5KHRoaXMsICd1bm1vdW50JywgZnVuY3Rpb24oa2VlcFJvb3RUYWcpIHtcbiAgICB2YXIgZWwgPSByb290LFxuICAgICAgcCA9IGVsLnBhcmVudE5vZGUsXG4gICAgICBwdGFnLFxuICAgICAgdGFnSW5kZXggPSBfX3ZpcnR1YWxEb20uaW5kZXhPZihzZWxmKVxuXG4gICAgc2VsZi50cmlnZ2VyKCdiZWZvcmUtdW5tb3VudCcpXG5cbiAgICAvLyByZW1vdmUgdGhpcyB0YWcgaW5zdGFuY2UgZnJvbSB0aGUgZ2xvYmFsIHZpcnR1YWxEb20gdmFyaWFibGVcbiAgICBpZiAofnRhZ0luZGV4KVxuICAgICAgX192aXJ0dWFsRG9tLnNwbGljZSh0YWdJbmRleCwgMSlcblxuICAgIGlmIChwKSB7XG5cbiAgICAgIGlmIChwYXJlbnQpIHtcbiAgICAgICAgcHRhZyA9IGdldEltbWVkaWF0ZUN1c3RvbVBhcmVudFRhZyhwYXJlbnQpXG4gICAgICAgIC8vIHJlbW92ZSB0aGlzIHRhZyBmcm9tIHRoZSBwYXJlbnQgdGFncyBvYmplY3RcbiAgICAgICAgLy8gaWYgdGhlcmUgYXJlIG11bHRpcGxlIG5lc3RlZCB0YWdzIHdpdGggc2FtZSBuYW1lLi5cbiAgICAgICAgLy8gcmVtb3ZlIHRoaXMgZWxlbWVudCBmb3JtIHRoZSBhcnJheVxuICAgICAgICBpZiAoaXNBcnJheShwdGFnLnRhZ3NbdGFnTmFtZV0pKVxuICAgICAgICAgIGVhY2gocHRhZy50YWdzW3RhZ05hbWVdLCBmdW5jdGlvbih0YWcsIGkpIHtcbiAgICAgICAgICAgIGlmICh0YWcuX3Jpb3RfaWQgPT0gc2VsZi5fcmlvdF9pZClcbiAgICAgICAgICAgICAgcHRhZy50YWdzW3RhZ05hbWVdLnNwbGljZShpLCAxKVxuICAgICAgICAgIH0pXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAvLyBvdGhlcndpc2UganVzdCBkZWxldGUgdGhlIHRhZyBpbnN0YW5jZVxuICAgICAgICAgIHB0YWcudGFnc1t0YWdOYW1lXSA9IHVuZGVmaW5lZFxuICAgICAgfVxuXG4gICAgICBlbHNlXG4gICAgICAgIHdoaWxlIChlbC5maXJzdENoaWxkKSBlbC5yZW1vdmVDaGlsZChlbC5maXJzdENoaWxkKVxuXG4gICAgICBpZiAoIWtlZXBSb290VGFnKVxuICAgICAgICBwLnJlbW92ZUNoaWxkKGVsKVxuICAgICAgZWxzZSB7XG4gICAgICAgIC8vIHRoZSByaW90LXRhZyBhbmQgdGhlIGRhdGEtaXMgYXR0cmlidXRlcyBhcmVuJ3QgbmVlZGVkIGFueW1vcmUsIHJlbW92ZSB0aGVtXG4gICAgICAgIHJlbUF0dHIocCwgUklPVF9UQUdfSVMpXG4gICAgICAgIHJlbUF0dHIocCwgUklPVF9UQUcpIC8vIHRoaXMgd2lsbCBiZSByZW1vdmVkIGluIHJpb3QgMy4wLjBcbiAgICAgIH1cblxuICAgIH1cblxuICAgIGlmICh0aGlzLl92aXJ0cykge1xuICAgICAgZWFjaCh0aGlzLl92aXJ0cywgZnVuY3Rpb24odikge1xuICAgICAgICBpZiAodi5wYXJlbnROb2RlKSB2LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodilcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgc2VsZi50cmlnZ2VyKCd1bm1vdW50JylcbiAgICB0b2dnbGUoKVxuICAgIHNlbGYub2ZmKCcqJylcbiAgICBzZWxmLmlzTW91bnRlZCA9IGZhbHNlXG4gICAgZGVsZXRlIHJvb3QuX3RhZ1xuXG4gIH0pXG5cbiAgLy8gcHJveHkgZnVuY3Rpb24gdG8gYmluZCB1cGRhdGVzXG4gIC8vIGRpc3BhdGNoZWQgZnJvbSBhIHBhcmVudCB0YWdcbiAgZnVuY3Rpb24gb25DaGlsZFVwZGF0ZShkYXRhKSB7IHNlbGYudXBkYXRlKGRhdGEsIHRydWUpIH1cblxuICBmdW5jdGlvbiB0b2dnbGUoaXNNb3VudCkge1xuXG4gICAgLy8gbW91bnQvdW5tb3VudCBjaGlsZHJlblxuICAgIGVhY2goY2hpbGRUYWdzLCBmdW5jdGlvbihjaGlsZCkgeyBjaGlsZFtpc01vdW50ID8gJ21vdW50JyA6ICd1bm1vdW50J10oKSB9KVxuXG4gICAgLy8gbGlzdGVuL3VubGlzdGVuIHBhcmVudCAoZXZlbnRzIGZsb3cgb25lIHdheSBmcm9tIHBhcmVudCB0byBjaGlsZHJlbilcbiAgICBpZiAoIXBhcmVudCkgcmV0dXJuXG4gICAgdmFyIGV2dCA9IGlzTW91bnQgPyAnb24nIDogJ29mZidcblxuICAgIC8vIHRoZSBsb29wIHRhZ3Mgd2lsbCBiZSBhbHdheXMgaW4gc3luYyB3aXRoIHRoZSBwYXJlbnQgYXV0b21hdGljYWxseVxuICAgIGlmIChpc0xvb3ApXG4gICAgICBwYXJlbnRbZXZ0XSgndW5tb3VudCcsIHNlbGYudW5tb3VudClcbiAgICBlbHNlIHtcbiAgICAgIHBhcmVudFtldnRdKCd1cGRhdGUnLCBvbkNoaWxkVXBkYXRlKVtldnRdKCd1bm1vdW50Jywgc2VsZi51bm1vdW50KVxuICAgIH1cbiAgfVxuXG5cbiAgLy8gbmFtZWQgZWxlbWVudHMgYXZhaWxhYmxlIGZvciBmblxuICBwYXJzZU5hbWVkRWxlbWVudHMoZG9tLCB0aGlzLCBjaGlsZFRhZ3MpXG5cbn1cbi8qKlxuICogQXR0YWNoIGFuIGV2ZW50IHRvIGEgRE9NIG5vZGVcbiAqIEBwYXJhbSB7IFN0cmluZyB9IG5hbWUgLSBldmVudCBuYW1lXG4gKiBAcGFyYW0geyBGdW5jdGlvbiB9IGhhbmRsZXIgLSBldmVudCBjYWxsYmFja1xuICogQHBhcmFtIHsgT2JqZWN0IH0gZG9tIC0gZG9tIG5vZGVcbiAqIEBwYXJhbSB7IFRhZyB9IHRhZyAtIHRhZyBpbnN0YW5jZVxuICovXG5mdW5jdGlvbiBzZXRFdmVudEhhbmRsZXIobmFtZSwgaGFuZGxlciwgZG9tLCB0YWcpIHtcblxuICBkb21bbmFtZV0gPSBmdW5jdGlvbihlKSB7XG5cbiAgICB2YXIgcHRhZyA9IHRhZy5fcGFyZW50LFxuICAgICAgaXRlbSA9IHRhZy5faXRlbSxcbiAgICAgIGVsXG5cbiAgICBpZiAoIWl0ZW0pXG4gICAgICB3aGlsZSAocHRhZyAmJiAhaXRlbSkge1xuICAgICAgICBpdGVtID0gcHRhZy5faXRlbVxuICAgICAgICBwdGFnID0gcHRhZy5fcGFyZW50XG4gICAgICB9XG5cbiAgICAvLyBjcm9zcyBicm93c2VyIGV2ZW50IGZpeFxuICAgIGUgPSBlIHx8IHdpbmRvdy5ldmVudFxuXG4gICAgLy8gb3ZlcnJpZGUgdGhlIGV2ZW50IHByb3BlcnRpZXNcbiAgICBpZiAoaXNXcml0YWJsZShlLCAnY3VycmVudFRhcmdldCcpKSBlLmN1cnJlbnRUYXJnZXQgPSBkb21cbiAgICBpZiAoaXNXcml0YWJsZShlLCAndGFyZ2V0JykpIGUudGFyZ2V0ID0gZS5zcmNFbGVtZW50XG4gICAgaWYgKGlzV3JpdGFibGUoZSwgJ3doaWNoJykpIGUud2hpY2ggPSBlLmNoYXJDb2RlIHx8IGUua2V5Q29kZVxuXG4gICAgZS5pdGVtID0gaXRlbVxuXG4gICAgLy8gcHJldmVudCBkZWZhdWx0IGJlaGF2aW91ciAoYnkgZGVmYXVsdClcbiAgICBpZiAoaGFuZGxlci5jYWxsKHRhZywgZSkgIT09IHRydWUgJiYgIS9yYWRpb3xjaGVjay8udGVzdChkb20udHlwZSkpIHtcbiAgICAgIGlmIChlLnByZXZlbnREZWZhdWx0KSBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgIGUucmV0dXJuVmFsdWUgPSBmYWxzZVxuICAgIH1cblxuICAgIGlmICghZS5wcmV2ZW50VXBkYXRlKSB7XG4gICAgICBlbCA9IGl0ZW0gPyBnZXRJbW1lZGlhdGVDdXN0b21QYXJlbnRUYWcocHRhZykgOiB0YWdcbiAgICAgIGVsLnVwZGF0ZSgpXG4gICAgfVxuXG4gIH1cblxufVxuXG5cbi8qKlxuICogSW5zZXJ0IGEgRE9NIG5vZGUgcmVwbGFjaW5nIGFub3RoZXIgb25lICh1c2VkIGJ5IGlmLSBhdHRyaWJ1dGUpXG4gKiBAcGFyYW0gICB7IE9iamVjdCB9IHJvb3QgLSBwYXJlbnQgbm9kZVxuICogQHBhcmFtICAgeyBPYmplY3QgfSBub2RlIC0gbm9kZSByZXBsYWNlZFxuICogQHBhcmFtICAgeyBPYmplY3QgfSBiZWZvcmUgLSBub2RlIGFkZGVkXG4gKi9cbmZ1bmN0aW9uIGluc2VydFRvKHJvb3QsIG5vZGUsIGJlZm9yZSkge1xuICBpZiAoIXJvb3QpIHJldHVyblxuICByb290Lmluc2VydEJlZm9yZShiZWZvcmUsIG5vZGUpXG4gIHJvb3QucmVtb3ZlQ2hpbGQobm9kZSlcbn1cblxuLyoqXG4gKiBVcGRhdGUgdGhlIGV4cHJlc3Npb25zIGluIGEgVGFnIGluc3RhbmNlXG4gKiBAcGFyYW0gICB7IEFycmF5IH0gZXhwcmVzc2lvbnMgLSBleHByZXNzaW9uIHRoYXQgbXVzdCBiZSByZSBldmFsdWF0ZWRcbiAqIEBwYXJhbSAgIHsgVGFnIH0gdGFnIC0gdGFnIGluc3RhbmNlXG4gKi9cbmZ1bmN0aW9uIHVwZGF0ZShleHByZXNzaW9ucywgdGFnKSB7XG5cbiAgZWFjaChleHByZXNzaW9ucywgZnVuY3Rpb24oZXhwciwgaSkge1xuXG4gICAgdmFyIGRvbSA9IGV4cHIuZG9tLFxuICAgICAgYXR0ck5hbWUgPSBleHByLmF0dHIsXG4gICAgICB2YWx1ZSA9IHRtcGwoZXhwci5leHByLCB0YWcpLFxuICAgICAgcGFyZW50ID0gZXhwci5kb20ucGFyZW50Tm9kZVxuXG4gICAgaWYgKGV4cHIuYm9vbCkge1xuICAgICAgdmFsdWUgPSAhIXZhbHVlXG4gICAgfSBlbHNlIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgICB2YWx1ZSA9ICcnXG4gICAgfVxuXG4gICAgLy8gIzE2Mzg6IHJlZ3Jlc3Npb24gb2YgIzE2MTIsIHVwZGF0ZSB0aGUgZG9tIG9ubHkgaWYgdGhlIHZhbHVlIG9mIHRoZVxuICAgIC8vIGV4cHJlc3Npb24gd2FzIGNoYW5nZWRcbiAgICBpZiAoZXhwci52YWx1ZSA9PT0gdmFsdWUpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBleHByLnZhbHVlID0gdmFsdWVcblxuICAgIC8vIHRleHRhcmVhIGFuZCB0ZXh0IG5vZGVzIGhhcyBubyBhdHRyaWJ1dGUgbmFtZVxuICAgIGlmICghYXR0ck5hbWUpIHtcbiAgICAgIC8vIGFib3V0ICM4MTUgdy9vIHJlcGxhY2U6IHRoZSBicm93c2VyIGNvbnZlcnRzIHRoZSB2YWx1ZSB0byBhIHN0cmluZyxcbiAgICAgIC8vIHRoZSBjb21wYXJpc29uIGJ5IFwiPT1cIiBkb2VzIHRvbywgYnV0IG5vdCBpbiB0aGUgc2VydmVyXG4gICAgICB2YWx1ZSArPSAnJ1xuICAgICAgLy8gdGVzdCBmb3IgcGFyZW50IGF2b2lkcyBlcnJvciB3aXRoIGludmFsaWQgYXNzaWdubWVudCB0byBub2RlVmFsdWVcbiAgICAgIGlmIChwYXJlbnQpIHtcbiAgICAgICAgaWYgKHBhcmVudC50YWdOYW1lID09PSAnVEVYVEFSRUEnKSB7XG4gICAgICAgICAgcGFyZW50LnZhbHVlID0gdmFsdWUgICAgICAgICAgICAgICAgICAgIC8vICMxMTEzXG4gICAgICAgICAgaWYgKCFJRV9WRVJTSU9OKSBkb20ubm9kZVZhbHVlID0gdmFsdWUgIC8vICMxNjI1IElFIHRocm93cyBoZXJlLCBub2RlVmFsdWVcbiAgICAgICAgfSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gd2lsbCBiZSBhdmFpbGFibGUgb24gJ3VwZGF0ZWQnXG4gICAgICAgIGVsc2UgZG9tLm5vZGVWYWx1ZSA9IHZhbHVlXG4gICAgICB9XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICAvLyB+fiMxNjEyOiBsb29rIGZvciBjaGFuZ2VzIGluIGRvbS52YWx1ZSB3aGVuIHVwZGF0aW5nIHRoZSB2YWx1ZX5+XG4gICAgaWYgKGF0dHJOYW1lID09PSAndmFsdWUnKSB7XG4gICAgICBkb20udmFsdWUgPSB2YWx1ZVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgLy8gcmVtb3ZlIG9yaWdpbmFsIGF0dHJpYnV0ZVxuICAgIHJlbUF0dHIoZG9tLCBhdHRyTmFtZSlcblxuICAgIC8vIGV2ZW50IGhhbmRsZXJcbiAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICAgIHNldEV2ZW50SGFuZGxlcihhdHRyTmFtZSwgdmFsdWUsIGRvbSwgdGFnKVxuXG4gICAgLy8gaWYtIGNvbmRpdGlvbmFsXG4gICAgfSBlbHNlIGlmIChhdHRyTmFtZSA9PSAnaWYnKSB7XG4gICAgICB2YXIgc3R1YiA9IGV4cHIuc3R1YixcbiAgICAgICAgYWRkID0gZnVuY3Rpb24oKSB7IGluc2VydFRvKHN0dWIucGFyZW50Tm9kZSwgc3R1YiwgZG9tKSB9LFxuICAgICAgICByZW1vdmUgPSBmdW5jdGlvbigpIHsgaW5zZXJ0VG8oZG9tLnBhcmVudE5vZGUsIGRvbSwgc3R1YikgfVxuXG4gICAgICAvLyBhZGQgdG8gRE9NXG4gICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgaWYgKHN0dWIpIHtcbiAgICAgICAgICBhZGQoKVxuICAgICAgICAgIGRvbS5pblN0dWIgPSBmYWxzZVxuICAgICAgICAgIC8vIGF2b2lkIHRvIHRyaWdnZXIgdGhlIG1vdW50IGV2ZW50IGlmIHRoZSB0YWdzIGlzIG5vdCB2aXNpYmxlIHlldFxuICAgICAgICAgIC8vIG1heWJlIHdlIGNhbiBvcHRpbWl6ZSB0aGlzIGF2b2lkaW5nIHRvIG1vdW50IHRoZSB0YWcgYXQgYWxsXG4gICAgICAgICAgaWYgKCFpc0luU3R1Yihkb20pKSB7XG4gICAgICAgICAgICB3YWxrKGRvbSwgZnVuY3Rpb24oZWwpIHtcbiAgICAgICAgICAgICAgaWYgKGVsLl90YWcgJiYgIWVsLl90YWcuaXNNb3VudGVkKVxuICAgICAgICAgICAgICAgIGVsLl90YWcuaXNNb3VudGVkID0gISFlbC5fdGFnLnRyaWdnZXIoJ21vdW50JylcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAvLyByZW1vdmUgZnJvbSBET01cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0dWIgPSBleHByLnN0dWIgPSBzdHViIHx8IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCcnKVxuICAgICAgICAvLyBpZiB0aGUgcGFyZW50Tm9kZSBpcyBkZWZpbmVkIHdlIGNhbiBlYXNpbHkgcmVwbGFjZSB0aGUgdGFnXG4gICAgICAgIGlmIChkb20ucGFyZW50Tm9kZSlcbiAgICAgICAgICByZW1vdmUoKVxuICAgICAgICAvLyBvdGhlcndpc2Ugd2UgbmVlZCB0byB3YWl0IHRoZSB1cGRhdGVkIGV2ZW50XG4gICAgICAgIGVsc2UgKHRhZy5wYXJlbnQgfHwgdGFnKS5vbmUoJ3VwZGF0ZWQnLCByZW1vdmUpXG5cbiAgICAgICAgZG9tLmluU3R1YiA9IHRydWVcbiAgICAgIH1cbiAgICAvLyBzaG93IC8gaGlkZVxuICAgIH0gZWxzZSBpZiAoYXR0ck5hbWUgPT09ICdzaG93Jykge1xuICAgICAgZG9tLnN0eWxlLmRpc3BsYXkgPSB2YWx1ZSA/ICcnIDogJ25vbmUnXG5cbiAgICB9IGVsc2UgaWYgKGF0dHJOYW1lID09PSAnaGlkZScpIHtcbiAgICAgIGRvbS5zdHlsZS5kaXNwbGF5ID0gdmFsdWUgPyAnbm9uZScgOiAnJ1xuXG4gICAgfSBlbHNlIGlmIChleHByLmJvb2wpIHtcbiAgICAgIGRvbVthdHRyTmFtZV0gPSB2YWx1ZVxuICAgICAgaWYgKHZhbHVlKSBzZXRBdHRyKGRvbSwgYXR0ck5hbWUsIGF0dHJOYW1lKVxuICAgICAgaWYgKEZJUkVGT1ggJiYgYXR0ck5hbWUgPT09ICdzZWxlY3RlZCcgJiYgZG9tLnRhZ05hbWUgPT09ICdPUFRJT04nKSB7XG4gICAgICAgIGRvbS5fX3Jpb3QxMzc0ID0gdmFsdWUgICAvLyAjMTM3NFxuICAgICAgfVxuXG4gICAgfSBlbHNlIGlmICh2YWx1ZSA9PT0gMCB8fCB2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgIT09IFRfT0JKRUNUKSB7XG4gICAgICAvLyA8aW1nIHNyYz1cInsgZXhwciB9XCI+XG4gICAgICBpZiAoc3RhcnRzV2l0aChhdHRyTmFtZSwgUklPVF9QUkVGSVgpICYmIGF0dHJOYW1lICE9IFJJT1RfVEFHKSB7XG4gICAgICAgIGF0dHJOYW1lID0gYXR0ck5hbWUuc2xpY2UoUklPVF9QUkVGSVgubGVuZ3RoKVxuICAgICAgfVxuICAgICAgc2V0QXR0cihkb20sIGF0dHJOYW1lLCB2YWx1ZSlcbiAgICB9XG5cbiAgfSlcblxufVxuLyoqXG4gKiBTcGVjaWFsaXplZCBmdW5jdGlvbiBmb3IgbG9vcGluZyBhbiBhcnJheS1saWtlIGNvbGxlY3Rpb24gd2l0aCBgZWFjaD17fWBcbiAqIEBwYXJhbSAgIHsgQXJyYXkgfSBlbHMgLSBjb2xsZWN0aW9uIG9mIGl0ZW1zXG4gKiBAcGFyYW0gICB7RnVuY3Rpb259IGZuIC0gY2FsbGJhY2sgZnVuY3Rpb25cbiAqIEByZXR1cm5zIHsgQXJyYXkgfSB0aGUgYXJyYXkgbG9vcGVkXG4gKi9cbmZ1bmN0aW9uIGVhY2goZWxzLCBmbikge1xuICB2YXIgbGVuID0gZWxzID8gZWxzLmxlbmd0aCA6IDBcblxuICBmb3IgKHZhciBpID0gMCwgZWw7IGkgPCBsZW47IGkrKykge1xuICAgIGVsID0gZWxzW2ldXG4gICAgLy8gcmV0dXJuIGZhbHNlIC0+IGN1cnJlbnQgaXRlbSB3YXMgcmVtb3ZlZCBieSBmbiBkdXJpbmcgdGhlIGxvb3BcbiAgICBpZiAoZWwgIT0gbnVsbCAmJiBmbihlbCwgaSkgPT09IGZhbHNlKSBpLS1cbiAgfVxuICByZXR1cm4gZWxzXG59XG5cbi8qKlxuICogRGV0ZWN0IGlmIHRoZSBhcmd1bWVudCBwYXNzZWQgaXMgYSBmdW5jdGlvblxuICogQHBhcmFtICAgeyAqIH0gdiAtIHdoYXRldmVyIHlvdSB3YW50IHRvIHBhc3MgdG8gdGhpcyBmdW5jdGlvblxuICogQHJldHVybnMgeyBCb29sZWFuIH0gLVxuICovXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKHYpIHtcbiAgcmV0dXJuIHR5cGVvZiB2ID09PSBUX0ZVTkNUSU9OIHx8IGZhbHNlICAgLy8gYXZvaWQgSUUgcHJvYmxlbXNcbn1cblxuLyoqXG4gKiBHZXQgdGhlIG91dGVyIGh0bWwgb2YgYW55IERPTSBub2RlIFNWR3MgaW5jbHVkZWRcbiAqIEBwYXJhbSAgIHsgT2JqZWN0IH0gZWwgLSBET00gbm9kZSB0byBwYXJzZVxuICogQHJldHVybnMgeyBTdHJpbmcgfSBlbC5vdXRlckhUTUxcbiAqL1xuZnVuY3Rpb24gZ2V0T3V0ZXJIVE1MKGVsKSB7XG4gIGlmIChlbC5vdXRlckhUTUwpIHJldHVybiBlbC5vdXRlckhUTUxcbiAgLy8gc29tZSBicm93c2VycyBkbyBub3Qgc3VwcG9ydCBvdXRlckhUTUwgb24gdGhlIFNWR3MgdGFnc1xuICBlbHNlIHtcbiAgICB2YXIgY29udGFpbmVyID0gbWtFbCgnZGl2JylcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoZWwuY2xvbmVOb2RlKHRydWUpKVxuICAgIHJldHVybiBjb250YWluZXIuaW5uZXJIVE1MXG4gIH1cbn1cblxuLyoqXG4gKiBTZXQgdGhlIGlubmVyIGh0bWwgb2YgYW55IERPTSBub2RlIFNWR3MgaW5jbHVkZWRcbiAqIEBwYXJhbSB7IE9iamVjdCB9IGNvbnRhaW5lciAtIERPTSBub2RlIHdoZXJlIHdlIHdpbGwgaW5qZWN0IHRoZSBuZXcgaHRtbFxuICogQHBhcmFtIHsgU3RyaW5nIH0gaHRtbCAtIGh0bWwgdG8gaW5qZWN0XG4gKi9cbmZ1bmN0aW9uIHNldElubmVySFRNTChjb250YWluZXIsIGh0bWwpIHtcbiAgaWYgKHR5cGVvZiBjb250YWluZXIuaW5uZXJIVE1MICE9IFRfVU5ERUYpIGNvbnRhaW5lci5pbm5lckhUTUwgPSBodG1sXG4gIC8vIHNvbWUgYnJvd3NlcnMgZG8gbm90IHN1cHBvcnQgaW5uZXJIVE1MIG9uIHRoZSBTVkdzIHRhZ3NcbiAgZWxzZSB7XG4gICAgdmFyIGRvYyA9IG5ldyBET01QYXJzZXIoKS5wYXJzZUZyb21TdHJpbmcoaHRtbCwgJ2FwcGxpY2F0aW9uL3htbCcpXG4gICAgY29udGFpbmVyLmFwcGVuZENoaWxkKFxuICAgICAgY29udGFpbmVyLm93bmVyRG9jdW1lbnQuaW1wb3J0Tm9kZShkb2MuZG9jdW1lbnRFbGVtZW50LCB0cnVlKVxuICAgIClcbiAgfVxufVxuXG4vKipcbiAqIENoZWNrcyB3ZXRoZXIgYSBET00gbm9kZSBtdXN0IGJlIGNvbnNpZGVyZWQgcGFydCBvZiBhbiBzdmcgZG9jdW1lbnRcbiAqIEBwYXJhbSAgIHsgU3RyaW5nIH0gIG5hbWUgLSB0YWcgbmFtZVxuICogQHJldHVybnMgeyBCb29sZWFuIH0gLVxuICovXG5mdW5jdGlvbiBpc1NWR1RhZyhuYW1lKSB7XG4gIHJldHVybiB+U1ZHX1RBR1NfTElTVC5pbmRleE9mKG5hbWUpXG59XG5cbi8qKlxuICogRGV0ZWN0IGlmIHRoZSBhcmd1bWVudCBwYXNzZWQgaXMgYW4gb2JqZWN0LCBleGNsdWRlIG51bGwuXG4gKiBOT1RFOiBVc2UgaXNPYmplY3QoeCkgJiYgIWlzQXJyYXkoeCkgdG8gZXhjbHVkZXMgYXJyYXlzLlxuICogQHBhcmFtICAgeyAqIH0gdiAtIHdoYXRldmVyIHlvdSB3YW50IHRvIHBhc3MgdG8gdGhpcyBmdW5jdGlvblxuICogQHJldHVybnMgeyBCb29sZWFuIH0gLVxuICovXG5mdW5jdGlvbiBpc09iamVjdCh2KSB7XG4gIHJldHVybiB2ICYmIHR5cGVvZiB2ID09PSBUX09CSkVDVCAgICAgICAgIC8vIHR5cGVvZiBudWxsIGlzICdvYmplY3QnXG59XG5cbi8qKlxuICogUmVtb3ZlIGFueSBET00gYXR0cmlidXRlIGZyb20gYSBub2RlXG4gKiBAcGFyYW0gICB7IE9iamVjdCB9IGRvbSAtIERPTSBub2RlIHdlIHdhbnQgdG8gdXBkYXRlXG4gKiBAcGFyYW0gICB7IFN0cmluZyB9IG5hbWUgLSBuYW1lIG9mIHRoZSBwcm9wZXJ0eSB3ZSB3YW50IHRvIHJlbW92ZVxuICovXG5mdW5jdGlvbiByZW1BdHRyKGRvbSwgbmFtZSkge1xuICBkb20ucmVtb3ZlQXR0cmlidXRlKG5hbWUpXG59XG5cbi8qKlxuICogQ29udmVydCBhIHN0cmluZyBjb250YWluaW5nIGRhc2hlcyB0byBjYW1lbCBjYXNlXG4gKiBAcGFyYW0gICB7IFN0cmluZyB9IHN0cmluZyAtIGlucHV0IHN0cmluZ1xuICogQHJldHVybnMgeyBTdHJpbmcgfSBteS1zdHJpbmcgLT4gbXlTdHJpbmdcbiAqL1xuZnVuY3Rpb24gdG9DYW1lbChzdHJpbmcpIHtcbiAgcmV0dXJuIHN0cmluZy5yZXBsYWNlKC8tKFxcdykvZywgZnVuY3Rpb24oXywgYykge1xuICAgIHJldHVybiBjLnRvVXBwZXJDYXNlKClcbiAgfSlcbn1cblxuLyoqXG4gKiBHZXQgdGhlIHZhbHVlIG9mIGFueSBET00gYXR0cmlidXRlIG9uIGEgbm9kZVxuICogQHBhcmFtICAgeyBPYmplY3QgfSBkb20gLSBET00gbm9kZSB3ZSB3YW50IHRvIHBhcnNlXG4gKiBAcGFyYW0gICB7IFN0cmluZyB9IG5hbWUgLSBuYW1lIG9mIHRoZSBhdHRyaWJ1dGUgd2Ugd2FudCB0byBnZXRcbiAqIEByZXR1cm5zIHsgU3RyaW5nIHwgdW5kZWZpbmVkIH0gbmFtZSBvZiB0aGUgbm9kZSBhdHRyaWJ1dGUgd2hldGhlciBpdCBleGlzdHNcbiAqL1xuZnVuY3Rpb24gZ2V0QXR0cihkb20sIG5hbWUpIHtcbiAgcmV0dXJuIGRvbS5nZXRBdHRyaWJ1dGUobmFtZSlcbn1cblxuLyoqXG4gKiBTZXQgYW55IERPTSBhdHRyaWJ1dGVcbiAqIEBwYXJhbSB7IE9iamVjdCB9IGRvbSAtIERPTSBub2RlIHdlIHdhbnQgdG8gdXBkYXRlXG4gKiBAcGFyYW0geyBTdHJpbmcgfSBuYW1lIC0gbmFtZSBvZiB0aGUgcHJvcGVydHkgd2Ugd2FudCB0byBzZXRcbiAqIEBwYXJhbSB7IFN0cmluZyB9IHZhbCAtIHZhbHVlIG9mIHRoZSBwcm9wZXJ0eSB3ZSB3YW50IHRvIHNldFxuICovXG5mdW5jdGlvbiBzZXRBdHRyKGRvbSwgbmFtZSwgdmFsKSB7XG4gIGRvbS5zZXRBdHRyaWJ1dGUobmFtZSwgdmFsKVxufVxuXG4vKipcbiAqIERldGVjdCB0aGUgdGFnIGltcGxlbWVudGF0aW9uIGJ5IGEgRE9NIG5vZGVcbiAqIEBwYXJhbSAgIHsgT2JqZWN0IH0gZG9tIC0gRE9NIG5vZGUgd2UgbmVlZCB0byBwYXJzZSB0byBnZXQgaXRzIHRhZyBpbXBsZW1lbnRhdGlvblxuICogQHJldHVybnMgeyBPYmplY3QgfSBpdCByZXR1cm5zIGFuIG9iamVjdCBjb250YWluaW5nIHRoZSBpbXBsZW1lbnRhdGlvbiBvZiBhIGN1c3RvbSB0YWcgKHRlbXBsYXRlIGFuZCBib290IGZ1bmN0aW9uKVxuICovXG5mdW5jdGlvbiBnZXRUYWcoZG9tKSB7XG4gIHJldHVybiBkb20udGFnTmFtZSAmJiBfX3RhZ0ltcGxbZ2V0QXR0cihkb20sIFJJT1RfVEFHX0lTKSB8fFxuICAgIGdldEF0dHIoZG9tLCBSSU9UX1RBRykgfHwgZG9tLnRhZ05hbWUudG9Mb3dlckNhc2UoKV1cbn1cbi8qKlxuICogQWRkIGEgY2hpbGQgdGFnIHRvIGl0cyBwYXJlbnQgaW50byB0aGUgYHRhZ3NgIG9iamVjdFxuICogQHBhcmFtICAgeyBPYmplY3QgfSB0YWcgLSBjaGlsZCB0YWcgaW5zdGFuY2VcbiAqIEBwYXJhbSAgIHsgU3RyaW5nIH0gdGFnTmFtZSAtIGtleSB3aGVyZSB0aGUgbmV3IHRhZyB3aWxsIGJlIHN0b3JlZFxuICogQHBhcmFtICAgeyBPYmplY3QgfSBwYXJlbnQgLSB0YWcgaW5zdGFuY2Ugd2hlcmUgdGhlIG5ldyBjaGlsZCB0YWcgd2lsbCBiZSBpbmNsdWRlZFxuICovXG5mdW5jdGlvbiBhZGRDaGlsZFRhZyh0YWcsIHRhZ05hbWUsIHBhcmVudCkge1xuICB2YXIgY2FjaGVkVGFnID0gcGFyZW50LnRhZ3NbdGFnTmFtZV1cblxuICAvLyBpZiB0aGVyZSBhcmUgbXVsdGlwbGUgY2hpbGRyZW4gdGFncyBoYXZpbmcgdGhlIHNhbWUgbmFtZVxuICBpZiAoY2FjaGVkVGFnKSB7XG4gICAgLy8gaWYgdGhlIHBhcmVudCB0YWdzIHByb3BlcnR5IGlzIG5vdCB5ZXQgYW4gYXJyYXlcbiAgICAvLyBjcmVhdGUgaXQgYWRkaW5nIHRoZSBmaXJzdCBjYWNoZWQgdGFnXG4gICAgaWYgKCFpc0FycmF5KGNhY2hlZFRhZykpXG4gICAgICAvLyBkb24ndCBhZGQgdGhlIHNhbWUgdGFnIHR3aWNlXG4gICAgICBpZiAoY2FjaGVkVGFnICE9PSB0YWcpXG4gICAgICAgIHBhcmVudC50YWdzW3RhZ05hbWVdID0gW2NhY2hlZFRhZ11cbiAgICAvLyBhZGQgdGhlIG5ldyBuZXN0ZWQgdGFnIHRvIHRoZSBhcnJheVxuICAgIGlmICghY29udGFpbnMocGFyZW50LnRhZ3NbdGFnTmFtZV0sIHRhZykpXG4gICAgICBwYXJlbnQudGFnc1t0YWdOYW1lXS5wdXNoKHRhZylcbiAgfSBlbHNlIHtcbiAgICBwYXJlbnQudGFnc1t0YWdOYW1lXSA9IHRhZ1xuICB9XG59XG5cbi8qKlxuICogTW92ZSB0aGUgcG9zaXRpb24gb2YgYSBjdXN0b20gdGFnIGluIGl0cyBwYXJlbnQgdGFnXG4gKiBAcGFyYW0gICB7IE9iamVjdCB9IHRhZyAtIGNoaWxkIHRhZyBpbnN0YW5jZVxuICogQHBhcmFtICAgeyBTdHJpbmcgfSB0YWdOYW1lIC0ga2V5IHdoZXJlIHRoZSB0YWcgd2FzIHN0b3JlZFxuICogQHBhcmFtICAgeyBOdW1iZXIgfSBuZXdQb3MgLSBpbmRleCB3aGVyZSB0aGUgbmV3IHRhZyB3aWxsIGJlIHN0b3JlZFxuICovXG5mdW5jdGlvbiBtb3ZlQ2hpbGRUYWcodGFnLCB0YWdOYW1lLCBuZXdQb3MpIHtcbiAgdmFyIHBhcmVudCA9IHRhZy5wYXJlbnQsXG4gICAgdGFnc1xuICAvLyBubyBwYXJlbnQgbm8gbW92ZVxuICBpZiAoIXBhcmVudCkgcmV0dXJuXG5cbiAgdGFncyA9IHBhcmVudC50YWdzW3RhZ05hbWVdXG5cbiAgaWYgKGlzQXJyYXkodGFncykpXG4gICAgdGFncy5zcGxpY2UobmV3UG9zLCAwLCB0YWdzLnNwbGljZSh0YWdzLmluZGV4T2YodGFnKSwgMSlbMF0pXG4gIGVsc2UgYWRkQ2hpbGRUYWcodGFnLCB0YWdOYW1lLCBwYXJlbnQpXG59XG5cbi8qKlxuICogQ3JlYXRlIGEgbmV3IGNoaWxkIHRhZyBpbmNsdWRpbmcgaXQgY29ycmVjdGx5IGludG8gaXRzIHBhcmVudFxuICogQHBhcmFtICAgeyBPYmplY3QgfSBjaGlsZCAtIGNoaWxkIHRhZyBpbXBsZW1lbnRhdGlvblxuICogQHBhcmFtICAgeyBPYmplY3QgfSBvcHRzIC0gdGFnIG9wdGlvbnMgY29udGFpbmluZyB0aGUgRE9NIG5vZGUgd2hlcmUgdGhlIHRhZyB3aWxsIGJlIG1vdW50ZWRcbiAqIEBwYXJhbSAgIHsgU3RyaW5nIH0gaW5uZXJIVE1MIC0gaW5uZXIgaHRtbCBvZiB0aGUgY2hpbGQgbm9kZVxuICogQHBhcmFtICAgeyBPYmplY3QgfSBwYXJlbnQgLSBpbnN0YW5jZSBvZiB0aGUgcGFyZW50IHRhZyBpbmNsdWRpbmcgdGhlIGNoaWxkIGN1c3RvbSB0YWdcbiAqIEByZXR1cm5zIHsgT2JqZWN0IH0gaW5zdGFuY2Ugb2YgdGhlIG5ldyBjaGlsZCB0YWcganVzdCBjcmVhdGVkXG4gKi9cbmZ1bmN0aW9uIGluaXRDaGlsZFRhZyhjaGlsZCwgb3B0cywgaW5uZXJIVE1MLCBwYXJlbnQpIHtcbiAgdmFyIHRhZyA9IG5ldyBUYWcoY2hpbGQsIG9wdHMsIGlubmVySFRNTCksXG4gICAgdGFnTmFtZSA9IGdldFRhZ05hbWUob3B0cy5yb290KSxcbiAgICBwdGFnID0gZ2V0SW1tZWRpYXRlQ3VzdG9tUGFyZW50VGFnKHBhcmVudClcbiAgLy8gZml4IGZvciB0aGUgcGFyZW50IGF0dHJpYnV0ZSBpbiB0aGUgbG9vcGVkIGVsZW1lbnRzXG4gIHRhZy5wYXJlbnQgPSBwdGFnXG4gIC8vIHN0b3JlIHRoZSByZWFsIHBhcmVudCB0YWdcbiAgLy8gaW4gc29tZSBjYXNlcyB0aGlzIGNvdWxkIGJlIGRpZmZlcmVudCBmcm9tIHRoZSBjdXN0b20gcGFyZW50IHRhZ1xuICAvLyBmb3IgZXhhbXBsZSBpbiBuZXN0ZWQgbG9vcHNcbiAgdGFnLl9wYXJlbnQgPSBwYXJlbnRcblxuICAvLyBhZGQgdGhpcyB0YWcgdG8gdGhlIGN1c3RvbSBwYXJlbnQgdGFnXG4gIGFkZENoaWxkVGFnKHRhZywgdGFnTmFtZSwgcHRhZylcbiAgLy8gYW5kIGFsc28gdG8gdGhlIHJlYWwgcGFyZW50IHRhZ1xuICBpZiAocHRhZyAhPT0gcGFyZW50KVxuICAgIGFkZENoaWxkVGFnKHRhZywgdGFnTmFtZSwgcGFyZW50KVxuICAvLyBlbXB0eSB0aGUgY2hpbGQgbm9kZSBvbmNlIHdlIGdvdCBpdHMgdGVtcGxhdGVcbiAgLy8gdG8gYXZvaWQgdGhhdCBpdHMgY2hpbGRyZW4gZ2V0IGNvbXBpbGVkIG11bHRpcGxlIHRpbWVzXG4gIG9wdHMucm9vdC5pbm5lckhUTUwgPSAnJ1xuXG4gIHJldHVybiB0YWdcbn1cblxuLyoqXG4gKiBMb29wIGJhY2t3YXJkIGFsbCB0aGUgcGFyZW50cyB0cmVlIHRvIGRldGVjdCB0aGUgZmlyc3QgY3VzdG9tIHBhcmVudCB0YWdcbiAqIEBwYXJhbSAgIHsgT2JqZWN0IH0gdGFnIC0gYSBUYWcgaW5zdGFuY2VcbiAqIEByZXR1cm5zIHsgT2JqZWN0IH0gdGhlIGluc3RhbmNlIG9mIHRoZSBmaXJzdCBjdXN0b20gcGFyZW50IHRhZyBmb3VuZFxuICovXG5mdW5jdGlvbiBnZXRJbW1lZGlhdGVDdXN0b21QYXJlbnRUYWcodGFnKSB7XG4gIHZhciBwdGFnID0gdGFnXG4gIHdoaWxlICghZ2V0VGFnKHB0YWcucm9vdCkpIHtcbiAgICBpZiAoIXB0YWcucGFyZW50KSBicmVha1xuICAgIHB0YWcgPSBwdGFnLnBhcmVudFxuICB9XG4gIHJldHVybiBwdGFnXG59XG5cbi8qKlxuICogSGVscGVyIGZ1bmN0aW9uIHRvIHNldCBhbiBpbW11dGFibGUgcHJvcGVydHlcbiAqIEBwYXJhbSAgIHsgT2JqZWN0IH0gZWwgLSBvYmplY3Qgd2hlcmUgdGhlIG5ldyBwcm9wZXJ0eSB3aWxsIGJlIHNldFxuICogQHBhcmFtICAgeyBTdHJpbmcgfSBrZXkgLSBvYmplY3Qga2V5IHdoZXJlIHRoZSBuZXcgcHJvcGVydHkgd2lsbCBiZSBzdG9yZWRcbiAqIEBwYXJhbSAgIHsgKiB9IHZhbHVlIC0gdmFsdWUgb2YgdGhlIG5ldyBwcm9wZXJ0eVxuKiBAcGFyYW0gICB7IE9iamVjdCB9IG9wdGlvbnMgLSBzZXQgdGhlIHByb3Blcnkgb3ZlcnJpZGluZyB0aGUgZGVmYXVsdCBvcHRpb25zXG4gKiBAcmV0dXJucyB7IE9iamVjdCB9IC0gdGhlIGluaXRpYWwgb2JqZWN0XG4gKi9cbmZ1bmN0aW9uIGRlZmluZVByb3BlcnR5KGVsLCBrZXksIHZhbHVlLCBvcHRpb25zKSB7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlbCwga2V5LCBleHRlbmQoe1xuICAgIHZhbHVlOiB2YWx1ZSxcbiAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgY29uZmlndXJhYmxlOiB0cnVlXG4gIH0sIG9wdGlvbnMpKVxuICByZXR1cm4gZWxcbn1cblxuLyoqXG4gKiBHZXQgdGhlIHRhZyBuYW1lIG9mIGFueSBET00gbm9kZVxuICogQHBhcmFtICAgeyBPYmplY3QgfSBkb20gLSBET00gbm9kZSB3ZSB3YW50IHRvIHBhcnNlXG4gKiBAcmV0dXJucyB7IFN0cmluZyB9IG5hbWUgdG8gaWRlbnRpZnkgdGhpcyBkb20gbm9kZSBpbiByaW90XG4gKi9cbmZ1bmN0aW9uIGdldFRhZ05hbWUoZG9tKSB7XG4gIHZhciBjaGlsZCA9IGdldFRhZyhkb20pLFxuICAgIG5hbWVkVGFnID0gZ2V0QXR0cihkb20sICduYW1lJyksXG4gICAgdGFnTmFtZSA9IG5hbWVkVGFnICYmICF0bXBsLmhhc0V4cHIobmFtZWRUYWcpID9cbiAgICAgICAgICAgICAgICBuYW1lZFRhZyA6XG4gICAgICAgICAgICAgIGNoaWxkID8gY2hpbGQubmFtZSA6IGRvbS50YWdOYW1lLnRvTG93ZXJDYXNlKClcblxuICByZXR1cm4gdGFnTmFtZVxufVxuXG4vKipcbiAqIEV4dGVuZCBhbnkgb2JqZWN0IHdpdGggb3RoZXIgcHJvcGVydGllc1xuICogQHBhcmFtICAgeyBPYmplY3QgfSBzcmMgLSBzb3VyY2Ugb2JqZWN0XG4gKiBAcmV0dXJucyB7IE9iamVjdCB9IHRoZSByZXN1bHRpbmcgZXh0ZW5kZWQgb2JqZWN0XG4gKlxuICogdmFyIG9iaiA9IHsgZm9vOiAnYmF6JyB9XG4gKiBleHRlbmQob2JqLCB7YmFyOiAnYmFyJywgZm9vOiAnYmFyJ30pXG4gKiBjb25zb2xlLmxvZyhvYmopID0+IHtiYXI6ICdiYXInLCBmb286ICdiYXInfVxuICpcbiAqL1xuZnVuY3Rpb24gZXh0ZW5kKHNyYykge1xuICB2YXIgb2JqLCBhcmdzID0gYXJndW1lbnRzXG4gIGZvciAodmFyIGkgPSAxOyBpIDwgYXJncy5sZW5ndGg7ICsraSkge1xuICAgIGlmIChvYmogPSBhcmdzW2ldKSB7XG4gICAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgICAgIC8vIGNoZWNrIGlmIHRoaXMgcHJvcGVydHkgb2YgdGhlIHNvdXJjZSBvYmplY3QgY291bGQgYmUgb3ZlcnJpZGRlblxuICAgICAgICBpZiAoaXNXcml0YWJsZShzcmMsIGtleSkpXG4gICAgICAgICAgc3JjW2tleV0gPSBvYmpba2V5XVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gc3JjXG59XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciBhbiBhcnJheSBjb250YWlucyBhbiBpdGVtXG4gKiBAcGFyYW0gICB7IEFycmF5IH0gYXJyIC0gdGFyZ2V0IGFycmF5XG4gKiBAcGFyYW0gICB7ICogfSBpdGVtIC0gaXRlbSB0byB0ZXN0XG4gKiBAcmV0dXJucyB7IEJvb2xlYW4gfSBEb2VzICdhcnInIGNvbnRhaW4gJ2l0ZW0nP1xuICovXG5mdW5jdGlvbiBjb250YWlucyhhcnIsIGl0ZW0pIHtcbiAgcmV0dXJuIH5hcnIuaW5kZXhPZihpdGVtKVxufVxuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgYW4gb2JqZWN0IGlzIGEga2luZCBvZiBhcnJheVxuICogQHBhcmFtICAgeyAqIH0gYSAtIGFueXRoaW5nXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn0gaXMgJ2EnIGFuIGFycmF5P1xuICovXG5mdW5jdGlvbiBpc0FycmF5KGEpIHsgcmV0dXJuIEFycmF5LmlzQXJyYXkoYSkgfHwgYSBpbnN0YW5jZW9mIEFycmF5IH1cblxuLyoqXG4gKiBEZXRlY3Qgd2hldGhlciBhIHByb3BlcnR5IG9mIGFuIG9iamVjdCBjb3VsZCBiZSBvdmVycmlkZGVuXG4gKiBAcGFyYW0gICB7IE9iamVjdCB9ICBvYmogLSBzb3VyY2Ugb2JqZWN0XG4gKiBAcGFyYW0gICB7IFN0cmluZyB9ICBrZXkgLSBvYmplY3QgcHJvcGVydHlcbiAqIEByZXR1cm5zIHsgQm9vbGVhbiB9IGlzIHRoaXMgcHJvcGVydHkgd3JpdGFibGU/XG4gKi9cbmZ1bmN0aW9uIGlzV3JpdGFibGUob2JqLCBrZXkpIHtcbiAgdmFyIHByb3BzID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihvYmosIGtleSlcbiAgcmV0dXJuIHR5cGVvZiBvYmpba2V5XSA9PT0gVF9VTkRFRiB8fCBwcm9wcyAmJiBwcm9wcy53cml0YWJsZVxufVxuXG5cbi8qKlxuICogV2l0aCB0aGlzIGZ1bmN0aW9uIHdlIGF2b2lkIHRoYXQgdGhlIGludGVybmFsIFRhZyBtZXRob2RzIGdldCBvdmVycmlkZGVuXG4gKiBAcGFyYW0gICB7IE9iamVjdCB9IGRhdGEgLSBvcHRpb25zIHdlIHdhbnQgdG8gdXNlIHRvIGV4dGVuZCB0aGUgdGFnIGluc3RhbmNlXG4gKiBAcmV0dXJucyB7IE9iamVjdCB9IGNsZWFuIG9iamVjdCB3aXRob3V0IGNvbnRhaW5pbmcgdGhlIHJpb3QgaW50ZXJuYWwgcmVzZXJ2ZWQgd29yZHNcbiAqL1xuZnVuY3Rpb24gY2xlYW5VcERhdGEoZGF0YSkge1xuICBpZiAoIShkYXRhIGluc3RhbmNlb2YgVGFnKSAmJiAhKGRhdGEgJiYgdHlwZW9mIGRhdGEudHJpZ2dlciA9PSBUX0ZVTkNUSU9OKSlcbiAgICByZXR1cm4gZGF0YVxuXG4gIHZhciBvID0ge31cbiAgZm9yICh2YXIga2V5IGluIGRhdGEpIHtcbiAgICBpZiAoIVJFU0VSVkVEX1dPUkRTX0JMQUNLTElTVC50ZXN0KGtleSkpIG9ba2V5XSA9IGRhdGFba2V5XVxuICB9XG4gIHJldHVybiBvXG59XG5cbi8qKlxuICogV2FsayBkb3duIHJlY3Vyc2l2ZWx5IGFsbCB0aGUgY2hpbGRyZW4gdGFncyBzdGFydGluZyBkb20gbm9kZVxuICogQHBhcmFtICAgeyBPYmplY3QgfSAgIGRvbSAtIHN0YXJ0aW5nIG5vZGUgd2hlcmUgd2Ugd2lsbCBzdGFydCB0aGUgcmVjdXJzaW9uXG4gKiBAcGFyYW0gICB7IEZ1bmN0aW9uIH0gZm4gLSBjYWxsYmFjayB0byB0cmFuc2Zvcm0gdGhlIGNoaWxkIG5vZGUganVzdCBmb3VuZFxuICovXG5mdW5jdGlvbiB3YWxrKGRvbSwgZm4pIHtcbiAgaWYgKGRvbSkge1xuICAgIC8vIHN0b3AgdGhlIHJlY3Vyc2lvblxuICAgIGlmIChmbihkb20pID09PSBmYWxzZSkgcmV0dXJuXG4gICAgZWxzZSB7XG4gICAgICBkb20gPSBkb20uZmlyc3RDaGlsZFxuXG4gICAgICB3aGlsZSAoZG9tKSB7XG4gICAgICAgIHdhbGsoZG9tLCBmbilcbiAgICAgICAgZG9tID0gZG9tLm5leHRTaWJsaW5nXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogTWluaW1pemUgcmlzazogb25seSB6ZXJvIG9yIG9uZSBfc3BhY2VfIGJldHdlZW4gYXR0ciAmIHZhbHVlXG4gKiBAcGFyYW0gICB7IFN0cmluZyB9ICAgaHRtbCAtIGh0bWwgc3RyaW5nIHdlIHdhbnQgdG8gcGFyc2VcbiAqIEBwYXJhbSAgIHsgRnVuY3Rpb24gfSBmbiAtIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGFwcGx5IG9uIGFueSBhdHRyaWJ1dGUgZm91bmRcbiAqL1xuZnVuY3Rpb24gd2Fsa0F0dHJpYnV0ZXMoaHRtbCwgZm4pIHtcbiAgdmFyIG0sXG4gICAgcmUgPSAvKFstXFx3XSspID89ID8oPzpcIihbXlwiXSopfCcoW14nXSopfCh7W159XSp9KSkvZ1xuXG4gIHdoaWxlIChtID0gcmUuZXhlYyhodG1sKSkge1xuICAgIGZuKG1bMV0udG9Mb3dlckNhc2UoKSwgbVsyXSB8fCBtWzNdIHx8IG1bNF0pXG4gIH1cbn1cblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIGEgRE9NIG5vZGUgaXMgaW4gc3R1YiBtb2RlLCB1c2VmdWwgZm9yIHRoZSByaW90ICdpZicgZGlyZWN0aXZlXG4gKiBAcGFyYW0gICB7IE9iamVjdCB9ICBkb20gLSBET00gbm9kZSB3ZSB3YW50IHRvIHBhcnNlXG4gKiBAcmV0dXJucyB7IEJvb2xlYW4gfSAtXG4gKi9cbmZ1bmN0aW9uIGlzSW5TdHViKGRvbSkge1xuICB3aGlsZSAoZG9tKSB7XG4gICAgaWYgKGRvbS5pblN0dWIpIHJldHVybiB0cnVlXG4gICAgZG9tID0gZG9tLnBhcmVudE5vZGVcbiAgfVxuICByZXR1cm4gZmFsc2Vcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBnZW5lcmljIERPTSBub2RlXG4gKiBAcGFyYW0gICB7IFN0cmluZyB9IG5hbWUgLSBuYW1lIG9mIHRoZSBET00gbm9kZSB3ZSB3YW50IHRvIGNyZWF0ZVxuICogQHBhcmFtICAgeyBCb29sZWFuIH0gaXNTdmcgLSBzaG91bGQgd2UgdXNlIGEgU1ZHIGFzIHBhcmVudCBub2RlP1xuICogQHJldHVybnMgeyBPYmplY3QgfSBET00gbm9kZSBqdXN0IGNyZWF0ZWRcbiAqL1xuZnVuY3Rpb24gbWtFbChuYW1lLCBpc1N2Zykge1xuICByZXR1cm4gaXNTdmcgP1xuICAgIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUygnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLCAnc3ZnJykgOlxuICAgIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobmFtZSlcbn1cblxuLyoqXG4gKiBTaG9ydGVyIGFuZCBmYXN0IHdheSB0byBzZWxlY3QgbXVsdGlwbGUgbm9kZXMgaW4gdGhlIERPTVxuICogQHBhcmFtICAgeyBTdHJpbmcgfSBzZWxlY3RvciAtIERPTSBzZWxlY3RvclxuICogQHBhcmFtICAgeyBPYmplY3QgfSBjdHggLSBET00gbm9kZSB3aGVyZSB0aGUgdGFyZ2V0cyBvZiBvdXIgc2VhcmNoIHdpbGwgaXMgbG9jYXRlZFxuICogQHJldHVybnMgeyBPYmplY3QgfSBkb20gbm9kZXMgZm91bmRcbiAqL1xuZnVuY3Rpb24gJCQoc2VsZWN0b3IsIGN0eCkge1xuICByZXR1cm4gKGN0eCB8fCBkb2N1bWVudCkucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvcilcbn1cblxuLyoqXG4gKiBTaG9ydGVyIGFuZCBmYXN0IHdheSB0byBzZWxlY3QgYSBzaW5nbGUgbm9kZSBpbiB0aGUgRE9NXG4gKiBAcGFyYW0gICB7IFN0cmluZyB9IHNlbGVjdG9yIC0gdW5pcXVlIGRvbSBzZWxlY3RvclxuICogQHBhcmFtICAgeyBPYmplY3QgfSBjdHggLSBET00gbm9kZSB3aGVyZSB0aGUgdGFyZ2V0IG9mIG91ciBzZWFyY2ggd2lsbCBpcyBsb2NhdGVkXG4gKiBAcmV0dXJucyB7IE9iamVjdCB9IGRvbSBub2RlIGZvdW5kXG4gKi9cbmZ1bmN0aW9uICQoc2VsZWN0b3IsIGN0eCkge1xuICByZXR1cm4gKGN0eCB8fCBkb2N1bWVudCkucXVlcnlTZWxlY3RvcihzZWxlY3Rvcilcbn1cblxuLyoqXG4gKiBTaW1wbGUgb2JqZWN0IHByb3RvdHlwYWwgaW5oZXJpdGFuY2VcbiAqIEBwYXJhbSAgIHsgT2JqZWN0IH0gcGFyZW50IC0gcGFyZW50IG9iamVjdFxuICogQHJldHVybnMgeyBPYmplY3QgfSBjaGlsZCBpbnN0YW5jZVxuICovXG5mdW5jdGlvbiBpbmhlcml0KHBhcmVudCkge1xuICBmdW5jdGlvbiBDaGlsZCgpIHt9XG4gIENoaWxkLnByb3RvdHlwZSA9IHBhcmVudFxuICByZXR1cm4gbmV3IENoaWxkKClcbn1cblxuLyoqXG4gKiBHZXQgdGhlIG5hbWUgcHJvcGVydHkgbmVlZGVkIHRvIGlkZW50aWZ5IGEgRE9NIG5vZGUgaW4gcmlvdFxuICogQHBhcmFtICAgeyBPYmplY3QgfSBkb20gLSBET00gbm9kZSB3ZSBuZWVkIHRvIHBhcnNlXG4gKiBAcmV0dXJucyB7IFN0cmluZyB8IHVuZGVmaW5lZCB9IGdpdmUgdXMgYmFjayBhIHN0cmluZyB0byBpZGVudGlmeSB0aGlzIGRvbSBub2RlXG4gKi9cbmZ1bmN0aW9uIGdldE5hbWVkS2V5KGRvbSkge1xuICByZXR1cm4gZ2V0QXR0cihkb20sICdpZCcpIHx8IGdldEF0dHIoZG9tLCAnbmFtZScpXG59XG5cbi8qKlxuICogU2V0IHRoZSBuYW1lZCBwcm9wZXJ0aWVzIG9mIGEgdGFnIGVsZW1lbnRcbiAqIEBwYXJhbSB7IE9iamVjdCB9IGRvbSAtIERPTSBub2RlIHdlIG5lZWQgdG8gcGFyc2VcbiAqIEBwYXJhbSB7IE9iamVjdCB9IHBhcmVudCAtIHRhZyBpbnN0YW5jZSB3aGVyZSB0aGUgbmFtZWQgZG9tIGVsZW1lbnQgd2lsbCBiZSBldmVudHVhbGx5IGFkZGVkXG4gKiBAcGFyYW0geyBBcnJheSB9IGtleXMgLSBsaXN0IG9mIGFsbCB0aGUgdGFnIGluc3RhbmNlIHByb3BlcnRpZXNcbiAqL1xuZnVuY3Rpb24gc2V0TmFtZWQoZG9tLCBwYXJlbnQsIGtleXMpIHtcbiAgLy8gZ2V0IHRoZSBrZXkgdmFsdWUgd2Ugd2FudCB0byBhZGQgdG8gdGhlIHRhZyBpbnN0YW5jZVxuICB2YXIga2V5ID0gZ2V0TmFtZWRLZXkoZG9tKSxcbiAgICBpc0FycixcbiAgICAvLyBhZGQgdGhlIG5vZGUgZGV0ZWN0ZWQgdG8gYSB0YWcgaW5zdGFuY2UgdXNpbmcgdGhlIG5hbWVkIHByb3BlcnR5XG4gICAgYWRkID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIC8vIGF2b2lkIHRvIG92ZXJyaWRlIHRoZSB0YWcgcHJvcGVydGllcyBhbHJlYWR5IHNldFxuICAgICAgaWYgKGNvbnRhaW5zKGtleXMsIGtleSkpIHJldHVyblxuICAgICAgLy8gY2hlY2sgd2hldGhlciB0aGlzIHZhbHVlIGlzIGFuIGFycmF5XG4gICAgICBpc0FyciA9IGlzQXJyYXkodmFsdWUpXG4gICAgICAvLyBpZiB0aGUga2V5IHdhcyBuZXZlciBzZXRcbiAgICAgIGlmICghdmFsdWUpXG4gICAgICAgIC8vIHNldCBpdCBvbmNlIG9uIHRoZSB0YWcgaW5zdGFuY2VcbiAgICAgICAgcGFyZW50W2tleV0gPSBkb21cbiAgICAgIC8vIGlmIGl0IHdhcyBhbiBhcnJheSBhbmQgbm90IHlldCBzZXRcbiAgICAgIGVsc2UgaWYgKCFpc0FyciB8fCBpc0FyciAmJiAhY29udGFpbnModmFsdWUsIGRvbSkpIHtcbiAgICAgICAgLy8gYWRkIHRoZSBkb20gbm9kZSBpbnRvIHRoZSBhcnJheVxuICAgICAgICBpZiAoaXNBcnIpXG4gICAgICAgICAgdmFsdWUucHVzaChkb20pXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBwYXJlbnRba2V5XSA9IFt2YWx1ZSwgZG9tXVxuICAgICAgfVxuICAgIH1cblxuICAvLyBza2lwIHRoZSBlbGVtZW50cyB3aXRoIG5vIG5hbWVkIHByb3BlcnRpZXNcbiAgaWYgKCFrZXkpIHJldHVyblxuXG4gIC8vIGNoZWNrIHdoZXRoZXIgdGhpcyBrZXkgaGFzIGJlZW4gYWxyZWFkeSBldmFsdWF0ZWRcbiAgaWYgKHRtcGwuaGFzRXhwcihrZXkpKVxuICAgIC8vIHdhaXQgdGhlIGZpcnN0IHVwZGF0ZWQgZXZlbnQgb25seSBvbmNlXG4gICAgcGFyZW50Lm9uZSgnbW91bnQnLCBmdW5jdGlvbigpIHtcbiAgICAgIGtleSA9IGdldE5hbWVkS2V5KGRvbSlcbiAgICAgIGFkZChwYXJlbnRba2V5XSlcbiAgICB9KVxuICBlbHNlXG4gICAgYWRkKHBhcmVudFtrZXldKVxuXG59XG5cbi8qKlxuICogRmFzdGVyIFN0cmluZyBzdGFydHNXaXRoIGFsdGVybmF0aXZlXG4gKiBAcGFyYW0gICB7IFN0cmluZyB9IHNyYyAtIHNvdXJjZSBzdHJpbmdcbiAqIEBwYXJhbSAgIHsgU3RyaW5nIH0gc3RyIC0gdGVzdCBzdHJpbmdcbiAqIEByZXR1cm5zIHsgQm9vbGVhbiB9IC1cbiAqL1xuZnVuY3Rpb24gc3RhcnRzV2l0aChzcmMsIHN0cikge1xuICByZXR1cm4gc3JjLnNsaWNlKDAsIHN0ci5sZW5ndGgpID09PSBzdHJcbn1cblxuLyoqXG4gKiByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgZnVuY3Rpb25cbiAqIEFkYXB0ZWQgZnJvbSBodHRwczovL2dpc3QuZ2l0aHViLmNvbS9wYXVsaXJpc2gvMTU3OTY3MSwgbGljZW5zZSBNSVRcbiAqL1xudmFyIHJBRiA9IChmdW5jdGlvbiAodykge1xuICB2YXIgcmFmID0gdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgICAgfHxcbiAgICAgICAgICAgIHcubW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8IHcud2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lXG5cbiAgaWYgKCFyYWYgfHwgL2lQKGFkfGhvbmV8b2QpLipPUyA2Ly50ZXN0KHcubmF2aWdhdG9yLnVzZXJBZ2VudCkpIHsgIC8vIGJ1Z2d5IGlPUzZcbiAgICB2YXIgbGFzdFRpbWUgPSAwXG5cbiAgICByYWYgPSBmdW5jdGlvbiAoY2IpIHtcbiAgICAgIHZhciBub3d0aW1lID0gRGF0ZS5ub3coKSwgdGltZW91dCA9IE1hdGgubWF4KDE2IC0gKG5vd3RpbWUgLSBsYXN0VGltZSksIDApXG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHsgY2IobGFzdFRpbWUgPSBub3d0aW1lICsgdGltZW91dCkgfSwgdGltZW91dClcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJhZlxuXG59KSh3aW5kb3cgfHwge30pXG5cbi8qKlxuICogTW91bnQgYSB0YWcgY3JlYXRpbmcgbmV3IFRhZyBpbnN0YW5jZVxuICogQHBhcmFtICAgeyBPYmplY3QgfSByb290IC0gZG9tIG5vZGUgd2hlcmUgdGhlIHRhZyB3aWxsIGJlIG1vdW50ZWRcbiAqIEBwYXJhbSAgIHsgU3RyaW5nIH0gdGFnTmFtZSAtIG5hbWUgb2YgdGhlIHJpb3QgdGFnIHdlIHdhbnQgdG8gbW91bnRcbiAqIEBwYXJhbSAgIHsgT2JqZWN0IH0gb3B0cyAtIG9wdGlvbnMgdG8gcGFzcyB0byB0aGUgVGFnIGluc3RhbmNlXG4gKiBAcmV0dXJucyB7IFRhZyB9IGEgbmV3IFRhZyBpbnN0YW5jZVxuICovXG5mdW5jdGlvbiBtb3VudFRvKHJvb3QsIHRhZ05hbWUsIG9wdHMpIHtcbiAgdmFyIHRhZyA9IF9fdGFnSW1wbFt0YWdOYW1lXSxcbiAgICAvLyBjYWNoZSB0aGUgaW5uZXIgSFRNTCB0byBmaXggIzg1NVxuICAgIGlubmVySFRNTCA9IHJvb3QuX2lubmVySFRNTCA9IHJvb3QuX2lubmVySFRNTCB8fCByb290LmlubmVySFRNTFxuXG4gIC8vIGNsZWFyIHRoZSBpbm5lciBodG1sXG4gIHJvb3QuaW5uZXJIVE1MID0gJydcblxuICBpZiAodGFnICYmIHJvb3QpIHRhZyA9IG5ldyBUYWcodGFnLCB7IHJvb3Q6IHJvb3QsIG9wdHM6IG9wdHMgfSwgaW5uZXJIVE1MKVxuXG4gIGlmICh0YWcgJiYgdGFnLm1vdW50KSB7XG4gICAgdGFnLm1vdW50KClcbiAgICAvLyBhZGQgdGhpcyB0YWcgdG8gdGhlIHZpcnR1YWxEb20gdmFyaWFibGVcbiAgICBpZiAoIWNvbnRhaW5zKF9fdmlydHVhbERvbSwgdGFnKSkgX192aXJ0dWFsRG9tLnB1c2godGFnKVxuICB9XG5cbiAgcmV0dXJuIHRhZ1xufVxuLyoqXG4gKiBSaW90IHB1YmxpYyBhcGlcbiAqL1xuXG4vLyBzaGFyZSBtZXRob2RzIGZvciBvdGhlciByaW90IHBhcnRzLCBlLmcuIGNvbXBpbGVyXG5yaW90LnV0aWwgPSB7IGJyYWNrZXRzOiBicmFja2V0cywgdG1wbDogdG1wbCB9XG5cbi8qKlxuICogQ3JlYXRlIGEgbWl4aW4gdGhhdCBjb3VsZCBiZSBnbG9iYWxseSBzaGFyZWQgYWNyb3NzIGFsbCB0aGUgdGFnc1xuICovXG5yaW90Lm1peGluID0gKGZ1bmN0aW9uKCkge1xuICB2YXIgbWl4aW5zID0ge30sXG4gICAgZ2xvYmFscyA9IG1peGluc1tHTE9CQUxfTUlYSU5dID0ge30sXG4gICAgX2lkID0gMFxuXG4gIC8qKlxuICAgKiBDcmVhdGUvUmV0dXJuIGEgbWl4aW4gYnkgaXRzIG5hbWVcbiAgICogQHBhcmFtICAgeyBTdHJpbmcgfSAgbmFtZSAtIG1peGluIG5hbWUgKGdsb2JhbCBtaXhpbiBpZiBvYmplY3QpXG4gICAqIEBwYXJhbSAgIHsgT2JqZWN0IH0gIG1peGluIC0gbWl4aW4gbG9naWNcbiAgICogQHBhcmFtICAgeyBCb29sZWFuIH0gZyAtIGlzIGdsb2JhbD9cbiAgICogQHJldHVybnMgeyBPYmplY3QgfSAgdGhlIG1peGluIGxvZ2ljXG4gICAqL1xuICByZXR1cm4gZnVuY3Rpb24obmFtZSwgbWl4aW4sIGcpIHtcbiAgICAvLyBVbm5hbWVkIGdsb2JhbFxuICAgIGlmIChpc09iamVjdChuYW1lKSkge1xuICAgICAgcmlvdC5taXhpbignX191bm5hbWVkXycrX2lkKyssIG5hbWUsIHRydWUpXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICB2YXIgc3RvcmUgPSBnID8gZ2xvYmFscyA6IG1peGluc1xuXG4gICAgLy8gR2V0dGVyXG4gICAgaWYgKCFtaXhpbikge1xuICAgICAgaWYgKHR5cGVvZiBzdG9yZVtuYW1lXSA9PT0gVF9VTkRFRikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VucmVnaXN0ZXJlZCBtaXhpbjogJyArIG5hbWUpXG4gICAgICB9XG4gICAgICByZXR1cm4gc3RvcmVbbmFtZV1cbiAgICB9XG4gICAgLy8gU2V0dGVyXG4gICAgaWYgKGlzRnVuY3Rpb24obWl4aW4pKSB7XG4gICAgICBleHRlbmQobWl4aW4ucHJvdG90eXBlLCBzdG9yZVtuYW1lXSB8fCB7fSlcbiAgICAgIHN0b3JlW25hbWVdID0gbWl4aW5cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBzdG9yZVtuYW1lXSA9IGV4dGVuZChzdG9yZVtuYW1lXSB8fCB7fSwgbWl4aW4pXG4gICAgfVxuICB9XG5cbn0pKClcblxuLyoqXG4gKiBDcmVhdGUgYSBuZXcgcmlvdCB0YWcgaW1wbGVtZW50YXRpb25cbiAqIEBwYXJhbSAgIHsgU3RyaW5nIH0gICBuYW1lIC0gbmFtZS9pZCBvZiB0aGUgbmV3IHJpb3QgdGFnXG4gKiBAcGFyYW0gICB7IFN0cmluZyB9ICAgaHRtbCAtIHRhZyB0ZW1wbGF0ZVxuICogQHBhcmFtICAgeyBTdHJpbmcgfSAgIGNzcyAtIGN1c3RvbSB0YWcgY3NzXG4gKiBAcGFyYW0gICB7IFN0cmluZyB9ICAgYXR0cnMgLSByb290IHRhZyBhdHRyaWJ1dGVzXG4gKiBAcGFyYW0gICB7IEZ1bmN0aW9uIH0gZm4gLSB1c2VyIGZ1bmN0aW9uXG4gKiBAcmV0dXJucyB7IFN0cmluZyB9IG5hbWUvaWQgb2YgdGhlIHRhZyBqdXN0IGNyZWF0ZWRcbiAqL1xucmlvdC50YWcgPSBmdW5jdGlvbihuYW1lLCBodG1sLCBjc3MsIGF0dHJzLCBmbikge1xuICBpZiAoaXNGdW5jdGlvbihhdHRycykpIHtcbiAgICBmbiA9IGF0dHJzXG4gICAgaWYgKC9eW1xcd1xcLV0rXFxzPz0vLnRlc3QoY3NzKSkge1xuICAgICAgYXR0cnMgPSBjc3NcbiAgICAgIGNzcyA9ICcnXG4gICAgfSBlbHNlIGF0dHJzID0gJydcbiAgfVxuICBpZiAoY3NzKSB7XG4gICAgaWYgKGlzRnVuY3Rpb24oY3NzKSkgZm4gPSBjc3NcbiAgICBlbHNlIHN0eWxlTWFuYWdlci5hZGQoY3NzKVxuICB9XG4gIG5hbWUgPSBuYW1lLnRvTG93ZXJDYXNlKClcbiAgX190YWdJbXBsW25hbWVdID0geyBuYW1lOiBuYW1lLCB0bXBsOiBodG1sLCBhdHRyczogYXR0cnMsIGZuOiBmbiB9XG4gIHJldHVybiBuYW1lXG59XG5cbi8qKlxuICogQ3JlYXRlIGEgbmV3IHJpb3QgdGFnIGltcGxlbWVudGF0aW9uIChmb3IgdXNlIGJ5IHRoZSBjb21waWxlcilcbiAqIEBwYXJhbSAgIHsgU3RyaW5nIH0gICBuYW1lIC0gbmFtZS9pZCBvZiB0aGUgbmV3IHJpb3QgdGFnXG4gKiBAcGFyYW0gICB7IFN0cmluZyB9ICAgaHRtbCAtIHRhZyB0ZW1wbGF0ZVxuICogQHBhcmFtICAgeyBTdHJpbmcgfSAgIGNzcyAtIGN1c3RvbSB0YWcgY3NzXG4gKiBAcGFyYW0gICB7IFN0cmluZyB9ICAgYXR0cnMgLSByb290IHRhZyBhdHRyaWJ1dGVzXG4gKiBAcGFyYW0gICB7IEZ1bmN0aW9uIH0gZm4gLSB1c2VyIGZ1bmN0aW9uXG4gKiBAcmV0dXJucyB7IFN0cmluZyB9IG5hbWUvaWQgb2YgdGhlIHRhZyBqdXN0IGNyZWF0ZWRcbiAqL1xucmlvdC50YWcyID0gZnVuY3Rpb24obmFtZSwgaHRtbCwgY3NzLCBhdHRycywgZm4pIHtcbiAgaWYgKGNzcykgc3R5bGVNYW5hZ2VyLmFkZChjc3MpXG4gIC8vaWYgKGJwYWlyKSByaW90LnNldHRpbmdzLmJyYWNrZXRzID0gYnBhaXJcbiAgX190YWdJbXBsW25hbWVdID0geyBuYW1lOiBuYW1lLCB0bXBsOiBodG1sLCBhdHRyczogYXR0cnMsIGZuOiBmbiB9XG4gIHJldHVybiBuYW1lXG59XG5cbi8qKlxuICogTW91bnQgYSB0YWcgdXNpbmcgYSBzcGVjaWZpYyB0YWcgaW1wbGVtZW50YXRpb25cbiAqIEBwYXJhbSAgIHsgU3RyaW5nIH0gc2VsZWN0b3IgLSB0YWcgRE9NIHNlbGVjdG9yXG4gKiBAcGFyYW0gICB7IFN0cmluZyB9IHRhZ05hbWUgLSB0YWcgaW1wbGVtZW50YXRpb24gbmFtZVxuICogQHBhcmFtICAgeyBPYmplY3QgfSBvcHRzIC0gdGFnIGxvZ2ljXG4gKiBAcmV0dXJucyB7IEFycmF5IH0gbmV3IHRhZ3MgaW5zdGFuY2VzXG4gKi9cbnJpb3QubW91bnQgPSBmdW5jdGlvbihzZWxlY3RvciwgdGFnTmFtZSwgb3B0cykge1xuXG4gIHZhciBlbHMsXG4gICAgYWxsVGFncyxcbiAgICB0YWdzID0gW11cblxuICAvLyBoZWxwZXIgZnVuY3Rpb25zXG5cbiAgZnVuY3Rpb24gYWRkUmlvdFRhZ3MoYXJyKSB7XG4gICAgdmFyIGxpc3QgPSAnJ1xuICAgIGVhY2goYXJyLCBmdW5jdGlvbiAoZSkge1xuICAgICAgaWYgKCEvW14tXFx3XS8udGVzdChlKSkge1xuICAgICAgICBlID0gZS50cmltKCkudG9Mb3dlckNhc2UoKVxuICAgICAgICBsaXN0ICs9ICcsWycgKyBSSU9UX1RBR19JUyArICc9XCInICsgZSArICdcIl0sWycgKyBSSU9UX1RBRyArICc9XCInICsgZSArICdcIl0nXG4gICAgICB9XG4gICAgfSlcbiAgICByZXR1cm4gbGlzdFxuICB9XG5cbiAgZnVuY3Rpb24gc2VsZWN0QWxsVGFncygpIHtcbiAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKF9fdGFnSW1wbClcbiAgICByZXR1cm4ga2V5cyArIGFkZFJpb3RUYWdzKGtleXMpXG4gIH1cblxuICBmdW5jdGlvbiBwdXNoVGFncyhyb290KSB7XG4gICAgaWYgKHJvb3QudGFnTmFtZSkge1xuICAgICAgdmFyIHJpb3RUYWcgPSBnZXRBdHRyKHJvb3QsIFJJT1RfVEFHX0lTKSB8fCBnZXRBdHRyKHJvb3QsIFJJT1RfVEFHKVxuXG4gICAgICAvLyBoYXZlIHRhZ05hbWU/IGZvcmNlIHJpb3QtdGFnIHRvIGJlIHRoZSBzYW1lXG4gICAgICBpZiAodGFnTmFtZSAmJiByaW90VGFnICE9PSB0YWdOYW1lKSB7XG4gICAgICAgIHJpb3RUYWcgPSB0YWdOYW1lXG4gICAgICAgIHNldEF0dHIocm9vdCwgUklPVF9UQUdfSVMsIHRhZ05hbWUpXG4gICAgICAgIHNldEF0dHIocm9vdCwgUklPVF9UQUcsIHRhZ05hbWUpIC8vIHRoaXMgd2lsbCBiZSByZW1vdmVkIGluIHJpb3QgMy4wLjBcbiAgICAgIH1cbiAgICAgIHZhciB0YWcgPSBtb3VudFRvKHJvb3QsIHJpb3RUYWcgfHwgcm9vdC50YWdOYW1lLnRvTG93ZXJDYXNlKCksIG9wdHMpXG5cbiAgICAgIGlmICh0YWcpIHRhZ3MucHVzaCh0YWcpXG4gICAgfSBlbHNlIGlmIChyb290Lmxlbmd0aCkge1xuICAgICAgZWFjaChyb290LCBwdXNoVGFncykgICAvLyBhc3N1bWUgbm9kZUxpc3RcbiAgICB9XG4gIH1cblxuICAvLyAtLS0tLSBtb3VudCBjb2RlIC0tLS0tXG5cbiAgLy8gaW5qZWN0IHN0eWxlcyBpbnRvIERPTVxuICBzdHlsZU1hbmFnZXIuaW5qZWN0KClcblxuICBpZiAoaXNPYmplY3QodGFnTmFtZSkpIHtcbiAgICBvcHRzID0gdGFnTmFtZVxuICAgIHRhZ05hbWUgPSAwXG4gIH1cblxuICAvLyBjcmF3bCB0aGUgRE9NIHRvIGZpbmQgdGhlIHRhZ1xuICBpZiAodHlwZW9mIHNlbGVjdG9yID09PSBUX1NUUklORykge1xuICAgIGlmIChzZWxlY3RvciA9PT0gJyonKVxuICAgICAgLy8gc2VsZWN0IGFsbCB0aGUgdGFncyByZWdpc3RlcmVkXG4gICAgICAvLyBhbmQgYWxzbyB0aGUgdGFncyBmb3VuZCB3aXRoIHRoZSByaW90LXRhZyBhdHRyaWJ1dGUgc2V0XG4gICAgICBzZWxlY3RvciA9IGFsbFRhZ3MgPSBzZWxlY3RBbGxUYWdzKClcbiAgICBlbHNlXG4gICAgICAvLyBvciBqdXN0IHRoZSBvbmVzIG5hbWVkIGxpa2UgdGhlIHNlbGVjdG9yXG4gICAgICBzZWxlY3RvciArPSBhZGRSaW90VGFncyhzZWxlY3Rvci5zcGxpdCgvLCAqLykpXG5cbiAgICAvLyBtYWtlIHN1cmUgdG8gcGFzcyBhbHdheXMgYSBzZWxlY3RvclxuICAgIC8vIHRvIHRoZSBxdWVyeVNlbGVjdG9yQWxsIGZ1bmN0aW9uXG4gICAgZWxzID0gc2VsZWN0b3IgPyAkJChzZWxlY3RvcikgOiBbXVxuICB9XG4gIGVsc2VcbiAgICAvLyBwcm9iYWJseSB5b3UgaGF2ZSBwYXNzZWQgYWxyZWFkeSBhIHRhZyBvciBhIE5vZGVMaXN0XG4gICAgZWxzID0gc2VsZWN0b3JcblxuICAvLyBzZWxlY3QgYWxsIHRoZSByZWdpc3RlcmVkIGFuZCBtb3VudCB0aGVtIGluc2lkZSB0aGVpciByb290IGVsZW1lbnRzXG4gIGlmICh0YWdOYW1lID09PSAnKicpIHtcbiAgICAvLyBnZXQgYWxsIGN1c3RvbSB0YWdzXG4gICAgdGFnTmFtZSA9IGFsbFRhZ3MgfHwgc2VsZWN0QWxsVGFncygpXG4gICAgLy8gaWYgdGhlIHJvb3QgZWxzIGl0J3MganVzdCBhIHNpbmdsZSB0YWdcbiAgICBpZiAoZWxzLnRhZ05hbWUpXG4gICAgICBlbHMgPSAkJCh0YWdOYW1lLCBlbHMpXG4gICAgZWxzZSB7XG4gICAgICAvLyBzZWxlY3QgYWxsIHRoZSBjaGlsZHJlbiBmb3IgYWxsIHRoZSBkaWZmZXJlbnQgcm9vdCBlbGVtZW50c1xuICAgICAgdmFyIG5vZGVMaXN0ID0gW11cbiAgICAgIGVhY2goZWxzLCBmdW5jdGlvbiAoX2VsKSB7XG4gICAgICAgIG5vZGVMaXN0LnB1c2goJCQodGFnTmFtZSwgX2VsKSlcbiAgICAgIH0pXG4gICAgICBlbHMgPSBub2RlTGlzdFxuICAgIH1cbiAgICAvLyBnZXQgcmlkIG9mIHRoZSB0YWdOYW1lXG4gICAgdGFnTmFtZSA9IDBcbiAgfVxuXG4gIHB1c2hUYWdzKGVscylcblxuICByZXR1cm4gdGFnc1xufVxuXG4vKipcbiAqIFVwZGF0ZSBhbGwgdGhlIHRhZ3MgaW5zdGFuY2VzIGNyZWF0ZWRcbiAqIEByZXR1cm5zIHsgQXJyYXkgfSBhbGwgdGhlIHRhZ3MgaW5zdGFuY2VzXG4gKi9cbnJpb3QudXBkYXRlID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBlYWNoKF9fdmlydHVhbERvbSwgZnVuY3Rpb24odGFnKSB7XG4gICAgdGFnLnVwZGF0ZSgpXG4gIH0pXG59XG5cbi8qKlxuICogRXhwb3J0IHRoZSBWaXJ0dWFsIERPTVxuICovXG5yaW90LnZkb20gPSBfX3ZpcnR1YWxEb21cblxuLyoqXG4gKiBFeHBvcnQgdGhlIFRhZyBjb25zdHJ1Y3RvclxuICovXG5yaW90LlRhZyA9IFRhZ1xuICAvLyBzdXBwb3J0IENvbW1vbkpTLCBBTUQgJiBicm93c2VyXG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gVF9PQkpFQ1QpXG4gICAgbW9kdWxlLmV4cG9ydHMgPSByaW90XG4gIGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09IFRfRlVOQ1RJT04gJiYgdHlwZW9mIGRlZmluZS5hbWQgIT09IFRfVU5ERUYpXG4gICAgZGVmaW5lKGZ1bmN0aW9uKCkgeyByZXR1cm4gcmlvdCB9KVxuICBlbHNlXG4gICAgd2luZG93LnJpb3QgPSByaW90XG5cbn0pKHR5cGVvZiB3aW5kb3cgIT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cgOiB2b2lkIDApO1xuIl19
