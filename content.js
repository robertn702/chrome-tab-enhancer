function sendMessage(message) {
  chrome.runtime.sendMessage(message);
}

Mousetrap.bind('alt+shift+[', function(e) {
  sendMessage({
    type: 'MOVE_TAB',
    direction: -1
  });
});
Mousetrap.bind('alt+shift+]', function(e) {
  sendMessage({
    type: 'MOVE_TAB',
    direction: 1
  });
});
Mousetrap.bind('alt+d', function(e) {
  sendMessage({
    type: 'DUPLICATE_TAB'
  });
});
Mousetrap.bind('alt+w', function(e) {
  sendMessage({
    type: 'CLOSE_TABS_TO_RIGHT',
    direction: 1
  });
});
Mousetrap.bind('alt+r', function(e) {
  sendMessage({
    type: 'RELOAD_TABS'
  });
});
Mousetrap.bind('alt+shift+right', function(e) {
  sendMessage({
    type: 'HIGHLIGHT_TABS',
    direction: 1
  });
});
Mousetrap.bind('alt+shift+left', function(e) {
  sendMessage({
    type: 'HIGHLIGHT_TABS',
    direction: -1
  });
});
Mousetrap.bind('alt+m', function(e) {
  sendMessage({
    type: 'MOVE_TO_NEW_WINDOW'
  });
});
Mousetrap.bind('alt+shift+m', function(e) {
  sendMessage({
    type: 'MOVE_DOMAIN_TABS_TO_NEW_WINDOW',
    location: document.location
  });
});
Mousetrap.bind('alt+p', function(e) {
  sendMessage({
    type: 'PIN_TAB',
  });
});
Mousetrap.bind('alt+e', function(e) {
  sendMessage({
    type: 'MERGE_WINDOWS'
  });
});

var createMoveToIndex = function(position) {
  return function(e) {
    sendMessage({
      type: 'MOVE_TAB',
      index: position - 1
    });
  };
};

for (var i = 1; i < 10; i++) {
  Mousetrap.bind('alt+' + i, createMoveToIndex(i));
}
