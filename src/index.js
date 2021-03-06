var {
    docopt
} = require('docopt')
var _ = require('lodash')
var fs = require('fs')
var $S = require('string')
var debug = require('debug')('index.js')
var $m = require('moment')

var $s = require('shelljs')
var $b = require('bluebird')
$s = $b.promisifyAll($s)
fs = $b.promisifyAll(fs)

var getOption = (a, b, def, o) => {
    "use strict"
    if (!_.isUndefined(o[a])) {
        return o[a]
    } else {
        if (!_.isUndefined(o[b])) {
            return o[b]
        } else {
            return def
        }
    }
}

var gitCommandFile = f => {
    var file = $s.cat(f)
    var s = `[${file.replace(/,\n$/gi, '')}]`
    return s
}

var gitCommand = (o) => {
    var c = `git log --pretty=format:'{%n  "commit": "%H",%n  "author": "%an <%ae>",%n  "date": "%ad",%n  "message": "%s"%n},' ${o}`
    return c
}

var checkStatus = () => {
    return $s.execAsync("git status -s", {
        silent: true
    }).then(it => {
        console.log(it)
        if (it.length > 0) {
            return $b.reject("Sorry, repo not clean")
        } else {
            console.log('ok')
            return $b.resolve("Ok.");
        }
    })
}

var getGitHistory = (opts) => {
    return $s.execAsync(gitCommand(opts), {
        silent: true
    }).then((output) => {
        var s = `[${output.replace(/,$/gi, '')}]`
        return JSON.parse(s)
    })
}

var getJson = (file, opts, nocheck) => {
    "use strict"
    if (_.isNull(file)) {
        if (!nocheck) {
            return checkStatus().then(() => {
                return getGitHistory(opts)
            })
        } else {
            return getGitHistory(opts)
        }
    } else {
        var res = (gitCommandFile(file))
        var t = JSON.parse(res);
        return $b.resolve(t)
    }
}

var tags = ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore'];

var getOptions = doc => {
    "use strict"
    var o = docopt(doc)
    var file = getOption('-f', '--file', null, o)
    var help = getOption('-h', '--help', false, o)
    var outfile = o['OUTFILE']
    var opts = o['--opts'] || '';
    var nocheck = o['--nostatus'] || false;
    var kw = o['--keywords'] || "";
    var t = _.words(kw)
    if(!file)
        file=null
    if (t.length > 0) {
        tags = t
    }
    return {
        help, file, opts, outfile, nocheck
    }
}

// https://github.com/angular/angular.js/blob/master/CONTRIBUTING.md


var descs = {
    'feat': 'New features',
    'fix': 'Bug fixes',
    'docs': 'Documentation commits',
    'style': 'Style change (non functional)',
    'refactor': 'Refactorings',
    'perf': 'Performance improvements',
    'test': 'Tests',
    'chore': 'Changes to the build process'
}



var outputMarkdown = (data, file) => {
    var content = ""
    _.map(tags, (t) => {
        var d = _.filter(data, it => {
            if ($S(it.message).contains(`${t}:`)) {
                it.message = it.message.replace(`${t}:`, '')
                return true
            } else {
                return false
            }
        })

        if (d.length > 0) {
            content = content + `\n# ${descs[t]}\n\n`
        }

        d = _.groupBy(d, 'message')
        _.forEach(d, (commits, message) => {
            content = content + `-    ${message} -- `
            if (commits.length > 0) {
                var s = _.map(commits, c => {
                    return `[${$m(new Date(c.date)).format('MMM Do YY')}](../../commit/${c.commit})`
                })
                content = content + s.join(', ') + '\n'
            }
        })
    })
    if (file === 'stdout') {
        console.log(content)
        return 0;
    } else {
        console.log(`Writing ${file}`)
        return fs.writeFileAsync(file, content)
    }
}

var doc = fs.readFileSync(__dirname + "/docs/usage.md", 'utf8')

var main = () => {
    "use strict"
    var {
        file, opts, outfile, nocheck
    } = (getOptions(doc))
    debug({file, opts, outfile, nocheck})
    getJson(file, opts, nocheck).then((content) => {
        return outputMarkdown(content, outfile)
    }).then(() => {
        console.log("done.")
        process.exit(0)
    }).caught(it => {
        console.log(`not done. ${it}`)
        process.exit(1)
    })
}

main()
