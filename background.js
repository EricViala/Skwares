var openCustomBookmarksTab = function() {
    chrome.tabs.query({
            'title': 'Skwares'
        },
        function(results) {
            if (results.length === 0) { //create new tab
                chrome.tabs.create({
                        "url": chrome.extension.getURL("skwares.html"),
                        "index":0,
                        "active": true,
                        "pinned":true
                    });
            } else {
				chrome.tabs.move(results[0].id, {index:0});
				chrome.tabs.update(results[0].id, {
					active:true,
					pinned:true,
					highlighted:true
				});
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
