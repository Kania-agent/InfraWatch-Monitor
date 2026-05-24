/* InfraWatch-Monitor — App Logic */
document.addEventListener('DOMContentLoaded', () => {
    // Server data
    const servers = [
        { name: 'web-prod-01', ip: '10.0.1.10', os: 'Ubuntu 22.04', cpu: 67, mem: 72, uptime: '34d 12h', status: 'healthy', processes: 284 },
        { name: 'web-prod-02', ip: '10.0.1.11', os: 'Ubuntu 22.04', cpu: 43, mem: 58, uptime: '34d 12h', status: 'healthy', processes: 267 },
        { name: 'api-prod-01', ip: '10.0.2.10', os: 'Ubuntu 22.04', cpu: 89, mem: 91, uptime: '12d 6h', status: 'critical', processes: 412 },
        { name: 'api-prod-02', ip: '10.0.2.11', os: 'Ubuntu 22.04', cpu: 76, mem: 82, uptime: '12d 6h', status: 'warning', processes: 356 },
        { name: 'db-primary', ip: '10.0.3.10', os: 'Debian 11', cpu: 54, mem: 78, uptime: '89d 3h', status: 'healthy', processes: 45 },
        { name: 'db-replica', ip: '10.0.3.11', os: 'Debian 11', cpu: 31, mem: 45, uptime: '89d 3h', status: 'healthy', processes: 42 },
        { name: 'cache-redis-01', ip: '10.0.4.10', os: 'Alpine 3.18', cpu: 22, mem: 64, uptime: '45d 8h', status: 'healthy', processes: 12 },
        { name: 'worker-01', ip: '10.0.5.10', os: 'Ubuntu 22.04', cpu: 95, mem: 88, uptime: '7d 18h', status: 'critical', processes: 189 },
        { name: 'worker-02', ip: '10.0.5.11', os: 'Ubuntu 22.04', cpu: 56, mem: 62, uptime: '7d 18h', status: 'healthy', processes: 167 },
        { name: 'monitoring', ip: '10.0.6.10', os: 'Debian 11', cpu: 38, mem: 52, uptime: '23d 14h', status: 'healthy', processes: 78 },
        { name: 'edge-proxy', ip: '10.0.0.5', os: 'Alpine 3.18', cpu: 19, mem: 34, uptime: '67d 2h', status: 'warning', processes: 8 },
    ];

    function getGaugeColor(val) {
        if (val >= 90) return '#ff3d71';
        if (val >= 75) return '#ffaa00';
        if (val >= 50) return '#3366ff';
        return '#00d68f';
    }

    function gaugeArc(val) {
        const circumference = 2 * Math.PI * 34;
        const offset = circumference - (val / 100) * circumference;
        return { circumference, offset };
    }

    function renderServers() {
        const grid = document.getElementById('servers-grid');
        grid.innerHTML = servers.map(s => {
            const cpuColor = getGaugeColor(s.cpu);
            const memColor = getGaugeColor(s.mem);
            const cpuArc = gaugeArc(s.cpu);
            const memArc = gaugeArc(s.mem);
            return `
                <div class="server-card ${s.status}">
                    <div class="server-header">
                        <span class="server-name">${s.name}</span>
                        <span class="server-status ${s.status}">${s.status}</span>
                    </div>
                    <div class="gauges-row">
                        <div class="gauge">
                            <div class="gauge-label">CPU</div>
                            <div class="gauge-ring">
                                <svg viewBox="0 0 80 80">
                                    <circle class="gauge-bg" cx="40" cy="40" r="34"/>
                                    <circle class="gauge-fill" cx="40" cy="40" r="34"
                                        stroke="${cpuColor}"
                                        stroke-dasharray="${cpuArc.circumference}"
                                        stroke-dashoffset="${cpuArc.offset}"/>
                                </svg>
                                <span class="gauge-value" style="color:${cpuColor}">${s.cpu}%</span>
                            </div>
                            <div class="gauge-sub">${s.processes} procs</div>
                        </div>
                        <div class="gauge">
                            <div class="gauge-label">Memory</div>
                            <div class="gauge-ring">
                                <svg viewBox="0 0 80 80">
                                    <circle class="gauge-bg" cx="40" cy="40" r="34"/>
                                    <circle class="gauge-fill" cx="40" cy="40" r="34"
                                        stroke="${memColor}"
                                        stroke-dasharray="${memArc.circumference}"
                                        stroke-dashoffset="${memArc.offset}"/>
                                </svg>
                                <span class="gauge-value" style="color:${memColor}">${s.mem}%</span>
                            </div>
                            <div class="gauge-sub">of 64 GB</div>
                        </div>
                    </div>
                    <div class="server-meta">
                        <span>${s.ip}</span>
                        <span>${s.os}</span>
                        <span>↑ ${s.uptime}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderServers();

    // Alerts
    const alerts = [
        { severity: 'critical', msg: 'worker-01 CPU at 95% — sustained high load for 12 min', time: '2 min ago' },
        { severity: 'critical', msg: 'api-prod-01 memory at 91% — OOM risk detected', time: '5 min ago' },
        { severity: 'warning', msg: 'api-prod-02 memory trending up (+18% in 1h)', time: '8 min ago' },
        { severity: 'warning', msg: 'edge-proxy connection pool exhaustion imminent', time: '15 min ago' },
        { severity: 'info', msg: 'db-replica lag detected: 2.3s behind primary', time: '22 min ago' },
    ];

    document.getElementById('alerts-list').innerHTML = alerts.map(a => `
        <div class="alert-item ${a.severity}">
            <div>
                <div class="alert-severity">${a.severity}</div>
            </div>
            <div class="alert-msg">${a.msg}</div>
            <div class="alert-time">${a.time}</div>
        </div>
    `).join('');

    // Services
    const services = [
        { name: 'API Gateway', status: 'up', uptime: '99.99%' },
        { name: 'Auth Service', status: 'up', uptime: '99.98%' },
        { name: 'Payment Gateway', status: 'up', uptime: '99.97%' },
        { name: 'Order Service', status: 'degraded', uptime: '99.82%' },
        { name: 'Email Service', status: 'up', uptime: '99.99%' },
        { name: 'Search Engine', status: 'down', uptime: '98.41%' },
        { name: 'CDN', status: 'up', uptime: '99.99%' },
    ];

    document.getElementById('services-list').innerHTML = services.map(s => `
        <div class="service-item">
            <span class="service-dot ${s.status}"></span>
            <span class="service-name">${s.name}</span>
            <span class="service-name">${s.uptime}</span>
        </div>
    `).join('');

    // Network
    const networkData = [
        { label: 'Inbound', value: '2.4 GB/s', pct: 65, color: '#00d68f', direction: 'up' },
        { label: 'Outbound', value: '1.8 GB/s', pct: 48, color: '#0edbc9', direction: 'down' },
        { label: 'Connections', value: '14,832', pct: 73, color: '#3366ff' },
        { label: 'Packets In', value: '342K/s', pct: 58, color: '#00d68f', direction: 'up' },
        { label: 'Packets Out', value: '287K/s', pct: 51, color: '#0edbc9', direction: 'down' },
    ];

    document.getElementById('network-stats').innerHTML = networkData.map(n => `
        <div>
            <div class="net-stat">
                <span class="net-label">${n.label}</span>
                <span class="net-value ${n.direction || ''}">${n.value}</span>
            </div>
            <div class="net-bar">
                <div class="net-bar-fill" style="width: ${n.pct}%; background: ${n.color}"></div>
            </div>
        </div>
    `).join('');

    // Update timestamp
    function updateTime() {
        document.getElementById('last-update').textContent = new Date().toLocaleTimeString();
    }
    updateTime();

    // Simulate live updates
    function simulateUpdates() {
        servers.forEach(s => {
            s.cpu = Math.max(5, Math.min(99, s.cpu + Math.floor(Math.random() * 7 - 3)));
            s.mem = Math.max(10, Math.min(99, s.mem + Math.floor(Math.random() * 5 - 2)));
            if (s.cpu >= 90) s.status = 'critical';
            else if (s.cpu >= 75 || s.mem >= 85) s.status = 'warning';
            else s.status = 'healthy';
        });
        renderServers();
        updateTime();

        // Update summary
        document.getElementById('healthy-count').textContent = servers.filter(s => s.status === 'healthy').length;
        document.getElementById('warning-count').textContent = servers.filter(s => s.status === 'warning').length;
        document.getElementById('critical-count').textContent = servers.filter(s => s.status === 'critical').length;
    }

    setInterval(simulateUpdates, 4000);

    document.getElementById('refresh-btn').addEventListener('click', simulateUpdates);
});
