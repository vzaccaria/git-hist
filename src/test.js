var chai = require('chai')
chai.use(require('chai-as-promised'))
var should = chai.should()
var promise = require('bluebird')
var fs = require('fs');
/**
 * Promised version of shelljs exec
 * @param  {string} cmd The command to be executed
 * @return {promise}     A promise for the command output
 */
function exec(cmd) {
  "use strict"
  return new promise((resolve, reject) => {
    require('shelljs').exec(cmd, {
      async: true,
      silent: true
    }, (code, output) => {
      if (code !== 0) {
        reject(output)
      } else {
        resolve(output)
      }
    })
  })
}

/*global describe, it, before, beforeEach, after, afterEach */

var fixNoKeywords = "\n# New features\n\n-     change signatures for testbench helpers and derive Lift instances for Inputs and outputs -- [Jul 6th 15](../../commit/24635999cd9cf0cd797a21a13bb91a410e40e8e0)\n\n# Bug fixes\n\n-     Fix gitignore -- [Jul 6th 15](../../commit/ee39307477651f51bc6c98dbdac7d1507c06fbfd)\n\n# Refactorings\n\n-     Move simulation data into external file for testbench generation -- [Jul 6th 15](../../commit/d0b5e4628690e932aa2fc35b4529e869a0ce09e3)\n\ndone.\n" 

var fixWithKeywords = "\n# New features\n\n-     change signatures for testbench helpers and derive Lift instances for Inputs and outputs -- [Jul 6th 15](../../commit/24635999cd9cf0cd797a21a13bb91a410e40e8e0)\n\n# Bug fixes\n\n-     Fix gitignore -- [Jul 6th 15](../../commit/ee39307477651f51bc6c98dbdac7d1507c06fbfd)\n\ndone.\n"

var fixMultipleCommits = '\n# New features\n\n-     change signatures for testbench helpers and derive Lift instances for Inputs and outputs -- [Jul 6th 15](../../commit/24635999cd9cf0cd797a21a13bb91a410e40e8e0)\n\n# Bug fixes\n\n-     Fix gitignore -- [Jul 6th 15](../../commit/ee39307477651f51bc6c98dbdac7d1507c06fbfd), [Jul 6th 15](../../commit/ee39307477651f51bc6c98dbdac7d1507c06fbfd)\n\n# Refactorings\n\n-     Move simulation data into external file for testbench generation -- [Jul 6th 15](../../commit/d0b5e4628690e932aa2fc35b4529e869a0ce09e3)\n\ndone.\n'


describe('#command', () => {
  "use strict"
  it('should work without keywords', () => {
    return exec(`${__dirname}/../index.js stdout -f ${__dirname}/../tests/test.txt`).should.eventually.contain(fixNoKeywords)
  })
  it('should work with keywords', () => {
    return exec(`${__dirname}/../index.js stdout -k 'feat,fix' -f ${__dirname}/../tests/test.txt`).should.eventually.contain(fixWithKeywords)
  })
  it('should work with multiple commits for the same message', () => {
    return exec(`${__dirname}/../index.js stdout -f ${__dirname}/../tests/test-same-commits.txt`).should.eventually.contain(fixMultipleCommits)
  })
})
