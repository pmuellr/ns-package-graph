'use strict'

exports.start = start

const fs = require('fs')
const path = require('path')
const http = require('http')

const pkgJSON = require('../package.json')
const generator = require('./generator')

const FavIconFile = path.join(__dirname, '..', 'images', 'favicon.png')
const FavIconBytes = fs.readFileSync(FavIconFile)

// Start the HTTP server.
function start (opts) {
  const port = opts.server
  const server = http.createServer(onRequest)
  server.listen(port, 'localhost', onListen)

  function onListen () {
    console.log(`${pkgJSON.name} starting on http://localhost:${port}`)
  }

  function onRequest (req, res) {
    handleRequest(opts, req, res)
  }
}

// Handle an HTTP request.
function handleRequest (opts, req, res) {
  console.log(`HTTP GET ${req.url}`)
  if (req.url === '/') return htmlResult(res, BookMarkletPage)
  if (req.url === '/favicon.ico') return pngResult(res, FavIconBytes)

  const parts = req.url.split(/\//g) // split /abc/foo -> ['','abc','foo']
  const agentID = parts[1]
  if (parts.length !== 2 || agentID == null) {
    console.log(`invalid url: ${req.url}`)
    return htmlResult(res, BookMarkletPage)
  }

  console.log(`generating package diagram for ${agentID}`)
  generator.generate(agentID, opts, onDoc)

  function onDoc (err, doc) {
    if (err || doc == null) return htmlResult(res, BookMarkletPage)

    if (opts.format === 'svg') return svgResult(res, doc)
    if (opts.format === 'html') return htmlResult(res, doc)

    textResult(res, doc)
  }
}

function svgResult (res, svg) {
  res.statusCode = 200
  res.setHeader('Content-Type', 'image/svg+xml')
  res.write(svg)
  res.end()
}

function pngResult (res, bytes) {
  res.statusCode = 200
  res.setHeader('Content-Type', 'image/png')
  res.write(bytes)
  res.end()
}

function htmlResult (res, html) {
  res.statusCode = 200
  res.setHeader('Content-Type', 'text/html')
  res.write(html)
  res.end()
}

function textResult (res, text) {
  res.statusCode = 200
  res.setHeader('Content-Type', 'text/plain')
  res.write(text)
  res.end()
}

const BookMarkletPage = `
<p>Create a bookmarklet (a bookmark) with the following value as the URL:

<pre>
javascript:s='http://localhost:4000';h=location.href;m=h.match(/.*\/app\/.*\?processid=(.*)/)||h.match(/.*\/app\/.*\/process\/(.*)/)||h.match(/.*\/app\/(.*)/);if(m!=null)open(s+'/'+m[1],'_blank')
</pre>

<p>Edit the link to change the server URL to point to your <tt>${pkgJSON.name}</tt> server.

<p>For more information, see: <a href="${pkgJSON.homepage}">the <tt>${pkgJSON.name}</tt> homepage.</a>
`
