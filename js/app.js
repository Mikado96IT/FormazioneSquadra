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
    retriggerAnimClass(document.querySelector("#screenBuilder .match-info"), "section-pop");
    retriggerAnimClass(document.querySelector("#screenBuilder .pitch-wrap"), "section-pop");
    retriggerAnimClass(document.querySelector("#screenBuilder .bench-wrap"), "section-pop");
  }

  function showFormationPicker() {
    document.getElementById("screenBuilder").hidden = true;
    document.getElementById("screenFormations").hidden = false;
    document.getElementById("btnCambiaModulo").hidden = true;
    retriggerAnimClass(document.querySelector("#screenFormations .section-heading"), "fade-drop-in");
    animateFormationCards();
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

  function emptySlotIndexes() {
    var out = [];
    state.starters.forEach(function (id, i) { if (!id) out.push(i); });
    return out;
  }

  function assignToSlot(playerId, idx, fromBenchIndex) {
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

  // Manda un giocatore in campo: se c'e' piu' di un posto libero, chiede
  // sempre in quale ruolo/posizione schierarlo invece di sceglierlo da solo.
  function placeOnPitch(playerId, fromBenchIndex) {
    var f = currentFormation();
    if (!f) return;
    var empties = emptySlotIndexes();
    if (empties.length === 0) {
      alert("Non ci sono posti liberi in campo. Rimuovi prima un giocatore dal campo.");
      return;
    }
    if (empties.length === 1) {
      assignToSlot(playerId, empties[0], fromBenchIndex);
      return;
    }

    var player = playerById(playerId);
    slotPickerContext = { playerId: playerId, fromBenchIndex: fromBenchIndex };
    document.getElementById("slotPickerTitle").textContent =
      player ? "In che ruolo scende in campo " + player.name + "?" : "Scegli la posizione in campo";

    var list = document.getElementById("slotPickerList");
    list.innerHTML = "";
    empties.forEach(function (idx) {
      var slotDef = f.slots[idx];
      var item = document.createElement("div");
      item.className = "picker-item slot-picker-item";
      var chip = document.createElement("span");
      chip.className = "slot-role-chip " + roleGroup(slotDef.role);
      chip.textContent = slotDef.role;
      var label = document.createElement("span");
      label.className = "picker-name";
      label.textContent = "Posizione " + (idx + 1);
      item.appendChild(chip);
      item.appendChild(label);
      item.addEventListener("click", function () {
        assignToSlot(playerId, idx, fromBenchIndex);
        closeSlotPicker();
      });
      list.appendChild(item);
    });
    openOverlay("slotPickerOverlay");
  }

  var slotPickerContext = null;

  function closeSlotPicker() {
    closeOverlay("slotPickerOverlay");
    slotPickerContext = null;
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

  // ---------- APERTURA/CHIUSURA ANIMATA DELLE MODALI ----------
  function openOverlay(id) {
    var el = document.getElementById(id);
    el.hidden = false;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        el.classList.add("show");
      });
    });
  }

  function closeOverlay(id) {
    var el = document.getElementById(id);
    el.classList.remove("show");
    setTimeout(function () { el.hidden = true; }, 220);
  }

  function openPicker(ctx) {
    pickerContext = ctx;
    var title = document.getElementById("pickerTitle");
    title.textContent = ctx.type === "starter"
      ? "Seleziona giocatore - ruolo " + ctx.role
      : "Aggiungi panchinaro";
    document.getElementById("pickerSearch").value = "";
    renderPickerList("");
    openOverlay("pickerOverlay");
    document.getElementById("pickerSearch").focus();
  }

  function closePicker() {
    closeOverlay("pickerOverlay");
    pickerContext = null;
  }

  // ---------- MODALE "COME FUNZIONA" ----------
  var HOW_TO_STEPS = [
    { icon: "⚙️", title: "1. Scegli il modulo", text: "Seleziona lo schieramento tattico con cui vuoi scendere in campo (es. 4-4-2, 4-3-3, 4-2-3-1...)." },
    { icon: "🧑‍🤝‍🧑", title: "2. Piazza i giocatori", text: "Clicca su un ruolo vuoto in campo per scegliere chi ci gioca, oppure manda direttamente in campo un giocatore dalla Panchina o dalla Rosa Squadra." },
    { icon: "🎖️", title: "3. Capitano e vice", text: "Usa i pulsanti C / V su ogni giocatore per assegnare la fascia da capitano e da vice capitano: comparirà anche sul campo e nel PDF." },
    { icon: "🔄", title: "4. Cambia modulo al volo", text: "Clicca sul cartellino del modulo (es. 4-2-3-1) sopra il campo, oppure su \"Cambia modulo\" in alto, per cambiarlo in qualsiasi momento." },
    { icon: "🖨️", title: "5. Stampa o scarica il PDF", text: "Quando la formazione è pronta, premi \"Stampa / Scarica PDF\" per esportare tutto pronto da condividere con la squadra." }
  ];

  function renderHowTo() {
    var wrap = document.getElementById("howToSteps");
    wrap.innerHTML = "";
    HOW_TO_STEPS.forEach(function (step, i) {
      var row = document.createElement("div");
      row.className = "howto-step";
      row.style.animationDelay = (i * 90) + "ms";
      var icon = document.createElement("span");
      icon.className = "howto-icon";
      icon.textContent = step.icon;
      var text = document.createElement("div");
      text.className = "howto-text";
      text.innerHTML = "<h4>" + step.title + "</h4><p>" + step.text + "</p>";
      row.appendChild(icon);
      row.appendChild(text);
      wrap.appendChild(row);
    });
  }

  function openHowTo() {
    renderHowTo();
    openOverlay("howToOverlay");
  }

  function closeHowTo() {
    closeOverlay("howToOverlay");
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

    var captainsWrap = document.getElementById("printCaptains");
    captainsWrap.innerHTML = "";
    var captain = state.captainId ? playerById(state.captainId) : null;
    var vice = state.viceCaptainId ? playerById(state.viceCaptainId) : null;
    [
      { player: captain, label: "Capitano", cls: "" },
      { player: vice, label: "Vice capitano", cls: "vice" }
    ].forEach(function (entry) {
      if (!entry.player) return;
      var card = document.createElement("div");
      card.className = "print-captain-card " + entry.cls;
      card.innerHTML =
        '<img src="' + entry.player.img + '" alt="">' +
        '<div><p class="print-captain-label">' + entry.label + '</p>' +
        '<p class="print-captain-name">' + entry.player.number + ". " + escapeHtml(entry.player.name) + '</p></div>';
      captainsWrap.appendChild(card);
    });
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
    // Sfondo schermata iniziale: bianco pulito (l'immagine ANMIC/Vesuvio non viene piu' usata qui).
  }

  function enterApp() {
    var intro = document.getElementById("introScreen");
    if (intro.classList.contains("intro-exit")) return; // evita doppio click
    intro.classList.add("intro-exit");

    var done = false;
    function reveal() {
      if (done) return;
      done = true;
      intro.hidden = true;
      document.getElementById("topbar").hidden = false;
      document.getElementById("app").hidden = false;
      playEntranceAnimation();
    }
    intro.addEventListener("animationend", reveal, { once: true });
    setTimeout(reveal, 700); // rete di sicurezza se l'animazione non parte
  }

  // Ingresso "cinematico" a step dei blocchi principali dopo il click sul logo
  function playEntranceAnimation() {
    retriggerAnimClass(document.getElementById("topbar"), "fade-drop-in");
    var builderVisible = !document.getElementById("screenBuilder").hidden;
    if (builderVisible) {
      retriggerAnimClass(document.querySelector("#screenBuilder .match-info"), "section-pop");
      retriggerAnimClass(document.querySelector("#screenBuilder .pitch-wrap"), "section-pop");
      retriggerAnimClass(document.querySelector("#screenBuilder .bench-wrap"), "section-pop");
    } else {
      retriggerAnimClass(document.querySelector("#screenFormations .section-heading"), "fade-drop-in");
      animateFormationCards();
    }
  }

  function retriggerAnimClass(el, cls) {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth; // forza il reflow per poter far ripartire l'animazione
    el.classList.add(cls);
  }

  function animateFormationCards() {
    var cards = document.querySelectorAll("#formationGrid .formation-card");
    cards.forEach(function (card, i) {
      card.classList.remove("card-pop-in");
      void card.offsetWidth;
      card.style.animationDelay = (i * 55) + "ms";
      card.classList.add("card-pop-in");
    });
  }

  // ---------- SCHERMATA INIZIALE ----------
  // Nessun accesso riservato: si clicca/tocca il logo per entrare nel sito.
  function initIntro() {
    var intro = document.getElementById("introScreen");
    intro.addEventListener("click", enterApp);
    intro.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        enterApp();
      }
    });
  }

  function init() {
    applyLogo();
    loadState();
    renderFormationGrid();
    bindMatchInfoInputs();
    initIntro();

    document.getElementById("btnCambiaModulo").addEventListener("click", showFormationPicker);
    document.getElementById("formationBadge").addEventListener("click", showFormationPicker);
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

    document.getElementById("btnHowItWorks").addEventListener("click", openHowTo);
    document.getElementById("howToClose").addEventListener("click", closeHowTo);
    document.getElementById("howToGotIt").addEventListener("click", closeHowTo);
    document.getElementById("howToOverlay").addEventListener("click", function (ev) {
      if (ev.target.id === "howToOverlay") closeHowTo();
    });
    document.getElementById("slotPickerClose").addEventListener("click", closeSlotPicker);
    document.getElementById("slotPickerOverlay").addEventListener("click", function (ev) {
      if (ev.target.id === "slotPickerOverlay") closeSlotPicker();
    });
    document.addEventListener("keydown", function (ev) {
      if (ev.key !== "Escape") return;
      if (!document.getElementById("howToOverlay").hidden) closeHowTo();
      else if (!document.getElementById("slotPickerOverlay").hidden) closeSlotPicker();
      else if (!document.getElementById("pickerOverlay").hidden) closePicker();
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
