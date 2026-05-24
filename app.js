// InfraWatch-Monitor — Real-Time System Metrics Monitor
// ============================================================

let servers = [];
let isRunning = false;
let simInterval = null;
let startTime = Date.now();
let thresholds = JSON.parse(localStorage.getItem('iw_thresholds') || '{}');
const HISTORY_KEY = 'iw_metrics_history';

if (!thresholds.cpu) thresholds = { cpu: 90, memory: 85, disk: 90, network: 500 };

const serverTypes = {
  web: { baseCPU: 45, baseMem: 55, baseDisk: 40, baseNetIn: 120, baseNetOut: 80 },
  database: { baseCPU: 60, baseMem: 70, baseDisk: 65, baseNetIn: 60, baseNetOut: 40 },
  application: { baseCPU: 50, baseMem: 60, baseDisk: 35, baseNetIn: 100, baseNetOut: 100 },
  cache: { baseCPU: 30, baseMem: 75, baseDisk: 10, baseNetIn: 200, baseNetOut: 200 }
};

// ---- Initialization ----
document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('iw_servers');
  if (saved) {
    servers = JSON.parse(saved);
    servers.forEach(s => { s.metricsHistory = s.metricsHistory || []; });
  } else {
    servers = [
      createServer('web-prod-01', 'web'),
      createServer('db-primary-01', 'database'),
      createServer('app-worker-01', 'application')
    ];
  }
  renderServers();
  loadHistoryFromStorage();
});

function createServer(name, type) {
  return {
    id: 'srv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    name,
    type,
    startTime: Date.now(),
    currentMetrics: generateInitialMetrics(type),
    metricsHistory: [],
    alerts: []
  };
}

function generateInitialMetrics(type) {
  const cfg = serverTypes[type] || serverTypes.web;
  return {
    cpu: cfg.baseCPU + (Math.random() * 10 - 5),
    memory: cfg.baseMem + (Math.random() * 10 - 5),
    disk: cfg.baseDisk + (Math.random() * 5 - 2),
    networkIn: cfg.baseNetIn + (Math.random() * 40 - 20),
    networkOut: cfg.baseNetOut + (Math.random() * 40 - 20),
    processes: Math.floor(Math.random() * 50 + 100),
    threads: Math.floor(Math.random() * 200 + 500),
    timestamp: Date.now()
  };
}

// ---- Simulation ----
function toggleSimulation() {
  const btn = document.getElementById('btnToggle');
  if (isRunning) {
    isRunning = false;
    clearInterval(simInterval);
    btn.textContent = '▶️ Start Monitoring';
    btn.className = 'btn btn-primary';
  } else {
    isRunning = true;
    startTime = Date.now();
    const ms = parseInt(document.getElementById('intervalSelect').value);
    simInterval = setInterval(updateMetrics, ms);
    btn.textContent = '⏸ Pause';
    btn.className = 'btn btn-danger';
  }
}

function setInterval() {
  if (isRunning) {
    clearInterval(simInterval);
    const ms = parseInt(document.getElementById('intervalSelect').value);
    simInterval = setInterval(updateMetrics, ms);
  }
}

function updateMetrics() {
  const now = Date.now();
  servers.forEach(server => {
    const cfg = serverTypes[server.type] || serverTypes.web;
    const prev = server.currentMetrics;

    // Simulate realistic metric changes with some variance and occasional spikes
    const spike = Math.random() < 0.05; // 5% chance of spike
    const spikeFactor = spike ? (Math.random() * 25 + 15) : 0;
    const drift = (Math.random() - 0.48) * 8; // slight upward bias

    const newMetrics = {
      cpu: clamp(prev.cpu + drift + spikeFactor * (Math.random() > 0.5 ? 1 : 0.3), 5, 100),
      memory: clamp(prev.memory + (Math.random() - 0.45) * 3, 20, 100),
      disk: clamp(prev.disk + (Math.random() - 0.3) * 0.5, 5, 100),
      networkIn: Math.max(5, prev.networkIn + (Math.random() - 0.45) * 30 + (spike ? 150 : 0)),
      networkOut: Math.max(5, prev.networkOut + (Math.random() - 0.45) * 20 + (spike ? 100 : 0)),
      processes: clamp(prev.processes + Math.floor((Math.random() - 0.5) * 5), 50, 300),
      threads: clamp(prev.threads + Math.floor((Math.random() - 0.5) * 10), 200, 800),
      timestamp: now
    };

    // Check thresholds and generate alerts
    server.alerts = [];
    if (newMetrics.cpu > thresholds.cpu) {
      server.alerts.push({ type: 'critical', msg: `CPU at ${newMetrics.cpu.toFixed(1)}%` });
    } else if (newMetrics.cpu > thresholds.cpu - 15) {
      server.alerts.push({ type: 'warn', msg: `CPU at ${newMetrics.cpu.toFixed(1)}%` });
    }
    if (newMetrics.memory > thresholds.memory) {
      server.alerts.push({ type: 'critical', msg: `Memory at ${newMetrics.memory.toFixed(1)}%` });
    } else if (newMetrics.memory > thresholds.memory - 10) {
      server.alerts.push({ type: 'warn', msg: `Memory at ${newMetrics.memory.toFixed(1)}%` });
    }
    if (newMetrics.disk > thresholds.disk) {
      server.alerts.push({ type: 'critical', msg: `Disk at ${newMetrics.disk.toFixed(1)}%` });
    }
    if (newMetrics.networkIn > thresholds.network) {
      server.alerts.push({ type: 'critical', msg: `Net In: ${newMetrics.networkIn.toFixed(0)} Mbps` });
    }

    server.currentMetrics = newMetrics;
    server.metricsHistory.push(newMetrics);
    // Keep last 24 hours of data (at 2s interval = 43200 points max)
    if (server.metricsHistory.length > 43200) {
      server.metricsHistory = server.metricsHistory.slice(-43200);
    }
  });

  saveHistoryToStorage();
  renderServers();
  updateUptime();
}

