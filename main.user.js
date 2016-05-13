// ==UserScript==
// @name         HN Hotkeys
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Adds hotkeys to Hacker News
// @author       russelldavis / DTrejo
// @match        https://news.ycombinator.com/*
// @require      https://code.jquery.com/jquery-1.4.2.min.js
// @grant        GM_addStyle
// @downloadURL  https://raw.githubusercontent.com/russelldavis/HN-Hotkeys-Userscript/master/main.user.js
// ==/UserScript==

GM_addStyle('.active { background-color: #E1F6C4; }');

//////////// jquery-hotkeys plugin ////////////

(function(jQuery){

  jQuery.hotkeys = {
    version: "0.8",

    specialKeys: {
      8: "backspace", 9: "tab", 13: "return", 16: "shift", 17: "ctrl", 18: "alt", 19: "pause",
      20: "capslock", 27: "esc", 32: "space", 33: "pageup", 34: "pagedown", 35: "end", 36: "home",
      37: "left", 38: "up", 39: "right", 40: "down", 45: "insert", 46: "del",
      96: "0", 97: "1", 98: "2", 99: "3", 100: "4", 101: "5", 102: "6", 103: "7",
      104: "8", 105: "9", 106: "*", 107: "+", 109: "-", 110: ".", 111 : "/",
      112: "f1", 113: "f2", 114: "f3", 115: "f4", 116: "f5", 117: "f6", 118: "f7", 119: "f8",
      120: "f9", 121: "f10", 122: "f11", 123: "f12", 144: "numlock", 145: "scroll", 191: "/", 224: "meta"
    },

    shiftNums: {
      "`": "~", "1": "!", "2": "@", "3": "#", "4": "$", "5": "%", "6": "^", "7": "&",
      "8": "*", "9": "(", "0": ")", "-": "_", "=": "+", ";": ": ", "'": "\"", ",": "<",
      ".": ">",  "/": "?",  "\\": "|"
    }
  };

  function keyHandler( handleObj ) {
    // Only care when a possible input has been specified
    if ( typeof handleObj.data !== "string" ) {
      return;
    }

    var origHandler = handleObj.handler,
      keys = handleObj.data.toLowerCase().split(" ");

    handleObj.handler = function( event ) {
      // Don't fire in text-accepting inputs that we didn't directly bind to
      if ( this !== event.target && (/textarea|select/i.test( event.target.nodeName ) ||
         event.target.type === "text") ) {
        return;
      }

      // Keypress represents characters, not special keys
      var special = event.type !== "keypress" && jQuery.hotkeys.specialKeys[ event.which ],
        character = String.fromCharCode( event.which ).toLowerCase(),
        key, modif = "", possible = {};

      // check combinations (alt|ctrl|shift+anything)
      if ( event.altKey && special !== "alt" ) {
        modif += "alt+";
      }

      if ( event.ctrlKey && special !== "ctrl" ) {
        modif += "ctrl+";
      }

      // TODO: Need to make sure this works consistently across platforms
      if ( event.metaKey && !event.ctrlKey && special !== "meta" ) {
        modif += "meta+";
      }

      if ( event.shiftKey && special !== "shift" ) {
        modif += "shift+";
      }

      if ( special ) {
        possible[ modif + special ] = true;

      } else {
        possible[ modif + character ] = true;
        possible[ modif + jQuery.hotkeys.shiftNums[ character ] ] = true;

        // "$" can be triggered as "Shift+4" or "Shift+$" or just "$"
        if ( modif === "shift+" ) {
          possible[ jQuery.hotkeys.shiftNums[ character ] ] = true;
        }
      }

      for ( var i = 0, l = keys.length; i < l; i++ ) {
        if ( possible[ keys[i] ] ) {
          return origHandler.apply( this, arguments );
        }
      }
    };
  }

  jQuery.each([ "keydown", "keyup", "keypress" ], function() {
    jQuery.event.special[ this ] = { add: keyHandler };
  });

})( jQuery );

//////////// end jquery-hotkeys plugin ////////////

function page(){
  return window.location.pathname;
}


function moveDown (selectables, cur) {
  cur = (cur + 1 > selectables.size() - 1) ? selectables.size() - 1 : cur + 1;
  select(selectables.eq(cur));
  return cur;
}


function moveUp (selectables, cur) {
  cur = (cur - 1 < 0) ? 0 : cur - 1;
  select(selectables.eq(cur));
  return cur;
}


