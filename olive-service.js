const { mongo, MongoClient, ObjectId, Db } = require('mongodb');

require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const crypto = require('crypto')
const cors = require('cors')
const KJUR = require('jsrsasign');

const app = express()
const port = process.env.PORT || 4000

// ---------- zoom signature ----------

app.use(bodyParser.json(), cors())
app.options('*', cors())

app.post('/', (req, res) => {

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

    const sHeader = JSON.stringify(oHeader)
    const sPayload = JSON.stringify(oPayload)
    const signature = KJUR.jws.JWS.sign('HS256', sHeader, sPayload, process.env.ZOOM_SDK_SECRET)

    res.json({
        signature: signature
    })

    console.log(res);
})

// ---------- mongo ----------

// const url = "mongodb+srv://SmilealniS:sutorimu13@npm-olive.4z8itim.mongodb.net/?retryWrites=true&w=majority";
// const url = "mongodb://SmilealniS:sutorimu13@mongo:27017/Olive";
// Admin
const url = "mongodb://root:ictoliveict@mongo:27017";
const mongoClient = new MongoClient(url);

// Get all databases
app.get('/olive/listDatabases', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    // List database
    const databaseList = await mongoClient.db().admin().listDatabases();

    console.log("My database list");
    databaseList.databases.forEach(db => {
        console.log(db.name);
    });
    console.log('====================');

    res.send(databaseList);
});

// Create new collection in 'olive' database
app.post('/olive/createCollections', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    const collections = req.body;

    collections.forEach(colname => {
        console.log(colname);
        mongoClient.db('olive').createCollection(colname);
    })
    console.log('--------------------');

    let names = [];
    let cols = await mongoClient.db('olive').listCollections().toArray();
    cols.forEach(col => {
        console.log(col.name);
        names.push(col.name);
    })
    console.log('====================');

    res.send('Olive collections: ' + names);
});

// Create lists in collection 'Identity' in database 'olive'
app.post('/olive/createIdentity', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    const newList = req.body;

    newList.forEach(list => {
        console.log(list);
    })
    console.log('====================');

    const result = await mongoClient.db('olive').collection('Identity').insertMany(newList);
    console.log('Inserted', result.insertedCount, 'with new list id:');
    console.log(result.insertedIds);

    res.send(result);
});

// Create lists in collection 'Student_Profile' in database 'olive'
app.post('/olive/createStudentProfile', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    const newList = req.body;

    newList.forEach(list => {
        console.log(list);
    })
    console.log('====================');

    const result = await mongoClient.db('olive').collection('Student_Profile').insertMany(newList);
    console.log('Inserted', result.insertedCount, 'with new list id:');
    console.log(result.insertedIds);

    res.send(result);
});

// Find listing in collection 'Identity' matched 'ObjectId'
app.get('/olive/getIdentitybyId', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    const result = await mongoClient.db('olive').collection('Identity').findOne({
        _id: ObjectId(req.query._id)
    });

    if (result) {
        let message = { 'message': `Found id '${req.query._id}' in the collection 'Identity'` };
        console.log(message.message);
        res.send({
            ...result,
            ...message
        });
    } else {
        let message = { 'message': `No listings found with the id '${req.query._id}' in collection 'Identity'` };
        console.log(message.message);
        res.send({
            ...result,
            ...message
        });
    }
});

// Find listing in collection 'Identity' matched all params
app.get('/olive/getIdentitybyParams', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    const results = await mongoClient.db('olive').collection('Identity').find({
        Name: req.query.name,
        Surname: req.query.surname,
        Telephone: req.query.tel
    }).toArray();

    if (results.length > 0) {
        let message = { 'message': `Found ${results.length} listing` };
        console.log(message.message);
        results.forEach((result, i) => {
            console.log(`   _id: ${result._id}`);
            console.log(`   Name: ${result.Name}`);
            console.log(`   Surname: ${result.Surname}`);
            console.log(`   Telephone: ${result.Telephone}`);
            console.log(`   Username: ${result.Username}`);
            console.log(`   Password: ${result.Password}\n`);
        });
        res.send({
            ...results,
            ...message
        });
    } else {
        let message = { 'message': `No listings found with Name(${req.query.name}), Surname(${req.query.surname}) and Telephone(${req.query.tel})` };
        console.log(message.message);
        res.send({
            ...results,
            ...message
        });
    }
});

// Update list by id
app.put('/olive/updateIdentitybyId', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    const updatedList = req.body;

    const result = await mongoClient.db('olive').collection('Identity')
        .updateOne({
            _id: ObjectId(req.query._id)
        }, {
            $set: updatedList
        });

    let message;
    try {
        if (result.matchedCount > 0) {
            if (result.modifiedCount > 0) message = { 'message': `id ${req.query._id} is updated!` };
            else message = { 'message': `id ${req.query._id} is up to date...` };
        }
        else message = { 'message': `Not found id ${req.query._id}` };
    } catch {
        message = { 'message': `Not found id ${req.query._id}` };
    }

    res.send(message);
});

// Delete list by id
app.delete('/olive/deleteIdentitybyId', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    const result = await mongoClient.db('olive').collection('Identity').deleteOne({ _id: ObjectId(req.query._id) });

    let message;
    if (result.deletedCount > 0) message = { 'message': `id ${req.query._id} is deleted!` };
    else message = { 'message': `Not found id ${req.query._id}` };
    res.send(message);
});

app.listen(port, () => console.log(`Now running on port ${port}...`));