// ---- Rendering ----
function renderServers() {
  const grid = document.getElementById('serverGrid');
  grid.innerHTML = '';

  servers.forEach(server => {
    const m = server.currentMetrics;
    const hasAlert = server.alerts.length > 0;
    const statusLevel = hasAlert && server.alerts.some(a => a.type === 'critical') ? 'critical'
      : hasAlert ? 'warning' : 'healthy';

    const card = document.createElement('div');
    card.className = 'server-card' + (hasAlert ? ' alert' : '');

    const cpuColor = getMetricColor(m.cpu, thresholds.cpu);
    const memColor = getMetricColor(m.memory, thresholds.memory);
    const diskColor = getMetricColor(m.disk, thresholds.disk);
    const uptime = formatUptime(Date.now() - server.startTime);

    let alertsHtml = '';
    if (server.alerts.length > 0) {
      alertsHtml = '<div class="alerts-list">' +
        server.alerts.map(a => `<div class="alert-item ${a.type === 'warn' ? 'warn' : ''}">⚠️ ${a.msg}</div>`).join('') +
        '</div>';
    }

    card.innerHTML = `
      <div class="server-header">
        <div>
          <div class="server-name">${esc(server.name)}</div>
        </div>
        <div class="server-status">
          <span class="server-type">${server.type.toUpperCase()}</span>
          <span class="status-dot ${statusLevel}"></span>
        </div>
      </div>
      <div class="server-body">
        <div class="metric-row">
          <span class="metric-label">CPU</span>
          <div class="metric-bar-bg"><div class="metric-bar-fill" style="width:${m.cpu}%;background:${cpuColor}"></div></div>
          <span class="metric-value" style="color:${cpuColor}">${m.cpu.toFixed(1)}%</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Memory</span>
          <div class="metric-bar-bg"><div class="metric-bar-fill" style="width:${m.memory}%;background:${memColor}"></div></div>
          <span class="metric-value" style="color:${memColor}">${m.memory.toFixed(1)}%</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Disk</span>
          <div class="metric-bar-bg"><div class="metric-bar-fill" style="width:${m.disk}%;background:${diskColor}"></div></div>
          <span class="metric-value" style="color:${diskColor}">${m.disk.toFixed(1)}%</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Net In</span>
          <div class="metric-mini-chart"><canvas id="chart-${server.id}-in"></canvas></div>
          <span class="metric-value" style="color:#60a5fa">${m.networkIn.toFixed(0)} <small>Mb/s</small></span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Net Out</span>
          <div class="metric-mini-chart"><canvas id="chart-${server.id}-out"></canvas></div>
          <span class="metric-value" style="color:#34d399">${m.networkOut.toFixed(0)} <small>Mb/s</small></span>
        </div>
        ${alertsHtml}
      </div>
      <div class="server-footer">
        <span>⏱ ${uptime} • P:${m.processes} T:${m.threads}</span>
        <button onclick="removeServer('${server.id}')" title="Remove server">🗑️</button>
      </div>`;

    grid.appendChild(card);

    // Draw mini charts
    requestAnimationFrame(() => {
      drawMiniChart(`chart-${server.id}-in`, server.metricsHistory.map(h => h.networkIn), '#60a5fa');
      drawMiniChart(`chart-${server.id}-out`, server.metricsHistory.map(h => h.networkOut), '#34d399');
    });
  });
}

