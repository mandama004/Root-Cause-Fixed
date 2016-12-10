var selectSizeWithoutStatus = 8;
var selectSizeWithStatus = 6;
var numCommands = 0;
var thisCommand = 0;
var commandsList = new Array();
var tmrTick = null;
var tickCount = 0;
var sendNextGameTickerAfter = 0;
var verbButtonCount = 9;
var commandLog = null;

function init() {
    showStatusVisible(false);

    $("#button-restart").button().click(function () {
        $("#button-restart").removeClass("ui-state-focus ui-state-hover");
        uiDoRestart();
    });
    $("#button-undo").button().click(function () {
        $("#button-undo").removeClass("ui-state-focus ui-state-hover");
        uiDoUndo();
    });
    $("#button-wait").button().click(function () {
        $("#button-wait").removeClass("ui-state-focus ui-state-hover");
        uiDoWait();
    });
        $("#button-options").button().click(function () {
        $("#button-options").removeClass("ui-state-focus ui-state-hover");
        $("#gameMore").hide();
        $("#gameOptions").show();
    });
    $("#fontOptions").change(function () {
        var newFont = $("#fontOptions option:selected").text();
        $("#divOutput div span").css("font-family", newFont);
        $("#fontSample").css("font-family", newFont);
        currentFont = newFont;
        set(GetObject("game"), "defaultfont", newFont);
        saveGame();
    });
    $("#fontSize").change(function () {
        var newFontSize = $("#fontSize option:selected").val();
        $("#divOutput div span").css("font-size", newFontSize + "pt");
        $("#fontSample").css("font-size", newFontSize + "pt");
        currentFontSize = newFontSize;
        set(GetObject("game"), "defaultfontsize", parseInt(newFontSize));
        saveGame();
    });

    $(document).on("click", ".elementmenu", function (event) {
        if (!$(this).hasClass("disabled")) {
            event.preventDefault();
            event.stopPropagation();
            // TO DO
            $(this).blur();
            return false;
        }
    });

    $(document).on("click", ".exitlink", function () {
        if (!$(this).hasClass("disabled")) {
            sendCommand($(this).data("command"));
        }
    });

    $(document).on("click", ".commandlink", function () {
        var $this = $(this);
        if (!$this.hasClass("disabled") && canSendCommand) {
            if ($this.data("deactivateonclick")) {
                $this.addClass("disabled");
                $this.data("deactivated", true);
            }
            sendCommand($this.data("command"));
        }
    });

    worldmodelInitialise();
    if (!loadGame()) {
        worldModelBeginGame();
    }
}

function extLink(url) {
    window.open(url, "_system");
}

function showStatusVisible(visible) {
    if (visible) {
        $("#statusVars").show();
        $("#statusLabel").show();
    }
    else {
        $("#statusVars").hide();
        $("#statusLabel").hide();
    }
}

var beginningOfCurrentTurnScrollPosition = 0;
var scrollTimeout = null;

function scrollToEnd() {
    if (scrollTimeout != null) {
        clearTimeout(scrollTimeout);
    }

    scrollTimeout = setTimeout(function () {
        scrollTimeout = null;
        scrollToEndNow();
    }, 200);
}

function scrollToEndNow() {
    $('html, body').animate({ scrollTop: beginningOfCurrentTurnScrollPosition - 30 }, 200);
}

function updateLocation(text) {
}

var _waitMode = false;
var _pauseMode = false;
var _waitingForSoundToFinish = false;

var waitButtonId = 0;

function beginWait() {
    if (runningWalkthrough) {
        awaitingCallback = false;
        waitCallback();
        TryFinishTurn();
        return;
    }
    _waitMode = true;
    waitButtonId++;
    addText("<a class=\"cmdlink\" style=\"color:" + currentLinkForeground + ";font-family:" + currentFont + ";font-size:" + currentFontSize + "pt;\" id=\"waitButton" + waitButtonId + "\" >Continue...</a><br/><br/>");
    $("#waitButton" + waitButtonId).click(function () {
        _waitMode = false;
        $(this).hide();
        $("#divCommand").show();
        beginningOfCurrentTurnScrollPosition = $("#gameContent").height();
        window.setTimeout(function () {
            awaitingCallback = false;
            waitCallback();
            TryFinishTurn();
        }, 100);
    });
    $("#divCommand").hide();
}

function beginPause(ms) {
    _pauseMode = true;
    $("#divCommand").hide();
    window.setTimeout(function () {
        endPause()
    }, ms);
}

function endPause() {
    _pauseMode = false;
    $("#divCommand").show();
    window.setTimeout(function () {
        // TO DO
        //$("#fldUIMsg").val("endpause");
        //$("#cmdSubmit").click();
    }, 100);
}

function globalKey(e) {
    if (_waitMode) {
        endWait();
        return;
    }
}

function commandKey(e) {
    switch (keyPressCode(e)) {
        case 13:
            runCommand();
            return false;
        case 38:
            thisCommand--;
            if (thisCommand == 0) thisCommand = numCommands;
            $("#txtCommand").val(commandsList[thisCommand]);
            break;
        case 40:
            thisCommand++;
            if (thisCommand > numCommands) thisCommand = 1;
            $("#txtCommand").val(commandsList[thisCommand]);
            break;
        case 27:
            thisCommand = numCommands + 1;
            $("#txtCommand").val("");
            break;
    }
}

function runCommand() {
    var command = $("#txtCommand").val();
    if (command.length > 0) {
        numCommands++;
        commandsList[numCommands] = command;
        thisCommand = numCommands + 1;
        sendCommand(command);
        $("#txtCommand").val("");
    }
}

function prepareCommand(command) {
    // TO DO
    //$("#fldUITickCount").val(getTickCountAndStopTimer());
    //$("#fldUIMsg").val("command " + command);
}

function showQuestion(title) {
    $("#msgboxCaption").html(title);

    var msgboxOptions = {
        modal: true,
        autoOpen: false,
        buttons: [
            {
                text: "Yes",
                click: function () { msgboxSubmit("yes"); }
            },
            {
                text: "No",
                click: function () { msgboxSubmit("no"); }
            }
        ],
        closeOnEscape: false,
        open: function (event, ui) { $(".ui-dialog-titlebar-close").hide(); }    // suppresses "close" button
    };

    $("#msgbox").dialog(msgboxOptions);
    $("#msgbox").dialog("open");
}

function msgboxSubmit(text) {
    $("#msgbox").dialog("close");
    window.setTimeout(function () {
        // TO DO
        //$("#fldUIMsg").val("msgbox " + text);
        //$("#cmdSubmit").click();
    }, 100);
}

var _menuSelection = "";

function showMenu(title, options, allowCancel) {
    $("#dialogOptions").empty();
    $.each(options, function (key, value) {
        $("#dialogOptions").append(
            $("<option/>").attr("value", key).text(value)
        );
    });

    $("#dialogCaption").html(title);

    var dialogOptions = {
        modal: true,
        autoOpen: false,
        buttons: [{
            text: "Select",
            click: function () { dialogSelect(); }
        }]
    };

    if (allowCancel) {
        dialogOptions.buttons = dialogOptions.buttons.concat([{
            text: "Cancel",
            click: function () { dialogCancel(); }
        }]);
        dialogOptions.close = function (event, ui) { dialogClose(); };
    }
    else {
        dialogOptions.closeOnEscape = false;
        dialogOptions.open = function (event, ui) { $(".ui-dialog-titlebar-close").hide(); };    // suppresses "close" button
    }

    _menuSelection = "";
    $("#dialog").dialog(dialogOptions);

    $("#dialog").dialog("open");
}

function dialogSelect() {
    _menuSelection = $("#dialogOptions").val();
    if (_menuSelection.length > 0) {
        $("#dialog").dialog("close");
        window.setTimeout(function () {
            SetMenuSelection(_menuSelection);
            updateLists();
        }, 100);
    }
}

function dialogCancel() {
    $("#dialog").dialog("close");
}

function dialogClose() {
    if (_menuSelection.length == 0) {
        dialogSendCancel();
    }
}

function dialogSendCancel() {
    window.setTimeout(function () {
        // TO DO
        //$("#fldUIMsg").val("choicecancel");
        //$("#cmdSubmit").click();
    }, 100);
}

function sessionTimeout() {
    disableInterface();
}

function gameFinished() {
    disableInterface();
}

function disableInterface() {
    $("#divCommand").hide();
    $("#gamePanesRunning").hide();
    $("#gamePanesFinished").show();
}

function playWav(filename, sync, looped) {
}

function playMp3(filename, sync, looped) {
    playAudio(filename, "mp3", sync, looped);
}

function playAudio(filename, format, sync, looped) {
}

function stopAudio() {
}

function finishSync() {
    _waitingForSoundToFinish = false;
    window.setTimeout(function () {
        $("#divCommand").show();
        $("#fldUIMsg").val("endwait");
        $("#cmdSubmit").click();
    }, 100);
}

function panesVisible(visible) {
    if (visible) {
        $("#gamePanes").show();
    }
    else {
        $("#gamePanes").hide();
    }
}

function uiShow(element) {
    if (element == "") return;
    $(element).show();
}

function uiHide(element) {
    if (element == "") return;
    $(element).hide();
}

var _compassDirs = ["northwest", "north", "northeast", "west", "east", "southwest", "south", "southeast", "up", "down", "in", "out"];

var lastPaneLinkId = 0;

function updateList(listName, listData) {
    var listElement = "";
    var emptyListLabel = "";

    if (listName == "inventory") {
        listElement = "#inventoryList";
        emptyListLabel = "#inventoryEmpty";
    }

    if (listName == "placesobjects") {
        listElement = "#objectsList";
        emptyListLabel = "#placesObjectsEmpty";
    }

    $(listElement).empty();
    $(listElement).show();
    var listcount = 0;
    var anyItem = false;

    $.each(listData, function (key, value) {
        var splitString = value.split(":");
        var objectDisplayName = splitString[0];
        var objectVerbs = splitString[1];

        if (listName == "inventory" || $.inArray(objectDisplayName, _compassDirs) == -1) {
            listcount++;
            lastPaneLinkId++;
            var paneLinkId = "paneLink" + lastPaneLinkId;
            $(listElement).append(
                "<li id=\"" + paneLinkId + "\" href=\"#\">" + objectDisplayName + "</li>"
            );
            bindMenu(paneLinkId, objectVerbs, objectDisplayName, false);
            anyItem = true;
        }
    });
    $(listElement + " li:last-child").addClass('last-child')
    if (listcount == 0) $(listElement).hide();
    if (anyItem) {
        $(emptyListLabel).hide();
    }
    else {
        $(emptyListLabel).show();
    }
}

function updateCompass(directions) {
    updateDir(directions, "NW", _compassDirs[0]);
    updateDir(directions, "N", _compassDirs[1]);
    updateDir(directions, "NE", _compassDirs[2]);
    updateDir(directions, "W", _compassDirs[3]);
    updateDir(directions, "E", _compassDirs[4]);
    updateDir(directions, "SW", _compassDirs[5]);
    updateDir(directions, "S", _compassDirs[6]);
    updateDir(directions, "SE", _compassDirs[7]);
    updateDir(directions, "U", _compassDirs[8]);
    updateDir(directions, "D", _compassDirs[9]);
    updateDir(directions, "In", _compassDirs[10]);
    updateDir(directions, "Out", _compassDirs[11]);
}

function updateDir(directions, label, dir) {
    $("#cmdCompass" + label).attr("disabled", $.inArray(dir, directions) == -1);
}

function compassClick(direction) {
    sendCommand(direction);
}

function sendCommand(text) {
    if (!gameRunning) return;
    if (awaitingInputCallback) {
        awaitingInputCallback = false;
        awaitingCallback = false;
        getinputCallback(text);
        return;
    }
    if (awaitingCallback) return;
    beginningOfCurrentTurnScrollPosition = $("#gameContent").height();

    if (_pauseMode || _waitingForSoundToFinish) return;
    if (_waitMode) {
        endWait();
        return;
    }
    window.setTimeout(function () {
        // TO DO - send tick count
        //prepareCommand(text);

        
                    if (text.substring(0, 6) == "cheat ") {
                runCheatCode(text.substring(6));
            }
            else {
                sendCommandInternal(text);
            }
                }, 100);
}

function sendCommandInternal(command) {
    var start = (new Date).getTime();
    addToCommandLog(command);
    HandleCommand(command);
    var diff = (new Date).getTime() - start;
    TryFinishTurn();
}

function addToCommandLog(command) {
    if (commandLog == null) {
        commandLog = new Array();
    }
    commandLog.push(command);
}

function runCheatCode(code) {
    var walkthrough = window["object_main"];
    if (walkthrough.steps.indexOf("label:" + code) > -1) {
        runWalkthrough("main", 0, 0, code);
    }
    else {
        sendCommandInternal("cheat " + code);
    }
}


function generateSaveLog(fn) {
    var gameElementArray = new Array();
    gameElementArray.push(GetObject("game"));
    generateSaveLogForArray(gameElementArray, fn);
    generateSaveLogForArray(allObjects, fn);
    generateSaveLogForArray(allExits, fn);
    generateSaveLogForArray(allCommands, fn);
    generateSaveLogForArray(allTurnScripts, fn);
    generateSaveLogForArray(allTimers, fn);
    thisTurnModifiedItems = new Array();
}

function generateSaveLogForArray(array, fn) {
    for (var idx in array) {
        var object = array[idx];
        var attrs = object["__modified"];
        if (attrs != undefined) {
            for (var attrIdx in attrs) {
                var attr = attrs[attrIdx];
                fn(object, attr, object[attr]);
            }
        }

        for (var attr in object) {
            var value = object[attr];
            if (typeof value === "object") {
                for (var idx in thisTurnModifiedItems) {
                    var item = thisTurnModifiedItems[idx];

                    if (value === item) {
                        markAttributeModified(object, attr);
                        fn(object, attr, value);
                        break;
                    }
                }
            }
        }
    }
}

function saveGame() {
    if (!gameRunning) return;
    if (awaitingCallback) return;
    if (runningWalkthrough) return;
    setTimeout(function () {
        var start = (new Date).getTime();
        saveGameInternal();
        var diff = (new Date).getTime() - start;
    }, 250);
}

function saveGameInternal() {
    if (!gameRunning) return;
    if (awaitingCallback) return;
    if (!localStorage) return;
    try {
        localStorageTransactionId = localStorage.getItem("transaction");
        if (localStorageTransactionId == undefined) {
            localStorageTransactionId = 1;
        }
        else {
            localStorageTransactionId = 3 - localStorageTransactionId;
        }

        localStorageSet("output", allOutput);
        localStorageSet("output2", $("#divOutput").html());
        if (commandLog != null) {
            localStorageSet("commandLog", commandLog.join(";"));
        }
        localStorageSet("nextObjectId", nextObjectId);

        // Save all object creations
        var createId = 0;
        for (var idx in createdObjects) {
            createId++;
            localStorageSet("create" + createId, createdObjects[idx]);
        }
        localStorageSet("numCreates", createId);

        // Save all object type additions
        var addTypeId = 0;
        for (var idx in addedTypes) {
            addTypeId++;
            localStorageSet("addtype" + addTypeId, addedTypes[idx]);
        }
        localStorageSet("numAddTypes", addTypeId);

        // Save all object attribute changes
        var changeId = 0;
        generateSaveLog(function (object, attribute, value) {
            var valueType = TypeOf(value);
            if (object.name == "player" && StartsWith(attribute, "currentcommand")) return;
            changeId++;
            var key = "change" + changeId;
            var storeValue = value;
            switch (valueType) {
                case "stringlist":
                    storeValue = value.length;
                    var count = 0;
                    for (var idx in value) {
                        localStorageSet(key + "_" + count, value[idx]);
                        count++;
                    }
                    break;
                case "objectlist":
                    storeValue = value.length;
                    var count = 0;
                    for (var idx in value) {
                        localStorageSet(key + "_" + count, value[idx]._js_name);
                        count++;
                    }
                    break;
                case "stringdictionary":
                case "scriptdictionary":
                    var count = 0;
                    for (var dictKey in value) {
                        localStorageSet(key + "_k" + count, dictKey);
                        localStorageSet(key + "_v" + count, value[dictKey]);
                        count++;
                    }
                    storeValue = count;
                    break;
                case "objectdictionary":
                    var count = 0;
                    for (var dictKey in value) {
                        localStorageSet(key + "_k" + count, dictKey);
                        localStorageSet(key + "_v" + count, value[dictKey]._js_name);
                        count++;
                    }
                    storeValue = count;
                    break;
                case "object":
                    storeValue = value._js_name;
                    break;
                case "null":
                    storeValue = "";
            }

            localStorageSet(key, object._js_name + "." + attribute + "=" + valueType + ":" + storeValue);
        });
        localStorageSet("numChanges", changeId);

        // Save all object destroys
        var destroyId = 0;
        for (var idx in destroyedObjects) {
            destroyId++;
            localStorageSet("destroy" + destroyId, destroyedObjects[idx]);
        }
        localStorageSet("numDestroys", destroyId);

        localStorage.setItem("transaction", localStorageTransactionId);
    }
    catch (err) {
        reportError("Failed to save game: " + err);
    }
}

function loadGame() {
    if (!localStorage) return false;

    localStorageTransactionId = localStorage.getItem("transaction");
    if (localStorageTransactionId == undefined) {
        return false;
    }
    try {
        nextObjectId = parseInt(localStorageGet("nextObjectId"));

        // Load object creations

        var commandLogList = localStorageGet("commandLog");
        if (commandLogList != null) {
            commandLog = commandLogList.split(";");
        }
        addToCommandLog("* loaded game");

        var createCount = localStorageGet("numCreates");
        for (var i = 1; i <= createCount; i++) {
            var data = localStorageGet("create" + i);
            var params = data.split(";");
            // format is name;defaultTypeObject.name;objectType
            switch (params[2]) {
                case "object":
                    var array = allObjects;
                    break;
                case "exit":
                    var array = allExits;
                    break;
                case "timer":
                    break;
                case "turnscript":
                    break;
                default:
                    throw "Unhandled create object type " + params[2];
            }
            if (params[2] == "timer") {
                createtimer(params[0]);
            }
            else if (params[2] == "turnscript") {
                createturnscript(params[0]);
            }
            else {
                createInternal(params[0], array, GetObject(params[1]), params[2]);
                // TODO: Add to objectsNameMap
            }
        }

        // Load object type additions

        var addTypeCount = localStorageGet("numAddTypes");
        for (var i = 1; i <= addTypeCount; i++) {
            var data = localStorageGet("addtype" + i);
            var params = data.split(";");
            // format is object;type
            addTypeToObject(window[params[0]], window[params[1]]);
        }

        // Load object attribute changes

        var changeCount = localStorageGet("numChanges");
        for (var i = 1; i <= changeCount; i++) {
            var data = localStorageGet("change" + i);
            var dotPos = data.indexOf(".");
            var eqPos = data.indexOf("=");
            var colonPos = data.indexOf(":");
            var objectName = data.substring(0, dotPos);
            var attrName = data.substring(dotPos + 1, eqPos);
            var type = data.substring(eqPos + 1, colonPos);
            var valueString = data.substring(colonPos + 1);

            var object = window[objectName];
            var value = valueString;

            switch (type) {
                case "script":
                    eval("_temp_assignfn=" + valueString);
                    value = _temp_assignfn;
                    break;
                case "stringlist":
                    var count = parseInt(valueString);
                    value = new Array();
                    for (var listIdx = 0; listIdx < count; listIdx++) {
                        value.push(localStorageGet("change" + i + "_" + listIdx));
                    }
                    break;
                case "objectlist":
                    var count = parseInt(valueString);
                    value = new Array();
                    for (var listIdx = 0; listIdx < count; listIdx++) {
                        value.push(window[localStorageGet("change" + i + "_" + listIdx)]);
                    }
                    break;
                case "stringdictionary":
                    var count = parseInt(valueString);
                    value = new Object();
                    for (var listIdx = 0; listIdx < count; listIdx++) {
                        var dictKey = localStorageGet("change" + i + "_k" + listIdx);
                        var dictVal = localStorageGet("change" + i + "_v" + listIdx);
                        value[dictKey] = dictVal;
                    }
                    break;
                case "objectdictionary":
                    var count = parseInt(valueString);
                    value = new Object();
                    for (var listIdx = 0; listIdx < count; listIdx++) {
                        var dictKey = localStorageGet("change" + i + "_k" + listIdx);
                        var dictVal = localStorageGet("change" + i + "_v" + listIdx);
                        value[dictKey] = window[dictVal];
                    }
                    break;
                case "scriptdictionary":
                    var count = parseInt(valueString);
                    value = new Object();
                    for (var listIdx = 0; listIdx < count; listIdx++) {
                        var dictKey = localStorageGet("change" + i + "_k" + listIdx);
                        var dictVal = localStorageGet("change" + i + "_v" + listIdx);
                        eval("_temp_assignfn=" + dictVal);
                        value[dictKey] = _temp_assignfn;
                    }
                    break;
                case "object":
                    value = window[valueString];
                    break;
                case "null":
                    value = null;
                    break;
                case "int":
                    value = parseInt(valueString);
                    break;
                case "double":
                    value = parseFloat(valueString);
                    break;
                case "boolean":
                    value = (valueString == "true");
            }

            set(object, attrName, value, false);
        }

        // Load object destroys

        var destroyCount = localStorageGet("numDestroys");
        for (var i = 1; i <= destroyCount; i++) {
            var data = localStorageGet("destroy" + i);
            destroy(data);
        }

        currentFont = GetObject("game").defaultfont;
        $("#fontOptions").val(currentFont);

        currentFontSize = GetObject("game").defaultfontsize.toString();
        $("#fontSize").val(currentFontSize);

        $("#fontSample").css("font-family", currentFont);
        $("#fontSample").css("font-size", currentFontSize + "pt");

        clearScreen();
        $("#divOutput").html(localStorageGet("output2"));
        msg(localStorageGet("output"));

        beginningOfCurrentTurnScrollPosition = $("#gameContent").height();
        scrollToEnd();

        updateLists();
        return true;
    }
    catch (err) {
        reportError("Failed to load game: " + err);
        return false;
    }
}

var localStorageTransactionId;
var lastRead;

function localStorageSet(key, value) {
    localStorage.setItem("c" + localStorageTransactionId + key, value);
}

function localStorageGet(key) {
    lastRead = key;
    return localStorage.getItem("c" + localStorageTransactionId + key);
}

var currentWalkthroughSteps;
var runningWalkthrough = false;
var stepCount;
var walkthroughMaxSteps;
var walkthroughFinishCode;

function runWalkthrough(name, startStep, maxSteps, cheatCode) {
        stepCount = 0;
        walkthroughMaxSteps = maxSteps;
    walkthroughFinishCode = cheatCode;
    var walkthrough = getElement(name);
    if (walkthrough) {
        currentWalkthroughSteps = addWalkthroughSteps(walkthrough);
        currentWalkthroughSteps.splice(0, startStep);
        runningWalkthrough = true;
        runWalkthroughSteps();
    }
    else {
        msg("No walkthrough of that name");
    }
}

function addWalkthroughSteps(walkthrough) {
    var list = new Array();
    if (walkthrough.parent != null) {
        list = list.concat(addWalkthroughSteps(walkthrough.parent));
    }
    list = list.concat(walkthrough.steps);
    return list;
}

var postStep = null;

function runWalkthroughSteps() {
    
    if (currentWalkthroughSteps == null || currentWalkthroughSteps.length == 0 || (walkthroughMaxSteps > 0 && stepCount >= walkthroughMaxSteps)) {
                runningWalkthrough = false;
        saveGame();
        return;
    }

    var step = currentWalkthroughSteps.splice(0, 1)[0];

    if (step == "label:" + walkthroughFinishCode) {
        runningWalkthrough = false;
        saveGame();
        return;
    }

    msg("");
    if (StartsWith(step, "assert:")) {
            }
    else if (StartsWith(step, "label:")) {
        // ignore
    }
    else {
        stepCount++;
                beginningOfCurrentTurnScrollPosition = $("#gameContent").height();
                sendCommandInternal(step);
        scrollToEndNow();
    }
    while (postStep) {
        var fn = postStep;
        postStep = null;
        fn();
    }

    setTimeout(function () {
        runWalkthroughSteps();
    }, 100);
}

function updateStatus(text) {
    if (text.length > 0) {
        showStatusVisible(true);
        $("#statusVars").html(text.replace(/\n/g, "<br/>"));
    }
    else {
        showStatusVisible(false);
    }
}

function setBackground(col) {
    $("#divOutput").css("background-color", col);
    $("#gamePanel").css("background-color", col);
}

function ASLEvent(event, parameter) {
    var fn = window[event];
    fn.apply(null, [parameter]);
}

function disableMainScrollbar() {
    $("#divOutput").css("overflow", "hidden");
}

function stopTimer() {
    clearInterval(tmrTick);
}

function getTickCountAndStopTimer() {
    stopTimer();
    return tickCount;
}

function goUrl(href) {
    window.open(href);
}

function setCompassDirections(directions) {
    _compassDirs = directions;
    $("#cmdCompassNW").attr("title", _compassDirs[0]);
    $("#cmdCompassN").attr("title", _compassDirs[1]);
    $("#cmdCompassNE").attr("title", _compassDirs[2]);
    $("#cmdCompassW").attr("title", _compassDirs[3]);
    $("#cmdCompassE").attr("title", _compassDirs[4]);
    $("#cmdCompassSW").attr("title", _compassDirs[5]);
    $("#cmdCompassS").attr("title", _compassDirs[6]);
    $("#cmdCompassSE").attr("title", _compassDirs[7]);
    $("#cmdCompassU").attr("title", _compassDirs[8]);
    $("#cmdCompassD").attr("title", _compassDirs[9]);
    $("#cmdCompassIn").attr("title", _compassDirs[10]);
    $("#cmdCompassOut").attr("title", _compassDirs[11]);
}

function setInterfaceString(name, text) {
    switch (name) {
        case "InventoryLabel":
            $("#inventoryLabel").html(text);
            break;
        case "PlacesObjectsLabel":
            $("#placesObjectsLabel").html(text);
            break;
        case "CompassLabel":
            $("#compassLabel").html(text);
            break;
        case "InButtonLabel":
            $("#cmdCompassIn").attr("value", text);
            break;
        case "OutButtonLabel":
            $("#cmdCompassOut").attr("value", text);
            break;
        case "EmptyListLabel":
            break;
        case "NothingSelectedLabel":
            break;
    }
}

function updateVerbButtons(list, verbsArray, idprefix) {
    var selectedIndex = list.prop("selectedIndex");
    var verbs = verbsArray[selectedIndex].split("/");
    var count = 1;
    $.each(verbs, function () {
        var target = $("#" + idprefix + count);
        target.attr("value", this);
        target.show();
        count++;
    });
    for (var i = count; i <= verbButtonCount; i++) {
        var target = $("#" + idprefix + i);
        target.hide();
    }
}
var _currentDiv = null;

function setCommandBarStyle(style) {
    var width = $("#txtCommand").width();
    $("#txtCommand").attr("style", style);
    $("#txtCommand").width(width);
}

function addText(text) {
    if (_currentDiv == null) {
        createNewDiv("left");
    }

    _currentDiv.append(text);
    scrollToEnd();
}

var _divCount = 0;

function createNewDiv(alignment) {
    _divCount++;
    $("<div/>", {
        id: "divOutputAlign" + _divCount,
        style: "text-align: " + alignment
    }).appendTo("#divOutput");
    _currentDiv = $("#divOutputAlign" + _divCount);
}

function bindMenu(linkid, verbs, text, inline) {
    var verbsList = verbs.split("/");

    var options = [];
    $.each(verbsList, function (key, value) {
        options = options.concat({ title: value, action: { type: "fn", callback: "doMenuClick('" + value.toLowerCase() + " " + text.replace("'", "\\'") + "');" } });
    });

    $("#" + linkid).jjmenu("both", options, {}, { show: "fadeIn", speed: 100, xposition: "left", yposition: "auto", "orientation": "auto" });
}

function doMenuClick(command) {
    $("div[id^=jjmenu]").remove();
    sendCommand(command);
}

function updateObjectLinks(data) {
    $(".elementmenu").each(function (index, e) {
        var $e = $(e);
        var verbs = data[$e.data("elementid")];
        if (verbs) {
            $e.removeClass("disabled");
            $e.data("verbs", verbs);
            // also set attribute so verbs are persisted to savegame
            $e.attr("data-verbs", verbs);
        } else {
            $e.addClass("disabled");
        }
    });
}

function updateExitLinks(data) {
    $(".exitlink").each(function (index, e) {
        var $e = $(e);
        var exitid = $e.data("elementid");
        var available = $.inArray(exitid, data) > -1;
        if (available) {
            $e.removeClass("disabled");
        } else {
            $e.addClass("disabled");
        }
    });
}

function updateCommandLinks(data) {
    $(".commandlink").each(function (index, e) {
        var $e = $(e);
        var exitid = $e.data("elementid");
        var available = $.inArray(exitid, data) > -1;
        if (available) {
            $e.removeClass("disabled");
        } else {
            $e.addClass("disabled");
        }
    });
}

function disableAllCommandLinks() {
    $(".commandlink").each(function (index, e) {
        $(e).addClass("disabled");
    });
}

function clearScreen() {
    allOutput = "";
    $("#divOutput").html("");
    createNewDiv("left");
    beginningOfCurrentTurnScrollPosition = 0;
}

function keyPressCode(e) {
    var keynum
    if (window.event) {
        keynum = e.keyCode
    } else if (e.which) {
        keynum = e.which
    }
    return keynum;
}

function AddYouTube(id) {
    var embedHTML = "<object width=\"425\" height=\"344\"><param name=\"movie\" value=\"http://www.youtube.com/v/" + id + "\"></param><param name=\"allowFullScreen\" value=\"true\"></param><param name=\"allowscriptaccess\" value=\"always\"></param><embed src=\"http://www.youtube.com/v/" + id + "\" type=\"application/x-shockwave-flash\" allowscriptaccess=\"always\" allowfullscreen=\"true\" width=\"425\" height=\"344\"></embed></object>";
    addText(embedHTML);
}

function AddVimeo(id) {
    var embedHTML = "<object width=\"400\" height=\"225\"><param name=\"allowfullscreen\" value=\"true\" /><param name=\"allowscriptaccess\" value=\"always\" /><param name=\"movie\" value=\"http://vimeo.com/moogaloop.swf?clip_id=" + id + "&amp;server=vimeo.com&amp;show_title=0&amp;show_byline=0&amp;show_portrait=0&amp;color=00adef&amp;fullscreen=1&amp;autoplay=0&amp;loop=0\" /><embed src=\"http://vimeo.com/moogaloop.swf?clip_id=" + id + "&amp;server=vimeo.com&amp;show_title=0&amp;show_byline=0&amp;show_portrait=0&amp;color=00adef&amp;fullscreen=1&amp;autoplay=0&amp;loop=0\" type=\"application/x-shockwave-flash\" allowfullscreen=\"true\" allowscriptaccess=\"always\" width=\"400\" height=\"225\"></embed></object>";
    addText(embedHTML);
}

function SetMenuBackground(color) {
    var css = getCSSRule("div.jj_menu_item");
    if (css) {
        css.style.backgroundColor = color;
    }
}

function SetMenuForeground(color) {
    var css = getCSSRule("div.jj_menu_item");
    if (css) {
        css.style.color = color;
    }
}

function SetMenuHoverBackground(color) {
    var css = getCSSRule("div.jj_menu_item_hover");
    if (css) {
        css.style.backgroundColor = color;
    }
}

function SetMenuHoverForeground(color) {
    var css = getCSSRule("div.jj_menu_item_hover");
    if (css) {
        css.style.color = color;
    }
}

function SetMenuFontName(font) {
    var css = getCSSRule("div.jjmenu");
    if (css) {
        css.style.fontFamily = font;
    }
}

function SetMenuFontSize(size) {
    // disabled
    //var css = getCSSRule("div.jjmenu");
    //if (css) {
    //    css.style.fontSize = size;
    //}
}

function TurnOffHyperlinksUnderline() {
    var css = getCSSRule("a.cmdlink");
    if (css) {
        css.style.textDecoration = "none";
    }
}

var _outputSections = new Array();

function JsStartOutputSection(name) {
    if ($.inArray(name, _outputSections) == -1) {
        _outputSections.push(name);
        createNewDiv("left");
    }
}

function JsEndOutputSection(name) {
    var index = $.inArray(name, _outputSections);
    if (index != -1) {
        _outputSections.splice(index, 1);
        createNewDiv("left");
    }
}

function JsHideOutputSection(name) {
    EndOutputSection(name);
    $("." + name + " a").attr("onclick", "");
    setTimeout(function () {
        $("." + name).hide(250, function () { $(this).remove(); });
    }, 250);
}

function getCSSRule(ruleName, deleteFlag) {
    ruleName = ruleName.toLowerCase();
    if (document.styleSheets) {
        for (var i = 0; i < document.styleSheets.length; i++) {
            var styleSheet = document.styleSheets[i];
            var ii = 0;
            var cssRule = false;
            do {
                if (styleSheet.cssRules) {
                    cssRule = styleSheet.cssRules[ii];
                } else if (styleSheet.rules) {
                    cssRule = styleSheet.rules[ii];
                }
                if (cssRule) {
                    if (typeof cssRule.selectorText != "undefined") {
                        if (cssRule.selectorText.toLowerCase() == ruleName) {
                            if (deleteFlag == 'delete') {
                                if (styleSheet.cssRules) {
                                    styleSheet.deleteRule(ii);
                                } else {
                                    styleSheet.removeRule(ii);
                                }
                                return true;
                            } else {
                                return cssRule;
                            }
                        }
                    }
                }
                ii++;
            } while (cssRule)
        }
    }
    return false;
}

function killCSSRule(ruleName) {
    return getCSSRule(ruleName, 'delete');
}

function addCSSRule(ruleName) {
    if (document.styleSheets) {
        if (!getCSSRule(ruleName)) {
            if (document.styleSheets[0].addRule) {
                document.styleSheets[0].addRule(ruleName, null, 0);
            } else {
                document.styleSheets[0].insertRule(ruleName + ' { }', 0);
            }
        }
    }
    return getCSSRule(ruleName);
}

function uiDoRestart() {
    if (localStorage) {
        localStorage.clear();
    }
    window.location.reload();
}

function reportError(errorMessage) {
    alert(errorMessage);
    console.log(errorMessage);
}

// WORLDMODEL ===================================================================================================================

var webPlayer = true;
var tmrTick = null;
var awaitingCallback = false;
var gameRunning = true;
var gameActive = true;

function worldmodelInitialise() {
    resolveObjectReferences();
    GetObject("game").timeelapsed = 0;
    for (var idx in allTimers) {
        var timer = allTimers[idx];
        if (timer.enabled) {
            timer.trigger = timer.interval;
        }
    }
    setObjectChildAttributes();
    if (typeof InitInterface == 'function') {
        InitInterface();
    }
    updateLists();
    tmrTick = setInterval(function () {
        timerTick();
    }, 1000);
}

function worldModelBeginGame() {
    StartGame();
    TryRunOnReadyScripts();
    updateLists();
}

function resolveObjectReferences() {
    for (var item in objectReferences) {
        var objData = objectReferences[item];
        window[objData[0]][objData[1]] = window[objData[2]];
    }
    for (var item in objectListReferences) {
        var objData = objectListReferences[item];
        var parent = window[objData[0]];
        var attribute = objData[1].replace(/ /g, "___SPACE___");
        var itemValue = objData[2];
        if (typeof parent[attribute] == "undefined") {
            parent[attribute] = new Array();
        }
        parent[attribute].push(window[itemValue]);
    }
    for (var item in objectDictionaryReferences) {
        var objData = objectDictionaryReferences[item];
        var parent = window[objData[0]];
        var attribute = objData[1].replace(/ /g, "___SPACE___");
        var itemKey = objData[2];
        var itemValue = objData[3];
        if (typeof parent[attribute] == "undefined") {
            parent[attribute] = new Object();
        }
        parent[attribute][itemKey] = window[itemValue];
    }
}

function setObjectChildAttributes() {
    for (var idx in allObjects) {
        var obj = allObjects[idx];
        if (obj.parent) {
            addChildObject(obj.parent, obj);
        }
    }
}

function addChildObject(parent, child) {
    if (!parent["_children"]) {
        parent["_children"] = new Array();
    }
    parent["_children"].push(child);
}

function updateLists() {
    setTimeout(function () {
        updateListsInternal();
    }, 1000);
}

function updateListsInternal() {
    updateObjectsLists();
    updateExitsList();
    if (typeof UpdateStatusAttributes == "function") {
        UpdateStatusAttributes();
    }
}

function updateObjectsLists() {
    updateObjectsList("GetPlacesObjectsList", "placesobjects");
    updateObjectsList("ScopeInventory", "inventory");
}

function updateObjectsList(scope, listName) {
    var listItems = window[scope]();
    if (scope == "GetPlacesObjectsList") {
        listItems = listItems.concat(ScopeExits());
    }
    var listData = new Array();
    for (var item in listItems) {
        var verbs = (listName == "inventory") ? listItems[item].inventoryverbs : listItems[item].displayverbs;
        if (verbs != undefined) {
            var verbsList = verbs.join("/");
        }
        else {
            var verbsList = "";
        }
        listData.push(GetDisplayAlias(listItems[item]) + ":" + verbsList);
    }
    updateList(listName, listData);
}

function updateExitsList() {
    var listItems = ScopeExits();
    var listData = new Array();
    for (var item in listItems) {
        listData.push(listItems[item].alias);
    }
    updateCompass(listData);
}

function attributeChanged(object, attribute, runscript) {
    // TO DO: "Meta" field SortIndex - changed when object moves to a new parent, so it appears at the end of the list
    // of children.
    markAttributeModified(object, attribute);
    if (runscript) {
        var changedScript = "changed" + attribute;
        if (typeof object[changedScript] == "function") {
            object[changedScript]();
        }
    }
}

var nextObjectId = 0;

function getUniqueId() {
    nextObjectId++;
    return "dynid" + nextObjectId;
}

var transactions = new Array();
var currentTransaction;

function preAttributeChange(object, attribute, newValue) {
    if (currentTransaction != undefined) {
        // store the old value on the undo list
        var oldValue = object[attribute];
        var undoFunction;
        if (attribute == "parent") {
            undoFunction = function () {
                newValue = object[attribute];
                object[attribute] = oldValue;
                objectMoved(object, newValue, oldValue);
            };
        }
        else {
            undoFunction = function () {
                object[attribute] = oldValue;
            };
        }

        currentTransaction.undolist.push(undoFunction);
    }

    var type = TypeOf(newValue);

    // if value requires cloning first then return a clone
    if (type == "stringdictionary" || type == "objectdictionary" || type == "scriptdictionary") {
        var result = new Object();
        for (key in newValue) {
            result[key] = newValue[key];
        }
        return result;
    }
    else if (type == "objectlist" || type == "stringlist") {
        var result = new Array();
        for (idx in newValue) {
            result.push(newValue[idx]);
        }
        return result;
    }

    return newValue;
}

function markAttributeModified(object, attribute) {
    if (object["__modified"] == undefined) {
        object["__modified"] = new Array();
    }
    if (object["__modified"].indexOf(attribute) == -1) {
        object["__modified"].push(attribute);
    }
}

var thisTurnModifiedItems = new Array();

function markModified(item) {
    if (thisTurnModifiedItems.indexOf(item) == -1) {
        thisTurnModifiedItems.push(item);
    }
}

// Javascript magic to support function overloading
// from http://ejohn.org/blog/javascript-method-overloading/
// addMethod - By John Resig (MIT Licensed)

function addMethod(object, name, fn) {
    var old = object[name];
    object[name] = function () {
        if (fn.length == arguments.length)
            return fn.apply(this, arguments);
        else if (typeof old == 'function')
            return old.apply(this, arguments);
    };
}

// Script commands

var objectTag = new XRegExp("\<object (id='(.*?)' )?verbs='(?<verbs>.*?)'\>(?<text>.*?)\<\/object\>");
var colorTag = /\<color color="(.*?)"\>(.*?)\<\/color\>/;
var commandTag = /\<command input="(.*?)"\>(.*?)\<\/command\>/;
var alignTag = /\<align align="(.*?)"\>(.*?)\<\/align\>/;
var fontTag = /\<font size="(.*?)"\>(.*?)\<\/font\>/;
var currentFont = "";
var currentFontSize = "";
var currentForeground = "";
var currentLinkForeground = "";
var nextID = 1;
var allOutput = "";

function msg(text) {
    //%%MIN V540
    OutputText(text);
    //%%END MIN V540

    }

function listadd(list, item) {
    if (currentTransaction != undefined) {
        var undoFunction = function () {
            list.splice(list.length - 1, 1);
        }
        currentTransaction.undolist.push(undoFunction);
    }
    list.push(item);
    markModified(list);
}

function listremove(list, item) {
    var index = list.indexOf(item);
    if (index != -1) {
        if (currentTransaction != undefined) {
            var undoFunction = function () {
                listadd(list, item);
            }
            currentTransaction.undolist.push(undoFunction);
        }

        list.splice(index, 1);
    }
    markModified(list);
}

function dictionaryadd(dictionary, key, item) {
    if (currentTransaction != undefined) {
        var oldValue = dictionary[key];
        if (oldValue != undefined) {
            var undoFunction = function () {
                dictionary[key] = oldValue;
            }
        }
        else {
            var undoFunction = function () {
                delete dictionary[key];
            }
        }
        currentTransaction.undolist.push(undoFunction);
    }
    dictionary[key] = item;
    markModified(dictionary);
}

function dictionaryremove(dictionary, key) {
    if (currentTransaction != undefined) {
        var oldValue = dictionary[key];
        var undoFunction = function () {
            dictionary[key] = oldValue;
        }
        currentTransaction.undolist.push(undoFunction);
    }
    delete dictionary[key];
    markModified(dictionary);
}

function request(requestType, data) {
    switch (requestType) {
        case "UpdateLocation":
            updateLocation(data);
            break;
        case "SetStatus":
            updateStatus(data);
            break;
        case "SetInterfaceString":
            var splitString = data.split("=");
            var element = splitString[0];
            var string = splitString[1];
            setInterfaceString(element, string);
            break;
        case "SetCompassDirections":
            setCompassDirections(data.split(";"));
            break;
        case "Show":
            uiShow(requestShowHide_GetElement(data));
            break;
        case "Hide":
            uiHide(requestShowHide_GetElement(data));
            break;
        case "Foreground":
            currentForeground = data;
            break;
        case "Background":
            setBackground(data);
            break;
        case "LinkForeground":
            currentLinkForeground = data;
            break;
        case "FontName":
            currentFont = data;
            break;
        case "FontSize":
            currentFontSize = data;
            break;
        case "ClearScreen":
            clearScreen();
            break;
        case "SetPanelContents":
            setPanelContents(data);
            break;
        case "Log":
            break;
        case "Speak":
            break;
        default:
            throw "Request not supported: " + requestType + "; " + data;
    }
}

function requestShowHide_GetElement(element) {
    switch (element) {
        case "Panes":
            return "#gamePanes";
        case "Location":
            return "#location";
        case "Command":
            return "#divCommand";
        default:
            return "";
    }
}

function setPanelHeight() {
    setTimeout(function () {
        var height = $("#gamePanel").height();
        if ($("#gamePanel").html() == "") {
            // workaround for IE weirdness where an empty div has height
            height = 0;
            $("#gamePanel").hide();
        }
        else {
            $("#gamePanel").show();
        }
        $("#gamePanelSpacer").height(height);
        scrollToEnd();
    }, 100);
}

function setPanelContents(html) {
    $("#gamePanel").html(html);
    setPanelHeight();
}

function starttransaction(command) {
    var previousTransaction = currentTransaction;
    currentTransaction = new Object();
    transactions.push(currentTransaction);
    currentTransaction.undolist = new Array();
    currentTransaction.previous = previousTransaction;
    currentTransaction.command = command;
}

function undo() {
    if (currentTransaction) {
        var transactionToUndo = currentTransaction;
        if (dynamicTemplates["UndoTurn"]) {
            msg(overloadedFunctions.DynamicTemplate("UndoTurn", transactionToUndo.command));
        }
        else {
            msg("Undo: " + transactionToUndo.command);
        }
        currentTransaction = undefined;
        transactionToUndo.undolist.reverse();
        for (idx in transactionToUndo.undolist) {
            var fn = transactionToUndo.undolist[idx];
            fn();
        }
        currentTransaction = transactionToUndo.previous;
    }
    else {
        if (templates["NothingToUndo"]) {
            msg(templates["NothingToUndo"]);
        }
        else {
            msg("Nothing to undo");
        }
    }
}

function runscriptattribute2(object, attribute) {
    var fn = GetAttribute(object, attribute);
    fn.call(object);
}

function runscriptattribute3(object, attribute, parameters) {
    var fn = GetAttribute(object, attribute);
    fn.call(object, parameters);
}

function invoke(script, parameters) {
    if (parameters) {
        script.apply(null, [parameters["result"]]);
    } else {
        script();
    }
}

function error(message) {
    throw message;
}

function set(object, attribute, value, runscript) {
    if (runscript === undefined) {
        runscript = true;
    }
    attribute = attribute.replace(/ /g, "___SPACE___");
    var changed = (object[attribute] != value);

    value = preAttributeChange(object, attribute, value);

    if (attribute == "parent") {
        var oldParent = object[attribute];
    }

    object[attribute] = value;

    if (changed) {
        if (attribute == "parent") {
            objectMoved(object, oldParent, value);
        }

        attributeChanged(object, attribute, runscript);
    }
}

function objectMoved(object, oldParent, newParent) {
    if (object.elementtype == "object" && object.type == "object") {
        if (oldParent) {
            var idx = oldParent["_children"].indexOf(object);
            if (idx == -1) {
                throw "Object wasn't in room!";
            }
            oldParent["_children"].splice(idx, 1);
        }
        if (newParent) {
            if (!newParent["_children"]) {
                newParent["_children"] = new Array();
            }
            newParent["_children"].push(object);
        }
    }
}

var menuOptions;
var menuCallback;
var finishTurnAfterSelection;

function showmenu_async(title, options, allowCancel, callback) {
    showmenu_async_internal(title, options, allowCancel, callback, true);
}

function showmenu_async_internal(title, options, allowCancel, callback, finishTurn) {
    menuOptions = options;
    menuCallback = callback;
    awaitingCallback = true;
    finishTurnAfterSelection = finishTurn;

    if (runningWalkthrough) {
        var step = currentWalkthroughSteps.splice(0, 1);
        var response = step[0];
        if (response.substring(0, 5) == "menu:") {
            var selection = response.substring(5);
            var selectionKey = "";
            for (var option in options) {
                msg(options[option]);
                if (options[option] == selection) {
                    selectionKey = option;
                }
            }
            if (selectionKey.length == 0) {
                msg("Error running walkthrough - menu response was not present in menu");
            }
            else {
                postStep = function () {
                    msg(" - " + selection);
                    SetMenuSelection(selectionKey);
                };
            }
        }
        else {
            msg("Error running walkthrough - expected menu response");
        }
    }
    else {
        showMenu(title, options, allowCancel);
    }
}

function ask(question, callback) {
    if (runningWalkthrough) {
        var step = currentWalkthroughSteps.splice(0, 1);
        var response = step[0];
        if (response.substring(0, 7) == "answer:") {
            awaitingCallback = true;
            postStep = function () {
                awaitingCallback = false;
                callback(response.substring(7) == "yes");
                TryFinishTurn();
            };
        }
        else {
            msg("Error running walkthrough - expected ask response");
        }
    }
    else {
        var result = confirm(question);
        callback(result);
        TryFinishTurn();
    }
}

var waitCallback;

function wait_async(callback) {
    waitCallback = callback;
    awaitingCallback = true;
    beginWait();
}

var getinputCallback;
var awaitingInputCallback = false;

function getinput_async(callback) {
    getinputCallback = callback;
    awaitingCallback = true;
    awaitingInputCallback = true;
}

function create(name) {
    createInternal(name, allObjects, GetObject("defaultobject"), "object");
}

function createexit(name, from, to) {
    var newExit = createInternal(getUniqueId(), allExits, GetObject("defaultexit"), "exit");
    set(newExit, "alias", name);
    set(newExit, "parent", from);
    set(newExit, "to", to);
    return newExit;
}

function createexit_withtype(name, from, to, type) {
    var newExit = createexit(name, from, to);
    if (type) {
        addTypeToObject(newExit, type);
    }
}

function createtimer(name) {
    createdObjects.push(name + ";;timer");

    if (currentTransaction != undefined) {
        var undoFunction = function () {
            destroy(name);
        }
        currentTransaction.undolist.push(undoFunction);
    }

    newObject = new Object();
    // TODO: Add to object map
    window["object_" + name] = newObject;
    allTimers.push(newObject);
    newObject.elementtype = "timer";
    newObject.name = name;
    newObject["_js_name"] = name;
    return newObject;
}

function createturnscript(name) {
    return createInternal(name, allTurnScripts, "defaultturnscript", "turnscript");
}

var createdObjects = new Array();

function createInternal(name, array, defaultTypeObject, objectType) {

    createdObjects.push(name + ";" + defaultTypeObject.name + ";" + objectType);

    if (currentTransaction != undefined) {
        var undoFunction = function () {
            destroy(name);
        }
        currentTransaction.undolist.push(undoFunction);
    }

    newObject = new Object();
    window[name] = newObject;
    objectsNameMap[name] = newObject;
    elementsNameMap[name] = newObject;
    array.push(newObject);
    newObject.elementtype = "object";
    newObject.name = name;
    newObject["_js_name"] = name;
    newObject.type = objectType;
    addTypeToObject_NoLog(newObject, defaultTypeObject);
    return newObject;
}

var addedTypes = new Array();

function addTypeToObject(object, type) {
    addedTypes.push(object.name + ";" + type.name);
    addTypeToObject_NoLog(object, type);
}

function addTypeToObject_NoLog(object, type) {
    if (type != undefined) {
        for (var attribute in type) {
            if (object[attribute] == undefined) {
                object[attribute] = type[attribute];
            }
        }
    }
}

var destroyedObjects = new Array();

function destroy(name) {
    destroyedObjects.push(name);
    destroyObject(GetObject(name));
}

function destroyObject(object) {
    var childObjects = new Array();
    for (var idx in allObjects) {
        var thisObject = allObjects[idx];
        if (thisObject.parent == object) {
            childObjects.push(thisObject);
        }
    }
    for (var childObject in childObjects) {
        destroyObject(childObjects[childObject]);
    }
    destroyObject_removeFromArray(object, allObjects);
    destroyObject_removeFromArray(object, allExits);
    destroyObject_removeFromArray(object, allCommands);
    destroyObject_removeFromArray(object, allTurnScripts);

    if (currentTransaction != undefined) {
        var undoFunction = function () {
            delete object["__destroyed"];
        }
        currentTransaction.undolist.push(undoFunction);
    }
    object["__destroyed"] = true;
}

function destroyObject_removeFromArray(object, array) {
    var removeIdx = $.inArray(object, array);
    if (removeIdx != -1) {
        if (currentTransaction != undefined) {
            var undoFunction = function () {
                array.push(object);
            }
            currentTransaction.undolist.push(undoFunction);
        }
        array.splice(removeIdx, 1);
    }
}

function insertHtml(filename) {
    addText(embeddedHtml[filename]);
}

function picture(filename) {
    msg("<img src=\"" + filename + "\" onload=\"scrollToEnd();\" /><br />");
}

function playsound(file, wait, loop) {
    // TO DO: support wav format
    playMp3(file, wait, loop);
}

function stopsound() {
    stopAudio();
}

function pauseEvent() {
    gameActive = false;
}

function resumeEvent() {
    gameActive = true;
}

function timerTick() {
    if (!gameRunning) return;
    if (!gameActive) return;
    var tickCount = GetObject("game").timeelapsed + 1;
    set(GetObject("game"), "timeelapsed", tickCount);
    var scriptRan = false;
    for (var idx in allTimers) {
        var timer = allTimers[idx];
        if (timer.enabled) {
            if (tickCount >= timer.trigger) {
                set(timer, "trigger", timer.trigger + timer.interval);
                timer.script();
                scriptRan = true;
            }
        }
    }
    if (scriptRan) {
        saveGame();
        updateLists();
    }
}

function finish() {
    gameRunning = false;
    if (localStorage) {
        localStorage.clear();
    }
    $("#divCommand").hide();
}

var onReadyCallback = null;

function on_ready(callback) {
    if (!awaitingCallback) {
        callback();
    }
    else {
        onReadyCallback = callback;
    }
}

function getElement(name) {
    return elementsNameMap[name];
}

function setGameWidth() {
}

function setGamePadding() {
}

function hideBorder() {
}

// Functions

function NewObjectList() {
    return new Array();
}

function NewStringList() {
    return new Array();
}

function NewDictionary() {
    return new Object();
}

function NewObjectDictionary() {
    return new Object();
}

function NewStringDictionary() {
    return new Object();
}

function ToString(value) {
    return value.toString();
}

function ToInt(value) {
    return parseInt(value);
}

function ToDouble(value) {
    return parseFloat(value);
}

function Join(array, separator) {
    return array.join(separator);
}

function Split(input, delimiter) {
    return input.split(delimiter);
}

function Trim(input) {
    return $.trim(input);
}

function LengthOf(input) {
    if (input == null) return 0;
    return input.length;
}

function StartsWith(input, text) {
    return input.indexOf(text) == 0;
}

function LCase(text) {
    return text.toLowerCase();
}

function UCase(text) {
    return text.toUpperCase();
}

function CapFirst(text) {
    return text.substring(0, 1).toUpperCase() + text.substring(1);
}

function Left(text, count) {
    return text.substring(0, count);
}

function Right(text, count) {
    return text.substring(text.length - count - 1);
}

function Mid(text, start, count) {
    return text.substr(start - 1, count);
}

function Instr(p1, p2, p3) {
    var input, search;
    if (p3 === undefined) {
        input = p1;
        search = p2;
        return input.indexOf(search) + 1;
    } else {
        var start = p1;
        input = p2;
        search = p3;
        return input.indexOf(search, start - 1) + 1;
    }
}

function Replace(input, text, newText) {
    return input.split(text).join(newText);
}

var regexCache = new Object();

function getRegex(regexString, cacheID) {
    var result = regexCache[cacheID];
    if (result) {
        return result;
    }
    result = new XRegExp(regexString, "i");
    regexCache[cacheID] = result;
    return result;
}

function IsRegexMatch(regexString, input, cacheID) {
    var regex = getRegex(regexString, cacheID);
    return regex.test(input);
}

function GetMatchStrength(regexString, input, cacheID) {
    var regex = getRegex(regexString, cacheID);
    var lengthOfTextMatchedByGroups = 0;
    var matches = regex.exec(input);
    var namedGroups = GetRegexNamedGroups(matches);
    for (var groupIdx in namedGroups) {
        if (matches[namedGroups[groupIdx]] != undefined) {
            lengthOfTextMatchedByGroups += matches[namedGroups[groupIdx]].length;
        }
    }
    return input.length - lengthOfTextMatchedByGroups;
}

function Populate(regexString, input, cacheID) {
    var regex = getRegex(regexString, cacheID);
    var matches = regex.exec(input);
    var result = new Object();
    var namedGroups = GetRegexNamedGroups(matches);
    for (var groupIdx in namedGroups) {
        if (matches[namedGroups[groupIdx]] != undefined) {
            var varName = namedGroups[groupIdx];
            var mapIndex = varName.indexOf("_map_");
            if (mapIndex != -1) {
                varName = varName.substring(mapIndex + 5);
            }
            result[varName] = matches[namedGroups[groupIdx]];
        }
    }
    return result;
}

function GetRegexNamedGroups(matches) {
    var result = new Array();
    for (var prop in matches) {
        if (matches.hasOwnProperty(prop)) {
            if (StartsWith(prop, "object") || prop.indexOf("_map_object") != -1
             || StartsWith(prop, "text") || prop.indexOf("_map_text") != -1
             || StartsWith(prop, "exit") || prop.indexOf("_map_exit") != -1) {
                result.push(prop);
            }
        }
    }
    return result;
}

function GetAttribute(element, attribute) {
    attribute = attribute.replace(/ /g, "___SPACE___");
    return element[attribute];
}

function GetBoolean(element, attribute) {
    if (HasBoolean(element, attribute)) {
        return GetAttribute(element, attribute);
    }
    return false;
}

function GetInt(element, attribute) {
    if (HasInt(element, attribute)) {
        return GetAttribute(element, attribute);
    }
    return 0;
}

function GetObject(element) {
    result = objectsNameMap[element];
    if (result == undefined) return result;
    if (result["__destroyed"]) return null;
    return result;
}

function GetTimer(name) {
    return GetObject(name);
}

function GetString(element, attribute) {
    if (HasString(element, attribute)) {
        return GetAttribute(element, attribute);
    }
    return null;
}

function HasAttribute(element, attribute) {
    return (GetAttribute(element, attribute) != undefined);
}

function HasBoolean(element, attribute) {
    return (TypeOf(GetAttribute(element, attribute)) == "boolean");
}

function HasInt(element, attribute) {
    return (TypeOf(GetAttribute(element, attribute)) == "int");
}

function HasObject(element, attribute) {
    return (TypeOf(GetAttribute(element, attribute)) == "object");
}

function HasString(element, attribute) {
    return (TypeOf(GetAttribute(element, attribute)) == "string");
}

function HasScript(element, attribute) {
    return (TypeOf(GetAttribute(element, attribute)) == "script");
}

function HasDelegateImplementation(element, attribute) {
    return (TypeOf(GetAttribute(element, attribute)) == "script");
}

function GetAttributeNames(element, includeInheritedAttributes) {
    var result = [];
    for (var name in element) {
        result.push(name);
    }
    return result;
}

function AllObjects() {
    return allObjects;
}

function AllExits() {
    return allExits;
}

function AllCommands() {
    return allCommands;
}

function AllTurnScripts() {
    return allTurnScripts;
}

function TypeOf(value) {
    return overloadedFunctions.TypeOf(value);
}

function OverloadedFunctions() {
    addMethod(this, "TypeOf", function (value) {
        var type = typeof value;
        if (type == "function") return "script";
        if (type == "object") {
            if (value == null) return "null";
            if (Object.prototype.toString.call(value) === '[object Array]') {
                // could be an objectlist or stringlist
                var allObjects = true;
                var allStrings = true;

                for (var index in value) {
                    var item = value[index];
                    if (typeof item != "string") allStrings = false;
                    if (typeof item != "object") allObjects = false;
                    if (!allStrings && !allObjects) break;
                }

                if (allStrings) return "stringlist";
                if (allObjects) return "objectlist";
                return "unknown";
            }
            else {
                // could be an object, stringdictionary, objectdictionary or scriptdictionary
                var allObjects = true;
                var allStrings = true;
                var allScripts = true;

                for (var key in value) {
                    var item = value[key];
                    if (typeof item != "string") allStrings = false;
                    if (TypeOf(item) != "object") allObjects = false;
                    if (typeof item != "function") allScripts = false;
                    if (!allStrings && !allObjects && !allScripts) break;
                }

                if (allStrings) {
                    return "stringdictionary";
                }
                if (allObjects) {
                    return "objectdictionary";
                }
                if (allScripts) {
                    return "scriptdictionary";
                }
                return "object";
            }
        }
        if (type == "boolean") return "boolean";
        if (type == "string") return "string";
        if (type == "number") {
            // TO DO: Also need to handle double
            return "int";
        }
        if (type == "undefined") return "null";

        // TO DO: Also valid: Delegate name
    });

    addMethod(this, "TypeOf", function (object, attribute) {
        return TypeOf(GetAttribute(object, attribute));
    });

    addMethod(this, "DynamicTemplate", function (name, arg1) {
        params = new Object();
        params["object"] = arg1;
        params["exit"] = arg1;
        params["text"] = arg1;
        return dynamicTemplates[name](params);
    });

    addMethod(this, "DynamicTemplate", function (name, arg1, arg2) {
        params = new Object();
        params["object1"] = arg1;
        params["object2"] = arg2;
        return dynamicTemplates[name](params);
    });

    addMethod(this, "Eval", function (expression) {
        return eval(expression);
    });

    addMethod(this, "Eval", function (expression, params) {
        for (var varname in params) {
            var varvalue = params[varname];
            eval("var " + varname + "=varvalue");
        }
        return eval(expression);
    });
}

var overloadedFunctions = new OverloadedFunctions();

function DictionaryContains(dictionary, key) {
    return dictionary[key] != undefined;
}

function DictionaryItem(dictionary, key) {
    return dictionary[key];
}

function StringDictionaryItem(dictionary, key) {
    return dictionary[key];
}

function ScriptDictionaryItem(dictionary, key) {
    return dictionary[key];
}

function ObjectDictionaryItem(dictionary, key) {
    return dictionary[key];
}

function DictionaryCount(dictionary) {
    var count = 0;
    for (key in dictionary) {
        count++;
    }
    return count;
}

function ListCombine(list1, list2) {
    return list1.concat(list2);
}

function ListExclude(list, element) {
    var listCopy = list.slice(0);
    var index = listCopy.indexOf(element);
    if (index != -1) {
        listCopy.splice(index, 1);
    }
    return listCopy;
}

function ListContains(list, element) {
    return ($.inArray(element, list) != -1);
}

function ListCount(list) {
    return list.length;
}

function ListItem(list, index) {
    return list[index];
}

function StringListItem(list, index) {
    return list[index];
}

function ObjectListItem(list, index) {
    return list[index];
}

function Template(name) {
    return templates["t_" + name];
}

// TO DO: Need overloads to handle passing function parameters
function RunDelegateFunction(object, attribute) {
    return GetAttribute(object, attribute)();
}

function Contains(parent, child) {
    if (child.parent == null || child.parent == undefined) return false;
    if (child.parent == parent) return true;
    return Contains(parent, child.parent);
}

function ShowMenu() {
    throw "Synchronous ShowMenu function is not supported. Use showmenu_async function instead";
}

function SetMenuSelection(result) {
    if (Object.prototype.toString.call(menuOptions) === '[object Array]') {
        awaitingCallback = false;
        menuCallback(menuOptions[result]);
    }
    else {
        awaitingCallback = false;
        menuCallback(result);
    }
    if (finishTurnAfterSelection) {
        TryFinishTurn();
    }
}

function GetExitByName(parent, name) {
    for (var idx in allExits) {
        var obj = allExits[idx];
        if (obj.parent == parent && obj.alias == name) {
            return obj.name;
        }
    }
}

function GetExitByLink(parent, to) {
    for (var idx in allExits) {
        var obj = allExits[idx];
        if (obj.parent == parent && obj.to == to) {
            return obj.name;
        }
    }
}

function GetFileURL(file) {
    return file;
}

function Ask(question) {
    if (runningWalkthrough) {
        msg("<i>" + question + "</i>");
        var step = currentWalkthroughSteps.splice(0, 1);
        var response = step[0];
        if (response.substring(0, 7) == "answer:") {
            return (response.substring(7) == "yes");
        }
        else {
            msg("Error running walkthrough - expected menu response");
        }
    }
    else {
        return confirm(question);
    }
}

function GetUniqueElementName(prefix) {
    return prefix + getUniqueId();
}

function TryFinishTurn() {
    updateLists();
    TryRunOnReadyScripts();
    if (!awaitingCallback) {
        saveGame();
        if (typeof FinishTurn == "function") {
            FinishTurn();
        }
    }
}

function TryRunOnReadyScripts() {
    if (awaitingCallback) return;
    if (onReadyCallback != null) {
        var callback = onReadyCallback;
        onReadyCallback = null;
        callback();
    }
}

function GetDirectChildren(element) {
    if (!element["_children"]) {
        return new Array();
    }
    return element["_children"];
}

function GetAllChildObjects(element) {
    var result = new Array();
    var directChildren = GetDirectChildren(element);
    for (var idx in directChildren) {
        var obj = directChildren[idx];
        result.push(obj);
        result = result.concat(GetAllChildObjects(obj));
    }
    return result;
}

function IsGameRunning() {
    return gameRunning;
}

function IsDefined(variable) {
    return true;
}

function GetRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function SafeXML(input) {
    return input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function GetUIOption() {
    return null;
}

function DoesInherit(obj, type) {
    return ListContains(obj._types, type);
}

function Floor(n) {
    return Math.floor(n);
}

var templates = new Object();
var dynamicTemplates = new Object();
var allObjects = new Array();
var allExits = new Array();
var allCommands = new Array();
var allTurnScripts = new Array();
var allTimers = new Array();
var objectReferences = new Array();
var objectListReferences = new Array();
var objectDictionaryReferences = new Array();
var embeddedHtml = new Object();
var objectsNameMap = new Object();
var elementsNameMap = new Object();

templates.t_LanguageId = "en"
templates.t_UnresolvedObject = "I can't see that."
templates.t_UnresolvedLocation = "You can't go there."
templates.t_DefaultObjectDescription = "Nothing out of the ordinary."
templates.t_DefaultSelfDescription = "Looking good."
templates.t_SeeListHeader = "You can see"
templates.t_GoListHeader = "You can go"
templates.t_And = "and"
templates.t_Or = "or"
templates.t_NothingToUndo = "Nothing to undo!"
templates.t_NotCarryingAnything = "You are not carrying anything."
templates.t_CarryingListHeader = "You are carrying"
templates.t_UnrecognisedCommand = "I don't understand your command."
templates.t_YouAreIn = "You are in"
templates.t_LookAt = "Look at"
templates.t_Take = "Take"
templates.t_SpeakTo = "Speak to"
templates.t_Use = "Use"
templates.t_Drop = "Drop"
templates.t_GoTo = "Go to"
templates.t_Go = "Go"
templates.t_SwitchOn = "Switch on"
templates.t_SwitchOff = "Switch off"
templates.t_Open = "Open"
templates.t_Close = "Close"
templates.t_Eat = "Eat"
templates.t_NeutralGender = "it"
templates.t_MaleGender = "he"
templates.t_FemaleGender = "she"
templates.t_SelfGender = "you"
templates.t_NeutralPluralGender = "they"
templates.t_MalePluralGender = "they"
templates.t_FemalePluralGender = "they"
templates.t_NeutralArticle = "it"
templates.t_MaleArticle = "him"
templates.t_FemaleArticle = "her"
templates.t_SelfArticle = "yourself"
templates.t_NeutralPluralArticle = "them"
templates.t_MalePluralArticle = "them"
templates.t_FemalePluralArticle = "them"
templates.t_SelfAlias = "me"
templates.t_SelfAlt = "myself; self"
templates.t_AllObjects = "all; everything"
templates.t_ParserIgnorePrefixes = "the; a; an"
templates.t_CannotDoThat = "You can't do that."
templates.t_Done = "Done."
templates.t_ContainerContentsPrefix = "containing"
templates.t_SurfaceContentsPrefix = "on which there is"
templates.t_LockedExit = "That way is locked."
templates.t_NoKey = "You do not have the key."
templates.t_UnlockMessage = "Unlocked."
templates.t_LockMessage = "Locked."
templates.t_DefaultOops = "There is nothing to correct."
templates.t_VerbObjectSeparator = "with; using"
templates.t_DefaultMultiObjectVerb = "That doesn't work."
templates.t_MultiObjectVerbMenu = "With which object?"
templates.t_UseOnMenu = "On which object?"
templates.t_GiveToMenu = "To which object?"
templates.t_NoObjectsAvailable = "There are no objects available to do that with."
templates.t_Yes = "Yes"
templates.t_No = "No"
templates.t_By = "by"
templates.t_CompassNW = "northwest"
templates.t_CompassN = "north"
templates.t_CompassNE = "northeast"
templates.t_CompassW = "west"
templates.t_CompassE = "east"
templates.t_CompassSW = "southwest"
templates.t_CompassS = "south"
templates.t_CompassSE = "southeast"
templates.t_CompassUp = "up"
templates.t_CompassDown = "down"
templates.t_CompassIn = "in"
templates.t_CompassOut = "out"
templates.t_CompassDirectionPrefix = ""
templates.t_CompassDirectionSuffix = ""
templates.t_UpDownDirectionPrefix = ""
templates.t_UpDownDirectionSuffix = ""
templates.t_InOutDirectionPrefix = ""
templates.t_InOutDirectionSuffix = ""
templates.t_CompassNWShort = "nw"
templates.t_CompassNShort = "n"
templates.t_CompassNEShort = "ne"
templates.t_CompassWShort = "w"
templates.t_CompassEShort = "e"
templates.t_CompassSWShort = "sw"
templates.t_CompassSShort = "s"
templates.t_CompassSEShort = "se"
templates.t_CompassUpShort = "u"
templates.t_CompassDownShort = "d"
templates.t_CompassInShort = ""
templates.t_CompassOutShort = "o"
templates.t_InventoryLabel = "Inventory"
templates.t_StatusLabel = "Status"
templates.t_PlacesObjectsLabel = "Places and Objects"
templates.t_CompassLabel = "Compass"
templates.t_InButtonLabel = "in"
templates.t_OutButtonLabel = "out"
templates.t_EmptyListLabel = "(empty)"
templates.t_NothingSelectedLabel = "(nothing selected)"
templates.t_TypeHereLabel = "Type here..."
templates.t_ContinueLabel = "Continue..."
templates.t_go = "^go to (?<exit>.*)$|^go (?<exit>.*)$|^(?<exit>north|east|south|west|northeast|northwest|southeast|southwest|in|out|up|down|n|e|s|w|ne|nw|se|sw|o|u|d)$"
templates.t_lookdir = "^look (?<exit>north|east|south|west|northeast|northwest|southeast|southwest|out|up|down|n|e|s|w|ne|nw|se|sw|o|u|d)$"
templates.t_look = "^look$|^l$"
templates.t_lookat = "look at; x; examine; exam; ex"
templates.t_take = "take; get; pick up"
templates.t_undo = "^undo$"
templates.t_inventory = "^i$|^inv$|^inventory$"
templates.t_quit = "^quit$"
templates.t_drop = "drop"
templates.t_use = "use"
templates.t_speakto = "speak to; speak; talk to; talk"
templates.t_open = "open"
templates.t_close = "close"
templates.t_put = "^put (?<object1>.*) (on|in) (?<object2>.*)$"
templates.t_removefrom = "^remove (?<object1>.*) from (?<object2>.*)$"
templates.t_ask = "^ask (?<object>.*) about (?<text>.*)$"
templates.t_tell = "^tell (?<object>.*) about (?<text>.*)$"
templates.t_oops = "^oops (?<text>.*)$"
templates.t_buy = "buy"
templates.t_climb = "climb"
templates.t_drink = "drink"
templates.t_eat = "eat"
templates.t_givesingle = "give"
templates.t_give = "^give (?<object1>.*) to (?<object2>.*)$"
templates.t_hit = "hit"
templates.t_kill = "kill"
templates.t_kiss = "kiss"
templates.t_knock = "knock"
templates.t_lick = "lick"
templates.t_lie = "lie on; lie upon; lie down on; lie down upon"
templates.t_listento = "listen to"
templates.t_lock = "lock"
templates.t_move = "move"
templates.t_pull = "pull"
templates.t_push = "push"
templates.t_read = "read"
templates.t_search = "search"
templates.t_show = "show"
templates.t_sit = "sit on; sit upon; sit down on; sit down upon"
templates.t_smell = "smell; sniff"
templates.t_taste = "taste"
templates.t_throw = "throw"
templates.t_tie = "tie"
templates.t_touch = "touch"
templates.t_turnon = "turn on; turn #object# on; switch on; switch #object# on"
templates.t_turnoff = "turn off; turn #object# off; switch off; switch #object# off"
templates.t_turn = "turn"
templates.t_unlock = "unlock"
templates.t_untie = "untie"
templates.t_useon = "^use (?<object1>.*) (on|with) (?<object2>.*)$"
templates.t_wear = "wear"
templates.t_listen = "^listen$"
templates.t_DefaultListen = "You can't hear much."
templates.t_jump = "^jump$"
templates.t_DefaultJump = "You jump, but nothing happens."
templates.t_sitdown = "^sit$|^sit down$"
templates.t_DefaultSitDown = "No time for lounging about now."
templates.t_liedown = "^lie$|^lie down$"
templates.t_DefaultLieDown = "No time for lounging about now."
templates.t_sleep = "^sleep$|^rest$"
templates.t_DefaultSleep = "No time for lounging about now."
templates.t_wait = "^wait$|^z$"
templates.t_DefaultWait = "Time passes."
templates.t_xyzzy = "^xyzzy$"
templates.t_DefaultXyzzy = "Surprisingly, absolutely nothing happens."
templates.t_help = "^help$|^\?$"
templates.t_save = "^save$"
templates.t_DefaultHelp = "<u>Quick Help</u><br/><br/><b>- Objects:</b>  Try LOOK AT..., SPEAK TO..., TAKE..., DROP..., OPEN..., GIVE... TO..., USE... ON/WITH...<br/><b>- Inventory:</b>  See which items you are carrying by typing I, INV or INVENTORY.<br/><b>- Moving around:</b>  Press the compass buttons, or type GO NORTH, SOUTH, E, GO TO...<br/><b>- Shortcuts:</b>  Press the up arrow and down arrow to scroll through commands you have already typed in. Try X... as a shortcut for LOOK AT..."
templates.t_LanguageSpecificObjectTypes = ""
dynamicTemplates.TakeSuccessful = function(params) { return "You pick " + params["object"].article + " up."; };
dynamicTemplates.TakeUnsuccessful = function(params) { return "You can't take " + params["object"].article + "."; };
dynamicTemplates.FullInventory = function(params) { return WriteVerb(params["object"], "be") + " too heavy to be taken."; };
dynamicTemplates.MaxObjectsInInventory = function(params) { return "You can't carry any more items."; };
dynamicTemplates.MaxObjectsInContainer = function(params) { return "You can't put more items in " + params["object"].article + "."; };
dynamicTemplates.DropSuccessful = function(params) { return "You drop " + params["object"].article + "."; };
dynamicTemplates.DropUnsuccessful = function(params) { return "You can't drop " + params["object"].article + "."; };
dynamicTemplates.AlreadyTaken = function(params) { return "You are already carrying " + params["object"].article + "."; };
dynamicTemplates.NotCarrying = function(params) { return "You are not carrying " + params["object"].article + "."; };
dynamicTemplates.CantUse = function(params) { return "You can't use " + params["object"].article + "."; };
dynamicTemplates.CantGive = function(params) { return "You can't give " + params["object"].article + "."; };
dynamicTemplates.DefaultSpeakTo = function(params) { return WriteVerb(params["object"], "say") + " nothing."; };
dynamicTemplates.ObjectNotOpen = function(params) { return CapFirst(GetDisplayAlias(params["object"])) + " " + Conjugate(params["object"], "be") + " not open."; };
dynamicTemplates.AlreadyOpen = function(params) { return WriteVerb(params["object"], "be") + " already open."; };
dynamicTemplates.AlreadyClosed = function(params) { return WriteVerb(params["object"], "be") + " already closed."; };
dynamicTemplates.CantOpen = function(params) { return "You can't open " + params["object"].article + "."; };
dynamicTemplates.CantClose = function(params) { return "You can't close " + params["object"].article + "."; };
dynamicTemplates.OpenSuccessful = function(params) { return "You open " + params["object"].article + "."; };
dynamicTemplates.CloseSuccessful = function(params) { return "You close " + params["object"].article + "."; };
dynamicTemplates.AlreadyThere = function(params) { return WriteVerb(params["object"], "be") + " already there."; };
dynamicTemplates.ObjectContains = function(params) { return WriteVerb(params["object"], "contain"); };
dynamicTemplates.ContainerFull = function(params) { return WriteVerb(params["object"], "be") + " full."; };
dynamicTemplates.DisambiguateMenu = function(params) { return "Please choose which '" + params["text"] + "' you mean:"; };
dynamicTemplates.UndoTurn = function(params) { return "Undo: " + params["text"]; };
dynamicTemplates.DefaultAsk = function(params) { return WriteVerb(params["object"], "do") + " not reply."; };
dynamicTemplates.DefaultTell = function(params) { return WriteVerb(params["object"], "do") + " not reply."; };
dynamicTemplates.LockedObject = function(params) { return WriteVerb(params["object"], "be") + " locked."; };
dynamicTemplates.AlreadyLocked = function(params) { return WriteVerb(params["object"], "be") + " already locked."; };
dynamicTemplates.AlreadyUnlocked = function(params) { return WriteVerb(params["object"], "be") + " already unlocked."; };
dynamicTemplates.CannotLockOpen = function(params) { return "You cannot lock " + params["object"].article + " when " + params["object"].gender + " " + Conjugate(params["object"], "be") + " open."; };
dynamicTemplates.AlreadySwitchedOn = function(params) { return WriteVerb(params["object"], "be") + " already switched on."; };
dynamicTemplates.AlreadySwitchedOff = function(params) { return WriteVerb(params["object"], "be") + " already switched off."; };
dynamicTemplates.SwitchedOn = function(params) { return "You switch " + params["object"].article + " on."; };
dynamicTemplates.SwitchedOff = function(params) { return "You switch " + params["object"].article + " off."; };
dynamicTemplates.Eaten = function(params) { return "You eat " + params["object"].article + "."; };
dynamicTemplates.ObjectDoesNotContain = function(params) { return CapFirst(GetDisplayAlias(params["object1"])) + " " + Conjugate(params["object1"], "do") + " not contain " + GetDisplayAlias(params["object2"]) + "."; };
dynamicTemplates.YouLooking = function(params) { return "You are looking " + params["text"] +"."; };
dynamicTemplates.LookAtDarkness = function(params) { return "It is too dark to make anything out."; };
dynamicTemplates.DefaultBuy = function(params) { return "You can't buy " + params["object"].article + "."; };
dynamicTemplates.DefaultClimb = function(params) { return "You can't climb " + params["object"].article + "."; };
dynamicTemplates.DefaultDrink = function(params) { return "You can't drink " + params["object"].article + "."; };
dynamicTemplates.DefaultEat = function(params) { return "You can't eat " + params["object"].article + "."; };
dynamicTemplates.DefaultGive = function(params) { return WriteVerb(params["object1"], "do") + " not want " + params["object2"].article + "."; };
dynamicTemplates.DefaultHit = function(params) { return "You can't hit " + params["object"].article + "."; };
dynamicTemplates.DefaultKill = function(params) { return "You can't kill " + params["object"].article + "."; };
dynamicTemplates.DefaultKiss = function(params) { return "You can't kiss " + params["object"].article + "."; };
dynamicTemplates.DefaultKnock = function(params) { return "You can't knock " + params["object"].article + "."; };
dynamicTemplates.DefaultLick = function(params) { return "You can't lick " + params["object"].article + "."; };
dynamicTemplates.DefaultLie = function(params) { return "You can't lie on " + params["object"].article + "."; };
dynamicTemplates.DefaultListenTo = function(params) { return "You listen, but " + params["object"].article + " makes no sound."; };
dynamicTemplates.DefaultLock = function(params) { return "You can't lock " + params["object"].article + "."; };
dynamicTemplates.DefaultMove = function(params) { return "You can't move " + params["object"].article + "."; };
dynamicTemplates.DefaultPull = function(params) { return "You can't pull " + params["object"].article + "."; };
dynamicTemplates.DefaultPush = function(params) { return "You can't push " + params["object"].article + "."; };
dynamicTemplates.DefaultRead = function(params) { return "You can't read " + params["object"].article + "."; };
dynamicTemplates.DefaultSearch = function(params) { return "You can't search " + params["object"].article + "."; };
dynamicTemplates.DefaultShow = function(params) { return "You can't show " + params["object"].article + "."; };
dynamicTemplates.DefaultSit = function(params) { return "You can't sit on " + params["object"].article + "."; };
dynamicTemplates.DefaultSmell = function(params) { return "You sniff, but " + params["object"].article + " doesn't smell of much."; };
dynamicTemplates.DefaultTaste = function(params) { return "You can't taste " + params["object"].article + "."; };
dynamicTemplates.DefaultThrow = function(params) { return "You can't throw " + params["object"].article + "."; };
dynamicTemplates.DefaultTie = function(params) { return "You can't tie " + params["object"].article + "."; };
dynamicTemplates.DefaultTouch = function(params) { return "You can't touch " + params["object"].article + "."; };
dynamicTemplates.DefaultTurnOn = function(params) { return "You can't turn " + params["object"].article + " on."; };
dynamicTemplates.DefaultTurnOff = function(params) { return "You can't turn " + params["object"].article + " off."; };
dynamicTemplates.DefaultTurn = function(params) { return "You can't turn " + params["object"].article + "."; };
dynamicTemplates.DefaultUnlock = function(params) { return "You can't unlock " + params["object"].article + "."; };
dynamicTemplates.DefaultUntie = function(params) { return "You can't untie " + params["object"].article + "."; };
dynamicTemplates.DefaultUseOn = function(params) { return "You can't use " + params["object2"].article + " that way."; };
dynamicTemplates.DefaultWear = function(params) { return "You can't wear " + params["object"].article + "."; };
_obj245 = {
"elementtype": "object",
"name": "game",
"type": "game",
"gamename": "Root Cause",
"gameid": "8949f72c-689f-452d-875c-856c82083111",
"version": "1.0",
"firstpublished": "2016",
"cover": "10592730_10101059022958292_5274693460180377864_n.jpg",
"defaultfontsize": 20,
"backgroundimage": "black_textures_Black_Widow_black_texture_1440x900.jpg",
"setbackgroundopacity": true,
"backgroundopacity": 0,
"menufontsize": 15,
"showpanes": false,
"showlocation": false,
"showborder": false,
"defaultwebfont": "Play",
"defaultlinkforeground": "Green",
"setcustomwidth": true,
"deactivatecommandlinks": true,
"defaultfont": "'Courier New', Courier, monospace",
"defaultforeground": "LightBlue",
"underlinehyperlinks": true,
"gridmap": false,
"feature_asktell": false,
"start": function() { OutputText ("You awaken to the soft sound of robotic voices in your ear. <br/><br/>You shake your head and try to rid your brain of the strange noise..... but it doesn't stop. In fact, it keeps repeating the same thing over and over again.<br/><br/>\"Whiskey Echo November Delta Yankee. Whiskey Echo November Delta Yankee.\"<br/><br/>You know this sound all too well. This is the sound of \"The Machine\". This is what Root would hear.<br/><br/>No, that can't be the case. Obviously that's just a TV show. You've seen every set and have met every creator of Person Of Interest. None of that is real.<br/><br/>Right?"); },
"_js_name": "_obj245",
"_types": ["theme_retro", "defaultgame"],
"defaultbackground": "Black",
"menufont": "'Lucida Console', Monaco, monospace",
"menubackground": "Black",
"menuforeground": "White",
"menuhoverbackground": "GreenYellow",
"enablehyperlinks": true,
"echocommand": true,
"echohyperlinks": true,
"showdescriptiononenter": true,
"autodescription": true,
"menuhoverforeground": "Black",
"compassdirections": ["northwest", "north", "northeast", "west", "east", "southwest", "south", "southeast", "up", "down", "in", "out"],
"clearframe": true,
"timeelapsed": 0,
"appendobjectdescription": false,
"allobjects": ["all", "everything"],
"parserignoreprefixes": ["the", "a", "an"],
"displayroomdescriptiononstart": true,
"showcommandbar": true,
"customwidth": 950,
"setcustompadding": false,
"custompaddingtop": 30,
"custompaddingbottom": 0,
"custompaddingleft": 20,
"custompaddingright": 20,
"showscore": false,
"showhealth": false,
"showtitle": true,
"autodisplayverbs": true,
"autodescription_youarein": 1,
"autodescription_youcansee": 2,
"autodescription_youcango": 3,
"autodescription_description": 4,
"autodescription_youarein_useprefix": true,
"autodescription_youarein_newline": false,
"autodescription_youcansee_newline": false,
"autodescription_youcango_newline": false,
"autodescription_description_newline": false,
"changeroom_newline": true,
"command_newline": false,
"description": "",
"languageid": "en",
"mapscale": 30,
"mapsize": 300,
"feature_lightdark": false,
"feature_pictureframe": false,
"feature_limitinventory": false,
"multiplecommands": false,
"publishfileextensions": "*.jpg;*.jpeg;*.png;*.gif;*.js;*.wav;*.mp3;*.htm;*.html;*.svg",
"changedpov": function(oldvalue) { InitPOV (oldvalue, _obj245.pov); }
};
elementsNameMap["game"] = _obj245;
objectsNameMap["game"] = _obj245;
_obj246 = {
"elementtype": "object",
"name": "lookat",
"type": "command",
"pattern": "^look at (?<object>.*)$|^x (?<g2_map_object>.*)$|^examine (?<g3_map_object>.*)$|^exam (?<g4_map_object>.*)$|^ex (?<g5_map_object>.*)$",
"script": function(parameters) { var object = parameters['object'];
if (GetBoolean(object, "hidechildren")) {
set(object, "hidechildren", false);
}
if (overloadedFunctions.TypeOf(object, "look") == "script") {
runscriptattribute2 (object, "look");
}
else {
var lookdesc = "";
if (HasString(object, "look")) {
var lookdesc = object.look;
}
if (LengthOf(lookdesc) == 0) {
var lookdesc = Template("DefaultObjectDescription");
}
if (GetBoolean(object, "switchedon")) {
if (HasString(object, "switchedondesc")) {
var lookdesc = lookdesc + " " + object.switchedondesc;
}
}
else {
if (HasString(object, "switchedoffdesc")) {
var lookdesc = lookdesc + " " + object.switchedoffdesc;
}
}
var isDark = CheckDarkness();
if (isDark && !(GetBoolean(object, "lightsource"))) {
var lookdesc = overloadedFunctions.DynamicTemplate("LookAtDarkness", object);
}
OutputText (lookdesc);
}
ListObjectContents (object); },
"_js_name": "_obj246",
"_types": ["defaultcommand"]
};
elementsNameMap["lookat"] = _obj246;
allCommands.push(_obj246);
objectsNameMap["lookat"] = _obj246;
_obj247 = {
"elementtype": "object",
"name": "take",
"type": "command",
"pattern": "^take (?<object>.*)$|^get (?<g2_map_object>.*)$|^pick up (?<g3_map_object>.*)$",
"multiple": function() { var takeList = NewObjectList();
var list_obj = ListExclude(ScopeVisibleNotHeldNotScenery(), _obj245.pov);
var list_obj_isarray = (Object.prototype.toString.call(list_obj) === '[object Array]');
for (var iterator_obj in list_obj) {
var obj = list_obj_isarray ? list_obj[iterator_obj] : iterator_obj;
if (list_obj_isarray || iterator_obj!="__dummyKey") { if (obj.parent == _obj245.pov.parent) {
listadd (takeList, obj);
} }
}
return (takeList); },
"script": function(parameters) { var object = parameters['object'];
var multiple = parameters['multiple'];
var object_isarray = (Object.prototype.toString.call(object) === '[object Array]');
for (var iterator_obj in object) {
var obj = object_isarray ? object[iterator_obj] : iterator_obj;
if (object_isarray || iterator_obj!="__dummyKey") { DoTake (obj, multiple); }
} },
"_js_name": "_obj247",
"_types": ["defaultcommand"]
};
elementsNameMap["take"] = _obj247;
allCommands.push(_obj247);
objectsNameMap["take"] = _obj247;
_obj249 = {
"elementtype": "object",
"name": "drop",
"type": "command",
"pattern": "^drop (?<object>.*)$",
"multiple": function() { return (GetDirectChildren(_obj245.pov)); },
"script": function(parameters) { var object = parameters['object'];
var multiple = parameters['multiple'];
var object_isarray = (Object.prototype.toString.call(object) === '[object Array]');
for (var iterator_obj in object) {
var obj = object_isarray ? object[iterator_obj] : iterator_obj;
if (object_isarray || iterator_obj!="__dummyKey") { DoDrop (obj, multiple); }
} },
"_js_name": "_obj249",
"_types": ["defaultcommand"]
};
elementsNameMap["drop"] = _obj249;
allCommands.push(_obj249);
objectsNameMap["drop"] = _obj249;
_obj251 = {
"elementtype": "object",
"name": "use",
"type": "command",
"pattern": "^use (?<object>.*)$",
"script": function(parameters) { var object = parameters['object'];
if (HasScript(object, "use")) {
runscriptattribute2 (object, "use");
}
else {
if (GetBoolean(object, "use")) {
var menu = NewStringDictionary();
var candidates = NewObjectList();
var candidates = CreateUseMenuList (object);
if (ListCount(candidates) == 0) {
OutputText (Template("NoObjectsAvailable"));
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "usemenuobject", object);
if (HasString(object, "usemenuprompt")) {
var menucaption = object.usemenuprompt;
}
else {
var menucaption = Template("UseOnMenu");
}
ShowMenu (menucaption, menu, true, function (result) { if (result != null) {
HandleUseOn (_obj245.pov.usemenuobject, GetObject(result));
set(_obj245.pov, "usemenuobject", null);
} });
}
}
else {
OutputText (overloadedFunctions.DynamicTemplate("CantUse", object));
}
} },
"_js_name": "_obj251",
"_types": ["defaultcommand"]
};
elementsNameMap["use"] = _obj251;
allCommands.push(_obj251);
objectsNameMap["use"] = _obj251;
_obj252 = {
"elementtype": "object",
"name": "undo",
"type": "command",
"pattern": "^undo$",
"isundo": true,
"script": function(parameters) { undo(); },
"_js_name": "_obj252",
"_types": ["defaultcommand"]
};
elementsNameMap["undo"] = _obj252;
allCommands.push(_obj252);
objectsNameMap["undo"] = _obj252;
_obj253 = {
"elementtype": "object",
"name": "inventory",
"type": "command",
"pattern": "^i$|^inv$|^inventory$",
"script": function(parameters) { var list = FormatObjectList(Template("CarryingListHeader"), _obj245.pov, Template("And"), ".");
if (list == "") {
OutputText (Template("NotCarryingAnything"));
}
else {
OutputText (list);
} },
"_js_name": "_obj253",
"_types": ["defaultcommand"]
};
elementsNameMap["inventory"] = _obj253;
allCommands.push(_obj253);
objectsNameMap["inventory"] = _obj253;
_obj254 = {
"elementtype": "object",
"name": "look",
"type": "command",
"pattern": "^look$|^l$",
"script": function(parameters) { ShowRoomDescription(); },
"_js_name": "_obj254",
"_types": ["defaultcommand"]
};
elementsNameMap["look"] = _obj254;
allCommands.push(_obj254);
objectsNameMap["look"] = _obj254;
_obj255 = {
"elementtype": "object",
"name": "lookdir",
"type": "command",
"pattern": "^look (?<exit>north|east|south|west|northeast|northwest|southeast|southwest|out|up|down|n|e|s|w|ne|nw|se|sw|o|u|d)$",
"script": function(parameters) { var exit = parameters['exit'];
if (HasScript(exit, "look")) {
runscriptattribute2 (exit, "look");
}
else {
var message = overloadedFunctions.DynamicTemplate("YouLooking",exit.alias);
if (HasString(exit, "look")) {
if (exit.look != "") {
var message = exit.look;
}
}
if (exit.locked) {
if (HasString(exit,"lockmessage")) {
var lockmessage = exit.lockmessage;
}
else {
var lockmessage = Template("LockedExit");
}
OutputText (message+" "+lockmessage);
}
else {
OutputText (message);
}
} },
"_js_name": "_obj255",
"_types": ["defaultcommand"]
};
elementsNameMap["lookdir"] = _obj255;
allCommands.push(_obj255);
objectsNameMap["lookdir"] = _obj255;
_obj256 = {
"elementtype": "object",
"name": "quit",
"type": "command",
"pattern": "^quit$",
"script": function(parameters) { request ("Quit", ""); },
"_js_name": "_obj256",
"_types": ["defaultcommand"]
};
elementsNameMap["quit"] = _obj256;
allCommands.push(_obj256);
objectsNameMap["quit"] = _obj256;
_obj257 = {
"elementtype": "object",
"name": "go",
"type": "command",
"pattern": "^go to (?<exit>.*)$|^go (?<g2_map_exit>.*)$|^(?<g3_map_exit>north|east|south|west|northeast|northwest|southeast|southwest|in|out|up|down|n|e|s|w|ne|nw|se|sw|o|u|d)$",
"unresolved": "You can't go there.",
"script": function(parameters) { var exit = parameters['exit'];
if (exit.visible) {
if (exit.locked) {
OutputText (exit.lockmessage);
}
else if (exit.runscript) {
if (HasScript(exit, "script")) {
runscriptattribute2 (exit, "script");
}
}
else if (exit.lookonly) {
OutputText ("You can't go there.");
}
else {
set(_obj245.pov, "parent", exit.to);
}
}
else {
OutputText ("You can't go there.");
} },
"_js_name": "_obj257",
"_types": ["defaultcommand"]
};
elementsNameMap["go"] = _obj257;
allCommands.push(_obj257);
objectsNameMap["go"] = _obj257;
_obj258 = {
"elementtype": "object",
"name": "open",
"type": "command",
"pattern": "^open (?<object>.*)$",
"script": function(parameters) { var object = parameters['object'];
TryOpenClose (true, object); },
"_js_name": "_obj258",
"_types": ["defaultcommand"]
};
elementsNameMap["open"] = _obj258;
allCommands.push(_obj258);
objectsNameMap["open"] = _obj258;
_obj259 = {
"elementtype": "object",
"name": "close",
"type": "command",
"pattern": "^close (?<object>.*)$",
"script": function(parameters) { var object = parameters['object'];
TryOpenClose (false, object); },
"_js_name": "_obj259",
"_types": ["defaultcommand"]
};
elementsNameMap["close"] = _obj259;
allCommands.push(_obj259);
objectsNameMap["close"] = _obj259;
_obj260 = {
"elementtype": "object",
"name": "put",
"type": "command",
"pattern": "^put (?<object1>.*) (on|in) (?<object2>.*)$",
"script": function(parameters) { var object1 = parameters['object1'];
var object2 = parameters['object2'];
if (object1.parent == object2) {
OutputText (overloadedFunctions.DynamicTemplate("AlreadyThere", object1));
}
else if (!(ListContains(ScopeInventory(), object1))) {
OutputText (overloadedFunctions.DynamicTemplate("NotCarrying", object1));
}
else if (!(ListContains(ScopeReachable(), object1))) {
OutputText (overloadedFunctions.DynamicTemplate("ObjectNotOpen", GetBlockingObject(object1)));
}
else if (!(ListContains(ScopeReachable(), object2))) {
OutputText (overloadedFunctions.DynamicTemplate("ObjectNotOpen", GetBlockingObject(object2)));
}
else if (!(object2.container)) {
OutputText (Template("CannotDoThat"));
}
else if (!(object2.isopen)) {
OutputText (overloadedFunctions.DynamicTemplate("ObjectNotOpen", object2));
}
else {
if (GetBoolean(object2, "hidechildren")) {
set(object2, "hidechildren", false);
}
if (HasDelegateImplementation(object2, "addscript")) {
rundelegate (object2, "addscript", object1);
}
else {
set(object1, "parent", object2);
OutputText (Template("Done"));
}
} },
"_js_name": "_obj260",
"_types": ["defaultcommand"]
};
elementsNameMap["put"] = _obj260;
allCommands.push(_obj260);
objectsNameMap["put"] = _obj260;
_obj261 = {
"elementtype": "object",
"name": "removefrom",
"type": "command",
"pattern": "^remove (?<object1>.*) from (?<object2>.*)$",
"script": function(parameters) { var object1 = parameters['object1'];
var object2 = parameters['object2'];
if (!(Contains(object2, object1))) {
OutputText (overloadedFunctions.DynamicTemplate("ObjectDoesNotContain", object2, object1));
}
else {
DoTake (object1, false);
} },
"_js_name": "_obj261",
"_types": ["defaultcommand"]
};
elementsNameMap["removefrom"] = _obj261;
allCommands.push(_obj261);
objectsNameMap["removefrom"] = _obj261;
_obj262 = {
"elementtype": "object",
"name": "givesingle",
"type": "command",
"pattern": "^give (?<object>.*)$",
"script": function(parameters) { var object = parameters['object'];
if (HasScript(object, "givesingle")) {
runscriptattribute2 (object, "givesingle");
}
else {
if (GetBoolean(object, "givesingle")) {
var menu = NewStringDictionary();
var candidates = NewObjectList();
var candidates = CreateGiveMenuList (object);
if (ListCount(candidates) == 0) {
OutputText (Template("NoObjectsAvailable"));
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "givemenuobject", object);
if (HasString(object, "givemenuprompt")) {
var menucaption = object.givemenuprompt;
}
else {
var menucaption = Template("GiveToMenu");
}
ShowMenu (menucaption, menu, true, function (result) { if (result != null) {
HandleGiveTo (_obj245.pov.givemenuobject, GetObject(result));
set(_obj245.pov, "givemenuobject", null);
} });
}
}
else {
OutputText (overloadedFunctions.DynamicTemplate("CantGive", object));
}
} },
"_js_name": "_obj262",
"_types": ["defaultcommand"]
};
elementsNameMap["givesingle"] = _obj262;
allCommands.push(_obj262);
objectsNameMap["givesingle"] = _obj262;
_obj263 = {
"elementtype": "object",
"name": "give",
"type": "command",
"pattern": "^give (?<object1>.*) to (?<object2>.*)$",
"script": function(parameters) { var object1 = parameters['object1'];
var object2 = parameters['object2'];
HandleGiveTo (object1, object2); },
"_js_name": "_obj263",
"_types": ["defaultcommand"]
};
elementsNameMap["give"] = _obj263;
allCommands.push(_obj263);
objectsNameMap["give"] = _obj263;
_obj264 = {
"elementtype": "object",
"name": "useon",
"type": "command",
"pattern": "^use (?<object1>.*) (on|with) (?<object2>.*)$",
"script": function(parameters) { var object1 = parameters['object1'];
var object2 = parameters['object2'];
HandleUseOn (object1, object2); },
"_js_name": "_obj264",
"_types": ["defaultcommand"]
};
elementsNameMap["useon"] = _obj264;
allCommands.push(_obj264);
objectsNameMap["useon"] = _obj264;
_obj265 = {
"elementtype": "object",
"name": "ask",
"type": "command",
"pattern": "^ask (?<object>.*) about (?<text>.*)$",
"script": function(parameters) { var object = parameters['object'];
var text = parameters['text'];
DoAskTell (object, text, "ask", "askdefault", "DefaultAsk"); },
"_js_name": "_obj265",
"_types": ["defaultcommand"]
};
elementsNameMap["ask"] = _obj265;
allCommands.push(_obj265);
objectsNameMap["ask"] = _obj265;
_obj266 = {
"elementtype": "object",
"name": "tell",
"type": "command",
"pattern": "^tell (?<object>.*) about (?<text>.*)$",
"script": function(parameters) { var object = parameters['object'];
var text = parameters['text'];
DoAskTell (object, text, "tell", "telldefault", "DefaultTell"); },
"_js_name": "_obj266",
"_types": ["defaultcommand"]
};
elementsNameMap["tell"] = _obj266;
allCommands.push(_obj266);
objectsNameMap["tell"] = _obj266;
_obj267 = {
"elementtype": "object",
"name": "oops",
"type": "command",
"pattern": "^oops (?<text>.*)$",
"isoops": true,
"script": function(parameters) { var text = parameters['text'];
var hasoops = false;
if (HasAttribute(_obj245, "unresolvedcommand")) {
if (_obj245.unresolvedcommand != null) {
var hasoops = true;
}
}
if (!(hasoops)) {
OutputText (Template("DefaultOops"));
}
else {
dictionaryremove (_obj245.unresolvedcommandvarlist, _obj245.unresolvedcommandkey);
dictionaryadd (_obj245.unresolvedcommandvarlist, _obj245.unresolvedcommandkey, text);
HandleSingleCommandPattern ("", _obj245.unresolvedcommand, _obj245.unresolvedcommandvarlist);
} },
"_js_name": "_obj267",
"_types": ["defaultcommand"]
};
elementsNameMap["oops"] = _obj267;
allCommands.push(_obj267);
objectsNameMap["oops"] = _obj267;
_obj268 = {
"elementtype": "object",
"name": "speak",
"type": "command",
"property": "speak",
"isverb": true,
"pattern": "^speak to (?<object>.*)$|^speak (?<g2_map_object>.*)$|^talk to (?<g3_map_object>.*)$|^talk (?<g4_map_object>.*)$",
"defaulttemplate": "DefaultSpeakTo",
"_js_name": "_obj268",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["speak"] = _obj268;
allCommands.push(_obj268);
objectsNameMap["speak"] = _obj268;
_obj269 = {
"elementtype": "object",
"name": "buy",
"type": "command",
"property": "buy",
"isverb": true,
"pattern": "^buy (?<object>.*)$",
"defaulttemplate": "DefaultBuy",
"_js_name": "_obj269",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["buy"] = _obj269;
allCommands.push(_obj269);
objectsNameMap["buy"] = _obj269;
_obj270 = {
"elementtype": "object",
"name": "climb",
"type": "command",
"property": "climb",
"isverb": true,
"pattern": "^climb (?<object>.*)$",
"defaulttemplate": "DefaultClimb",
"_js_name": "_obj270",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["climb"] = _obj270;
allCommands.push(_obj270);
objectsNameMap["climb"] = _obj270;
_obj271 = {
"elementtype": "object",
"name": "drink",
"type": "command",
"property": "drink",
"isverb": true,
"pattern": "^drink (?<object>.*)$",
"defaulttemplate": "DefaultDrink",
"_js_name": "_obj271",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["drink"] = _obj271;
allCommands.push(_obj271);
objectsNameMap["drink"] = _obj271;
_obj272 = {
"elementtype": "object",
"name": "eat",
"type": "command",
"property": "eat",
"isverb": true,
"pattern": "^eat (?<object>.*)$",
"defaulttemplate": "DefaultEat",
"_js_name": "_obj272",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["eat"] = _obj272;
allCommands.push(_obj272);
objectsNameMap["eat"] = _obj272;
_obj273 = {
"elementtype": "object",
"name": "hit",
"type": "command",
"property": "hit",
"isverb": true,
"pattern": "^hit (?<object>.*)$",
"defaulttemplate": "DefaultHit",
"_js_name": "_obj273",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["hit"] = _obj273;
allCommands.push(_obj273);
objectsNameMap["hit"] = _obj273;
_obj274 = {
"elementtype": "object",
"name": "kill",
"type": "command",
"property": "kill",
"isverb": true,
"pattern": "^kill (?<object>.*)$",
"defaulttemplate": "DefaultKill",
"_js_name": "_obj274",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["kill"] = _obj274;
allCommands.push(_obj274);
objectsNameMap["kill"] = _obj274;
_obj275 = {
"elementtype": "object",
"name": "kiss",
"type": "command",
"property": "kiss",
"isverb": true,
"pattern": "^kiss (?<object>.*)$",
"defaulttemplate": "DefaultKiss",
"_js_name": "_obj275",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["kiss"] = _obj275;
allCommands.push(_obj275);
objectsNameMap["kiss"] = _obj275;
_obj276 = {
"elementtype": "object",
"name": "knock",
"type": "command",
"property": "knock",
"isverb": true,
"pattern": "^knock (?<object>.*)$",
"defaulttemplate": "DefaultKnock",
"_js_name": "_obj276",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["knock"] = _obj276;
allCommands.push(_obj276);
objectsNameMap["knock"] = _obj276;
_obj277 = {
"elementtype": "object",
"name": "lick",
"type": "command",
"property": "lick",
"isverb": true,
"pattern": "^lick (?<object>.*)$",
"defaulttemplate": "DefaultLick",
"_js_name": "_obj277",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["lick"] = _obj277;
allCommands.push(_obj277);
objectsNameMap["lick"] = _obj277;
_obj278 = {
"elementtype": "object",
"name": "lieon",
"type": "command",
"property": "lie",
"isverb": true,
"pattern": "^lie on (?<object>.*)$|^lie upon (?<g2_map_object>.*)$|^lie down on (?<g3_map_object>.*)$|^lie down upon (?<g4_map_object>.*)$",
"defaulttemplate": "DefaultLie",
"_js_name": "_obj278",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["lieon"] = _obj278;
allCommands.push(_obj278);
objectsNameMap["lieon"] = _obj278;
_obj279 = {
"elementtype": "object",
"name": "listento",
"type": "command",
"property": "listen",
"isverb": true,
"pattern": "^listen to (?<object>.*)$",
"defaulttemplate": "DefaultListenTo",
"_js_name": "_obj279",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["listento"] = _obj279;
allCommands.push(_obj279);
objectsNameMap["listento"] = _obj279;
_obj280 = {
"elementtype": "object",
"name": "lock",
"type": "command",
"property": "lock",
"isverb": true,
"pattern": "^lock (?<object>.*)$",
"defaulttemplate": "DefaultLock",
"_js_name": "_obj280",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["lock"] = _obj280;
allCommands.push(_obj280);
objectsNameMap["lock"] = _obj280;
_obj281 = {
"elementtype": "object",
"name": "move",
"type": "command",
"property": "move",
"isverb": true,
"pattern": "^move (?<object>.*)$",
"defaulttemplate": "DefaultMove",
"_js_name": "_obj281",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["move"] = _obj281;
allCommands.push(_obj281);
objectsNameMap["move"] = _obj281;
_obj282 = {
"elementtype": "object",
"name": "pull",
"type": "command",
"property": "pull",
"isverb": true,
"pattern": "^pull (?<object>.*)$",
"defaulttemplate": "DefaultPull",
"_js_name": "_obj282",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["pull"] = _obj282;
allCommands.push(_obj282);
objectsNameMap["pull"] = _obj282;
_obj283 = {
"elementtype": "object",
"name": "push",
"type": "command",
"property": "push",
"isverb": true,
"pattern": "^push (?<object>.*)$",
"defaulttemplate": "DefaultPush",
"_js_name": "_obj283",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["push"] = _obj283;
allCommands.push(_obj283);
objectsNameMap["push"] = _obj283;
_obj284 = {
"elementtype": "object",
"name": "read",
"type": "command",
"property": "read",
"isverb": true,
"pattern": "^read (?<object>.*)$",
"defaulttemplate": "DefaultRead",
"_js_name": "_obj284",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["read"] = _obj284;
allCommands.push(_obj284);
objectsNameMap["read"] = _obj284;
_obj285 = {
"elementtype": "object",
"name": "search",
"type": "command",
"property": "search",
"isverb": true,
"pattern": "^search (?<object>.*)$",
"defaulttemplate": "DefaultSearch",
"_js_name": "_obj285",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["search"] = _obj285;
allCommands.push(_obj285);
objectsNameMap["search"] = _obj285;
_obj286 = {
"elementtype": "object",
"name": "show",
"type": "command",
"property": "show",
"isverb": true,
"pattern": "^show (?<object>.*)$",
"defaulttemplate": "DefaultShow",
"_js_name": "_obj286",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["show"] = _obj286;
allCommands.push(_obj286);
objectsNameMap["show"] = _obj286;
_obj287 = {
"elementtype": "object",
"name": "siton",
"type": "command",
"property": "sit",
"isverb": true,
"pattern": "^sit on (?<object>.*)$|^sit upon (?<g2_map_object>.*)$|^sit down on (?<g3_map_object>.*)$|^sit down upon (?<g4_map_object>.*)$",
"defaulttemplate": "DefaultSit",
"_js_name": "_obj287",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["siton"] = _obj287;
allCommands.push(_obj287);
objectsNameMap["siton"] = _obj287;
_obj288 = {
"elementtype": "object",
"name": "smell",
"type": "command",
"property": "smell",
"isverb": true,
"pattern": "^smell (?<object>.*)$|^sniff (?<g2_map_object>.*)$",
"defaulttemplate": "DefaultSmell",
"_js_name": "_obj288",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["smell"] = _obj288;
allCommands.push(_obj288);
objectsNameMap["smell"] = _obj288;
_obj289 = {
"elementtype": "object",
"name": "taste",
"type": "command",
"property": "taste",
"isverb": true,
"pattern": "^taste (?<object>.*)$",
"defaulttemplate": "DefaultTaste",
"_js_name": "_obj289",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["taste"] = _obj289;
allCommands.push(_obj289);
objectsNameMap["taste"] = _obj289;
_obj290 = {
"elementtype": "object",
"name": "throw",
"type": "command",
"property": "throw",
"isverb": true,
"pattern": "^throw (?<object>.*)$",
"defaulttemplate": "DefaultThrow",
"_js_name": "_obj290",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["throw"] = _obj290;
allCommands.push(_obj290);
objectsNameMap["throw"] = _obj290;
_obj291 = {
"elementtype": "object",
"name": "tie",
"type": "command",
"property": "tie",
"isverb": true,
"pattern": "^tie (?<object>.*)$",
"defaulttemplate": "DefaultTie",
"_js_name": "_obj291",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["tie"] = _obj291;
allCommands.push(_obj291);
objectsNameMap["tie"] = _obj291;
_obj292 = {
"elementtype": "object",
"name": "touch",
"type": "command",
"property": "touch",
"isverb": true,
"pattern": "^touch (?<object>.*)$",
"defaulttemplate": "DefaultTouch",
"_js_name": "_obj292",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["touch"] = _obj292;
allCommands.push(_obj292);
objectsNameMap["touch"] = _obj292;
_obj293 = {
"elementtype": "object",
"name": "turnon",
"type": "command",
"property": "turnon",
"isverb": true,
"pattern": "^turn on (?<object>.*)$|^turn (?<g2_map_object>.*) on$|^switch on (?<g3_map_object>.*)$|^switch (?<g4_map_object>.*) on$",
"defaulttemplate": "DefaultTurnOn",
"_js_name": "_obj293",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["turnon"] = _obj293;
allCommands.push(_obj293);
objectsNameMap["turnon"] = _obj293;
_obj294 = {
"elementtype": "object",
"name": "turnoff",
"type": "command",
"property": "turnoff",
"isverb": true,
"pattern": "^turn off (?<object>.*)$|^turn (?<g2_map_object>.*) off$|^switch off (?<g3_map_object>.*)$|^switch (?<g4_map_object>.*) off$",
"defaulttemplate": "DefaultTurnOff",
"_js_name": "_obj294",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["turnoff"] = _obj294;
allCommands.push(_obj294);
objectsNameMap["turnoff"] = _obj294;
_obj295 = {
"elementtype": "object",
"name": "turn",
"type": "command",
"property": "turn",
"isverb": true,
"pattern": "^turn (?<object>.*)$",
"defaulttemplate": "DefaultTurn",
"_js_name": "_obj295",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["turn"] = _obj295;
allCommands.push(_obj295);
objectsNameMap["turn"] = _obj295;
_obj296 = {
"elementtype": "object",
"name": "unlock",
"type": "command",
"property": "unlock",
"isverb": true,
"pattern": "^unlock (?<object>.*)$",
"defaulttemplate": "DefaultUnlock",
"_js_name": "_obj296",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["unlock"] = _obj296;
allCommands.push(_obj296);
objectsNameMap["unlock"] = _obj296;
_obj297 = {
"elementtype": "object",
"name": "untie",
"type": "command",
"property": "untie",
"isverb": true,
"pattern": "^untie (?<object>.*)$",
"defaulttemplate": "DefaultUntie",
"_js_name": "_obj297",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["untie"] = _obj297;
allCommands.push(_obj297);
objectsNameMap["untie"] = _obj297;
_obj298 = {
"elementtype": "object",
"name": "wear",
"type": "command",
"property": "wear",
"isverb": true,
"pattern": "^wear (?<object>.*)$",
"defaulttemplate": "DefaultWear",
"_js_name": "_obj298",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["wear"] = _obj298;
allCommands.push(_obj298);
objectsNameMap["wear"] = _obj298;
_obj299 = {
"elementtype": "object",
"name": "listen",
"type": "command",
"pattern": "^listen$",
"script": function(parameters) { OutputText (Template("DefaultListen")); },
"_js_name": "_obj299",
"_types": ["defaultcommand"]
};
elementsNameMap["listen"] = _obj299;
allCommands.push(_obj299);
objectsNameMap["listen"] = _obj299;
_obj300 = {
"elementtype": "object",
"name": "jump",
"type": "command",
"pattern": "^jump$",
"script": function(parameters) { OutputText (Template("DefaultJump")); },
"_js_name": "_obj300",
"_types": ["defaultcommand"]
};
elementsNameMap["jump"] = _obj300;
allCommands.push(_obj300);
objectsNameMap["jump"] = _obj300;
_obj301 = {
"elementtype": "object",
"name": "sit",
"type": "command",
"pattern": "^sit$|^sit down$",
"script": function(parameters) { OutputText (Template("DefaultSitDown")); },
"_js_name": "_obj301",
"_types": ["defaultcommand"]
};
elementsNameMap["sit"] = _obj301;
allCommands.push(_obj301);
objectsNameMap["sit"] = _obj301;
_obj302 = {
"elementtype": "object",
"name": "lie",
"type": "command",
"pattern": "^lie$|^lie down$",
"script": function(parameters) { OutputText (Template("DefaultLieDown")); },
"_js_name": "_obj302",
"_types": ["defaultcommand"]
};
elementsNameMap["lie"] = _obj302;
allCommands.push(_obj302);
objectsNameMap["lie"] = _obj302;
_obj303 = {
"elementtype": "object",
"name": "sleep",
"type": "command",
"pattern": "^sleep$|^rest$",
"script": function(parameters) { OutputText (Template("DefaultSleep")); },
"_js_name": "_obj303",
"_types": ["defaultcommand"]
};
elementsNameMap["sleep"] = _obj303;
allCommands.push(_obj303);
objectsNameMap["sleep"] = _obj303;
_obj304 = {
"elementtype": "object",
"name": "wait",
"type": "command",
"pattern": "^wait$|^z$",
"script": function(parameters) { OutputText (Template("DefaultWait")); },
"_js_name": "_obj304",
"_types": ["defaultcommand"]
};
elementsNameMap["wait"] = _obj304;
allCommands.push(_obj304);
objectsNameMap["wait"] = _obj304;
_obj305 = {
"elementtype": "object",
"name": "xyzzy",
"type": "command",
"pattern": "^xyzzy$",
"script": function(parameters) { OutputText (Template("DefaultXyzzy")); },
"_js_name": "_obj305",
"_types": ["defaultcommand"]
};
elementsNameMap["xyzzy"] = _obj305;
allCommands.push(_obj305);
objectsNameMap["xyzzy"] = _obj305;
_obj306 = {
"elementtype": "object",
"name": "help",
"type": "command",
"pattern": "^help$|^\\?$",
"script": function(parameters) { OutputText (Template("DefaultHelp")); },
"_js_name": "_obj306",
"_types": ["defaultcommand"]
};
elementsNameMap["help"] = _obj306;
allCommands.push(_obj306);
objectsNameMap["help"] = _obj306;
_obj307 = {
"elementtype": "object",
"name": "save",
"type": "command",
"pattern": "^save$",
"script": function(parameters) { request ("RequestSave", ""); },
"_js_name": "_obj307",
"_types": ["defaultcommand"]
};
elementsNameMap["save"] = _obj307;
allCommands.push(_obj307);
objectsNameMap["save"] = _obj307;
_obj308 = {
"elementtype": "object",
"name": "Bedroom",
"type": "object",
"alias": "Bedroom",
"usedefaultprefix": false,
"description": "Your bedroom is dimly lit due to the morning hours. A small sliver of sunshine pokes through your curtain.",
"exitslistprefix": "You can go to the",
"firstenter": function() { playsound ("WendyMachine.wav", false, false); },
"_js_name": "_obj308",
"_types": ["defaultobject"],
"visible": true,
"displayverbs": ["Look at", "Take"],
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"use": false,
"givesingle": false,
"drop": true,
"gender": "it",
"article": "it",
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"contentsprefix": "containing",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_usegive": false,
"feature_container": false,
"feature_switchable": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} }
};
elementsNameMap["Bedroom"] = _obj308;
allObjects.push(_obj308);
objectsNameMap["Bedroom"] = _obj308;
_obj309 = {
"elementtype": "object",
"name": "player",
"parent": _obj308,
"type": "object",
"_js_name": "_obj309",
"_types": ["defaultobject"],
"visible": true,
"displayverbs": ["Look at", "Take"],
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"use": false,
"givesingle": false,
"drop": true,
"gender": "it",
"article": "it",
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"exitslistprefix": "You can go",
"contentsprefix": "containing",
"description": "",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"usedefaultprefix": true,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_usegive": false,
"feature_container": false,
"feature_switchable": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} }
};
elementsNameMap["player"] = _obj309;
allObjects.push(_obj309);
objectsNameMap["player"] = _obj309;
_obj310 = {
"elementtype": "object",
"name": "Sleep1",
"parent": _obj308,
"type": "command",
"pattern": "Sleep",
"script": function(parameters) { OutputText ("Good idea. You should try to get some more rest.<br/><br/>After all, you haven't gotten much sleep lately. Surely it must be a side effect of that.<br/><br/>You lay back down and close your eyes, attempting to block out the sound of the voices. <br/><br/>\"Whiskey Echo November Delta Yankee. Whiskey Echo November Delta Yankee.\"<br/><br/>THIS IS RIDICULOUS! WHAT IS GOING ON?<br/><br/>In frustration, you try to muffle the repetition by squeezing your skull between two pillows.<br/><br/>It's. Still. There.<br/><br/>It doesn't seem like this is just going to stop. What do you think, should you get up and investigate yourself or call for James to help?"); },
"_js_name": "_obj310",
"_types": ["defaultcommand"]
};
elementsNameMap["Sleep1"] = _obj310;
allCommands.push(_obj310);
objectsNameMap["Sleep1"] = _obj310;
_obj311 = {
"elementtype": "object",
"name": "Sleep2",
"parent": _obj308,
"type": "command",
"pattern": "Go back to sleep",
"script": function(parameters) { OutputText ("Good idea. You should try to get some more rest.<br/><br/>After all, you haven't gotten much sleep lately. Surely it must be a side effect of that.<br/><br/>You lay back down and close your eyes, attempting to block out the sound of the voices. <br/><br/>\"Whiskey Echo November Delta Yankee. Whiskey Echo November Delta Yankee.\"<br/><br/>THIS IS RIDICULOUS! WHAT IS GOING ON?<br/><br/>In frustration, you try to muffle the repetition by squeezing your skull between two pillows.<br/><br/>It's. Still. There.<br/><br/>It doesn't seem like this is just going to stop. What do you think, should you get up and investigate yourself or call for James to help?"); },
"_js_name": "_obj311",
"_types": ["defaultcommand"]
};
elementsNameMap["Sleep2"] = _obj311;
allCommands.push(_obj311);
objectsNameMap["Sleep2"] = _obj311;
_obj312 = {
"elementtype": "object",
"name": "Sleep3",
"parent": _obj308,
"type": "command",
"pattern": "Back to sleep",
"script": function(parameters) { OutputText ("Good idea. You should try to get some more rest.<br/><br/>After all, you haven't gotten much sleep lately. Surely it must be a side effect of that.<br/><br/>You lay back down and close your eyes, attempting to block out the sound of the voices. <br/><br/>\"Whiskey Echo November Delta Yankee. Whiskey Echo November Delta Yankee.\"<br/><br/>THIS IS RIDICULOUS! WHAT IS GOING ON?<br/><br/>In frustration, you try to muffle the repetition by squeezing your skull between two pillows.<br/><br/>It's. Still. There.<br/><br/>It doesn't seem like this is just going to stop. What do you think, should you get up and investigate yourself or call for James to help?"); },
"_js_name": "_obj312",
"_types": ["defaultcommand"]
};
elementsNameMap["Sleep3"] = _obj312;
allCommands.push(_obj312);
objectsNameMap["Sleep3"] = _obj312;
_obj313 = {
"elementtype": "object",
"name": "James1",
"parent": _obj308,
"type": "command",
"pattern": "Call for James",
"script": function(parameters) { OutputText ("You call for James. You're positive he'll help you feel better somehow.<br/><br/>There's no answer.<br/><br/>You call again... and again.<br/><br/>For a moment you begin to panic... until you realize that James had a Broadway audition this morning.<br/><br/>Well, he's going to be gone for awhile. The kids are at school all day.<br/><br/>You figure your best bet is to get up and see what you can find out."); },
"_js_name": "_obj313",
"_types": ["defaultcommand"]
};
elementsNameMap["James1"] = _obj313;
allCommands.push(_obj313);
objectsNameMap["James1"] = _obj313;
_obj314 = {
"elementtype": "object",
"name": "James2",
"parent": _obj308,
"type": "command",
"pattern": "James",
"script": function(parameters) { OutputText ("You call for James. You're positive he'll help you feel better somehow.<br/><br/>There's no answer.<br/><br/>You call again... and again.<br/><br/>For a moment you begin to panic... until you realize that James had a Broadway audition this morning.<br/><br/>Well, he's going to be gone for awhile. The kids are at school all day.<br/><br/>You figure your best bet is to get up and see what you can find out."); },
"_js_name": "_obj314",
"_types": ["defaultcommand"]
};
elementsNameMap["James2"] = _obj314;
allCommands.push(_obj314);
objectsNameMap["James2"] = _obj314;
_obj315 = {
"elementtype": "object",
"name": "James3",
"parent": _obj308,
"type": "command",
"pattern": "Call James",
"script": function(parameters) { OutputText ("You call for James. You're positive he'll help you feel better somehow.<br/><br/>There's no answer.<br/><br/>You call again... and again.<br/><br/>For a moment you begin to panic... until you realize that James had a Broadway audition this morning.<br/><br/>Well, he's going to be gone for awhile. The kids are at school all day.<br/><br/>You figure your best bet is to get up and see what you can find out."); },
"_js_name": "_obj315",
"_types": ["defaultcommand"]
};
elementsNameMap["James3"] = _obj315;
allCommands.push(_obj315);
objectsNameMap["James3"] = _obj315;
_obj316 = {
"elementtype": "object",
"name": "Get up",
"parent": _obj308,
"type": "command",
"pattern": "Get up",
"script": function(parameters) { OutputText ("You decide to try to wake up. You should go into the hallway."); },
"_js_name": "_obj316",
"_types": ["defaultcommand"]
};
elementsNameMap["Get up"] = _obj316;
allCommands.push(_obj316);
objectsNameMap["Get up"] = _obj316;
_obj317 = {
"elementtype": "object",
"name": "Get up2",
"parent": _obj308,
"type": "command",
"pattern": "Wake up",
"script": function(parameters) { OutputText ("You decide to try to wake up. You should go into the hallway."); },
"_js_name": "_obj317",
"_types": ["defaultcommand"]
};
elementsNameMap["Get up2"] = _obj317;
allCommands.push(_obj317);
objectsNameMap["Get up2"] = _obj317;
_obj318 = {
"elementtype": "object",
"name": "Get up3",
"parent": _obj308,
"type": "command",
"pattern": "Investigate",
"script": function(parameters) { OutputText ("You decide to try to wake up. You should go into the hallway."); },
"_js_name": "_obj318",
"_types": ["defaultcommand"]
};
elementsNameMap["Get up3"] = _obj318;
allCommands.push(_obj318);
objectsNameMap["Get up3"] = _obj318;
_obj319 = {
"elementtype": "object",
"name": "sweatshirt",
"parent": _obj308,
"type": "object",
"look": "There is a comfortable looking Raven + Lily sweatshirt on your dresser.",
"usestandardverblist": true,
"displayverbs": ["Look at", "Wear"],
"wear": "You pull the sweatshirt on over your head.... the head that is currently driving you crazy.",
"_js_name": "_obj319",
"_types": ["defaultobject"],
"visible": true,
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"use": false,
"givesingle": false,
"drop": true,
"gender": "it",
"article": "it",
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"exitslistprefix": "You can go",
"contentsprefix": "containing",
"description": "",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"usedefaultprefix": true,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_usegive": false,
"feature_container": false,
"feature_switchable": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} }
};
elementsNameMap["sweatshirt"] = _obj319;
allObjects.push(_obj319);
objectsNameMap["sweatshirt"] = _obj319;
_obj320 = {
"elementtype": "object",
"name": "glass of water",
"parent": _obj308,
"type": "object",
"look": "There is a partially full glass of water on your nightstand.",
"usestandardverblist": true,
"displayverbs": ["Look at", "Drink"],
"drink": "You take a big gulp of the water and you can definitely tell that it's been sitting there since last night. Alas, now you feel insane AND a bit nauseous.",
"_js_name": "_obj320",
"_types": ["defaultobject"],
"visible": true,
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"use": false,
"givesingle": false,
"drop": true,
"gender": "it",
"article": "it",
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"exitslistprefix": "You can go",
"contentsprefix": "containing",
"description": "",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"usedefaultprefix": true,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_usegive": false,
"feature_container": false,
"feature_switchable": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} }
};
elementsNameMap["glass of water"] = _obj320;
allObjects.push(_obj320);
objectsNameMap["glass of water"] = _obj320;
_obj321 = {
"elementtype": "object",
"name": "k3",
"parent": _obj308,
"type": "exit",
"alias": "Hallway",
"scenery": false,
"_js_name": "_obj321",
"_types": ["southdirection", "defaultexit"],
"alt": ["s"],
"prefix": "",
"suffix": "",
"displayverbs": ["Go"],
"visible": true,
"locked": false,
"lockmessage": "That way is locked.",
"lookonly": false,
"runscript": false,
"lightstrength": "",
"grid_length": 1,
"grid_render": false,
"grid_offset_x": 0,
"grid_offset_y": 0
};
elementsNameMap["k3"] = _obj321;
objectReferences.push(["_obj321", "to", "_obj337"]);
allExits.push(_obj321);
objectsNameMap["k3"] = _obj321;
_obj322 = {
"elementtype": "object",
"name": "hallway",
"parent": _obj308,
"type": "command",
"pattern": "Hallway",
"script": function(parameters) { MoveObject (_obj309, _obj337); },
"_js_name": "_obj322",
"_types": ["defaultcommand"]
};
elementsNameMap["hallway"] = _obj322;
allCommands.push(_obj322);
objectsNameMap["hallway"] = _obj322;
_obj323 = {
"elementtype": "object",
"name": "yes",
"parent": _obj308,
"type": "command",
"pattern": "Yes",
"script": function(parameters) { OutputText ("Good idea. You should try to get some more rest.<br/><br/>After all, you haven't gotten much sleep lately. Surely it must be a side effect of that.<br/><br/>You lay back down and close your eyes, attempting to block out the sound of the voices. <br/><br/>\"Whiskey Echo November Delta Yankee. Whiskey Echo November Delta Yankee.\"<br/><br/>THIS IS RIDICULOUS! WHAT IS GOING ON?<br/><br/>In frustration, you try to muffle the repetition by squeezing your skull between two pillows.<br/><br/>It's. Still. There.<br/><br/>It doesn't seem like this is just going to stop. What do you think, should you get up and investigate yourself or call for James to help?"); },
"_js_name": "_obj323",
"_types": ["defaultcommand"]
};
elementsNameMap["yes"] = _obj323;
allCommands.push(_obj323);
objectsNameMap["yes"] = _obj323;
_obj324 = {
"elementtype": "object",
"name": "No",
"parent": _obj308,
"type": "command",
"pattern": "No",
"script": function(parameters) { MoveObject (_obj309, _obj337); },
"_js_name": "_obj324",
"_types": ["defaultcommand"]
};
elementsNameMap["No"] = _obj324;
allCommands.push(_obj324);
objectsNameMap["No"] = _obj324;
_obj325 = {
"elementtype": "object",
"name": "Hi1",
"type": "command",
"pattern": "Hi Amanda",
"script": function(parameters) { OutputText ("Well, hi there, Amy!"); },
"_js_name": "_obj325",
"_types": ["defaultcommand"]
};
elementsNameMap["Hi1"] = _obj325;
allCommands.push(_obj325);
objectsNameMap["Hi1"] = _obj325;
_obj326 = {
"elementtype": "object",
"name": "Hi2",
"type": "command",
"pattern": "Hey Amanda",
"script": function(parameters) { OutputText ("Hi-dee Ho, Ackerino!"); },
"_js_name": "_obj326",
"_types": ["defaultcommand"]
};
elementsNameMap["Hi2"] = _obj326;
allCommands.push(_obj326);
objectsNameMap["Hi2"] = _obj326;
_obj327 = {
"elementtype": "object",
"name": "Awesome",
"type": "command",
"pattern": "Amanda is awesome",
"script": function(parameters) { OutputText ("Aw, shucks... you're not too shabby yourself!"); },
"_js_name": "_obj327",
"_types": ["defaultcommand"]
};
elementsNameMap["Awesome"] = _obj327;
allCommands.push(_obj327);
objectsNameMap["Awesome"] = _obj327;
_obj328 = {
"elementtype": "object",
"name": "Hint",
"type": "command",
"pattern": "Hint",
"script": function(parameters) { OutputText ("Hints? HINTS?!<br/><br/>We don't need no stinkin' hints!<br/><br/>(but try \"help\" if you're super lost)"); },
"_js_name": "_obj328",
"_types": ["defaultcommand"]
};
elementsNameMap["Hint"] = _obj328;
allCommands.push(_obj328);
objectsNameMap["Hint"] = _obj328;
_obj329 = {
"elementtype": "object",
"name": "Secret",
"type": "command",
"pattern": "Secret",
"script": function(parameters) { OutputText ("Do you wanna know a secret?<br/><br/>Monkeys are really just hairy little people."); },
"_js_name": "_obj329",
"_types": ["defaultcommand"]
};
elementsNameMap["Secret"] = _obj329;
allCommands.push(_obj329);
objectsNameMap["Secret"] = _obj329;
_obj330 = {
"elementtype": "object",
"name": "Cavemen",
"type": "command",
"pattern": "Cavemen win.",
"script": function(parameters) { OutputText ("Of course the cavemen win."); },
"_js_name": "_obj330",
"_types": ["defaultcommand"]
};
elementsNameMap["Cavemen"] = _obj330;
allCommands.push(_obj330);
objectsNameMap["Cavemen"] = _obj330;
_obj331 = {
"elementtype": "object",
"name": "Heroes",
"type": "command",
"pattern": "I walk with heroes. Think about that.",
"unresolved": "You are one.",
"_js_name": "_obj331",
"_types": ["defaultcommand"]
};
elementsNameMap["Heroes"] = _obj331;
allCommands.push(_obj331);
objectsNameMap["Heroes"] = _obj331;
_obj332 = {
"elementtype": "object",
"name": "Scars",
"type": "command",
"pattern": "I like my scars.",
"script": function(parameters) { OutputText ("They bring out your eyes."); },
"_js_name": "_obj332",
"_types": ["defaultcommand"]
};
elementsNameMap["Scars"] = _obj332;
allCommands.push(_obj332);
objectsNameMap["Scars"] = _obj332;
_obj333 = {
"elementtype": "object",
"name": "Asleep",
"type": "command",
"pattern": "Did I fall asleep?",
"script": function(parameters) { OutputText ("For a little while."); },
"_js_name": "_obj333",
"_types": ["defaultcommand"]
};
elementsNameMap["Asleep"] = _obj333;
allCommands.push(_obj333);
objectsNameMap["Asleep"] = _obj333;
_obj334 = {
"elementtype": "object",
"name": "Sweet",
"type": "command",
"pattern": "Sundown, Ottawa. Left, right, left, right, one, two, three. ",
"script": function(parameters) { OutputText ("You say the sweetest things."); },
"_js_name": "_obj334",
"_types": ["defaultcommand"]
};
elementsNameMap["Sweet"] = _obj334;
allCommands.push(_obj334);
objectsNameMap["Sweet"] = _obj334;
_obj335 = {
"elementtype": "object",
"name": "Someday",
"type": "command",
"pattern": "Maybe someday",
"script": function(parameters) { OutputText ("... Shoot will live happily ever after."); },
"_js_name": "_obj335",
"_types": ["defaultcommand"]
};
elementsNameMap["Someday"] = _obj335;
allCommands.push(_obj335);
objectsNameMap["Someday"] = _obj335;
_obj336 = {
"elementtype": "object",
"name": "k4",
"type": "command",
"anonymous": true,
"property": "look",
"isverb": true,
"pattern": "^look (?<object>.*)$",
"defaultexpression": "\"You can't look \" + object.article + \".\"",
"_js_name": "_obj336",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["k4"] = _obj336;
allCommands.push(_obj336);
objectsNameMap["k4"] = _obj336;
_obj337 = {
"elementtype": "object",
"name": "Hallway",
"type": "object",
"description": "The walls of the hallway are lined with family photos and memories. You see the bedroom, the bathroom and the living room. ",
"exitslistprefix": "You can go to the",
"_js_name": "_obj337",
"_types": ["defaultobject"],
"visible": true,
"displayverbs": ["Look at", "Take"],
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"use": false,
"givesingle": false,
"drop": true,
"gender": "it",
"article": "it",
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"contentsprefix": "containing",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"usedefaultprefix": true,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_usegive": false,
"feature_container": false,
"feature_switchable": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} }
};
elementsNameMap["Hallway"] = _obj337;
allObjects.push(_obj337);
objectsNameMap["Hallway"] = _obj337;
_obj338 = {
"elementtype": "object",
"name": "framed photo",
"parent": _obj337,
"type": "object",
"displayverbs": ["Look at"],
"usestandardverblist": true,
"look": function() { picture ("cmuepv7wuaadd1e.jpg"); },
"_js_name": "_obj338",
"_types": ["defaultobject"],
"visible": true,
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"use": false,
"givesingle": false,
"drop": true,
"gender": "it",
"article": "it",
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"exitslistprefix": "You can go",
"contentsprefix": "containing",
"description": "",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"usedefaultprefix": true,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_usegive": false,
"feature_container": false,
"feature_switchable": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} }
};
elementsNameMap["framed photo"] = _obj338;
allObjects.push(_obj338);
objectsNameMap["framed photo"] = _obj338;
_obj339 = {
"elementtype": "object",
"name": "second framed photo",
"parent": _obj337,
"type": "object",
"displayverbs": ["Look at"],
"usestandardverblist": true,
"look": function() { picture ("btqvueviqaa43ks.jpg"); },
"_js_name": "_obj339",
"_types": ["defaultobject"],
"visible": true,
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"use": false,
"givesingle": false,
"drop": true,
"gender": "it",
"article": "it",
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"exitslistprefix": "You can go",
"contentsprefix": "containing",
"description": "",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"usedefaultprefix": true,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_usegive": false,
"feature_container": false,
"feature_switchable": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} }
};
elementsNameMap["second framed photo"] = _obj339;
allObjects.push(_obj339);
objectsNameMap["second framed photo"] = _obj339;
_obj340 = {
"elementtype": "object",
"name": "third framed photo",
"parent": _obj337,
"type": "object",
"usestandardverblist": true,
"displayverbs": ["Look at"],
"look": function() { picture ("bx8xbscccaafjng.jpg"); },
"_js_name": "_obj340",
"_types": ["defaultobject"],
"visible": true,
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"use": false,
"givesingle": false,
"drop": true,
"gender": "it",
"article": "it",
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"exitslistprefix": "You can go",
"contentsprefix": "containing",
"description": "",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"usedefaultprefix": true,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_usegive": false,
"feature_container": false,
"feature_switchable": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} }
};
elementsNameMap["third framed photo"] = _obj340;
allObjects.push(_obj340);
objectsNameMap["third framed photo"] = _obj340;
_obj341 = {
"elementtype": "object",
"name": "fourth framed photo",
"parent": _obj337,
"type": "object",
"usestandardverblist": true,
"displayverbs": ["Look at"],
"look": function() { picture ("bu9v93_igaatiec.jpg"); },
"_js_name": "_obj341",
"_types": ["defaultobject"],
"visible": true,
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"use": false,
"givesingle": false,
"drop": true,
"gender": "it",
"article": "it",
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"exitslistprefix": "You can go",
"contentsprefix": "containing",
"description": "",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"usedefaultprefix": true,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_usegive": false,
"feature_container": false,
"feature_switchable": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} }
};
elementsNameMap["fourth framed photo"] = _obj341;
allObjects.push(_obj341);
objectsNameMap["fourth framed photo"] = _obj341;
_obj342 = {
"elementtype": "object",
"name": "Maleficent cape",
"parent": _obj337,
"type": "object",
"usedefaultprefix": true,
"look": "Laying on the ground you see part of Ava's Maleficent costume.",
"usestandardverblist": true,
"displayverbs": ["Look at", "Put on"],
"puton": "You place the cape around your neck and strike an evil pose. You are pretty sure you look intimidating, but that didn't help anything.",
"_js_name": "_obj342",
"_types": ["defaultobject"],
"visible": true,
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"use": false,
"givesingle": false,
"drop": true,
"gender": "it",
"article": "it",
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"exitslistprefix": "You can go",
"contentsprefix": "containing",
"description": "",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_usegive": false,
"feature_container": false,
"feature_switchable": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} }
};
elementsNameMap["Maleficent cape"] = _obj342;
allObjects.push(_obj342);
objectsNameMap["Maleficent cape"] = _obj342;
_obj343 = {
"elementtype": "object",
"name": "k5",
"parent": _obj337,
"type": "exit",
"alias": "Bedroom",
"to": _obj308,
"_js_name": "_obj343",
"_types": ["defaultexit"],
"displayverbs": ["Go to"],
"visible": true,
"scenery": false,
"locked": false,
"lockmessage": "That way is locked.",
"lookonly": false,
"runscript": false,
"lightstrength": "",
"grid_length": 1,
"grid_render": false,
"grid_offset_x": 0,
"grid_offset_y": 0
};
elementsNameMap["k5"] = _obj343;
allExits.push(_obj343);
objectsNameMap["k5"] = _obj343;
_obj344 = {
"elementtype": "object",
"name": "k6",
"parent": _obj337,
"type": "exit",
"alias": "Bathroom",
"_js_name": "_obj344",
"_types": ["defaultexit"],
"displayverbs": ["Go to"],
"visible": true,
"scenery": false,
"locked": false,
"lockmessage": "That way is locked.",
"lookonly": false,
"runscript": false,
"lightstrength": "",
"grid_length": 1,
"grid_render": false,
"grid_offset_x": 0,
"grid_offset_y": 0
};
elementsNameMap["k6"] = _obj344;
objectReferences.push(["_obj344", "to", "_obj350"]);
allExits.push(_obj344);
objectsNameMap["k6"] = _obj344;
_obj345 = {
"elementtype": "object",
"name": "k7",
"parent": _obj337,
"type": "exit",
"alias": "Living Room",
"_js_name": "_obj345",
"_types": ["defaultexit"],
"displayverbs": ["Go to"],
"visible": true,
"scenery": false,
"locked": false,
"lockmessage": "That way is locked.",
"lookonly": false,
"runscript": false,
"lightstrength": "",
"grid_length": 1,
"grid_render": false,
"grid_offset_x": 0,
"grid_offset_y": 0
};
elementsNameMap["k7"] = _obj345;
objectReferences.push(["_obj345", "to", "_obj359"]);
allExits.push(_obj345);
objectsNameMap["k7"] = _obj345;
_obj346 = {
"elementtype": "object",
"name": "bedroom",
"parent": _obj337,
"type": "command",
"pattern": "Bedroom",
"script": function(parameters) { MoveObject (_obj309, _obj308); },
"_js_name": "_obj346",
"_types": ["defaultcommand"]
};
elementsNameMap["bedroom"] = _obj346;
allCommands.push(_obj346);
objectsNameMap["bedroom"] = _obj346;
_obj347 = {
"elementtype": "object",
"name": "bathroom",
"parent": _obj337,
"type": "command",
"pattern": "Bathroom",
"script": function(parameters) { MoveObject (_obj309, _obj350); },
"_js_name": "_obj347",
"_types": ["defaultcommand"]
};
elementsNameMap["bathroom"] = _obj347;
allCommands.push(_obj347);
objectsNameMap["bathroom"] = _obj347;
_obj348 = {
"elementtype": "object",
"name": "livingroomhallway",
"parent": _obj337,
"type": "command",
"pattern": "Living Room",
"script": function(parameters) { MoveObject (_obj309, _obj359); },
"_js_name": "_obj348",
"_types": ["defaultcommand"]
};
elementsNameMap["livingroomhallway"] = _obj348;
allCommands.push(_obj348);
objectsNameMap["livingroomhallway"] = _obj348;
_obj349 = {
"elementtype": "object",
"name": "k8",
"type": "command",
"anonymous": true,
"property": "puton",
"isverb": true,
"pattern": "^put on (?<object>.*)$",
"defaultexpression": "\"You can't put on \" + object.article + \".\"",
"_js_name": "_obj349",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["k8"] = _obj349;
allCommands.push(_obj349);
objectsNameMap["k8"] = _obj349;
_obj350 = {
"elementtype": "object",
"name": "Bathroom",
"type": "object",
"description": "The bathroom is like any other without any particularly distinguishing features.",
"exitslistprefix": "You can go to the",
"_js_name": "_obj350",
"_types": ["defaultobject"],
"visible": true,
"displayverbs": ["Look at", "Take"],
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"use": false,
"givesingle": false,
"drop": true,
"gender": "it",
"article": "it",
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"contentsprefix": "containing",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"usedefaultprefix": true,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_usegive": false,
"feature_container": false,
"feature_switchable": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} }
};
elementsNameMap["Bathroom"] = _obj350;
allObjects.push(_obj350);
objectsNameMap["Bathroom"] = _obj350;
_obj351 = {
"elementtype": "object",
"name": "wash cloth",
"parent": _obj350,
"type": "object",
"look": "The wash cloth is still a bit damp. Someone must have used it earlier this morning.",
"usestandardverblist": true,
"displayverbs": ["Look at", "Wipe face"],
"feature_usegive": false,
"wipeface": "You pick up the wash cloth, wet it and wipe your face off. Maybe this will help you feel better.",
"use": function() { OutputText (""); },
"_js_name": "_obj351",
"_types": ["defaultobject"],
"visible": true,
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"givesingle": false,
"drop": true,
"gender": "it",
"article": "it",
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"exitslistprefix": "You can go",
"contentsprefix": "containing",
"description": "",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"usedefaultprefix": true,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_container": false,
"feature_switchable": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} }
};
elementsNameMap["wash cloth"] = _obj351;
allObjects.push(_obj351);
objectsNameMap["wash cloth"] = _obj351;
_obj352 = {
"elementtype": "object",
"name": "toothbrush",
"parent": _obj350,
"type": "object",
"look": "It's... umm... it's just a toothbrush.",
"usestandardverblist": true,
"displayverbs": ["Look at", "Brush teeth"],
"feature_usegive": false,
"brushteeth": "You squeeze out some toothpaste, turn on your electric toothbrush and, as you begin to brush, the buzzing seems to enhance the echoing in your ears.",
"_js_name": "_obj352",
"_types": ["defaultobject"],
"visible": true,
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"use": false,
"givesingle": false,
"drop": true,
"gender": "it",
"article": "it",
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"exitslistprefix": "You can go",
"contentsprefix": "containing",
"description": "",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"usedefaultprefix": true,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_container": false,
"feature_switchable": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} }
};
elementsNameMap["toothbrush"] = _obj352;
allObjects.push(_obj352);
objectsNameMap["toothbrush"] = _obj352;
_obj353 = {
"elementtype": "object",
"name": "smudge",
"parent": _obj350,
"type": "object",
"look": "Looks like Jackson or Ava left something weird on the sink again.",
"usestandardverblist": true,
"displayverbs": ["Look at", "Use", "Clean"],
"clean": "You clean up the smudge, trying not to think about what it could be.",
"feature_usegive": true,
"use": function() { OutputText ("Gross. You don't want to use this strange substance for anything. You consider cleaning it up."); },
"_js_name": "_obj353",
"_types": ["defaultobject"],
"visible": true,
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"givesingle": false,
"drop": true,
"gender": "it",
"article": "it",
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"exitslistprefix": "You can go",
"contentsprefix": "containing",
"description": "",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"usedefaultprefix": true,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_container": false,
"feature_switchable": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} }
};
elementsNameMap["smudge"] = _obj353;
allObjects.push(_obj353);
objectsNameMap["smudge"] = _obj353;
_obj354 = {
"elementtype": "object",
"name": "k9",
"parent": _obj350,
"type": "exit",
"alias": "Hallway",
"to": _obj337,
"_js_name": "_obj354",
"_types": ["defaultexit"],
"displayverbs": ["Go to"],
"visible": true,
"scenery": false,
"locked": false,
"lockmessage": "That way is locked.",
"lookonly": false,
"runscript": false,
"lightstrength": "",
"grid_length": 1,
"grid_render": false,
"grid_offset_x": 0,
"grid_offset_y": 0
};
elementsNameMap["k9"] = _obj354;
allExits.push(_obj354);
objectsNameMap["k9"] = _obj354;
_obj355 = {
"elementtype": "object",
"name": "hallwaybathroom",
"parent": _obj350,
"type": "command",
"pattern": "Hallway",
"script": function(parameters) { MoveObject (_obj309, _obj337); },
"_js_name": "_obj355",
"_types": ["defaultcommand"]
};
elementsNameMap["hallwaybathroom"] = _obj355;
allCommands.push(_obj355);
objectsNameMap["hallwaybathroom"] = _obj355;
_obj356 = {
"elementtype": "object",
"name": "k10",
"type": "command",
"anonymous": true,
"property": "brushteeth",
"isverb": true,
"pattern": "^brush teeth (?<object>.*)$",
"defaultexpression": "\"You can't brush teeth \" + object.article + \".\"",
"_js_name": "_obj356",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["k10"] = _obj356;
allCommands.push(_obj356);
objectsNameMap["k10"] = _obj356;
_obj357 = {
"elementtype": "object",
"name": "k11",
"type": "command",
"anonymous": true,
"property": "wipeface",
"isverb": true,
"pattern": "^wipe face (?<object>.*)$",
"defaultexpression": "\"You can't wipe face \" + object.article + \".\"",
"_js_name": "_obj357",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["k11"] = _obj357;
allCommands.push(_obj357);
objectsNameMap["k11"] = _obj357;
_obj358 = {
"elementtype": "object",
"name": "k12",
"type": "command",
"anonymous": true,
"property": "clean",
"isverb": true,
"pattern": "^clean (?<object>.*)$",
"defaultexpression": "\"You can't clean \" + object.article + \".\"",
"_js_name": "_obj358",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["k12"] = _obj358;
allCommands.push(_obj358);
objectsNameMap["k12"] = _obj358;
_obj359 = {
"elementtype": "object",
"name": "Living Room",
"type": "object",
"description": "The living room is cozy and well decorated. You love having guests over, so you have created a wonderful atmosphere for them.",
"exitslistprefix": "You can go to the",
"_js_name": "_obj359",
"_types": ["defaultobject"],
"visible": true,
"displayverbs": ["Look at", "Take"],
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"use": false,
"givesingle": false,
"drop": true,
"gender": "it",
"article": "it",
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"contentsprefix": "containing",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"usedefaultprefix": true,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_usegive": false,
"feature_container": false,
"feature_switchable": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} }
};
elementsNameMap["Living Room"] = _obj359;
allObjects.push(_obj359);
objectsNameMap["Living Room"] = _obj359;
_obj360 = {
"elementtype": "object",
"name": "TV",
"parent": _obj359,
"type": "object",
"look": "The television is currently off. It might be a good idea to check the news and see if anything strange is going on.",
"usestandardverblist": true,
"displayverbs": ["Look at", "Turn on", "Turn up", "Channel up", "Channel down"],
"turnon": "You turn the television on. After switching through a few channels, you don't notice any type of special news reports. Nothing is shown on your local news, either. You crack a moderate smile when you notice some reruns of Angel are on.",
"turnup": "You turn up the volume as loud as possible... but it doesn't stifle the message in your ear.",
"channelup": function() { ShowYouTube ("Fcoy8b79Jic"); },
"channeldown": function() { ShowYouTube ("_jOAMGV9h_Y"); },
"_js_name": "_obj360",
"_types": ["defaultobject"],
"visible": true,
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"use": false,
"givesingle": false,
"drop": true,
"gender": "it",
"article": "it",
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"exitslistprefix": "You can go",
"contentsprefix": "containing",
"description": "",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"usedefaultprefix": true,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_usegive": false,
"feature_container": false,
"feature_switchable": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} }
};
elementsNameMap["TV"] = _obj360;
allObjects.push(_obj360);
objectsNameMap["TV"] = _obj360;
_obj361 = {
"elementtype": "object",
"name": "skiing magazine",
"parent": _obj359,
"type": "object",
"usedefaultprefix": true,
"look": "On your coffee table sits one of James' skiing magazines. You really wish you were skiing right now instead of dealing with ghostly voices.",
"displayverbs": ["Look at", "Examine closer"],
"usestandardverblist": true,
"examinecloser": "You lift the magazine and flip through a few pages. Though it reminds you of better times, there's not much else here.",
"_js_name": "_obj361",
"_types": ["defaultobject"],
"visible": true,
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"use": false,
"givesingle": false,
"drop": true,
"gender": "it",
"article": "it",
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"exitslistprefix": "You can go",
"contentsprefix": "containing",
"description": "",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_usegive": false,
"feature_container": false,
"feature_switchable": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} }
};
elementsNameMap["skiing magazine"] = _obj361;
allObjects.push(_obj361);
objectsNameMap["skiing magazine"] = _obj361;
_obj362 = {
"elementtype": "object",
"name": "k13",
"parent": _obj359,
"type": "exit",
"alias": "Hallway",
"to": _obj337,
"_js_name": "_obj362",
"_types": ["defaultexit"],
"displayverbs": ["Go to"],
"visible": true,
"scenery": false,
"locked": false,
"lockmessage": "That way is locked.",
"lookonly": false,
"runscript": false,
"lightstrength": "",
"grid_length": 1,
"grid_render": false,
"grid_offset_x": 0,
"grid_offset_y": 0
};
elementsNameMap["k13"] = _obj362;
allExits.push(_obj362);
objectsNameMap["k13"] = _obj362;
_obj363 = {
"elementtype": "object",
"name": "k14",
"parent": _obj359,
"type": "exit",
"alias": "Yard",
"_js_name": "_obj363",
"_types": ["defaultexit"],
"displayverbs": ["Go to"],
"visible": true,
"scenery": false,
"locked": false,
"lockmessage": "That way is locked.",
"lookonly": false,
"runscript": false,
"lightstrength": "",
"grid_length": 1,
"grid_render": false,
"grid_offset_x": 0,
"grid_offset_y": 0
};
elementsNameMap["k14"] = _obj363;
objectReferences.push(["_obj363", "to", "_obj378"]);
allExits.push(_obj363);
objectsNameMap["k14"] = _obj363;
_obj364 = {
"elementtype": "object",
"name": "hallwaylivingroom",
"parent": _obj359,
"type": "command",
"pattern": "Hallway",
"script": function(parameters) { MoveObject (_obj309, _obj337); },
"_js_name": "_obj364",
"_types": ["defaultcommand"]
};
elementsNameMap["hallwaylivingroom"] = _obj364;
allCommands.push(_obj364);
objectsNameMap["hallwaylivingroom"] = _obj364;
_obj365 = {
"elementtype": "object",
"name": "yard",
"parent": _obj359,
"type": "command",
"pattern": "Yard",
"script": function(parameters) { MoveObject (_obj309, _obj378); },
"_js_name": "_obj365",
"_types": ["defaultcommand"]
};
elementsNameMap["yard"] = _obj365;
allCommands.push(_obj365);
objectsNameMap["yard"] = _obj365;
_obj366 = {
"elementtype": "object",
"name": "cell phone",
"parent": _obj359,
"type": "object",
"look": "You pick up your phone and try to determine what to do next. Maybe there is someone you can call?",
"usestandardverblist": true,
"displayverbs": ["Look at", "Use", "Shake", "Throw", "Call Sarah", "Call James", "Call Jim", "Call Greg", "Call Michael"],
"shake": "You violently shake your cell phone. Nothing happens. You wonder why you wanted to shake your phone in the first place. You should try something else.",
"throw": "You can't control yourself and suddenly chuck your cell phone against the wall. Whoops. At least you can still use it enough to call somebody.",
"callsarah": "You decide to call Sarah; the \"Shaw\" to your \"Root\". The phone rings a few times before she answers. Finally, you hear her gasp for air as she asks, \"What's up, Amy?\". You tell her that you figured out her prank and that she can turn the speakers off now. You've been listening to this ever since you woke up and you're beginning to get a massive headache. \"Amy, what are you talking about... hold on\" - you hear the sound of twins crying and something breaking. \"Listen, I'm really busy with the kids and Steve isn't here, I have to go\". The call disconnects and you are left confused and irritated. All right, so Sarah didn't do it. Maybe you should call someone else.",
"calljames": "You begin to call James until you remember that he's busy at his Broadway audition.",
"callgreg": "You know exactly who is behind this. It must be Greg. After all, he's got a great sense of humor. You find his contact information and hit \"call\". The phone rings. And rings. And rings.... \"Hello, you've reached Greg Plageman...\" you end the call. That didn't give you any definite answers. You'll keep trying the others.",
"calljim": "At the end of the day, Jim has definitely been known to goof around on set. Perhaps he is the one behind all of this. \"Hi Amy! What can I do for you?\". You try to explain the situation and ask if he has somehow hidden a speaker in your house to drive you nuts. \"You sound like a crazy person right now, are YOU messing with ME?\". You know you sound crazy... but this obviously means that Jim wasn't a part of this incident. You apologize and hang up the call. Someone has to know something.",
"callmichael": "You think to call Michael. Even though he doesn't usually play pranks, maybe that's what would make it so brilliant. \"Hello... Amy... Hello? Hello??\". Michael sounds startled and distracted. You start to tell him about the sound you've been hearing, \"AMY? HELLO? I don't know what's going on... listen... can... can you meet me?\". It seems like he's having a hard time hearing you for some reason. You tell him you will meet up with him immediately.",
"feature_usegive": true,
"use": function() { OutputText ("You need to know what's happening here, so you start sifting through your phonebook. <br/><br/>You're starting to worry. If anything, it seems like the voices are getting louder.<br/><br/>You wonder if you're just going crazy. I mean, there is absolutely no way you could magically be hearing this.<br/><br/>Then it dawns on you... it's a joke!<br/><br/>YES! Someone from Person Of Interest is playing a joke on you. Someone has a speaker planted somewhere and will erupt in joyous laughter when they realize how well their trick worked.<br/><br/>Obviously, you're going to have to let them know you figured it out first. Who will you call first?"); },
"_js_name": "_obj366",
"_types": ["defaultobject"],
"visible": true,
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"givesingle": false,
"drop": true,
"gender": "it",
"article": "it",
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"exitslistprefix": "You can go",
"contentsprefix": "containing",
"description": "",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"usedefaultprefix": true,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_container": false,
"feature_switchable": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} }
};
elementsNameMap["cell phone"] = _obj366;
allObjects.push(_obj366);
objectsNameMap["cell phone"] = _obj366;
_obj367 = {
"elementtype": "object",
"name": "cook book",
"parent": _obj359,
"type": "object",
"look": "On the end table you notice the crock pot cook book given to you by a fan. Man, if only POI fans knew what was happening right now.",
"usestandardverblist": true,
"displayverbs": ["Look at", "Examine closer"],
"feature_usegive": false,
"examinecloser": function() { OutputText ("You pick up the cook book and examine it. <br/><br/>The girl you received it from is a determined fan and enjoys puzzles as much as you do.<br/><br/>\"Whiskey Echo November Delta Yankee\".<br/><br/>As the words continue to reverberate against your ear drum, you have a thought.<br/><br/>Didn't Amanda have a friend at Denver Comic Con? What was her name... was it \"Wendy\"?<br/><br/>Yes! You remember meeting Wendy in Denver, Canada, and San Diego. That's right!<br/><br/>The persistent message comes to a halt and all you hear is traffic from outside. It finally stopped!<br/><br/>But, wait... why did it cease?<br/><br/>Wendy. It has something to do with Wendy.<br/><br/>You're still not sure how to deal with all of this. You aren't even confident that it wasn't just someone messing with you the entire time."); },
"_js_name": "_obj367",
"_types": ["defaultobject"],
"visible": true,
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"use": false,
"givesingle": false,
"drop": true,
"gender": "it",
"article": "it",
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"exitslistprefix": "You can go",
"contentsprefix": "containing",
"description": "",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"usedefaultprefix": true,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_container": false,
"feature_switchable": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} }
};
elementsNameMap["cook book"] = _obj367;
allObjects.push(_obj367);
objectsNameMap["cook book"] = _obj367;
_obj368 = {
"elementtype": "object",
"name": "k15",
"type": "command",
"anonymous": true,
"property": "shake",
"isverb": true,
"pattern": "^shake (?<object>.*)$",
"defaultexpression": "\"You can't shake \" + object.article + \".\"",
"_js_name": "_obj368",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["k15"] = _obj368;
allCommands.push(_obj368);
objectsNameMap["k15"] = _obj368;
_obj369 = {
"elementtype": "object",
"name": "k16",
"type": "command",
"anonymous": true,
"property": "callsarah",
"isverb": true,
"pattern": "^call sarah (?<object>.*)$",
"defaultexpression": "\"You can't call sarah \" + object.article + \".\"",
"_js_name": "_obj369",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["k16"] = _obj369;
allCommands.push(_obj369);
objectsNameMap["k16"] = _obj369;
_obj370 = {
"elementtype": "object",
"name": "k17",
"type": "command",
"anonymous": true,
"property": "calljames",
"isverb": true,
"pattern": "^call james (?<object>.*)$",
"defaultexpression": "\"You can't call james \" + object.article + \".\"",
"_js_name": "_obj370",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["k17"] = _obj370;
allCommands.push(_obj370);
objectsNameMap["k17"] = _obj370;
_obj371 = {
"elementtype": "object",
"name": "k18",
"type": "command",
"anonymous": true,
"property": "callgreg",
"isverb": true,
"pattern": "^call greg (?<object>.*)$",
"defaultexpression": "\"You can't call greg \" + object.article + \".\"",
"_js_name": "_obj371",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["k18"] = _obj371;
allCommands.push(_obj371);
objectsNameMap["k18"] = _obj371;
_obj372 = {
"elementtype": "object",
"name": "k19",
"type": "command",
"anonymous": true,
"property": "calljim",
"isverb": true,
"pattern": "^call jim (?<object>.*)$",
"defaultexpression": "\"You can't call jim \" + object.article + \".\"",
"_js_name": "_obj372",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["k19"] = _obj372;
allCommands.push(_obj372);
objectsNameMap["k19"] = _obj372;
_obj373 = {
"elementtype": "object",
"name": "k20",
"type": "command",
"anonymous": true,
"property": "callmichael",
"isverb": true,
"pattern": "^call michael (?<object>.*)$",
"defaultexpression": "\"You can't call michael \" + object.article + \".\"",
"_js_name": "_obj373",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["k20"] = _obj373;
allCommands.push(_obj373);
objectsNameMap["k20"] = _obj373;
_obj374 = {
"elementtype": "object",
"name": "k21",
"type": "command",
"anonymous": true,
"property": "turnup",
"isverb": true,
"pattern": "^turn up (?<object>.*)$",
"defaultexpression": "\"You can't turn up \" + object.article + \".\"",
"_js_name": "_obj374",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["k21"] = _obj374;
allCommands.push(_obj374);
objectsNameMap["k21"] = _obj374;
_obj375 = {
"elementtype": "object",
"name": "k22",
"type": "command",
"anonymous": true,
"property": "channelup",
"isverb": true,
"pattern": "^channel up (?<object>.*)$",
"defaultexpression": "\"You can't channel up \" + object.article + \".\"",
"_js_name": "_obj375",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["k22"] = _obj375;
allCommands.push(_obj375);
objectsNameMap["k22"] = _obj375;
_obj376 = {
"elementtype": "object",
"name": "k23",
"type": "command",
"anonymous": true,
"property": "channeldown",
"isverb": true,
"pattern": "^channel down (?<object>.*)$",
"defaultexpression": "\"You can't channel down \" + object.article + \".\"",
"_js_name": "_obj376",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["k23"] = _obj376;
allCommands.push(_obj376);
objectsNameMap["k23"] = _obj376;
_obj377 = {
"elementtype": "object",
"name": "k24",
"type": "command",
"anonymous": true,
"property": "examinecloser",
"isverb": true,
"pattern": "^examine closer (?<object>.*)$",
"defaultexpression": "\"You can't examine closer \" + object.article + \".\"",
"_js_name": "_obj377",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["k24"] = _obj377;
allCommands.push(_obj377);
objectsNameMap["k24"] = _obj377;
_obj378 = {
"elementtype": "object",
"name": "Yard",
"type": "object",
"description": "As you step outside, you realize that more time has passed than you originally thought. By the positioning of the sun, it seems to be early afternoon now. Your car is parked out front and there are a few random things on the small patch of grass.",
"exitslistprefix": "You can go to the",
"beforeenter": function() { OutputText ("If you're sure you've made the voices stop, you should move on. If they are still going, you should check all of the items in the living room."); },
"_js_name": "_obj378",
"_types": ["defaultobject"],
"visible": true,
"displayverbs": ["Look at", "Take"],
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"use": false,
"givesingle": false,
"drop": true,
"gender": "it",
"article": "it",
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"contentsprefix": "containing",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"usedefaultprefix": true,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_usegive": false,
"feature_container": false,
"feature_switchable": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} }
};
elementsNameMap["Yard"] = _obj378;
allObjects.push(_obj378);
objectsNameMap["Yard"] = _obj378;
_obj379 = {
"elementtype": "object",
"name": "trash can",
"parent": _obj378,
"type": "object",
"look": "Your trash has been newly emptied by the garbage man this morning. There is nothing left in the can.",
"usestandardverblist": true,
"displayverbs": ["Look at", "Put away"],
"putaway": "You grab the handle of the trash can and roll it back up towards your house. This probably could have waited until later, but at least it's back where it goes!",
"_js_name": "_obj379",
"_types": ["defaultobject"],
"visible": true,
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"use": false,
"givesingle": false,
"drop": true,
"gender": "it",
"article": "it",
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"exitslistprefix": "You can go",
"contentsprefix": "containing",
"description": "",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"usedefaultprefix": true,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_usegive": false,
"feature_container": false,
"feature_switchable": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} }
};
elementsNameMap["trash can"] = _obj379;
allObjects.push(_obj379);
objectsNameMap["trash can"] = _obj379;
_obj380 = {
"elementtype": "object",
"name": "pigeon",
"parent": _obj378,
"type": "object",
"look": "The pigeon is pecking at something on your lawn. It makes a soft \"coo\" as you look closer.",
"usestandardverblist": true,
"displayverbs": ["Look at", "Use", "Dance", "Coo"],
"dance": "You start to dance the dance of life with the pigeon. The pigeon is not receptive.",
"coo": "You \"coo\" softly at the pigeon. It locks eyes with you and says, \"Hello, Amy\".                      Just kidding. It just flies away.",
"feature_usegive": true,
"use": function() { OutputText ("Whoa whoa whoa... what are you going to use that pigeon for?"); },
"_js_name": "_obj380",
"_types": ["defaultobject"],
"visible": true,
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"givesingle": false,
"drop": true,
"gender": "it",
"article": "it",
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"exitslistprefix": "You can go",
"contentsprefix": "containing",
"description": "",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"usedefaultprefix": true,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_container": false,
"feature_switchable": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} }
};
elementsNameMap["pigeon"] = _obj380;
allObjects.push(_obj380);
objectsNameMap["pigeon"] = _obj380;
_obj381 = {
"elementtype": "object",
"name": "k25",
"parent": _obj378,
"type": "exit",
"alias": "Living Room",
"to": _obj359,
"_js_name": "_obj381",
"_types": ["defaultexit"],
"displayverbs": ["Go to"],
"visible": true,
"scenery": false,
"locked": false,
"lockmessage": "That way is locked.",
"lookonly": false,
"runscript": false,
"lightstrength": "",
"grid_length": 1,
"grid_render": false,
"grid_offset_x": 0,
"grid_offset_y": 0
};
elementsNameMap["k25"] = _obj381;
allExits.push(_obj381);
objectsNameMap["k25"] = _obj381;
_obj382 = {
"elementtype": "object",
"name": "k26",
"parent": _obj378,
"type": "exit",
"alias": "Park",
"_js_name": "_obj382",
"_types": ["defaultexit"],
"displayverbs": ["Go to"],
"visible": true,
"scenery": false,
"locked": false,
"lockmessage": "That way is locked.",
"lookonly": false,
"runscript": false,
"lightstrength": "",
"grid_length": 1,
"grid_render": false,
"grid_offset_x": 0,
"grid_offset_y": 0
};
elementsNameMap["k26"] = _obj382;
objectReferences.push(["_obj382", "to", "_obj391"]);
allExits.push(_obj382);
objectsNameMap["k26"] = _obj382;
_obj383 = {
"elementtype": "object",
"name": "livingroomyard",
"parent": _obj378,
"type": "command",
"pattern": "Living Room",
"script": function(parameters) { MoveObject (_obj309, _obj359); },
"_js_name": "_obj383",
"_types": ["defaultcommand"]
};
elementsNameMap["livingroomyard"] = _obj383;
allCommands.push(_obj383);
objectsNameMap["livingroomyard"] = _obj383;
_obj384 = {
"elementtype": "object",
"name": "park",
"parent": _obj378,
"type": "command",
"pattern": "Park",
"script": function(parameters) { MoveObject (_obj309, _obj391); },
"_js_name": "_obj384",
"_types": ["defaultcommand"]
};
elementsNameMap["park"] = _obj384;
allCommands.push(_obj384);
objectsNameMap["park"] = _obj384;
_obj385 = {
"elementtype": "object",
"name": "skateboard",
"parent": _obj378,
"type": "object",
"look": "Sitting on your walkway is a skateboard with a beat up \"Minecraft\" sticker on the back. Jackson must have left it out after playing with it.",
"kick": "You kick the skateboard back towards the house.",
"ride": "You jump onto the skateboard and attempt a sweet ollie.",
"useindividualverblist": true,
"_js_name": "_obj385",
"_types": ["defaultobject"],
"visible": true,
"displayverbs": ["Look at", "Take"],
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"use": false,
"givesingle": false,
"drop": true,
"gender": "it",
"article": "it",
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"exitslistprefix": "You can go",
"contentsprefix": "containing",
"description": "",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"usedefaultprefix": true,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_usegive": false,
"feature_container": false,
"feature_switchable": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} }
};
elementsNameMap["skateboard"] = _obj385;
allObjects.push(_obj385);
objectsNameMap["skateboard"] = _obj385;
_obj386 = {
"elementtype": "object",
"name": "k27",
"type": "command",
"anonymous": true,
"property": "ride",
"isverb": true,
"pattern": "^ride (?<object>.*)$",
"defaultexpression": "\"You can't ride \" + object.article + \".\"",
"_js_name": "_obj386",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["k27"] = _obj386;
allCommands.push(_obj386);
objectsNameMap["k27"] = _obj386;
_obj387 = {
"elementtype": "object",
"name": "k28",
"type": "command",
"anonymous": true,
"property": "kick",
"isverb": true,
"pattern": "^kick (?<object>.*)$",
"defaultexpression": "\"You can't kick \" + object.article + \".\"",
"_js_name": "_obj387",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["k28"] = _obj387;
allCommands.push(_obj387);
objectsNameMap["k28"] = _obj387;
_obj388 = {
"elementtype": "object",
"name": "k29",
"type": "command",
"anonymous": true,
"property": "putaway",
"isverb": true,
"pattern": "^put away (?<object>.*)$",
"defaultexpression": "\"You can't put away \" + object.article + \".\"",
"_js_name": "_obj388",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["k29"] = _obj388;
allCommands.push(_obj388);
objectsNameMap["k29"] = _obj388;
_obj389 = {
"elementtype": "object",
"name": "k30",
"type": "command",
"anonymous": true,
"property": "dance",
"isverb": true,
"pattern": "^dance (?<object>.*)$",
"defaultexpression": "\"You can't dance \" + object.article + \".\"",
"_js_name": "_obj389",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["k30"] = _obj389;
allCommands.push(_obj389);
objectsNameMap["k30"] = _obj389;
_obj390 = {
"elementtype": "object",
"name": "k31",
"type": "command",
"anonymous": true,
"property": "coo",
"isverb": true,
"pattern": "^coo (?<object>.*)$",
"defaultexpression": "\"You can't coo \" + object.article + \".\"",
"_js_name": "_obj390",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["k31"] = _obj390;
allCommands.push(_obj390);
objectsNameMap["k31"] = _obj390;
_obj391 = {
"elementtype": "object",
"name": "Park",
"type": "object",
"description": "The park is pretty empty this afternoon. It's a nice change from the usual hustle and bustle of Brooklyn. There is a circle of trees surrounding numerous white benches.",
"exitslistprefix": "You can go to the",
"beforefirstenter": function() { OutputText ("You decide to drive and meet Michael at the park."); },
"_js_name": "_obj391",
"_types": ["defaultobject"],
"visible": true,
"displayverbs": ["Look at", "Take"],
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"use": false,
"givesingle": false,
"drop": true,
"gender": "it",
"article": "it",
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"contentsprefix": "containing",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"usedefaultprefix": true,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_usegive": false,
"feature_container": false,
"feature_switchable": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} }
};
elementsNameMap["Park"] = _obj391;
allObjects.push(_obj391);
objectsNameMap["Park"] = _obj391;
_obj392 = {
"elementtype": "object",
"name": "AskHim",
"parent": _obj391,
"type": "command",
"pattern": "Ask",
"script": function(parameters) { OutputText ("You are undeniably curious about what is going on with Michael, so you ask him to elaborate what he means.<br/><br/>\"When I woke up this morning, my laptop was playing a message over and over. I knew the voice... I recognized it from Person of Interest. I turned off my laptop and could hear it again... this time through my television. Every time I try to get away from it, I just hear the same thing...\"<br/><br/>\"Whiskey Echo November Delta Yankee\"<br/><br/>\"Yes! How in the world did you know that?\"<br/><br/>Well, I guess it's your turn to tell your tale."); },
"_js_name": "_obj392",
"_types": ["defaultcommand"]
};
elementsNameMap["AskHim"] = _obj392;
allCommands.push(_obj392);
objectsNameMap["AskHim"] = _obj392;
_obj393 = {
"elementtype": "object",
"name": "AskHim2",
"parent": _obj391,
"type": "command",
"pattern": "Ask him",
"script": function(parameters) { OutputText ("You are undeniably curious about what is going on with Michael, so you ask him to elaborate what he means.<br/><br/>\"When I woke up this morning, my laptop was playing a message over and over. I knew the voice... I recognized it from Person of Interest. I turned off my laptop and could hear it again... this time through my television. Every time I try to get away from it, I just hear the same thing...\"<br/><br/>\"Whiskey Echo November Delta Yankee\"<br/><br/>\"Yes! How in the world did you know that?\"<br/><br/>Well, I guess it's your turn to tell your tale."); },
"_js_name": "_obj393",
"_types": ["defaultcommand"]
};
elementsNameMap["AskHim2"] = _obj393;
allCommands.push(_obj393);
objectsNameMap["AskHim2"] = _obj393;
_obj394 = {
"elementtype": "object",
"name": "AskHim3",
"parent": _obj391,
"type": "command",
"pattern": "Ask Michael",
"script": function(parameters) { OutputText ("You are undeniably curious about what is going on with Michael, so you ask him to elaborate what he means.<br/><br/>\"When I woke up this morning, my laptop was playing a message over and over. I knew the voice... I recognized it from Person of Interest. I turned off my laptop and could hear it again... this time through my television. Every time I try to get away from it, I just hear the same thing...\"<br/><br/>\"Whiskey Echo November Delta Yankee\"<br/><br/>\"Yes! How in the world did you know that?\"<br/><br/>Well, I guess it's your turn to tell your tale."); },
"_js_name": "_obj394",
"_types": ["defaultcommand"]
};
elementsNameMap["AskHim3"] = _obj394;
allCommands.push(_obj394);
objectsNameMap["AskHim3"] = _obj394;
_obj395 = {
"elementtype": "object",
"name": "TellHim",
"parent": _obj391,
"type": "command",
"pattern": "Tell",
"script": function(parameters) { OutputText ("You regain your composure and tell Michael everything that has happened to you. You recall how you were hearing the voice until you thought of one of your fans.<br/><br/>Michael seems to be deep into thought.<br/><br/>\"Do you think this could really be happening to us? Is... 'The Machine' trying to communicate with us? If it is.. what does it want us to do?\"<br/><br/>You contemplate the final question. You had never accepted that this may be reality, so you didn't even consider what this artificial intelligence could want with you.<br/><br/>You both continue to talk about this and realize that it would be best to go to Michael's house and try to figure things out further."); },
"_js_name": "_obj395",
"_types": ["defaultcommand"]
};
elementsNameMap["TellHim"] = _obj395;
allCommands.push(_obj395);
objectsNameMap["TellHim"] = _obj395;
_obj396 = {
"elementtype": "object",
"name": "TellHim2",
"parent": _obj391,
"type": "command",
"pattern": "Tell him",
"script": function(parameters) { OutputText ("You regain your composure and tell Michael everything that has happened to you. You recall how you were hearing the voice until you thought of one of your fans.<br/><br/>Michael seems to be deep into thought.<br/><br/>\"Do you think this could really be happening to us? Is... \"The Machine\" trying to communicate with us? If it is.. what does it want us to do?\"<br/><br/>You contemplate the final question. You had never accepted that this may be reality, so you didn't even consider what this artificial intelligence could want with you.<br/><br/>You both continue to talk about this and realize that it would be best to go to Michael's house and try to figure things out further."); },
"_js_name": "_obj396",
"_types": ["defaultcommand"]
};
elementsNameMap["TellHim2"] = _obj396;
allCommands.push(_obj396);
objectsNameMap["TellHim2"] = _obj396;
_obj397 = {
"elementtype": "object",
"name": "TellHim3",
"parent": _obj391,
"type": "command",
"pattern": "Tell Michael",
"script": function(parameters) { OutputText ("You regain your composure and tell Michael everything that has happened to you. You recall how you were hearing the voice until you thought of one of your fans.<br/><br/>Michael seems to be deep into thought.<br/><br/>\"Do you think this could really be happening to us? Is... \"The Machine\" trying to communicate with us? If it is.. what does it want us to do?\"<br/><br/>You contemplate the final question. You had never accepted that this may be reality, so you didn't even consider what this artificial intelligence could want with you.<br/><br/>You both continue to talk about this and realize that it would be best to go to Michael's house and try to figure things out further."); },
"_js_name": "_obj397",
"_types": ["defaultcommand"]
};
elementsNameMap["TellHim3"] = _obj397;
allCommands.push(_obj397);
objectsNameMap["TellHim3"] = _obj397;
_obj398 = {
"elementtype": "object",
"name": "TellHim4",
"parent": _obj391,
"type": "command",
"pattern": "Tell him about your experience",
"script": function(parameters) { OutputText ("You regain your composure and tell Michael everything that has happened to you. You recall how you were hearing the voice until you thought of one of your fans.<br/><br/>Michael seems to be deep into thought.<br/><br/>\"Do you think this could really be happening to us? Is... \"The Machine\" trying to communicate with us? If it is.. what does it want us to do?\"<br/><br/>You contemplate the final question. You had never accepted that this may be reality, so you didn't even consider what this artificial intelligence could want with you.<br/><br/>You both continue to talk about this and realize that it would be best to go to Michael's house and try to figure things out further."); },
"_js_name": "_obj398",
"_types": ["defaultcommand"]
};
elementsNameMap["TellHim4"] = _obj398;
allCommands.push(_obj398);
objectsNameMap["TellHim4"] = _obj398;
_obj399 = {
"elementtype": "object",
"name": "empty bench",
"parent": _obj391,
"type": "object",
"look": "The bench is totally empty... but it's also not anywhere close to where Michael is sitting.",
"displayverbs": ["Look at", "Sit on"],
"usestandardverblist": true,
"feature_usegive": false,
"sit": "You have a seat on the empty bench. From across the park, Michael looks at you with great confusion. He looks like he really wants to talk to you.",
"_js_name": "_obj399",
"_types": ["defaultobject"],
"visible": true,
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"use": false,
"givesingle": false,
"drop": true,
"gender": "it",
"article": "it",
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"exitslistprefix": "You can go",
"contentsprefix": "containing",
"description": "",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"usedefaultprefix": true,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_container": false,
"feature_switchable": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} }
};
elementsNameMap["empty bench"] = _obj399;
allObjects.push(_obj399);
objectsNameMap["empty bench"] = _obj399;
_obj400 = {
"elementtype": "object",
"name": "crooked tree",
"parent": _obj391,
"type": "object",
"look": "It's clear that this tree has been here for many years, but you don't think it will help with The Machine. Michael is waving you over from a bench nearby.",
"displayverbs": ["Look at", "Use", "Hug", "Climb"],
"usestandardverblist": true,
"hug": "Trees need love, too! Michael officially thinks you are insane.",
"climb": "You start to scale the branches until you're at the very top of the strange tree. This is bananas! Time to get down before you get hurt.",
"feature_usegive": true,
"use": function() { OutputText ("Maybe you shouldn't use that tree, it looks like it's been through a lot already."); },
"_js_name": "_obj400",
"_types": ["defaultobject"],
"visible": true,
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"givesingle": false,
"drop": true,
"gender": "it",
"article": "it",
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"exitslistprefix": "You can go",
"contentsprefix": "containing",
"description": "",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"usedefaultprefix": true,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_container": false,
"feature_switchable": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} }
};
elementsNameMap["crooked tree"] = _obj400;
allObjects.push(_obj400);
objectsNameMap["crooked tree"] = _obj400;
_obj401 = {
"elementtype": "object",
"name": "k32",
"parent": _obj391,
"type": "exit",
"alias": "Yard",
"to": _obj378,
"_js_name": "_obj401",
"_types": ["defaultexit"],
"displayverbs": ["Go to"],
"visible": true,
"scenery": false,
"locked": false,
"lockmessage": "That way is locked.",
"lookonly": false,
"runscript": false,
"lightstrength": "",
"grid_length": 1,
"grid_render": false,
"grid_offset_x": 0,
"grid_offset_y": 0
};
elementsNameMap["k32"] = _obj401;
allExits.push(_obj401);
objectsNameMap["k32"] = _obj401;
_obj402 = {
"elementtype": "object",
"name": "k33",
"parent": _obj391,
"type": "exit",
"alias": "Michaels Office",
"prefix": "",
"_js_name": "_obj402",
"_types": ["defaultexit"],
"displayverbs": ["Go to"],
"visible": true,
"scenery": false,
"locked": false,
"lockmessage": "That way is locked.",
"lookonly": false,
"runscript": false,
"lightstrength": "",
"grid_length": 1,
"grid_render": false,
"grid_offset_x": 0,
"grid_offset_y": 0
};
elementsNameMap["k33"] = _obj402;
objectReferences.push(["_obj402", "to", "_obj409"]);
allExits.push(_obj402);
objectsNameMap["k33"] = _obj402;
_obj403 = {
"elementtype": "object",
"name": "yardpark",
"parent": _obj391,
"type": "command",
"pattern": "Yard",
"script": function(parameters) { MoveObject (_obj309, _obj378); },
"_js_name": "_obj403",
"_types": ["defaultcommand"]
};
elementsNameMap["yardpark"] = _obj403;
allCommands.push(_obj403);
objectsNameMap["yardpark"] = _obj403;
_obj404 = {
"elementtype": "object",
"name": "micheaelshouse",
"parent": _obj391,
"type": "command",
"pattern": "Michaels House Office",
"script": function(parameters) { MoveObject (_obj309, _obj409); },
"_js_name": "_obj404",
"_types": ["defaultcommand"]
};
elementsNameMap["micheaelshouse"] = _obj404;
allCommands.push(_obj404);
objectsNameMap["micheaelshouse"] = _obj404;
_obj405 = {
"elementtype": "object",
"name": "Michael",
"parent": _obj391,
"type": "object",
"usedefaultprefix": false,
"look": "Michael is sitting on one of the benches and he seems incredibly anxious. He looks like he really needs to talk.",
"usestandardverblist": true,
"displayverbs": ["Look at", "Wave at", "Speak to"],
"waveat": "You grin like a maniac and wave across the park at Michael. He waves back and motions for you to come over.",
"speak": function() { OutputText ("You walk up and sit down next to Michael. You ask him how he's doing. <br/><br/>\"Amy, I don't even know how to say this... I think... I think I've heard 'The Machine'.\"<br/><br/>Your heart stops for a second. <br/><br/>\"When I say this, I don't mean that this happened on set or during filming. I can't believe I'm about to say this... but... but I think a real life Machine is trying to communicate with me.\" <br/><br/>You are in disbelief. You don't even know where to begin or how to respond. <br/><br/>Should you tell him about your experience or ask him more about his?"); },
"ask": {"ask him experience": function() { OutputText ("You are undeniably curious about what is going on with Michael, so you ask him to elaborate what he means.<br/><br/>\"When I woke up this morning, my laptop was playing a message over and over. I knew the voice... I recognized it from Person of Interest. I turned off my laptop and could hear it again... this time through my television. Every time I try to get away from it, I just hear the same thing...\"<br/><br/>\"Whiskey Echo November Delta Yankee\"<br/><br/>\"Yes! How in the world did you know that?\"<br/><br/>Well, I guess it's your turn to tell your tale."); } },
"tell": {"tell him tale experience": function() { OutputText ("You regain your composure and tell Michael everything that has happened to you. You recall how you were hearing the voice until you thought of one of your fans.<br/><br/>Michael seems to be deep into thought.<br/><br/>\"Do you think this could really be happening to us? Is... \"The Machine\" trying to communicate with us? If it is.. what does it want us to do?\"<br/><br/>You contemplate the final question. You had never accepted that this may be reality, so you didn't even consider what this artificial intelligence could want with you.<br/><br/>You both continue to talk about this and realize that it would be best to go to Michael's house and try to figure things out further."); } },
"_js_name": "_obj405",
"_types": ["namedmale", "defaultobject"],
"gender": "he",
"article": "him",
"visible": true,
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"use": false,
"givesingle": false,
"drop": true,
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"exitslistprefix": "You can go",
"contentsprefix": "containing",
"description": "",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_usegive": false,
"feature_container": false,
"feature_switchable": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} }
};
elementsNameMap["Michael"] = _obj405;
allObjects.push(_obj405);
objectsNameMap["Michael"] = _obj405;
_obj406 = {
"elementtype": "object",
"name": "officepark",
"parent": _obj391,
"type": "command",
"pattern": "Office",
"script": function(parameters) { MoveObject (_obj309, _obj409); },
"_js_name": "_obj406",
"_types": ["defaultcommand"]
};
elementsNameMap["officepark"] = _obj406;
allCommands.push(_obj406);
objectsNameMap["officepark"] = _obj406;
_obj407 = {
"elementtype": "object",
"name": "k34",
"type": "command",
"anonymous": true,
"property": "waveat",
"isverb": true,
"pattern": "^wave at (?<object>.*)$",
"defaultexpression": "\"You can't wave at \" + object.article + \".\"",
"_js_name": "_obj407",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["k34"] = _obj407;
allCommands.push(_obj407);
objectsNameMap["k34"] = _obj407;
_obj408 = {
"elementtype": "object",
"name": "k35",
"type": "command",
"anonymous": true,
"property": "hug",
"isverb": true,
"pattern": "^hug (?<object>.*)$",
"defaultexpression": "\"You can't hug \" + object.article + \".\"",
"_js_name": "_obj408",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["k35"] = _obj408;
allCommands.push(_obj408);
objectsNameMap["k35"] = _obj408;
_obj409 = {
"elementtype": "object",
"name": "Office at Michaels House",
"type": "object",
"description": "Michael's office is neat and the walls are lined with certificates and art work.",
"exitslistprefix": "You can go to the",
"_js_name": "_obj409",
"_types": ["defaultobject"],
"visible": true,
"displayverbs": ["Look at", "Take"],
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"use": false,
"givesingle": false,
"drop": true,
"gender": "it",
"article": "it",
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"contentsprefix": "containing",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"usedefaultprefix": true,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_usegive": false,
"feature_container": false,
"feature_switchable": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} }
};
elementsNameMap["Office at Michaels House"] = _obj409;
allObjects.push(_obj409);
objectsNameMap["Office at Michaels House"] = _obj409;
_obj410 = {
"elementtype": "object",
"name": "k36",
"parent": _obj409,
"type": "exit",
"alias": "Park",
"to": _obj391,
"_js_name": "_obj410",
"_types": ["defaultexit"],
"displayverbs": ["Go to"],
"visible": true,
"scenery": false,
"locked": false,
"lockmessage": "That way is locked.",
"lookonly": false,
"runscript": false,
"lightstrength": "",
"grid_length": 1,
"grid_render": false,
"grid_offset_x": 0,
"grid_offset_y": 0
};
elementsNameMap["k36"] = _obj410;
allExits.push(_obj410);
objectsNameMap["k36"] = _obj410;
_obj411 = {
"elementtype": "object",
"name": "photo on desk",
"parent": _obj409,
"type": "object",
"useindividualverblist": true,
"look": function() { picture ("rsz_emersonfamily.jpg"); },
"shake": function() { OutputText ("\"Amy... why are you shaking my photograph?!?\" <br/><br/>Michael stares at you with a mixture of frustration and confusion. Better get back to investigating."); },
"_js_name": "_obj411",
"_types": ["defaultobject"],
"visible": true,
"displayverbs": ["Look at", "Take"],
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"use": false,
"givesingle": false,
"drop": true,
"gender": "it",
"article": "it",
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"exitslistprefix": "You can go",
"contentsprefix": "containing",
"description": "",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"usedefaultprefix": true,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_usegive": false,
"feature_container": false,
"feature_switchable": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} }
};
elementsNameMap["photo on desk"] = _obj411;
allObjects.push(_obj411);
objectsNameMap["photo on desk"] = _obj411;
_obj412 = {
"elementtype": "object",
"name": "photo on wall",
"parent": _obj409,
"type": "object",
"useindividualverblist": true,
"look": function() { picture ("rsz_emersons_02_0.jpg"); },
"smack": function() { OutputText ("You smack the photo off the wall and it breaks into pieces on the floor. You immediately regret your decision and wonder why you did that... you slowly lift the rug and scoot the shards underneath."); },
"_js_name": "_obj412",
"_types": ["defaultobject"],
"visible": true,
"displayverbs": ["Look at", "Take"],
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"use": false,
"givesingle": false,
"drop": true,
"gender": "it",
"article": "it",
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"exitslistprefix": "You can go",
"contentsprefix": "containing",
"description": "",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"usedefaultprefix": true,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_usegive": false,
"feature_container": false,
"feature_switchable": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} }
};
elementsNameMap["photo on wall"] = _obj412;
allObjects.push(_obj412);
objectsNameMap["photo on wall"] = _obj412;
_obj413 = {
"elementtype": "object",
"name": "Emmy",
"parent": _obj409,
"type": "object",
"thankfans": "With a sense of pride, you lift the Emmy in the air and imagine a crowd cheering you on... \"AMY AMY AMY AMY!\". The sound of Michael clearing his throat brings you back to reality.",
"useindividualverblist": true,
"shine": "You grab your sleeve and shine the outside of the Emmy. You can see your reflection and get lost in it for a moment... or two.... what were you doing again?",
"look": "Michael proudly displays his Emmy from the series \"Lost\".",
"_js_name": "_obj413",
"_types": ["defaultobject"],
"visible": true,
"displayverbs": ["Look at", "Take"],
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"use": false,
"givesingle": false,
"drop": true,
"gender": "it",
"article": "it",
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"exitslistprefix": "You can go",
"contentsprefix": "containing",
"description": "",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"usedefaultprefix": true,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_usegive": false,
"feature_container": false,
"feature_switchable": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} }
};
elementsNameMap["Emmy"] = _obj413;
allObjects.push(_obj413);
objectsNameMap["Emmy"] = _obj413;
_obj414 = {
"elementtype": "object",
"name": "parkoffice",
"parent": _obj409,
"type": "command",
"pattern": "Park",
"script": function(parameters) { MoveObject (_obj309, _obj391); },
"_js_name": "_obj414",
"_types": ["defaultcommand"]
};
elementsNameMap["parkoffice"] = _obj414;
allCommands.push(_obj414);
objectsNameMap["parkoffice"] = _obj414;
_obj415 = {
"elementtype": "object",
"name": "michealslivingroom",
"parent": _obj409,
"type": "command",
"pattern": "Living Room",
"script": function(parameters) { if (!(IsSwitchedOn(_obj417))) {
MoveObject (_obj309, _obj425);
}
else {
MoveObject (_obj309, _obj409);
OutputText ("You feel like there is something you may have missed in the office.");
} },
"_js_name": "_obj415",
"_types": ["defaultcommand"]
};
elementsNameMap["michealslivingroom"] = _obj415;
allCommands.push(_obj415);
objectsNameMap["michealslivingroom"] = _obj415;
_obj416 = {
"elementtype": "object",
"name": "turn off",
"parent": _obj409,
"type": "command",
"pattern": "Turn Off",
"script": function(parameters) { if (!(IsSwitchedOn(_obj417))) {
OutputText ("Suddenly, the page for a Texas based television station pops up on the screen. You navigate around a bit and find an \"employee\" page. EUREKA! One of the photos on the page is Wendy! It still doesn't list her last name, though. You hear the television come on in the living room.<br/><br/>Perhaps you should head towards the commotion.<br/><br/>");
picture ("WendyWork.jpg");
} },
"_js_name": "_obj416",
"_types": ["defaultcommand"]
};
elementsNameMap["turn off"] = _obj416;
allCommands.push(_obj416);
objectsNameMap["turn off"] = _obj416;
_obj417 = {
"elementtype": "object",
"name": "laptop",
"parent": _obj409,
"type": "object",
"displayverbs": ["Turn On", "Look", "Social Media", "Play Game", "Search Google", "Turn Off"],
"usestandardverblist": true,
"turnon": "You press the \"power\" button and Michael's laptop boots up.",
"useindividualverblist": false,
"feature_switchable": false,
"look": function() { OutputText ("Michael's laptop is a bit older and looks like it has been used for years."); },
"socialmedia": function() { OutputText ("You do some browsing on social media. Wait! You just remembered that Wendy is from Texas. Unfortunately, so are about 5,000 other \"Wendys\"."); },
"playgame": function() { OutputText ("You start to play the solitaire game on Michael's computer. Within minutes, you have no moves left. Maybe you should focus on the \"Wendy\" situation."); },
"searchgoogle": function() { OutputText ("You do a search for \"Wendy\". Not surprisingly, only the fast food chain and some other random people came up."); },
"turnoff": function() { OutputText ("You are beyond frustrated, so you decide to turn off the laptop. You hit the power button and it whirs to a halt."); },
"_js_name": "_obj417",
"_types": ["switchable", "defaultobject"],
"switchedon": false,
"visible": true,
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"use": false,
"givesingle": false,
"drop": true,
"gender": "it",
"article": "it",
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"exitslistprefix": "You can go",
"contentsprefix": "containing",
"description": "",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"usedefaultprefix": true,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_usegive": false,
"feature_container": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} }
};
elementsNameMap["laptop"] = _obj417;
allObjects.push(_obj417);
objectsNameMap["laptop"] = _obj417;
_obj418 = {
"elementtype": "object",
"name": "Living Room at Michaels",
"parent": _obj409,
"type": "exit",
"alias": "Michaels Living Room",
"runscript": false,
"lookonly": false,
"locked": true,
"script": function() { if (!(IsSwitchedOn(_obj417))) {
MoveObject (_obj309, _obj425);
}
else {
OutputText ("You feel like there is something you may have missed in the office.");
MoveObject (_obj309, _obj409);
} },
"_js_name": "_obj418",
"_types": ["defaultexit"],
"displayverbs": ["Go to"],
"visible": true,
"scenery": false,
"lockmessage": "That way is locked.",
"lightstrength": "",
"grid_length": 1,
"grid_render": false,
"grid_offset_x": 0,
"grid_offset_y": 0
};
elementsNameMap["Living Room at Michaels"] = _obj418;
objectReferences.push(["_obj418", "to", "_obj425"]);
allExits.push(_obj418);
objectsNameMap["Living Room at Michaels"] = _obj418;
_obj419 = {
"elementtype": "object",
"name": "k37",
"type": "command",
"anonymous": true,
"property": "searchgoogle",
"isverb": true,
"pattern": "^search google (?<object>.*)$",
"defaultexpression": "\"You can't search google \" + object.article + \".\"",
"_js_name": "_obj419",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["k37"] = _obj419;
allCommands.push(_obj419);
objectsNameMap["k37"] = _obj419;
_obj420 = {
"elementtype": "object",
"name": "k38",
"type": "command",
"anonymous": true,
"property": "socialmedia",
"isverb": true,
"pattern": "^social media (?<object>.*)$",
"defaultexpression": "\"You can't social media \" + object.article + \".\"",
"_js_name": "_obj420",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["k38"] = _obj420;
allCommands.push(_obj420);
objectsNameMap["k38"] = _obj420;
_obj421 = {
"elementtype": "object",
"name": "k39",
"type": "command",
"anonymous": true,
"property": "playgame",
"isverb": true,
"pattern": "^play game (?<object>.*)$",
"defaultexpression": "\"You can't play game \" + object.article + \".\"",
"_js_name": "_obj421",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["k39"] = _obj421;
allCommands.push(_obj421);
objectsNameMap["k39"] = _obj421;
_obj422 = {
"elementtype": "object",
"name": "k40",
"type": "command",
"anonymous": true,
"property": "smack",
"isverb": true,
"pattern": "^smack (?<object>.*)$",
"defaultexpression": "\"You can't smack \" + object.article + \".\"",
"_js_name": "_obj422",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["k40"] = _obj422;
allCommands.push(_obj422);
objectsNameMap["k40"] = _obj422;
_obj423 = {
"elementtype": "object",
"name": "k41",
"type": "command",
"anonymous": true,
"property": "thankyourfans",
"isverb": true,
"pattern": "^thank your fans (?<object>.*)$",
"defaultexpression": "\"You can't thank your fans \" + object.article + \".\"",
"_js_name": "_obj423",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["k41"] = _obj423;
allCommands.push(_obj423);
objectsNameMap["k41"] = _obj423;
_obj424 = {
"elementtype": "object",
"name": "k42",
"type": "command",
"anonymous": true,
"property": "shine",
"isverb": true,
"pattern": "^shine (?<object>.*)$",
"defaultexpression": "\"You can't shine \" + object.article + \".\"",
"_js_name": "_obj424",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["k42"] = _obj424;
allCommands.push(_obj424);
objectsNameMap["k42"] = _obj424;
_obj425 = {
"elementtype": "object",
"name": "Michaels Living Room",
"type": "object",
"exitslistprefix": "You can go to the",
"description": "Michael's living room is contemporary and stylish. It is simple but elegant at the same time.",
"beforeenter": function() { OutputText ("Did you find all of the clues the laptop had to offer?"); },
"onexit": function() { playsound ("KristinMachineFinal.wav", false, false); },
"_js_name": "_obj425",
"_types": ["defaultobject"],
"visible": true,
"displayverbs": ["Look at", "Take"],
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"use": false,
"givesingle": false,
"drop": true,
"gender": "it",
"article": "it",
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"contentsprefix": "containing",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"usedefaultprefix": true,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_usegive": false,
"feature_container": false,
"feature_switchable": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} }
};
elementsNameMap["Michaels Living Room"] = _obj425;
allObjects.push(_obj425);
objectsNameMap["Michaels Living Room"] = _obj425;
_obj426 = {
"elementtype": "object",
"name": "pillow",
"parent": _obj425,
"type": "object",
"look": "There is a decorative pillow on Michael's couch.",
"useindividualverblist": true,
"fluff": "You lift the pillow and fluff it. After all, a full pillow is what's truly important here.",
"laydown": function() { OutputText ("You swing your legs up and lay your head on the pillow. <br/><br/>\"Amy, what are you doing?!\"<br/><br/>Michael startles you awake. Now's not the time for naps."); },
"_js_name": "_obj426",
"_types": ["defaultobject"],
"visible": true,
"displayverbs": ["Look at", "Take"],
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"use": false,
"givesingle": false,
"drop": true,
"gender": "it",
"article": "it",
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"exitslistprefix": "You can go",
"contentsprefix": "containing",
"description": "",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"usedefaultprefix": true,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_usegive": false,
"feature_container": false,
"feature_switchable": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} }
};
elementsNameMap["pillow"] = _obj426;
allObjects.push(_obj426);
objectsNameMap["pillow"] = _obj426;
_obj427 = {
"elementtype": "object",
"name": "end table",
"parent": _obj425,
"type": "object",
"look": "The end table is square with a couple of knick knacks on it.",
"lean": "You walk over and lean against the end table. This didn't accomplish anything, but you sure look cool.",
"hide": "You sneak over and crouch underneath the end table. Unfortunately, you can't hide from the issue at hand.",
"useindividualverblist": true,
"_js_name": "_obj427",
"_types": ["defaultobject"],
"visible": true,
"displayverbs": ["Look at", "Take"],
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"use": false,
"givesingle": false,
"drop": true,
"gender": "it",
"article": "it",
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"exitslistprefix": "You can go",
"contentsprefix": "containing",
"description": "",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"usedefaultprefix": true,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_usegive": false,
"feature_container": false,
"feature_switchable": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} }
};
elementsNameMap["end table"] = _obj427;
allObjects.push(_obj427);
objectsNameMap["end table"] = _obj427;
_obj428 = {
"elementtype": "object",
"name": "Michaels TV",
"parent": _obj425,
"type": "object",
"look": "The television has turned itself on and is airing news footage from a new wine and art class in Dallas.",
"channelup": "Amazingly the same thing is airing on this channel. What is going on??",
"channeldown": "It's the same thing that was originally on, but from a different angle. It seems to be on EVERY station.",
"useindividualverblist": true,
"examinemoreclosely": function() { OutputText ("Clearly, there must be something to this footage. You step up next to the television and look at it with great attention. Wait a second... you recognize someone in the crowd. It's Wendy!! The screen begins to glitch and, over her head you see the words, \"Hello Amy\" pop up.<br/><br/>Yes, you are about to talk to a television. \"Ummm... Hello Wendy?\". To your astonishment, every screen in Michael's house beings to play a message!<br/><br/>");
ShowYouTube ("kWjvaK0nYk8");
OutputText ("<br/><br/><br/><br/>Out of nowhere, you hear The Machine speaking to you again. Michael gets a slight smirk as it begins it's code; <br/><br/>\"Kilo Romeo India Sierra Tango India November.\"<br/><br/>Here we go again!");
OutputText ("\"I can't believe it's happening again!\" you cover your ears as you speak to Michael.<br/><br/>\"You hear it again?\" he questions. <br/><br/>Apparently, he's not hearing it anymore. How can you be hearing this?! Now you're starting to wonder if you really do somehow have a cochlear implant...<br/><br/>After a short discussion, you both agree that there must be a reason that Michael isn't receiving the message. You decide that you should look further into this.<br/><br/>You aren't sure where to go next. Maybe you should go outside to get some fresh air."); },
"_js_name": "_obj428",
"_types": ["defaultobject"],
"visible": true,
"displayverbs": ["Look at", "Take"],
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"use": false,
"givesingle": false,
"drop": true,
"gender": "it",
"article": "it",
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"exitslistprefix": "You can go",
"contentsprefix": "containing",
"description": "",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"usedefaultprefix": true,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_usegive": false,
"feature_container": false,
"feature_switchable": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} }
};
elementsNameMap["Michaels TV"] = _obj428;
allObjects.push(_obj428);
objectsNameMap["Michaels TV"] = _obj428;
_obj429 = {
"elementtype": "object",
"name": "k43",
"parent": _obj425,
"type": "exit",
"alias": "Michaels Office",
"to": _obj409,
"_js_name": "_obj429",
"_types": ["defaultexit"],
"displayverbs": ["Go to"],
"visible": true,
"scenery": false,
"locked": false,
"lockmessage": "That way is locked.",
"lookonly": false,
"runscript": false,
"lightstrength": "",
"grid_length": 1,
"grid_render": false,
"grid_offset_x": 0,
"grid_offset_y": 0
};
elementsNameMap["k43"] = _obj429;
allExits.push(_obj429);
objectsNameMap["k43"] = _obj429;
_obj430 = {
"elementtype": "object",
"name": "k44",
"parent": _obj425,
"type": "exit",
"alias": "outside",
"_js_name": "_obj430",
"_types": ["defaultexit"],
"displayverbs": ["Go to"],
"visible": true,
"scenery": false,
"locked": false,
"lockmessage": "That way is locked.",
"lookonly": false,
"runscript": false,
"lightstrength": "",
"grid_length": 1,
"grid_render": false,
"grid_offset_x": 0,
"grid_offset_y": 0
};
elementsNameMap["k44"] = _obj430;
objectReferences.push(["_obj430", "to", "_obj437"]);
allExits.push(_obj430);
objectsNameMap["k44"] = _obj430;
_obj431 = {
"elementtype": "object",
"name": "k45",
"type": "command",
"anonymous": true,
"property": "examinemoreclosely",
"isverb": true,
"pattern": "^examine more closely (?<object>.*)$",
"defaultexpression": "\"You can't examine more closely \" + object.article + \".\"",
"_js_name": "_obj431",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["k45"] = _obj431;
allCommands.push(_obj431);
objectsNameMap["k45"] = _obj431;
_obj432 = {
"elementtype": "object",
"name": "k46",
"type": "command",
"anonymous": true,
"property": "thankfans",
"isverb": true,
"pattern": "^thank fans (?<object>.*)$",
"defaultexpression": "\"You can't thank fans \" + object.article + \".\"",
"_js_name": "_obj432",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["k46"] = _obj432;
allCommands.push(_obj432);
objectsNameMap["k46"] = _obj432;
_obj433 = {
"elementtype": "object",
"name": "k47",
"type": "command",
"anonymous": true,
"property": "laydown",
"isverb": true,
"pattern": "^lay down (?<object>.*)$",
"defaultexpression": "\"You can't lay down \" + object.article + \".\"",
"_js_name": "_obj433",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["k47"] = _obj433;
allCommands.push(_obj433);
objectsNameMap["k47"] = _obj433;
_obj434 = {
"elementtype": "object",
"name": "k48",
"type": "command",
"anonymous": true,
"property": "fluff",
"isverb": true,
"pattern": "^fluff (?<object>.*)$",
"defaultexpression": "\"You can't fluff \" + object.article + \".\"",
"_js_name": "_obj434",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["k48"] = _obj434;
allCommands.push(_obj434);
objectsNameMap["k48"] = _obj434;
_obj435 = {
"elementtype": "object",
"name": "k49",
"type": "command",
"anonymous": true,
"property": "lean",
"isverb": true,
"pattern": "^lean (?<object>.*)$",
"defaultexpression": "\"You can't lean \" + object.article + \".\"",
"_js_name": "_obj435",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["k49"] = _obj435;
allCommands.push(_obj435);
objectsNameMap["k49"] = _obj435;
_obj436 = {
"elementtype": "object",
"name": "k50",
"type": "command",
"anonymous": true,
"property": "hide",
"isverb": true,
"pattern": "^hide (?<object>.*)$",
"defaultexpression": "\"You can't hide \" + object.article + \".\"",
"_js_name": "_obj436",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["k50"] = _obj436;
allCommands.push(_obj436);
objectsNameMap["k50"] = _obj436;
_obj437 = {
"elementtype": "object",
"name": "Outside of Michaels",
"type": "object",
"description": "Michael lives in an urban area, so there's a lot of background noise and commotion around his home.",
"onexit": function() { playsound ("MariMachineFinal.wav", false, false); },
"_js_name": "_obj437",
"_types": ["defaultobject"],
"visible": true,
"displayverbs": ["Look at", "Take"],
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"use": false,
"givesingle": false,
"drop": true,
"gender": "it",
"article": "it",
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"exitslistprefix": "You can go",
"contentsprefix": "containing",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"usedefaultprefix": true,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_usegive": false,
"feature_container": false,
"feature_switchable": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} }
};
elementsNameMap["Outside of Michaels"] = _obj437;
allObjects.push(_obj437);
objectsNameMap["Outside of Michaels"] = _obj437;
_obj438 = {
"elementtype": "object",
"name": "k51",
"parent": _obj437,
"type": "exit",
"alias": "Living Room at Michaels",
"to": _obj425,
"_js_name": "_obj438",
"_types": ["defaultexit"],
"displayverbs": ["Go to"],
"visible": true,
"scenery": false,
"locked": false,
"lockmessage": "That way is locked.",
"lookonly": false,
"runscript": false,
"lightstrength": "",
"grid_length": 1,
"grid_render": false,
"grid_offset_x": 0,
"grid_offset_y": 0
};
elementsNameMap["k51"] = _obj438;
allExits.push(_obj438);
objectsNameMap["k51"] = _obj438;
_obj439 = {
"elementtype": "object",
"name": "garden hose",
"parent": _obj437,
"type": "object",
"useindividualverblist": true,
"look": "Outside of Michael's home sits a garden hose next to a small flower garden.",
"drink": "You walk over to the garden hose, turn it on and take a drink. Though there's something nostalgic about the taste of hose water, you need to focus on The Machine's message.",
"playsnake": "You slowly creep up to the garden hose and pretend it's a snake. Within minutes, you are completely wrapped up with the beast... but the voice hasn't stopped. Time to stop playing pretend?",
"_js_name": "_obj439",
"_types": ["defaultobject"],
"visible": true,
"displayverbs": ["Look at", "Take"],
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"use": false,
"givesingle": false,
"drop": true,
"gender": "it",
"article": "it",
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"exitslistprefix": "You can go",
"contentsprefix": "containing",
"description": "",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"usedefaultprefix": true,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_usegive": false,
"feature_container": false,
"feature_switchable": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} }
};
elementsNameMap["garden hose"] = _obj439;
allObjects.push(_obj439);
objectsNameMap["garden hose"] = _obj439;
_obj440 = {
"elementtype": "object",
"name": "lawn jockey",
"parent": _obj437,
"type": "object",
"useindividualverblist": true,
"look": "On Michael's lawn sits a small decorative jockey. It's eyes are very expressive... and a bit disturbing.",
"searchfortreasure": "You pick up the lawn jockey, do a quick \"left/right\" glance and hurl it at the ground. You search through the shards and quickly realize you just killed that little jockey for nothing.",
"wink": "That tiny jockey is kind of cute, so you give it a wink. Through squinted eyes, you stare intently to see if there is a response. Not surprisingly, the statue's face remains still.",
"_js_name": "_obj440",
"_types": ["defaultobject"],
"visible": true,
"displayverbs": ["Look at", "Take"],
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"use": false,
"givesingle": false,
"drop": true,
"gender": "it",
"article": "it",
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"exitslistprefix": "You can go",
"contentsprefix": "containing",
"description": "",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"usedefaultprefix": true,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_usegive": false,
"feature_container": false,
"feature_switchable": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} }
};
elementsNameMap["lawn jockey"] = _obj440;
allObjects.push(_obj440);
objectsNameMap["lawn jockey"] = _obj440;
_obj441 = {
"elementtype": "object",
"name": "bumper sticker",
"parent": _obj437,
"type": "object",
"laugh": "You love that kind of sarcastic humor, so you let out a chuckle. The chuckle quickly turns into uncontrollable giggling... and, eventually, maniacal laughter. That escalated fast.",
"steal": "You saunter over to the car whilst whistling an innocent tune, You reach down and try to scrape away the sticker. Someone is watching you from their window.. this would be a good time to stop the sticker stealing.",
"useindividualverblist": false,
"usestandardverblist": true,
"displayverbs": ["Look at", "Laugh", "Steal", "Focus"],
"look": function() { OutputText ("There is a bumper sticker on a car across the street that reads, <br/><br/>\"Is there a caboose to your train of thought?\""); },
"focus": function() { OutputText ("You walk a bit closer and really look at the sticker. Is there a hint here? Maybe... something with trains? Perhaps it's the sarcasm...");
OutputText ("Suddenly, your cell phone rings and the name, \"Greg\" pops up on your caller ID. He must be calling you back from earlier.<br/><br/>\"Hey Amy, what'd you call for?\"<br/><br/>You have no idea if you should explain your situation or make up an excuse for calling.<br/><br/>\"Amy, are you there?\"<br/><br/>You have been contemplating for so long that you forgot to speak! Well... what do you have to lose at this point?<br/><br/>You tell Greg everything that's been happening. He responds with boisterous laughter and thinks that you are either messing with him or need a one way ticket to a mental institution.<br/><br/>\"Amy, what you are talking about is unreal. You can't be serious. That's your character 'Root', doll.\"<br/><br/>Your phone begins to glitch. Greg's voice fades in an out until all that remains is a series of photos flashing repeatedly.<br/><br/>");
picture ("rsz_12939414_10156686951470526_1816595492_n.jpg");
picture ("rsz_12957183_10156686951220526_1467041417_n.jpg");
picture ("rsz_12966144_10156686951210526_572396204_n.jpg");
OutputText ("<br/><br/>Once the photos repeat a few times, you catch on.<br/><br/>\"Wait... is that a 'Root doll'?!\"<br/><br/>The verbal message from The Machine abruptly stops.<br/><br/>AHA! So, now you know that your next mission has something to do with \"Kristin\" and a \"Root Doll\".<br/><br/>Wanting to investigate further, you take a seat on the sidewalk and begin researching on your phone. As you are trying other venues, an \"image reverse search\" website pops up.<br/><br/>Your phone takes control and enters one of the doll photos into it's search engine. Amazingly, the Tumblr page for a girl named \"Kristin\" comes up. This must be her! You read through some of her posts. She is very creative and definitely has a sarcastic sense of humor.<br/><br/>You click on one of the Root doll photos and the page distorts and warps. The words, \"Hello Amy\" appear on the screen...<br/><br/>Maybe you should greet her back?"); },
"_js_name": "_obj441",
"_types": ["defaultobject"],
"visible": true,
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"use": false,
"givesingle": false,
"drop": true,
"gender": "it",
"article": "it",
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"exitslistprefix": "You can go",
"contentsprefix": "containing",
"description": "",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"usedefaultprefix": true,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_usegive": false,
"feature_container": false,
"feature_switchable": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} }
};
elementsNameMap["bumper sticker"] = _obj441;
allObjects.push(_obj441);
objectsNameMap["bumper sticker"] = _obj441;
_obj442 = {
"elementtype": "object",
"name": "Hello Kristin",
"parent": _obj437,
"type": "command",
"pattern": "Hello Kristin",
"script": function(parameters) { OutputText ("A video pops up on your cell phone.<br/><br/>");
ShowYouTube ("WP6AJRdFzZk");
OutputText ("<br/><br/>You did it! You found another \"fan of interest\".<br/><br/>As you may have guessed, the noise in your head begins again.<br/><br/>\"Mike Alpha Romeo India\"<br/><br/>You are understanding the code now, so you realize this must be about someone named, \"Mari\".<br/><br/>Kristin gave you a clue about her story board being bad. Maybe you're looking for someone who is good at art?<br/><br/>Your cell phone chirps in your hand, revealing a text message notification from Sarah.<br/><br/>\"Hey Amy, I am checking out a new Krav Maga class today. Do you want to meet up?\"<br/><br/>Nothing today seems like a coincidence. You should follow this trail towards the Krav Maga studio and see where it leads you."); },
"_js_name": "_obj442",
"_types": ["defaultcommand"]
};
elementsNameMap["Hello Kristin"] = _obj442;
allCommands.push(_obj442);
objectsNameMap["Hello Kristin"] = _obj442;
_obj443 = {
"elementtype": "object",
"name": "Hi Kristin",
"parent": _obj437,
"type": "command",
"pattern": "Hi Kristin",
"script": function(parameters) { OutputText ("A video pops up on your cell phone.<br/><br/>");
ShowYouTube ("WP6AJRdFzZk");
OutputText ("<br/><br/>You did it! You found another \"fan of interest\".<br/><br/>As you may have guessed, the noise in your head begins again.<br/><br/>\"Mike Alpha Romeo India\"<br/><br/>You are understanding the code now, so you realize this must be about someone named, \"Mari\".<br/><br/>Kristin gave you a clue about her story board being bad. Maybe you're looking for someone who is good at art?<br/><br/>Your cell phone chirps in your hand, revealing a text message notification from Sarah.<br/><br/>\"Hey Amy, I am checking out a new Krav Maga class today. Do you want to meet up?\"<br/><br/>Nothing today seems like a coincidence. You should follow this trail towards the Krav Maga studio and see where it leads you."); },
"_js_name": "_obj443",
"_types": ["defaultcommand"]
};
elementsNameMap["Hi Kristin"] = _obj443;
allCommands.push(_obj443);
objectsNameMap["Hi Kristin"] = _obj443;
_obj444 = {
"elementtype": "object",
"name": "k52",
"parent": _obj437,
"type": "exit",
"alias": "Krav Maga Studio",
"_js_name": "_obj444",
"_types": ["defaultexit"],
"displayverbs": ["Go to"],
"visible": true,
"scenery": false,
"locked": false,
"lockmessage": "That way is locked.",
"lookonly": false,
"runscript": false,
"lightstrength": "",
"grid_length": 1,
"grid_render": false,
"grid_offset_x": 0,
"grid_offset_y": 0
};
elementsNameMap["k52"] = _obj444;
objectReferences.push(["_obj444", "to", "_obj451"]);
allExits.push(_obj444);
objectsNameMap["k52"] = _obj444;
_obj445 = {
"elementtype": "object",
"name": "k53",
"type": "command",
"anonymous": true,
"property": "playsnake",
"isverb": true,
"pattern": "^play snake (?<object>.*)$",
"defaultexpression": "\"You can't play snake \" + object.article + \".\"",
"_js_name": "_obj445",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["k53"] = _obj445;
allCommands.push(_obj445);
objectsNameMap["k53"] = _obj445;
_obj446 = {
"elementtype": "object",
"name": "k54",
"type": "command",
"anonymous": true,
"property": "searchfortreasure",
"isverb": true,
"pattern": "^search for treasure (?<object>.*)$",
"defaultexpression": "\"You can't search for treasure \" + object.article + \".\"",
"_js_name": "_obj446",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["k54"] = _obj446;
allCommands.push(_obj446);
objectsNameMap["k54"] = _obj446;
_obj447 = {
"elementtype": "object",
"name": "k55",
"type": "command",
"anonymous": true,
"property": "wink",
"isverb": true,
"pattern": "^wink (?<object>.*)$",
"defaultexpression": "\"You can't wink \" + object.article + \".\"",
"_js_name": "_obj447",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["k55"] = _obj447;
allCommands.push(_obj447);
objectsNameMap["k55"] = _obj447;
_obj448 = {
"elementtype": "object",
"name": "k56",
"type": "command",
"anonymous": true,
"property": "laugh",
"isverb": true,
"pattern": "^laugh (?<object>.*)$",
"defaultexpression": "\"You can't laugh \" + object.article + \".\"",
"_js_name": "_obj448",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["k56"] = _obj448;
allCommands.push(_obj448);
objectsNameMap["k56"] = _obj448;
_obj449 = {
"elementtype": "object",
"name": "k57",
"type": "command",
"anonymous": true,
"property": "steal",
"isverb": true,
"pattern": "^steal (?<object>.*)$",
"defaultexpression": "\"You can't steal \" + object.article + \".\"",
"_js_name": "_obj449",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["k57"] = _obj449;
allCommands.push(_obj449);
objectsNameMap["k57"] = _obj449;
_obj450 = {
"elementtype": "object",
"name": "k58",
"type": "command",
"anonymous": true,
"property": "focus",
"isverb": true,
"pattern": "^focus (?<object>.*)$",
"defaultexpression": "\"You can't focus \" + object.article + \".\"",
"_js_name": "_obj450",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["k58"] = _obj450;
allCommands.push(_obj450);
objectsNameMap["k58"] = _obj450;
_obj451 = {
"elementtype": "object",
"name": "Krav Maga Studio",
"type": "object",
"description": "The Krav Maga studio sits hidden among a few small shops and restaurants. There doesn't seem to be anyone inside.",
"beforeenter": function() { OutputText ("Now that you've spoken to Sarah, you start heading towards the address she gave you to meet up."); },
"onexit": function() { OutputText ("You sit down with Sarah and begin spilling the beans about your entire day.<br/><br/>You explain the voice and the code.<br/><br/>\"The code is saying 'Mari' now.\"<br/><br/>As the words leave your mouth, the sound stops. You are starting to live for these moments of relative silence."); },
"_js_name": "_obj451",
"_types": ["defaultobject"],
"visible": true,
"displayverbs": ["Look at", "Take"],
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"use": false,
"givesingle": false,
"drop": true,
"gender": "it",
"article": "it",
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"exitslistprefix": "You can go",
"contentsprefix": "containing",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"usedefaultprefix": true,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_usegive": false,
"feature_container": false,
"feature_switchable": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} }
};
elementsNameMap["Krav Maga Studio"] = _obj451;
allObjects.push(_obj451);
objectsNameMap["Krav Maga Studio"] = _obj451;
_obj452 = {
"elementtype": "object",
"name": "k59",
"parent": _obj451,
"type": "exit",
"alias": "Outside of Michaels",
"prefix": "",
"to": _obj437,
"_js_name": "_obj452",
"_types": ["defaultexit"],
"displayverbs": ["Go to"],
"visible": true,
"scenery": false,
"locked": false,
"lockmessage": "That way is locked.",
"lookonly": false,
"runscript": false,
"lightstrength": "",
"grid_length": 1,
"grid_render": false,
"grid_offset_x": 0,
"grid_offset_y": 0
};
elementsNameMap["k59"] = _obj452;
allExits.push(_obj452);
objectsNameMap["k59"] = _obj452;
_obj453 = {
"elementtype": "object",
"name": "Be honest",
"parent": _obj451,
"type": "command",
"pattern": "Be honest",
"script": function(parameters) { OutputText ("You start to tell Sarah about your experience with The Machine today.<br/><br/>You explain how you woke up to the sound and are being lead through different clues. You think that her \"krav maga\" incident may be relevant.<br/><br/>You can't really read the face she's giving you. Is she irritated? Does she think you're lying? She speaks;<br/><br/>\"Well, what can I do to help?\"<br/><br/>Team Shoot is in action!"); },
"_js_name": "_obj453",
"_types": ["defaultcommand"]
};
elementsNameMap["Be honest"] = _obj453;
allCommands.push(_obj453);
objectsNameMap["Be honest"] = _obj453;
_obj454 = {
"elementtype": "object",
"name": "Make up an excuse",
"parent": _obj451,
"type": "command",
"pattern": "Make up an excuse",
"script": function(parameters) { OutputText ("You are afraid of her reaction, so you try to think of an excuse. <br/><br/>Hmm... what is a good reason for you making that phone call...<br/><br/>\"April Fools!\" you blurt out.<br/><br/>\"Amy, it's not even April.\" Sarah says with skepticism.<br/><br/>\"That's why you'd never see it coming!\"<br/><br/>She clearly doesn't believe you. Hmph. Nothing left to do but be honest."); },
"_js_name": "_obj454",
"_types": ["defaultcommand"]
};
elementsNameMap["Make up an excuse"] = _obj454;
allCommands.push(_obj454);
objectsNameMap["Make up an excuse"] = _obj454;
_obj455 = {
"elementtype": "object",
"name": "door of studio",
"parent": _obj451,
"type": "object",
"look": "The door of the Krav Maga studio is shut. The lights are off inside and there is a sign taped to it.",
"useindividualverblist": true,
"readsign": function() { OutputText ("\"We apologize, but due to unforeseen events, we will not be having our Krav Maga lesson today\".<br/><br/>You look around and see a coffee place close by. After what you've been through today, you could definitely use some caffeine.<br/><br/>Sarah agrees to join you so that you two can further discuss this situation."); },
"_js_name": "_obj455",
"_types": ["defaultobject"],
"visible": true,
"displayverbs": ["Look at", "Take"],
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"use": false,
"givesingle": false,
"drop": true,
"gender": "it",
"article": "it",
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"exitslistprefix": "You can go",
"contentsprefix": "containing",
"description": "",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"usedefaultprefix": true,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_usegive": false,
"feature_container": false,
"feature_switchable": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} }
};
elementsNameMap["door of studio"] = _obj455;
allObjects.push(_obj455);
objectsNameMap["door of studio"] = _obj455;
_obj456 = {
"elementtype": "object",
"name": "k60",
"parent": _obj451,
"type": "exit",
"alias": "Coffee Place",
"_js_name": "_obj456",
"_types": ["defaultexit"],
"displayverbs": ["Go to"],
"visible": true,
"scenery": false,
"locked": false,
"lockmessage": "That way is locked.",
"lookonly": false,
"runscript": false,
"lightstrength": "",
"grid_length": 1,
"grid_render": false,
"grid_offset_x": 0,
"grid_offset_y": 0
};
elementsNameMap["k60"] = _obj456;
objectReferences.push(["_obj456", "to", "_obj461"]);
allExits.push(_obj456);
objectsNameMap["k60"] = _obj456;
_obj457 = {
"elementtype": "object",
"name": "Make excuse",
"parent": _obj451,
"type": "command",
"pattern": "Make excuse",
"script": function(parameters) { OutputText ("You are afraid of her reaction, so you try to think of an excuse. <br/><br/>Hmm... what is a good reason for you making that phone call...<br/><br/>\"April Fools!\" you blurt out.<br/><br/>\"Amy, it's not even April.\" Sarah says with skepticism.<br/><br/>\"That's why you'd never see it coming!\"<br/><br/>She clearly doesn't believe you. Hmph. Nothing left to do but be honest."); },
"_js_name": "_obj457",
"_types": ["defaultcommand"]
};
elementsNameMap["Make excuse"] = _obj457;
allCommands.push(_obj457);
objectsNameMap["Make excuse"] = _obj457;
_obj458 = {
"elementtype": "object",
"name": "Excuse",
"parent": _obj451,
"type": "command",
"pattern": "Excuse",
"script": function(parameters) { OutputText ("You are afraid of her reaction, so you try to think of an excuse. <br/><br/>Hmm... what is a good reason for you making that phone call...<br/><br/>\"April Fools!\" you blurt out.<br/><br/>\"Amy, it's not even April.\" Sarah says with skepticism.<br/><br/>\"That's why you'd never see it coming!\"<br/><br/>She clearly doesn't believe you. Hmph. Nothing left to do but be honest."); },
"_js_name": "_obj458",
"_types": ["defaultcommand"]
};
elementsNameMap["Excuse"] = _obj458;
allCommands.push(_obj458);
objectsNameMap["Excuse"] = _obj458;
_obj459 = {
"elementtype": "object",
"name": "Sarah",
"parent": _obj451,
"type": "object",
"look": "Sarah looks stunning, as usual. Even when she's dressed in work out clothes, she still has a certain type of radiance about her.",
"hug": "You approach Sarah and greet her with a big hug. A couple of Shoot fans witness this and die of a heart attack in front of you. Just a typical day in the life of Amy Acker.",
"kick": "You swing your boot back and kick it at Sarah's shin. In about 3 seconds, she twists you around and has you in a hold on the ground. You should probably laugh this off before things turn all \"prison rules\".",
"useindividualverblist": false,
"usestandardverblist": true,
"displayverbs": ["Look at", "Hug", "Kick", "Speak to"],
"speak": function() { OutputText ("You stand next to Sarah and give her a smile. You know how Greg reacted, so you think it's best not to mention the whole \"Machine is real\" thing. Let's hope she doesn't remember your phone call from earlier...<br/><br/>\"So, krav maga, huh?\" you are curious why Sarah chose to do this today.<br/><br/>\"It was so weird, all day when I was cleaning around the house I kept hearing about 'krav maga'. I kept seeing commercials on tv and hearing about it on the radio. When I saw the Facebook ad for this studio, I figured I should try it out.\"<br/><br/>Without even knowing it, Sarah was listening to The Machine as well. Maybe you should tell her the truth. This is a hard choice to make. Sarah's voice interrupts your thoughts;<br/><br/>\"What was the deal with your phone call this morning? Did you ever figure out what was going on?\"<br/><br/>Damn. What do you think... be honest or make up an excuse?"); },
"_js_name": "_obj459",
"_types": ["namedfemale", "defaultobject"],
"usedefaultprefix": false,
"gender": "she",
"article": "her",
"visible": true,
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"use": false,
"givesingle": false,
"drop": true,
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"exitslistprefix": "You can go",
"contentsprefix": "containing",
"description": "",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_usegive": false,
"feature_container": false,
"feature_switchable": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} }
};
elementsNameMap["Sarah"] = _obj459;
allObjects.push(_obj459);
objectsNameMap["Sarah"] = _obj459;
_obj460 = {
"elementtype": "object",
"name": "k61",
"type": "command",
"anonymous": true,
"property": "readsign",
"isverb": true,
"pattern": "^read sign (?<object>.*)$",
"defaultexpression": "\"You can't read sign \" + object.article + \".\"",
"_js_name": "_obj460",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["k61"] = _obj460;
allCommands.push(_obj460);
objectsNameMap["k61"] = _obj460;
_obj461 = {
"elementtype": "object",
"name": "Coffee Place",
"type": "object",
"description": "The coffee shop is the only one in the area that is not owned by a major franchise. It's quaint and not too crowded.",
"onexit": function() { OutputText ("On your way to the Farmer's Market, your phone rings again.<br/><br/>This time, it's James. Since he was busy this morning, you never got a chance to tell him everything.<br/><br/>You trust that he'll support you once you explain the situation. You blurt out your entire day and tell him that you are heading to the Farmer's Market. He tells you that he will meet you there.");
playsound ("MariMachineFinal.wav", false, false); },
"_js_name": "_obj461",
"_types": ["defaultobject"],
"visible": true,
"displayverbs": ["Look at", "Take"],
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"use": false,
"givesingle": false,
"drop": true,
"gender": "it",
"article": "it",
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"exitslistprefix": "You can go",
"contentsprefix": "containing",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"usedefaultprefix": true,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_usegive": false,
"feature_container": false,
"feature_switchable": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} }
};
elementsNameMap["Coffee Place"] = _obj461;
allObjects.push(_obj461);
objectsNameMap["Coffee Place"] = _obj461;
_obj462 = {
"elementtype": "object",
"name": "k62",
"parent": _obj461,
"type": "exit",
"alias": "Krav Maga Studio",
"to": _obj451,
"_js_name": "_obj462",
"_types": ["defaultexit"],
"displayverbs": ["Go to"],
"visible": true,
"scenery": false,
"locked": false,
"lockmessage": "That way is locked.",
"lookonly": false,
"runscript": false,
"lightstrength": "",
"grid_length": 1,
"grid_render": false,
"grid_offset_x": 0,
"grid_offset_y": 0
};
elementsNameMap["k62"] = _obj462;
allExits.push(_obj462);
objectsNameMap["k62"] = _obj462;
_obj463 = {
"elementtype": "object",
"name": "HelloMariF",
"parent": _obj461,
"type": "command",
"pattern": "Hello Mari",
"script": function(parameters) { OutputText ("A video starts to play on both of your cell phones.<br/><br/>");
ShowYouTube ("CimeKTR4Pmw");
OutputText ("<br/><br/><br/>When The Machine starts talking in your ear again, you expect the noise but not the letters.<br/><br/>\"Mike Alpha Romeo India\"<br/><br/>Wait... what?! You just found Mari! Based on the show, you know The Machine is always right... so you'd better just go with it.<br/><br/>Sarah is telling you that she needs to get home, but all you can focus on is the duplicate name.<br/><br/>The radio in the coffee shop crackles and blatantly interrupts the music with a commercial for a local Farmer's Market.<br/><br/>You're at The Machine's beck and call now, time to trudge towards the Farmer's Market."); },
"_js_name": "_obj463",
"_types": ["defaultcommand"]
};
elementsNameMap["HelloMariF"] = _obj463;
allCommands.push(_obj463);
objectsNameMap["HelloMariF"] = _obj463;
_obj464 = {
"elementtype": "object",
"name": "trash on table",
"parent": _obj461,
"type": "object",
"look": "Some previous customers rudely left all of their trash behind on the table.",
"eatleftovers": "What?! NO! You cannot eat those crusty leftovers!",
"cleanup": "You gather all of the trash and put it in the recepticle. You are feeling very altruistic... but haven't found \"Mari\" yet.",
"useindividualverblist": true,
"_js_name": "_obj464",
"_types": ["defaultobject"],
"visible": true,
"displayverbs": ["Look at", "Take"],
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"use": false,
"givesingle": false,
"drop": true,
"gender": "it",
"article": "it",
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"exitslistprefix": "You can go",
"contentsprefix": "containing",
"description": "",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"usedefaultprefix": true,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_usegive": false,
"feature_container": false,
"feature_switchable": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} }
};
elementsNameMap["trash on table"] = _obj464;
allObjects.push(_obj464);
objectsNameMap["trash on table"] = _obj464;
_obj465 = {
"elementtype": "object",
"name": "barista",
"parent": _obj461,
"type": "object",
"look": "The barista is kind of creeping you out. He keeps staring in your direction and you're pretty sure he's whispering about you.",
"highfive": "You run up, take a leap and high five the barista. He's super stoked about it, but it didn't help you find Mari.",
"useindividualverblist": true,
"approach": function() { OutputText ("You approach the barista to put in your order.<br/><br/>When you finish, instead of asking for your name, he blurts out;<br/><br/>\"You're Amy! You're Amy Acker!\"<br/><br/>It seems he couldn't contain himself anymore. He begins to gush about how much he loves your work, especially in \"Dollhouse\".<br/><br/>You hear a scuffle behind you and the barista stops mid-sentence. You are shocked to turn and see a group of about 7 \"super heroes\" walk in.<br/><br/>Yes, superheroes. Well, people in cosplay, technically. Some of them have very intricate costumes with sound sensitive LED lights. The lights make a pattern on each of them, blinking and pulsing to the ambience.<br/><br/>As you stand behind the superheroes, the lights form into a specific pattern; <br/><br/>\"M A R I\"<br/><br/>You gasp, wave for Sarah's attention and point to the word. Her jaw drops in disbelief.<br/><br/>You take a step back towards Sarah and hear your phones go off simultaneously.<br/><br/>");
picture ("rsz_13219925_871968452929345_694358701_n.jpg");
picture ("13313745_881356691990521_923187267_o.jpg");
picture ("13340588_881356688657188_933445049_o.jpg");
OutputText ("<br/><br/>These photos must be Mari's artwork! That's where the \"artist\" clue comes in!<br/><br/>The photo disappears and you see the words; \"Hello Amy\" on both of your screens.<br/><br/>You know what to do."); },
"_js_name": "_obj465",
"_types": ["male", "defaultobject"],
"displayverbs": ["Look at", "Speak to"],
"gender": "he",
"article": "him",
"visible": true,
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"use": false,
"givesingle": false,
"drop": true,
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"exitslistprefix": "You can go",
"contentsprefix": "containing",
"description": "",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"usedefaultprefix": true,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_usegive": false,
"feature_container": false,
"feature_switchable": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} }
};
elementsNameMap["barista"] = _obj465;
allObjects.push(_obj465);
objectsNameMap["barista"] = _obj465;
_obj466 = {
"elementtype": "object",
"name": "k63",
"parent": _obj461,
"type": "exit",
"alias": "Farmers Market",
"_js_name": "_obj466",
"_types": ["defaultexit"],
"displayverbs": ["Go to"],
"visible": true,
"scenery": false,
"locked": false,
"lockmessage": "That way is locked.",
"lookonly": false,
"runscript": false,
"lightstrength": "",
"grid_length": 1,
"grid_render": false,
"grid_offset_x": 0,
"grid_offset_y": 0
};
elementsNameMap["k63"] = _obj466;
objectReferences.push(["_obj466", "to", "_obj471"]);
allExits.push(_obj466);
objectsNameMap["k63"] = _obj466;
_obj467 = {
"elementtype": "object",
"name": "k64",
"type": "command",
"anonymous": true,
"property": "approach",
"isverb": true,
"pattern": "^approach (?<object>.*)$",
"defaultexpression": "\"You can't approach \" + object.article + \".\"",
"_js_name": "_obj467",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["k64"] = _obj467;
allCommands.push(_obj467);
objectsNameMap["k64"] = _obj467;
_obj468 = {
"elementtype": "object",
"name": "k65",
"type": "command",
"anonymous": true,
"property": "eatleftovers",
"isverb": true,
"pattern": "^eat leftovers (?<object>.*)$",
"defaultexpression": "\"You can't eat leftovers \" + object.article + \".\"",
"_js_name": "_obj468",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["k65"] = _obj468;
allCommands.push(_obj468);
objectsNameMap["k65"] = _obj468;
_obj469 = {
"elementtype": "object",
"name": "k66",
"type": "command",
"anonymous": true,
"property": "cleanup",
"isverb": true,
"pattern": "^clean up (?<object>.*)$",
"defaultexpression": "\"You can't clean up \" + object.article + \".\"",
"_js_name": "_obj469",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["k66"] = _obj469;
allCommands.push(_obj469);
objectsNameMap["k66"] = _obj469;
_obj470 = {
"elementtype": "object",
"name": "k67",
"type": "command",
"anonymous": true,
"property": "highfive",
"isverb": true,
"pattern": "^high five (?<object>.*)$",
"defaultexpression": "\"You can't high five \" + object.article + \".\"",
"_js_name": "_obj470",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["k67"] = _obj470;
allCommands.push(_obj470);
objectsNameMap["k67"] = _obj470;
_obj471 = {
"elementtype": "object",
"name": "Farmers Market",
"type": "object",
"description": "The Farmers Market is relatively busy. There are various venders up and down multiple isles of produce.",
"onexit": function() { OutputText ("You ask James to drive you home.<br/><br/>On the way, the radio starts to act strangely. Every time music is playing, it singles out the drum track.<br/><br/>You try FM stations, your iPhone and a CD... all yield the same result.<br/><br/>\"This is what I've been saying! This must be something to do with drums...\"<br/><br/>As soon as you mention drumming, The Machine relinquishes in your head.<br/><br/>You feel validated. James witnessed Mari's message and now he's hearing this anomoly. He doesn't think you're crazy anymore and is actually pretty interested in what will happen next.");
playsound ("AmandaMachineFinal.wav", false, false); },
"_js_name": "_obj471",
"_types": ["defaultobject"],
"visible": true,
"displayverbs": ["Look at", "Take"],
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"use": false,
"givesingle": false,
"drop": true,
"gender": "it",
"article": "it",
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"exitslistprefix": "You can go",
"contentsprefix": "containing",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"usedefaultprefix": true,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_usegive": false,
"feature_container": false,
"feature_switchable": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} }
};
elementsNameMap["Farmers Market"] = _obj471;
allObjects.push(_obj471);
objectsNameMap["Farmers Market"] = _obj471;
_obj472 = {
"elementtype": "object",
"name": "k68",
"parent": _obj471,
"type": "exit",
"alias": "Coffee Place",
"to": _obj461,
"_js_name": "_obj472",
"_types": ["defaultexit"],
"displayverbs": ["Go to"],
"visible": true,
"scenery": false,
"locked": false,
"lockmessage": "That way is locked.",
"lookonly": false,
"runscript": false,
"lightstrength": "",
"grid_length": 1,
"grid_render": false,
"grid_offset_x": 0,
"grid_offset_y": 0
};
elementsNameMap["k68"] = _obj472;
allExits.push(_obj472);
objectsNameMap["k68"] = _obj472;
_obj473 = {
"elementtype": "object",
"name": "James",
"parent": _obj471,
"type": "object",
"look": "James has a smirk on his face and is looking dapper due to his audition. He always looks extra handsome when he's going out for a Broadway role.",
"useindividualverblist": false,
"usestandardverblist": true,
"displayverbs": ["Look at", "Pinch", "Speak to"],
"speak": function() { OutputText ("You greet James with a hug and tell him how tumultuous your day has been.<br/><br/>\"Honey, you sound like you're over stressed and under rested.\"<br/><br/>You try to imagine how you'd respond if the roles were reversed. You find it understandable that he's having a hard time believing all of this.<br/><br/>You should pursue the clues and see if you can prove that this is real."); },
"pinch": function() { OutputText ("You pinch James in the forearm and he lets out a cry of pain.<br/><br/>\"What was that for?!\"<br/><br/>You explain that you wanted to make sure you weren't dreaming, but he corrects the fact that you're supposed to pinch yourself for that."); },
"_js_name": "_obj473",
"_types": ["namedmale", "defaultobject"],
"usedefaultprefix": false,
"gender": "he",
"article": "him",
"visible": true,
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"use": false,
"givesingle": false,
"drop": true,
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"exitslistprefix": "You can go",
"contentsprefix": "containing",
"description": "",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_usegive": false,
"feature_container": false,
"feature_switchable": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} }
};
elementsNameMap["James"] = _obj473;
allObjects.push(_obj473);
objectsNameMap["James"] = _obj473;
_obj474 = {
"elementtype": "object",
"name": "tomato",
"parent": _obj471,
"type": "object",
"look": "The tomato sits among many others on one of the display tables.",
"heckle": "You turn around and throw the tomato at the first passerby. Umm... what are you thinking?!?",
"examinecloser": "The tomato looks ripe and delicious. You don't think this is at all connected to finding Mari.",
"useindividualverblist": true,
"_js_name": "_obj474",
"_types": ["defaultobject"],
"visible": true,
"displayverbs": ["Look at", "Take"],
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"use": false,
"givesingle": false,
"drop": true,
"gender": "it",
"article": "it",
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"exitslistprefix": "You can go",
"contentsprefix": "containing",
"description": "",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"usedefaultprefix": true,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_usegive": false,
"feature_container": false,
"feature_switchable": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} }
};
elementsNameMap["tomato"] = _obj474;
allObjects.push(_obj474);
objectsNameMap["tomato"] = _obj474;
_obj475 = {
"elementtype": "object",
"name": "green chile",
"parent": _obj471,
"type": "object",
"look": "The green chile is perfectly grown by a company based out of Albuquerque.",
"bite": "You take the chile and chomp into it. Uh... you're going to have to pay for that.",
"useindividualverblist": true,
"examinecloser": function() { OutputText ("You lift the chile and hear white noise begin on the small black and white television sitting behind the farmer.<br/><br/>The screen begins to display a documentary about the Rocky Mountains; specifically in New Mexico.<br/><br/>This, obviously, is a sign of some type. These things don't seem to be directing you back to the last fan... then, it dawns on you;<br/><br/>\"There are two Maris!\"<br/><br/>Excellent! The message stops and, like the other times, the television moans into a fuzzy message;<br/><br/>\"Hello Amy\"<br/><br/>Show James what you know."); },
"_js_name": "_obj475",
"_types": ["defaultobject"],
"visible": true,
"displayverbs": ["Look at", "Take"],
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"use": false,
"givesingle": false,
"drop": true,
"gender": "it",
"article": "it",
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"exitslistprefix": "You can go",
"contentsprefix": "containing",
"description": "",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"usedefaultprefix": true,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_usegive": false,
"feature_container": false,
"feature_switchable": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} }
};
elementsNameMap["green chile"] = _obj475;
allObjects.push(_obj475);
objectsNameMap["green chile"] = _obj475;
_obj476 = {
"elementtype": "object",
"name": "HelloMariM",
"parent": _obj471,
"type": "command",
"pattern": "Hello Mari",
"script": function(parameters) { OutputText ("A video begins playing on the black and white television.<br/><br/>");
ShowYouTube ("6lMdbOCmzyY");
OutputText ("<br/><br/>Like clockwork, The Machine is in your ear again.<br/><br/>\"Alpha Mike Alpha November Delta Alpha\"<br/><br/>Wait a second... you know this one! You're fairly confident that \"Amanda\" is the fan from Denver who sends you puzzles. The same one from the cook book earlier.<br/><br/>You feel drained at this point. You know a few things about Amanda, so you figure you can have James bring you home and try to research more from there."); },
"_js_name": "_obj476",
"_types": ["defaultcommand"]
};
elementsNameMap["HelloMariM"] = _obj476;
allCommands.push(_obj476);
objectsNameMap["HelloMariM"] = _obj476;
_obj477 = {
"elementtype": "object",
"name": "HiMariM",
"parent": _obj471,
"type": "command",
"pattern": "Hi Mari",
"script": function(parameters) { OutputText ("A video begins playing on the black and white television.<br/><br/>");
ShowYouTube ("6lMdbOCmzyY");
OutputText ("<br/><br/>Like clockwork, The Machine is in your ear again.<br/><br/>\"Alpha Mike Alpha November Delta Alpha\"<br/><br/>Wait a second... you know this one! You're fairly confident that \"Amanda\" is the fan from Denver who sends you puzzles. The same one from the cook book earlier.<br/><br/>You feel drained at this point. You know a few things about Amanda, so you figure you can have James bring you home and try to research more from there."); },
"_js_name": "_obj477",
"_types": ["defaultcommand"]
};
elementsNameMap["HiMariM"] = _obj477;
allCommands.push(_obj477);
objectsNameMap["HiMariM"] = _obj477;
_obj478 = {
"elementtype": "object",
"name": "k69",
"parent": _obj471,
"type": "exit",
"alias": "Home",
"_js_name": "_obj478",
"_types": ["defaultexit"],
"displayverbs": ["Go to"],
"visible": true,
"scenery": false,
"locked": false,
"lockmessage": "That way is locked.",
"lookonly": false,
"runscript": false,
"lightstrength": "",
"grid_length": 1,
"grid_render": false,
"grid_offset_x": 0,
"grid_offset_y": 0
};
elementsNameMap["k69"] = _obj478;
objectReferences.push(["_obj478", "to", "_obj482"]);
allExits.push(_obj478);
objectsNameMap["k69"] = _obj478;
_obj479 = {
"elementtype": "object",
"name": "k70",
"type": "command",
"anonymous": true,
"property": "pinch",
"isverb": true,
"pattern": "^pinch (?<object>.*)$",
"defaultexpression": "\"You can't pinch \" + object.article + \".\"",
"_js_name": "_obj479",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["k70"] = _obj479;
allCommands.push(_obj479);
objectsNameMap["k70"] = _obj479;
_obj480 = {
"elementtype": "object",
"name": "k71",
"type": "command",
"anonymous": true,
"property": "heckle",
"isverb": true,
"pattern": "^heckle (?<object>.*)$",
"defaultexpression": "\"You can't heckle \" + object.article + \".\"",
"_js_name": "_obj480",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["k71"] = _obj480;
allCommands.push(_obj480);
objectsNameMap["k71"] = _obj480;
_obj481 = {
"elementtype": "object",
"name": "k72",
"type": "command",
"anonymous": true,
"property": "bite",
"isverb": true,
"pattern": "^bite (?<object>.*)$",
"defaultexpression": "\"You can't bite \" + object.article + \".\"",
"_js_name": "_obj481",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["k72"] = _obj481;
allCommands.push(_obj481);
objectsNameMap["k72"] = _obj481;
_obj482 = {
"elementtype": "object",
"name": "Home",
"type": "object",
"description": "Your home is incredibly welcoming, especially after the day you've had.",
"_js_name": "_obj482",
"_types": ["defaultobject"],
"visible": true,
"displayverbs": ["Look at", "Take"],
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"use": false,
"givesingle": false,
"drop": true,
"gender": "it",
"article": "it",
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"exitslistprefix": "You can go",
"contentsprefix": "containing",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"usedefaultprefix": true,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_usegive": false,
"feature_container": false,
"feature_switchable": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} }
};
elementsNameMap["Home"] = _obj482;
allObjects.push(_obj482);
objectsNameMap["Home"] = _obj482;
_obj483 = {
"elementtype": "object",
"name": "k73",
"parent": _obj482,
"type": "exit",
"alias": "Farmers Market",
"to": _obj471,
"_js_name": "_obj483",
"_types": ["defaultexit"],
"displayverbs": ["Go to"],
"visible": true,
"scenery": false,
"locked": false,
"lockmessage": "That way is locked.",
"lookonly": false,
"runscript": false,
"lightstrength": "",
"grid_length": 1,
"grid_render": false,
"grid_offset_x": 0,
"grid_offset_y": 0
};
elementsNameMap["k73"] = _obj483;
allExits.push(_obj483);
objectsNameMap["k73"] = _obj483;
_obj484 = {
"elementtype": "object",
"name": "Hello Amanda",
"parent": _obj482,
"type": "command",
"pattern": "Hello Amanda",
"script": function(parameters) { OutputText ("A video appears on your computer screen.<br/><br/>");
ShowYouTube ("adsBl9N6-OU");
OutputText ("<br/><br/>The video ends and you hear nothing. No more voices, no more codes.<br/><br/>It looks like you've done it; you've made it through the day and received all of the messages.<br/><br/>You fall back onto your couch, kick your heels up and close your eyes. You think about the progression of the day and how you followed the hints. You are exhausted. <br/><br/>You begin to drift off to sleep when you hear the front door open. The patter of small feet makes you realize that Jackson and Ava are home from school.<br/><br/>\"Hi mommy! We're hungry, what's for dinner?\"<br/><br/>Just another day in the life of a super hacker mom."); },
"_js_name": "_obj484",
"_types": ["defaultcommand"]
};
elementsNameMap["Hello Amanda"] = _obj484;
allCommands.push(_obj484);
objectsNameMap["Hello Amanda"] = _obj484;
_obj485 = {
"elementtype": "object",
"name": "Hi Amanda",
"parent": _obj482,
"type": "command",
"pattern": "Hi Amanda",
"script": function(parameters) { OutputText ("A video appears on your computer screen.<br/><br/>");
ShowYouTube ("adsBl9N6-OU");
OutputText ("<br/><br/>The video ends and you hear nothing. No more voices, no more codes.<br/><br/>It looks like you've done it; you've made it through the day and received all of the messages.<br/><br/>You fall back onto your couch, kick your heels up and close your eyes. You think about the progression of the day and how you followed the hints. You are exhausted. <br/><br/>You begin to drift off to sleep when you hear the front door open. The patter of small feet makes you realize that Jackson and Ava are home from school.<br/><br/>\"Hi mommy! We're hungry, what's for dinner?\"<br/><br/>Just another day in the life of a super hacker mom."); },
"_js_name": "_obj485",
"_types": ["defaultcommand"]
};
elementsNameMap["Hi Amanda"] = _obj485;
allCommands.push(_obj485);
objectsNameMap["Hi Amanda"] = _obj485;
_obj486 = {
"elementtype": "object",
"name": "banana",
"parent": _obj482,
"type": "object",
"look": "The banana sits on your kitchen counter, ripe and ready to eat.",
"useindividualverblist": true,
"eat": "You haven't eaten all day, so you rip open the banana and devour it like a gorilla. Brain food!",
"squish": function() { OutputText ("You grab the banana and squish it as hard as you can between your fingers.<br/><br/>Gross. Let's focus here."); },
"_js_name": "_obj486",
"_types": ["defaultobject"],
"visible": true,
"displayverbs": ["Look at", "Take"],
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"use": false,
"givesingle": false,
"drop": true,
"gender": "it",
"article": "it",
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"exitslistprefix": "You can go",
"contentsprefix": "containing",
"description": "",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"usedefaultprefix": true,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_usegive": false,
"feature_container": false,
"feature_switchable": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} }
};
elementsNameMap["banana"] = _obj486;
allObjects.push(_obj486);
objectsNameMap["banana"] = _obj486;
_obj487 = {
"elementtype": "object",
"name": "slippers",
"parent": _obj482,
"type": "object",
"look": "Sitting next to your doorway is a pair of bunny slippers you wore on Person of Interest.",
"useindividualverblist": true,
"wear": "You slide the slippers on your feet and sigh in comfort. This helps you wind down a bit.",
"hop": function() { OutputText ("You begin to imitate a rabbit and hop around the house.<br/><br/>Once all of the carrots in your house are eaten, you decide to get back to finding Amanda."); },
"_js_name": "_obj487",
"_types": ["defaultobject"],
"visible": true,
"displayverbs": ["Look at", "Take"],
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"use": false,
"givesingle": false,
"drop": true,
"gender": "it",
"article": "it",
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"exitslistprefix": "You can go",
"contentsprefix": "containing",
"description": "",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"usedefaultprefix": true,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_usegive": false,
"feature_container": false,
"feature_switchable": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} }
};
elementsNameMap["slippers"] = _obj487;
allObjects.push(_obj487);
objectsNameMap["slippers"] = _obj487;
_obj488 = {
"elementtype": "object",
"name": "computer",
"parent": _obj482,
"type": "object",
"look": "Your Mac sits on top of a desk in your office area.",
"useindividualverblist": true,
"searchgoogle": "You do a search for \"Amanda\". Much like earlier, this didn't give you any good results.",
"mixtape": function() { OutputText ("You open some sound editing programs, turn on the mic and rap a sick beat.<br/><br/>You get lost in the rhythm...<br/><br/>Well, now you're dropping a mix tape in 2017, but you haven't solved this puzzle."); },
"searchtwitter": function() { OutputText ("You remember that you know Amanda's Twitter information.<br/><br/>You head over to her page and start scrolling through tweets.<br/><br/>Eventually, you see that she is, in fact, a drummer. A little searching later, you end up at a Myspace page for her old band, \"Mourning Sickness\".<br/><br/>");
picture ("rsz_ms.jpg");
OutputText ("<br/><br/>The page is riddled with girl power. You click through a few of their photos. As you click on a photo of Amanda jamming out at a show, the screen fades to two words;<br/><br/>\"Hello Amy\"<br/><br/>... you got this."); },
"_js_name": "_obj488",
"_types": ["defaultobject"],
"visible": true,
"displayverbs": ["Look at", "Take"],
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"use": false,
"givesingle": false,
"drop": true,
"gender": "it",
"article": "it",
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"exitslistprefix": "You can go",
"contentsprefix": "containing",
"description": "",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"usedefaultprefix": true,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_usegive": false,
"feature_container": false,
"feature_switchable": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} }
};
elementsNameMap["computer"] = _obj488;
allObjects.push(_obj488);
objectsNameMap["computer"] = _obj488;
_obj489 = {
"elementtype": "object",
"name": "k74",
"type": "command",
"anonymous": true,
"property": "searchtwitter",
"isverb": true,
"pattern": "^search twitter (?<object>.*)$",
"defaultexpression": "\"You can't search twitter \" + object.article + \".\"",
"_js_name": "_obj489",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["k74"] = _obj489;
allCommands.push(_obj489);
objectsNameMap["k74"] = _obj489;
_obj490 = {
"elementtype": "object",
"name": "k75",
"type": "command",
"anonymous": true,
"property": "mixtape",
"isverb": true,
"pattern": "^mixtape (?<object>.*)$",
"defaultexpression": "\"You can't mixtape \" + object.article + \".\"",
"_js_name": "_obj490",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["k75"] = _obj490;
allCommands.push(_obj490);
objectsNameMap["k75"] = _obj490;
_obj491 = {
"elementtype": "object",
"name": "k76",
"type": "command",
"anonymous": true,
"property": "squish",
"isverb": true,
"pattern": "^squish (?<object>.*)$",
"defaultexpression": "\"You can't squish \" + object.article + \".\"",
"_js_name": "_obj491",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["k76"] = _obj491;
allCommands.push(_obj491);
objectsNameMap["k76"] = _obj491;
_obj492 = {
"elementtype": "object",
"name": "k77",
"type": "command",
"anonymous": true,
"property": "hop",
"isverb": true,
"pattern": "^hop (?<object>.*)$",
"defaultexpression": "\"You can't hop \" + object.article + \".\"",
"_js_name": "_obj492",
"_types": ["defaultverb", "defaultcommand"],
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function(parameters) { var object = parameters['object'];
if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} }
};
elementsNameMap["k77"] = _obj492;
allCommands.push(_obj492);
objectsNameMap["k77"] = _obj492;
_obj493 = {
"elementtype": "type",
"name": "defaultverb",
"separator": "with; using",
"multiobjectmenu": "With which object?",
"multiobjectdefault": "That doesn't work.",
"multiobjectmenuempty": "There are no objects available to do that with.",
"script": function() { if (!(IsDefined("object2"))) {
var object2 = null;
}
switch (overloadedFunctions.TypeOf(object, this.property)) {
case "script":
if (object2 == null) {
runscriptattribute2 (object, this.property);
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "string":
if (object2 == null) {
OutputText (GetString(object, this.property));
}
else {
OutputText (this.multiobjectdefault);
}
break;
case "scriptdictionary":
if (object2 != null) {
HandleMultiVerb (object, this.property, object2, this.multiobjectdefault);
}
else {
var menu = NewStringDictionary();
var objectlist = ListCombine (ScopeReachableInventory(), ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
if (ListCount(candidates) == 0) {
OutputText (this.multiobjectmenuempty);
}
else {
GenerateMenuChoices (menu, candidates);
set(_obj245.pov, "multiverb", this.property);
set(_obj245.pov, "multiverbobject", object);
set(_obj245.pov, "multiverbobjectdefault", this.multiobjectdefault);
ShowMenu (this.multiobjectmenu, menu, true, function (result) { if (result != null) {
HandleMultiVerb (_obj245.pov.multiverbobject, _obj245.pov.multiverb, GetObject(result), _obj245.pov.multiverbobjectdefault);
set(_obj245.pov, "multiverb", null);
set(_obj245.pov, "multiverbobject", null);
set(_obj245.pov, "multiverbobjectdefault", null);
} });
}
}
break;
case "null":
if (this.defaulttext != null) {
OutputText (this.defaulttext);
}
else if (this.defaulttemplate != null) {
OutputText (overloadedFunctions.DynamicTemplate(this.defaulttemplate, object));
}
else if (this.defaultexpression != null) {
var params = NewDictionary();
dictionaryadd (params, "object", object);
OutputText (overloadedFunctions.Eval(this.defaultexpression, params));
}
else {
error ("No verb response defined");
}
break;
default:
error ("No verb response defined");
} },
"_js_name": "_obj493",
"_types": []
};
elementsNameMap["defaultverb"] = _obj493;
allObjects.push(_obj493);
objectsNameMap["defaultverb"] = _obj493;
_obj494 = {
"elementtype": "type",
"name": "defaultgame",
"enablehyperlinks": true,
"echocommand": true,
"echohyperlinks": true,
"showdescriptiononenter": true,
"autodescription": true,
"defaultfont": "Georgia, serif",
"defaultfontsize": 12,
"defaultbackground": "White",
"defaultforeground": "Black",
"defaultlinkforeground": "Blue",
"backgroundimage": "",
"setbackgroundopacity": false,
"backgroundopacity": 0.5,
"menufont": "Arial",
"menufontsize": 9,
"menubackground": "White",
"menuforeground": "Black",
"menuhoverbackground": "LightGrey",
"menuhoverforeground": "Black",
"underlinehyperlinks": true,
"compassdirections": ["northwest", "north", "northeast", "west", "east", "southwest", "south", "southeast", "up", "down", "in", "out"],
"clearframe": true,
"timeelapsed": 0,
"appendobjectdescription": false,
"allobjects": ["all", "everything"],
"parserignoreprefixes": ["the", "a", "an"],
"displayroomdescriptiononstart": true,
"showpanes": true,
"showcommandbar": true,
"showlocation": true,
"setcustomwidth": false,
"customwidth": 950,
"setcustompadding": false,
"custompaddingtop": 30,
"custompaddingbottom": 0,
"custompaddingleft": 20,
"custompaddingright": 20,
"showborder": true,
"showscore": false,
"showhealth": false,
"showtitle": true,
"autodisplayverbs": true,
"autodescription_youarein": 1,
"autodescription_youcansee": 2,
"autodescription_youcango": 3,
"autodescription_description": 4,
"autodescription_youarein_useprefix": true,
"autodescription_youarein_newline": false,
"autodescription_youcansee_newline": false,
"autodescription_youcango_newline": false,
"autodescription_description_newline": false,
"changeroom_newline": true,
"command_newline": false,
"description": "",
"languageid": "en",
"gridmap": false,
"mapscale": 30,
"mapsize": 300,
"feature_lightdark": false,
"feature_pictureframe": false,
"feature_limitinventory": false,
"feature_asktell": false,
"deactivatecommandlinks": false,
"multiplecommands": false,
"publishfileextensions": "*.jpg;*.jpeg;*.png;*.gif;*.js;*.wav;*.mp3;*.htm;*.html;*.svg",
"changedpov": function(oldvalue) { InitPOV (oldvalue, _obj245.pov); },
"_js_name": "_obj494",
"_types": []
};
elementsNameMap["defaultgame"] = _obj494;
allObjects.push(_obj494);
objectsNameMap["defaultgame"] = _obj494;
_obj495 = {
"elementtype": "type",
"name": "theme_novella",
"setcustompadding": true,
"showborder": false,
"showpanes": false,
"showlocation": false,
"setcustomwidth": true,
"customwidth": 650,
"custompaddingtop": 60,
"_js_name": "_obj495",
"_types": []
};
elementsNameMap["theme_novella"] = _obj495;
allObjects.push(_obj495);
objectsNameMap["theme_novella"] = _obj495;
_obj496 = {
"elementtype": "type",
"name": "theme_retro",
"defaultbackground": "Black",
"defaultforeground": "White",
"defaultlinkforeground": "White",
"defaultfont": "'Lucida Console', Monaco, monospace",
"defaultwebfont": "Press Start 2P",
"menufontsize": 14,
"menufont": "'Lucida Console', Monaco, monospace",
"menubackground": "Black",
"menuforeground": "White",
"menuhoverbackground": "GreenYellow",
"_js_name": "_obj496",
"_types": []
};
elementsNameMap["theme_retro"] = _obj496;
allObjects.push(_obj496);
objectsNameMap["theme_retro"] = _obj496;
_obj497 = {
"elementtype": "type",
"name": "theme_typewriter",
"setcustompadding": true,
"showborder": false,
"showpanes": false,
"showlocation": false,
"setcustomwidth": true,
"customwidth": 650,
"custompaddingtop": 60,
"defaultfont": "'Courier New', Courier, monospace",
"defaultwebfont": "Special Elite",
"_js_name": "_obj497",
"_types": []
};
elementsNameMap["theme_typewriter"] = _obj497;
allObjects.push(_obj497);
objectsNameMap["theme_typewriter"] = _obj497;
_obj498 = {
"elementtype": "type",
"name": "theme_hotdogstand",
"defaultbackground": "Red",
"defaultforeground": "Yellow",
"defaultlinkforeground": "Yellow",
"defaultfont": "'Comic Sans MS', cursive, sans-serif",
"menufontsize": 14,
"menufont": "Impact, Charcoal, sans-serif",
"menubackground": "Red",
"menuforeground": "Yellow",
"menuhoverbackground": "Black",
"menuhoverforeground": "Yellow",
"_js_name": "_obj498",
"_types": []
};
elementsNameMap["theme_hotdogstand"] = _obj498;
allObjects.push(_obj498);
objectsNameMap["theme_hotdogstand"] = _obj498;
_obj499 = {
"elementtype": "type",
"name": "defaultobject",
"visible": true,
"displayverbs": ["Look at", "Take"],
"inventoryverbs": ["Look at", "Use", "Drop"],
"take": false,
"use": false,
"givesingle": false,
"drop": true,
"gender": "it",
"article": "it",
"isopen": false,
"open": false,
"close": false,
"container": false,
"descprefix": "You are in",
"objectslistprefix": "You can see",
"exitslistprefix": "You can go",
"contentsprefix": "containing",
"description": "",
"scenery": false,
"hidechildren": false,
"listchildren": false,
"usedefaultprefix": true,
"volume": 0,
"dark": false,
"lightstrength": "",
"darklevel": false,
"grid_width": 1,
"grid_length": 1,
"grid_fill": "White",
"grid_border": "Black",
"grid_borderwidth": 1,
"grid_bordersides": 15,
"grid_render": false,
"grid_label": "",
"grid_parent_offset_auto": true,
"grid_parent_offset_x": 0,
"grid_parent_offset_y": 0,
"pov_alias": "me",
"pov_alt": ["myself", "self"],
"pov_look": "Looking good.",
"pov_gender": "you",
"pov_article": "yourself",
"feature_usegive": false,
"feature_container": false,
"feature_switchable": false,
"feature_edible": false,
"feature_player": false,
"feature_lightdark": false,
"changedparent": function(oldvalue) { if (_obj245.pov == this) {
if (IsDefined("oldvalue")) {
OnEnterRoom (oldvalue);
}
else {
OnEnterRoom (null);
}
if (_obj245.gridmap) {
MergePOVCoordinates();
}
} },
"changedisopen": function(oldvalue) { if (this.isopen && HasScript(this, "onopen")) {
runscriptattribute2 (this, "onopen");
}
if (!(this.isopen )&& HasScript(this, "onclose")) {
runscriptattribute2 (this, "onclose");
} },
"changedlocked": function(oldvalue) { if (this.locked && HasScript(this, "onlock")) {
runscriptattribute2 (this, "onlock");
}
if (!(this.locked )&& HasScript(this, "onunlock")) {
runscriptattribute2 (this, "onunlock");
} },
"changedswitchedon": function(oldvalue) { if (this.switchedon && HasScript(this, "onswitchon")) {
runscriptattribute2 (this, "onswitchon");
}
if (!(this.switchedon )&& HasScript(this, "onswitchoff")) {
runscriptattribute2 (this, "onswitchoff");
} },
"_js_name": "_obj499",
"_types": []
};
elementsNameMap["defaultobject"] = _obj499;
allObjects.push(_obj499);
objectsNameMap["defaultobject"] = _obj499;
_obj500 = {
"elementtype": "type",
"name": "defaultexit",
"displayverbs": ["Go to"],
"visible": true,
"scenery": false,
"locked": false,
"lockmessage": "That way is locked.",
"lookonly": false,
"runscript": false,
"lightstrength": "",
"grid_length": 1,
"grid_render": false,
"grid_offset_x": 0,
"grid_offset_y": 0,
"_js_name": "_obj500",
"_types": []
};
elementsNameMap["defaultexit"] = _obj500;
allObjects.push(_obj500);
objectsNameMap["defaultexit"] = _obj500;
_obj501 = {
"elementtype": "type",
"name": "direction",
"displayverbs": ["Go"],
"_js_name": "_obj501",
"_types": []
};
elementsNameMap["direction"] = _obj501;
allObjects.push(_obj501);
objectsNameMap["direction"] = _obj501;
_obj502 = {
"elementtype": "type",
"name": "compassdirection",
"prefix": "",
"suffix": "",
"_js_name": "_obj502",
"_types": ["direction"],
"displayverbs": ["Go"]
};
elementsNameMap["compassdirection"] = _obj502;
allObjects.push(_obj502);
objectsNameMap["compassdirection"] = _obj502;
_obj503 = {
"elementtype": "type",
"name": "updowndirection",
"prefix": "",
"suffix": "",
"_js_name": "_obj503",
"_types": ["direction"],
"displayverbs": ["Go"]
};
elementsNameMap["updowndirection"] = _obj503;
allObjects.push(_obj503);
objectsNameMap["updowndirection"] = _obj503;
_obj504 = {
"elementtype": "type",
"name": "inoutdirection",
"prefix": "",
"suffix": "",
"_js_name": "_obj504",
"_types": ["direction"],
"displayverbs": ["Go"]
};
elementsNameMap["inoutdirection"] = _obj504;
allObjects.push(_obj504);
objectsNameMap["inoutdirection"] = _obj504;
_obj505 = {
"elementtype": "type",
"name": "northwestdirection",
"alias": "northwest",
"alt": ["nw"],
"_js_name": "_obj505",
"_types": ["compassdirection"],
"prefix": "",
"suffix": "",
"displayverbs": ["Go"]
};
elementsNameMap["northwestdirection"] = _obj505;
allObjects.push(_obj505);
objectsNameMap["northwestdirection"] = _obj505;
_obj506 = {
"elementtype": "type",
"name": "northdirection",
"alias": "north",
"alt": ["n"],
"_js_name": "_obj506",
"_types": ["compassdirection"],
"prefix": "",
"suffix": "",
"displayverbs": ["Go"]
};
elementsNameMap["northdirection"] = _obj506;
allObjects.push(_obj506);
objectsNameMap["northdirection"] = _obj506;
_obj507 = {
"elementtype": "type",
"name": "northeastdirection",
"alias": "northeast",
"alt": ["ne"],
"_js_name": "_obj507",
"_types": ["compassdirection"],
"prefix": "",
"suffix": "",
"displayverbs": ["Go"]
};
elementsNameMap["northeastdirection"] = _obj507;
allObjects.push(_obj507);
objectsNameMap["northeastdirection"] = _obj507;
_obj508 = {
"elementtype": "type",
"name": "westdirection",
"alias": "west",
"alt": ["w"],
"_js_name": "_obj508",
"_types": ["compassdirection"],
"prefix": "",
"suffix": "",
"displayverbs": ["Go"]
};
elementsNameMap["westdirection"] = _obj508;
allObjects.push(_obj508);
objectsNameMap["westdirection"] = _obj508;
_obj509 = {
"elementtype": "type",
"name": "eastdirection",
"alias": "east",
"alt": ["e"],
"_js_name": "_obj509",
"_types": ["compassdirection"],
"prefix": "",
"suffix": "",
"displayverbs": ["Go"]
};
elementsNameMap["eastdirection"] = _obj509;
allObjects.push(_obj509);
objectsNameMap["eastdirection"] = _obj509;
_obj510 = {
"elementtype": "type",
"name": "southwestdirection",
"alias": "southwest",
"alt": ["sw"],
"_js_name": "_obj510",
"_types": ["compassdirection"],
"prefix": "",
"suffix": "",
"displayverbs": ["Go"]
};
elementsNameMap["southwestdirection"] = _obj510;
allObjects.push(_obj510);
objectsNameMap["southwestdirection"] = _obj510;
_obj511 = {
"elementtype": "type",
"name": "southdirection",
"alias": "south",
"alt": ["s"],
"_js_name": "_obj511",
"_types": ["compassdirection"],
"prefix": "",
"suffix": "",
"displayverbs": ["Go"]
};
elementsNameMap["southdirection"] = _obj511;
allObjects.push(_obj511);
objectsNameMap["southdirection"] = _obj511;
_obj512 = {
"elementtype": "type",
"name": "southeastdirection",
"alias": "southeast",
"alt": ["se"],
"_js_name": "_obj512",
"_types": ["compassdirection"],
"prefix": "",
"suffix": "",
"displayverbs": ["Go"]
};
elementsNameMap["southeastdirection"] = _obj512;
allObjects.push(_obj512);
objectsNameMap["southeastdirection"] = _obj512;
_obj513 = {
"elementtype": "type",
"name": "updirection",
"alias": "up",
"alt": ["u"],
"_js_name": "_obj513",
"_types": ["updowndirection"],
"prefix": "",
"suffix": "",
"displayverbs": ["Go"]
};
elementsNameMap["updirection"] = _obj513;
allObjects.push(_obj513);
objectsNameMap["updirection"] = _obj513;
_obj514 = {
"elementtype": "type",
"name": "downdirection",
"alias": "down",
"alt": ["d"],
"_js_name": "_obj514",
"_types": ["updowndirection"],
"prefix": "",
"suffix": "",
"displayverbs": ["Go"]
};
elementsNameMap["downdirection"] = _obj514;
allObjects.push(_obj514);
objectsNameMap["downdirection"] = _obj514;
_obj515 = {
"elementtype": "type",
"name": "indirection",
"alias": "in",
"alt": [""],
"_js_name": "_obj515",
"_types": ["inoutdirection"],
"prefix": "",
"suffix": "",
"displayverbs": ["Go"]
};
elementsNameMap["indirection"] = _obj515;
allObjects.push(_obj515);
objectsNameMap["indirection"] = _obj515;
_obj516 = {
"elementtype": "type",
"name": "outdirection",
"alias": "out",
"alt": ["o"],
"_js_name": "_obj516",
"_types": ["inoutdirection"],
"prefix": "",
"suffix": "",
"displayverbs": ["Go"]
};
elementsNameMap["outdirection"] = _obj516;
allObjects.push(_obj516);
objectsNameMap["outdirection"] = _obj516;
_obj517 = {
"elementtype": "type",
"name": "defaultcommand",
"pattern": "^$",
"_js_name": "_obj517",
"_types": []
};
elementsNameMap["defaultcommand"] = _obj517;
allObjects.push(_obj517);
objectsNameMap["defaultcommand"] = _obj517;
_obj518 = {
"elementtype": "type",
"name": "male",
"displayverbs": ["Look at", "Speak to"],
"gender": "he",
"article": "him",
"_js_name": "_obj518",
"_types": []
};
elementsNameMap["male"] = _obj518;
allObjects.push(_obj518);
objectsNameMap["male"] = _obj518;
_obj519 = {
"elementtype": "type",
"name": "namedmale",
"usedefaultprefix": false,
"_js_name": "_obj519",
"_types": ["male"],
"displayverbs": ["Look at", "Speak to"],
"gender": "he",
"article": "him"
};
elementsNameMap["namedmale"] = _obj519;
allObjects.push(_obj519);
objectsNameMap["namedmale"] = _obj519;
_obj520 = {
"elementtype": "type",
"name": "female",
"displayverbs": ["Look at", "Speak to"],
"gender": "she",
"article": "her",
"_js_name": "_obj520",
"_types": []
};
elementsNameMap["female"] = _obj520;
allObjects.push(_obj520);
objectsNameMap["female"] = _obj520;
_obj521 = {
"elementtype": "type",
"name": "namedfemale",
"usedefaultprefix": false,
"_js_name": "_obj521",
"_types": ["female"],
"displayverbs": ["Look at", "Speak to"],
"gender": "she",
"article": "her"
};
elementsNameMap["namedfemale"] = _obj521;
allObjects.push(_obj521);
objectsNameMap["namedfemale"] = _obj521;
_obj522 = {
"elementtype": "type",
"name": "plural",
"gender": "they",
"article": "them",
"_js_name": "_obj522",
"_types": []
};
elementsNameMap["plural"] = _obj522;
allObjects.push(_obj522);
objectsNameMap["plural"] = _obj522;
_obj523 = {
"elementtype": "type",
"name": "maleplural",
"displayverbs": ["Look at", "Speak to"],
"gender": "they",
"article": "them",
"_js_name": "_obj523",
"_types": []
};
elementsNameMap["maleplural"] = _obj523;
allObjects.push(_obj523);
objectsNameMap["maleplural"] = _obj523;
_obj524 = {
"elementtype": "type",
"name": "femaleplural",
"displayverbs": ["Look at", "Speak to"],
"gender": "they",
"article": "them",
"_js_name": "_obj524",
"_types": []
};
elementsNameMap["femaleplural"] = _obj524;
allObjects.push(_obj524);
objectsNameMap["femaleplural"] = _obj524;
_obj525 = {
"elementtype": "type",
"name": "openable",
"open": true,
"close": true,
"displayverbs": ["Open", "Close"],
"_js_name": "_obj525",
"_types": []
};
elementsNameMap["openable"] = _obj525;
allObjects.push(_obj525);
objectsNameMap["openable"] = _obj525;
_obj526 = {
"elementtype": "type",
"name": "container_base",
"container": true,
"_js_name": "_obj526",
"_types": []
};
elementsNameMap["container_base"] = _obj526;
allObjects.push(_obj526);
objectsNameMap["container_base"] = _obj526;
_obj527 = {
"elementtype": "type",
"name": "container_closed",
"open": true,
"close": true,
"displayverbs": ["Open", "Close"],
"_js_name": "_obj527",
"_types": ["container_base"],
"container": true
};
elementsNameMap["container_closed"] = _obj527;
allObjects.push(_obj527);
objectsNameMap["container_closed"] = _obj527;
_obj528 = {
"elementtype": "type",
"name": "container_open",
"isopen": true,
"open": true,
"close": true,
"displayverbs": ["Open", "Close"],
"_js_name": "_obj528",
"_types": ["container_base"],
"container": true
};
elementsNameMap["container_open"] = _obj528;
allObjects.push(_obj528);
objectsNameMap["container_open"] = _obj528;
_obj529 = {
"elementtype": "type",
"name": "surface",
"isopen": true,
"transparent": true,
"contentsprefix": "on which there is",
"_js_name": "_obj529",
"_types": ["container_base"],
"container": true
};
elementsNameMap["surface"] = _obj529;
allObjects.push(_obj529);
objectsNameMap["surface"] = _obj529;
_obj530 = {
"elementtype": "type",
"name": "container",
"displayverbs": ["Open", "Close"],
"_js_name": "_obj530",
"_types": ["container_open"],
"isopen": true,
"open": true,
"close": true,
"container": true
};
elementsNameMap["container"] = _obj530;
allObjects.push(_obj530);
objectsNameMap["container"] = _obj530;
_obj531 = {
"elementtype": "type",
"name": "container_limited",
"maxobjects": 1,
"maxvolume": 100,
"addscript": function() { var activecontainer = this;
var correct = true;
while (DoesInherit(activecontainer, "container_base")) {
if (HasInt(activecontainer, "maxvolume")) {
if (GetVolume(object, true) + GetVolume(activecontainer, false) > activecontainer.maxvolume) {
var correct = false;
if (HasString(this, "containerfullmessage")) {
var message = this.containerfullmessage;
}
else {
var message = overloadedFunctions.DynamicTemplate("ContainerFull", this);
}
}
}
var activecontainer = activecontainer.parent;
}
var children = GetDirectChildren(this);
if (listcount(children) >= this.maxobjects) {
var correct = false;
if (HasString(this, "containerfullmessage")) {
var message = this.containerfullmessage;
}
else {
var message = overloadedFunctions.DynamicTemplate("MaxObjectsInContainer", this);
}
}
if (correct == false) {
OutputText (message);
}
else {
set(object, "parent", this);
OutputText (Template("Done"));
} },
"displayverbs": ["Open", "Close"],
"_js_name": "_obj531",
"_types": ["container"],
"isopen": true,
"open": true,
"close": true,
"container": true
};
elementsNameMap["container_limited"] = _obj531;
allObjects.push(_obj531);
objectsNameMap["container_limited"] = _obj531;
_obj533 = {
"elementtype": "type",
"name": "container_lockable",
"locked": true,
"nokeymessage": "You do not have the key.",
"unlockmessage": "Unlocked.",
"lockmessage": "Locked.",
"canlockopen": false,
"autoopen": true,
"autounlock": true,
"openscript": function() { if (this.locked) {
if (this.autounlock && AllKeysAvailable(this)) {
runscriptattribute2 (this, "unlock");
if (!(this.isopen)) {
OpenObject (this);
}
}
else {
OutputText (overloadedFunctions.DynamicTemplate("LockedObject", this));
}
}
else {
OpenObject (this);
} },
"closescript": function() { if (this.locked) {
OutputText (overloadedFunctions.DynamicTemplate("LockedObject", this));
}
else {
CloseObject (this);
} },
"lock": function() { if (this.locked) {
OutputText (overloadedFunctions.DynamicTemplate("AlreadyLocked", this));
}
else if (this.isopen && !(this.canlockopen)) {
OutputText (overloadedFunctions.DynamicTemplate("CannotLockOpen", this));
}
else {
if (AllKeysAvailable(this)) {
OutputText (this.lockmessage);
set(this, "locked", true);
}
else {
OutputText (this.nokeymessage);
}
} },
"unlock": function() { if (!(this.locked)) {
OutputText (overloadedFunctions.DynamicTemplate("AlreadyUnlocked", this));
}
else {
if (AllKeysAvailable(this)) {
OutputText (this.unlockmessage);
set(this, "locked", false);
if (this.autoopen && !(this.isopen)) {
TryOpenClose (true, this);
}
}
else {
OutputText (this.nokeymessage);
}
} },
"_js_name": "_obj533",
"_types": []
};
elementsNameMap["container_lockable"] = _obj533;
allObjects.push(_obj533);
objectsNameMap["container_lockable"] = _obj533;
_obj534 = {
"elementtype": "type",
"name": "defaultplayer",
"_js_name": "_obj534",
"_types": []
};
elementsNameMap["defaultplayer"] = _obj534;
allObjects.push(_obj534);
objectsNameMap["defaultplayer"] = _obj534;
_obj535 = {
"elementtype": "type",
"name": "switchable",
"switchedon": false,
"turnon": function() { if (ListContains(ScopeReachable(), this)) {
if (this.switchedon) {
OutputText (overloadedFunctions.DynamicTemplate("AlreadySwitchedOn", this));
}
else {
if (HasString(this, "switchonmsg")) {
OutputText (this.switchonmsg);
}
else {
OutputText (overloadedFunctions.DynamicTemplate("SwitchedOn", this));
}
set(this, "switchedon", true);
}
}
else {
OutputText (overloadedFunctions.DynamicTemplate("DefaultTurnOn", this));
} },
"turnoff": function() { if (ListContains(ScopeReachable(), this)) {
if (!(this.switchedon)) {
OutputText (overloadedFunctions.DynamicTemplate("AlreadySwitchedOff", this));
}
else {
if (HasString(this, "switchoffmsg")) {
OutputText (this.switchoffmsg);
}
else {
OutputText (overloadedFunctions.DynamicTemplate("SwitchedOff", this));
}
set(this, "switchedon", false);
}
}
else {
OutputText (overloadedFunctions.DynamicTemplate("DefaultTurnOff", this));
} },
"displayverbs": ["Switch on", "Switch off"],
"_js_name": "_obj535",
"_types": []
};
elementsNameMap["switchable"] = _obj535;
allObjects.push(_obj535);
objectsNameMap["switchable"] = _obj535;
_obj536 = {
"elementtype": "type",
"name": "edible",
"eathealth": 0,
"eat": function() { if (HasString(this, "eatmsg")) {
OutputText (this.eatmsg);
}
else {
OutputText (overloadedFunctions.DynamicTemplate("Eaten", this));
}
if (HasInt(_obj245.pov, "health")) {
set(_obj245.pov, "health", _obj245.pov.health + this.eathealth);
}
destroy (this.name); },
"displayverbs": ["Eat"],
"_js_name": "_obj536",
"_types": []
};
elementsNameMap["edible"] = _obj536;
allObjects.push(_obj536);
objectsNameMap["edible"] = _obj536;
_obj537 = {
"elementtype": "type",
"name": "gridborder_path_ew",
"grid_bordersides": 10,
"_js_name": "_obj537",
"_types": []
};
elementsNameMap["gridborder_path_ew"] = _obj537;
allObjects.push(_obj537);
objectsNameMap["gridborder_path_ew"] = _obj537;
_obj538 = {
"elementtype": "type",
"name": "gridborder_path_e",
"grid_bordersides": 11,
"_js_name": "_obj538",
"_types": []
};
elementsNameMap["gridborder_path_e"] = _obj538;
allObjects.push(_obj538);
objectsNameMap["gridborder_path_e"] = _obj538;
_obj539 = {
"elementtype": "type",
"name": "gridborder_path_w",
"grid_bordersides": 14,
"_js_name": "_obj539",
"_types": []
};
elementsNameMap["gridborder_path_w"] = _obj539;
allObjects.push(_obj539);
objectsNameMap["gridborder_path_w"] = _obj539;
_obj540 = {
"elementtype": "type",
"name": "gridborder_path_ns",
"grid_bordersides": 5,
"_js_name": "_obj540",
"_types": []
};
elementsNameMap["gridborder_path_ns"] = _obj540;
allObjects.push(_obj540);
objectsNameMap["gridborder_path_ns"] = _obj540;
_obj541 = {
"elementtype": "type",
"name": "gridborder_path_n",
"grid_bordersides": 7,
"_js_name": "_obj541",
"_types": []
};
elementsNameMap["gridborder_path_n"] = _obj541;
allObjects.push(_obj541);
objectsNameMap["gridborder_path_n"] = _obj541;
_obj542 = {
"elementtype": "type",
"name": "gridborder_path_s",
"grid_bordersides": 13,
"_js_name": "_obj542",
"_types": []
};
elementsNameMap["gridborder_path_s"] = _obj542;
allObjects.push(_obj542);
objectsNameMap["gridborder_path_s"] = _obj542;
function GetDefaultPrefix(obj)
{
if (Instr("aeiou", LCase(Left(GetDisplayAlias(obj), 1))) > 0) {
return ("an");
}
else {
return ("a");
}
}
function WriteVerb(obj, verb)
{
return (CapFirst(obj.gender) + " " + Conjugate(obj, verb));
}
function Conjugate(obj, verb)
{
var gender = obj.gender;
if (gender == "he" || gender == "she") {
var gender = "it";
}
switch (verb) {
case "be":
switch (gender) {
case "i":
return ("am");
break;
case "you":
return ("are");
break;
case "it":
return ("is");
break;
case "we":
return ("are");
break;
case "they":
return ("are");
break;
default:
return ("is");
}
break;
case "do":
switch (gender) {
case "i":
return ("do");
break;
case "you":
return ("do");
break;
case "it":
return ("does");
break;
case "we":
return ("do");
break;
case "they":
return ("do");
break;
default:
return ("do");
}
break;
default:
if (gender == "it") {
return (verb + "s");
}
else {
return (verb);
}
}
}
function ListObjectContents(object)
{
if (GetBoolean(object, "isopen") && GetBoolean(object, "listchildren")) {
if (GetBoolean(object, "hidechildren")) {
set(object, "hidechildren", false);
}
if (HasString(object, "listchildrenprefix")) {
var listprefix = object.listchildrenprefix;
}
else {
var listprefix = overloadedFunctions.DynamicTemplate("ObjectContains", object);
}
var list = FormatObjectList(listprefix, object, Template("And"), ".");
if (list != "") {
OutputText (list);
}
}
}
function DoTake(object, ismultiple)
{
var prefix = "";
if (ismultiple) {
var prefix = GetDisplayAlias(object) + ": ";
}
if (object.parent == _obj245.pov) {
OutputText (prefix + overloadedFunctions.DynamicTemplate("AlreadyTaken", object));
}
else if (!(ListContains(ScopeReachable(), object))) {
OutputText (prefix + overloadedFunctions.DynamicTemplate("ObjectNotOpen", GetBlockingObject(object)));
}
else {
var volume = 0;
var variable_continue = true;
var list_obj = GetAllChildObjects(_obj245.pov);
var list_obj_isarray = (Object.prototype.toString.call(list_obj) === '[object Array]');
for (var iterator_obj in list_obj) {
var obj = list_obj_isarray ? list_obj[iterator_obj] : iterator_obj;
if (list_obj_isarray || iterator_obj!="__dummyKey") { if (HasInt(obj, "volume")) {
var volume = volume + obj.volume;
} }
}
if (!(Contains(_obj245.pov, object))) {
var volume = volume + GetVolume(object,true);
}
if (HasInt(_obj245.pov, "maxvolume")) {
if (volume > _obj245.pov.maxvolume) {
var variable_continue = false;
if (HasString(_obj245.pov, "containerfullmessage")) {
var message = prefix + _obj245.pov.containerfullmessage;
}
else {
var message = prefix + overloadedFunctions.DynamicTemplate("FullInventory", object);
}
}
}
var children = GetDirectChildren(_obj245.pov);
if (HasInt(_obj245.pov, "maxobjects")) {
if (_obj245.pov.maxobjects > 0) {
if (ListCount(children) >= _obj245.pov.maxobjects) {
var variable_continue = false;
if (HasString(_obj245.pov, "containermaxobjects")) {
var message = prefix + _obj245.pov.containermaxobjects;
}
else {
var message = prefix + overloadedFunctions.DynamicTemplate("MaxObjectsInInventory", object);
}
}
}
}
if (variable_continue == false) {
OutputText (message);
}
else {
var found = true;
var takemsg = object.takemsg;
switch (overloadedFunctions.TypeOf(object, "take")) {
case "script":
if (ismultiple) {
OutputTextNoBr (prefix);
}
runscriptattribute2 (object, "take");
var takemsg = "";
break;
case "boolean":
if (object.take == true) {
set(object, "parent", _obj245.pov);
if (takemsg == null) {
var takemsg = overloadedFunctions.DynamicTemplate("TakeSuccessful", object);
}
}
else {
var found = false;
}
break;
case "string":
set(object, "parent", _obj245.pov);
var takemsg = object.take;
break;
default:
var found = false;
}
if (!(found )&& takemsg == null) {
var takemsg = overloadedFunctions.DynamicTemplate("TakeUnsuccessful", object);
}
if (LengthOf(takemsg) > 0) {
OutputText (prefix + takemsg);
}
if (HasScript(object, "ontake")) {
runscriptattribute2 (object, "ontake");
}
if (found && GetBoolean (object, "scenery") && object.parent == _obj245.pov) {
set(object, "scenery", false);
}
}
}
}
function DoDrop(object, ismultiple)
{
var prefix = "";
if (ismultiple) {
var prefix = GetDisplayAlias(object) + ": ";
}
if (!(ListContains(ScopeInventory(), object))) {
OutputText (prefix + overloadedFunctions.DynamicTemplate("NotCarrying", object));
}
else if (!(ListContains(ScopeReachable(), object))) {
OutputText (prefix + overloadedFunctions.DynamicTemplate("ObjectNotOpen", GetBlockingObject(object)));
}
else {
var found = true;
var dropmsg = object.dropmsg;
switch (overloadedFunctions.TypeOf(object, "drop")) {
case "script":
if (ismultiple) {
OutputTextNoBr (prefix);
}
runscriptattribute2 (object, "drop");
var dropmsg = "";
break;
case "boolean":
if (object.drop == true) {
set(object, "parent", _obj245.pov.parent);
if (dropmsg == null) {
var dropmsg = overloadedFunctions.DynamicTemplate("DropSuccessful", object);
}
}
else {
var found = false;
}
break;
case "string":
set(object, "parent", _obj245.pov.parent);
var dropmsg = object.drop;
break;
default:
var found = false;
}
if (!(found )&& dropmsg == null) {
var dropmsg = overloadedFunctions.DynamicTemplate("DropUnsuccessful", object);
}
if (LengthOf(dropmsg) > 0) {
OutputText (prefix + dropmsg);
}
if (HasScript(object, "ondrop")) {
runscriptattribute2 (object, "ondrop");
}
}
}
function CreateUseMenuList(object)
{
var objectlist = NewObjectList();
var objectlist = ScopeReachableInventory();
var objectlist = ListCombine (objectlist, ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = NewObjectList();
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
return (candidates);
}
function TryOpenClose(doopen, object)
{
if (doopen) {
var action = "open";
var scriptaction = "openscript";
}
else {
var action = "close";
var scriptaction = "closescript";
}
if (!(ListContains(ScopeReachable(), object))) {
OutputText (overloadedFunctions.DynamicTemplate("ObjectNotOpen", GetBlockingObject(object)));
}
else {
var found = false;
if (GetBoolean(object, action)) {
if (doopen) {
if (object.isopen) {
OutputText (overloadedFunctions.DynamicTemplate("AlreadyOpen", object));
}
else {
if (HasScript(object, scriptaction)) {
runscriptattribute2 (object, scriptaction);
}
else {
OpenObject (object);
}
}
}
else {
if (!(object.isopen)) {
OutputText (overloadedFunctions.DynamicTemplate("AlreadyClosed", object));
}
else {
if (HasScript(object, scriptaction)) {
runscriptattribute2 (object, scriptaction);
}
else {
CloseObject (object);
}
}
}
}
else {
if (doopen) {
OutputText (overloadedFunctions.DynamicTemplate("CantOpen", object));
}
else {
OutputText (overloadedFunctions.DynamicTemplate("CantClose", object));
}
}
}
}
function OpenObject(object)
{
if (HasString(object, "openmsg")) {
OutputText (object.openmsg);
}
else {
OutputText (overloadedFunctions.DynamicTemplate("OpenSuccessful", object));
}
set(object, "isopen", true);
ListObjectContents (object);
}
function CloseObject(object)
{
if (HasString(object, "closemsg")) {
OutputText (object.closemsg);
}
else {
OutputText (overloadedFunctions.DynamicTemplate("CloseSuccessful", object));
}
set(object, "isopen", false);
}
function CreateGiveMenuList(object)
{
var objectlist = NewObjectList();
var objectlist = ScopeReachableInventory();
var objectlist = ListCombine (objectlist, ScopeReachableNotHeld());
var excludelist = NewObjectList();
listadd (excludelist, _obj245.pov);
listadd (excludelist, object);
var candidates = NewObjectList();
var candidates = ListExclude(RemoveSceneryObjects(objectlist), excludelist);
return (candidates);
}
function HandleGiveTo(object1, object2)
{
var handled = false;
if (HasString(object2, "give")) {
OutputText (object2.give);
var handled = true;
}
else if (overloadedFunctions.TypeOf(object2, "give") == "scriptdictionary") {
if (DictionaryContains(object2.give, object1.name)) {
var parameters = NewObjectDictionary();
dictionaryadd (parameters, "this", object2);
dictionaryadd (parameters, "object", object1);
invoke (ScriptDictionaryItem(object2.give, object1.name), parameters);
var handled = true;
}
if (!(handled)) {
if (HasScript(object2, "giveanything")) {
var parameters = NewObjectDictionary();
dictionaryadd (parameters, "object", object1);
runscriptattribute3 (object2, "giveanything", parameters);
var handled = true;
}
}
}
if (!(handled)) {
if (HasString(object1, "giveto")) {
OutputText (object1.giveto);
var handled = true;
}
else if (overloadedFunctions.TypeOf(object1, "giveto") == "scriptdictionary") {
if (DictionaryContains(object1.giveto, object2.name)) {
var parameters = NewObjectDictionary();
dictionaryadd (parameters, "this", object1);
dictionaryadd (parameters, "object", object2);
invoke (ScriptDictionaryItem(object1.giveto, object2.name), parameters);
var handled = true;
}
else {
if (HasScript(object1, "givetoanything")) {
var parameters = NewObjectDictionary();
dictionaryadd (parameters, "object", object2);
runscriptattribute3 (object1, "givetoanything", parameters);
var handled = true;
}
}
}
}
if (!(handled)) {
OutputText (overloadedFunctions.DynamicTemplate("DefaultGive", object2, object1));
}
}
function HandleUseOn(object1, object2)
{
var handled = false;
if (HasString(object2, "useon")) {
OutputText (object2.useon);
var handled = true;
}
else if (overloadedFunctions.TypeOf(object2, "useon") == "scriptdictionary") {
if (DictionaryContains(object2.useon, object1.name)) {
var parameters = NewObjectDictionary();
dictionaryadd (parameters, "this", object2);
dictionaryadd (parameters, "object", object1);
invoke (ScriptDictionaryItem(object2.useon, object1.name), parameters);
var handled = true;
}
else {
if (HasScript(object2, "useanything")) {
var parameters = NewObjectDictionary();
dictionaryadd (parameters, "object", object1);
runscriptattribute3 (object2, "useanything", parameters);
var handled = true;
}
}
}
if (!(handled)) {
if (HasString(object1, "selfuseon")) {
OutputText (object1.selfuseon);
var handled = true;
}
else if (overloadedFunctions.TypeOf(object1, "selfuseon") == "scriptdictionary") {
if (DictionaryContains(object1.selfuseon, object2.name)) {
var parameters = NewObjectDictionary();
dictionaryadd (parameters, "this", object1);
dictionaryadd (parameters, "object", object2);
invoke (ScriptDictionaryItem(object1.selfuseon, object2.name), parameters);
var handled = true;
}
else {
if (HasScript(object1, "selfuseanything")) {
var parameters = NewObjectDictionary();
dictionaryadd (parameters, "object", object2);
runscriptattribute3 (object1, "selfuseanything", parameters);
var handled = true;
}
}
}
}
if (!(handled)) {
OutputText (overloadedFunctions.DynamicTemplate("DefaultUseOn", object2, object1));
}
}
function DoAskTell(object, text, property, defaultscript, defaulttemplate)
{
var handled = false;
var maxstrength = 0;
var match = null;
var text = LCase(text);
if (overloadedFunctions.TypeOf(object, property) == "scriptdictionary") {
var dictionary = GetAttribute(object, property);
var dictionary_isarray = (Object.prototype.toString.call(dictionary) === '[object Array]');
for (var iterator_keywords in dictionary) {
var keywords = dictionary_isarray ? dictionary[iterator_keywords] : iterator_keywords;
if (dictionary_isarray || iterator_keywords!="__dummyKey") { var strength = GetKeywordsMatchStrength(LCase(keywords), text);
if (strength >= maxstrength && strength>0) {
var match = ScriptDictionaryItem(dictionary, keywords);
var maxstrength = strength;
} }
}
if (match != null) {
var parameters = NewObjectDictionary();
dictionaryadd (parameters, "this", object);
invoke (match, parameters);
var handled = true;
}
}
if (!(handled)) {
if (HasScript(object, defaultscript)) {
runscriptattribute2 (object, defaultscript);
}
else {
OutputText (overloadedFunctions.DynamicTemplate(defaulttemplate, object));
}
}
}
function GetKeywordsMatchStrength(keywords, input)
{
var keywordlist = Split(keywords, " ");
var inputlist = Split(input, " ");
var strength = 0;
var inputlist_isarray = (Object.prototype.toString.call(inputlist) === '[object Array]');
for (var iterator_word in inputlist) {
var word = inputlist_isarray ? inputlist[iterator_word] : iterator_word;
if (inputlist_isarray || iterator_word!="__dummyKey") { var keywordlist_isarray = (Object.prototype.toString.call(keywordlist) === '[object Array]');
for (var iterator_keyword in keywordlist) {
var keyword = keywordlist_isarray ? keywordlist[iterator_keyword] : iterator_keyword;
if (keywordlist_isarray || iterator_keyword!="__dummyKey") { if (StartsWith(word, keyword)) {
var strength = strength + LengthOf(keyword);
} }
} }
}
return (strength);
}
function CompareNames(name, value, obj, fullmatches, partialmatches)
{
if (name == value) {
if (!(ListContains(fullmatches, obj))) {
listadd (fullmatches, obj);
}
}
else {
if (StartsWith(name, value)) {
if (!(ListContains(partialmatches, obj))) {
listadd (partialmatches, obj);
}
}
else {
if (Instr(name, " " + value) > 0) {
if (!(ListContains(partialmatches, obj))) {
listadd (partialmatches, obj);
}
}
}
}
}
function GenerateMenuChoices(dictionary, objects)
{
var objects_isarray = (Object.prototype.toString.call(objects) === '[object Array]');
for (var iterator_obj in objects) {
var obj = objects_isarray ? objects[iterator_obj] : iterator_obj;
if (objects_isarray || iterator_obj!="__dummyKey") { if (!(DictionaryContains(dictionary, obj.name))) {
dictionaryadd (dictionary, obj.name, GetDisplayAlias(obj));
} }
}
}
function ResolveName(variable, value, objtype)
{
var found = false;
if (_obj245.pov.commandmetadata != null) {
if (DictionaryContains(_obj245.pov.commandmetadata, value)) {
var result = GetObject(StringDictionaryItem(_obj245.pov.commandmetadata, value));
if (result != null) {
if (ListContains(ScopeVisible(), result)) {
var found = true;
return (result);
}
}
}
}
if (!(found)) {
var value = LCase(value);
var result = ResolveNameInternal(variable, value, objtype);
if (result != null) {
return (result);
}
else {
var _obj245_parserignoreprefixes_isarray = (Object.prototype.toString.call(_obj245.parserignoreprefixes) === '[object Array]');
for (var iterator_prefix in _obj245.parserignoreprefixes) {
var prefix = _obj245_parserignoreprefixes_isarray ? _obj245.parserignoreprefixes[iterator_prefix] : iterator_prefix;
if (_obj245_parserignoreprefixes_isarray || iterator_prefix!="__dummyKey") { if (StartsWith(value, prefix + " ")) {
var result = ResolveNameInternal(variable, Mid(value, LengthOf(prefix) + 1), objtype);
} }
}
if (result == null && LengthOf(variable) == 0 && !(GetBoolean(_obj245.pov, "currentcommandmultiobjectpending"))) {
UnresolvedCommand (value, _obj245.pov.currentcommandpendingvariable);
}
return (result);
}
}
}
function ResolveNameInternal(variable, value, objtype)
{
var fullmatches = NewObjectList();
var partialmatches = NewObjectList();
set(_obj245.pov, "currentcommandmultiobjectpending", false);
if (objtype == "object") {
var scope = ScopeVisible();
}
else if (objtype == "exit") {
var scope = ScopeExits();
}
var value = Trim(value);
var scope_isarray = (Object.prototype.toString.call(scope) === '[object Array]');
for (var iterator_obj in scope) {
var obj = scope_isarray ? scope[iterator_obj] : iterator_obj;
if (scope_isarray || iterator_obj!="__dummyKey") { var name = LCase(GetDisplayAlias(obj));
CompareNames (name, value, obj, fullmatches, partialmatches);
if (obj.alt != null) {
var obj_alt_isarray = (Object.prototype.toString.call(obj.alt) === '[object Array]');
for (var iterator_altname in obj.alt) {
var altname = obj_alt_isarray ? obj.alt[iterator_altname] : iterator_altname;
if (obj_alt_isarray || iterator_altname!="__dummyKey") { CompareNames (LCase(altname), value, obj, fullmatches, partialmatches); }
}
} }
}
if (objtype == "object" && _obj245.lastobjects != null) {
var _obj245_lastobjects_isarray = (Object.prototype.toString.call(_obj245.lastobjects) === '[object Array]');
for (var iterator_obj in _obj245.lastobjects) {
var obj = _obj245_lastobjects_isarray ? _obj245.lastobjects[iterator_obj] : iterator_obj;
if (_obj245_lastobjects_isarray || iterator_obj!="__dummyKey") { CompareNames (LCase(obj.article), value, obj, fullmatches, partialmatches);
CompareNames (LCase(obj.gender), value, obj, fullmatches, partialmatches); }
}
}
if (ListCount(fullmatches) == 1) {
return (ListItem(fullmatches, 0));
}
else if (ListCount(fullmatches) == 0 && ListCount(partialmatches) == 1) {
return (ListItem(partialmatches, 0));
}
else if (ListCount(fullmatches) + ListCount(partialmatches) == 0) {
return (null);
}
else {
var menu = NewStringDictionary();
GenerateMenuChoices (menu, fullmatches);
GenerateMenuChoices (menu, partialmatches);
if (LengthOf(variable) > 0) {
set(_obj245.pov, "currentcommandpendingvariable", variable);
ShowMenu (overloadedFunctions.DynamicTemplate("DisambiguateMenu", value), menu, true, function (result) { var varname = _obj245.pov.currentcommandpendingvariable;
set(_obj245.pov, "currentcommandpendingvariable", null);
if (result != null) {
AddToResolvedNames (varname, GetObject(result));
} });
}
else {
set(_obj245.pov, "currentcommandmultiobjectpending", true);
ShowMenu (overloadedFunctions.DynamicTemplate("DisambiguateMenu", value), menu, true, function (result) { if (result != null) {
listadd (_obj245.pov.currentcommandpendingobjectlist, GetObject(result));
ResolveNextNameListItem();
} });
}
return (null);
}
}
function ResolveNameList(value, scope, objtype)
{
set(_obj245.pov, "currentcommandpendingobjectlist", NewObjectList());
set(_obj245.pov, "currentcommandpendingobjectlistunresolved", NewStringList());
set(_obj245.pov, "currentcommandpendingobjectscope", scope);
set(_obj245.pov, "currentcommandpendingobjecttype", objtype);
var inputlist = Split(value, ",");
var inputlist_isarray = (Object.prototype.toString.call(inputlist) === '[object Array]');
for (var iterator_inputbase in inputlist) {
var inputbase = inputlist_isarray ? inputlist[iterator_inputbase] : iterator_inputbase;
if (inputlist_isarray || iterator_inputbase!="__dummyKey") { var inputlist2 = Split(inputbase, " " + Template("And") + " ");
var inputlist2_isarray = (Object.prototype.toString.call(inputlist2) === '[object Array]');
for (var iterator_input in inputlist2) {
var input = inputlist2_isarray ? inputlist2[iterator_input] : iterator_input;
if (inputlist2_isarray || iterator_input!="__dummyKey") { listadd (_obj245.pov.currentcommandpendingobjectlistunresolved, input); }
} }
}
ResolveNextNameListItem();
}
function ResolveNextNameListItem()
{
var resolvedall = false;
if (overloadedFunctions.TypeOf(_obj245.pov, "currentcommandpendingobjectlistunresolved") == "stringlist") {
var queuelength = ListCount(_obj245.pov.currentcommandpendingobjectlistunresolved);
if (queuelength > 0) {
var thisitem = Trim(StringListItem(_obj245.pov.currentcommandpendingobjectlistunresolved, 0));
if (queuelength == 1) {
set(_obj245.pov, "currentcommandpendingobjectlistunresolved", null);
}
else {
var newqueue = NewStringList();
for (var i = 1; i <= queuelength - 1; i++) {
listadd (newqueue, StringListItem(_obj245.pov.currentcommandpendingobjectlistunresolved, i));
}
set(_obj245.pov, "currentcommandpendingobjectlistunresolved", newqueue);
}
ResolveNameListItem (Trim(thisitem));
}
else {
var resolvedall = true;
}
}
else {
var resolvedall = true;
}
if (resolvedall) {
ResolveNameListItemFinished (_obj245.pov.currentcommandpendingobjectlist);
}
}
function ResolveNameListItem(value)
{
if (ListContains(_obj245.allobjects, value)) {
if (!(DictionaryContains(_obj245.pov.currentcommandresolvedelements, "multiple"))) {
dictionaryadd (_obj245.pov.currentcommandresolvedelements, "multiple", true);
}
ResolveNameListItemFinished (_obj245.pov.currentcommandpendingobjectscope);
}
else {
var object = ResolveName("", value, _obj245.pov.currentcommandpendingobjecttype);
if (object != null) {
if (!(ListContains(_obj245.pov.currentcommandpendingobjectlist, object))) {
listadd (_obj245.pov.currentcommandpendingobjectlist, object);
}
ResolveNextNameListItem();
}
}
}
function ResolveNameListItemFinished(result)
{
if (ListCount(result) > 1) {
if (!(DictionaryContains(_obj245.pov.currentcommandresolvedelements, "multiple"))) {
dictionaryadd (_obj245.pov.currentcommandresolvedelements, "multiple", true);
}
}
AddToResolvedNames (_obj245.pov.currentcommandpendingvariable, result);
}
function HandleCommand(command, metadata)
{
var handled = false;
if (_obj245.menucallback != null) {
if (HandleMenuTextResponse(command)) {
var handled = true;
}
else {
if (_obj245.menuallowcancel) {
ClearMenu();
}
else {
var handled = true;
}
}
}
if (!(handled)) {
StartTurnOutputSection();
if (StartsWith (command, "*")) {
OutputText ("");
OutputText (SafeXML (command));
}
else {
var shownlink = false;
if (_obj245.echocommand) {
if (metadata != null && _obj245.enablehyperlinks && _obj245.echohyperlinks) {
var metadata_isarray = (Object.prototype.toString.call(metadata) === '[object Array]');
for (var iterator_key in metadata) {
var key = metadata_isarray ? metadata[iterator_key] : iterator_key;
if (metadata_isarray || iterator_key!="__dummyKey") { if (EndsWith(command, key)) {
var objectname = StringDictionaryItem(metadata, key);
var object = GetObject(objectname);
if (object != null) {
OutputText ("");
OutputText ("&gt; " + Left(command, LengthOf(command) - LengthOf(key)) + "{object:" + object.name + "}");
var shownlink = true;
}
} }
}
}
if (!(shownlink)) {
OutputText ("");
OutputTextRaw ("&gt; " + SafeXML(command));
}
}
if (_obj245.command_newline) {
OutputText ("");
}
set(_obj245.pov, "commandmetadata", metadata);
if (_obj245.multiplecommands) {
var commands = Split(command, ".");
if (ListCount(commands) == 1) {
set(_obj245.pov, "commandqueue", null);
HandleSingleCommand (Trim(command));
}
else {
set(_obj245.pov, "commandqueue", commands);
HandleNextCommandQueueItem();
}
}
else {
set(_obj245.pov, "commandqueue", null);
HandleSingleCommand (Trim(command));
}
}
}
}
function HandleNextCommandQueueItem()
{
if (overloadedFunctions.TypeOf(_obj245.pov, "commandqueue") == "stringlist") {
var queuelength = ListCount(_obj245.pov.commandqueue);
if (queuelength > 0) {
var thiscommand = Trim(StringListItem(_obj245.pov.commandqueue, 0));
if (queuelength == 1) {
set(_obj245.pov, "commandqueue", null);
}
else {
var newqueue = NewStringList();
for (var i = 1; i <= queuelength - 1; i++) {
listadd (newqueue, StringListItem(_obj245.pov.commandqueue, i));
}
set(_obj245.pov, "commandqueue", newqueue);
}
if (LengthOf(thiscommand) > 0) {
HandleSingleCommand (thiscommand);
}
else {
HandleNextCommandQueueItem();
}
}
}
}
function HandleSingleCommand(command)
{
var candidates = NewObjectList();
var list_cmd = ScopeCommands();
var list_cmd_isarray = (Object.prototype.toString.call(list_cmd) === '[object Array]');
for (var iterator_cmd in list_cmd) {
var cmd = list_cmd_isarray ? list_cmd[iterator_cmd] : iterator_cmd;
if (list_cmd_isarray || iterator_cmd!="__dummyKey") { if (IsRegexMatch(cmd.pattern, command, cmd.name)) {
listadd (candidates, cmd);
} }
}
var maxstrength = -1;
var thiscommand = null;
var candidates_isarray = (Object.prototype.toString.call(candidates) === '[object Array]');
for (var iterator_candidate in candidates) {
var candidate = candidates_isarray ? candidates[iterator_candidate] : iterator_candidate;
if (candidates_isarray || iterator_candidate!="__dummyKey") { var strength = GetMatchStrength(candidate.pattern, command, candidate.name);
if (strength >= maxstrength) {
var skip = false;
if (thiscommand != null) {
if (thiscommand.parent != null && candidate.parent == null) {
var skip = true;
}
}
if (!(skip)) {
var thiscommand = candidate;
var maxstrength = strength;
}
} }
}
if (thiscommand == null) {
if (HasScript(_obj245, "unresolvedcommandhandler")) {
var params = NewDictionary();
dictionaryadd (params, "command", command);
runscriptattribute3 (_obj245, "unresolvedcommandhandler", params);
}
else {
OutputText (Template("UnrecognisedCommand"));
}
HandleNextCommandQueueItem();
}
else {
var varlist = Populate(thiscommand.pattern, command, thiscommand.name);
HandleSingleCommandPattern (command, thiscommand, varlist);
}
}
function FinishTurn()
{
RunTurnScripts();
UpdateStatusAttributes();
CheckDarkness();
UpdateObjectLinks();
}
function HandleSingleCommandPattern(command, thiscommand, varlist)
{
set(_obj245.pov, "currentcommand", command);
set(_obj245.pov, "currentcommandpattern", thiscommand);
set(_obj245.pov, "currentcommandvarlist", varlist);
set(_obj245.pov, "currentcommandvarlistqueue", NewStringList());
var varlist_isarray = (Object.prototype.toString.call(varlist) === '[object Array]');
for (var iterator_key in varlist) {
var key = varlist_isarray ? varlist[iterator_key] : iterator_key;
if (varlist_isarray || iterator_key!="__dummyKey") { listadd (_obj245.pov.currentcommandvarlistqueue, key); }
}
set(_obj245.pov, "currentcommandresolvedelements", NewDictionary());
set(_obj245.pov, "currentcommandresolvedobjects", NewObjectList());
set(_obj245.pov, "currentcommandunresolvedobject", null);
set(_obj245.pov, "currentcommandpendingvariable", null);
ResolveNextName();
}
function ResolveNextName()
{
var resolvedall = false;
var queuetype = overloadedFunctions.TypeOf(_obj245.pov, "currentcommandvarlistqueue");
if (queuetype == "stringlist") {
var queuelength = ListCount(_obj245.pov.currentcommandvarlistqueue);
if (queuelength > 0) {
var variable_var = StringListItem(_obj245.pov.currentcommandvarlistqueue, 0);
if (queuelength == 1) {
set(_obj245.pov, "currentcommandvarlistqueue", null);
}
else {
var newqueue = NewStringList();
for (var i = 1; i <= queuelength - 1; i++) {
listadd (newqueue, StringListItem(_obj245.pov.currentcommandvarlistqueue, i));
}
set(_obj245.pov, "currentcommandvarlistqueue", newqueue);
}
var value = StringDictionaryItem(_obj245.pov.currentcommandvarlist, variable_var);
if (value != "") {
var result = null;
var resolvinglist = false;
if (StartsWith(variable_var, "object")) {
if (HasDelegateImplementation(_obj245.pov.currentcommandpattern, "multiple")) {
set(_obj245.pov, "currentcommandpendingobjectlist", NewObjectList());
set(_obj245.pov, "currentcommandpendingvariable", variable_var);
ResolveNameList (value, RunDelegateFunction(_obj245.pov.currentcommandpattern, "multiple"), "object");
var resolvinglist = true;
}
else {
var result = ResolveName(variable_var, value, "object");
}
}
else if (StartsWith(variable_var, "exit")) {
var result = ResolveName(variable_var, value, "exit");
}
else if (StartsWith(variable_var, "text")) {
var result = StringDictionaryItem(_obj245.pov.currentcommandvarlist, variable_var);
}
else {
error ("Unhandled command variable '" + variable_var + "' - command variable names must begin with 'object', 'exit' or 'text'");
}
if (result == null) {
if ((!resolvinglist) && LengthOf(GetString(_obj245.pov, "currentcommandpendingvariable")) == 0) {
UnresolvedCommand (value, variable_var);
}
}
else {
AddToResolvedNames (variable_var, result);
}
}
else {
ResolveNextName();
}
}
else {
var resolvedall = true;
}
}
else if (queuetype == "null") {
var resolvedall = true;
}
else {
error ("Invalid queue type");
}
if (resolvedall) {
set(_obj245, "lastobjects", _obj245.pov.currentcommandresolvedobjects);
if (!(DictionaryContains(_obj245.pov.currentcommandresolvedelements, "multiple"))) {
dictionaryadd (_obj245.pov.currentcommandresolvedelements, "multiple", false);
}
if (!(GetBoolean(_obj245.pov.currentcommandpattern, "isundo"))) {
if (LengthOf(_obj245.pov.currentcommand) > 0) {
starttransaction (_obj245.pov.currentcommand);
}
}
if (!(GetBoolean(_obj245.pov.currentcommandpattern, "isoops"))) {
set(_obj245, "unresolvedcommand", null);
set(_obj245, "unresolvedcommandvarlist", null);
set(_obj245, "unresolvedcommandkey", null);
}
if (HasScript(_obj245.pov.currentcommandpattern, "script")) {
runscriptattribute3 (_obj245.pov.currentcommandpattern, "script", _obj245.pov.currentcommandresolvedelements);
}
HandleNextCommandQueueItem();
}
}
function AddToResolvedNames(variable_var, result)
{
if (overloadedFunctions.TypeOf(result) == "object") {
if (result.type == "object") {
listadd (_obj245.pov.currentcommandresolvedobjects, result);
}
}
else if (overloadedFunctions.TypeOf(result) == "objectlist") {
var result_isarray = (Object.prototype.toString.call(result) === '[object Array]');
for (var iterator_obj in result) {
var obj = result_isarray ? result[iterator_obj] : iterator_obj;
if (result_isarray || iterator_obj!="__dummyKey") { if (obj.type == "object") {
listadd (_obj245.pov.currentcommandresolvedobjects, obj);
} }
}
}
dictionaryadd (_obj245.pov.currentcommandresolvedelements, variable_var, result);
ResolveNextName();
}
function UnresolvedCommand(objectname, varname)
{
var unresolvedobject = objectname;
var unresolvedkey = varname;
if (HasString(_obj245.pov.currentcommandpattern, "unresolved")) {
if (ListCount(_obj245.pov.currentcommandvarlist) > 1) {
OutputText (_obj245.pov.currentcommandpattern.unresolved + " (" + unresolvedobject + ")");
}
else {
OutputText (_obj245.pov.currentcommandpattern.unresolved);
}
}
else {
if (ListCount(_obj245.pov.currentcommandvarlist) > 1) {
OutputText (Template("UnresolvedObject") + " (" + unresolvedobject + ")");
}
else {
OutputText (Template("UnresolvedObject"));
}
}
set(_obj245, "unresolvedcommand", _obj245.pov.currentcommandpattern);
set(_obj245, "unresolvedcommandvarlist", _obj245.pov.currentcommandvarlist);
set(_obj245, "unresolvedcommandkey", unresolvedkey);
}
function HandleMultiVerb(object, property, object2, variable_default)
{
var dictionary = GetAttribute(object, property);
if (DictionaryContains(dictionary, object2.name)) {
var parameters = NewDictionary();
dictionaryadd (parameters, "this", object);
dictionaryadd (parameters, "object", object2);
invoke (ScriptDictionaryItem(dictionary, object2.name), parameters);
}
else {
var parameters = NewDictionary();
dictionaryadd (parameters, "this", object);
dictionaryadd (parameters, "object", object2);
if (DictionaryContains(dictionary, "default")) {
invoke (ScriptDictionaryItem(dictionary, "default"), parameters);
}
else {
OutputText (variable_default);
}
}
}
function GetPlacesObjectsList()
{
return (ListExclude(ScopeVisibleNotHeldNotScenery(), _obj245.pov));
}
function GetExitsList()
{
return (RemoveLookOnlyExits(RemoveSceneryObjects(ScopeExits())));
}
function ScopeInventory()
{
var result = NewObjectList();
var list_obj = GetAllChildObjects(_obj245.pov);
var list_obj_isarray = (Object.prototype.toString.call(list_obj) === '[object Array]');
for (var iterator_obj in list_obj) {
var obj = list_obj_isarray ? list_obj[iterator_obj] : iterator_obj;
if (list_obj_isarray || iterator_obj!="__dummyKey") { if (ContainsVisible(_obj245.pov, obj)) {
listadd (result, obj);
} }
}
return (result);
}
function ScopeReachableInventory()
{
var result = NewObjectList();
var list_obj = GetAllChildObjects(_obj245.pov);
var list_obj_isarray = (Object.prototype.toString.call(list_obj) === '[object Array]');
for (var iterator_obj in list_obj) {
var obj = list_obj_isarray ? list_obj[iterator_obj] : iterator_obj;
if (list_obj_isarray || iterator_obj!="__dummyKey") { if (ContainsReachable(_obj245.pov, obj)) {
listadd (result, obj);
} }
}
return (result);
}
function ScopeVisibleNotHeld()
{
return (ScopeVisibleNotHeldForRoom(_obj245.pov.parent));
}
function ScopeVisibleNotHeldForRoom(room)
{
if (room == _obj245.pov.parent) {
var result = ListCombine(ScopeReachableNotHeldForRoom(room), ScopeVisibleNotReachableForRoom(room));
listadd (result, _obj245.pov);
return (result);
}
else {
return (ListCombine(ScopeReachableNotHeldForRoom(room), ScopeVisibleNotReachableForRoom(room)));
}
}
function ScopeVisibleNotHeldNotScenery()
{
return (ScopeVisibleNotHeldNotSceneryForRoom(_obj245.pov.parent));
}
function ScopeVisibleNotHeldNotSceneryForRoom(room)
{
return (RemoveSceneryObjects(ScopeVisibleNotHeldForRoom(room)));
}
function ScopeReachable()
{
return (ScopeReachableForRoom(_obj245.pov.parent));
}
function ScopeReachableForRoom(room)
{
if (room == _obj245.pov.parent) {
var result = ListCombine(ScopeReachableNotHeldForRoom(room), ScopeReachableInventory());
listadd (result, _obj245.pov);
}
else {
var result = ScopeReachableNotHeldForRoom(room);
}
return (result);
}
function ScopeVisibleNotReachable()
{
return (ScopeVisibleNotReachableForRoom(_obj245.pov.parent));
}
function ScopeVisibleNotReachableForRoom(room)
{
var result = NewObjectList();
var exclude = ScopeReachableForRoom(room);
listadd (exclude, _obj245.pov);
var newParent = GetNonTransparentParent(room);
var list_obj = GetAllChildObjects(newParent);
var list_obj_isarray = (Object.prototype.toString.call(list_obj) === '[object Array]');
for (var iterator_obj in list_obj) {
var obj = list_obj_isarray ? list_obj[iterator_obj] : iterator_obj;
if (list_obj_isarray || iterator_obj!="__dummyKey") { if (ContainsVisible(newParent, obj) && !(ListContains(exclude, obj))) {
listadd (result, obj);
} }
}
return (result);
}
function GetNonTransparentParent(room)
{
if (GetBoolean(room, "transparent")) {
if (room.parent == null) {
return (room);
}
else {
return (GetNonTransparentParent(room.parent));
}
}
else {
return (room);
}
}
function ScopeReachableNotHeld()
{
return (ScopeReachableNotHeldForRoom(_obj245.pov.parent));
}
function ScopeVisibleLightsource(lightstrength)
{
var result = ScopeVisible();
var lightobjects = NewObjectList();
var result_isarray = (Object.prototype.toString.call(result) === '[object Array]');
for (var iterator_obj in result) {
var obj = result_isarray ? result[iterator_obj] : iterator_obj;
if (result_isarray || iterator_obj!="__dummyKey") { if (GetBoolean(obj, "lightsource") && GetString(obj, "lightstrength") == lightstrength) {
listadd (lightobjects, obj);
} }
}
var exits = ScopeExits();
var exits_isarray = (Object.prototype.toString.call(exits) === '[object Array]');
for (var iterator_obj in exits) {
var obj = exits_isarray ? exits[iterator_obj] : iterator_obj;
if (exits_isarray || iterator_obj!="__dummyKey") { if (GetBoolean(obj, "lightsource") && GetString(obj, "lightstrength") == lightstrength) {
listadd (lightobjects, obj);
} }
}
return (lightobjects);
}
function ScopeReachableNotHeldForRoom(room)
{
var result = NewObjectList();
var list_obj = GetAllChildObjects(room);
var list_obj_isarray = (Object.prototype.toString.call(list_obj) === '[object Array]');
for (var iterator_obj in list_obj) {
var obj = list_obj_isarray ? list_obj[iterator_obj] : iterator_obj;
if (list_obj_isarray || iterator_obj!="__dummyKey") { if (ContainsReachable(room, obj) && obj != _obj245.pov && !(Contains(_obj245.pov, obj))) {
listadd (result, obj);
} }
}
return (result);
}
function ScopeVisible()
{
return (ScopeVisibleForRoom(_obj245.pov.parent));
}
function ScopeVisibleForRoom(room)
{
if (room == _obj245.pov.parent) {
return (ListCombine(ScopeVisibleNotHeldForRoom(room), ScopeInventory()));
}
else {
return (ScopeVisibleNotHeldForRoom(room));
}
}
function ScopeExits()
{
return (ScopeExitsForRoom(_obj245.pov.parent));
}
function ScopeExitsForRoom(room)
{
var result = NewObjectList();
var list_exit = AllExits();
var list_exit_isarray = (Object.prototype.toString.call(list_exit) === '[object Array]');
for (var iterator_exit in list_exit) {
var exit = list_exit_isarray ? list_exit[iterator_exit] : iterator_exit;
if (list_exit_isarray || iterator_exit!="__dummyKey") { if (exit.parent == room) {
if (exit.visible) {
if (GetBoolean(room, "darklevel")) {
if (GetBoolean(exit, "lightsource")) {
listadd (result, exit);
}
}
else {
listadd (result, exit);
}
}
} }
}
return (result);
}
function ScopeCommands()
{
var result = NewObjectList();
var list_command = AllCommands();
var list_command_isarray = (Object.prototype.toString.call(list_command) === '[object Array]');
for (var iterator_command in list_command) {
var command = list_command_isarray ? list_command[iterator_command] : iterator_command;
if (list_command_isarray || iterator_command!="__dummyKey") { if (command.parent == null || command.parent == _obj245.pov.parent) {
listadd (result, command);
} }
}
return (result);
}
function GetBlockingObject(obj)
{
var result = null;
var list_obj = ListParents(obj);
var list_obj_isarray = (Object.prototype.toString.call(list_obj) === '[object Array]');
for (var iterator_obj in list_obj) {
var obj = list_obj_isarray ? list_obj[iterator_obj] : iterator_obj;
if (list_obj_isarray || iterator_obj!="__dummyKey") { if (result == null && !(CanReachThrough(obj))) {
var result = obj;
} }
}
return (result);
}
function ListParents(obj)
{
var result = NewObjectList();
if (obj.parent != null) {
var parent_as_list = NewObjectList();
listadd (parent_as_list, obj.parent);
var result = ListCombine(parent_as_list, ListParents(obj.parent));
}
return (result);
}
function ContainsVisible(parentObj, searchObj)
{
return (ContainsAccessible(parentObj, searchObj, false));
}
function ContainsReachable(parentObj, searchObj)
{
return (ContainsAccessible(parentObj, searchObj, true));
}
function ContainsAccessible(parentObj, searchObj, onlyReachable)
{
if (!(HasObject(searchObj, "parent"))) {
return (false);
}
else if (!(searchObj.visible)) {
return (false);
}
else if (GetBoolean(parentObj, "darklevel") && !(GetBoolean(searchObj, "lightsource"))) {
return (false);
}
else {
if (searchObj.parent == null) {
return (false);
}
else if (searchObj.parent == parentObj) {
return (true);
}
else {
if (onlyReachable) {
var canAdd = CanReachThrough(searchObj.parent);
}
else {
var canAdd = CanSeeThrough(searchObj.parent);
}
if (canAdd) {
return (ContainsAccessible(parentObj, searchObj.parent, onlyReachable));
}
else {
return (false);
}
}
}
}
function GetVolume(obj, allinclusive)
{
var result = 0;
var list_object = GetAllChildObjects ( obj );
var list_object_isarray = (Object.prototype.toString.call(list_object) === '[object Array]');
for (var iterator_object in list_object) {
var object = list_object_isarray ? list_object[iterator_object] : iterator_object;
if (list_object_isarray || iterator_object!="__dummyKey") { if (HasInt(object, "volume")) {
var result = result + object.volume;
} }
}
if (allinclusive && HasInt(obj, "volume")) {
var result = result + obj.volume;
}
return (result);
}
function CanSeeThrough(obj)
{
return ((GetBoolean(obj, "transparent") || CanReachThrough(obj)) && !(GetBoolean(obj, "hidechildren")));
}
function CanReachThrough(obj)
{
return (GetBoolean(obj, "isopen") && !(GetBoolean(obj, "hidechildren")));
}
function Got(obj)
{
return (ListContains(ScopeInventory(), obj));
}
function UpdateObjectLinks()
{
if (_obj245.enablehyperlinks) {
var data = NewStringDictionary();
var list_object = ScopeVisible();
var list_object_isarray = (Object.prototype.toString.call(list_object) === '[object Array]');
for (var iterator_object in list_object) {
var object = list_object_isarray ? list_object[iterator_object] : iterator_object;
if (list_object_isarray || iterator_object!="__dummyKey") { dictionaryadd (data, object.name, Join(GetDisplayVerbs(object), "/")); }
}
updateObjectLinks (data)
var exits = NewStringList();
var list_exit = ScopeExits();
var list_exit_isarray = (Object.prototype.toString.call(list_exit) === '[object Array]');
for (var iterator_exit in list_exit) {
var exit = list_exit_isarray ? list_exit[iterator_exit] : iterator_exit;
if (list_exit_isarray || iterator_exit!="__dummyKey") { listadd (exits, exit.name); }
}
updateExitLinks (exits)
var commands = NewStringList();
var list_cmd = ScopeCommands();
var list_cmd_isarray = (Object.prototype.toString.call(list_cmd) === '[object Array]');
for (var iterator_cmd in list_cmd) {
var cmd = list_cmd_isarray ? list_cmd[iterator_cmd] : iterator_cmd;
if (list_cmd_isarray || iterator_cmd!="__dummyKey") { listadd (commands, cmd.name); }
}
updateCommandLinks (commands)
}
}
function ShowRoomDescription()
{
var isDark = CheckDarkness();
if (isDark) {
var descriptionfield = "darkroomdescription";
}
else {
var descriptionfield = "description";
}
if (_obj245.autodescription) {
var desc = "";
for (var i = 1; i <= 4; i++) {
if (i == _obj245.autodescription_youarein) {
if (_obj245.autodescription_youarein_useprefix) {
var youarein = _obj245.pov.parent.descprefix;
var desc = AddDescriptionLine (desc, youarein + " " + GetDisplayName(_obj245.pov.parent) + ".");
}
else {
var desc = AddDescriptionLine (desc, "<b>" + CapFirst(GetDisplayName(_obj245.pov.parent)) + "</b>");
}
if (_obj245.autodescription_youarein_newline) {
OutputText (desc + "<br/>");
var desc = "";
}
}
if (i == _obj245.autodescription_youcansee) {
var objects = FormatObjectList(_obj245.pov.parent.objectslistprefix, GetNonTransparentParent(_obj245.pov.parent), Template("And"), ".");
var desc = AddDescriptionLine(desc, objects);
if (_obj245.autodescription_youcansee_newline) {
OutputText (desc + "<br/>");
var desc = "";
}
}
if (i == _obj245.autodescription_youcango) {
var exits = FormatExitList(_obj245.pov.parent.exitslistprefix, GetExitsList(), Template("Or"), ".");
var desc = AddDescriptionLine(desc, exits);
if (_obj245.autodescription_youcango_newline) {
OutputText (desc + "<br/>");
var desc = "";
}
}
if (i == _obj245.autodescription_description) {
if (HasScript(_obj245.pov.parent, descriptionfield)) {
if (LengthOf(desc) > 0) {
OutputText (desc);
var desc = "";
}
runscriptattribute2 (_obj245.pov.parent, descriptionfield);
if (_obj245.autodescription_description_newline) {
OutputText ("");
}
}
else {
var desc = AddDescriptionLine(desc, GetRoomDescription());
if (_obj245.autodescription_description_newline) {
OutputText (desc + "<br/>");
var desc = "";
}
}
}
}
if (LengthOf(desc) > 0) {
OutputText (desc);
}
}
else {
if (HasScript(_obj245.pov.parent, descriptionfield)) {
runscriptattribute2 (_obj245.pov.parent, descriptionfield);
}
else {
var fulldesc = GetRoomDescription();
if (LengthOf(fulldesc) > 0) {
OutputText (fulldesc);
}
}
}
}
function AddDescriptionLine(desc, line)
{
if (LengthOf(line) > 0) {
if (LengthOf(desc) > 0) {
OutputText (desc);
var desc = "";
}
var desc = desc + line;
}
return (desc);
}
function GetRoomDescription()
{
var fulldesc = "";
if (CheckDarkness()) {
if (HasString(_obj245.pov.parent, "darkroomdescription")) {
if (LengthOf(_obj245.pov.parent.darkroomdescription) > 0) {
var fulldesc = _obj245.pov.parent.darkroomdescription;
}
}
}
else {
if (HasString(_obj245.pov.parent, "description")) {
if (LengthOf(_obj245.pov.parent.description) > 0) {
var fulldesc = _obj245.pov.parent.description;
}
}
}
if (_obj245.appendobjectdescription) {
var list_val = ScopeVisibleNotHeld();
var list_val_isarray = (Object.prototype.toString.call(list_val) === '[object Array]');
for (var iterator_val in list_val) {
var val = list_val_isarray ? list_val[iterator_val] : iterator_val;
if (list_val_isarray || iterator_val!="__dummyKey") { if (HasString(val, "inroomdescription")) {
if (LengthOf(val.inroomdescription) > 0 && val != _obj245.pov) {
var fulldesc = fulldesc + " " + val.inroomdescription;
}
} }
}
}
return (Trim(fulldesc));
}
function OnEnterRoom(oldRoom)
{
set(_obj245, "displayroomdescriptiononstart", false);
if (IsDefined("oldRoom")) {
if (oldRoom != null) {
if (HasScript(oldRoom, "onexit")) {
runscriptattribute2 (oldRoom, "onexit");
}
}
}
on_ready (function() { if ((!GetBoolean(_obj245.pov.parent, "visited")) && HasScript(_obj245.pov.parent, "beforefirstenter")) {
runscriptattribute2 (_obj245.pov.parent, "beforefirstenter");
}
on_ready (function() { if (HasScript(_obj245.pov.parent, "beforeenter")) {
runscriptattribute2 (_obj245.pov.parent, "beforeenter");
}
on_ready (function() { if (_obj245.gridmap) {
Grid_CalculateMapCoordinates (_obj245.pov.parent, _obj245.pov);
Grid_DrawPlayerInRoom (_obj245.pov.parent);
}
if (IsDefined("oldRoom")) {
if (oldRoom != null && _obj245.changeroom_newline && !(_obj245.command_newline)) {
OutputText ("");
}
}
request ("UpdateLocation", CapFirst(GetDisplayName(_obj245.pov.parent)));
var roomFrameExists = false;
if (HasString(_obj245.pov.parent, "picture")) {
if (LengthOf(_obj245.pov.parent.picture) > 0) {
var roomFrameExists = true;
SetFramePicture (_obj245.pov.parent.picture);
}
}
if (_obj245.clearframe && !(roomFrameExists)) {
ClearFramePicture();
}
if (_obj245.showdescriptiononenter) {
ShowRoomDescription();
}
if (HasScript( _obj245, "roomenter")) {
runscriptattribute2 (_obj245, "roomenter");
}
on_ready (function() { if ((!GetBoolean(_obj245.pov.parent, "visited")) && HasScript(_obj245.pov.parent, "firstenter")) {
runscriptattribute2 (_obj245.pov.parent, "firstenter");
}
on_ready (function() { if (HasScript(_obj245.pov.parent, "enter")) {
runscriptattribute2 (_obj245.pov.parent, "enter");
} });
set (_obj245.pov.parent, "visited", true); }); }); }); });
}
function FormatObjectList(preList, parent, preFinal, postList)
{
var result = "";
var count = 0;
var list = RemoveSceneryObjects(GetDirectChildren(parent));
if (CheckDarkness()) {
var list = RemoveDarkObjects(list);
}
var listLength = ListCount(list);
var list_isarray = (Object.prototype.toString.call(list) === '[object Array]');
for (var iterator_item in list) {
var item = list_isarray ? list[iterator_item] : iterator_item;
if (list_isarray || iterator_item!="__dummyKey") { if (LengthOf(result) == 0) {
var result = preList + " ";
}
var result = result + GetDisplayNameLink(item, "object");
if (CanSeeThrough(item)) {
var result = result + FormatObjectList(" (" + item.contentsprefix, item, preFinal, ")");
}
var count = count + 1;
if (count == listLength - 1) {
var result = result + " " + preFinal + " ";
}
else if (count < listLength) {
var result = result + ", ";
}
else {
var result = result + postList;
} }
}
return (result);
}
function RemoveSceneryObjects(list)
{
var result = NewObjectList();
var list_isarray = (Object.prototype.toString.call(list) === '[object Array]');
for (var iterator_obj in list) {
var obj = list_isarray ? list[iterator_obj] : iterator_obj;
if (list_isarray || iterator_obj!="__dummyKey") { if (!(obj.scenery )&& obj != _obj245.pov && obj.visible) {
listadd (result, obj);
} }
}
return (result);
}
function RemoveLookOnlyExits(list)
{
var result = NewObjectList();
var list_isarray = (Object.prototype.toString.call(list) === '[object Array]');
for (var iterator_obj in list) {
var obj = list_isarray ? list[iterator_obj] : iterator_obj;
if (list_isarray || iterator_obj!="__dummyKey") { if (!(obj.lookonly)) {
listadd (result, obj);
} }
}
return (result);
}
function RemoveDarkObjects(list)
{
var result = NewObjectList();
var list_isarray = (Object.prototype.toString.call(list) === '[object Array]');
for (var iterator_obj in list) {
var obj = list_isarray ? list[iterator_obj] : iterator_obj;
if (list_isarray || iterator_obj!="__dummyKey") { if (GetBoolean(obj, "lightsource") || obj.parent == _obj245.pov) {
listadd (result, obj);
} }
}
return (result);
}
function FormatExitList(preList, list, preFinal, postList)
{
var result = "";
var listLength = ListCount(list);
if (listLength > 0) {
var count = 0;
var result = preList + " ";
var list_isarray = (Object.prototype.toString.call(list) === '[object Array]');
for (var iterator_item in list) {
var item = list_isarray ? list[iterator_item] : iterator_item;
if (list_isarray || iterator_item!="__dummyKey") { var result = result + GetDisplayNameLink(item, "exit");
var count = count + 1;
if (count == listLength - 1) {
var result = result + " " + preFinal + " ";
}
else if (count < listLength) {
var result = result + ", ";
} }
}
var result = result + postList;
}
return (result);
}
function GetDisplayAlias(obj)
{
if (HasString(obj, "alias")) {
var result = obj.alias;
}
else {
var result = obj.name;
}
return (result);
}
function GetDisplayName(obj)
{
return (GetDisplayNameLink(obj, ""));
}
function GetDisplayNameLink(obj, type)
{
var verbs = GetDisplayVerbs(obj);
if (verbs != null) {
var verbCount = ListCount(verbs);
}
else {
var verbCount = 0;
}
if (type == "exit" && verbCount == 1) {
if (!(_obj245.enablehyperlinks)) {
var result = GetDisplayAlias(obj);
}
else {
var result = "{exit:" + obj.name + "}";
}
}
else if (type == "") {
var result = GetDisplayAlias(obj);
}
else {
var result = "{object:" + obj.name + "}";
}
if (!(GetBoolean(obj, "usedefaultprefix"))) {
if (obj.prefix == null) {
var prefix = "";
}
else {
var prefix = obj.prefix;
}
}
else if (type == "exit") {
var prefix = "";
}
else {
var prefix = GetDefaultPrefix(obj);
}
if (LengthOf(prefix) > 0) {
var prefix = prefix + " ";
}
var result = prefix + result;
if (!(GetBoolean(obj, "usedefaultprefix") )&& HasString(obj, "suffix")) {
if (LengthOf(obj.suffix) > 0) {
var result = result + " " + obj.suffix;
}
}
return (result);
}
function ObjectLink(obj)
{
return ("{object:" + obj.name + "}");
}
function GetListDisplayAlias(obj)
{
if (HasString(obj, "listalias")) {
var result = obj.listalias;
}
else {
var result = GetDisplayAlias(obj);
}
return (result);
}
function CheckDarkness()
{
var roomCheckDarkness = true;
if (GetBoolean(_obj245.pov.parent, "dark")) {
if (ListCount(ScopeVisibleLightsource("strong")) > 0) {
var roomCheckDarkness = false;
}
}
else {
var roomCheckDarkness = false;
}
set(_obj245.pov.parent, "darklevel", roomCheckDarkness);
return (roomCheckDarkness);
}
function EnableTimer(timer)
{
set(timer, "enabled", true);
set(timer, "trigger", _obj245.timeelapsed + timer.interval);
}
function DisableTimer(timer)
{
set(timer, "enabled", false);
}
function SetTimerInterval(timer, interval)
{
set(timer, "interval", interval);
}
function SetTimerScript(timer, script)
{
set(timer, "script", script);
}
function SetTimeout(interval, script)
{
SetTimeoutID (interval, "", script);
}
function SetTimeoutID(interval, name, script)
{
var timername = "";
if (name == "") {
var timername = GetUniqueElementName("timeout");
}
else {
if (GetTimer(name) == null && GetObject(name) == null) {
var timername = name;
}
else {
error ("Error creating timer: There is already an existing object named " + name);
}
}
if (!(timername == "")) {
createtimer (timername);
var timer = GetTimer(timername);
SetTimerInterval (timer, interval);
set(timer, "timeoutscript", script);
SetTimerScript (timer, function (result) { set(this, "enabled", false);
invoke (this.timeoutscript);
destroy (this.name); });
EnableTimer (timer);
}
}
function Pause(interval)
{
request ("Pause", ToString(interval * 1000));
}
function RunTurnScripts()
{
if (IsGameRunning()) {
if (_obj245.menucallback == null) {
var list_turnscript = AllTurnScripts();
var list_turnscript_isarray = (Object.prototype.toString.call(list_turnscript) === '[object Array]');
for (var iterator_turnscript in list_turnscript) {
var turnscript = list_turnscript_isarray ? list_turnscript[iterator_turnscript] : iterator_turnscript;
if (list_turnscript_isarray || iterator_turnscript!="__dummyKey") { if (GetBoolean(turnscript, "enabled")) {
var inscope = false;
if (turnscript.parent == _obj245 || turnscript.parent == null) {
var inscope = true;
}
else {
if (Contains(turnscript.parent, _obj245.pov)) {
var inscope = true;
}
}
if (inscope) {
runscriptattribute2 (turnscript, "script");
}
} }
}
}
}
}
function EnableTurnScript(turnscript)
{
set(turnscript, "enabled", true);
}
function DisableTurnScript(turnscript)
{
set(turnscript, "enabled", false);
}
function SetTurnScript(turnscript, script)
{
set(turnscript, "script", script);
}
function SetTurnTimeout(turncount, script)
{
SetTurnTimeoutID (turncount, "", script);
}
function SetTurnTimeoutID(turncount, name, script)
{
var turnscriptname = "";
if (name == "") {
var turnscriptname = GetUniqueElementName("turnscript");
}
else {
if (GetObject(name) == null && GetTimer(name) == null) {
var turnscriptname = name;
}
else {
error ("Error creating turnscript: There is already an existing object named " + name);
}
}
if (!(turnscriptname=="")) {
createturnscript (turnscriptname);
var turnscript = GetObject(turnscriptname);
set(turnscript, "turncount", 0);
set(turnscript, "triggerturncount", turncount);
set(turnscript, "timeoutscript", script);
SetTurnScript (turnscript, function (result) { set(this, "turncount", this.turncount + 1);
if (this.turncount >= this.triggerturncount) {
set(this, "enabled", false);
invoke (this.timeoutscript);
destroy (this.name);
} });
EnableTurnScript (turnscript);
}
}
function UpdateStatusAttributes()
{
var status = AddStatusAttributesForElement("", _obj245, _obj245.statusattributes);
var status = AddStatusAttributesForElement(status, _obj245.pov, _obj245.povstatusattributes);
var status = AddStatusAttributesForElement(status, _obj245.pov, _obj245.pov.statusattributes);
request ("SetStatus", status);
}
function AddStatusAttributesForElement(status, element, statusAttributes)
{
if (statusAttributes != null) {
var statusAttributes_isarray = (Object.prototype.toString.call(statusAttributes) === '[object Array]');
for (var iterator_attr in statusAttributes) {
var attr = statusAttributes_isarray ? statusAttributes[iterator_attr] : iterator_attr;
if (statusAttributes_isarray || iterator_attr!="__dummyKey") { if (LengthOf(status) > 0) {
var status = status + "\n";
}
var status = status + FormatStatusAttribute(attr, GetAttribute(element, attr), StringDictionaryItem(statusAttributes, attr)); }
}
}
return (status);
}
function FormatStatusAttribute(attr, value, format)
{
if (LengthOf(format) == 0) {
return (CapFirst(attr) + ": " + value);
}
else {
if (overloadedFunctions.TypeOf(value) == "int" || overloadedFunctions.TypeOf(value) == "double") {
var value = ToString(value);
}
if (overloadedFunctions.TypeOf(value) == "null") {
var value = "";
}
return (Replace(format, "!", value));
}
}
function InitStatusAttributes()
{
if (_obj245.showscore) {
set(_obj245, "score", 0);
if (_obj245.statusattributes == null) {
set(_obj245, "statusattributes", NewStringDictionary());
}
dictionaryadd (_obj245.statusattributes, "score", "Score: !");
}
if (_obj245.showhealth) {
if (_obj245.povstatusattributes == null) {
set(_obj245, "povstatusattributes", NewStringDictionary());
}
dictionaryadd (_obj245.povstatusattributes, "health", "Health: !%");
}
}
function IncreaseScore(amount)
{
if (!(HasInt(_obj245, "score"))) {
error ("Score is not configured. To enable score, go to 'game' and tick 'Show score' on the Player tab.");
}
set(_obj245, "score", _obj245.score + amount);
}
function DecreaseScore(amount)
{
if (!(HasInt(_obj245, "score"))) {
error ("Score is not configured. To enable score, go to 'game' and tick 'Show score' on the Player tab.");
}
set(_obj245, "score", _obj245.score - amount);
}
function IncreaseHealth(amount)
{
if (!(HasInt(_obj245.pov, "health"))) {
error ("Health is not configured. To enable health, go to 'game' and tick 'Show health' on the Player tab.");
}
set(_obj245.pov, "health", _obj245.pov.health + amount);
}
function DecreaseHealth(amount)
{
if (!(HasInt(_obj245.pov, "health"))) {
error ("Health is not configured. To enable health, go to 'game' and tick 'Show health' on the Player tab.");
}
set(_obj245.pov, "health", _obj245.pov.health - amount);
}
function OutputText(text)
{
var data = NewDictionary();
dictionaryadd (data, "fulltext", text);
var text = ProcessTextSection(text, data);
OutputTextRaw (text);
}
function OutputTextRaw(text)
{
var format = GetCurrentTextFormat("");
addText ("<span style=\"" + format + "\">" + text + "</span><br/>")
if (GetString(_obj245, "commandbarformat") != format) {
var format = format + ";background:" + _obj245.defaultbackground;
set(_obj245, "commandbarformat", format);
setCommandBarStyle (format)
}
request ("Speak", text);
}
function OutputTextNoBr(text)
{
var data = NewDictionary();
dictionaryadd (data, "fulltext", text);
var text = ProcessTextSection(text, data);
OutputTextRawNoBr (text);
}
function OutputTextRawNoBr(text)
{
addText ("<span style=\"" + GetCurrentTextFormat("") + "\">" + text + "</span>")
request ("Speak", text);
}
function GetCurrentTextFormat(colour)
{
var style = "";
if (UIOptionUseGameFont()) {
var font = GetCurrentFontFamily();
}
else {
var font = GetUIOption("OverrideFontName");
}
if (LengthOf(font) > 0) {
var style = style + "font-family:" + font + ";";
}
if (LengthOf(colour) == 0) {
if (UIOptionUseGameColours()) {
var colour = _obj245.defaultforeground;
}
else {
var colour = GetUIOption("OverrideForeground");
}
}
if (LengthOf(colour) > 0) {
var style = style + "color:" + colour + ";";
}
if (UIOptionUseGameFont()) {
var size = _obj245.defaultfontsize;
}
else {
var size = ToDouble(GetUIOption("OverrideFontSize"));
}
if (size > 0) {
var style = style + "font-size:" + ToString(size) + "pt;";
}
return (style);
}
function GetCurrentLinkTextFormat()
{
return (GetCurrentTextFormat(GetLinkTextColour()));
}
function UIOptionUseGameFont()
{
var value = GetUIOption("UseGameFont");
if (value == null || value == "true") {
return (true);
}
else {
return (false);
}
}
function UIOptionUseGameColours()
{
var value = GetUIOption("UseGameColours");
if (value == null || value == "true") {
return (true);
}
else {
return (false);
}
}
function GetLinkTextColour()
{
if (UIOptionUseGameColours()) {
return (_obj245.defaultlinkforeground);
}
else {
return (GetUIOption("OverrideLinkForeground"));
}
}
function ProcessTextSection(text, data)
{
var containsUnprocessedSection = false;
var open = Instr(text, "{");
if (open > 0) {
var nestCount = 1;
var searchStart = open + 1;
var finished = false;
while (!(finished)) {
var nextOpen = Instr(searchStart, text, "{");
var nextClose = Instr(searchStart, text, "}");
if (nextClose > 0) {
if (nextOpen > 0 && nextOpen < nextClose) {
var nestCount = nestCount + 1;
var searchStart = nextOpen + 1;
}
else {
var nestCount = nestCount - 1;
var searchStart = nextClose + 1;
if (nestCount == 0) {
var close = nextClose;
var containsUnprocessedSection = true;
var finished = true;
}
}
}
else {
var finished = true;
}
}
}
if (containsUnprocessedSection) {
var section = Mid(text, open + 1, close - open - 1);
var value = ProcessTextCommand(section, data);
var text = Left(text, open - 1) + value + ProcessTextSection(Mid(text, close + 1), data);
}
return (text);
}
function ProcessTextCommand(section, data)
{
if (StartsWith(section, "if ")) {
return (ProcessTextCommand_If(section, data));
}
else if (StartsWith(section, "object:")) {
return (ProcessTextCommand_Object(section, data));
}
else if (StartsWith(section, "command:")) {
return (ProcessTextCommand_Command(Mid(section, 9), data));
}
else if (StartsWith(section, "page:")) {
return (ProcessTextCommand_Command(Mid(section, 6), data));
}
else if (StartsWith(section, "exit:")) {
return (ProcessTextCommand_Exit(section, data));
}
else if (StartsWith(section, "once:")) {
return (ProcessTextCommand_Once(section, data));
}
else if (StartsWith(section, "random:")) {
return (ProcessTextCommand_Random(section, data));
}
else if (StartsWith(section, "rndalt:")) {
return (ProcessTextCommand_RandomAlias(section, data));
}
else if (StartsWith(section, "img:")) {
return (ProcessTextCommand_Img(section, data));
}
else if (StartsWith(section, "counter:")) {
return (ProcessTextCommand_Counter(Mid(section, 9), data));
}
else if (StartsWith(section, "select:")) {
return (ProcessTextCommand_Select(section, data));
}
else {
var dot = Instr(section, ".");
if (dot == 0) {
return ("{" + ProcessTextSection(section, data) + "}");
}
else {
var objectname = Left(section, dot - 1);
var attributename = Mid(section, dot + 1);
var object = GetObject(objectname);
if (object == null) {
return ("{" + ProcessTextSection(section, data) + "}");
}
else {
if (HasAttribute(object, attributename)) {
var type = overloadedFunctions.TypeOf(object, attributename);
switch (type) {
case "string":
case "int":
case "double":
return (ToString(GetAttribute(object, attributename)));
break;
case "boolean":
var result = GetAttribute(object, attributename);
if (result) {
return ("true");
}
else {
return ("false");
}
break;
default:
return ("(" + type + ")");
}
}
else {
return ("");
}
}
}
}
}
function ProcessTextCommand_Object(section, data)
{
var objectname = Mid(section, 8);
var text = "";
var colon = Instr(objectname, ":");
if (colon > 0) {
var text = Mid(objectname, colon + 1);
var objectname = Left(objectname, colon - 1);
}
var object = GetObject(objectname);
if (object == null) {
return ("{" + ProcessTextSection(section, data) + "}");
}
else {
if (LengthOf(text) == 0) {
var text = SafeXML(GetDisplayAlias(object));
}
if (_obj245.enablehyperlinks) {
var linkid = ProcessTextCommand_GetNextLinkId();
var colour = "";
if (HasString(object, "linkcolour") && GetUIOption("UseGameColours") == "true") {
var colour = object.linkcolour;
}
else {
var colour = GetLinkTextColour();
}
var style = GetCurrentTextFormat(colour);
return ("<a id=\"" + linkid + "\" style=\"" + style + "\" class=\"cmdlink elementmenu\" data-elementid=\"" + object.name + "\">" + text + "</a>");
}
else {
return (text);
}
}
}
function ProcessTextCommand_GetNextLinkId()
{
if (!(HasInt(_obj245, "lastlinkid"))) {
set(_obj245, "lastlinkid", 0);
}
set(_obj245, "lastlinkid", _obj245.lastlinkid + 1);
return ("verblink" + _obj245.lastlinkid);
}
function ProcessTextCommand_Command(command, data)
{
var text = command;
var colon = Instr(command, ":");
if (colon > 0) {
var text = Mid(command, colon + 1);
var command = Left(command, colon - 1);
}
var style = GetCurrentLinkTextFormat();
var candidates = NewObjectList();
var list_cmd = ScopeCommands();
var list_cmd_isarray = (Object.prototype.toString.call(list_cmd) === '[object Array]');
for (var iterator_cmd in list_cmd) {
var cmd = list_cmd_isarray ? list_cmd[iterator_cmd] : iterator_cmd;
if (list_cmd_isarray || iterator_cmd!="__dummyKey") { if (IsRegexMatch(cmd.pattern, command, cmd.name)) {
listadd (candidates, cmd);
} }
}
var elementid = "";
if (ListCount(candidates) == 1) {
var cmd = ObjectListItem(candidates, 0);
var elementid = cmd.name;
}
var linkid = ProcessTextCommand_GetNextLinkId();
var dataattrs = "";
if (_obj245.deactivatecommandlinks) {
var dataattrs = dataattrs + "data-deactivateonclick=\"true\" ";
}
var dataattrs = dataattrs + "data-command=\"" + command + "\"";
return ("<a id=\"" + linkid + "\" style=\"" + style + "\" class=\"cmdlink commandlink\" data-elementid=\"" + elementid + "\" " + dataattrs + ">" + ProcessTextSection(text, data) + "</a>");
}
function ProcessTextCommand_Exit(section, data)
{
var exitname = Mid(section, 6);
var exit = GetObject(exitname);
if (exit == null) {
return ("{" + ProcessTextSection(section, data) + "}");
}
else {
var verbs = GetDisplayVerbs(exit);
var alias = GetDisplayAlias(exit);
var command = LCase(StringListItem(verbs, 0)) + " " + alias;
var style = GetCurrentLinkTextFormat();
return ("<a style=\"" + style + "\" class=\"cmdlink exitlink\" data-elementid=\"" + exit.name + "\" data-command=\"" + command + "\">" + alias + "</a>");
}
}
function ProcessTextCommand_Once(section, data)
{
if (!(HasAttribute(_obj245, "textprocessor_seen"))) {
set(_obj245, "textprocessor_seen", NewDictionary());
}
var fulltext = StringDictionaryItem(data, "fulltext");
if (!(DictionaryContains(_obj245.textprocessor_seen, fulltext))) {
var onceSectionsInThisText = NewList();
dictionaryadd (_obj245.textprocessor_seen, fulltext, onceSectionsInThisText);
}
else {
var onceSectionsInThisText = DictionaryItem(_obj245.textprocessor_seen, fulltext);
}
if (!(ListContains(onceSectionsInThisText, section))) {
listadd (onceSectionsInThisText, section);
return (ProcessTextSection(Mid(section, 6), data));
}
else {
return ("");
}
}
function ProcessTextCommand_Random(section, data)
{
var elements = Mid(section, 8);
var elementslist = Tsplit(elements);
var index = GetRandomInt(0, ListCount(elementslist) - 1);
return (ProcessTextSection(ListItem(elementslist, index), data));
}
function Tsplit(splittext)
{
var itemlist = NewStringList();
var sections = 0;
var startpos = 1;
for (var i = 1; i <= LengthOf(splittext); i++) {
if (Mid(splittext, i, 1) == "{") {
var sections = sections + 1;
}
if (Mid(splittext, i, 1) == "}") {
var sections = sections - 1;
}
if (Mid(splittext, i, 1) == ":" && 0 >= sections) {
var item = Mid(splittext, startpos, i - startpos);
listadd (itemlist, item);
var startpos = i + 1;
}
}
var item = Mid(splittext, startpos);
listadd (itemlist, item);
return (itemlist);
}
function ProcessTextCommand_RandomAlias(section, data)
{
var objectname = Mid(section, 8);
var object = GetObject(objectname);
if (object == null) {
return ("{" + ProcessTextSection(section, data) + "}");
}
else {
var count = ListCount(object.alt);
if (count > 0) {
return (ListItem(object.alt, GetRandomInt(0, count - 1)));
}
else {
return ("");
}
}
}
function ProcessTextCommand_If(section, data)
{
var command = Mid(section, 4);
var colon = Instr(command, ":");
if (colon == 0) {
return ("{if " + command + "}");
}
else {
var text = Mid(command, colon + 1);
var condition = Left(command, colon - 1);
var operator = Instr(condition, "<=");
if (operator != 0) {
var operatorlength = 2;
}
if (operator == 0) {
var operator = Instr(condition, ">=");
if (operator != 0) {
var operatorlength = 2;
}
}
if (operator == 0) {
var operator = Instr(condition, "<>");
if (operator != 0) {
var operatorlength = 2;
}
}
if (operator == 0) {
var operator = Instr(condition, "<");
if (operator != 0) {
var operatorlength = 1;
}
}
if (operator == 0) {
var operator = Instr(condition, ">");
if (operator != 0) {
var operatorlength = 1;
}
}
if (operator == 0) {
var operator = Instr(condition, "=");
if (operator != 0) {
var operatorlength = 1;
}
}
if (operator == 0) {
var checkfor = true;
if (StartsWith(condition, "not ")) {
var checkfor = false;
var condition = Mid(condition, 5);
}
var dot = Instr(condition, ".");
if (dot == 0) {
var result = GetBoolean(_obj245, condition);
}
else {
var objectname = Left(condition, dot - 1);
var attributename = Mid(condition, dot + 1);
var object = GetObject(objectname);
if (object == null) {
var result = false;
}
else {
var result = GetBoolean(object, attributename);
}
}
if (result == checkfor) {
return (ProcessTextSection(text, data));
}
else {
return ("");
}
}
else {
var lhs = Left(condition, operator - 1);
var rhs = Mid(condition, operator + operatorlength);
var op = Mid(condition, operator, operatorlength);
var dot = Instr(lhs, ".");
if (dot == 0) {
var objectname = "";
var attributename = "";
if (HasInt(_obj245, lhs)) {
var objectname = "game";
var attributename = lhs;
}
else {
return ("{if " + command + "}");
}
}
else {
var objectname = Left(lhs, dot - 1);
var attributename = Mid(lhs, dot + 1);
}
var object = GetObject(objectname);
if (object == null) {
return ("{if " + command + "}");
}
else {
var value = GetAttribute(object, attributename);
if (overloadedFunctions.TypeOf(value) == "object") {
var value = value.name;
}
if (op == "=") {
if (ToString(value) == rhs) {
return (ProcessTextSection(text, data));
}
else {
return ("");
}
}
else if (op == "<>") {
if (!(ToString(value) == rhs)) {
return (ProcessTextSection(text, data));
}
else {
return ("");
}
}
else if (op == ">") {
if (ToDouble(ToString(value)) > ToDouble(rhs)) {
return (ProcessTextSection(text, data));
}
else {
return ("");
}
}
else if (op == "<") {
if (ToDouble(ToString(value)) < ToDouble(rhs)) {
return (ProcessTextSection(text, data));
}
else {
return ("");
}
}
else if (op == ">=") {
if (ToDouble(ToString(value)) >= ToDouble(rhs)) {
return (ProcessTextSection(text, data));
}
else {
return ("");
}
}
else if (op == "<=") {
if (ToDouble(ToString(value)) <= ToDouble(rhs)) {
return (ProcessTextSection(text, data));
}
else {
return ("");
}
}
}
}
}
}
function ProcessTextCommand_Img(section, data)
{
var filename = Mid(section, 5);
return ("<img src=\"" + GetFileURL(filename) + "\" />");
}
function ProcessTextCommand_Counter(section, data)
{
if (HasAttribute(_obj245, section)) {
return (ToString(GetAttribute(_obj245, section)));
}
else {
return ("0");
}
}
function ProcessTextCommand_Select(section, data)
{
var elements = Mid(section, 8);
var elementslist = Split(elements, ":");
var objectandatt = StringListItem (elementslist, 0);
listremove (elementslist, objectandatt);
var objectandattlist = Split(objectandatt, ".");
if (!(ListCount (objectandattlist) == 2)) {
return ("{" + ProcessTextSection(section, data) + "}");
}
else {
var object = GetObject(StringListItem(objectandattlist, 0));
if (object == null) {
return ("{" + ProcessTextSection(section, data) + "}");
}
else if (!(HasInt (object, StringListItem(objectandattlist, 1)))) {
return ("{" + ProcessTextSection(section, data) + "}");
}
else {
var index = GetInt(object, StringListItem(objectandattlist, 1));
if ((0 > index) || (index >= Listcount(elementslist))) {
return ("{" + ProcessTextSection(section, data) + "}");
}
else {
return (ProcessTextSection(ListItem(elementslist, index), data));
}
}
}
}
function SetFramePicture(filename)
{
request ("SetPanelContents", "<img src=\"" + GetFileURL(filename) + "\" onload=\"setPanelHeight()\"/>");
set(_obj245, "panelcontents", filename);
}
function ClearFramePicture()
{
request ("SetPanelContents", "");
set(_obj245, "panelcontents", null);
}
function ClearScreen()
{
request ("ClearScreen", "");
}
function SetForegroundColour(colour)
{
request ("Foreground", colour);
set(_obj245, "defaultforeground", colour);
}
function SetBackgroundColour(colour)
{
request ("Background", colour);
set(_obj245, "defaultbackground", colour);
}
function SetFontName(font)
{
set(_obj245, "defaultfont", font);
set(_obj245, "defaultwebfont", "");
}
function SetWebFontName(font)
{
AddExternalStylesheet ("https://fonts.googleapis.com/css?family=" + Replace(font, " ", "+"));
set(_obj245, "defaultwebfont", font);
}
function AddExternalStylesheet(stylesheet)
{
if (_obj245.externalstylesheets == null) {
set(_obj245, "externalstylesheets", NewStringList());
}
if (!(ListContains(_obj245.externalstylesheets, stylesheet))) {
listadd (_obj245.externalstylesheets, stylesheet);
addExternalStylesheet (stylesheet)
}
}
function SetFontSize(size)
{
set(_obj245, "defaultfontsize", size);
}
function PrintCentered(text)
{
SetAlignment ("center");
OutputText (text);
SetAlignment ("left");
}
function ShowYouTube(id)
{
AddYouTube (id)
}
function ShowVimeo(id)
{
AddVimeo (id)
}
function WaitForKeyPress()
{
request ("Wait", "");
}
function DisplayHttpLink(text, url, https)
{
var pos = Instr(url, "://");
if (pos > 0) {
var url = Mid(url, pos + 3);
}
if (https) {
var url = "https://" + url;
}
else {
var url = "http://" + url;
}
OutputText ("<a style=\"" + GetCurrentLinkTextFormat() + "\" href=\"" + url + "\">" + text + "</a>");
}
function DisplayMailtoLink(text, url)
{
if (Instr(url, "mailto:") == 0) {
var url = "mailto:" + url;
}
OutputText ("<a style=\"" + GetCurrentLinkTextFormat() + "\" href=\"" + url + "\">" + text + "</a>");
}
function CommandLink(cmd, text)
{
return ("{command:" + cmd + ":" + text + "}");
}
function Log(text)
{
request ("Log", text);
}
function SetBackgroundImage(filename)
{
SetBackgroundImage (GetFileURL(filename))
set(_obj245, "backgroundimage", filename);
}
function SetBackgroundOpacity(opacity)
{
SetBackgroundOpacity (opacity)
set(_obj245, "backgroundopacity", opacity);
set(_obj245, "setbackgroundopacity", true);
}
function DisplayList(list, numbers)
{
if (numbers) {
var result = "<ol>";
}
else {
var result = "<ul>";
}
var list_isarray = (Object.prototype.toString.call(list) === '[object Array]');
for (var iterator_item in list) {
var item = list_isarray ? list[iterator_item] : iterator_item;
if (list_isarray || iterator_item!="__dummyKey") { var result = result + "<li>" + item + "</li>"; }
}
if (numbers) {
var result = result + "</ol>";
}
else {
var result = result + "</ul>";
}
OutputText (result);
}
function SetAlignment(align)
{
createNewDiv (align)
}
function GetCurrentFontFamily()
{
if (_obj245.defaultwebfont == null) {
return (_obj245.defaultfont);
}
else {
if (_obj245.defaultwebfont == "") {
return (_obj245.defaultfont);
}
else {
return ("'" + _obj245.defaultwebfont + "', " + _obj245.defaultfont);
}
}
}
function Grid_SetScale(scale)
{
Grid_SetScale (scale)
}
function Grid_CalculateMapCoordinates(room, playerobject)
{
if (room.parent != null) {
if (room.grid_parent_offset_auto) {
set(room, "grid_parent_offset_x", (room.parent.grid_width - room.grid_width) /2.0);
set(room, "grid_parent_offset_y", (room.parent.grid_length - room.grid_length) /2.0);
}
Grid_SetGridCoordinateForPlayer (playerobject, room.parent, "x", Grid_GetGridCoordinateForPlayer(playerobject, room, "x") - room.grid_parent_offset_x);
Grid_SetGridCoordinateForPlayer (playerobject, room.parent, "y", Grid_GetGridCoordinateForPlayer(playerobject, room, "y") - room.grid_parent_offset_y);
Grid_SetGridCoordinateForPlayer (playerobject, room.parent, "z", Grid_GetGridCoordinateForPlayer(playerobject, room, "z"));
set(room.parent, "grid_render", true);
Grid_CalculateMapCoordinates (room.parent, playerobject);
}
var list_exit = AllExits();
var list_exit_isarray = (Object.prototype.toString.call(list_exit) === '[object Array]');
for (var iterator_exit in list_exit) {
var exit = list_exit_isarray ? list_exit[iterator_exit] : iterator_exit;
if (list_exit_isarray || iterator_exit!="__dummyKey") { if (exit.parent == room && !(GetBoolean(exit, "lookonly"))) {
if (DoesInherit(exit, "northdirection")) {
Grid_SetGridCoordinateForPlayer (playerobject, exit, "x", Grid_GetGridCoordinateForPlayer(playerobject, room, "x") + room.grid_width/2.0 + exit.grid_offset_x);
Grid_SetGridCoordinateForPlayer (playerobject, exit, "y", Grid_GetGridCoordinateForPlayer(playerobject, room, "y") + exit.grid_offset_y);
Grid_SetGridCoordinateForPlayer (playerobject, exit.to, "x", Grid_GetGridCoordinateForPlayer(playerobject, exit, "x") - exit.to.grid_width/2.0);
Grid_SetGridCoordinateForPlayer (playerobject, exit.to, "y", (Grid_GetGridCoordinateForPlayer(playerobject, exit, "y") - exit.to.grid_length) - exit.grid_length);
Grid_SetGridCoordinateForPlayer (playerobject, exit.to, "z", Grid_GetGridCoordinateForPlayer(playerobject, room, "z"));
Grid_SetGridCoordinateForPlayer (playerobject, exit, "end_x", Grid_GetGridCoordinateForPlayer(playerobject, exit, "x"));
Grid_SetGridCoordinateForPlayer (playerobject, exit, "end_y", Grid_GetGridCoordinateForPlayer(playerobject, exit, "y") - exit.grid_length);
set(exit, "grid_render", true);
set(exit.to, "grid_render", true);
}
else if (DoesInherit(exit, "eastdirection")) {
Grid_SetGridCoordinateForPlayer (playerobject, exit, "x", Grid_GetGridCoordinateForPlayer(playerobject, room, "x") + room.grid_width + exit.grid_offset_x);
Grid_SetGridCoordinateForPlayer (playerobject, exit, "y", Grid_GetGridCoordinateForPlayer(playerobject, room, "y") + room.grid_length/2.0 + exit.grid_offset_y);
Grid_SetGridCoordinateForPlayer (playerobject, exit.to, "x", Grid_GetGridCoordinateForPlayer(playerobject, exit, "x") + exit.grid_length);
Grid_SetGridCoordinateForPlayer (playerobject, exit.to, "y", Grid_GetGridCoordinateForPlayer(playerobject, exit, "y") - exit.to.grid_length/2.0);
Grid_SetGridCoordinateForPlayer (playerobject, exit.to, "z", Grid_GetGridCoordinateForPlayer(playerobject, room, "z"));
Grid_SetGridCoordinateForPlayer (playerobject, exit, "end_x", Grid_GetGridCoordinateForPlayer(playerobject, exit, "x") + exit.grid_length);
Grid_SetGridCoordinateForPlayer (playerobject, exit, "end_y", Grid_GetGridCoordinateForPlayer(playerobject, exit, "y"));
set(exit, "grid_render", true);
set(exit.to, "grid_render", true);
}
else if (DoesInherit(exit, "southdirection")) {
Grid_SetGridCoordinateForPlayer (playerobject, exit, "x", Grid_GetGridCoordinateForPlayer(playerobject, room, "x") + room.grid_width/2.0 + exit.grid_offset_x);
Grid_SetGridCoordinateForPlayer (playerobject, exit, "y", Grid_GetGridCoordinateForPlayer(playerobject, room, "y") + room.grid_length + exit.grid_offset_y);
Grid_SetGridCoordinateForPlayer (playerobject, exit.to, "x", Grid_GetGridCoordinateForPlayer(playerobject, exit, "x") - exit.to.grid_width/2.0);
Grid_SetGridCoordinateForPlayer (playerobject, exit.to, "y", Grid_GetGridCoordinateForPlayer(playerobject, exit, "y") + exit.grid_length);
Grid_SetGridCoordinateForPlayer (playerobject, exit.to, "z", Grid_GetGridCoordinateForPlayer(playerobject, room, "z"));
Grid_SetGridCoordinateForPlayer (playerobject, exit, "end_x", Grid_GetGridCoordinateForPlayer(playerobject, exit, "x"));
Grid_SetGridCoordinateForPlayer (playerobject, exit, "end_y", Grid_GetGridCoordinateForPlayer(playerobject, exit, "y") + exit.grid_length);
set(exit, "grid_render", true);
set(exit.to, "grid_render", true);
}
else if (DoesInherit(exit, "westdirection")) {
Grid_SetGridCoordinateForPlayer (playerobject, exit, "x", Grid_GetGridCoordinateForPlayer(playerobject, room, "x") + exit.grid_offset_x);
Grid_SetGridCoordinateForPlayer (playerobject, exit, "y", Grid_GetGridCoordinateForPlayer(playerobject, room, "y") + room.grid_length/2.0 + exit.grid_offset_y);
Grid_SetGridCoordinateForPlayer (playerobject, exit.to, "x", (Grid_GetGridCoordinateForPlayer(playerobject, exit, "x") - exit.to.grid_width) - exit.grid_length);
Grid_SetGridCoordinateForPlayer (playerobject, exit.to, "y", Grid_GetGridCoordinateForPlayer(playerobject, exit, "y") - exit.to.grid_length/2.0);
Grid_SetGridCoordinateForPlayer (playerobject, exit.to, "z", Grid_GetGridCoordinateForPlayer(playerobject, room, "z"));
Grid_SetGridCoordinateForPlayer (playerobject, exit, "end_x", Grid_GetGridCoordinateForPlayer(playerobject, exit, "x") - exit.grid_length);
Grid_SetGridCoordinateForPlayer (playerobject, exit, "end_y", Grid_GetGridCoordinateForPlayer(playerobject, exit, "y"));
set(exit, "grid_render", true);
set(exit.to, "grid_render", true);
}
else if (DoesInherit(exit, "northwestdirection")) {
Grid_SetGridCoordinateForPlayer (playerobject, exit, "x", Grid_GetGridCoordinateForPlayer(playerobject, room, "x") + exit.grid_offset_x);
Grid_SetGridCoordinateForPlayer (playerobject, exit, "y", Grid_GetGridCoordinateForPlayer(playerobject, room, "y") + exit.grid_offset_y);
Grid_SetGridCoordinateForPlayer (playerobject, exit.to, "x", (Grid_GetGridCoordinateForPlayer(playerobject, exit, "x") - exit.to.grid_width) - exit.grid_length);
Grid_SetGridCoordinateForPlayer (playerobject, exit.to, "y", (Grid_GetGridCoordinateForPlayer(playerobject, exit, "y") - exit.to.grid_length) - exit.grid_length);
Grid_SetGridCoordinateForPlayer (playerobject, exit.to, "z", Grid_GetGridCoordinateForPlayer(playerobject, room, "z"));
Grid_SetGridCoordinateForPlayer (playerobject, exit, "end_x", Grid_GetGridCoordinateForPlayer(playerobject, exit, "x") - exit.grid_length);
Grid_SetGridCoordinateForPlayer (playerobject, exit, "end_y", Grid_GetGridCoordinateForPlayer(playerobject, exit, "y") - exit.grid_length);
set(exit, "grid_render", true);
set(exit.to, "grid_render", true);
}
else if (DoesInherit(exit, "northeastdirection")) {
Grid_SetGridCoordinateForPlayer (playerobject, exit, "x", Grid_GetGridCoordinateForPlayer(playerobject, room, "x") + room.grid_width + exit.grid_offset_x);
Grid_SetGridCoordinateForPlayer (playerobject, exit, "y", Grid_GetGridCoordinateForPlayer(playerobject, room, "y") + exit.grid_offset_y);
Grid_SetGridCoordinateForPlayer (playerobject, exit.to, "x", Grid_GetGridCoordinateForPlayer(playerobject, exit, "x") + exit.grid_length);
Grid_SetGridCoordinateForPlayer (playerobject, exit.to, "y", (Grid_GetGridCoordinateForPlayer(playerobject, exit, "y") - exit.to.grid_length) - exit.grid_length);
Grid_SetGridCoordinateForPlayer (playerobject, exit.to, "z", Grid_GetGridCoordinateForPlayer(playerobject, room, "z"));
Grid_SetGridCoordinateForPlayer (playerobject, exit, "end_x", Grid_GetGridCoordinateForPlayer(playerobject, exit, "x") + exit.grid_length);
Grid_SetGridCoordinateForPlayer (playerobject, exit, "end_y", Grid_GetGridCoordinateForPlayer(playerobject, exit, "y") - exit.grid_length);
set(exit, "grid_render", true);
set(exit.to, "grid_render", true);
}
else if (DoesInherit(exit, "southwestdirection")) {
Grid_SetGridCoordinateForPlayer (playerobject, exit, "x", Grid_GetGridCoordinateForPlayer(playerobject, room, "x") + exit.grid_offset_x);
Grid_SetGridCoordinateForPlayer (playerobject, exit, "y", Grid_GetGridCoordinateForPlayer(playerobject, room, "y") + room.grid_length + exit.grid_offset_y);
Grid_SetGridCoordinateForPlayer (playerobject, exit.to, "x", (Grid_GetGridCoordinateForPlayer(playerobject, exit, "x") - exit.to.grid_width) - exit.grid_length);
Grid_SetGridCoordinateForPlayer (playerobject, exit.to, "y", Grid_GetGridCoordinateForPlayer(playerobject, exit, "y") + exit.grid_length);
Grid_SetGridCoordinateForPlayer (playerobject, exit.to, "z", Grid_GetGridCoordinateForPlayer(playerobject, room, "z"));
Grid_SetGridCoordinateForPlayer (playerobject, exit, "end_x", Grid_GetGridCoordinateForPlayer(playerobject, exit, "x") - exit.grid_length);
Grid_SetGridCoordinateForPlayer (playerobject, exit, "end_y", Grid_GetGridCoordinateForPlayer(playerobject, exit, "y") + exit.grid_length);
set(exit, "grid_render", true);
set(exit.to, "grid_render", true);
}
else if (DoesInherit(exit, "southeastdirection")) {
Grid_SetGridCoordinateForPlayer (playerobject, exit, "x", Grid_GetGridCoordinateForPlayer(playerobject, room, "x") + room.grid_width + exit.grid_offset_x);
Grid_SetGridCoordinateForPlayer (playerobject, exit, "y", Grid_GetGridCoordinateForPlayer(playerobject, room, "y") + room.grid_length + exit.grid_offset_y);
Grid_SetGridCoordinateForPlayer (playerobject, exit.to, "x", Grid_GetGridCoordinateForPlayer(playerobject, exit, "x") + exit.grid_length);
Grid_SetGridCoordinateForPlayer (playerobject, exit.to, "y", Grid_GetGridCoordinateForPlayer(playerobject, exit, "y") + exit.grid_length);
Grid_SetGridCoordinateForPlayer (playerobject, exit.to, "z", Grid_GetGridCoordinateForPlayer(playerobject, room, "z"));
Grid_SetGridCoordinateForPlayer (playerobject, exit, "end_x", Grid_GetGridCoordinateForPlayer(playerobject, exit, "x") + exit.grid_length);
Grid_SetGridCoordinateForPlayer (playerobject, exit, "end_y", Grid_GetGridCoordinateForPlayer(playerobject, exit, "y") + exit.grid_length);
set(exit, "grid_render", true);
set(exit.to, "grid_render", true);
}
else if (DoesInherit(exit, "updirection")) {
Grid_SetGridCoordinateForPlayer (playerobject, exit.to, "x", Grid_GetGridCoordinateForPlayer(playerobject, room, "x") + room.grid_width/2.0 - exit.to.grid_width/2.0 + exit.grid_offset_x);
Grid_SetGridCoordinateForPlayer (playerobject, exit.to, "y", Grid_GetGridCoordinateForPlayer(playerobject, room, "y") + room.grid_length/2.0 - exit.to.grid_length/2.0 + exit.grid_offset_y);
Grid_SetGridCoordinateForPlayer (playerobject, exit.to, "z", Grid_GetGridCoordinateForPlayer(playerobject, room, "z") + exit.grid_length);
set(exit, "grid_render", false);
set(exit.to, "grid_render", true);
}
else if (DoesInherit(exit, "downdirection")) {
Grid_SetGridCoordinateForPlayer (playerobject, exit.to, "x", Grid_GetGridCoordinateForPlayer(playerobject, room, "x") + room.grid_width/2.0 - exit.to.grid_width/2.0 + exit.grid_offset_x);
Grid_SetGridCoordinateForPlayer (playerobject, exit.to, "y", Grid_GetGridCoordinateForPlayer(playerobject, room, "y") + room.grid_length/2.0 - exit.to.grid_length/2.0 + exit.grid_offset_y);
Grid_SetGridCoordinateForPlayer (playerobject, exit.to, "z", Grid_GetGridCoordinateForPlayer(playerobject, room, "z") - exit.grid_length);
set(exit, "grid_render", false);
set(exit.to, "grid_render", true);
}
else if (DoesInherit(exit, "indirection") || DoesInherit(exit, "outdirection")) {
Grid_SetGridCoordinateForPlayer (playerobject, exit.to, "x", Grid_GetGridCoordinateForPlayer(playerobject, room, "x") + room.grid_width/2.0 - exit.to.grid_width/2.0 + exit.grid_offset_x);
Grid_SetGridCoordinateForPlayer (playerobject, exit.to, "y", Grid_GetGridCoordinateForPlayer(playerobject, room, "y") + room.grid_length/2.0 - exit.to.grid_length/2.0 + exit.grid_offset_y);
Grid_SetGridCoordinateForPlayer (playerobject, exit.to, "z", Grid_GetGridCoordinateForPlayer(playerobject, room, "z"));
set(exit, "grid_render", false);
set(exit.to, "grid_render", true);
}
} }
}
}
function Grid_DrawPlayerInRoom(room)
{
if (room.grid_render) {
Grid_DrawRoom (room, false, _obj245.pov);
var player_x = Grid_GetGridCoordinateForPlayer(_obj245.pov, room, "x") + room.grid_width/2.0;
var player_y = Grid_GetGridCoordinateForPlayer(_obj245.pov, room, "y") + room.grid_length/2.0;
var player_z = Grid_GetGridCoordinateForPlayer(_obj245.pov, room, "z");
Grid_DrawPlayer (player_x, player_y, player_z, 5, "black", 2, "yellow")
}
}
function Grid_DrawRoom(room, redraw, playerobject)
{
if (room.grid_render) {
if (redraw || !(Grid_GetRoomBooleanForPlayer(playerobject, room, "grid_isdrawn"))) {
if (room.parent != null) {
Grid_DrawRoom (room.parent, redraw, playerobject);
}
Grid_DrawBox (Grid_GetGridCoordinateForPlayer(_obj245.pov, room, "x"), Grid_GetGridCoordinateForPlayer(_obj245.pov, room, "y"), Grid_GetGridCoordinateForPlayer(_obj245.pov, room, "z"), room.grid_width, room.grid_length, room.grid_border, room.grid_borderwidth, room.grid_fill, room.grid_bordersides)
if (LengthOf(room.grid_label) > 0) {
var label_x = Grid_GetGridCoordinateForPlayer(_obj245.pov, room, "x") + room.grid_width/2.0;
var label_y = (Grid_GetGridCoordinateForPlayer(_obj245.pov, room, "y") + room.grid_length/2.0) - 0.5;
Grid_DrawLabel (label_x, label_y, Grid_GetGridCoordinateForPlayer(_obj245.pov, room, "z"), room.grid_label)
}
var list_exit = AllExits();
var list_exit_isarray = (Object.prototype.toString.call(list_exit) === '[object Array]');
for (var iterator_exit in list_exit) {
var exit = list_exit_isarray ? list_exit[iterator_exit] : iterator_exit;
if (list_exit_isarray || iterator_exit!="__dummyKey") { if (exit.grid_render && exit.parent == room && exit.grid_length > 0) {
Grid_DrawLine (Grid_GetGridCoordinateForPlayer(_obj245.pov, exit, "x"), Grid_GetGridCoordinateForPlayer(_obj245.pov, exit, "y"), Grid_GetGridCoordinateForPlayer(_obj245.pov, exit, "end_x"), Grid_GetGridCoordinateForPlayer(_obj245.pov, exit, "end_y"), "black", 1);
} }
}
Grid_SetRoomBooleanForPlayer (playerobject, room, "grid_isdrawn", true);
}
}
}
function Grid_ShowCustomLayer(visible)
{
if (visible) {
Grid_ShowCustomLayer (true)
}
else {
Grid_ShowCustomLayer (false)
}
}
function Grid_ClearCustomLayer()
{
Grid_ClearCustomLayer ()
}
function Grid_DrawLine(x1, y1, x2, y2, border, borderWidth)
{
Grid_DrawLine (x1, y1, x2, y2, border, borderWidth)
}
function Grid_DrawArrow(id, x1, y1, x2, y2, border, borderWidth)
{
Grid_DrawArrow (id, x1, y1, x2, y2, border, borderWidth)
}
function Grid_DrawGridLines(x1, y1, x2, y2, border)
{
Grid_DrawGridLines (x1, y1, x2, y2, border)
}
function Grid_SetCentre(x, y)
{
Grid_SetCentre (x, y)
}
function Grid_DrawSquare(id, x, y, width, height, text, fill)
{
Grid_DrawSquare (id, x, y, width, height, text, fill)
}
function Grid_LoadSvg(data, id)
{
Grid_LoadSvg (data, id)
}
function Grid_DrawSvg(id, symbolid, x, y, width, height)
{
Grid_DrawSvg (id, symbolid, x, y, width, height)
}
function Grid_DrawImage(id, url, x, y, width, height)
{
Grid_DrawImage (id, url, x, y, width, height)
}
function Grid_AddNewShapePoint(x, y)
{
Grid_AddNewShapePoint (x, y)
}
function Grid_DrawShape(id, border, fill, opacity)
{
Grid_DrawShape (id, border, fill, opacity)
}
function JS_GridSquareClick(parameterstring)
{
var parameters = Split(parameterstring, ";");
var x = ToInt(StringListItem(parameters, 0));
var y = ToInt(StringListItem(parameters, 1));
GridSquareClick (x, y);
}
function GridSquareClick(x, y)
{

}
function Grid_Redraw()
{
var list_object = AllObjects();
var list_object_isarray = (Object.prototype.toString.call(list_object) === '[object Array]');
for (var iterator_object in list_object) {
var object = list_object_isarray ? list_object[iterator_object] : iterator_object;
if (list_object_isarray || iterator_object!="__dummyKey") { if (Grid_GetRoomBooleanForPlayer(_obj245.pov, object, "grid_isdrawn")) {
Grid_DrawRoom (object, true, _obj245.pov);
} }
}
}
function Grid_SetGridCoordinateForPlayer(playerobject, room, coordinate, value)
{
var coordinates = Grid_GetPlayerCoordinatesForRoom(playerobject, room);
if (DictionaryContains(coordinates, coordinate)) {
dictionaryremove (coordinates, coordinate);
}
dictionaryadd (coordinates, coordinate, value * 1.0);
}
function Grid_GetGridCoordinateForPlayer(playerobject, room, coordinate)
{
var coordinates = Grid_GetPlayerCoordinatesForRoom(playerobject, room);
return (DictionaryItem(coordinates, coordinate));
}
function Grid_SetRoomBooleanForPlayer(playerobject, room, coordinate, value)
{
var datadictionary = Grid_GetPlayerCoordinatesForRoom(playerobject, room);
if (DictionaryContains(datadictionary, coordinate)) {
dictionaryremove (datadictionary, coordinate);
}
dictionaryadd (datadictionary, coordinate, value);
}
function Grid_GetRoomBooleanForPlayer(playerobject, room, attribute)
{
var coordinatedata = Grid_GetPlayerCoordinateDictionary(playerobject);
if (!(DictionaryContains(coordinatedata, room.name))) {
return (false);
}
else {
var datadictionary = Grid_GetPlayerCoordinatesForRoom(playerobject, room);
if (DictionaryContains(datadictionary, attribute)) {
return (DictionaryItem(datadictionary, attribute));
}
else {
return (false);
}
}
}
function Grid_GetPlayerCoordinateDictionary(playerobject)
{
if (HasAttribute(playerobject, "grid_coordinates_delegate")) {
return (Grid_GetPlayerCoordinateDictionary(playerobject.grid_coordinates_delegate));
}
else {
if (!(HasAttribute(playerobject, "grid_coordinates"))) {
set(playerobject, "grid_coordinates", NewDictionary());
Grid_SetGridCoordinateForPlayer (playerobject, playerobject.parent, "x", 0);
Grid_SetGridCoordinateForPlayer (playerobject, playerobject.parent, "y", 0);
Grid_SetGridCoordinateForPlayer (playerobject, playerobject.parent, "z", 0);
set(playerobject.parent, "grid_render", true);
Grid_CalculateMapCoordinates (playerobject.parent, playerobject);
}
return (playerobject.grid_coordinates);
}
}
function Grid_GetPlayerCoordinatesForRoom(playerobject, room)
{
var coordinatedata = Grid_GetPlayerCoordinateDictionary(playerobject);
if (!(DictionaryContains(coordinatedata, room.name))) {
dictionaryadd (coordinatedata, room.name, NewDictionary());
}
return (DictionaryItem(coordinatedata, room.name));
}
function MergePOVCoordinates()
{
var coordinateowner = GetCoordinateOwner(_obj245.pov);
var list_obj = GetDirectChildren(_obj245.pov.parent);
var list_obj_isarray = (Object.prototype.toString.call(list_obj) === '[object Array]');
for (var iterator_obj in list_obj) {
var obj = list_obj_isarray ? list_obj[iterator_obj] : iterator_obj;
if (list_obj_isarray || iterator_obj!="__dummyKey") { if (obj != _obj245.pov && HasAttribute(obj, "grid_coordinates")) {
var objcoordinateowner = GetCoordinateOwner(obj);
if (coordinateowner != objcoordinateowner) {
MapPOVCoordinates (objcoordinateowner, coordinateowner);
}
} }
}
}
function GetCoordinateOwner(playerobject)
{
if (HasAttribute(playerobject, "grid_coordinates_delegate")) {
return (GetCoordinateOwner(playerobject.grid_coordinates_delegate));
}
else {
return (playerobject);
}
}
function MapPOVCoordinates(source, target)
{
var sourcecoordinates = Grid_GetPlayerCoordinateDictionary(source);
var targetcoordinates = Grid_GetPlayerCoordinateDictionary(target);
var xoffset = Grid_GetGridCoordinateForPlayer(target, _obj245.pov.parent, "x") - Grid_GetGridCoordinateForPlayer(source, _obj245.pov.parent, "x");
var yoffset = Grid_GetGridCoordinateForPlayer(target, _obj245.pov.parent, "y") - Grid_GetGridCoordinateForPlayer(source, _obj245.pov.parent, "y");
var zoffset = Grid_GetGridCoordinateForPlayer(target, _obj245.pov.parent, "z") - Grid_GetGridCoordinateForPlayer(source, _obj245.pov.parent, "z");
var sourcecoordinates_isarray = (Object.prototype.toString.call(sourcecoordinates) === '[object Array]');
for (var iterator_roomname in sourcecoordinates) {
var roomname = sourcecoordinates_isarray ? sourcecoordinates[iterator_roomname] : iterator_roomname;
if (sourcecoordinates_isarray || iterator_roomname!="__dummyKey") { var coordinatedata = DictionaryItem(sourcecoordinates, roomname);
if (!(DictionaryContains(targetcoordinates, roomname))) {
var newroomdata = NewDictionary();
dictionaryadd (targetcoordinates, roomname, newroomdata);
MapPOVCoordinate (coordinatedata, newroomdata, "x", xoffset);
MapPOVCoordinate (coordinatedata, newroomdata, "y", yoffset);
MapPOVCoordinate (coordinatedata, newroomdata, "z", zoffset);
MapPOVCoordinate (coordinatedata, newroomdata, "end_x", xoffset);
MapPOVCoordinate (coordinatedata, newroomdata, "end_y", yoffset);
}
else {
var newroomdata = DictionaryItem(targetcoordinates, roomname);
}
if (DictionaryContains(coordinatedata, "grid_isdrawn")) {
if (DictionaryContains(newroomdata, "grid_isdrawn")) {
dictionaryremove (newroomdata, "grid_isdrawn");
}
dictionaryadd (newroomdata, "grid_isdrawn", DictionaryItem(coordinatedata, "grid_isdrawn"));
} }
}
set(source, "grid_coordinates_delegate", target);
Grid_Redraw();
Grid_DrawPlayerInRoom (_obj245.pov.parent);
}
function MapPOVCoordinate(sourcedata, targetdata, name, offset)
{
if (DictionaryContains(sourcedata, name)) {
var value = DictionaryItem(sourcedata, name);
dictionaryadd (targetdata, name, value + offset);
}
}
function DiceRoll(dicetype)
{
var dpos = Instr(dicetype, "d");
if (dpos == 0) {
error ("Invalid dice type: " + dicetype);
}
else {
var number_string = Left(dicetype, dpos - 1);
var sides_string = Mid(dicetype, dpos + 1);
if (!((IsNumeric(number_string) )&& IsNumeric(sides_string))) {
error ("Invalid dice type: " + dicetype);
}
else {
var number = ToInt(number_string);
var sides = ToInt(sides_string);
var total = 0;
for (var i = 1; i <= number; i++) {
var total = total + GetRandomInt(1, sides);
}
return (total);
}
}
}
function TextFX_Typewriter(text, speed)
{
TextFX_Typewriter_Internal (text, speed, GetCurrentFontFamily(), _obj245.defaultforeground, _obj245.defaultfontsize);
}
function TextFX_Typewriter_Internal(text, speed, font, color, size)
{
TextFX.Typewriter (text, speed, font, color, size)
}
function TextFX_Unscramble(text, speed, reveal)
{
TextFX_Unscramble_Internal (text, speed, reveal, GetCurrentFontFamily(), _obj245.defaultforeground, _obj245.defaultfontsize);
}
function TextFX_Unscramble_Internal(text, speed, reveal, font, color, size)
{
TextFX.Unscramble (text, speed, reveal, font, color, size)
}
function InitInterface()
{
if (_obj245.setcustomwidth) {
setGameWidth (_obj245.customwidth)
}
if (!(_obj245.showborder)) {
hideBorder ()
}
if (_obj245.setcustompadding) {
setGamePadding (_obj245.custompaddingtop, _obj245.custompaddingbottom, _obj245.custompaddingleft, _obj245.custompaddingright)
}
if (_obj245.externalstylesheets != null) {
var _obj245_externalstylesheets_isarray = (Object.prototype.toString.call(_obj245.externalstylesheets) === '[object Array]');
for (var iterator_stylesheet in _obj245.externalstylesheets) {
var stylesheet = _obj245_externalstylesheets_isarray ? _obj245.externalstylesheets[iterator_stylesheet] : iterator_stylesheet;
if (_obj245_externalstylesheets_isarray || iterator_stylesheet!="__dummyKey") { addExternalStylesheet (stylesheet) }
}
}
if (_obj245.setbackgroundopacity) {
SetBackgroundOpacity (_obj245.backgroundopacity);
}
request ("Background", _obj245.defaultbackground);
request ("Foreground", _obj245.defaultforeground);
request ("LinkForeground", _obj245.defaultlinkforeground);
if (LengthOf(_obj245.backgroundimage) > 0) {
SetBackgroundImage (_obj245.backgroundimage);
}
request ("SetCompassDirections", Join(_obj245.compassdirections, ";"));
request ("SetInterfaceString", "InventoryLabel=Inventory");
request ("SetInterfaceString", "StatusLabel=Status");
request ("SetInterfaceString", "PlacesObjectsLabel=Places and Objects");
request ("SetInterfaceString", "CompassLabel=Compass");
request ("SetInterfaceString", "InButtonLabel=in");
request ("SetInterfaceString", "OutButtonLabel=out");
request ("SetInterfaceString", "EmptyListLabel=(empty)");
request ("SetInterfaceString", "NothingSelectedLabel=(nothing selected)");
request ("SetInterfaceString", "TypeHereLabel=Type here...");
request ("SetInterfaceString", "ContinueLabel=Continue...");
SetMenuBackground (_obj245.menubackground)
SetMenuForeground (_obj245.menuforeground)
SetMenuHoverBackground (_obj245.menuhoverbackground)
SetMenuHoverForeground (_obj245.menuhoverforeground)
SetMenuFontName (_obj245.menufont)
SetMenuFontSize (_obj245.menufontsize + "pt")
if (!(_obj245.underlinehyperlinks)) {
TurnOffHyperlinksUnderline ()
}
if (_obj245.showpanes) {
request ("Show", "Panes");
}
else {
request ("Hide", "Panes");
}
if (_obj245.showcommandbar) {
request ("Show", "Command");
}
else {
request ("Hide", "Command");
}
if (_obj245.showlocation) {
request ("Show", "Location");
}
else {
request ("Hide", "Location");
}
if (HasString(_obj245, "panelcontents")) {
SetFramePicture (_obj245.panelcontents);
}
if (_obj245.gridmap) {
ShowGrid (_obj245.mapsize)
Grid_SetScale (_obj245.mapscale);
if (_obj245.pov != null) {
if (_obj245.pov.parent != null) {
Grid_Redraw();
Grid_DrawPlayerInRoom (_obj245.pov.parent);
}
}
}
InitUserInterface();
}
function InitUserInterface()
{

}
function StartGame()
{
StartTurnOutputSection();
if (_obj245.showtitle) {
JsStartOutputSection ("title")
PrintCentered ("<span style=\"font-size:260%\">" + _obj245.gamename + "</span>");
if (_obj245.subtitle != null) {
if (LengthOf(_obj245.subtitle) > 0) {
PrintCentered ("<span style=\"font-size:130%\">" + _obj245.subtitle + "</span>");
}
}
if (_obj245.author != null) {
if (LengthOf(_obj245.author) > 0) {
PrintCentered ("<br/><span style=\"font-size:140%\">by " + _obj245.author + "</span>");
}
}
OutputText ("<div style=\"margin-top:20px\"></div>");
JsEndOutputSection ("title")
}
if (_obj245.pov == null) {
var playerObject = GetObject("player");
if (playerObject == null) {
if (ListCount(AllObjects()) > 0) {
var firstRoom = ObjectListItem(AllObjects(), 0);
}
else {
create ("room");
var firstRoom = room;
}
create ("player");
set(_obj309, "parent", firstRoom);
}
set(_obj245, "pov", _obj309);
}
else {
InitPOV (null, _obj245.pov);
}
InitStatusAttributes();
UpdateStatusAttributes();
InitVerbsList();
if (HasScript(_obj245, "start")) {
runscriptattribute2 (_obj245, "start");
}
UpdateStatusAttributes();
UpdateObjectLinks();
on_ready (function() { if (_obj245.gridmap) {
Grid_DrawPlayerInRoom (_obj245.pov.parent);
}
if (_obj245.displayroomdescriptiononstart) {
OnEnterRoom (null);
}
UpdateStatusAttributes();
UpdateObjectLinks(); });
}
function RandomChance(percentile)
{
return (GetRandomInt(1,100) <= percentile);
}
function SetObjectFlagOn(object, flag)
{
set (object, flag, true);
}
function SetObjectFlagOff(object, flag)
{
set (object, flag, false);
}
function IncreaseObjectCounter(object, counter)
{
if (!(HasInt(object, counter))) {
set (object, counter, 0);
}
set (object, counter, GetInt(object, counter) + 1);
}
function DecreaseObjectCounter(object, counter)
{
if (!(HasInt(object, counter))) {
set (object, counter, 0);
}
set (object, counter, GetInt(object, counter) - 1);
}
function IsSwitchedOn(object)
{
return (GetBoolean(object, "switchedon"));
}
function AddToInventory(object)
{
set(object, "parent", _obj245.pov);
}
function MoveObject(object, parent)
{
set(object, "parent", parent);
}
function MoveObjectHere(object)
{
set(object, "parent", _obj245.pov.parent);
}
function RemoveObject(object)
{
set(object, "parent", null);
}
function MakeObjectVisible(object)
{
set(object, "visible", true);
}
function MakeObjectInvisible(object)
{
set(object, "visible", false);
}
function MakeExitVisible(object)
{
set(object, "visible", true);
}
function MakeExitInvisible(object)
{
set(object, "visible", false);
}
function HelperOpenObject(object)
{
set(object, "isopen", true);
}
function HelperCloseObject(object)
{
set(object, "isopen", false);
}
function CloneObject(object)
{
var newobject = Clone(object);
if (!(HasString(object, "alias"))) {
set(newobject, "alias", object.name);
}
return (newobject);
}
function CloneObjectAndMove(object, newparent)
{
var newobject = CloneObject(object);
set(newobject, "parent", newparent);
return (newobject);
}
function LockExit(exit)
{
set(exit, "locked", true);
}
function UnlockExit(exit)
{
set(exit, "locked", false);
}
function SwitchOn(object)
{
set(object, "switchedon", true);
}
function SwitchOff(object)
{
set(object, "switchedon", false);
}
function SetDark(object)
{
set(object, "dark", true);
}
function SetLight(object)
{
set(object, "dark", false);
}
function SetObjectLightstrength(object, strength)
{
if (LengthOf(strength) == 0) {
set(object, "lightsource", false);
}
else {
set(object, "lightsource", true);
}
set(object, "lightstrength", strength);
}
function SetExitLightstrength(exit, strength)
{
if (LengthOf(strength) == 0) {
set(exit, "lightsource", false);
}
else {
set(exit, "lightsource", true);
}
set(exit, "lightstrength", strength);
}
function ChangePOV(object)
{
if (_obj245.pov != object) {
set(_obj245, "pov", object);
if (_obj245.gridmap) {
Grid_ClearAllLayers ()
Grid_Redraw();
}
OnEnterRoom (null);
}
}
function InitPOV(oldPOV, newPOV)
{
if (oldPOV != null) {
set(oldPOV, "alias", oldPOV.external_alias);
set(oldPOV, "alt", oldPOV.external_alt);
set(oldPOV, "look", oldPOV.external_look);
set(oldPOV, "gender", oldPOV.external_gender);
set(oldPOV, "article", oldPOV.external_article);
}
set(newPOV, "external_alias", newPOV.alias);
set(newPOV, "external_alt", newPOV.alt);
set(newPOV, "external_look", newPOV.look);
set(newPOV, "external_gender", newPOV.gender);
set(newPOV, "external_article", newPOV.article);
if (!(GetBoolean(newPOV, "pov_used"))) {
if (newPOV.alt == null) {
set(newPOV, "pov_alt", newPOV.pov_alt);
}
else {
set(newPOV, "pov_alt", ListCombine(newPOV.alt, newPOV.pov_alt));
}
if (newPOV.alias != null) {
listadd (newPOV.pov_alt, newPOV.alias);
}
if (_obj245.showhealth) {
set(newPOV, "health", 100);
set(newPOV, "changedhealth", function() { if (this.health > 100) {
set(this, "health", 100);
}
else if (this.health == 0) {
if (HasScript(_obj245, "onhealthzero")) {
runscriptattribute2 (_obj245, "onhealthzero");
}
}
else if (this.health < 0) {
set(this, "health", 0);
} });
}
set(newPOV, "pov_used", true);
}
set(newPOV, "alias", newPOV.pov_alias);
set(newPOV, "alt", newPOV.pov_alt);
set(newPOV, "look", newPOV.pov_look);
set(newPOV, "gender", newPOV.pov_gender);
set(newPOV, "article", newPOV.pov_article);
}
function InitVerbsList()
{
set(_obj245, "verbattributes", NewStringList());
set(_obj245, "verbattributeslookup", NewObjectDictionary());
var list_cmd = AllCommands();
var list_cmd_isarray = (Object.prototype.toString.call(list_cmd) === '[object Array]');
for (var iterator_cmd in list_cmd) {
var cmd = list_cmd_isarray ? list_cmd[iterator_cmd] : iterator_cmd;
if (list_cmd_isarray || iterator_cmd!="__dummyKey") { if (HasString(cmd, "property")) {
listadd (_obj245.verbattributes, cmd.property);
dictionaryadd (_obj245.verbattributeslookup, cmd.property, cmd);
} }
}
}
function GetDisplayVerbs(object)
{
if (Contains(_obj245.pov, object)) {
var baselist = object.inventoryverbs;
}
else {
var baselist = object.displayverbs;
}
if (!(_obj245.autodisplayverbs )|| GetBoolean(object, "usestandardverblist")) {
return (baselist);
}
else {
if (HasAttribute(object, "generatedverbslist")) {
var verbs = object.generatedverbslist;
}
else {
var verbs = NewStringList();
var list_attr = GetAttributeNames(object, false);
var list_attr_isarray = (Object.prototype.toString.call(list_attr) === '[object Array]');
for (var iterator_attr in list_attr) {
var attr = list_attr_isarray ? list_attr[iterator_attr] : iterator_attr;
if (list_attr_isarray || iterator_attr!="__dummyKey") { if (ListContains(_obj245.verbattributes, attr)) {
var cmd = ObjectDictionaryItem(_obj245.verbattributeslookup, attr);
if (HasString(cmd, "displayverb")) {
var displayverb = CapFirst(cmd.displayverb);
}
else {
var displayverb = CapFirst(attr);
}
if (!(ListContains(baselist, displayverb))) {
listadd (verbs, displayverb);
}
} }
}
set(object, "generatedverbslist", verbs);
}
if (GetBoolean(object, "useindividualverblist")) {
return (verbs);
}
else {
return (ListCombine(baselist, verbs));
}
}
}
function ShowMenu(caption, options, allowCancel, callback)
{
var outputsection = StartNewOutputSection();
OutputText (caption);
var count = 0;
set(_obj245, "menuoptionskeys", NewStringList());
var options_isarray = (Object.prototype.toString.call(options) === '[object Array]');
for (var iterator_option in options) {
var option = options_isarray ? options[iterator_option] : iterator_option;
if (options_isarray || iterator_option!="__dummyKey") { listadd (_obj245.menuoptionskeys, option);
var count = count + 1;
if (overloadedFunctions.TypeOf(options) == "stringlist") {
var optionText = option;
}
else {
var optionText = StringDictionaryItem(options, option);
}
OutputText (count + ": <a class=\"cmdlink\" style=\"" + GetCurrentLinkTextFormat() + "\" onclick=\"ASLEvent('ShowMenuResponse','" + option + "')\">" + optionText + "</a>"); }
}
EndOutputSection (outputsection);
set(_obj245, "menuoptions", options);
set(_obj245, "menuallowcancel", allowCancel);
set(_obj245, "menucallback", callback);
set(_obj245, "menuoutputsection", outputsection);
}
function ShowMenuResponse(option)
{
if (_obj245.menucallback == null) {
error ("Unexpected menu response");
}
else {
var parameters = NewStringDictionary();
dictionaryadd (parameters, "result", option);
var script = _obj245.menucallback;
ClearMenu();
invoke (script, parameters);
}
}
function HandleMenuTextResponse(input)
{
var handled = false;
if (IsInt(input)) {
var number = ToInt(input);
if (number > 0 && number <= ListCount(_obj245.menuoptionskeys)) {
var handled = true;
ShowMenuResponse (StringListItem(_obj245.menuoptionskeys, number - 1));
}
}
return (handled);
}
function ClearMenu()
{
HideOutputSection (_obj245.menuoutputsection);
set(_obj245, "menuoutputsection", null);
set(_obj245, "menuoptions", null);
set(_obj245, "menucallback", null);
}
function StartNewOutputSection()
{
if (!(HasInt(_obj245, "lastoutputsection"))) {
set(_obj245, "lastoutputsection", 0);
}
set(_obj245, "lastoutputsection", _obj245.lastoutputsection + 1);
var name = "section" + _obj245.lastoutputsection;
JsStartOutputSection (name)
return (name);
}
function EndOutputSection(name)
{
JsEndOutputSection (name)
}
function HideOutputSection(name)
{
JsHideOutputSection (name)
}
function StartTurnOutputSection()
{
if (HasString(_obj245, "currentturnoutputsection")) {
set(_obj245, "lastturnoutputsection", _obj245.currentturnoutputsection);
EndOutputSection (_obj245.currentturnoutputsection);
}
set(_obj245, "currentturnoutputsection", StartNewOutputSection());
}
function HidePreviousTurnOutput()
{
if (HasString(_obj245, "lastturnoutputsection")) {
HideOutputSection (_obj245.lastturnoutputsection);
}
}
function Ask(question, callback)
{
var options = NewStringList();
listadd (options, "Yes");
listadd (options, "No");
set(_obj245, "askcallback", callback);
ShowMenu (question, options, false, function (result) { var parameters = NewDictionary();
if (result == "Yes") {
var boolresult = true;
}
else {
var boolresult = false;
}
dictionaryadd (parameters, "result", boolresult);
var callback = _obj245.askcallback;
set(_obj245, "askcallback", null);
invoke (callback, parameters); });
}
function AllKeysAvailable(object)
{
if (HasObject(object, "key")) {
if (!(HasInt(object,"keycount"))) {
set(object, "keycount", 1);
set(object, "key1", object.key);
}
if (!(HasObject(object, "key1"))) {
set(object, "key1", object.key);
}
}
for (var x = 1; x <= object.keycount; x++) {
var keyname = "key" + ToString(x);
if (HasObject(object, keyname)) {
if (!(ListContains(ScopeInventory(), GetAttribute(object, keyname)))) {
return (false);
}
}
}
return (true);
}
