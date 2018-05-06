const functions = require('firebase-functions')
const admin = require('firebase-admin')
admin.initializeApp()

const getApp = function(appId) {
    // coding here
    return admin.firestore().collection('users').doc(appId).get()
}

let chatbot = require('./bot')
let crawler = require('./crawl')

const sub_items = admin.firestore().collection('sub_items')

exports.checkIg = functions.https.onRequest((req, res) => {
    const dateTime = Date.now()
    const timestamp = Math.floor(dateTime / 1000)
    crawler.getNewPost('marcellasne_',timestamp)
    .then((messages) => {
        var promises = messages.map( function(message) {
            return chatbot.sendMessage("U5ae6cc0b263a5fd8b5ef8fc7f2205e57", message)
        })
        Promise.all(promises).then((results) => {
            res.status(200).send('HEHEHE')
        }).catch(() => {
            res.status(500).send('oh no')
        })
    }).catch((error) => {
        res.status(500).send(error.message)
    })
})

exports.sendNewPost = functions.https.onRequest((req, res) => {
    const dateTime = Date.now()
    const timestamp = Math.floor(dateTime / 1000)
    sub_items.get().then(snapShot => {
        if (!snapShot.empty) {
            let items_promises = []
            snapShot.forEach(doc => {
                let item = doc.data()
                items_promises.push(
                    crawler.getNewPost(item.account,timestamp)
                    .then((messages) => {
                        if (messages.length) {
                            let promises = []
                            messages.forEach(function(message) {
                                item.users.forEach((user) => {
                                    promises.push(chatbot.sendMessage(user, message))
                                })
                            })
                            Promise.all(promises).then(() => {
                                console.log(item.account, 'finish')
                            }).catch(() => {
                                console.log(item.account, 'oh no')
                            })
                        } else {
                            console.log(item.account, 'No new Posts')
                        }
                    }).catch((error) => {
                        console.log(error)
                    })
                )
            })
            Promise.all(items_promises).then(() => {
                res.status(200).send('HEHEHE')
            }).catch((error) => {
                res.status(500).send(error)
            })
        } else {
            res.status(200).send('No sub_items')
        }
    }).catch((error) => {
        res.status(500).send(error)
    })
})

exports.addSubscribe = functions.https.onRequest((req, res) => {
    if (req.body.sourceId === undefined) {
        res.status(400).send({ message: 'No sourceId defined!' })
    } else if (req.body.subAccount === undefined) {
        res.status(400).send({ message: 'No subAccount defined!' })
    } else {
        sub_items.where("account", "==", req.body.subAccount).get()
        .then(snapShot => {
            new Promise(function(resolveParam, rejectParam) {
                if (!snapShot.empty) {
                    snapShot.forEach(doc => {
                        if (doc.data().users.includes(req.body.sourceId)) {
                            resolveParam("you are already subscribe " + req.body.subAccount)
                        } else {
                            temp_array = doc.data().users
                            temp_array.push(req.body.sourceId)
                            sub_items.doc(doc.id).update({ users: temp_array })
                            .then(function(docRef) {
                                resolveParam("subscribe " + req.body.subAccount + " success")
                            })
                            .catch(function(error) {
                                rejectParam(error)
                            })
                        }
                    })
                } else {
                    sub_items.add({
                        account: req.body.subAccount,
                        users: [ req.body.sourceId ]
                    })
                    .then(function(docRef) {
                        resolveParam("sub_items written with ID " + docRef.id)
                    })
                    .catch(function(error) {
                        rejectParam(error)
                    })
                }
            }).then((return_message) => {
                res.status(200).send({ message: return_message })
            }).catch((error) => {
                res.status(200).send({ message: error })    
            })
        }).catch(error => {
            res.status(500).send(error)
        })
    }
})




