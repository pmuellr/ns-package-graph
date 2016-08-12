'use strict'

const path = require('path')

require('request')
require('express')

process.title = path.basename(__dirname)

console.log('just waiting for you to press Ctrl-C ...')

setInterval(function () {}, 1000)
