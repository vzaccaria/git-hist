var {
    generateProject
} = require('diy-build')

var path = require('path')

generateProject(_ => {

    _.babel = (dir, ...deps) => {
        var command = (_) => `./node_modules/.bin/babel ${_.source} -o ${_.product}`
        var product = (_) => `./lib/${path.basename(_.source)}`
        _.compileFiles(...([command, product, dir].concat(deps)))
    }


    _.collect("docs", _ => {
        _.cmd("./node_modules/.bin/mustache package.json docs/readme.md | ./node_modules/.bin/stupid-replace '~USAGE~' -f docs/usage.md > readme.md")
        _.cmd("./index.js > history.md")
        _.cmd("mkdir -p ./man")
        _.cmd("pandoc -s -f markdown -t man readme.md > ./man/git-hist.1")
        _.cmd("hub cm 'update docs and history.md'")
    })

    _.collectSeq("all", _ => {
        _.collect("build", _ => {
            _.babel("src/*.js")
        })
        _.cmd("((echo '#!/usr/bin/env node') && cat ./lib/index.js) > index.js", "./lib/index.js")
        _.cmd("chmod +x ./index.js")
    })

    _.collect("test", _ => {
        _.cmd("make all")
        _.cmd("./node_modules/.bin/mocha ./lib/test.js")
    })

    _.collect("update", _ => {
        _.cmd("make clean && ./node_modules/.bin/babel configure.js | node")
    });

    ["major", "minor", "patch"].map(it => {
        _.collect(it, _ => {
            _.cmd(`make all`)
            _.cmd(`./node_modules/.bin/xyz -i ${it}`)
        })
    })

})
