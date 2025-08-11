/*! instantDataScraper - 2018-02-26 */

chrome.action.onClicked.addListener(function(activeTab){
  var targetUrl = chrome.runtime.getURL(
    "popup.html?tabid=" + encodeURIComponent(activeTab.id) +
    "&url=" + encodeURIComponent(activeTab.url)
  );
  chrome.windows.create({
    url: targetUrl,
    type: "popup",
    width: 720,
    height: 650
  });
});