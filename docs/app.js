const CAPACITY = 25;
const RATES = [1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1];
const AUTO_CLEAR_THRESHOLD = 0.8;
const AUTO_CLEAR_AFTER_MINUTES = 4 * 60;

const state = {
  cars: [],
  revenue: 0,
  speed: 7,
  elapsedMinutes: 0,
  timeAnchor: Date.now(),
  closed: false
};

const elements = {
  clock: document.querySelector("#clock"),
  speed: document.querySelector("#speed"),
  speedValue: document.querySelector("#speed-value"),
  occupancy: document.querySelector("#occupancy"),
  occupancyBar: document.querySelector("#occupancy-bar"),
  occupancyCopy: document.querySelector("#occupancy-copy"),
  revenue: document.querySelector("#revenue"),
  elapsedCopy: document.querySelector("#elapsed-copy"),
  parkingSlots: document.querySelector("#parking-slots"),
  vehicleList: document.querySelector("#vehicle-list"),
  vehicleCount: document.querySelector("#vehicle-count"),
  carSelect: document.querySelector("#car-select"),
  parkForm: document.querySelector("#park-form"),
  exitForm: document.querySelector("#exit-form"),
  carId: document.querySelector("#car-id"),
  notice: document.querySelector("#notice"),
  activityList: document.querySelector("#activity-list"),
  demoButton: document.querySelector("#demo-button"),
  previewButton: document.querySelector("#preview-button"),
  closeButton: document.querySelector("#close-button"),
  openButton: document.querySelector("#open-button"),
  openState: document.querySelector("#open-state"),
  summaryDialog: document.querySelector("#summary-dialog"),
  dialogEyebrow: document.querySelector("#dialog-eyebrow"),
  dialogTitle: document.querySelector("#dialog-title"),
  dialogCopy: document.querySelector("#dialog-copy"),
  dialogTotal: document.querySelector("#dialog-total"),
  confirmClose: document.querySelector("#confirm-close")
};

const euro = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function elapsedMinutes() {
  return state.elapsedMinutes + ((Date.now() - state.timeAnchor) / 1000) * state.speed;
}

