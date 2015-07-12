#!/usr/bin/env node
"use strict";

var _require = require("docopt");

var docopt = _require.docopt;

var _ = require("lodash");
var fs = require("fs");
var $S = require("string");
var debug = require("debug")("index.js");
var $m = require("moment");

var $s = require("shelljs");
var $b = require("bluebird");
$s = $b.promisifyAll($s);
fs = $b.promisifyAll(fs);

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

var checkStatus = function () {
    return $s.execAsync("git status -s", {
        silent: true
    }).then(function (it) {
        console.log(it);
        if (it.length > 0) {
            return $b.reject("Sorry, repo not clean");
        } else {
            console.log("ok");
            return $b.resolve("Ok.");
        }
    });
};

var getGitHistory = function (opts) {
    return $s.execAsync(gitCommand(opts), {
        silent: true
    }).then(function (output) {
        var s = "[" + output.replace(/,$/gi, "") + "]";
        return JSON.parse(s);
    });
};

var getJson = function (file, opts, nocheck) {
    "use strict";
    if (_.isNull(file)) {
        if (!nocheck) {
            return checkStatus().then(function () {
                return getGitHistory(opts);
            });
        } else {
            return getGitHistory(opts);
        }
    } else {
        var res = gitCommandFile(file);
        return $b.resolve(JSON.parse(res));
    }
};

var tags = ["feat", "fix", "docs", "style", "refactor", "perf", "test", "chore"];

var getOptions = function (doc) {
    "use strict";
    var o = docopt(doc);
    var file = getOption("-f", "--file", null, o);
    var help = getOption("-h", "--help", false, o);
    var outfile = o.OUTFILE;
    var opts = o["--opts"] || "";
    var nocheck = o["--nostatus"] || false;
    var t = _.words(o["--keywords"]);
    if (t.length > 0) {
        tags = t;
    }
    return {
        help: help, file: file, opts: opts, outfile: outfile, nocheck: nocheck
    };
};

// https://github.com/angular/angular.js/blob/master/CONTRIBUTING.md

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

var outputMarkdown = function (data, file) {
    var content = "";
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
            content = content + ("\n# " + descs[t] + "\n\n");
        }

        d = _.groupBy(d, "message");
        _.forEach(d, function (commits, message) {
            content = content + ("-    " + message + " -- ");
            if (commits.length > 0) {
                var s = _.map(commits, function (c) {
                    return "[" + $m(new Date(c.date)).format("MMM Do YY") + "](../../commit/" + c.commit + ")";
                });
                content = content + s.join(", ") + "\n";
            }
        });
    });
    if (file === "stdout") {
        console.log(content);
        return 0;
    } else {
        console.log("Writing " + file);
        return fs.writeFileAsync(file, content);
    }
};

var doc = fs.readFileSync(__dirname + "/docs/usage.md", "utf8");

var main = function () {
    "use strict";

    var _getOptions = getOptions(doc);

    var file = _getOptions.file;
    var opts = _getOptions.opts;
    var outfile = _getOptions.outfile;
    var nocheck = _getOptions.nocheck;

    getJson(file, opts, nocheck).then(function (content) {
        return outputMarkdown(content, outfile);
    }).then(function () {
        console.log("done.");
        process.exit(0);
    }).caught(function (it) {
        console.log("not done. " + it);
        process.exit(1);
    });
};

main();
