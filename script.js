async function loadComputers() {
    const response = await fetch('commands.json');
    const data = await response.json();
    const computerList = document.getElementById('computer-list');
    const computerSelect = document.getElementById('computer-select');

    computerList.innerHTML = '';
    computerSelect.innerHTML = '';

    data.computers.forEach(comp => {
        computerList.innerHTML += `<li>${comp.name}: ${comp.status}</li>`;
        computerSelect.innerHTML += `<option value="${comp.id}">${comp.name}</option>`;
    });
}

async function issueCommand() {
    const computer = document.getElementById('computer-select').value;
    const commandType = document.getElementById('command-select').value;
    const detail = document.getElementById('command-input').value;

    // Update commands.json manually, since GitHub Pages is static.
    alert(`Update commands.json with: Computer=${computer}, Command=${commandType}, Detail=${detail}`);
}

loadComputers();
