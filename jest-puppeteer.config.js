module.exports = {
  server: {
    command: 'node_modules/.bin/browserify test/_index.js -o test/server/index.build.js && node_modules/.bin/http-server -p 8081 test/server',
    port: 8081
  },
  launch: {
    dumpio: true,
    //headless: false,
    //slowMo: 80
  }
}
