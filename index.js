const Bot = require('./api')
const {createServer} = require("http")

let b = new Bot('tefixuca@clout.wiki', {
    bitoUserWsId: 526669,
    otpObj: {
        sixDigitAuthCode: "077287672529828347",
        newUser: false,
        userId: 828347
    },
    bitoaiToken: "077287672529828347",
    uIdForXClient: "4ade8d73-af1e-000f-b284-a4c8e638a490",
    currentSessionID: "fcc4c0fa-8e14-4132-90a1-ef2613e2315f"
})

createServer((req, res) => {
    b.getAnswer("Hi").then(ans => {
        res.write(ans).end()
    }).catch(reason => {
        console.error(reason)
        res.write("Hi").end()
    })
})