function sendMessage(message) {
  chrome.runtime.sendMessage(message);
}

Mousetrap.bind('alt+shift+[', function(e) {
  console.log('[content] pressed alt+shift+[: ', e);
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

