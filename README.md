#Koe-UI

Koe-UI is an UI component made with Riot.js
This component offers your website an interface that we can talk with bot.

This is for bots made with MicrodoftBotFramework.

##Live Demo

https://okajax.github.io/Koe-UI/basicchat.html

(Japanese language bot)


##Dependencies

* Riot.js
* js-cookie
* jQuery


##ToDo

* using browserify, make simple


##Support Browser

* Chrome for Android: >= 50
* Android Browser: >= 4.4
* Chrome: >= 33
* Edge: >= 12
* Firefox: >= 29
* iOS Safari: >= 8
* Opera: >= 20
* Safari: >= 7.1


##Usage

Read script files.

```
<script src="https://rawgit.com/riot/riot/master/riot%2Bcompiler.min.js"></script>
<script src="https://code.jquery.com/jquery-1.12.4.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/js-cookie/2.1.2/js.cookie.min.js"></script>
<script src="./js/koeUIcore.js"></script>
<script src="./riot-tags/koe-ui-basicchat.html" type="riot/tag"></script>
<script>riot.mount('*');</script>
```


Then, put the custom tag on the place where you like.

```
<koe-ui-basicchat token="YOUR DIRECT LINE API SECRET KEY"></koe-ui-basicchat>
```
