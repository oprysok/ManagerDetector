/*global window, document, Widget:true, ActiveXObject, moment, ajax, console*/
function Widget() {
    "use strict";
    this.configFileName = "config.json";
    this.lastResult = null;
    this.currentLocationName = null;
    this.employeeList = null;
    this.areaList = [
        {id: 0, name: "Office KBP1-C", alias: "1C"},
        {id: 0, name: "Office KBP1-R", alias: "1R"},
        {id: 0, name: "Office KBP2-R", alias: "2R"},
        {id: 0, name: "Office KBP3-C", alias: "3C"},
        {id: 0, name: "Office KBP3-D", alias: "3D"},
        {id: 0, name: "Office KBP3-G", alias: "3G"},
        {id: 0, name: "Office KBP3-L", alias: "3L"},
        {id: 0, name: "Office KBP3-R", alias: "3R"},
        {id: 0, name: "Office KBP4-C", alias: "4C"},
        {id: 0, name: "Office KBP4-G", alias: "4G"},
        {id: 0, name: "Office KBP4-L", alias: "4L"},
        {id: 0, name: "Office KBP4-R", alias: "4R"},
        {id: 0, name: "Office KBP5-C", alias: "5C"},
        {id: 0, name: "Office KBP5-G", alias: "5G"},
        {id: 0, name: "Office KBP5-L", alias: "5L"},
        {id: 0, name: "Office KBP5-R", alias: "5R"},
        {id: 0, name: "Location-KBP5C-Finance", alias: "5C-Finance"}
    ];
    this.settings = {};
    this.settingsDefault = {
        "interval": 3000,
        "userId": 2323,
        "name": "Andrii Klymenko",
        "alias": "Lidok",
        "homeArea": {name: "Office KBP3-L", alias: "3L"},
        "mute": true
    };
    this.dom = {
        userSpan: document.getElementById("user"),
        locationSpan: document.getElementById("location"),
        backgroundEl: document.getElementById("imgBackground"),
        whenSpan: document.getElementById("when"),
        statusSpan: document.getElementById("status"),
        settingsSpan: document.getElementById("settingButton"),
        settings: document.getElementById("settings"),
        saveSpan: document.getElementById("saveButton"),
        employeesInputAc: document.getElementById("employees"),
        employeesInputId: document.getElementById("empId"),
        intervalInput: document.getElementById("intervalInput"),
        aliasInput: document.getElementById("aliasInput"),
        muteInput: document.getElementById("muteInput"),
        employeesSuggestions: document.getElementById("foundEmps"),
        areaInput: document.getElementById("areaInput"),
        areasSuggestions: document.getElementById("foundArea")
    };
    this.audio = {
        near: "sounds\\e-pacantre.wav",
        far: "sounds\\zbs.wav"
    };
    this.url = {
        employees: "http://poc-cont2-srv/polygon/json/employees",
        lastSeen: "http://poc-cont2-srv/polygon/json/last_seen?employeeId="
    };
}
Widget.prototype.changeState = function (detected) {
    "use strict";
    if (detected) {
        if (this.lastResult === null || !this.lastResult) {
            this.lastResult = true;
            this.playSound(this.audio.near);
        }
        this.dom.backgroundEl.style.background = "#e74c3c";
        this.dom.statusSpan.innerHTML = this.settings.alias !== "" ? this.settings.alias + " detected!" : "Detected!";

    } else {
        if (this.lastResult === null || this.lastResult) {
            this.lastResult = false;
            this.playSound(this.audio.far);
        }
        this.dom.backgroundEl.style.background = "#27ae60";
        this.dom.statusSpan.innerHTML = "OK";
    }
};
Widget.prototype.storeEmployees = function (employees, that) {
    "use strict";
    that.employeeList = JSON.parse(employees);
};
Widget.prototype.getEmployees = function () {
    "use strict";
    if (this.employeeList === null) {
        ajax(this.url.employees, this.storeEmployees, this);
    }
};
Widget.prototype.checkLidok = function (obj, that) {
    "use strict";
    var res = JSON.parse(obj);
    if (res.area !== null) {
        that.currentLocationName = res.area.replace("Office KBP", "").replace("-", "");
        that.dom.locationSpan.innerHTML = res.direction === "in" ? "Now in " +  that.currentLocationName : "Last seen in " + that.currentLocationName;
        that.dom.userSpan.innerHTML = that.settings.name;
        that.dom.whenSpan.innerHTML = res.direction !== "in" ? "(" + moment(res.timestamp).fromNow() + ")" : "";
        if (res.area === that.settings.homeArea.name && res.direction === "in") {
            that.changeState(true);
        } else {
            that.changeState(false);
        }
    } else {
        that.dom.userSpan.innerHTML = "";
        that.dom.whenSpan.innerHTML = "";
        that.dom.locationSpan.innerHTML = "";
        that.dom.statusSpan.innerHTML = "Not available";
        this.removeConfig();
    }
};
Widget.prototype.detect = function () {
    "use strict";
    ajax(this.url.lastSeen + this.settings.userId, this.checkLidok, this);
};
Widget.prototype.playSound = function (filepath) {
    "use strict";
    if (!this.settings.mute && window.Audio !== undefined) {
        var sound = new window.Audio(filepath);
        sound.play();
    } else if (!this.settings.mute && window.System !== undefined && System.Sound !== undefined) {
        System.Sound.playSound(filepath);
    }
};
Widget.prototype.hideNameSuggestions = function () {
    "use strict";
    this.dom.employeesInputAc.style.border = "";
    this.dom.employeesSuggestions.style.display = "none";
    this.dom.employeesSuggestions.innerHTML = "";
};
Widget.prototype.showNameSuggestions = function () {
    "use strict";
    this.dom.employeesInputAc.style.borderRight = "2px solid #996600";
    this.dom.employeesSuggestions.style.display = "block";
};
Widget.prototype.hideAreaSuggestions = function () {
    "use strict";
    this.dom.areaInput.style.border = "";
    this.dom.areasSuggestions.style.display = "none";
    this.dom.areasSuggestions.innerHTML = "";
};
Widget.prototype.showAreaSuggestions = function () {
    "use strict";
    this.dom.areaInput.style.borderRight = "2px solid #996600";
    this.dom.areasSuggestions.style.display = "block";
};
Widget.prototype.closeSettings = function () {
    "use strict";
    document.body.setAttribute("data-showSettings", "false");
    document.body.style.height = 58 + "px";
    this.dom.settings.style.display = "none";
};
Widget.prototype.openSettings = function () {
    "use strict";
    this.fillSettings();
    document.body.setAttribute("data-showSettings", "true");
    document.body.style.height = 58 + 58 + 58 + 58 + 58 + "px";
    this.dom.settings.style.display = "block";
};
Widget.prototype.fillSettings = function () {
    "use strict";
    this.dom.employeesInputAc.value = this.settings.name;
    this.dom.employeesInputId.value = this.settings.userId;
    this.dom.aliasInput.value = this.settings.alias;
    this.dom.areaInput.value = this.settings.homeArea.alias;
    this.dom.intervalInput.value = this.settings.interval;
    this.dom.muteInput.checked = this.settings.mute;
};
Widget.prototype.saveSettings = function () {
    "use strict";
    if (this.dom.employeesInputId.value) {
        this.settings.name = this.dom.employeesInputId.getAttribute("data-name");
        this.settings.userId = parseInt(this.dom.employeesInputId.value, 10);
    }
    this.settings.alias = this.dom.aliasInput.value;
    var area = this.findArea(this.dom.areaInput.value);
    if (area !== undefined) {
        this.settings.homeArea = area;
    }
    if (!isNaN(this.dom.intervalInput.value)) {
        this.settings.interval = parseInt(this.dom.intervalInput.value, 10);
    }
    this.settings.mute = this.dom.muteInput.checked;
    this.hideNameSuggestions();
};

