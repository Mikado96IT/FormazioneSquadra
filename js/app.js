(function () {
  "use strict";

  var ROSTER = window.ROSTER || [];
  var FORMATIONS = window.FORMATIONS || [];

  var state = {
    formationId: null,
    starters: [],   // array parallela agli slot del modulo: id giocatore o null
    bench: [],       // array di id giocatore
    match: { avversario: "", data: "", ora: "", luogo: "" }
  };

  var STORAGE_KEY = "formazione-titolare-state-v1";

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) { /* ambiente senza localStorage: ignora */ }
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          state = Object.assign(state, parsed);
        }
      }
    } catch (e) { /* ignora */ }
  }

  function playerById(id) {
    return ROSTER.find(function (p) { return p.id === id; });
  }

  function currentFormation() {
    return FORMATIONS.find(function (f) { return f.id === state.formationId; });
  }

  function roleGroup(role) {
    if (role === "Por") return "gk";
    if (role === "Dc" || role === "Dd" || role === "Ds") return "back";
    if (role.indexOf("A") !== -1 || role.indexOf("Pc") !== -1) return "fwd";
    if (role.indexOf("T") !== -1 || role === "W") return "am";
    return "back";
  }

  function idsInUse(excludeSlotIndex, excludeBenchIndex) {
    var used = {};
    state.starters.forEach(function (id, i) {
      if (id && i !== excludeSlotIndex) used[id] = true;
    });
    state.bench.forEach(function (id, i) {
      if (id && i !== excludeBenchIndex) used[id] = true;
    });
    return used;
  }

  // ---------- SCHERMATA 1: SCELTA MODULO ----------

  function renderFormationGrid() {
    var grid = document.getElementById("formationGrid");
    grid.innerHTML = "";
    FORMATIONS.forEach(function (f) {
      var card = document.createElement("div");
      card.className = "formation-card";
      card.innerHTML = "<h3>" + f.label + "</h3>";
      var mini = document.createElement("div");
      mini.className = "mini-pitch";
      f.slots.forEach(function (slot) {
        var tag = document.createElement("span");
        tag.className = "mini-slot " + roleGroup(slot.role);
        tag.style.left = slot.x + "%";
        tag.style.top = slot.y + "%";
        tag.textContent = slot.role;
        mini.appendChild(tag);
      });
      card.appendChild(mini);
      card.addEventListener("click", function () { chooseFormation(f.id); });
      grid.appendChild(card);
    });
  }

  function chooseFormation(id) {
    var f = FORMATIONS.find(function (x) { return x.id === id; });
    if (!f) return;
    if (state.formationId !== id) {
      state.formationId = id;
      state.starters = f.slots.map(function () { return null; });
    }
    saveState();
    showBuilder();
  }

  // ---------- SCHERMATA 2: COSTRUZIONE ----------

  function showBuilder() {
    document.getElementById("screenFormations").hidden = true;
    document.getElementById("screenBuilder").hidden = false;
    document.getElementById("btnCambiaModulo").hidden = false;
    var f = currentFormation();
    document.getElementById("formationBadge").textContent = f.label;
    renderPitch();
    renderBench();
  }

  function showFormationPicker() {
    document.getElementById("screenBuilder").hidden = true;
    document.getElementById("screenFormations").hidden = false;
    document.getElementById("btnCambiaModulo").hidden = true;
  }

  function playerAvatar(player, big) {
    if (!player) return "";
    return '<img src="' + player.img + '" alt="' + escapeHtml(player.name) + '">';
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function renderPitch() {
    var f = currentFormation();
    if (!f) return;
    var wrap = document.getElementById("pitchSlots");
    wrap.innerHTML = "";
    f.slots.forEach(function (slotDef, index) {
      var slot = document.createElement("div");
      slot.className = "slot";
      slot.style.left = slotDef.x + "%";
      slot.style.top = slotDef.y + "%";

      var playerId = state.starters[index];
      var player = playerId ? playerById(playerId) : null;

      var circle = document.createElement("div");
      circle.className = "slot-circle" + (player ? " filled" : "");
      circle.innerHTML = player ? playerAvatar(player) : "+";
      circle.addEventListener("click", function () {
        openPicker({ type: "starter", index: index, role: slotDef.role });
      });
      slot.appendChild(circle);

      if (player) {
        var removeBtn = document.createElement("button");
        removeBtn.className = "slot-remove";
        removeBtn.textContent = "×";
        removeBtn.title = "Rimuovi";
        removeBtn.addEventListener("click", function (ev) {
          ev.stopPropagation();
          state.starters[index] = null;
          saveState();
          renderPitch();
        });
        slot.appendChild(removeBtn);
      }

      var roleTag = document.createElement("span");
      roleTag.className = "slot-role " + roleGroup(slotDef.role);
      roleTag.textContent = slotDef.role;
      slot.appendChild(roleTag);

      if (player) {
        var nameTag = document.createElement("span");
        nameTag.className = "slot-name";
        nameTag.textContent = player.number + ". " + player.name;
        slot.appendChild(nameTag);
      }

      wrap.appendChild(slot);
    });
  }

  function renderBench() {
    var list = document.getElementById("benchList");
    var emptyHint = document.getElementById("benchEmpty");
    list.innerHTML = "";
    if (state.bench.length === 0) {
      emptyHint.hidden = false;
    } else {
      emptyHint.hidden = true;
    }
    state.bench.forEach(function (playerId, index) {
      var player = playerById(playerId);
      if (!player) return;
      var li = document.createElement("li");
      li.className = "bench-item";
      li.innerHTML =
        '<img src="' + player.img + '" alt="' + escapeHtml(player.name) + '">' +
        '<span class="bench-name">' + escapeHtml(player.name) + '</span>' +
        '<span class="bench-number">#' + player.number + '</span>';
      var removeBtn = document.createElement("button");
      removeBtn.className = "btn-icon";
      removeBtn.textContent = "×";
      removeBtn.title = "Rimuovi dalla panchina";
      removeBtn.addEventListener("click", function () {
        state.bench.splice(index, 1);
        saveState();
        renderBench();
      });
      li.appendChild(removeBtn);
      list.appendChild(li);
    });
  }

  // ---------- MODALE SELEZIONE GIOCATORE ----------

  var pickerContext = null;

  function openPicker(ctx) {
    pickerContext = ctx;
    var overlay = document.getElementById("pickerOverlay");
    var title = document.getElementById("pickerTitle");
    title.textContent = ctx.type === "starter"
      ? "Seleziona giocatore - ruolo " + ctx.role
      : "Aggiungi panchinaro";
    document.getElementById("pickerSearch").value = "";
    renderPickerList("");
    overlay.hidden = false;
    document.getElementById("pickerSearch").focus();
  }

  function closePicker() {
    document.getElementById("pickerOverlay").hidden = true;
    pickerContext = null;
  }

  function renderPickerList(query) {
    var list = document.getElementById("pickerList");
    list.innerHTML = "";
    var q = (query || "").trim().toLowerCase();

    var excludeSlot = pickerContext && pickerContext.type === "starter" ? pickerContext.index : -1;
    var excludeBench = pickerContext && pickerContext.type === "bench" ? pickerContext.index : -1;
    var used = idsInUse(excludeSlot, excludeBench);

    var currentId = null;
    if (pickerContext) {
      currentId = pickerContext.type === "starter"
        ? state.starters[pickerContext.index]
        : (pickerContext.index != null ? state.bench[pickerContext.index] : null);
    }

    var filtered = ROSTER.filter(function (p) {
      if (!q) return true;
      return p.name.toLowerCase().indexOf(q) !== -1 || String(p.number).indexOf(q) !== -1;
    });

    if (filtered.length === 0) {
      list.innerHTML = '<div class="picker-empty">Nessun giocatore trovato</div>';
      return;
    }

    filtered.forEach(function (p) {
      var isUsed = used[p.id] && p.id !== currentId;
      var item = document.createElement("div");
      item.className = "picker-item" + (isUsed ? " disabled" : "");
      item.innerHTML =
        '<img src="' + p.img + '" alt="' + escapeHtml(p.name) + '">' +
        '<div><div class="picker-name">' + escapeHtml(p.name) + '</div>' +
        '<div class="picker-number">Maglia #' + p.number + (isUsed ? " · gia in formazione" : "") + '</div></div>';
      if (!isUsed) {
        item.addEventListener("click", function () { selectPlayer(p.id); });
      }
      list.appendChild(item);
    });
  }

  function isLineupComplete() {
    return state.starters.length > 0 && state.starters.every(function (id) { return !!id; });
  }

  function autoFillBench() {
    if (!isLineupComplete()) return;
    var used = {};
    state.starters.forEach(function (id) { if (id) used[id] = true; });
    state.bench.forEach(function (id) { if (id) used[id] = true; });
    var remaining = ROSTER.filter(function (p) { return !used[p.id]; });
    if (remaining.length === 0) return;
    remaining.forEach(function (p) { state.bench.push(p.id); });
  }

  function selectPlayer(playerId) {
    if (!pickerContext) return;
    if (pickerContext.type === "starter") {
      state.starters[pickerContext.index] = playerId;
      autoFillBench();
      renderPitch();
      renderBench();
    } else if (pickerContext.type === "bench") {
      if (pickerContext.index != null) {
        state.bench[pickerContext.index] = playerId;
      } else {
        state.bench.push(playerId);
      }
      renderBench();
    }
    saveState();
    closePicker();
  }

  // ---------- STAMPA / PDF ----------

  function buildPrintArea() {
    var f = currentFormation();
    if (!f) return;

    document.getElementById("printFormationBadge").textContent = f.label;

    var teamName = document.getElementById("appTitle").textContent.trim() || "Formazione Titolare";
    document.getElementById("printTitle").textContent = teamName;

    var m = state.match;
    var infoParts = [];
    if (m.avversario) infoParts.push("<strong>Avversario:</strong> " + escapeHtml(m.avversario));
    if (m.data) infoParts.push("<strong>Data:</strong> " + formatDate(m.data));
    if (m.ora) infoParts.push("<strong>Ore:</strong> " + escapeHtml(m.ora));
    if (m.luogo) infoParts.push("<strong>Campo:</strong> " + escapeHtml(m.luogo));
    document.getElementById("printMatchInfo").innerHTML = infoParts.map(function (p) {
      return "<span>" + p + "</span>";
    }).join("");

    var slotsWrap = document.getElementById("printPitchSlots");
    slotsWrap.innerHTML = "";
    f.slots.forEach(function (slotDef, index) {
      var playerId = state.starters[index];
      var player = playerId ? playerById(playerId) : null;
      var slot = document.createElement("div");
      slot.className = "slot";
      slot.style.left = slotDef.x + "%";
      slot.style.top = slotDef.y + "%";
      var circle = document.createElement("div");
      circle.className = "slot-circle" + (player ? " filled" : "");
      circle.innerHTML = player ? playerAvatar(player) : "";
      slot.appendChild(circle);
      var roleTag = document.createElement("span");
      roleTag.className = "slot-role " + roleGroup(slotDef.role);
      roleTag.textContent = slotDef.role;
      slot.appendChild(roleTag);
      var nameTag = document.createElement("span");
      nameTag.className = "slot-name";
      nameTag.style.color = "#111";
      nameTag.style.textShadow = "none";
      nameTag.textContent = player ? (player.number + ". " + player.name) : "-";
      slot.appendChild(nameTag);
      slotsWrap.appendChild(slot);
    });

    var benchList = document.getElementById("printBenchList");
    benchList.innerHTML = "";
    if (state.bench.length === 0) {
      benchList.innerHTML = "<li>Nessun panchinaro</li>";
    } else {
      state.bench.forEach(function (playerId) {
        var player = playerById(playerId);
        if (!player) return;
        var li = document.createElement("li");
        li.innerHTML = '<img src="' + player.img + '" alt="">' +
          '<span>' + escapeHtml(player.name) + '</span>' +
          '<span class="bench-number">#' + player.number + '</span>';
        benchList.appendChild(li);
      });
    }
  }

  function formatDate(isoDate) {
    var parts = isoDate.split("-");
    if (parts.length !== 3) return isoDate;
    return parts[2] + "/" + parts[1] + "/" + parts[0];
  }

  function waitForImages(container) {
    var imgs = container.querySelectorAll("img");
    var promises = [];
    imgs.forEach(function (img) {
      if (img.complete) return;
      promises.push(new Promise(function (resolve) {
        img.addEventListener("load", resolve);
        img.addEventListener("error", resolve);
      }));
    });
    return Promise.all(promises);
  }

  function generatePdf() {
    var btn = document.getElementById("btnPrint");
    btn.disabled = true;
    var originalText = btn.textContent;
    btn.textContent = "Generazione PDF...";

    buildPrintArea();
    var printArea = document.getElementById("printArea");

    waitForImages(printArea).then(function () {
      return window.html2canvas(printArea, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
    }).then(function (canvas) {
      var imgData = canvas.toDataURL("image/jpeg", 0.95);
      var jsPDF = window.jspdf.jsPDF;
      var pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4"
      });
      var pageWidth = pdf.internal.pageSize.getWidth();
      var pageHeight = pdf.internal.pageSize.getHeight();
      var imgRatio = canvas.height / canvas.width;
      var imgWidth = pageWidth - 40;
      var imgHeight = imgWidth * imgRatio;
      if (imgHeight > pageHeight - 40) {
        imgHeight = pageHeight - 40;
        imgWidth = imgHeight / imgRatio;
      }
      var x = (pageWidth - imgWidth) / 2;
      var y = Math.max(20, (pageHeight - imgHeight) / 2 - 40);
      pdf.addImage(imgData, "JPEG", x, y, imgWidth, imgHeight);

      var f = currentFormation();
      var fname = "formazione";
      if (state.match.avversario) fname += "-vs-" + slugify(state.match.avversario);
      if (state.match.data) fname += "-" + state.match.data;
      pdf.save(fname + ".pdf");
    }).catch(function (err) {
      console.error(err);
      alert("Si e verificato un errore nella generazione del PDF. Riprova.");
    }).finally(function () {
      btn.disabled = false;
      btn.textContent = originalText;
    });
  }

  function slugify(s) {
    return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  // ---------- INIT ----------

  function bindMatchInfoInputs() {
    var map = {
      infAvversario: "avversario",
      infData: "data",
      infOra: "ora",
      infLuogo: "luogo"
    };
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      el.value = state.match[map[id]] || "";
      el.addEventListener("input", function () {
        state.match[map[id]] = el.value;
        saveState();
      });
    });
  }

  function init() {
    loadState();
    renderFormationGrid();
    bindMatchInfoInputs();

    document.getElementById("btnCambiaModulo").addEventListener("click", showFormationPicker);
    document.getElementById("btnReset").addEventListener("click", function () {
      if (!confirm("Vuoi azzerare la formazione e la panchina?")) return;
      var f = currentFormation();
      state.starters = f ? f.slots.map(function () { return null; }) : [];
      state.bench = [];
      saveState();
      renderPitch();
      renderBench();
    });
    document.getElementById("btnAddBench").addEventListener("click", function () {
      openPicker({ type: "bench", index: null });
    });
    document.getElementById("btnPrint").addEventListener("click", generatePdf);
    document.getElementById("pickerClose").addEventListener("click", closePicker);
    document.getElementById("pickerOverlay").addEventListener("click", function (ev) {
      if (ev.target.id === "pickerOverlay") closePicker();
    });
    document.getElementById("pickerSearch").addEventListener("input", function (ev) {
      renderPickerList(ev.target.value);
    });

    if (state.formationId && currentFormation()) {
      // ripristina eventuale formazione salvata in precedenza
      if (state.starters.length !== currentFormation().slots.length) {
        state.starters = currentFormation().slots.map(function () { return null; });
      }
      showBuilder();
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
