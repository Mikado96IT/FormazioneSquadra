(function () {
  "use strict";

  var ROSTER = window.ROSTER || [];
  var FORMATIONS = window.FORMATIONS || [];

  var state = {
    formationId: null,
    starters: [],   // array parallela agli slot del modulo: id giocatore o null
    bench: [],       // array di id giocatore
    captainId: null,
    viceCaptainId: null,
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
    renderRoster();
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
          renderRoster();
        });
        slot.appendChild(removeBtn);

        slot.appendChild(buildCapBadges(player.id));

        var roleTagOverlay = document.createElement("span");
        roleTagOverlay.className = "slot-role tag-overlay " + roleGroup(slotDef.role);
        roleTagOverlay.textContent = slotDef.role;
        circle.appendChild(roleTagOverlay);

        var nameTag = document.createElement("span");
        nameTag.className = "slot-name tag-overlay";
        nameTag.textContent = player.number + ". " + player.name;
        nameTag.appendChild(capNameBadge(player.id));
        circle.appendChild(nameTag);
      } else {
        var roleTag = document.createElement("span");
        roleTag.className = "slot-role " + roleGroup(slotDef.role);
        roleTag.textContent = slotDef.role;
        slot.appendChild(roleTag);
      }

      wrap.appendChild(slot);
    });
  }

  // ---------- CAPITANO / VICE CAPITANO ----------

  function setCaptain(playerId) {
    if (state.captainId === playerId) {
      state.captainId = null;
    } else {
      state.captainId = playerId;
      if (state.viceCaptainId === playerId) state.viceCaptainId = null;
    }
    saveState();
    renderPitch();
    renderBench();
    renderRoster();
  }

  function setViceCaptain(playerId) {
    if (state.viceCaptainId === playerId) {
      state.viceCaptainId = null;
    } else {
      state.viceCaptainId = playerId;
      if (state.captainId === playerId) state.captainId = null;
    }
    saveState();
    renderPitch();
    renderBench();
    renderRoster();
  }

  function buildCapBadges(playerId) {
    var wrap = document.createElement("div");
    wrap.className = "cap-badges";
    var cBtn = document.createElement("button");
    cBtn.type = "button";
    cBtn.className = "cap-badge" + (state.captainId === playerId ? " active-c" : "");
    cBtn.textContent = "C";
    cBtn.title = "Capitano";
    cBtn.addEventListener("click", function (ev) { ev.stopPropagation(); setCaptain(playerId); });
    var vBtn = document.createElement("button");
    vBtn.type = "button";
    vBtn.className = "cap-badge" + (state.viceCaptainId === playerId ? " active-v" : "");
    vBtn.textContent = "V";
    vBtn.title = "Vice capitano";
    vBtn.addEventListener("click", function (ev) { ev.stopPropagation(); setViceCaptain(playerId); });
    wrap.appendChild(cBtn);
    wrap.appendChild(vBtn);
    return wrap;
  }

  function capNameBadge(playerId) {
    var span = document.createElement("span");
    if (state.captainId === playerId) {
      span.className = "name-tag-badge c";
      span.textContent = "C";
    } else if (state.viceCaptainId === playerId) {
      span.className = "name-tag-badge v";
      span.textContent = "V";
    }
    return span;
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
      li.querySelector(".bench-name").appendChild(capNameBadge(player.id));

      var actions = document.createElement("div");
      actions.className = "bench-cap-actions";

      var cBtn = document.createElement("button");
      cBtn.type = "button";
      cBtn.className = "bench-cap-btn" + (state.captainId === player.id ? " active-c" : "");
      cBtn.textContent = "C";
      cBtn.title = "Capitano";
      cBtn.addEventListener("click", function () { setCaptain(player.id); });

      var vBtn = document.createElement("button");
      vBtn.type = "button";
      vBtn.className = "bench-cap-btn" + (state.viceCaptainId === player.id ? " active-v" : "");
      vBtn.textContent = "V";
      vBtn.title = "Vice capitano";
      vBtn.addEventListener("click", function () { setViceCaptain(player.id); });

      var fieldBtn = document.createElement("button");
      fieldBtn.type = "button";
      fieldBtn.className = "btn btn-ghost btn-tiny";
      fieldBtn.textContent = "⚽ Campo";
      fieldBtn.title = "Metti in campo";
      fieldBtn.addEventListener("click", function () { placeOnPitch(player.id, index); });

      var removeBtn = document.createElement("button");
      removeBtn.className = "btn-icon";
      removeBtn.textContent = "×";
      removeBtn.title = "Rimuovi dalla panchina";
      removeBtn.addEventListener("click", function () {
        state.bench.splice(index, 1);
        saveState();
        renderBench();
        renderRoster();
      });

      actions.appendChild(cBtn);
      actions.appendChild(vBtn);
      actions.appendChild(fieldBtn);
      actions.appendChild(removeBtn);
      li.appendChild(actions);
      list.appendChild(li);
    });
  }

  // ---------- ROSA SQUADRA (sotto la panchina) ----------

  function firstEmptySlotIndex() {
    for (var i = 0; i < state.starters.length; i++) {
      if (!state.starters[i]) return i;
    }
    return -1;
  }

  function placeOnPitch(playerId, fromBenchIndex) {
    var idx = firstEmptySlotIndex();
    if (idx === -1) {
      alert("Non ci sono posti liberi in campo. Rimuovi prima un giocatore dal campo.");
      return;
    }
    state.starters[idx] = playerId;
    if (fromBenchIndex != null && fromBenchIndex > -1) {
      state.bench.splice(fromBenchIndex, 1);
    }
    autoFillBench();
    saveState();
    renderPitch();
    renderBench();
    renderRoster();
  }

  function addToBenchDirect(playerId) {
    if (state.bench.indexOf(playerId) !== -1) return;
    state.bench.push(playerId);
    saveState();
    renderBench();
    renderRoster();
  }

  function renderRoster() {
    var list = document.getElementById("rosterList");
    if (!list) return;
    list.innerHTML = "";

    var starterIds = {};
    state.starters.forEach(function (id) { if (id) starterIds[id] = true; });
    var benchIds = {};
    state.bench.forEach(function (id) { if (id) benchIds[id] = true; });

    ROSTER.forEach(function (player) {
      var li = document.createElement("li");
      li.className = "bench-item roster-item";

      var isStarter = !!starterIds[player.id];
      var isBench = !!benchIds[player.id];

      li.innerHTML =
        '<img src="' + player.img + '" alt="' + escapeHtml(player.name) + '">' +
        '<span class="bench-name">' + escapeHtml(player.name) + '</span>' +
        '<span class="bench-number">#' + player.number + '</span>';
      li.querySelector(".bench-name").appendChild(capNameBadge(player.id));

      var status = document.createElement("span");
      if (isStarter) {
        status.className = "roster-status status-starter";
        status.textContent = "Titolare";
      } else if (isBench) {
        status.className = "roster-status status-bench";
        status.textContent = "Panchina";
      } else {
        status.className = "roster-status status-free";
        status.textContent = "Disponibile";
      }
      li.appendChild(status);

      if (!isStarter) {
        var actions = document.createElement("div");
        actions.className = "bench-cap-actions";

        var fieldBtn = document.createElement("button");
        fieldBtn.type = "button";
        fieldBtn.className = "btn btn-ghost btn-tiny";
        fieldBtn.textContent = "⚽ Campo";
        fieldBtn.title = "Metti in campo";
        fieldBtn.addEventListener("click", function () {
          placeOnPitch(player.id, isBench ? state.bench.indexOf(player.id) : null);
        });
        actions.appendChild(fieldBtn);

        if (!isBench) {
          var benchBtn = document.createElement("button");
          benchBtn.type = "button";
          benchBtn.className = "btn btn-ghost btn-tiny";
          benchBtn.textContent = "+ Panchina";
          benchBtn.title = "Aggiungi in panchina";
          benchBtn.addEventListener("click", function () { addToBenchDirect(player.id); });
          actions.appendChild(benchBtn);
        }
        li.appendChild(actions);
      }

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
    renderRoster();
    saveState();
    closePicker();
  }

  // ---------- STAMPA / PDF ----------

  function buildPrintArea() {
    var f = currentFormation();
    if (!f) return;

    document.getElementById("printFormationBadge").textContent = f.label;

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

      if (player && (state.captainId === player.id || state.viceCaptainId === player.id)) {
        var cornerBadge = document.createElement("div");
        cornerBadge.className = "cap-badges";
        var staticBtn = document.createElement("span");
        staticBtn.className = "cap-badge " + (state.captainId === player.id ? "active-c" : "active-v");
        staticBtn.textContent = state.captainId === player.id ? "C" : "V";
        cornerBadge.appendChild(staticBtn);
        circle.appendChild(cornerBadge);
      }

      if (player) {
        var roleTagOverlay = document.createElement("span");
        roleTagOverlay.className = "slot-role tag-overlay " + roleGroup(slotDef.role);
        roleTagOverlay.textContent = slotDef.role;
        circle.appendChild(roleTagOverlay);

        var nameTag = document.createElement("span");
        nameTag.className = "slot-name tag-overlay";
        nameTag.textContent = player.number + ". " + player.name;
        nameTag.appendChild(capNameBadge(player.id));
        circle.appendChild(nameTag);
      } else {
        var roleTag = document.createElement("span");
        roleTag.className = "slot-role " + roleGroup(slotDef.role);
        roleTag.textContent = slotDef.role;
        slot.appendChild(roleTag);
      }
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
        li.querySelector("span").appendChild(capNameBadge(player.id));
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
        orientation: "landscape",
        unit: "pt",
        format: "a3"
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
      var y = (pageHeight - imgHeight) / 2;
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

  function applyLogo() {
    var uri = window.LOGO_DATA_URI;
    if (!uri) return;
    ["introLogo", "logoHeader", "printLogo"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.src = uri;
    });
    var favicon = document.getElementById("favicon");
    if (favicon) favicon.href = uri;

    var bgUri = window.LOGIN_BG_DATA_URI;
    if (bgUri) {
      var introScreen = document.getElementById("introScreen");
      if (introScreen) {
        introScreen.style.backgroundImage =
          "linear-gradient(180deg, rgba(3,20,40,0.55) 0%, rgba(2,15,35,0.72) 55%, rgba(0,10,25,0.88) 100%), url('" + bgUri + "')";
      }
    }
  }

  function enterApp() {
    document.getElementById("introScreen").hidden = true;
    document.getElementById("topbar").hidden = false;
    document.getElementById("app").hidden = false;
  }

  // ---------- ACCESSO RISERVATO ----------
  // La password non è salvata in chiaro: viene confrontata tramite l'hash
  // SHA-256 di "utente:password", calcolato con l'API Web Crypto del browser.
  var AUTH_SESSION_KEY = "anmic-auth-ok";
  var CREDENTIAL_HASH = "a58a97c2e2582739bb1c1b517b0f115be1838498227c9b742f092dfb7f065a55";

  function sha256Hex(text) {
    if (!window.crypto || !window.crypto.subtle) {
      return Promise.reject(new Error("no-subtle-crypto"));
    }
    var data = new TextEncoder().encode(text);
    return window.crypto.subtle.digest("SHA-256", data).then(function (buf) {
      var bytes = Array.from(new Uint8Array(buf));
      return bytes.map(function (b) { return b.toString(16).padStart(2, "0"); }).join("");
    });
  }

  function isAlreadyLoggedIn() {
    try {
      return sessionStorage.getItem(AUTH_SESSION_KEY) === "1";
    } catch (e) {
      return false;
    }
  }

  function markLoggedIn() {
    try { sessionStorage.setItem(AUTH_SESSION_KEY, "1"); } catch (e) { /* ignora */ }
  }

  function initLogin() {
    if (isAlreadyLoggedIn()) {
      enterApp();
      return;
    }
    var form = document.getElementById("loginForm");
    var errorEl = document.getElementById("loginError");
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      errorEl.textContent = "";
      var user = document.getElementById("loginUser").value.trim();
      var pass = document.getElementById("loginPass").value;
      if (!user || !pass) return;
      sha256Hex(user + ":" + pass).then(function (hash) {
        if (hash === CREDENTIAL_HASH) {
          markLoggedIn();
          enterApp();
        } else {
          errorEl.textContent = "Nome utente o password non corretti.";
          document.getElementById("loginPass").value = "";
          document.getElementById("loginPass").focus();
        }
      }).catch(function () {
        errorEl.textContent = "Il browser non supporta l'accesso sicuro. Aggiorna Chrome o Edge.";
      });
    });
  }

  function init() {
    applyLogo();
    loadState();
    renderFormationGrid();
    bindMatchInfoInputs();
    initLogin();

    document.getElementById("btnCambiaModulo").addEventListener("click", showFormationPicker);
    document.getElementById("btnReset").addEventListener("click", function () {
      if (!confirm("Vuoi azzerare la formazione e la panchina?")) return;
      var f = currentFormation();
      state.starters = f ? f.slots.map(function () { return null; }) : [];
      state.bench = [];
      state.captainId = null;
      state.viceCaptainId = null;
      saveState();
      renderPitch();
      renderBench();
      renderRoster();
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