function clockTime(minutes = elapsedMinutes()) {
  const total = 8 * 60 + Math.floor(minutes);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function chargeFor(durationMinutes) {
  const wholeHours = Math.trunc(durationMinutes / 60);
  let amount = RATES[0];
  for (let hour = 1; hour < Math.min(wholeHours, RATES.length); hour++) {
    amount += RATES[hour];
  }
  return amount;
}

function formatDuration(minutes) {
  const wholeMinutes = Math.max(0, Math.floor(minutes));
  const hours = Math.floor(wholeMinutes / 60);
  const remainder = wholeMinutes % 60;
  return hours ? `${hours} Std. ${String(remainder).padStart(2, "0")} Min.` : `${remainder} Min.`;
}

function addActivity(message) {
  const item = document.createElement("li");
  item.append(document.createTextNode(message));
  const time = document.createElement("time");
  time.textContent = clockTime();
  item.append(time);
  elements.activityList.prepend(item);
  while (elements.activityList.children.length > 8) elements.activityList.lastElementChild.remove();
}

function render() {
  const now = elapsedMinutes();
  const count = state.cars.length;
  const occupancy = Math.round((count / CAPACITY) * 100);
  const openMenuCarId = elements.parkingSlots.querySelector(".slot-menu[open]")?.dataset.carId;
  elements.clock.textContent = clockTime(now);
  elements.occupancy.textContent = String(count);
  elements.occupancyBar.style.width = `${occupancy}%`;
  elements.occupancyCopy.textContent = count === 0 ? "Alle Plätze frei" : `${occupancy}% der Plätze belegt`;
  elements.revenue.textContent = euro.format(state.revenue);
  elements.elapsedCopy.textContent = `${Math.floor(now)} Min. Betriebszeit`;
  elements.vehicleCount.textContent = String(count);

  elements.parkingSlots.replaceChildren();
  for (let index = 0; index < CAPACITY; index++) {
    const car = state.cars[index];
    const slot = document.createElement("div");
    slot.className = car ? "slot occupied" : "slot";
    slot.setAttribute("aria-label", car ? `Platz ${index + 1}, Fahrzeug ${car.id}` : `Platz ${index + 1}, frei`);
    const slotNumber = document.createElement("span");
    slotNumber.className = "slot-number";
    slotNumber.textContent = String(index + 1).padStart(2, "0");
    slot.append(slotNumber);
    if (car) {
      const id = document.createElement("span");
      id.className = "slot-car-id";
      id.textContent = car.id;
      slot.append(id);

      const menu = document.createElement("details");
      menu.className = "slot-menu";
      menu.name = "slot-actions";
      menu.dataset.carId = car.id;
      menu.open = openMenuCarId === car.id;
      const menuButton = document.createElement("summary");
      menuButton.textContent = "⋯";
      menuButton.setAttribute("aria-label", `Aktionen für Fahrzeug ${car.id}`);
      menu.append(menuButton);

      const menuContent = document.createElement("div");
      menuContent.className = "slot-menu-content";
      const tariffLabel = document.createElement("span");
      tariffLabel.textContent = "Aktueller Tarif";
      const tariffAmount = document.createElement("strong");
      tariffAmount.textContent = `${euro.format(chargeFor(Math.max(0, now - car.arrivedAt)))} €`;
      menuContent.append(tariffLabel, tariffAmount);

      const exitButton = document.createElement("button");
      exitButton.className = "exit-car";
      exitButton.type = "button";
      exitButton.textContent = "Ausfahren";
      exitButton.setAttribute("aria-label", `Fahrzeug ${car.id} ausfahren`);
      exitButton.addEventListener("click", () => exitCar(car.id));
      menuContent.append(exitButton);
      menu.append(menuContent);
      slot.append(menu);
    }
    elements.parkingSlots.append(slot);
  }

  elements.vehicleList.replaceChildren();
  elements.carSelect.replaceChildren(new Option("Fahrzeug wählen", ""));
  if (!count) {
    const row = elements.vehicleList.insertRow();
    row.className = "empty-row";
    const cell = row.insertCell();
    cell.colSpan = 5;
    cell.textContent = "Noch keine Fahrzeuge im Parkhaus.";
  }
  for (const car of state.cars) {
    const duration = Math.max(0, now - car.arrivedAt);
    const row = elements.vehicleList.insertRow();
    row.insertCell().textContent = car.id;
    row.insertCell().textContent = clockTime(car.arrivedAt);
    row.insertCell().textContent = formatDuration(duration);
    row.insertCell().textContent = `${euro.format(chargeFor(duration))} €`;
    const actionCell = row.insertCell();
    const exitButton = document.createElement("button");
    exitButton.className = "exit-car";
    exitButton.type = "button";
    exitButton.textContent = "Ausfahren";
    exitButton.setAttribute("aria-label", `Fahrzeug ${car.id} ausfahren`);
    exitButton.addEventListener("click", () => exitCar(car.id));
    actionCell.append(exitButton);

    const option = new Option(car.id, car.id);
    elements.carSelect.add(option);
  }

  const disabled = state.closed;
  elements.parkForm.querySelector("button").disabled = disabled || count >= CAPACITY;
  elements.exitForm.querySelector("button").disabled = disabled || count === 0;
  elements.demoButton.disabled = disabled || count >= CAPACITY;
  elements.previewButton.disabled = disabled;
  elements.closeButton.disabled = disabled;
  elements.openButton.hidden = !disabled;
  elements.confirmClose.disabled = disabled;
  elements.openState.textContent = disabled ? "GESCHLOSSEN" : "BETRIEB";
  document.querySelector(".live-state .live-dot").style.background = disabled ? "#b65e49" : "var(--green-bright)";
}

function parkCar(id, announce = true) {
  if (state.closed) return false;
  if (!/^\d{4}$/.test(id)) {
    elements.notice.textContent = "Bitte eine vierstellige Kennung eingeben.";
    return false;
  }
  if (state.cars.some((car) => car.id === id)) {
    elements.notice.textContent = "Diese Kennung ist bereits im Parkhaus.";
    return false;
  }
  if (state.cars.length >= CAPACITY) {
    elements.notice.textContent = "Das Parkhaus ist voll.";
    return false;
  }
  state.cars.push({ id, arrivedAt: elapsedMinutes() });
  elements.notice.textContent = "";
  if (announce) addActivity(`Fahrzeug ${id} eingefahren`);
  render();
  checkAutomaticExit();
  return true;
}

function exitCar(id, announce = true) {
  const index = state.cars.findIndex((car) => car.id === id);
  if (index < 0) return;
  const [car] = state.cars.splice(index, 1);
  const ticket = chargeFor(Math.max(0, elapsedMinutes() - car.arrivedAt));
  state.revenue += ticket;
  if (announce) addActivity(`Fahrzeug ${id} ausgefahren · ${euro.format(ticket)} €`);
  render();
}

function checkAutomaticExit() {
  if (state.cars.length / CAPACITY <= AUTO_CLEAR_THRESHOLD) return;
  const now = elapsedMinutes();
  const max10percent = Math.floor(CAPACITY / 10) + 1
  const eligibleCars = state.cars.filter((car) => now - car.arrivedAt >= AUTO_CLEAR_AFTER_MINUTES);
  const eligibleCars10 = eligibleCars.slice(0,max10percent)
  for (const car of eligibleCars) {
    if (!state.cars.some((parked) => parked.id === car.id)) continue;
    exitCar(car.id);
    addActivity(`Automatische Ausfahrt · ${car.id}`);
  }
}

function showSummary(final = false) {
  const projected = state.cars.reduce((sum, car) => sum + chargeFor(Math.max(0, elapsedMinutes() - car.arrivedAt)), 0);
  const total = state.revenue + projected;
  elements.dialogEyebrow.textContent = final ? "TAGESABSCHLUSS" : "WENN DAS PARKHAUS JETZT SCHLIESST";
  elements.dialogTitle.textContent = final ? "Parkhaus schließen" : "Einnahmenvorschau";
  elements.dialogCopy.textContent = state.cars.length
    ? `${state.cars.length} ${state.cars.length === 1 ? "Fahrzeug wird" : "Fahrzeuge werden"} noch abgerechnet. Die Vorschau berechnet die Tickets bis ${clockTime()}.`
    : "Es sind keine Fahrzeuge mehr geparkt.";
  elements.dialogTotal.textContent = `${euro.format(total)} €`;
  elements.confirmClose.hidden = !final;
  elements.summaryDialog.dataset.final = String(final);
  elements.summaryDialog.showModal();
}

function resetParkhaus() {
  state.cars = [];
  state.revenue = 0;
  state.speed = 7;
  state.elapsedMinutes = 0;
  state.timeAnchor = Date.now();
  state.closed = false;
  elements.speed.value = "7";
  elements.speedValue.textContent = "7×";
  elements.parkForm.reset();
  elements.notice.textContent = "";
  elements.activityList.replaceChildren();
  const initialActivity = document.createElement("li");
  initialActivity.className = "activity-empty";
  initialActivity.textContent = "Parkhaus geöffnet · 08:00";
  elements.activityList.append(initialActivity);
  elements.summaryDialog.dataset.final = "false";
  render();
}

elements.speed.addEventListener("input", () => {
  state.elapsedMinutes = elapsedMinutes();
  state.timeAnchor = Date.now();
  state.speed = Number(elements.speed.value);
  elements.speedValue.textContent = `${state.speed}×`;
  render();
});

elements.parkForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (parkCar(elements.carId.value.trim())) elements.carId.value = "";
});

