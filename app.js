let currentSatId = '25544'; 

// Toggle Sidebar Menu (3-Bar Button)
function toggleMenu() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');
}

// Switch Between Views (Tabs)
function switchView(viewName, event) {
    document.querySelectorAll('.view-panel').forEach(panel => panel.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

    if (viewName === 'tracking') {
        document.getElementById('trackingView').classList.add('active');
    } else if (viewName === 'processing') {
        document.getElementById('processingView').classList.add('active');
    } else if (viewName === 'diagnostics') {
        document.getElementById('diagnosticsView').classList.add('active');
    }

    event.currentTarget.classList.add('active');
}

// Switch Active Satellite and Fetch Live TLE
async function switchSatellite(name, noradId, event) {
    currentSatId = noradId;
    document.getElementById('satName').innerText = name;
    document.getElementById('activeRadarLabel').innerText = name.toUpperCase();
    
    document.querySelectorAll('.sub-btn').forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');

    document.getElementById('systemStatus').innerText = "FETCHING TLE...";
    await fetchAndTrackSatellite();
}

async function fetchAndTrackSatellite() {
    try {
        const response = await fetch(`https://celestrak.org/NORAD/elements/gp.php?CATNR=${currentSatId}&FORMAT=TLE`);
        const text = await response.text();
        const lines = text.trim().split('\n');

        if (lines.length < 2) throw new Error("Invalid TLE");

        const tleLine1 = lines.length === 3 ? lines[1] : lines[0];
        const tleLine2 = lines.length === 3 ? lines[2] : lines[1];

        document.getElementById('systemStatus').innerText = "LIVE UPLINK ACTIVE";
        document.getElementById('systemStatus').style.color = "#34d399";

        const satrec = satellite.twoline2satrec(tleLine1, tleLine2);

        clearInterval(window.trackerInterval);
        window.trackerInterval = setInterval(() => updateOrbitPosition(satrec), 1000);
        updateOrbitPosition(satrec);

    } catch (err) {
        document.getElementById('systemStatus').innerText = "SIMULATION FALLBACK";
        document.getElementById('systemStatus').style.color = "#fbbf24";
        runFallbackSimulation();
    }
}

function updateOrbitPosition(satrec) {
    const now = new Date();
    const pv = satellite.propagate(satrec, now);
    const gmst = satellite.gstime(now);

    if (pv.position) {
        const pd = satellite.eciToGeodetic(pv.position, gmst);
        const lat = satellite.degreesLat(pd.latitude);
        const lng = satellite.degreesLong(pd.longitude);
        const height = pd.height;
        const speed = Math.sqrt(pv.velocity.x**2 + pv.velocity.y**2 + pv.velocity.z**2);

        document.getElementById('satLat').innerText = lat.toFixed(2) + "°";
        document.getElementById('satLng').innerText = lng.toFixed(2) + "°";
        document.getElementById('satAlt').innerText = height.toFixed(1) + " km";
        document.getElementById('satVel').innerText = speed.toFixed(2) + " km/s";

        const mapX = ((lng + 180) / 360) * 100;
        const mapY = ((90 - lat) / 180) * 100;

        const blip = document.getElementById('targetBlip');
        blip.style.left = `${mapX}%`;
        blip.style.top = `${mapY}%`;
    }
}

function runFallbackSimulation() {
    let step = 0;
    clearInterval(window.trackerInterval);
    window.trackerInterval = setInterval(() => {
        step += 0.04;
        let lat = Math.sin(step) * 45;
        let lng = (step * 25) % 360 - 180;

        document.getElementById('satLat').innerText = lat.toFixed(2) + "°";
        document.getElementById('satLng').innerText = lng.toFixed(2) + "°";
        document.getElementById('satAlt').innerText = "415.4 km";
        document.getElementById('satVel').innerText = "7.66 km/s";

        const mapX = ((lng + 180) / 360) * 100;
        const mapY = ((90 - lat) / 180) * 100;

        const blip = document.getElementById('targetBlip');
        blip.style.left = `${mapX}%`;
        blip.style.top = `${mapY}%`;
    }, 1000);
}

// Simulated data processing log runner
function runDataProcessing() {
    const consoleLogs = document.getElementById('consoleLogs');
    const timestamp = new Date().toLocaleTimeString();
    
    consoleLogs.innerHTML += `<br>[${timestamp}] Executing atmospheric aerosol matrix sweep...`;
    setTimeout(() => {
        consoleLogs.innerHTML += `<br>[${timestamp}] NO2 columns verified. Aerosol index stable.`;
        consoleLogs.scrollTop = consoleLogs.scrollHeight;
    }, 800);
}

window.onload = () => fetchAndTrackSatellite();