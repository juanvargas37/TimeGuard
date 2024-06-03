document.addEventListener("DOMContentLoaded", () => {
    const blockedSitesList = document.getElementById("blockedSitesList");
    const optionsButton = document.getElementById("optionsButton");

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

    function formatTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    function updateUI(sites) {
        blockedSitesList.innerHTML = "";
        if (sites.length === 0) {
            const noSitesMessage = document.createElement("li");
            noSitesMessage.textContent = "No sites currently blocked.";
            noSitesMessage.style.textAlign = "center";
            noSitesMessage.style.color = "#E5E5E5";
            blockedSitesList.appendChild(noSitesMessage);
        } else {
            sites.forEach(site => {
                const remainingTime = calculateRemainingTime(site.timer);
                if (remainingTime <= 0) {
                    // Skip expired timers
                    return;
                }

                const listItem = document.createElement("li");

                const listItemContent = document.createElement("div");
                listItemContent.className = "list-item-content";

                const siteName = document.createElement("span");
                siteName.textContent = site.url;
                listItemContent.appendChild(siteName);

                if (site.timer) {
                    const timerSpan = document.createElement("span");
                    timerSpan.className = "timer";
                    listItemContent.appendChild(timerSpan);
                    updateTimerSpan(timerSpan, site.timer);
                }

                listItem.appendChild(listItemContent);

                blockedSitesList.appendChild(listItem);
            });
        }
    }

    function updateTimerSpan(timerSpan, timer) {
        const remainingTime = calculateRemainingTime(timer);
        if (remainingTime > 0) {
            timerSpan.textContent = ` - ${formatTime(remainingTime)} remaining`;
        }
    }

    function refreshUI() {
        browser.storage.local.get("blockedSites").then(data => {
            if (data.blockedSites) {
                const validSites = data.blockedSites.filter(site => calculateRemainingTime(site.timer) > 0);
                updateUI(validSites);
            } else {
                updateUI([]);
            }
        });
    }

    optionsButton.addEventListener("click", () => {
        browser.runtime.openOptionsPage();
    });

    browser.storage.local.get("blockedSites").then(data => {
        if (data.blockedSites) {
            updateUI(data.blockedSites);
        } else {
            updateUI([]);
        }
    });

    // Periodically refresh the UI to update timers
    setInterval(refreshUI, 1000);
});