Widget.prototype.findArea = function (input) {
    'use strict';
    var i;
    for (i = 0; i < this.areaList.length; i += 1) {
        if (this.areaList[i].alias === input) {
            return this.areaList[i];
        }
    }
};

Widget.prototype.mergeSettings = function (obj1, obj2) {
    "use strict";
    var p;
    for (p in obj2) {
        if (obj2.hasOwnProperty(p)) {
            try {
                if (obj2[p].constructor === Object) {
                    obj1[p] = this.mergeSettings(obj1[p], obj2[p]);
                } else {
                    obj1[p] = obj2[p];
                }
            } catch (e) {
                obj1[p] = obj2[p];
            }
        }
    }
    return obj1;
};
Widget.prototype.applyConfig = function () {
    "use strict";
    this.dom.employeesInputId.setAttribute("data-name", this.settings.name);
    this.dom.employeesInputId.value = this.settings.userId;
};
Widget.prototype.saveConfig = function () {
    "use strict";
    var filespec, fso, a;
    if (window.ActiveXObject !== undefined && System.Gadget !== undefined) {
        filespec = System.Gadget.path + "\\" + this.configFileName;
        fso = new ActiveXObject("Scripting.FileSystemObject");
        if (fso.FileExists(filespec)) {
            try {
                fso.DeleteFile(filespec);
            } catch (ignore) {
            }
        }
        a = fso.CreateTextFile(filespec, true);
        a.WriteLine(JSON.stringify(this.settings));
        a.Close();
    }
};
Widget.prototype.readConfig = function () {
    "use strict";
    try {
        var filespec, fso, f;
        filespec = System.Gadget.path + "\\" + this.configFileName;
        fso = new ActiveXObject("Scripting.FileSystemObject");
        f = fso.OpenTextFile(filespec, 1).ReadAll();
        this.settings = this.mergeSettings(this.settingsDefault, JSON.parse(f));
    } catch (e) {
        this.settings = this.settingsDefault;
        this.applyConfig();
    }
};
Widget.prototype.removeConfig = function () {
    "use strict";
    var filespec, fso;
    if (window.ActiveXObject !== undefined && System.Gadget !== undefined) {
        filespec = System.Gadget.path + "\\" + this.configFileName;
        fso = new ActiveXObject("Scripting.FileSystemObject");
        if (fso.FileExists(filespec)) {
            fso.DeleteFile(filespec);
        }
    }
};
// Name Autocomplete
Widget.prototype.nextNameSuggestion = function () {
    "use strict";
    if (this.dom.employeesSuggestions.innerHTML !== "") {
        var activeIndex, firstIndex, lastIndex, node, currentIndex, next, x;
        activeIndex = firstIndex = lastIndex = -1;
        for (x = 0; x < this.dom.employeesSuggestions.childNodes.length; x += 1) {
            node = this.dom.employeesSuggestions.childNodes[x];
            lastIndex = node.nodeType === 1 ? x : lastIndex;
            if (firstIndex === -1 && node.nodeType === 1) {
                firstIndex = x;
            }
            if (node.className.indexOf("active") !== -1) {
                activeIndex = x;
            }
        }
        if (activeIndex !== -1) {
            currentIndex = activeIndex;
            next = this.dom.employeesSuggestions.childNodes[activeIndex];
            next.className = "suggestion";
            do {
                if (lastIndex === currentIndex) {
                    next = this.dom.employeesSuggestions.childNodes[firstIndex];
                } else {
                    next = next.nextSibling;
                }
                currentIndex += 1;
            } while (next.className !== "suggestion");
            next.className = "suggestion active";
        } else {
            this.dom.employeesSuggestions.childNodes[firstIndex].className = "suggestion active";
        }
    }
};
Widget.prototype.prevNameSuggestion = function (event) {
    "use strict";
    var activeIndex, firstIndex, lastIndex, node, x, currentIndex, prev;
    if (this.dom.employeesSuggestions.innerHTML !== "") {
        if (event.preventDefault) {
            event.preventDefault();
        } else {
            event.returnValue = false;
        }
        activeIndex = firstIndex = lastIndex = -1;
        for (x = 0; x < this.dom.employeesSuggestions.childNodes.length; x += 1) {
            node = this.dom.employeesSuggestions.childNodes[x];
            lastIndex = node.nodeType === 1 ? x : lastIndex;
            if (firstIndex === -1 && node.nodeType === 1) {
                firstIndex = x;
            }
            if (node.className.indexOf("active") !== -1) {
                activeIndex = x;
            }
        }
        if (activeIndex !== -1) {
            currentIndex = activeIndex;
            prev = this.dom.employeesSuggestions.childNodes[activeIndex];
            prev.className = "suggestion";
            do {
                if (firstIndex !== currentIndex) {
                    prev = prev.previousSibling;
                } else {
                    prev = this.dom.employeesSuggestions.childNodes[lastIndex];
                }
                currentIndex -= 1;
            } while (prev.className !== "suggestion");
            prev.className = "suggestion active";
        } else {
            this.dom.employeesSuggestions.childNodes[lastIndex].className = "suggestion active";
        }
    }
};
Widget.prototype.getActiveNameSuggestion = function () {
    "use strict";
    var node, x;
    if (this.dom.employeesSuggestions.innerHTML !== "") {
        for (x = 0; x < this.dom.employeesSuggestions.childNodes.length; x += 1) {
            node = this.dom.employeesSuggestions.childNodes[x];
            if (node.className.indexOf("active") !== -1 && node.nodeType === 1) {
                return node;
            }
        }
    }
    return;
};
Widget.prototype.findNameSuggestions = function (inputEl) {
    "use strict";
    var str, found, i, y, lName, fName, charCount;
    charCount = inputEl.value.toLowerCase().length;
    str = inputEl.value.toLowerCase().trim().split(" ");
    if (str[0] !== '' && charCount > 3) {
        this.dom.employeesSuggestions.innerHTML = "";
        for (i = 0; i < this.employeeList.length; i += 1) {
            lName = this.employeeList[i].last_name !== null ? this.employeeList[i].last_name.toLowerCase() : "empty";
            fName = this.employeeList[i].first_name !== null ? this.employeeList[i].first_name.toLowerCase() : "empty";
            found = true;
            for (y = 0; y < str.length; y += 1) {
                if (lName.indexOf(str[y]) !== -1 || fName.indexOf(str[y]) !== -1) {
                    found = true;
                } else {
                    found = false;
                    break;
                }
            }
            if (found) {
                this.dom.employeesSuggestions.innerHTML += "<div onmouseleave=\"return widget.onSuggestionOut(this);\" onmouseover=\"return widget.onSuggestionHover(this);\" onmousedown=\"return widget.onClickNameSuggestion(this, " + this.employeeList[i].id + ", '" + this.employeeList[i].first_name + " " + this.employeeList[i].last_name + "');\" class=\"suggestion\" data-id=\"" + this.employeeList[i].id  + "\">" + this.employeeList[i].first_name + " " + this.employeeList[i].last_name + "</div><br/>";
            }
        }
        if (this.dom.employeesSuggestions.innerHTML !== "") {
            this.showNameSuggestions();
        } else {
            this.hideNameSuggestions();
        }
    } else {
        this.hideNameSuggestions();
    }
};
//Event handlers
Widget.prototype.onNameUp = function (event, that) {
    "use strict";
    var keyCode = (event.which !== undefined) ? event.which : event.keyCode;
    if (keyCode !== 27 && keyCode !== 13 && keyCode !== 38 && keyCode !== 37 && keyCode !== 39 && keyCode !== 40) {
        this.findNameSuggestions(that);
    }
};
Widget.prototype.onNameDown = function (event, that) {
    "use strict";
    var keyCode, activeEl;
    keyCode = (event.which !== undefined) ? event.which : event.keyCode;
    if (keyCode === 27) {
        if (this.dom.employeesSuggestions.innerHTML !== "") {
            this.hideNameSuggestions();
        } else {
            if (parseInt(this.dom.employeesInputId.value, 10) === this.settings.userId) {
                that.value = this.settings.name;
            } else {
                that.value = that.getAttribute("data-new");
            }
        }
    } else if (keyCode === 13) {
        activeEl = this.getActiveNameSuggestion();
        if (activeEl !== undefined) {
            activeEl.onmousedown();
        }
    } else if (keyCode === 40) {
        if (this.dom.employeesSuggestions.innerHTML === "") {
            this.findNameSuggestions(that);
        } else {
            if (event.preventDefault) {
                event.preventDefault();
            } else {
                event.returnValue = false;
            }
            this.nextNameSuggestion();
        }
    } else if (keyCode === 38) {
        this.prevNameSuggestion(event);
    }
};
Widget.prototype.onAreaChange = function (event, that) {
    "use strict";
    var keyCode, str, found, i, name;
    keyCode = (event.which !== undefined) ? event.which : event.keyCode;
    if (keyCode === 27) {
        this.hideAreaSuggestions();
    } else {
        str = that.value.toLowerCase().trim();
        if (str !== '' && str.length > 0) {
            this.dom.areasSuggestions.innerHTML = "";
            for (i = 0; i < this.areaList.length; i += 1) {
                name = this.areaList[i].alias;
                found = name.toLowerCase().indexOf(str) !== -1 ? true : false;
                if (found) {
                    this.dom.areasSuggestions.innerHTML += "<div onmouseleave=\"return widget.onSuggestionOut(this);\" onmouseover=\"return widget.onSuggestionHover(this);\" onmousedown=\"return widget.onClickAreaSuggestion('" + this.areaList[i].alias + "');\" class=\"suggestion\">" + this.areaList[i].alias + "</div><br/>";
                }
            }
            if (this.dom.areasSuggestions.innerHTML !== "") {
                this.showAreaSuggestions();
            } else {
                this.hideAreaSuggestions();
            }
        } else {
            this.hideAreaSuggestions();
        }
    }
    this.changesMade();
};
Widget.prototype.onClickNameSuggestion = function (that, id, name) {
    "use strict";
    this.dom.employeesInputId.value = parseInt(id, 10);
    this.dom.employeesInputId.setAttribute("data-name", name);
    this.dom.employeesInputAc.setAttribute("data-new", name);
    this.dom.employeesInputAc.value = that.innerHTML;
    this.hideNameSuggestions();
    this.changesMade();
};
Widget.prototype.onClickAreaSuggestion = function (name) {
    "use strict";
    this.dom.areaInput.value = name;
    this.hideAreaSuggestions();
    this.changesMade();
};
Widget.prototype.onCogHover = function (that) {
    "use strict";
    that.style.backgroundPosition = "-22px 0";
};
Widget.prototype.onCogOut = function (that) {
    "use strict";
    that.style.backgroundPosition = "0 0";
};
Widget.prototype.onSuggestionHover = function (that) {
    "use strict";
    that.style.background = "#16a085";
};
Widget.prototype.onSuggestionOut = function (that) {
    "use strict";
    that.style.background = "";
};
Widget.prototype.changesMade = function () {
    "use strict";
    if (this.settings.alias === this.dom.aliasInput.value && this.settings.userId === parseInt(this.dom.employeesInputId.value, 10) && this.settings.homeArea.alias === this.dom.areaInput.value && this.settings.interval === parseInt(this.dom.intervalInput.value, 10) && this.settings.mute === this.dom.muteInput.checked) {
        this.dom.saveSpan.className = "disabled";
    } else {
        this.dom.saveSpan.className = "";
    }
};
Widget.prototype.onSaveClick = function (that) {
    "use strict";
    if (that.className !== "disabled") {
        this.saveSettings();
        this.saveConfig();
        this.closeSettings();
        this.dom.saveSpan.className = "disabled";
    }
};
Widget.prototype.onSettingsClick = function () {
    "use strict";
    if (document.body.getAttribute("data-showSettings") === "true") {
        this.closeSettings();
    } else {
        this.openSettings();
    }
};