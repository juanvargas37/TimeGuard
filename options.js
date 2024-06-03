document.addEventListener("DOMContentLoaded", () => {
    const siteInput = document.getElementById("siteInput");
    const addSiteButton = document.getElementById("addSiteButton");
    const blockedSitesList = document.getElementById("blockedSitesList");
    const timerInput = document.getElementById("timerInput");
    const timerUnit = document.getElementById("timerUnit");
    const errorMessage = document.getElementById("errorMessage");

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

            const removeButton = document.createElement("button");
            removeButton.textContent = "Remove";
            removeButton.onclick = () => {
                const updatedSites = sites.filter(s => s.url !== site.url);
                browser.storage.local.set({ blockedSites: updatedSites });
                updateUI(updatedSites);
            };

            listItem.appendChild(removeButton);
            blockedSitesList.appendChild(listItem);
        });
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
                browser.storage.local.set({ blockedSites: validSites });
                updateUI(validSites);
            }
        });
    }

    function addSite() {
        const site = siteInput.value.trim();
        const duration = timerInput.value.trim();

        if (!site || !duration || isNaN(duration) || duration <= 0) {
            errorMessage.textContent = "Enter a valid website or duration.";
            errorMessage.style.display = "block";
            return;
        }

        errorMessage.style.display = "none";

        browser.storage.local.get("blockedSites").then(data => {
            let sites = data.blockedSites || [];
            if (!sites.some(s => s.url === site)) {
                const newSite = { url: site, timer: { duration: parseInt(duration), unit: timerUnit.value, startTime: Date.now() } };
                sites.push(newSite);
                browser.storage.local.set({ blockedSites: sites });
                updateUI(sites);
                siteInput.value = "";
                timerInput.value = "";
            }
        });
    }

    addSiteButton.addEventListener("click", addSite);

    siteInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            addSite();
        }
    });

    timerInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            addSite();
        }
    });

    browser.storage.local.get("blockedSites").then(data => {
        if (data.blockedSites) {
            updateUI(data.blockedSites);
        }
    });

    // Periodically refresh the UI to update timers
    setInterval(refreshUI, 1000);
});
