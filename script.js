// script.js
const GH_TOKEN  = '<YOUR_GH_TOKEN>';
const REPO_OWNER = 'RylinReitz';
const REPO_NAME  = 'ControlCenter';
const BRANCH     = 'main';  // where commands.json lives
const RAW_BASE   = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}`;
const DISPATCH_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/dispatches`;

async function loadComputers() {
  try {
    const res = await fetch(`${RAW_BASE}/commands.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const list = document.getElementById('computers-list');
    const select = document.getElementById('computer-select');
    list.innerHTML = '';
    select.innerHTML = '';

    const comps = data.computers || [];
    if (comps.length === 0) {
      list.innerHTML = '<li>No computers registered.</li>';
      return;
    }

    comps.forEach(c => {
      // display “Name: status”
      const li = document.createElement('li');
      li.textContent = `${c.computer_id}: ${c.status || 'idle'}`;
      list.appendChild(li);

      // add to dropdown
      const opt = document.createElement('option');
      opt.value = c.computer_id;
      opt.textContent = c.computer_id;
      select.appendChild(opt);
    });
  } catch (e) {
    console.error('Error loading computers:', e);
    document.getElementById('computers-list').innerHTML = '<li>Error loading data.</li>';
  }
}

// toggle message box for send_message
document.getElementById('command-select')
  .addEventListener('change', e => {
    const show = e.target.value === 'send_message';
    document.getElementById('message-input-container').style.display = show ? 'block' : 'none';
  });

// dispatch a repository_dispatch event
document.getElementById('send-command')
  .addEventListener('click', async () => {
    const computer_id = document.getElementById('computer-select').value;
    const command     = document.getElementById('command-select').value;
    const detail      = command === 'send_message'
      ? document.getElementById('message-input').value.trim()
      : '';

    // we’re piggy-backing on your “update-status” event
    const statusPayload = detail
      ? `${command}:${detail}`
      : command;

    try {
      const resp = await fetch(DISPATCH_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GH_TOKEN}`,
          'User-Agent': 'ControlCenterApp'
        },
        body: JSON.stringify({
          event_type: 'update-status',
          client_payload: {
            computer_id,
            status: statusPayload
          }
        })
      });

      if (resp.status === 204) {
        alert('✅ Command dispatched!');
        await loadComputers();    // refresh statuses
      } else {
        const txt = await resp.text();
        alert(`❌ Error ${resp.status}: ${txt}`);
      }
    } catch (err) {
      console.error(err);
      alert('❌ Network or auth error.');
    }
  });

// initial load
loadComputers();