function drawMiniChart(canvasId, data, color) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';
  ctx.scale(dpr, dpr);
  const W = rect.width;
  const H = rect.height;

  ctx.clearRect(0, 0, W, H);

  const points = data.slice(-60); // Last 60 data points
  if (points.length < 2) return;

  const max = Math.max(...points, 1);
  const step = W / (points.length - 1);

  // Fill gradient
  ctx.beginPath();
  ctx.moveTo(0, H);
  points.forEach((p, i) => {
    const x = i * step;
    const y = H - (p / max) * (H - 4);
    if (i === 0) ctx.lineTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.lineTo(W, H);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, color + '44');
  grad.addColorStop(1, color + '00');
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  points.forEach((p, i) => {
    const x = i * step;
    const y = H - (p / max) * (H - 4);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

// ---- Uptime ----
function updateUptime() {
  const elapsed = Date.now() - startTime;
  document.getElementById('uptimeDisplay').textContent = '⏱ Monitoring: ' + formatUptime(elapsed);
}

function formatUptime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h ${m % 60}m`;
  if (h > 0) return `${h}h ${m % 60}m ${s % 60}s`;
  return `${m}m ${s % 60}s`;
}

// ---- Thresholds ----
function openThresholds() {
  document.getElementById('thrCPU').value = thresholds.cpu;
  document.getElementById('thrMemory').value = thresholds.memory;
  document.getElementById('thrDisk').value = thresholds.disk;
  document.getElementById('thrNetwork').value = thresholds.network;
  document.getElementById('thrCPULabel').textContent = thresholds.cpu + '%';
  document.getElementById('thrMemoryLabel').textContent = thresholds.memory + '%';
  document.getElementById('thrDiskLabel').textContent = thresholds.disk + '%';
  document.getElementById('thrNetworkLabel').textContent = thresholds.network;
  document.getElementById('thresholdModal').style.display = 'flex';
}

function closeThresholds() {
  document.getElementById('thresholdModal').style.display = 'none';
}

function saveThresholds() {
  thresholds = {
    cpu: parseInt(document.getElementById('thrCPU').value),
    memory: parseInt(document.getElementById('thrMemory').value),
    disk: parseInt(document.getElementById('thrDisk').value),
    network: parseInt(document.getElementById('thrNetwork').value)
  };
  localStorage.setItem('iw_thresholds', JSON.stringify(thresholds));
  closeThresholds();
}

function thrLabel(inputId, labelId) {
  const val = document.getElementById(inputId).value;
  document.getElementById(labelId).textContent = inputId === 'thrNetwork' ? val : val + '%';
}

// ---- Server Management ----
function addServer() {
  document.getElementById('newServerName').value = '';
  document.getElementById('newServerType').value = 'web';
  document.getElementById('serverModal').style.display = 'flex';
}

function closeServerModal() {
  document.getElementById('serverModal').style.display = 'none';
}

function confirmAddServer() {
  const name = document.getElementById('newServerName').value.trim();
  if (!name) { alert('Enter a server name'); return; }
  const type = document.getElementById('newServerType').value;
  servers.push(createServer(name, type));
  saveServersToStorage();
  renderServers();
  closeServerModal();
}

function removeServer(id) {
  if (!confirm('Remove this server?')) return;
  servers = servers.filter(s => s.id !== id);
  saveServersToStorage();
  renderServers();
}

function resetData() {
  if (!confirm('Clear all monitoring data?')) return;
  servers.forEach(s => { s.metricsHistory = []; s.alerts = []; });
  localStorage.removeItem(HISTORY_KEY);
  renderServers();
}

// ---- Storage ----
function saveServersToStorage() {
  const toSave = servers.map(s => ({ id: s.id, name: s.name, type: s.type, startTime: s.startTime }));
  localStorage.setItem('iw_servers', JSON.stringify(toSave));
}

function saveHistoryToStorage() {
  const history = {};
  servers.forEach(s => {
    history[s.id] = s.metricsHistory.slice(-1000); // Store last 1000 points
  });
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    // localStorage full - trim history
    servers.forEach(s => { s.metricsHistory = s.metricsHistory.slice(-200); });
  }
}

function loadHistoryFromStorage() {
  try {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) {
      const history = JSON.parse(saved);
      servers.forEach(s => {
        if (history[s.id]) s.metricsHistory = history[s.id];
      });
    }
  } catch (e) {}
}

// ---- Utilities ----
function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }

function getMetricColor(value, threshold) {
  if (value >= threshold) return '#f87171';
  if (value >= threshold - 15) return '#fbbf24';
  return '#4ade80';
}

function esc(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
