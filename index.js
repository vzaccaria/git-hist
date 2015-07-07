#!/usr/bin/env node
"use strict";

var _require = require("docopt");

var docopt = _require.docopt;

var _ = require("lodash");
var fs = require("fs");
var $S = require("string");

var $s = require("shelljs");
var $b = require("bluebird");
$s = $b.promisifyAll($s);

var getOption = function (a, b, def, o) {
    "use strict";
    if (!_.isUndefined(o[a])) {
        return o[a];
    } else {
        if (!_.isUndefined(o[b])) {
            return o[b];
        } else {
            return def;
        }
    }
};

var gitCommandFile = function (f) {
    var file = $s.cat(f);
    var s = "[" + file.replace(/,\n$/gi, "") + "]";
    return s;
};

var gitCommand = function (o) {
    var c = "git log --pretty=format:'{%n  \"commit\": \"%H\",%n  \"author\": \"%an <%ae>\",%n  \"date\": \"%ad\",%n  \"message\": \"%s\"%n},' " + o;
    return c;
};

var getJson = function (file, opts) {
    "use strict";
    if (_.isNull(file)) {
        return $s.execAsync(gitCommand(opts), {
            silent: true
        }).then(function (output) {
            var s = "[" + output.replace(/,$/gi, "") + "]";
            return JSON.parse(s);
        });
    } else {
        return $b.resolve(JSON.parse(gitCommandFile(file)));
    }
};

var getOptions = function (doc) {
    "use strict";
    var o = docopt(doc);
    var file = getOption("-f", "--file", null, o);
    var help = getOption("-h", "--help", false, o);
    var opts = o["--opts"] || "";
    return {
        help: help, file: file, opts: opts
    };
};

// https://github.com/angular/angular.js/blob/master/CONTRIBUTING.md

var tags = ["feat", "fix", "docs", "style", "refactor", "perf", "test", "chore"];

var descs = {
    feat: "New features",
    fix: "Bug fixes",
    docs: "Documentation commits",
    style: "Style change (non functional)",
    refactor: "Refactorings",
    perf: "Performance improvements",
    test: "Tests",
    chore: "Changes to the build process"
};

var outputMarkdown = function (data) {

    _.map(tags, function (t) {
        var d = _.filter(data, function (it) {
            if ($S(it.message).contains("" + t + ":")) {
                it.message = it.message.replace("" + t + ":", "");
                return true;
            } else {
                return false;
            }
        });
        if (d.length > 0) {
            console.log("\n# " + descs[t] + "\n");
            _.forEach(d, function (c) {
                console.log("-    " + c.message + " (" + c.date + ") - [view](../../commits/@" + c.commit + ")");
            });
        }
    });
};

var doc = fs.readFileSync(__dirname + "/docs/usage.md", "utf8");

var main = function () {
    "use strict";

    var _getOptions = getOptions(doc);

    var help = _getOptions.help;
    var file = _getOptions.file;
    var opts = _getOptions.opts;

    getJson(file, opts).then(outputMarkdown);
};

main();
