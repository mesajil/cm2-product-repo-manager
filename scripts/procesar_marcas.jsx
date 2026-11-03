#target photoshop

function trimStr(value) {
    return String(value).replace(/^\s+|\s+$/g, "");
}

function findLayerSetByName(container, targetName) {
    var upperTarget = trimStr(targetName).toUpperCase();
    var i;

    for (i = 0; i < container.layerSets.length; i++) {
        if (trimStr(container.layerSets[i].name).toUpperCase() === upperTarget) {
            return container.layerSets[i];
        }
    }

    for (i = 0; i < container.layerSets.length; i++) {
        var found = findLayerSetByName(container.layerSets[i], targetName);
        if (found) return found;
    }

    return null;
}

function writeStatus(path, value) {
    var file = new File(path);
    file.encoding = "UTF-8";
    if (!file.open("w")) throw new Error("No se pudo escribir el estado del procesamiento.");
    file.write(value);
    file.close();
}

function quoteJson(value) {
    return '"' + String(value)
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/\r/g, "\\r")
        .replace(/\n/g, "\\n")
        .replace(/\t/g, "\\t") + '"';
}

function main() {
    var scriptFile = new File($.fileName);
    var jobFile = new File(scriptFile.parent.fsName + "/job.json");
    var job;
    var results = [];
    var i;

    try {
        if (!jobFile.exists) throw new Error("No se encontró job.json.");
        jobFile.encoding = "UTF-8";
        if (!jobFile.open("r")) throw new Error("No se pudo leer job.json.");
        job = eval("(" + jobFile.read() + ")");
        jobFile.close();

        for (i = 0; i < job.jobs.length; i++) {
            var item = job.jobs[i];
            var doc = null;
            var result = { index: i, status: "error", error: "" };

            try {
                var psdFile = new File(item.psdPath);
                if (!psdFile.exists) throw new Error("No se encontró el PSD copiado.");

                doc = app.open(psdFile);
                var brandDirectory = findLayerSetByName(doc, item.directory);

                if (!brandDirectory) {
                    result.status = "skipped-directory";
                } else {
                    var targetLogos = {};
                    var j;
                    for (j = 0; j < item.logos.length; j++) {
                        targetLogos[trimStr(item.logos[j]).toUpperCase()] = true;
                    }

                    var matched = false;
                    for (j = 0; j < brandDirectory.layers.length; j++) {
                        if (targetLogos[trimStr(brandDirectory.layers[j].name).toUpperCase()]) {
                            matched = true;
                        }
                    }

                    if (!matched) {
                        result.status = "skipped-logo";
                    } else {
                        brandDirectory.visible = true;
                        for (j = 0; j < brandDirectory.layers.length; j++) {
                            var layer = brandDirectory.layers[j];
                            layer.visible = Boolean(targetLogos[trimStr(layer.name).toUpperCase()]);
                        }
                        doc.save();
                        result.status = "processed";
                    }
                }

                doc.close(SaveOptions.DONOTSAVECHANGES);
                doc = null;
            } catch (err) {
                result.error = err.message || String(err);
                if (doc) {
                    try {
                        doc.close(SaveOptions.DONOTSAVECHANGES);
                    } catch (closeError) {
                        result.error += " No se pudo cerrar el documento: " +
                            (closeError.message || String(closeError));
                    }
                }
            }

            results.push(result);
        }

        var output = '{"results":[';
        for (i = 0; i < results.length; i++) {
            if (i > 0) output += ',';
            output += '{"index":' + results[i].index +
                ',"status":' + quoteJson(results[i].status) +
                ',"error":' + quoteJson(results[i].error) + '}';
        }
        output += ']}';
        writeStatus(job.statusPath, output);
    } catch (err) {
        if (job && job.statusPath) {
            writeStatus(job.statusPath, '{"error":' + quoteJson(err.message || String(err)) + '}');
        }
    }
}

var previousDialogMode = app.displayDialogs;
try {
    app.displayDialogs = DialogModes.NO;
    main();
} finally {
    app.displayDialogs = previousDialogMode;
}
