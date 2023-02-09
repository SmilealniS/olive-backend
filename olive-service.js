const { mongo, MongoClient, ObjectId } = require('mongodb');

require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const crypto = require('crypto')
const cors = require('cors')
const KJUR = require('jsrsasign')

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
})

app.listen(port, () => console.log(`Zoom Meeting SDK Sample Signature Node.js on port ${port}!`))

// ---------- mongo ----------
// connection().catch(console.error);

async function connection() {
    // const url = "mongodb+srv://SmilealniS:sutorimu13@npm-olive.4z8itim.mongodb.net/?retryWrites=true&w=majority";
    // const url = "mongodb://SmilealniS:sutorimu13@mongo:27017/Olive";
    // Admin
    const url = "mongodb://root:ictoliveict@mongo:27017";
    const mongoClient = new MongoClient(url);

    try {
        // await mongoClient.connect();

        // List database
        // await listDatabases(mongoClient);

        // Create listing in collection
        // await createLists(mongoClient, [
        //     {
        //         Name: "VSTest",
        //         Surname: "VSCheck",
        //         Telephone: "0246813579",
        //         Username: "VSCode",
        //         Password: "VSCode"
        //         // Teacher_Profile: "",
        //         // Admin_Profile: "",
        //         // Student_Profile: {}
        //     }
        // ]);

        // Find listing in collection matched all params
        // await findLists(mongoClient, {
        //     name: "VSTest",
        //     surname: "VSCheck",
        //     tel: "0246813579"
        // });

        // Update list by id
        // await updateListById(mongoClient, "63d2cc29fa215746393a0bae", {
        //     Name: "VSCodeUpdate"
        // });


    } catch (error) {
        console.error(error);
    }
    finally {
        await mongoClient.close();
    }
}

async function createLists(mongoClient, newList) {
    const result = await mongoClient.db("Olive").collection("Identity").insertMany(newList);
    console.log('Inserted', result.insertedCount, 'with new list id:');
    console.log(result.insertedIds);
}

async function findListById(mongoClient, _id) {
    const result = await mongoClient.db("Olive").collection("Identity").findOne({
        _id: ObjectId(_id)
    });

    if (result) {
        console.log(`Found a listing in the collection with id '${_id}':`);
        console.log(result);
    } else {
        console.log(`No listings found with the id '${_id}'`);
    }
}

async function findLists(mongoClient, {
    name,
    surname,
    tel
}) {

    const results = await mongoClient.db("Olive").collection("Identity").find({
        Name: name,
        Surname: surname,
        Telephone: tel
    }).toArray();

    if (results.length > 0) {
        console.log(`Found ${results.length}`);
        results.forEach((result, i) => {
            console.log(`   _id: ${result._id}`);
            console.log(`   Name: ${result.Name}`);
            console.log(`   Surname: ${result.Surname}`);
            console.log(`   Telephone: ${result.Telephone}`);
            console.log(`   Username: ${result.Username}`);
            console.log(`   Password: ${result.Password}\n`);
        });
    } else {
        console.log(`No listings found with Name(${name}), Surname(${surname}) and Telephone(${tel})`);
    }
}

async function updateListById(mongoClient, _id, updatedList) {
    console.log(`Update information:`);
    console.log(updatedList);
    await findListById(mongoClient, _id);

    const result = await mongoClient.db("Olive").collection("Identity")
        .updateOne({
            _id: ObjectId(_id)
        }, {
            $set: updatedList
        });

    if (result.matchedCount > 0) {
        await findListById(mongoClient, _id);
    } else console.log(result);
}

async function listDatabases(mongoClient) {
    const databaseList = await mongoClient.db().admin().listDatabases();

    console.log("My database list");
    databaseList.databases.forEach(db => {
        console.log(db.name);
    });
}