elements.exitForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (elements.carSelect.value) exitCar(elements.carSelect.value);
});

elements.demoButton.addEventListener("click", () => {
  let parked = 0;
  for (let index = 0; index < 5 && state.cars.length < CAPACITY; index++) {
    let id;
    do id = String(Math.floor(1000 + Math.random() * 9000));
    while (state.cars.some((car) => car.id === id));
    if (parkCar(id, false)) parked++;
  }
  if (parked) addActivity(`${parked} Demo-Fahrzeuge eingefahren`);
});

elements.previewButton.addEventListener("click", () => showSummary(false));
elements.closeButton.addEventListener("click", () => showSummary(true));
elements.openButton.addEventListener("click", resetParkhaus);
elements.confirmClose.addEventListener("click", () => {
  state.revenue += state.cars.reduce((sum, car) => sum + chargeFor(Math.max(0, elapsedMinutes() - car.arrivedAt)), 0);
  state.cars = [];
  state.closed = true;
  elements.summaryDialog.close();
  addActivity("Parkhaus geschlossen · Tagesabschluss erstellt");
  render();
});

elements.summaryDialog.addEventListener("close", () => {
  if (elements.summaryDialog.dataset.final === "true" && !state.closed) elements.confirmClose.hidden = false;
});

document.addEventListener("click", (event) => {
  const openMenu = elements.parkingSlots.querySelector(".slot-menu[open]");
  if (openMenu && !openMenu.contains(event.target)) openMenu.open = false;
});

render();
window.setInterval(() => {
  checkAutomaticExit();
  render();
}, 1000);
