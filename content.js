Mousetrap.bind('alt+shift+[', function(e) {
  console.log('[content] pressed alt+shift+[: ', e);
  chrome.runtime.sendMessage({
    type: 'MOVE_TAB',
    direction: -1
  });
});
Mousetrap.bind('alt+shift+]', function(e) {
  chrome.runtime.sendMessage({
    type: 'MOVE_TAB',
    direction: 1
  });
});
Mousetrap.bind('alt+d', function(e) {
  chrome.runtime.sendMessage({
    type: 'DUPLICATE_TAB'
  });
});
