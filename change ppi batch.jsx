#target photoshop
    (function () {
        if (app.documents.length === 0) {
            alert("No document detected, please open documen.");
            return;
        }
        var doc = app.activeDocument;
        var oldRulerUnits = app.preferences.rulerUnits;
        app.preferences.rulerUnits = Units.PIXELS;
        var curW = Math.round(doc.width.value);
        var curH = Math.round(doc.height.value);
        var curRes = doc.resolution;
        var channels = doc.channels.length;
        if (channels < 1) channels = 1;
        var bytes = curW * curH * channels;
        var sizeLabel = formatBytes(bytes);
        app.preferences.rulerUnits = oldRulerUnits;

        // Image Mode options (label, current-mode enum, conversion enum).
        var MODES = [
            { label: "RGB Color",  doc: DocumentMode.RGB,       change: ChangeMode.RGB },
            { label: "Grayscale",  doc: DocumentMode.GRAYSCALE, change: ChangeMode.GRAYSCALE },
            { label: "CMYK Color", doc: DocumentMode.CMYK,      change: ChangeMode.CMYK }
        ];
        var curModeIndex = 0; // default RGB Color
        for (var mi = 0; mi < MODES.length; mi++) {
            if (doc.mode === MODES[mi].doc) { curModeIndex = mi; break; }
        }

        var dlg = new Window("dialog", "Kitsu ppi changer batch");
        dlg.alignChildren = "fill";
        dlg.margins = 16;
        dlg.spacing = 10;
        var info = dlg.add("group");
        info.orientation = "column";
        info.alignChildren = "left";
        info.spacing = 4;
        var rowSize = info.add("group");
        rowSize.add("statictext", undefined, "Image Size:");
        rowSize.add("statictext", undefined, sizeLabel);
        var rowDim = info.add("group");
        rowDim.add("statictext", undefined, "Dimensions:");
        rowDim.add("statictext", undefined, curW + " px  x  " + curH + " px");
        dlg.add("panel");
        var gW = dlg.add("group");
        gW.add("statictext", undefined, "Width:");
        var wInput = gW.add("edittext", undefined, String(curW));
        wInput.characters = 8;
        wInput.enabled = false;
        gW.add("statictext", undefined, "Pixels");
        var gH = dlg.add("group");
        gH.add("statictext", undefined, "Height:");
        var hInput = gH.add("edittext", undefined, String(curH));
        hInput.characters = 8;
        hInput.enabled = false;
        gH.add("statictext", undefined, "Pixels");
        var gR = dlg.add("group");
        gR.add("statictext", undefined, "Resolution:");
        var resInput = gR.add("edittext", undefined, String(curRes));
        resInput.characters = 8;
        gR.add("statictext", undefined, "Pixels/Inch");
        var gM = dlg.add("group");
        gM.add("statictext", undefined, "Image Mode:");
        var modeList = [];
        for (var li = 0; li < MODES.length; li++) { modeList.push(MODES[li].label); }
        var modeDropdown = gM.add("dropdownlist", undefined, modeList);
        modeDropdown.selection = curModeIndex;
        dlg.add("panel");
        var batchCheck = dlg.add("checkbox", undefined, "Batch");
        batchCheck.value = true;
        var btns = dlg.add("group");
        btns.alignment = "center";
        btns.spacing = 10;
        btns.add("button", undefined, "OK", { name: "ok" });
        btns.add("button", undefined, "Cancel", { name: "cancel" });
        resInput.active = true;
        if (dlg.show() !== 1) {
            return;
        }
        var newRes = parseFloat(resInput.text);
        if (isNaN(newRes) || newRes <= 0) {
            alert("Invalid PPI number: \"" + resInput.text + "\"\nAdd PPI number.");
            return;
        }
        var selMode = MODES[modeDropdown.selection.index];
        var targets = [];
        if (batchCheck.value) {
            for (var i = 0; i < app.documents.length; i++) {
                targets.push(app.documents[i]);
            }
        } else {
            targets.push(app.activeDocument);
        }
        var processed = 0;
        var skipped = 0;
        var skippedNames = [];
        for (var j = 0; j < targets.length; j++) {
            var d = targets[j];
            try {
                app.activeDocument = d;
                d.resizeImage(undefined, undefined, newRes, ResampleMethod.NONE);
                applyMode(d, selMode);
                var hasPath = false;
                try { hasPath = (d.fullName !== null && d.fullName !== undefined); } catch (e0) { hasPath = false; }

                if (hasPath) {
                    d.save();
                    processed++;
                } else {
                    skipped++;
                    skippedNames.push(d.name + " (Cant save)");
                }
            } catch (err) {
                skipped++;
                skippedNames.push((d && d.name ? d.name : "dokumen #" + (j + 1)) + " (" + err + ")");
            }
        }
        var msg = "Complete.\nNew PPI: " + newRes + " px/inch\n" +
            "Processed & Saved: " + processed + "\n" +
            "Skiped: " + skipped;
        if (skippedNames.length > 0) {
            msg += "\n\Skipped:\n - " + skippedNames.join("\n - ");
        }
        alert(msg);
        function applyMode(d, m) {
            if (d.mode === m.doc) return; // already in target mode
            d.changeMode(m.change);
        }
        function formatBytes(b) {
            var KB = 1024, MB = KB * 1024;
            if (b >= MB) return (b / MB).toFixed(2) + "M";
            if (b >= KB) return (b / KB).toFixed(1) + "K";
            return b + "B";
        }
    })();
