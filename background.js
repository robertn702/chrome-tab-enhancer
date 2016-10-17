chrome.runtime.onMessage.addListener(function(message, sender) {
  switch(message.type) {
    case 'MOVE_TAB':
      if (message.direction && sender.tab) {
        chrome.tabs.query({currentWindow: true}, function(allWindowTabs) {
          var lastIndex = allWindowTabs.length - 1;
          var newIndex = sender.tab.index + message.direction;
          if (newIndex > lastIndex) {
            newIndex = 0;
          }
          chrome.tabs.move(sender.tab.id, {index: newIndex})
        });
      }
      break;
    case 'DUPLICATE_TAB':
      if (sender.tab) {
        chrome.tabs.duplicate(sender.tab.id);
      }
      break;
    case 'CLOSE_TABS_TO_RIGHT':
      if (sender.tab) {
        chrome.tabs.query({currentWindow: true}, function(allWindowTabs) {
          chrome.tabs.remove(allWindowTabs.slice(sender.tab.index + 1));
        });
      }
      break;
    default:
      return;
  }
});
