var tabPosition = function(allWindowTabs, tab) {
  var tabLen = allWindowTabs.length;
  return {
    isLast: allWindowTabs.length === tab.index + 1,
    isFirst: tab.index === 0
  }
}

var tabUtils = {
  allWindowTabs: function(cb) {
    chrome.tabs.query({currentWindow: true}, cb);
  },
  allHighlightedTabs: function(cb) {
    chrome.tabs.query({currentWindow: true, highlighted: true}, cb);
  },
  allCommonDomainTabs: function(urlPattern, cb) {
    console.log('[background] @allCommonDomainTabs -> urlPattern: ', urlPattern);
    chrome.tabs.query({currentWindow: true, url: urlPattern}, function(allCommonDomainTabs) {
      console.log('[background] allCommonDomainTabs: ', allCommonDomainTabs);
      cb.call(null, allCommonDomainTabs);
    });
  },
  getCurrent: function(cb) {
    chrome.tabs.query({currentWindow: true, active: true}, function(currentTabArr) {
      cb.call(null, currentTabArr[0]);
    });
  },
  moveTabsToNewWindow: function(tabsToMove) {
    if (tabsToMove == null || Array.isArray(tabsToMove) && tabsToMove.length === 0) {
      return;
    }
    chrome.windows.create(function(newWindow) {
    console.log('[background] newWindow: ', newWindow);
      var tabsToMoveIds = tabsToMove.map(function(tabToMove) {
        return tabToMove.id;
      });
      console.log('[background] tabsToMoveIds: ', tabsToMoveIds);
      chrome.tabs.move(tabsToMoveIds, {
        windowId: newWindow.id,
        index: -1
      }, function() {
        tabUtils.getCurrent(function(currentTab) {
          console.log('[background] currentTab: ', currentTab);
          chrome.tabs.remove(currentTab.id);
        });
      });
    });

  }
};

chrome.runtime.onMessage.addListener(function(message, sender) {
  switch (message.type) {
    case 'MOVE_TAB':
      console.log('[background] MOVE_TAB');
      if (sender.tab && message.direction || message.index != null) {
        console.log('[background] message.index: ', message.index);
        tabUtils.allWindowTabs(function(allWindowTabs) {
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
    case 'DUPLICATE_TAB': {
      console.log('[background] DUPLICATE_TAB');
      if (sender.tab) {
        chrome.tabs.duplicate(sender.tab.id);
      }
      break;
    }
    case 'CLOSE_TABS_TO_RIGHT': {
      console.log('[background] CLOSE_TABS_TO_RIGHT');
      if (sender.tab) {
        tabUtils.allWindowTabs(function(allWindowTabs) {
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
    }
    case 'RELOAD_TABS': {
      console.log('[background] RELOAD_TABS');
      if (sender.tab) {
        tabUtils.allWindowTabs(function(allWindowTabs) {
          allWindowTabs.forEach(function(tab) {
            chrome.tabs.reload(tab.id);
          });
        });
      }
      break;
    }
    case 'HIGHLIGHT_TABS': {
      console.log('[background] HIGHLIGHT_TABS');
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
    }
    case 'MOVE_TO_NEW_WINDOW': {
      console.log('[background] MOVE_TO_NEW_WINDOW');
      if (sender.tab) {
        tabUtils.allWindowTabs(tabUtils.moveTabsToNewWindow);
        // tabUtils.allWindowTabs(function(allWindowTabs) {
        //   /* don't create new window if current window has only one tab */
        //   if (allWindowTabs.length === 1) {
        //     return;
        //   }
        //   tabUtils.allHighlightedTabs(function(allHighlightedTabs) {
        //     chrome.windows.create(function(newWindow) {
        //     console.log('[background] newWindow: ', newWindow);
        //       var highlightedTabIds = allHighlightedTabs.map(function(highlightedTab) {
        //         return highlightedTab.id;
        //       });
        //       console.log('[background] highlightedTabIds: ', highlightedTabIds);
        //       chrome.tabs.move(highlightedTabIds, {
        //         windowId: newWindow.id,
        //         index: -1
        //       }, function() {
        //         tabUtils.getCurrent(function(currentTab) {
        //           console.log('[background] currentTab: ', currentTab);
        //           chrome.tabs.remove(currentTab.id);
        //         });
        //       });
        //     });
        //   });
        // })
      }
      break;
    }
    case 'MOVE_DOMAIN_TABS_TO_NEW_WINDOW': {
      console.log('[background] MOVE_DOMAIN_TABS_TO_NEW_WINDOW');
      if (sender.tab) {
        var location = message.location;
        var urlPattern = location.protocol + '//' + location.host + '/*';
        console.log('[background] urlPattern: ', urlPattern);
        tabUtils.allCommonDomainTabs(urlPattern, tabUtils.moveTabsToNewWindow);
      }
    }
    default:
      return;
  }
});
