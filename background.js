var tabPosition = function(allWindowTabs, tab) {
  var tabLen = allWindowTabs.length;
  return {
    isLast: allWindowTabs.length === tab.index + 1,
    isFirst: tab.index === 0
  }
}

chrome.runtime.onMessage.addListener(function(message, sender) {
  switch(message.type) {
    case 'MOVE_TAB':
      if (sender.tab && message.direction || message.index != null) {
        console.log('[background] message.index: ', message.index);
        chrome.tabs.query({currentWindow: true}, function(allWindowTabs) {
          var lastIndex = allWindowTabs.length - 1;
          var newIndex = (message.index != null)
            ? message.index
            : sender.tab.index + message.direction;
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
          if (tabPosition(allWindowTabs, sender.tab).isLast) {
            return;
          }
          var tabsToBeRemoved = allWindowTabs
            .slice(sender.tab.index + 1)
            .map(function(tabObj) {
              return tabObj.id;
            });
          chrome.tabs.remove(tabsToBeRemoved);
        });
      }
      break;
    case 'RELOAD_TABS':
      if (sender.tab) {
        chrome.tabs.query({currentWindow: true}, function(allWindowTabs) {
          allWindowTabs.forEach(function(tab) {
            chrome.tabs.reload(tab.id);
          });
        });
      }
      break;
    case 'SELECT_TABS':
      if (sender.tab) {
        if (direction === 1) {
          chrome.tabs.query({currentWindow: true}, function(allWindowTabs) {
          })
        } else if (direction === -1) {
          chrome.tabs.query({currentWindow: true, highlighted: true}, function(allWindowTabs) {
            if (tabPosition(allWindowTabs, sender.tab).isFirst) {
              return;
            }

            chrome.tabs.highlight([

            ])
          });
        }
      }
      break;
    default:
      return;
  }
});
