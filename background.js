console.log("Background script loaded");

let blockedSites = [];
let blockedTabs = new Set();

browser.storage.local.get("blockedSites").then(data => {
    console.log("Retrieved blocked sites from storage:", data.blockedSites);
    if (data.blockedSites) {
        blockedSites = data.blockedSites.map(site => {
            if (site.timer) {
                site.timer.startTime = site.timer.startTime || Date.now();
            }
            return site;
        });
    }
}).catch(error => {
    console.error("Error retrieving blocked sites:", error);
});

browser.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.blockedSites) {
        console.log("Blocked sites updated:", changes.blockedSites.newValue);
        blockedSites = changes.blockedSites.newValue.map(site => {
            if (site.timer) {
                site.timer.startTime = site.timer.startTime || Date.now();
            }
            return site;
        });
    }
});

function calculateRemainingTime(timer) {
    const { duration, unit, startTime } = timer;
    const now = Date.now();
    let remainingTime = 0;
    switch (unit) {
        case 'seconds':
            remainingTime = duration * 1000 - (now - startTime);
            break;
        case 'minutes':
            remainingTime = duration * 60 * 1000 - (now - startTime);
            break;
        case 'hours':
            remainingTime = duration * 60 * 60 * 1000 - (now - startTime);
            break;
    }
    return remainingTime;
}

browser.webRequest.onBeforeRequest.addListener(
    function (details) {
        console.log("Request details:", details);

        if (details.url.includes(browser.runtime.getURL("blocked.html"))) {
            console.log("Request for blocked.html page, allowing request.");
            return { cancel: false };
        }

        for (let site of blockedSites) {
            if (details.url.includes(site.url)) {
                console.log("Blocking site:", site.url, "Tab ID:", details.tabId);

                if (site.timer) {
                    const remainingTime = calculateRemainingTime(site.timer);
                    if (remainingTime <= 0) {
                        console.log("Timer expired for site:", site.url);
                        continue; // Skip blocking if timer has expired
                    }
                }

                if (blockedTabs.has(details.tabId) || details.tabId === -1) {
                    console.log("Tab already handled or invalid tab ID, canceling request.");
                    return { cancel: true };
                }

                blockedTabs.add(details.tabId);

                browser.tabs.create({ url: browser.runtime.getURL("blocked.html") }).then(tab => {
                    console.log("Blocked tab created with ID:", tab.id);

                    // Remove the tabId from the set after a short delay
                    setTimeout(() => {
                        blockedTabs.delete(details.tabId);
                        console.log("Removed tab ID from the set:", details.tabId);
                    }, 1000);
                }).catch(error => {
                    console.error("Error creating blocked tab:", error);
                });

                // Close the original tab to prevent it from loading the blocked site
                browser.tabs.remove(details.tabId);

                // Cancel the original request
                return { cancel: true };
            }
        }
        return { cancel: false };
    },
    { urls: ["<all_urls>"] },
    ["blocking"]
);
