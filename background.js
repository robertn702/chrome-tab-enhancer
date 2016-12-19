var tabPosition = function(allWindowTabs, tab) {
  var tabLen = allWindowTabs.length;
  return {
    isLast: allWindowTabs.length === tab.index + 1,
    isFirst: tab.index === 0
  }
}

var arrayUtils = {
  last: function(arr) {
    if (!Array.isArray(arr)) {
      console.log('[background] input must be an array');
    }

    if (arr.length === 0) {
      console.warn('arryUtils@last: arr.length = 0');
      return null;
    }

    return arr[arr.length - 1];
  },
  lastIdx: function(arr) {
    if (arr.length > 0) {
      return arr.length - 1;
    }

    if (arr.length === 0) {
      return 0;
    }
  },
  first: function(arr) {
    return arr[0];
  }
};

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
  currentTab: function(cb) {
    chrome.tabs.query({currentWindow: true, active: true}, function(currentTabArr) {
      cb.call(null, currentTabArr[0]);
    });
  },
  moveTabsToNewWindow: function(tabsToMove) {
    console.log('[background] this: ', this);
    if (tabsToMove == null || Array.isArray(tabsToMove) && tabsToMove.length === 0) {
      return;
    }
    tabUtils.allWindowTabs(function(allWindowTabs) {
      /* don't create new window if current window has only one tab */
      if (allWindowTabs.length === 1) {
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
          tabUtils.currentTab(function(currentTab) {
            console.log('[background] currentTab: ', currentTab);
            chrome.tabs.remove(currentTab.id);
          });
        });
      });
    })

  }
};

var prevHighlightedIdx = null;
chrome.runtime.onMessage.addListener(function(message, sender) {
  if (message.type !== 'HIGHLIGHT_TABS') {
    prevHighlightedIdx = null;
  }

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
      if (sender.tab) {
        tabUtils.allWindowTabs(function(allWindowTabs) {
          tabUtils.allHighlightedTabs(function(allHighlightedTabs) {
            console.groupCollapsed('[background] HIGHLIGHT_TABS');
            console.log('[background] prevHighlightedIdx: ', prevHighlightedIdx);
            console.log('[background] allHighlightedTabs: ', allHighlightedTabs);
            var highlightedTabIdxs = allHighlightedTabs.map(function(highlightedTab) {
              return highlightedTab.index;
            });
            var firstHighlightedIdx = arrayUtils.first(allHighlightedTabs).index;
            var lastHighlightedIdx = arrayUtils.last(allHighlightedTabs).index;

            var newHighlightedTabIdxs;
            if (message.direction === 1) {
              var prevHighlightedIsFirst = prevHighlightedIdx === firstHighlightedIdx;
              if (prevHighlightedIsFirst && allHighlightedTabs.length > 1) {
                console.log('[background] 1');
                newHighlightedTabIdxs = highlightedTabIdxs.slice(1);
                newHighlightedTabIdx = arrayUtils.first(newHighlightedTabIdxs);
              } else if (lastHighlightedIdx === arrayUtils.lastIdx(allWindowTabs)) {
                console.log('[background] 2');
                /* highlighted tab is last */
                return;
              } else {
                console.log('[background] 3');
                newHighlightedTabIdx = lastHighlightedIdx + 1;
                newHighlightedTabIdxs = highlightedTabIdxs.concat(newHighlightedTabIdx);
              }

              // chrome.tabs.highlight({tabs: newHighlightedTabIdxs});
            } else if (message.direction === -1) {
              console.log('[background] firstHighlightedIdx: ', firstHighlightedIdx);
              var prevHighlightedIsLast = prevHighlightedIdx === lastHighlightedIdx;
              if (prevHighlightedIsLast && allHighlightedTabs.length > 1) {
                console.log('[background] 4');
                newHighlightedTabIdxs = highlightedTabIdxs.slice(0, arrayUtils.lastIdx(highlightedTabIdxs));
                newHighlightedTabIdx = arrayUtils.last(newHighlightedTabIdxs);
              } else if (firstHighlightedIdx === 0) {
                console.log('[background] 5');
                return;
              } else {
                console.log('[background] 6');
                newHighlightedTabIdx = firstHighlightedIdx - 1;
                newHighlightedTabIdxs = [newHighlightedTabIdx].concat(highlightedTabIdxs);
              }
            }

            if (newHighlightedTabIdxs) {
              chrome.tabs.highlight({tabs: newHighlightedTabIdxs});
            }

            prevHighlightedIdx = newHighlightedTabIdx;
          });
        });
      }
      console.groupEnd();
      break;
    }
    case 'MOVE_TO_NEW_WINDOW': {
      console.log('[background] MOVE_TO_NEW_WINDOW');
      if (sender.tab) {
        tabUtils.allHighlightedTabs(tabUtils.moveTabsToNewWindow);
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
