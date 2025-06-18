// script.js
const GH_TOKEN    = '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';  // classic PAT, repo/public_repo + repo_dispatch scopes
const REPO_OWNER  = 'RylinReitz';
const REPO_NAME   = 'ControlCenter';
const BRANCH      = 'main';  
const RAW_BASE    = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}`;
const DISPATCH_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/dispatches`;

async function loadComputers() {
  const list   = document.getElementById('computers-list');
  const select = document.getElementById('computer-select');
  list.innerHTML   = '<li>Loading…</li>';
  select.innerHTML = '';

  try {
    const res = await fetch(`${RAW_BASE}/commands.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { computers } = await res.json();

    if (!computers || computers.length === 0) {
      list.innerHTML = '<li>No computers registered.</li>';
      return;
    }

    list.innerHTML = '';
    computers.forEach(c => {
      const li = document.createElement('li');
      li.textContent = `${c.computer_id}: ${c.status || 'idle'}`;
      list.appendChild(li);

      const opt = document.createElement('option');
      opt.value       = c.computer_id;
      opt.textContent = c.computer_id;
      select.appendChild(opt);
    });
  } catch(err) {
    console.error(err);
    list.innerHTML = '<li>Error loading data.</li>';
  }
}

// show message input only for send_message
document.getElementById('command-select')
  .addEventListener('change', e => {
    document.getElementById('message-input-container')
      .style.display = (e.target.value === 'send_message') ? 'block' : 'none';
  });

document.getElementById('send-command')
  .addEventListener('click', async () => {
    const computer_id = document.getElementById('computer-select').value;
    const command     = document.getElementById('command-select').value;
    const detail      = (command === 'send_message')
      ? document.getElementById('message-input').value.trim()
      : '';

    // pack command and detail into the status field
    const statusPayload = detail
      ? `${command}:${detail}`
      : command;

    // prepare payload and options
    const payload = {
      event_type: 'update-status',
      client_payload: { computer_id, status: statusPayload }
    };
    const options = {
      method: 'POST',
      headers: {
        // repo_dispatch preview header
        'Accept': 'application/vnd.github.everest-preview+json',
        'Content-Type': 'application/json',
        // classic PAT prefix
        'Authorization': `token ${GH_TOKEN}`,
        'User-Agent': 'ControlCenterApp'
      },
      body: JSON.stringify(payload)
    };

    // DEBUG LOGGING
    console.group('🔄 Dispatch Debug');
    console.log('URL:', DISPATCH_URL);
    console.log('Options:', options);
    console.log('Payload:', payload);
    console.groupEnd();

    try {
      const resp = await fetch(DISPATCH_URL, options);

      console.group('📬 Dispatch Response');
      console.log('Status:', resp.status);
      console.log('StatusText:', resp.statusText);
      console.log('Response headers:', Array.from(resp.headers.entries()));
      const text = await resp.text();
      console.log('Response body:', text);
      console.groupEnd();

      if (resp.status === 204) {
        alert('✅ Command dispatched!');
        await loadComputers();
      } else {
        alert(`❌ Error ${resp.status}: ${text}`);
      }
    } catch(err) {
      console.error('❌ Network or auth error:', err);
      alert('❌ Network or auth error. See console for details.');
    }
  });

// initial load
loadComputers();
