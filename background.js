var tabUtils = {
  allWindowTabs: function(cb) {
    chrome.tabs.query({currentWindow: true}, cb);
  },
  allHighlightedTabs: function(cb) {
    chrome.tabs.query({currentWindow: true, highlighted: true}, cb);
  },
  getCurrent: function(cb) {
    chrome.tabs.query({currentWindow: true, active: true}, function(currentTabArr) {
      cb.call(null, currentTabArr[0]);
    });
  }
};

chrome.runtime.onMessage.addListener(function(message, sender) {
  switch (message.type) {
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
    case 'HIGHLIGHT_TABS':
      if (sender.tab) {
        tabUtils.allWindowTabs(function(allWindowTabs) {
          tabUtils.allHighlightedTabs(function(allHighlightedTabs) {
            console.log('[background] allHighlightedTabs: ', allHighlightedTabs);
            var highlightedTabIdxs = allHighlightedTabs.map(function(highlightedTab) {
              return highlightedTab.index;
            });

            if (message.direction === 1) {
              var lastHighlightedIndex = allHighlightedTabs[allHighlightedTabs.length - 1].index;
              /* highlighted tab is last */
              if (lastHighlightedIndex === allWindowTabs.length - 1) {
                return;
              }
              chrome.tabs.highlight({tabs: highlightedTabIdxs.concat(lastHighlightedIndex + 1)});
            }

            if (message.direction === -1) {
              var firstHighlightedIndex = allHighlightedTabs[0].index;
              console.log('[background] firstHighlightedIndex: ', firstHighlightedIndex);
              if (firstHighlightedIndex === 0) {
                return;
              }
              chrome.tabs.highlight({tabs: highlightedTabIdxs.concat(firstHighlightedIndex - 1)});
            }
          });
        });
      }
      break;
    case 'MOVE_TO_NEW_WINDOW':
      if (sender.tab) {
        tabUtils.allHighlightedTabs(function(allHighlightedTabs) {
          chrome.windows.create(function(newWindow) {
          console.log('[background] newWindow: ', newWindow);
            var highlightedTabIds = allHighlightedTabs.map(function(highlightedTab) {
              return highlightedTab.id;
            });
            console.log('[background] highlightedTabIds: ', highlightedTabIds);
            chrome.tabs.move(highlightedTabIds, {
              windowId: newWindow.id,
              index: -1
            }, function() {
              tabUtils.getCurrent(function(currentTab) {
                console.log('[background] currentTab: ', currentTab);
                chrome.tabs.remove(currentTab.id);
              });
            });
          });
        });
      }
    default:
      return;
  }
});
