const closeModalBtn = document.getElementById("closeModal");
const modal = document.getElementById("modal");
const saveBtn = document.getElementById("saveShortcut");
const urlInput = document.getElementById("urlInput");
const imgInput = document.getElementById("imgInput");
const imgPreview = document.getElementById("imgPreview");
const zoomRange = document.getElementById("zoomRange");
const shortcutsContainer = document.getElementById("shortcuts");
const lockBtn = document.getElementById("lockBtn");

let isLocked = true;
let selectedRow = null;
let selectedCol = null;

// --- Modal control ---
closeModalBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
  modal.close();
});

document.querySelectorAll('.add-btn').forEach((btn, idx) => {
    btn.addEventListener('click', (e) => {
        selectedRow = parseInt(btn.dataset.row, 10) - 1;
        selectedCol = 0; // Toujours la première case vide de la ligne
        modal.classList.remove("hidden");
        modal.showModal();
    });
});

// Preview image live
imgInput.addEventListener("input", () => {
  imgPreview.src = imgInput.value;
});
zoomRange.addEventListener("input", () => {
  imgPreview.style.transform = `scale(${zoomRange.value / 100})`;
});

// --- Save shortcut ---
saveBtn.addEventListener("click", () => {
  const url = urlInput.value.trim();
  const img = imgInput.value.trim();
  if (!url || !img || selectedRow === null) return;

  const id = Date.now().toString();
  const shortcut = { id, url, img, zoom: zoomRange.value, row: selectedRow, col: selectedCol };

  chrome.storage.sync.set({ [id]: shortcut }, () => {
    console.log("Raccourci ajouté :", shortcut);
    renderShortcuts();
    modal.classList.add("hidden");
    urlInput.value = "";
    imgInput.value = "";
    imgPreview.src = "";
    zoomRange.value = 100;
    selectedRow = null;
    selectedCol = null;
  });
});

// --- Render shortcuts ---
function renderShortcuts() {
  chrome.storage.sync.get(null, (items) => {
    // Réinitialise la grille
    shortcutsContainer.innerHTML = "";

    // Organise les raccourcis par ligne/colonne
    const grid = [[], [], [], []];
    Object.values(items).forEach(sc => {
      if (typeof sc.row === "number" && typeof sc.col === "number") {
        grid[sc.row][sc.col] = sc;
      }
    });

    for (let row = 0; row < 4; row++) {
      const rowDiv = document.createElement("div");
      rowDiv.className = "shortcut-row";
      let plusPlaced = false;

      for (let col = 0; col < 5; col++) {
        const box = document.createElement("div");
        box.className = "shortcut-box";

        const sc = grid[row][col];
        if (sc) {
          const link = document.createElement("a");
          link.href = sc.url;
          link.target = "_blank";
          link.className = "shortcut";
          link.style.backgroundImage = `url(${sc.img})`;
          link.style.backgroundSize = `${sc.zoom || 100}% auto`;
          link.textContent = "";

          if (!isLocked) {
            const delBtn = document.createElement("button");
            delBtn.textContent = "❌";
            delBtn.className = "delete-btn";
            delBtn.addEventListener("click", (e) => {
              e.preventDefault();
              chrome.storage.sync.remove(sc.id, () => renderShortcuts());
            });
            link.appendChild(delBtn);
          }
          box.appendChild(link);
        } else if (!plusPlaced && !isLocked) { // <-- Ajoute !isLocked ici
          // Place le bouton "+" sur la première case vide seulement si déverrouillé
          const addBtn = document.createElement("button");
          addBtn.className = "add-btn";
          addBtn.textContent = "+";
          addBtn.dataset.row = row + 1;
          addBtn.addEventListener("click", () => {
            selectedRow = row;
            selectedCol = col;
            modal.classList.remove("hidden");
            modal.showModal();
          });
          box.appendChild(addBtn);
          plusPlaced = true;
        }
        rowDiv.appendChild(box);
      }
      shortcutsContainer.appendChild(rowDiv);
    }
  });
}

// --- Lock / Unlock sidebar ---
lockBtn.addEventListener("click", () => {
  isLocked = !isLocked;
  lockBtn.textContent = isLocked ? "🔒 Lock" : "🔓 Unlock";
  renderShortcuts();
});

// --- Date & Heure ---
function updateDateTime() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = now.toLocaleDateString('fr-FR', options);
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    document.getElementById('datetime').textContent = `${dateStr} ${timeStr}`;
}
setInterval(updateDateTime, 1000);
updateDateTime();

// --- Température (Open-Meteo, Paris par défaut) ---
function updateTemperature() {
    // Coordonnées Paris, France
    fetch('https://api.open-meteo.com/v1/forecast?latitude=48.85&longitude=2.35&current_weather=true')
        .then(res => res.json())
        .then(data => {
            if (data.current_weather && data.current_weather.temperature !== undefined) {
                document.getElementById('temperature').textContent =
                    `🌡️ ${data.current_weather.temperature}°C à Paris`;
            } else {
                document.getElementById('temperature').textContent = 'Température indisponible';
            }
        })
        .catch(() => {
            document.getElementById('temperature').textContent = 'Température indisponible';
        });
}
updateTemperature();
setInterval(updateTemperature, 10 * 60 * 1000); // toutes les 10 minutes

// Initial render
renderShortcuts();