// highlights the curth item of rows jquery object
// scrollToIt is an optional parameter. Defaults to true.
function select (row, scrollToIt) {
  scrollToIt = (typeof scrollToIt == 'undefined') ? true : scrollToIt;

  $('.active').removeClass('active');
  row.next().andSelf().addClass('active');

  // scroll to middle of screen, like google does.
  if(scrollToIt && !isScrolledIntoView(row)) {
    $('html, body').animate({scrollTop: row.offset().top - 0.5 * $(window).height() }, 0);
  }
}


// Returns true if on the viewer's screen
function isScrolledIntoView (el) {
  var docViewTop = $(window).scrollTop()
    , docViewBottom = docViewTop + $(window).height()

    , elemTop = el.offset().top
    , elemBottom = elemTop + el.height();

  return ((elemBottom >= docViewTop) && (elemTop <= docViewBottom)
    && (elemBottom <= docViewBottom) &&  (elemTop >= docViewTop) );
}

function getLink (titlerow, path) {
 // Items pages — when title is selected, opens the article
  if (path === '/item') {
    link = titlerow.find('.title a').first();
    return link;
  }

  // Comments link
  link = titlerow.next().find('a[href^=item]').first();
  if (link.length) return link;

  // Some items don't have a comments link - fall back to the title link
  link = titlerow.find('.title a').first()
  return link;
}


// Opens comment link in selected row in new tab
// If row only contains 'more' link, opens that in same tab
function openComments (titlerow) {
  var link
    , path = window.location.pathname
    , fullPath = path + window.location.search;

  // More link - open in same tab
  link = titlerow.find('a[href^=/x?], a[href^=news]').first();
  if (link.length) {
    location.href = link.attr('href');
    return;
  }

  link = getLink(titlerow, path);

  // Don't open a link to the current page
  if (link.length && "/" + link.attr('href') != fullPath) {
    window.open(link.attr('href'), "_blank");
    console.log('tried to open: ' + link.text());
  }
}


// Clicks reply link or focuses textarea if title is selected.
function reply (row) {
  var link = row.find('a[href^=reply]:visible')
                .last() // won't choose one entered by commenter
    , textarea = row.parent().find('textarea[name=text]')
                             .first();

  if (link.size() === 1) {
    window.location = link.attr('href');
    console.log(link);

  // focus reply box when title link selected on comment page
  } else if (textarea.size() === 1) {
    textarea.bind('keydown', 'esc', function() { textarea.blur(); });
    textarea.parent().bind('keydown', 'return', function(e) { e.stopPropagation(); });

    textarea.size() === 1 && textarea.focus();
    console.log(textarea);
  }
}

function upvote (commentrow) {
  var link = commentrow.find('a[href*=dir=up]:visible').first();
  link && link.click();
  console.log(link.attr('href'));
}

function downvote (commentrow) {
  var link = commentrow.find('a[href*=dir=down]:visible').first();
  link && link.click();
  console.log(link.attr('href'));
}

// Handle them keypresses!
$(document).ready(function(){
  // Add support for other styles
  var style = 'gmail'
  , cur = 0 // current item
  , titletables = $('table:eq(2) tr:has(.title)') // any titles present on page
  , commenttables = $('table:gt(3):has(.default)') // any comments on page. returns nothing on home page
  , selectables = titletables.add(commenttables)

  , combos =  [ { key: "j"
                , handler: function() { cur = moveDown(selectables, cur); }
                }
              , { key: "k"
                , handler: function() { cur = moveUp(selectables, cur); }
                }
              , { key: "o"
                , handler: function() { openComments(selectables.eq(cur)); }
                }
              , { key: "return"
                , handler: function() { openComments(selectables.eq(cur)); }
                }
              , { key: "r"
                , handler: function() { reply(selectables.eq(cur)); return false; }
                }
              , { key: "w"
                , handler: function() { upvote(selectables.eq(cur)); }
                }
              , { key: "s"
                , handler: function() { downvote(selectables.eq(cur)); }
                }
              ]
  , combo;

  // $(expression).bind(types, keys, handler);
  // $(expression).unbind(types, handler);
  // $(document).bind('keydown', 'ctrl+a', fn);
  for (i in combos) {
    combo = combos[i];
    $(document).bind('keydown', combo.key, combo.handler);
  }

  // Highlight the first thing on the page, but doesn't scroll to it
  select(selectables.eq(cur), false);

  // focuses textarea if reply page
  if(window.location.pathname.indexOf('/reply') > 0){
    $('textarea').focus();
  }

  // So cells don't show when highlighted
  $('table').attr('cellspacing', 0)
            .attr('cellpadding', 0);
});
