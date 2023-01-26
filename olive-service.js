const {
    mongo,
    MongoClient,
    ObjectId
} = require('mongodb');

async function connection() {
    const url = "mongodb+srv://SmilealniS:sutorimu13@npm-olive.4z8itim.mongodb.net/?retryWrites=true&w=majority";
    const mongoClient = new MongoClient(url);

    try {
        await mongoClient.connect();

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
        await updateListById(mongoClient, "63d2cc29fa215746393a0bae", {
            Name: "VSCodeUpdate"
        });


    } catch (error) {
        console.error(error);
    } finally {
        await mongoClient.close();
    }
}

connection().catch(console.error);

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