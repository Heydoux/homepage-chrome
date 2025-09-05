const openModalBtn = document.getElementById("openModal");
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

// --- Modal control ---
openModalBtn.addEventListener("click", () => {
  modal.classList.remove("hidden");
  modal.showModal();
});
closeModalBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
  modal.close();
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
  if (!url || !img) return;

  const id = Date.now().toString();
  const shortcut = { id, url, img, zoom: zoomRange.value };

  chrome.storage.sync.set({ [id]: shortcut }, () => {
    console.log("Raccourci ajouté :", shortcut);
    renderShortcuts();
    modal.classList.add("hidden");
    urlInput.value = "";
    imgInput.value = "";
    imgPreview.src = "";
    zoomRange.value = 100;
  });
});

// --- Render shortcuts ---
function renderShortcuts() {
  shortcutsContainer.innerHTML = "";
  chrome.storage.sync.get(null, (items) => {
    const shortcuts = Object.values(items);

    shortcuts.forEach((sc) => {
      const link = document.createElement("a");
      link.href = sc.url;
      link.target = "_blank";
      link.className = "shortcut";
      link.style.backgroundImage = `url(${sc.img})`;
      link.style.backgroundSize = `${sc.zoom || 100}% auto`;
      link.textContent = "";

      if (!isLocked) {
        // Ajouter bouton suppression
        const delBtn = document.createElement("button");
        delBtn.textContent = "❌";
        delBtn.className = "delete-btn";
        delBtn.addEventListener("click", (e) => {
          e.preventDefault();
          chrome.storage.sync.remove(sc.id, () => renderShortcuts());
        });
        link.appendChild(delBtn);
      }

      shortcutsContainer.appendChild(link);
    });
  });
}

// --- Lock / Unlock sidebar ---
lockBtn.addEventListener("click", () => {
  isLocked = !isLocked;
  lockBtn.textContent = isLocked ? "🔒 Lock" : "🔓 Unlock";
  renderShortcuts();
});

// Initial render
renderShortcuts();
