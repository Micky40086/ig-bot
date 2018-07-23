//const functions = require('firebase-functions')
//exports.contactSearch = functions.https.onRequest((req, res) => {
// coding here
//})

const functions = require('firebase-functions')
const line = require('@line/bot-sdk')

const client = new line.Client({
  channelAccessToken: 'odWztlhkQQk012eRT8z/o8xGcyO1U9M4+mf/a5DAOld3tT3eOzuOT1oF8dnD0LVXazC+yeCPbcyXhXuXauqwKqobqPjWPrwB0n51k8jKNDR1cUhl4ixu9RuYuMkX164fipeVsTDhSPMcEmxv638yVgdB04t89/1O/w1cDnyilFU='
})

exports.sendMessage = function(id, message) {
  return client.pushMessage(id, message)
  .then(() => {
  })
  .catch((err) => {
    console.log(err)
  })
}

exports.sendMulticastMessage = function(idArray, message) {
  return client.multicast(idArray, message)
  .then(() => {
  })
  .catch((err) => {
    console.log(err)
  })
}
