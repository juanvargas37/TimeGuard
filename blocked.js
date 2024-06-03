document.addEventListener("DOMContentLoaded", () => {
    const blockedSitesList = document.getElementById("blockedSitesList");

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

    function formatRemainingTime(remainingTime) {
        const hours = Math.floor((remainingTime / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((remainingTime / (1000 * 60)) % 60);
        const seconds = Math.floor((remainingTime / 1000) % 60);
        return `${hours}h ${minutes}m ${seconds}s`;
    }

    function updateBlockedSitesList(sites) {
        blockedSitesList.innerHTML = "";
        sites.forEach(site => {
            const listItem = document.createElement("li");

            const siteName = document.createElement("div");
            siteName.textContent = site.url;
            siteName.className = "site-name";

            const remainingTime = calculateRemainingTime(site.timer);
            const timerText = remainingTime > 0 ? `Time remaining: ${formatRemainingTime(remainingTime)}` : `Time expired`;

            const timerElement = document.createElement("div");
            timerElement.textContent = timerText;
            timerElement.className = "timer";

            listItem.appendChild(siteName);
            listItem.appendChild(timerElement);

            blockedSitesList.appendChild(listItem);
        });
    }

    function refreshUI() {
        browser.storage.local.get("blockedSites").then(data => {
            if (data.blockedSites) {
                updateBlockedSitesList(data.blockedSites);
            }
        });
    }

    browser.storage.local.get("blockedSites").then(data => {
        if (data.blockedSites) {
            updateBlockedSitesList(data.blockedSites);
        }
    });

    setInterval(refreshUI, 1000);
});
