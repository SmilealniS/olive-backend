require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const crypto = require('crypto')
const cors = require('cors')
const KJUR = require('jsrsasign');

const app = express()

// app.set('baseUrl', 'http://olive-zoom.northanapon.com');
app.set('baseUrl', 'https://e113342c1f56.ngrok.app');

// app.use((req, res, next) => {
//     res.setHeader('Access-Control-Allow-Origin', 'https://90acce2ace74.ngrok.app');
//     res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
//     res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
//     res.setHeader('Access-Control-Allow-Credentials', 'true');
//     next();
// });


const port = 8000

// ---------- zoom signature ----------

app.use(bodyParser.json(), cors())
app.options('*', cors())
app.use(cors({
    origin: 'https://90acce2ace74.ngrok.app',
    credentials: true
}));

app.post('/', (req, res) => {

    // console.log('someone here')

    const iat = Math.round(new Date().getTime() / 1000) - 30;
    const exp = iat + 60 * 60 * 2

    const oHeader = { alg: 'HS256', typ: 'JWT' }

    const oPayload = {
        sdkKey: process.env.ZOOM_SDK_KEY,
        mn: req.body.meetingNumber,
        role: req.body.role,
        iat: iat,
        exp: exp,
        appKey: process.env.ZOOM_SDK_KEY,
        tokenExp: iat + 60 * 60 * 2
    }

    // const oPayload = {
    //     app_key: process.env.ZOOM_SDK_KEY,
    //     tpc: sessionName,
    //     role_type: role,
    //     session_key: sessionKey,
    //     user_identity: userIdentity,
    //     version: 1,
    //     iat: iat,
    //     exp: exp
    // }

    const sHeader = JSON.stringify(oHeader)
    const sPayload = JSON.stringify(oPayload)
    const signature = KJUR.jws.JWS.sign('HS256', sHeader, sPayload, process.env.ZOOM_SDK_SECRET)

    // console.log(signature);

    res.json({
        signature: signature
    })


})

app.listen(port, () => console.log(`Now running on port ${port}...`));