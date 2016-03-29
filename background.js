var openCustomBookmarksTab = function() {
    chrome.tabs.query({
            'title': 'Skwares'
        },
        function(results) {
            if (results.length === 0) { //create new tab
                chrome.tabs.create({
                        "url": chrome.extension.getURL("skwares.html")
                    },
                    function(tab) {
                        tab.highlighted = true;
                        tab.active = true;
                        tab.pinned = true;
                    });
            } else { // existing one
                results[0].highlighted = true;
                results[0].active = true;
                results[0].pinned = true;
            }
        }
    ); // done querying tabs and creating a new one if needed
}



// React when a browser action's icon is clicked.
chrome.browserAction.onClicked.addListener(function(tab) {
    openCustomBookmarksTab();
});

// When the browser is started up
chrome.runtime.onStartup.addListener(function() {
    openCustomBookmarksTab();
});
