import { Controller, Get, Res } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { Response } from 'express';

@Controller()
export class ConsoleController {
  @Get('console')
  @ApiExcludeEndpoint()
  getConsole(@Res() res: Response) {
    res.type('html').send(this.getConsoleHtml());
  }

  @Get('playground')
  @ApiExcludeEndpoint()
  getPlayground(@Res() res: Response) {
    res.redirect('/console');
  }

  @Get()
  @ApiExcludeEndpoint()
  getRoot(@Res() res: Response) {
    res.redirect('/console');
  }

  private getConsoleHtml(): string {
    return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Real-Time Notification Engine — Live Interactive Console</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.socket.io/4.8.1/socket.io.min.js"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            sans: ['"Plus Jakarta Sans"', 'sans-serif'],
            mono: ['"JetBrains Mono"', 'monospace'],
          },
          colors: {
            brand: {
              50: '#eef2ff',
              500: '#6366f1',
              600: '#4f46e5',
              700: '#4338ca',
            }
          }
        }
      }
    }
  </script>
  <style>
    body { background-color: #090d16; color: #f1f5f9; }
    .glass-panel {
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .pulse-dot {
      box-shadow: 0 0 10px #10b981;
    }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #0b0f19; }
    ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 3px; }
  </style>
</head>
<body class="min-h-screen flex flex-col font-sans selection:bg-brand-500 selection:text-white">

  <!-- Header -->
  <header class="border-b border-slate-800/80 bg-slate-950/80 sticky top-0 z-50 backdrop-blur-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <div class="flex items-center space-x-2">
            <h1 class="font-bold text-base tracking-tight text-white">Event-Driven Notification Engine</h1>
            <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">v1.0.0</span>
          </div>
          <p class="text-xs text-slate-400">NestJS • PostgreSQL • Redis Adapter • BullMQ • Socket.IO</p>
        </div>
      </div>

      <div class="flex items-center space-x-3">
        <!-- Socket Status Badge -->
        <div id="socket-badge" class="flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 transition-all">
          <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          <span id="socket-status-text">CONNECTING...</span>
        </div>

        <a href="/api/docs" target="_blank" class="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center space-x-1.5 transition">
          <svg class="w-3.5 h-3.5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          <span>Swagger Docs</span>
        </a>

        <a href="https://github.com/kuhaad-dev/realtime-notifications" target="_blank" class="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center space-x-1.5 transition">
          <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
          <span>GitHub</span>
        </a>
      </div>
    </div>
  </header>

  <!-- Main Container -->
  <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

    <!-- Left Column: Interactive Dispatchers (5 cols) -->
    <div class="lg:col-span-5 space-y-6">

      <!-- Active Client Subscription Panel -->
      <div class="glass-panel rounded-2xl p-5 border border-slate-800 shadow-xl">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center space-x-2">
            <span class="text-sm font-semibold text-white">Client Session</span>
            <span class="text-[10px] font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded">WebSocket</span>
          </div>
          <span id="socket-id-pill" class="text-xs font-mono text-cyan-400 truncate max-w-[150px]">socket: disconnected</span>
        </div>

        <div class="grid grid-cols-2 gap-3 mb-3 text-xs font-mono">
          <div class="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
            <div class="text-slate-500 text-[10px]">CURRENT USER ROOM</div>
            <div id="active-user-room" class="text-emerald-400 font-semibold truncate">user:demo_candidate</div>
          </div>
          <div class="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
            <div class="text-slate-500 text-[10px]">REDIS ADAPTER BUS</div>
            <div class="text-purple-400 font-semibold">Active (Cross-Node)</div>
          </div>
        </div>

        <div class="flex space-x-2">
          <input type="text" id="custom-channel-input" placeholder="Join extra channel (e.g. orders:vip)" class="flex-1 bg-slate-900 text-xs px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-brand-500 font-mono text-slate-200">
          <button onclick="joinChannel()" class="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-3 py-2 rounded-lg border border-slate-700 transition">Join</button>
        </div>
      </div>

      <!-- Tabbed Control Panel -->
      <div class="glass-panel rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div class="flex border-b border-slate-800 bg-slate-900/50">
          <button onclick="switchTab('direct')" id="tab-btn-direct" class="flex-1 py-3 text-xs font-semibold text-brand-400 border-b-2 border-brand-500 transition flex items-center justify-center space-x-1.5">
            <span>Direct Dispatch (BullMQ)</span>
          </button>
          <button onclick="switchTab('webhook')" id="tab-btn-webhook" class="flex-1 py-3 text-xs font-semibold text-slate-400 hover:text-slate-200 border-b-2 border-transparent transition flex items-center justify-center space-x-1.5">
            <span>HMAC Webhook Simulator</span>
          </button>
        </div>

        <!-- Tab 1: Direct Dispatch -->
        <div id="tab-content-direct" class="p-5 space-y-4">
          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">Target Recipient / User ID</label>
            <input type="text" id="dispatch-recipient" value="demo_candidate" class="w-full bg-slate-900 text-xs font-mono px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-brand-500 text-slate-200">
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">Event Type</label>
              <select id="dispatch-event-type" class="w-full bg-slate-900 text-xs px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-brand-500 text-slate-200">
                <option value="PAYMENT_SUCCEEDED">PAYMENT_SUCCEEDED</option>
                <option value="ORDER_DISPATCHED">ORDER_DISPATCHED</option>
                <option value="DOCUMENT_VERIFIED">DOCUMENT_VERIFIED</option>
                <option value="SECURITY_ALERT">SECURITY_ALERT</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">Delivery Channel</label>
              <input type="text" value="IN_APP_SOCKET" disabled class="w-full bg-slate-950/60 text-xs font-mono px-3 py-2 rounded-lg border border-slate-800 text-slate-500 cursor-not-allowed">
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">Notification Title</label>
            <input type="text" id="dispatch-title" value="Payment Confirmed ($499.00 USD)" class="w-full bg-slate-900 text-xs px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-brand-500 text-slate-200">
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="text-xs font-medium text-slate-300">Payload JSON</label>
              <button onclick="resetPayloadTemplate()" class="text-[10px] text-brand-400 hover:underline">Reset Template</button>
            </div>
            <textarea id="dispatch-payload" rows="4" class="w-full bg-slate-900 text-xs font-mono p-3 rounded-lg border border-slate-800 focus:outline-none focus:border-brand-500 text-slate-300 leading-relaxed">{
  "orderId": "ORD-99182",
  "amount": 499.00,
  "currency": "USD",
  "receipt": "https://cdn.example.com/rcpt_981.pdf"
}</textarea>
          </div>

          <div class="flex items-center justify-between pt-1">
            <label class="flex items-center space-x-2 text-xs text-slate-400 cursor-pointer">
              <input type="checkbox" id="inject-idempotency" checked class="rounded border-slate-800 bg-slate-900 text-brand-500 focus:ring-0">
              <span>Auto-inject Idempotency Key</span>
            </label>
            <span id="idemp-key-display" class="text-[10px] font-mono text-slate-500">key: auto</span>
          </div>

          <button onclick="dispatchNotification()" id="btn-dispatch" class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-medium text-xs shadow-lg shadow-brand-500/20 active:scale-[0.99] transition flex items-center justify-center space-x-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
            <span>Enqueue via BullMQ</span>
          </button>
        </div>

        <!-- Tab 2: HMAC Webhook Simulator -->
        <div id="tab-content-webhook" class="p-5 space-y-4 hidden">
          <div class="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
            <div class="flex items-center justify-between text-slate-400">
              <span>HMAC Secret Key</span>
              <span class="font-mono text-slate-500">SHA-256</span>
            </div>
            <div class="font-mono text-cyan-400 truncate text-[11px]">whsec_09a1f28b7e654321cba9876543210fed</div>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">Provider & Event ID</label>
            <div class="grid grid-cols-2 gap-3">
              <input type="text" id="webhook-provider" value="STRIPE" class="bg-slate-900 text-xs font-mono px-3 py-2 rounded-lg border border-slate-800 text-slate-200">
              <input type="text" id="webhook-event-id" value="evt_stripe_live_demo" class="bg-slate-900 text-xs font-mono px-3 py-2 rounded-lg border border-slate-800 text-slate-200">
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">Webhook Event Type</label>
            <input type="text" id="webhook-event-type" value="charge.captured" class="w-full bg-slate-900 text-xs font-mono px-3 py-2 rounded-lg border border-slate-800 text-slate-200">
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1">Webhook Payload</label>
            <textarea id="webhook-payload-data" rows="4" class="w-full bg-slate-900 text-xs font-mono p-3 rounded-lg border border-slate-800 focus:outline-none focus:border-brand-500 text-slate-300 leading-relaxed">{
  "customerId": "demo_candidate",
  "amount": 75000,
  "currency": "inr",
  "status": "captured"
}</textarea>
          </div>

          <div class="space-y-2 pt-2">
            <button onclick="triggerWebhook('valid')" class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs shadow-lg shadow-emerald-500/20 active:scale-[0.99] transition flex items-center justify-center space-x-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
              <span>Trigger Valid HMAC Webhook</span>
            </button>

            <div class="grid grid-cols-2 gap-2">
              <button onclick="triggerWebhook('invalid')" class="py-2 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-medium text-xs transition">
                Corrupt Signature (401)
              </button>
              <button onclick="triggerWebhook('duplicate')" class="py-2 px-3 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 font-medium text-xs transition">
                Test Idempotency (200)
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>

    <!-- Right Column: Real-Time Stream & Live Telemetry (7 cols) -->
    <div class="lg:col-span-7 flex flex-col space-y-4">

      <!-- Metrics Bar -->
      <div class="grid grid-cols-3 gap-3">
        <div class="glass-panel rounded-xl p-3.5 border border-slate-800">
          <div class="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">Messages Received</div>
          <div id="stat-count" class="text-xl font-bold font-mono text-white mt-0.5">0</div>
        </div>
        <div class="glass-panel rounded-xl p-3.5 border border-slate-800">
          <div class="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">Roundtrip Latency</div>
          <div id="stat-latency" class="text-xl font-bold font-mono text-cyan-400 mt-0.5">-- ms</div>
        </div>
        <div class="glass-panel rounded-xl p-3.5 border border-slate-800">
          <div class="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">Dedup Suppressed</div>
          <div id="stat-dedup" class="text-xl font-bold font-mono text-purple-400 mt-0.5">0</div>
        </div>
      </div>

      <!-- Live Stream Console -->
      <div class="glass-panel rounded-2xl border border-slate-800 shadow-xl flex-1 flex flex-col overflow-hidden min-h-[520px]">
        <!-- Stream Header -->
        <div class="px-5 py-3.5 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <div class="flex items-center space-x-2.5">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 pulse-dot"></span>
            <span class="text-xs font-semibold text-white tracking-wide">Live Socket.IO Stream</span>
            <span class="text-[10px] font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded">/notifications</span>
          </div>
          <div class="flex items-center space-x-2">
            <button onclick="clearEventStream()" class="text-xs text-slate-400 hover:text-slate-200 transition px-2.5 py-1 rounded bg-slate-800 border border-slate-700">Clear</button>
          </div>
        </div>

        <!-- Stream Body -->
        <div id="event-stream" class="flex-1 p-4 overflow-y-auto space-y-3 font-mono text-xs">
          <!-- Empty State Placeholder -->
          <div id="empty-state" class="h-full flex flex-col items-center justify-center text-center py-16 text-slate-600">
            <svg class="w-12 h-12 mb-3 stroke-current opacity-30" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            <p class="text-xs text-slate-400 font-medium font-sans">No notifications received yet</p>
            <p class="text-[11px] text-slate-500 font-sans mt-0.5">Trigger a BullMQ dispatch or verified HMAC webhook on the left</p>
          </div>
        </div>

        <!-- Terminal-style Footer Log -->
        <div class="px-4 py-2 border-t border-slate-800/80 bg-slate-950 font-mono text-[11px] text-slate-500 flex items-center justify-between">
          <span id="console-footer-msg">> Ready. Listening for Redis-adapter emissions...</span>
          <span id="current-clock" class="text-slate-600">--:--:--</span>
        </div>
      </div>

    </div>

  </main>

  <script>
    // State
    const currentUser = 'demo_candidate';
    let socket;
    let messageCount = 0;
    let dedupCount = 0;

    // Clock
    setInterval(() => {
      document.getElementById('current-clock').innerText = new Date().toLocaleTimeString();
    }, 1000);

    // Initialize Socket.IO connection
    function initSocket() {
      const socketUrl = window.location.origin + '/notifications';
      socket = io(socketUrl, {
        query: { userId: currentUser },
        transports: ['websocket', 'polling'],
      });

      const badge = document.getElementById('socket-badge');
      const badgeText = document.getElementById('socket-status-text');
      const socketIdPill = document.getElementById('socket-id-pill');

      socket.on('connect', () => {
        badge.className = 'flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
        badgeText.innerText = 'CONNECTED';
        socketIdPill.innerText = 'socket: ' + socket.id.substring(0, 10) + '...';
        logFooter('Connected to Socket.IO cluster namespace /notifications (ID: ' + socket.id + ')');
      });

      socket.on('disconnect', () => {
        badge.className = 'flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20';
        badgeText.innerText = 'DISCONNECTED';
        socketIdPill.innerText = 'socket: disconnected';
        logFooter('Disconnected from notification gateway');
      });

      // Listen for all notifications
      socket.on('notification', (data) => {
        handleIncomingNotification(data);
      });

      socket.on('PAYMENT_SUCCEEDED', (data) => handleIncomingNotification(data));
      socket.on('ORDER_DISPATCHED', (data) => handleIncomingNotification(data));
      socket.on('DOCUMENT_VERIFIED', (data) => handleIncomingNotification(data));
      socket.on('SECURITY_ALERT', (data) => handleIncomingNotification(data));
    }

    function handleIncomingNotification(data) {
      const emptyState = document.getElementById('empty-state');
      if (emptyState) emptyState.remove();

      messageCount++;
      document.getElementById('stat-count').innerText = messageCount;

      // Latency computation if timestamp provided
      if (data.timestamp) {
        const diff = Math.max(1, Date.now() - new Date(data.timestamp).getTime());
        document.getElementById('stat-latency').innerText = diff + ' ms';
      }

      const stream = document.getElementById('event-stream');
      const card = document.createElement('div');
      card.className = 'glass-panel rounded-xl p-4 border border-slate-800 space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300';

      const type = data.eventType || 'NOTIFICATION';
      const typeColor = type.includes('PAYMENT') ? 'emerald' : type.includes('ALERT') ? 'rose' : type.includes('ORDER') ? 'cyan' : 'brand';

      card.innerHTML = \`
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-\${typeColor}-500/10 text-\${typeColor}-400 border border-\${typeColor}-500/20">
              \${type}
            </span>
            <span class="text-slate-200 font-semibold text-xs font-sans">\${data.title || 'Event Received'}</span>
          </div>
          <span class="text-[10px] text-slate-500 font-mono">\${new Date().toLocaleTimeString()}</span>
        </div>
        <div class="bg-slate-950/70 p-3 rounded-lg border border-slate-900 text-[11px] text-slate-300 font-mono overflow-x-auto">
          <pre>\${JSON.stringify(data.payload || data, null, 2)}</pre>
        </div>
        <div class="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-0.5">
          <span>Delivery: <span class="text-emerald-400">IN_APP_SOCKET (Redis Bus)</span></span>
          <span>ID: \${data.notificationId || 'live-event'}</span>
        </div>
      \`;

      stream.prepend(card);
      logFooter('Routed ' + type + ' to room user:' + currentUser);
    }

    // Direct Dispatch
    async function dispatchNotification() {
      const btn = document.getElementById('btn-dispatch');
      const recipientId = document.getElementById('dispatch-recipient').value.trim();
      const eventType = document.getElementById('dispatch-event-type').value;
      const title = document.getElementById('dispatch-title').value.trim();
      const injectIdemp = document.getElementById('inject-idempotency').checked;

      let payload = {};
      try {
        payload = JSON.parse(document.getElementById('dispatch-payload').value);
      } catch (err) {
        alert('Invalid JSON in payload editor: ' + err.message);
        return;
      }

      btn.disabled = true;
      btn.innerText = 'Dispatching via BullMQ...';

      const requestBody = {
        recipientId,
        eventType,
        title,
        payload,
      };

      const headers = { 'Content-Type': 'application/json' };
      if (injectIdemp) {
        const idempKey = 'idemp-' + Date.now();
        headers['Idempotency-Key'] = idempKey;
        requestBody.idempotencyKey = idempKey;
      }

      try {
        const res = await fetch('/notifications/dispatch', {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
        });
        const data = await res.json();
        logFooter('Dispatched notification ID: ' + (data.data?.id || data.id));
      } catch (err) {
        logFooter('Error dispatching: ' + err.message);
      } finally {
        btn.disabled = false;
        btn.innerText = 'Enqueue via BullMQ';
      }
    }

    // HMAC Webhook Simulator
    async function triggerWebhook(mode) {
      const secret = 'whsec_09a1f28b7e654321cba9876543210fed';
      const provider = document.getElementById('webhook-provider').value.trim();
      const eventId = document.getElementById('webhook-event-id').value.trim();
      const eventType = document.getElementById('webhook-event-type').value.trim();

      let data = {};
      try {
        data = JSON.parse(document.getElementById('webhook-payload-data').value);
      } catch (e) {
        alert('Invalid Webhook JSON');
        return;
      }

      const payload = { eventId, eventType, provider, data };
      const bodyStr = JSON.stringify(payload);

      // Web Crypto HMAC SHA-256
      let signature = '';
      if (mode === 'invalid') {
        signature = 'corrupted_signature_hash_0000000000000000000000000000000000000000000000000000000000000000';
      } else {
        const enc = new TextEncoder();
        const key = await crypto.subtle.importKey(
          'raw',
          enc.encode(secret),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        );
        const sigBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(bodyStr));
        signature = Array.from(new Uint8Array(sigBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
      }

      try {
        const res = await fetch('/notifications/webhook', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-signature': signature,
            'x-timestamp': Math.floor(Date.now() / 1000).toString(),
          },
          body: bodyStr,
        });

        const resData = await res.json();
        if (res.status === 202) {
          logFooter('Webhook Accepted (HMAC verified). Log ID: ' + resData.data?.enqueuedLogId);
        } else if (res.status === 401) {
          logFooter('HMAC Verification Correctly Rejected with 401 Unauthorized!');
          alert('HTTP 401: HMAC signature verification successfully rejected corrupted payload.');
        } else if (resData.data?.status === 'DUPLICATE_ACKNOWLEDGED') {
          dedupCount++;
          document.getElementById('stat-dedup').innerText = dedupCount;
          logFooter('Idempotency Deduplication: Duplicate webhook suppressed safely.');
        }
      } catch (err) {
        logFooter('Webhook request error: ' + err.message);
      }
    }

    // Join extra channel
    function joinChannel() {
      const channel = document.getElementById('custom-channel-input').value.trim();
      if (!channel || !socket) return;
      socket.emit('subscribe_channel', { channel });
      logFooter('Sent subscription request for channel: ' + channel);
      document.getElementById('custom-channel-input').value = '';
    }

    // Clear stream
    function clearEventStream() {
      document.getElementById('event-stream').innerHTML = '<div id="empty-state" class="h-full flex flex-col items-center justify-center text-center py-16 text-slate-600"><p class="text-xs text-slate-400">Stream cleared</p></div>';
      messageCount = 0;
      document.getElementById('stat-count').innerText = 0;
      document.getElementById('stat-latency').innerText = '-- ms';
    }

    function logFooter(msg) {
      document.getElementById('console-footer-msg').innerText = '> ' + msg;
    }

    function switchTab(tab) {
      const directTab = document.getElementById('tab-content-direct');
      const webhookTab = document.getElementById('tab-content-webhook');
      const directBtn = document.getElementById('tab-btn-direct');
      const webhookBtn = document.getElementById('tab-btn-webhook');

      if (tab === 'direct') {
        directTab.classList.remove('hidden');
        webhookTab.classList.add('hidden');
        directBtn.className = 'flex-1 py-3 text-xs font-semibold text-brand-400 border-b-2 border-brand-500 transition flex items-center justify-center space-x-1.5';
        webhookBtn.className = 'flex-1 py-3 text-xs font-semibold text-slate-400 hover:text-slate-200 border-b-2 border-transparent transition flex items-center justify-center space-x-1.5';
      } else {
        directTab.classList.add('hidden');
        webhookTab.classList.remove('hidden');
        webhookBtn.className = 'flex-1 py-3 text-xs font-semibold text-emerald-400 border-b-2 border-emerald-500 transition flex items-center justify-center space-x-1.5';
        directBtn.className = 'flex-1 py-3 text-xs font-semibold text-slate-400 hover:text-slate-200 border-b-2 border-transparent transition flex items-center justify-center space-x-1.5';
      }
    }

    function resetPayloadTemplate() {
      document.getElementById('dispatch-payload').value = JSON.stringify({
        orderId: 'ORD-' + Math.floor(10000 + Math.random() * 90000),
        amount: parseFloat((Math.random() * 500).toFixed(2)),
        currency: 'USD',
        status: 'DISPATCHED_TO_CARRIER',
      }, null, 2);
    }

    // Start
    window.addEventListener('DOMContentLoaded', initSocket);
  </script>
</body>
</html>`;
  }
}
