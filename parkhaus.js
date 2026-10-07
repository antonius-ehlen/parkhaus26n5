// Verwenden der "neuen" Moduleladen Funktion "import"
import promptSync from "prompt-sync";
const myprompt = promptSync({ sigint: true }); // CTRL-C/CTRL-D aktivieren
// parkhaus initialisieren 25 Plätze
let phaus = {
    maxccount: 25,
    phclist: [],
    cccount: 0,
    chash: 0
};
let carin, carout;
let noexit = true;
let speedtime = 7;
let gesamteinnahmen = 0;
let allcommands = "pein, paus, apark, pstat, money, exit, exit22, ifexit, speed";
// Preise pro Stunde von 1. bis 10. Stunde
let plist = [1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1];
let fullcheck = 0.8; // Füllstand für auto ausparken
let autoTimeOut = 4; // nur ab autoTimeOut Std, autos automatisch ausparken
let maxCarOut = 10; // maximal % anzahl autos ausparken
console.log("Parkhaus Superparking wird geöffnet: es ist 8:00 Uhr");
// wir setzen einen Timer der reale Sekunden als Minuten zählt,
//   wobei ein speedtime Multiplikator die Zeit schneller ablaufen lassen kann
//   was auch bei der Programmausführung angepasst werden kann
let startParkHouseTime800 = Math.floor(Date.now() / 1000);
function phTimeSec() {
    // timer zählt von 0 (sec=min) ab Programmstart
    let currenttime = Math.floor(Date.now() / 1000);
    return (currenttime - startParkHouseTime800) * speedtime;
}
function phTimeHHMM(currentmins) {
    // aktuelle time in HH:MM string umwandeln
    let stds, hhmm;
    let mins, stdn;
    if (currentmins < 60) {
        stds = "08:";
        mins = currentmins;
        hhmm = stds + String(currentmins).padStart(2, '0');
    }
    else {
        // console.log("currentmins / 60", Math.trunc(currentmins / 60))
        stdn = Math.trunc(currentmins / 60);
        stds = String(8 + stdn).padStart(2, '0');
        mins = (currentmins - stdn * 60);
        hhmm = stds + ':' + String(mins).padStart(2, '0');
    }
    return hhmm;
}
function menue() {
    // menue: Hauptprogramm Funktion
    let command;
    while (true) {
        check80();
        console.log(`\nSuperparking ist geöffnet: ` + phTimeHHMM(phTimeSec()) +
            ` Uhr, SpeedTime: ` + speedtime +
            `\n  Was möchtest du machen?  Bitte Kommando eingeben:\n    ` + allcommands);
        let prompttxt = phTimeHHMM(phTimeSec()) + ", cars: " + phaus.cccount + ": ";
        command = myprompt(prompttxt);
        if (allcommands.includes(command)) {
            return command;
        }
    }
}
function main() {
    while (noexit) {
        switch (menue()) {
            case "speed":
                let eingabe = myprompt("  new speedtime factor [" + speedtime + "]:");
                if (eingabe != "") {
                    let sp = Number(eingabe);
                    if (0 < sp && sp <= 33) {
                        speedtime = sp;
                    }
                }
                break;
            case "pein":
                console.log("  - pein: auto parken");
                carin = carParkInInfo(-1, "08:15", "02:00"); // falsche id=-1 zwingt zur neueingabe
                parkCar(carin);
                break;
            case "apark":
                console.log("  - apark: 5 autos automatisch parken!");
                carin = carParkInInfo(getRandomCarId(), phTimeHHMM(phTimeSec()), "16:40");
                parkCar(carin);
                carin = carParkInInfo(getRandomCarId(), phTimeHHMM(phTimeSec()), "17:00");
                parkCar(carin);
                carin = carParkInInfo(getRandomCarId(), phTimeHHMM(phTimeSec()), "18:07");
                parkCar(carin);
                carin = carParkInInfo(getRandomCarId(), phTimeHHMM(phTimeSec()), "18:00");
                parkCar(carin);
                carin = carParkInInfo(getRandomCarId(), phTimeHHMM(phTimeSec()), "20:14");
                parkCar(carin);
                break;
            case "paus":
                console.log("  - paus:");
                carout = carParkOutInfo(-1); // trifft nie zu -> innerhalb carParkOutInfo eingeben
                deparkCar(carout);
                break;
            case "pstat":
                console.log("  - pstat:");
                parkHouseStatus();
                break;
            case "money":
                console.log("  - money:");
                moneyMoney();
                break;
            case "exit":
                console.log("  - exit:");
                closeParkHouse(phTimeHHMM(phTimeSec()));
                noexit = false;
                break;
            case "exit22":
                console.log("  - exit22:");
                closeParkHouse("22:00");
                noexit = false;
                break;
            case "ifexit":
                console.log("  - ifexit:");
                ifExitNow();
                break;
            default: // wir machen nix!
                break;
        }
    }
}
function getRandomCarId() {
    return Math.floor(1000 + Math.random() * 9000);
}
function carParkInInfo(idin, stime, dtime) {
    let carin = { id: idin, stime: stime, dtime: dtime };
    if (/^\d{4}$/.test(carin.id.toString())) {
        if (/^\d{2}:\d{2}$/.test(carin.stime)) {
            if (/^\d{2}:\d{2}$/.test(carin.dtime)) {
                // alle werte vom korrekten typ
                return carin;
            }
        }
    }
    // default werte setzen
    carin = { id: -1, stime: "00:00", dtime: "00:00" };
    while (true) {
        // car mit neuen daten versehen
        let eingabe = myprompt("  gib carID: ");
        if (eingabe == "")
            break; // abbruch bei keiner eingabe
        carin.id = Number(eingabe);
        if (/^\d{4}$/.test(carin.id.toString()) && carin.id >= 0) {
            if (phaus.phclist.find(car => car.id == carin.id)) {
                console.log("  Error: CarID schon vorhanden: ", carin.id);
                continue;
            }
            // starttime ist jetzt aktuelle uhrzeit
            carin.stime = phTimeHHMM(phTimeSec());
            console.log(carin);
            return carin;
        }
        else if (carin.id <= 0) {
            break;
        }
    }
    return carin;
}
function parkCar(carin) {
    check80();
    if (carin.id != -1) {
        if (phaus.cccount < phaus.maxccount) {
            if (!phaus.phclist.find(car => car.id == carin.id)) {
                phaus.phclist.push(carin);
                phaus.cccount++;
                console.log("  wird geparkt:", carin);
            }
            else {
                console.log("  Error: CarID schon vorhanden: ", carin.id);
            }
        }
        else {
            console.log("  Error: Parkhaus ist voll! Auto kann nicht geparkt werden!");
        }
    }
}
function check80() {
    // checken auf Füllstand: hier >80%
    if ((phaus.cccount / phaus.maxccount) > fullcheck) {
        // Füllstand für automatisches ausparken erreicht
        // aber nur ausparken von cars mit > 4Std parkzeit
        let maxcarsaout = (phaus.maxccount * maxCarOut);
        for (let car of phaus.phclist) {
            let ifExitNowtime = phTimeHHMM(phTimeSec());
            let [ticket, pmin, pstd] = calcTicket(car, ifExitNowtime);
            if (pstd >= autoTimeOut) {
                deparkCarAutom(car);
            }
        }
    }
}
function carParkOutInfo(carid) {
    let ppnr = 0;
    let car = { id: -1, stime: "00:00", dtime: "00:00" };
    while (true) {
        if (carid.toString().length != 4) {
            let eingabe = myprompt("  ausparken: CarID: ");
            if (eingabe == "")
                break;
            carid = Number(eingabe);
            continue;
        }
        else if (carid.toString().length == 4) {
            ppnr = phaus.phclist.findIndex(car => car.id == carid);
            if (ppnr != -1) { // found carid
                car = phaus.phclist[ppnr];
                break;
            }
            else {
                console.log("  carID not found!");
                break;
            }
        }
    }
    return car;
}
function deparkCarAutom(car) {
    console.log("  automatisches ausparken von:", car);
    deparkCar(car);
}
function deparkCar(carin) {
    // suche carid, berechne parkkosten, platz wieder freigeben
    if (carin.id > 0) {
        // console.log("  parke aus:", carin)
        let index = phaus.phclist.findIndex(car => car.id == carin.id);
        if (index >= 0) {
            phaus.phclist.splice(index, 1);
            phaus.cccount--;
            // berechne Ticket und Gesamteinnahme+Ticket
            let exittime = phTimeHHMM(phTimeSec()); // aktuelle Uhrzeit
            let [ticket, pmin, pstd] = calcTicket(carin, exittime);
            console.log("carId:", carin.id, "Dauer 'Min/Std':", pmin + "/" + pstd, "Ticket(€):", ticket.toFixed(2), "€");
            gesamteinnahmen = gesamteinnahmen + ticket;
        }
        else {
            console.log("  carID NOT FOUND - NOT FOUND!");
        }
    }
}
function parkHouseStatus() {
    console.log("Currend PH status: parked cars");
    let pline = "|";
    let maxCarsIdsPerLine = 7;
    let anzIds = 0;
    for (let c of phaus.phclist) {
        pline = pline + " " + c.id + " |";
        anzIds++;
        if (anzIds == maxCarsIdsPerLine) {
            pline = pline + "\n|";
        }
        console.log(c);
    }
    console.log(pline);
    moneyMoney();
}
function moneyMoney() {
    console.log("  Aktuelle Einnahmen:", gesamteinnahmen.toFixed(2));
}
function closeParkHouse(closetime) {
    console.log("Parkhaus schließt!");
    console.log("  Parkdauer-Berechnung für alle noch geparkten cars!");
    let einnahmen = 0;
    for (let c of phaus.phclist) {
        let [ticket, pmin, pstd] = calcTicket(c, closetime);
        einnahmen = einnahmen + ticket;
        console.log("carId:", c.id, "ParkDauer pro Std:", pstd, "Ticket(€):", ticket.toFixed(2), "€");
    }
    gesamteinnahmen = gesamteinnahmen + einnahmen;
    console.log("  Heute sind die Gesamteinnahmen:", gesamteinnahmen.toFixed(2), "€, weiter so!");
}
function ifExitNow() {
    let ifExitNowtime = phTimeHHMM(phTimeSec());
    let exitnoweinnahmen = 0;
    console.log("  WWW - Was-Wäre-Wenn Parkhaus jetzt schließen würde!");
    console.log("    Parkdauer/Ticket-Berechnung für alle noch geparkten cars!");
    let einnahmen = 0;
    for (let c of phaus.phclist) {
        let [ticket, pmin, pstd] = calcTicket(c, ifExitNowtime);
        einnahmen = einnahmen + ticket;
        console.log("carId:", c.id, "ParkDauer pro Std:", pstd, "Ticket(€):", ticket.toFixed(2), "€");
    }
    exitnoweinnahmen = exitnoweinnahmen + einnahmen;
    console.log("    Gesamteinnahmen z.Zt.:", gesamteinnahmen.toFixed(2), "+ ExitNowEinnahmen wären:", exitnoweinnahmen.toFixed(2));
}
function calcTicket(c, untiltime) {
    // für ein car: aktuelle Kosten zur übergebenen Uhrzeit berechnen
    let sstd, smin, dstd, dmin, rstd, rmin, pstd, pmin, sum, pmax;
    let ctime = untiltime;
    sstd = Number(c.stime[0] + c.stime[1]);
    smin = Number(c.stime[3] + c.stime[4]);
    dstd = Number(ctime[0] + ctime[1]);
    dmin = Number(ctime[3] + ctime[4]);
    rstd = dstd - sstd;
    rmin = dmin - smin;
    if (dmin < smin) {
        rmin = dmin;
    }
    // korrektur wenn Dauerzeit < Einfahrtzeit 
    pmin = (rstd) * 60 + (rmin); // Parkdauer in Minuten
    pstd = Math.trunc(pmin / 60); // echte Dauer in reinen Stunden
    sum = plist[0]; // erste, angefangene std
    // berechnen etwaige weitere std
    pmax = pstd < 11 ? pstd : 10;
    for (let s = 1; s < pmax; s++) {
        sum = sum + plist[s];
    }
    return [sum, pmin, pstd];
}
// run main program function 
main();
//# sourceMappingURL=parkhaus.js.map