// Verwenden der "neuen" Modul laden Funktion: import
import { convertProcessSignalToExitCode } from "node:util";
import promptSync from "prompt-sync";
const myprompt = promptSync({ sigint: true });
// init parkhaus
let phaus = {
    maxccount: 25,
    phclist: [],
    cccount: 0,
    chash: 0
};
let allcommands = "parkin, parkout, pstat, money, exit, exit22, apark, ifexit";
let speedtime = 7;
let gesamteinnahmen = 0;
// Preise pro Stunde von 1. bis 10. Stunde
let plist = [1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1];
console.log("Parkhaus Superparking wird geöffnet: es ist 8:00 Uhr");
let startParkHouseTime800 = Math.floor(Date.now() / 1000);
function phtimesec() {
    let currenttime = Math.floor(Date.now() / 1000);
    return (currenttime - startParkHouseTime800) * speedtime;
}
function phtimehhmm(currentmins) {
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
// menue:
function menue() {
    // console.log("Current PH time: ", phtimesec())
    let command;
    while (true) {
        console.log(`Superparking ist geöffnet: ` + phtimehhmm(phtimesec()) + ` Uhr
  Was möchtest du machen?  Bitte Kommando eingeben: \n    ` + allcommands);
        let prompttxt = phtimehhmm(phtimesec()) + ": ";
        command = myprompt(prompttxt);
        if (allcommands.includes(command)) {
            return command;
        }
        // console.log(" *** unbekannte Eingabe!")
    }
}
let noexit = true;
let carin, carout;
while (noexit) {
    switch (menue()) {
        case "parkin":
            console.log("  auto parken");
            carin = carParkInInfo(-1, "08:15", "02:00"); // falsche id=-1 zwingt zur neueingabe
            parkeAuto(carin);
            break;
        case "apark":
            console.log("  parke einige auto automatisch!");
            carin = carParkInInfo(getrandomcarid(), phtimehhmm(phtimesec()), "16:40");
            parkeAuto(carin);
            carin = carParkInInfo(getrandomcarid(), phtimehhmm(phtimesec()), "17:00");
            parkeAuto(carin);
            carin = carParkInInfo(getrandomcarid(), phtimehhmm(phtimesec()), "18:07");
            parkeAuto(carin);
            carin = carParkInInfo(getrandomcarid(), phtimehhmm(phtimesec()), "18:00");
            parkeAuto(carin);
            carin = carParkInInfo(getrandomcarid(), phtimehhmm(phtimesec()), "20:14");
            parkeAuto(carin);
            break;
        case "parkout":
            console.log("parkout:");
            carout = carParkOutInfo(-1); // trifft nie zu -> innerhalb carParkOutInfo eingeben
            deparkeAuto(carout);
            break;
        case "pstat":
            console.log("pstat:");
            parkhausStatus();
            break;
        case "money":
            console.log("money:");
            moneymoney();
            break;
        case "exit":
            console.log("exit:");
            closeParkHaus(phtimehhmm(phtimesec()));
            noexit = false;
            break;
        case "exit22":
            console.log("exit22:");
            closeParkHaus("22:00");
            noexit = false;
            break;
        case "ifexit":
            ifexitnow();
            break;
        default: // wir machen nix!
            break;
    }
}
function getrandomcarid() {
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
            carin.stime = phtimehhmm(phtimesec());
            console.log(carin);
            // if (/^\d{2}:\d{2}$/.test(carin.stime) && (
            //     /^0[89]:[0-5][0-9]$/.test(carin.stime) ||
            //     /^1[0-9]:[0-5][0-9]$/.test(carin.stime) ||
            //     /^2[01]:[0-5][0-9]$/.test(carin.stime))) { // start time correct
            //     // console.log(carin)
            //     // von 8-22 Uhr -> max 14 std
            //     // let dhour = Number(myprompt("  geplante Parkdauer(Std:1-14) :"))
            //     // if (!(dhour < 1 || dhour > 14)) {
            //     // } else {
            //     //     console.log("  ERROR: falsche Parkdauer!")
            // } else {
            //     console.log("  ERROR: falsche Startzeit")
            // }
            return carin;
        }
        else if (carin.id <= 0) {
            break;
        }
    }
    return carin;
    // fehlerhafte werte, es wird ein NULL id car geschickt; wird also nicht geparkt
    // return { id: -1, stime: "00:00", dtime: "00:00" }
}
function parkeAuto(carin) {
    if (carin.id != -1) {
        if (phaus.cccount <= phaus.maxccount) {
            if (!phaus.phclist.find(car => car.id == carin.id)) {
                phaus.phclist.push(carin);
                phaus.cccount++;
                console.log("  wird geparkt:", carin);
            }
            else {
                console.log("  Error: CarID schon vorhanden: ", carin.id);
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
function deparkeAuto(carin) {
    // suche carid, berechne parkkosten, platz wieder freigeben
    if (carin.id > 0) {
        console.log("  parke aus:", carin);
        let index = phaus.phclist.findIndex(car => car.id == carin.id);
        if (index >= 0) {
            phaus.phclist.splice(index, 1);
            // berechne Ticket und Gesamteinnahme+Ticket
            let exittime = phtimehhmm(phtimesec()); // aktuelle Uhrzeit
            let [ticket, pmin, pstd] = calcticket(carin, exittime);
            console.log("carId:", carin.id, "Dauer 'Min/Std':", pmin + "/" + pstd, "Ticket(€):", ticket.toFixed(2), "€");
            gesamteinnahmen = gesamteinnahmen + ticket;
        }
        else {
            console.log("  carID NOT FOUND - NOT FOUND!");
        }
    }
}
function parkhausStatus() {
    console.log("Currend PH status: parked cars");
    let pline = "|";
    for (let c of phaus.phclist) {
        pline = pline + " " + c.id + " |";
        console.log(c);
    }
    console.log(pline);
    moneymoney();
}
function moneymoney() {
    console.log("  Aktuelle Einnahmen:", gesamteinnahmen.toFixed(2));
}
function closeParkHaus(closetime) {
    console.log("Parkhaus schließt!");
    console.log("  Parkdauer-Berechnung für alle noch geparkten cars!");
    let einnahmen = 0;
    for (let c of phaus.phclist) {
        let [ticket, pmin, pstd] = calcticket(c, closetime);
        einnahmen = einnahmen + ticket;
        console.log("carId:", c.id, "ParkDauer pro Std:", pstd, "Ticket(€):", ticket.toFixed(2), "€");
    }
    gesamteinnahmen = gesamteinnahmen + einnahmen;
    console.log("  Heute sind die Gesamteinnahmen:", gesamteinnahmen.toFixed(2), "€, weiter so!");
}
function ifexitnow() {
    let ifexitnowtime = phtimehhmm(phtimesec());
    let exitnoweinnahmen = 0;
    console.log("  WWW - Was-Wäre-Wenn Parkhaus jetzt schließen würde!");
    console.log("    Parkdauer/Ticket-Berechnung für alle noch geparkten cars!");
    let einnahmen = 0;
    for (let c of phaus.phclist) {
        let [ticket, pmin, pstd] = calcticket(c, ifexitnowtime);
        einnahmen = einnahmen + ticket;
        console.log("carId:", c.id, "ParkDauer pro Std:", pstd, "Ticket(€):", ticket.toFixed(2), "€");
    }
    exitnoweinnahmen = exitnoweinnahmen + einnahmen;
    console.log("    Gesamteinnahmen z.Zt.:", gesamteinnahmen.toFixed(2), "+ ExitNowEinnahmen wären:", exitnoweinnahmen.toFixed(2));
}
function calcticket(c, untiltime) {
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
//# sourceMappingURL=parkhaus.js.map