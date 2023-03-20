const { mongo, MongoClient, ObjectId } = require('mongodb');

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

// Get all collections in database 'olive'
app.get('/olive/getCollections', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    const names = [];
    const collections = await mongoClient.db('olive').listCollections().toArray();
    collections.forEach(collection => {
        console.log(collection.name);
        names.push(collection).name;
    })

    res.send(names);
})

// Identity collection function

// Create lists in collection 'Identity' in database 'olive'
app.post('/olive/identity/create', async (req, res) => {
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

// Find all listing in collection 'Identity'
app.get('/olive/identity/getAll', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    const result = await mongoClient.db('olive').collection('Identity').find({}).toArray();

    if (result) {
        console.log(`Name: ${result.Name}
                    Surname: ${result.Surname}
                    Telephone: ${result.Telephone}
                    Username: ${result.Username}
                    Password: ${result.Password}
                    Teacher_Profile: ${result.Teacher_Profile}
                    Admin_Profile: ${result.Admin_Profile}
                    Student_Profile: ${result.Student_Profile}`);
        res.send({
            ...result
        });
    } else {
        let message = { 'message': `No listings found in collection 'Identity'` };
        console.log(message.message);
        res.send({
            ...result,
            ...message
        });
    }
});

// Find listing in collection 'Identity' matched 'ObjectId'
app.get('/olive/identity/getbyId', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    const result = await mongoClient.db('olive').collection('Identity').findOne({
        _id: ObjectId(req.query._id)
    });

    if (result) {
        let message = { 'message': `Found id '${req.query._id}' in the collection 'Identity'` };
        console.log(`Name: ${result.Name}
                    Surname: ${result.Surname}
                    Telephone: ${result.Telephone}
                    Username: ${result.Username}
                    Password: ${result.Password}
                    Teacher_Profile: ${result.Teacher_Profile}
                    Admin_Profile: ${result.Admin_Profile}
                    Student_Profile: ${result.Student_Profile}`);
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
app.get('/olive/identity/getbyParams', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    let name = req.query.name == undefined ? "" : req.query.name;
    let surname = req.query.surname == undefined ? "" : req.query.surname;
    let tel = req.query.tel == undefined ? "" : req.query.tel;
    let user = req.query.user == undefined ? "" : req.query.user;
    let pass = req.query.pass == undefined ? "" : req.query.pass;
    let teacher = req.query.teacher == undefined ? "none" : req.query.teacher;
    let admin = req.query.admin == undefined ? "none" : req.query.admin;
    let student = req.query.student == undefined ? "none" : req.query.student;

    let edit = {
        'edit': `Editing info
                Name: ${name}
                Surname: ${surname}
                Telephone: ${tel}
                Username: ${user}
                Password: ${pass}
                Teacher_Profile: ${teacher}
                Admin_Profile: ${admin}
                Student_Profile: ${student}`
    };
    console.log(edit.edit);

    const results = await mongoClient.db('olive').collection('Identity').find({
        $or: [
            { Name: name },
            { Surname: surname },
            { Telephone: tel },
            { Username: user },
            { Password: pass },
            { Teacher_Profile: teacher },
            { Admin_Profile: admin },
            { Student_Profile: student }
        ]
    }).toArray();

    if (results.length > 0) {
        let message = { 'message': `Found ${results.length} listing` };
        console.log(message.message);
        results.forEach((result, i) => {
            `Name: ${result.Name}
            Surname: ${result.Surname}
            Telephone: ${result.Telephone}
            Username: ${result.Username}
            Password: ${result.Password}
            Teacher_Profile: ${result.Teacher_Profile}
            Admin_Profile: ${result.Admin_Profile}
            Student_Profile: ${result.Student_Profile}`
        });
        res.send({
            ...edit,
            ...results,
            ...message
        });
    } else {
        let message = { 'message': `No listings found with Name(${req.query.name}), Surname(${req.query.surname}) and Telephone(${req.query.tel})` };
        console.log(message.message);
        res.send({
            ...edit,
            ...results,
            ...message
        });
    }
});

// Update list by id
app.put('/olive/identity/updatebyId', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    const updatedList = req.body;

    const result = await mongoClient.db('olive').collection('Identity')
        .updateOne({
            _id: ObjectId(req.query._id)
        }, {
            $set: updatedList
        });

    if (result.matchedCount > 0) {
        res.send(result);
    } else res.send(result);
});

// Delete list by id
app.delete('/olive/identity/deletebyId', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    const result = await mongoClient.db('olive').collection('Identity')
        .deleteOne({
            _id: ObjectId(req.query._id)
        });

    if (result.matchedCount > 0) {
        res.send(result);
    } else res.send(result);
});

// Login as

app.post('/login', async (req, res) => {
    await mongoClient.connect();

    const user = await mongoClient.db('olive').collection('Identity').findOne({ Username: req.body.username });

    if (user) {
        const result = req.body.password === user.Password;

        if (result) {
            if (user.Teacher_Profile == '' && user.Admin_Profile == '') {
                res.status(200).send({
                    ...user,
                    ...{ role: 'student' }
                });
            } else if (user.Teacher_Profile == '') res.status(200).send({
                ...user,
                ...{ role: 'admin' }
            });
            else res.status(200).send({
                ...user,
                ...{ role: 'teacher' }
            });

        } else res.status(400).json({ error: "Password doesn't match" });
    } else res.status(400).json({ error: "User doesn't match" });
});

// Student_Profile

// Create lists in collection 'Student_Profile' in database 'olive'
app.post('/olive/student-profile/create', async (req, res) => {
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

// Find all listing in collection 'Student_Profile'
app.get('/olive/student-profile/getAll', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    const result = await mongoClient.db('olive').collection('Student_Profile').find({}).toArray();

    if (result) {
        console.log(`_id: ${result._id}
        Display_Name: ${result.Display_Name}`);
        res.send({
            ...result
        });
    } else {
        let message = { 'message': `No listings found in collection 'Student_Profile'` };
        console.log(message.message);
        res.send({
            ...result,
            ...message
        });
    }
});

// Find listing in collection 'Student_Profile' matched 'ObjectId'
app.get('/olive/student-profile/getbyId', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();
    console.log(req)

    const result = await mongoClient.db('olive').collection('Student_Profile').findOne({
        _id: ObjectId(req.query._id)
    });

    if (result) {
        let message = { 'message': `Found id '${req.query._id}' in the collection 'Student_Profile'` };
        console.log(`_id: ${result._id}
        Display_Name: ${result.Display_Name}`);
        res.send({
            ...result,
            ...message
        });
    } else {
        let message = { 'message': `No listings found with the id '${req.query._id}' in collection 'Student_Profile'` };
        console.log(message.message);
        res.send({
            ...result,
            ...message
        });
    }
});

// Find listing in collection 'Student_Profile' matched all params
app.get('/olive/student-profile/getbyParams', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    const results = await mongoClient.db('olive').collection('Student_Profile').find({
        Display_Name: req.query.name
    }).toArray();

    if (results.length > 0) {
        let message = { 'message': `Found ${results.length} listing` };
        console.log(message.message);
        results.forEach((result, i) => {
            console.log(`_id: ${result._id}
            Name: ${result.Display_Name}`);
        });
        res.send({
            ...results,
            ...message
        });
    } else {
        let message = { 'message': `No listings found with Display_Name(${req.query.name})` };
        console.log(message.message);
        res.send({
            ...results,
            ...message
        });
    }
});

// Update list in "Student_Profile" by id
app.put('/olive/student-profile/updatebyId', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    const updatedList = req.body;

    const result = await mongoClient.db('olive').collection('Student_Profile')
        .updateOne({
            _id: ObjectId(req.query._id)
        }, {
            $set: updatedList
        });

    if (result.matchedCount > 0) {
        res.send(result);
    } else res.send(result);
});

// Delete list in "Student_Profile" by id
app.delete('/olive/student-profile/deletebyId', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    const result = await mongoClient.db('olive').collection('Student_Profile')
        .deleteOne({
            _id: ObjectId(req.query._id)
        });

    if (result.matchedCount > 0) {
        res.send(result);
    } else res.send(result);
});

// Teacher_Profile

// Create lists in collection 'Teacher_Profile' in database 'olive'
app.post('/olive/teacher-profile/create', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    const newList = req.body;

    newList.forEach(list => {
        console.log(list);
    })
    console.log('====================');

    const result = await mongoClient.db('olive').collection('Teacher_Profile').insertMany(newList);
    console.log('Inserted', result.insertedCount, 'with new list id:');
    console.log(result.insertedIds);

    res.send(result);
});

// Find all listing in collection 'Teacher_Profile'
app.get('/olive/teacher-profile/getAll', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    const result = await mongoClient.db('olive').collection('Teacher_Profile').find({}).toArray();

    if (result) {
        console.log(`_id: ${result._id}
        Display_Name: ${result.Display_Name}`);
        res.send({
            ...result
        });
    } else {
        let message = { 'message': `No listings found in collection 'Teacher_Profile'` };
        console.log(message.message);
        res.send({
            ...result,
            ...message
        });
    }
});

// Find listing in collection 'Teacher_Profile' matched 'ObjectId'
app.get('/olive/teacher-profile/getbyId', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    const result = await mongoClient.db('olive').collection('Teacher_Profile').findOne({
        _id: ObjectId(req.query._id)
    });

    if (result) {
        let message = { 'message': `Found id '${req.query._id}' in the collection 'Teacher_Profile'` };
        console.log(`_id: ${result._id}
        Display_Name: ${result.Display_Name}`);
        res.send({
            ...result,
            ...message
        });
    } else {
        let message = { 'message': `No listings found with the id '${req.query._id}' in collection 'Teacher_Profile'` };
        console.log(message.message);
        res.send({
            ...result,
            ...message
        });
    }
});

// Find listing in collection 'Teacher_Profile' matched all params
app.get('/olive/teacher-profile/getbyParams', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    const results = await mongoClient.db('olive').collection('Teacher_Profile').find({
        Display_Name: req.query.name
    }).toArray();

    if (results.length > 0) {
        let message = { 'message': `Found ${results.length} listing` };
        console.log(message.message);
        results.forEach((result, i) => {
            console.log(`_id: ${result._id}
            Name: ${result.Display_Name}`);
        });
        res.send({
            ...results,
            ...message
        });
    } else {
        let message = { 'message': `No listings found with Display_Name(${req.query.name})` };
        console.log(message.message);
        res.send({
            ...results,
            ...message
        });
    }
});

// Update list in "Teacher_Profile" by id
app.put('/olive/teacher-profile/updatebyId', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    const updatedList = req.body;

    const result = await mongoClient.db('olive').collection('Teacher_Profile')
        .updateOne({
            _id: ObjectId(req.query._id)
        }, {
            $set: updatedList
        });

    if (result.matchedCount > 0) {
        res.send(result);
    } else res.send(result);
});

// Delete list in "Teacher_Profile" by id
app.delete('/olive/teacher-profile/deletebyId', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    const result = await mongoClient.db('olive').collection('Teacher_Profile')
        .deleteOne({
            _id: ObjectId(req.query._id)
        });

    if (result.matchedCount > 0) {
        res.send(result);
    } else res.send(result);
});

// Admin_Profile

// Create lists in collection 'Admin_Profile' in database 'olive'
app.post('/olive/admin-profile/create', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    const newList = req.body;

    newList.forEach(list => {
        console.log(list);
    })
    console.log('====================');

    const result = await mongoClient.db('olive').collection('Admin_Profile').insertMany(newList);
    console.log('Inserted', result.insertedCount, 'with new list id:');
    console.log(result.insertedIds);

    res.send(result);
});

// Find all listing in collection 'Admin_Profile'
app.get('/olive/admin-profile/getAll', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    const result = await mongoClient.db('olive').collection('Admin_Profile').find({}).toArray();

    if (result) {
        console.log(`_id: ${result._id}
        Display_Name: ${result.Display_Name}`);
        res.send({
            ...result
        });
    } else {
        let message = { 'message': `No listings found in collection 'Admin_Profile'` };
        console.log(message.message);
        res.send({
            ...result,
            ...message
        });
    }
});

// Find listing in collection 'Admin_Profile' matched 'ObjectId'
app.get('/olive/admin-profile/getbyId', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    const result = await mongoClient.db('olive').collection('Admin_Profile').findOne({
        _id: ObjectId(req.query._id)
    });

    if (result) {
        let message = { 'message': `Found id '${req.query._id}' in the collection 'Admin_Profile'` };
        console.log(`_id: ${result._id}
        Display_Name: ${result.Display_Name}`);
        res.send({
            ...result,
            ...message
        });
    } else {
        let message = { 'message': `No listings found with the id '${req.query._id}' in collection 'Admin_Profile'` };
        console.log(message.message);
        res.send({
            ...result,
            ...message
        });
    }
});

// Find listing in collection 'Admin_Profile' matched all params
app.get('/olive/admin-profile/getbyParams', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    const results = await mongoClient.db('olive').collection('Admin_Profile').find({
        Display_Name: req.query.name
    }).toArray();

    if (results.length > 0) {
        let message = { 'message': `Found ${results.length} listing` };
        console.log(message.message);
        results.forEach((result, i) => {
            console.log(`_id: ${result._id}`);
            console.log(`Name: ${result.Display_Name}`);
        });
        res.send({
            ...results,
            ...message
        });
    } else {
        let message = { 'message': `No listings found with Display_Name(${req.query.name})` };
        console.log(message.message);
        res.send({
            ...results,
            ...message
        });
    }
});

// Update list in "Admin_Profile" by id
app.put('/olive/admin-profile/updatebyId', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    const updatedList = req.body;

    const result = await mongoClient.db('olive').collection('Admin_Profile')
        .updateOne({
            _id: ObjectId(req.query._id)
        }, {
            $set: updatedList
        });

    if (result.matchedCount > 0) {
        res.send(result);
    } else res.send(result);
});

// Delete list in "Admin_Profile" by id
app.delete('/olive/admin-profile/deletebyId', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    const result = await mongoClient.db('olive').collection('Admin_Profile')
        .deleteOne({
            _id: ObjectId(req.query._id)
        });

    if (result.matchedCount > 0) {
        res.send(result);
    } else res.send(result);
});

// Attendance

// Create lists in collection 'Identity' in database 'olive'
app.post('/olive/attendance/create', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    const newList = req.body;

    let today = new Date();
    let todaystring = `${today.getFullYear()}-0${today.getMonth() + 1}-${today.getDate()}`;
    // console.log(todaystring);
    for (let i = 0; i < newList.length; i++) {
        newList[i] = {
            "Student_Id": newList[i].Student_Id,
            "Class": {
                "Id": newList[i].Class.Id,
                "Date": new Date(todaystring),
                "Status": false,
                "EnterTime": "",
                "ExitTime": ""
            }
        }

        console.log(newList[i]);
    }
    console.log('====================');

    const result = await mongoClient.db('olive').collection('Attendance').insertMany(newList);
    console.log('Inserted', result.insertedCount, 'with new list id:');
    console.log(result.insertedIds);

    res.send(result);
});

app.get('/olive/attendance/getAll', async (req, res) => {
    // 
    await mongoClient.connect();

    const results = await mongoClient.db('olive').collection('Attendance').find({}).toArray();
    console.log(results);

    res.send(results);
});

// Find listing in collection 'Attendance' matched all params
app.get('/olive/attendance/getbyStudentId', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    let student = req.query.student == undefined ? "none" : req.query.student;

    const results = await mongoClient.db('olive').collection('Attendance').find({
        Student_Id: student
    }).toArray();

    if (results.length > 0) {
        let message = { 'message': `Found ${results.length} listing` };
        console.log(message.message);
        results.forEach((result, i) => {
            console.log(`_id: ${result._id}
            Student_Profile: ${result.Student_Id}
            Class ID: ${result.Class.Id}
            Class Date: ${result.Class.Date}
            Class status: ${result.Class.Status}
            Class Start: ${result.Class.EnterTime}
            Class End: ${result.Class.ExitTime}`);
        });
        res.send({
            ...{ result: results },
            ...message
        });
    } else {
        let message = { 'message': `No listings found with Student_Profile(${req.query.student})` };
        console.log(message.message);
        res.send({
            ...{ result: results },
            ...message
        });
    }
});

// 
app.get('/olive/attendance/getbyparams', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    let student = req.query.student == undefined ? "none" : req.query.student;
    let classdate = req.query.classdate == undefined ? "" : req.query.classdate;
    let classid = req.query.classid == undefined ? "" : req.query.classid;

    const results = await mongoClient.db('olive').collection('Attendance').find({
        Student_Id: student,
        "Class.Id": classid,
        "Class.Date": new Date(classdate)
    }).toArray();

    if (results.length > 0) {
        let message = { 'message': `Found ${results.length} listing` };
        console.log(message.message);
        results.forEach((result, i) => {
            console.log(`_id: ${result._id}
            Student_Profile: ${result.Student_Id}
            Class ID: ${result.Class.Id}
            Class Date: ${result.Class.Date}
            Class status: ${result.Class.Status}
            Class Start: ${result.Class.EnterTime}
            Class End: ${result.Class.ExitTime}`);
        });
        res.send({
            ...{ result: results },
            ...message
        });
    } else {
        let message = { 'message': `No listings found with Student_Profile(${req.query.student})` };
        console.log(message.message);
        res.send({
            ...{ result: results },
            ...message
        });
    }
});

app.get('/olive/attendance/getbyClassId', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    let classid = req.query.classid == undefined ? "none" : req.query.classid;

    const results = await mongoClient.db('olive').collection('Attendance').find({
        "Class.Id": classid
    }).toArray();

    if (results.length > 0) {
        let message = { 'message': `Found ${results.length} listing` };
        console.log(message.message);
        results.forEach((result, i) => {
            console.log(`_id: ${result._id}
            Student_Profile: ${result.Student_Id}
            Class ID: ${result.Class.Id}
            Class Date: ${result.Class.Date}
            Class status: ${result.Class.Status}
            Class Start: ${result.Class.EnterTime}
            Class End: ${result.Class.ExitTime}`);
        });
        res.send({
            ...{ result: results },
            ...message
        });
    } else {
        let message = { 'message': `No listings found with Class ID(${req.query.classid})` };
        console.log(message.message);
        res.send({
            ...{ result: results },
            ...message
        });
    }
});

app.get('/olive/attendance/getbyClassDate', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    let classdate = req.query.classdate == undefined ? "" : req.query.classdate;

    const results = await mongoClient.db('olive').collection('Attendance').find({
        "Class.Date": new Date(classdate)
    }).toArray();

    if (results.length > 0) {
        let message = { 'message': `Found ${results.length} listing` };
        console.log(message.message);
        results.forEach((result, i) => {
            console.log(`_id: ${result._id}
            Student_Profile: ${result.Student_Id}
            Class ID: ${result.Class.Id}
            Class Date: ${result.Class.Date}
            Class status: ${result.Class.Status}
            Class Start: ${result.Class.EnterTime}
            Class End: ${result.Class.ExitTime}`);
        });
        res.send({
            ...results,
            ...message
        });
    } else {
        let message = { 'message': `No listings found with Class Date(${req.query.classdate})` };
        console.log(message.message);
        res.send({
            ...results,
            ...message
        });
    }
});

// Update EnterTime and status of attendance list by id
app.put('/olive/attendance/updatebyId', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    const updatedList = {
        "Class.Status": true,
        "Class.EnterTime": new Date().getTime()
    };

    const result = await mongoClient.db('olive').collection('Attendance')
        .updateOne({
            _id: ObjectId(req.query._id),
            // "Class._id": ObjectId(req.query.class)
        }, {
            $set: updatedList
        });

    if (result.matchedCount > 0) {
        res.send(result);
    } else res.send(result);
});

// Update EnterTime of attendance list by id
app.put('/olive/attendance/updateEnter', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    const updatedList = {
        "Class.EnterTime": new Date().getTime()
    };

    const result = await mongoClient.db('olive').collection('Attendance')
        .updateOne({
            _id: ObjectId(req.query._id)
        }, {
            $set: updatedList
        });

    if (result.matchedCount > 0) {
        res.send(result);
    } else res.send(result);
});

// Update ExitTime of attendance list by id
app.put('/olive/attendance/updateLeave', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    const updatedList = { "Class.ExitTime": new Date().getTime() };

    const result = await mongoClient.db('olive').collection('Attendance')
        .updateOne({
            _id: ObjectId(req.query._id)
        }, {
            $set: updatedList
        });

    if (result.matchedCount > 0) {
        res.send(result);
    } else res.send(result);
});

app.delete('/olive/attendance/deleteAll', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    const result = await mongoClient.db('olive').collection('Attendance')
        .deleteMany({});

    if (result.matchedCount > 0) {
        res.send(result);
    } else res.send(result);
});

// Delete list by id
app.delete('/olive/attendance/deletebyId', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    const result = await mongoClient.db('olive').collection('Attendance')
        .deleteOne({
            _id: ObjectId(req.query._id)
        });

    if (result.matchedCount > 0) {
        res.send(result);
    } else res.send(result);
});

// Engagement <NOT YET>

app.post('/olive/engagement', async (req, res) => {
    // 
    await mongoClient.connect();

    let today = new Date();
    let todaystring = `${today.getFullYear()}-0${today.getMonth() + 1}-${today.getDate()}`;

    const engagement = {
        Student_Id: req.body.Student_Id,
        Class: {
            Id: req.body.Class.Id,
            Date: new Date(todaystring),
            Engagement: 0
        },
        Interaction_Log: req.body.Interaction_Log,
        Clear: false
    };

    console.log(engagement);

    const result = await mongoClient.db('olive').collection('Engagement').insertOne(engagement);
    console.log(result);

    res.send(result);
});

app.get('/olive/engagement/getAll', async (req, res) => {
    // 
    await mongoClient.connect();

    const results = await mongoClient.db('olive').collection('Engagement').find({}).toArray();
    console.log(results);

    res.send(results);
});

// 
app.get('/olive/engagement/getbyStudentID', async (req, res) => {
    // 
    await mongoClient.connect();

    let student = req.query.student == undefined ? "none" : req.query.student;
    let classid = req.query.classid == undefined ? "none" : req.query.classid;

    const results = await mongoClient.db('olive').collection('Engagement').find({
        Student_Id: student,
        "Class.Id": classid
    }).toArray();
    console.log(results);

    res.send(results);
});

app.get('/olive/engagement/getbyClassID', async (req, res) => {
    // 
    await mongoClient.connect();

    let classid = req.query.classid == undefined ? "none" : req.query.classid;

    let today = new Date();
    let todaystring = `${today.getFullYear()}-0${today.getMonth() + 1}-${today.getDate()}`;


    const results = await mongoClient.db('olive').collection('Engagement').find({
        "Class.Id": classid,
        "Class.Date": new Date(todaystring),
        Clear: false
    }).toArray();
    console.log(results);

    res.send(results);
});

app.put('/olive/engagement/addLog', async (req, res) => {
    // 
    await mongoClient.connect();

    const log = req.body;

    const engagement = await mongoClient.db('olive').collection('Engagement').findOne({
        Student_Id: req.query.student,
        "Class.Id": req.query.class
    });

    engagement.Interaction_Log.push(log.Interaction_Log);

    const results = await mongoClient.db('olive').collection('Engagement')
        .updateOne({
            Student_Id: req.query.student,
            "Class.Id": req.query.class
        }, {
            $set: engagement
        });

    res.send(results);
});

app.put('/olive/engagement/update', async (req, res) => {
    // 
    await mongoClient.connect();

    const log = req.body;

    const oldlog = await mongoClient.db('olive').collection('Engagement')
        .findOne({
            _id: ObjectId(req.query._id)
        });

    oldlog.Class.Engagement = log.Class.Engagement;

    const results = await mongoClient.db('olive').collection('Engagement')
        .updateOne({
            // Student_Id: req.query.student,
            // "Class.Id": req.query.class
            _id: ObjectId(req.query._id)
        }, {
            $set: oldlog
        });

    res.send(results);
});

app.put('/olive/engagement/clear', async (req, res) => {
    // 
    await mongoClient.connect();

    const oldlog = await mongoClient.db('olive').collection('Engagement')
        .findOne({
            _id: ObjectId(req.query._id)
        });

    oldlog.Clear = true;

    const results = await mongoClient.db('olive').collection('Engagement')
        .updateOne({
            _id: ObjectId(req.query._id)
        }, {
            $set: oldlog
        });

    res.send(results);
});

app.delete('/olive/engagement/deletebyId', async (req, res) => {
    // 
    await mongoClient.connect();

    const result = await mongoClient.db('olive').collection('Engagement').deleteOne({
        _id: ObjectId(req.query._id)
    });

    console.log(`${req.query._id}`);

    res.send(result);
});

// Enrollment

app.post('/olive/enroll', async (req, res) => {
    let newList = req.body;

    console.log(newList);
    console.log('====================');

    const result = await mongoClient.db('olive').collection('Enrollment').insertMany(newList);
    console.log('Inserted', result.insertedCount, 'with new list id:');
    console.log(result.insertedIds);

    res.send(result);
});

// 
app.get('/olive/enroll/getAll', async (req, res) => {
    // 
    await mongoClient.connect();

    const results = await mongoClient.db('olive').collection('Enrollment').find({}).toArray();
    console.log(results);

    res.send(results);
});

app.get('/olive/enroll/getbyClassID', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    const result = await mongoClient.db('olive').collection('Enrollment').find({
        Class: req.query.classid
    }).toArray();

    console.log(result);

    res.send(result);
});

app.get('/olive/enroll/getbyStudentID', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    const result = await mongoClient.db('olive').collection('Enrollment').find({
        Student: req.query._id
    }).toArray();

    console.log(result);

    res.send(result);
});

app.put('/olive/enroll/updateStudent', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    const updatedList = req.body;

    const oldstudent = await mongoClient.db('olive').collection('Enrollment').findOne({
        Class: req.query.classid
    });

    // console.log(oldstudent.Student);

    oldstudent.Student.forEach(stu => {
        if (!updatedList.Student.includes(stu)) {
            updatedList.Student.push(stu)
        } else console.log(stu, 'already enrolled')
    })

    // console.log(updatedList);

    const result = await mongoClient.db('olive').collection('Enrollment')
        .updateOne({
            Class: req.query.classid
        }, {
            $set: updatedList
        });

    console.log(result);

    if (result.matchedCount > 0) {
        res.send(result);
    } else res.send(result);
});

app.delete('/olive/enroll/delete', async (req, res) => {
    await mongoClient.connect();

    const result = await mongoClient.db('olive').collection('Enrollment').deleteOne({
        _id: ObjectId(req.query._id)
    });

    res.send(result);
});

// Score

app.post('/olive/score/create', async (req, res) => {
    await mongoClient.connect();

    const newList = req.body;
    console.log(newList);

    const result = await mongoClient.db('olive').collection('Score').insertMany(newList);
    console.log(`${result.insertedCount} ids inserted: ${result.insertedIds}`)

    res.send(result);
});

// get all score
app.get('/olive/score/getAll', async (req, res) => {
    await mongoClient.connect();

    const result = await mongoClient.db('olive').collection('Score').find({}).toArray();
    console.log(result);

    res.send(result);
})

// get score by student _id
app.get('/olive/score/getbyStudentId', async (req, res) => {
    await mongoClient.connect();

    const result = await mongoClient.db('olive').collection('Score').find({
        Student_Id: req.query.student
    }).toArray();
    console.log(result);

    res.send(result);
})

// get score by class id
app.get('/olive/score/getbyClassId', async (req, res) => {
    await mongoClient.connect();

    const result = await mongoClient.db('olive').collection('Score').find({
        Class: req.query.classid
    }).toArray();
    console.log(result);

    res.send(result);
})

// update score by student and class id
app.put('/olive/score/update', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    const updatedList = req.body;

    const result = await mongoClient.db('olive').collection('Score')
        .updateOne({
            Student_Id: req.query.student,
            Class: req.query.classid
        }, {
            $set: updatedList
        });

    if (result.matchedCount > 0) {
        res.send(result);
    } else res.send(result);
});

app.delete('/olive/score/delete', async (req, res) => {
    await mongoClient.connect();

    const result = await mongoClient.db('olive').collection('Score').deleteOne({
        Student_Id: req.query.student,
        Class: req.query.classid
    });

    res.send(result);
});


// Class

app.post('/olive/class/create', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    const newList = req.body;

    for (let i = 0; i < newList.length; i++) {
        newList[i] = {
            "Name": newList[i].Name,
            "Meeting_number": newList[i].Meeting_number,
            "Password": newList[i].Password,
            "Teacher": newList[i].Teacher,
            "Admin": newList[i].Admin,
            "Date": "",
            "Start_time": "",
            "End_time": ""
        }

        console.log(newList[i]);
    }
    console.log('====================');

    const result = await mongoClient.db('olive').collection('Class').insertMany(newList);
    console.log('Inserted', result.insertedCount, 'with new list id:');
    console.log(result.insertedIds);

    res.send(result);
});

// get all class in database
app.get('/olive/class/getAll', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    const results = await mongoClient.db('olive').collection('Class').find({}).toArray();

    if (results.length > 0) {
        let message = { 'message': `Found ${results.length} listing` };
        console.log(message.message);
        results.forEach((result, i) => {
            console.log(`_id: ${result._id}
                    "Name": ${result.Name},
                    "Meeting_number": ${result.Meeting_number},
                    "Password": ${result.Password},
                    "Teacher": ${result.Teacher},
                    "Admin": ${result.Admin},
                    "Date": ${result.Date},
                    "Start_time": ${result.Start_time},
                    "End_time": ${result.End_time}
            `);
        });
        res.send({
            ...results,
            ...message
        });
    } else {
        let message = { 'message': `No listings found` };
        console.log(message.message);
        res.send({
            ...results,
            ...message
        });
    }
});

// Find listing in collection 'Class' by _id
app.get('/olive/class/getbyId', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    const results = await mongoClient.db('olive').collection('Class').find({
        _id: ObjectId(req.query._id)
    }).toArray();

    if (results.length > 0) {
        let message = { 'message': `Found ${results.length} listing` };
        console.log(message.message);
        results.forEach((result, i) => {
            console.log(`_id: ${result._id}
                    "Name": ${result.Name},
                    "Meeting_number": ${result.Meeting_number},
                    "Password": ${result.Password},
                    "Teacher": ${result.Teacher},
                    "Admin": ${result.Admin},
                    "Date": ${result.Date},
                    "Start_time": ${result.Start_time},
                    "End_time": ${result.End_time}
            `);
        });
        res.send({
            ...results,
            ...message
        });
    } else {
        let message = { 'message': `No listings found with Class ID(${req.query._id})` };
        console.log(message.message);
        res.send({
            ...results,
            ...message
        });
    }
});

app.get('/olive/class/getbyTeacher', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    const results = await mongoClient.db('olive').collection('Class').find({
        Teacher: req.query.teacher
    }).toArray();

    if (results.length > 0) {
        let message = { 'message': `Found ${results.length} listing` };
        console.log(message.message);
        results.forEach((result, i) => {
            console.log(`_id: ${result._id}
                    "Name": ${result.Name},
                    "Meeting_number": ${result.Meeting_number},
                    "Password": ${result.Password},
                    "Teacher": ${result.Teacher},
                    "Admin": ${result.Admin},
                    "Date": ${result.Date},
                    "Start_time": ${result.Start_time},
                    "End_time": ${result.End_time}
            `);
        });
        res.send({
            ...results,
            ...message
        });
    } else {
        let message = { 'message': `No listings found with Teacher ID(${req.query.teacher})` };
        console.log(message.message);
        res.send({
            ...results,
            ...message
        });
    }
});

app.get('/olive/class/getbyClassDate', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    let classdate = req.query.classdate == undefined ? "" : req.query.classdate;

    const results = await mongoClient.db('olive').collection('Attendance').find({
        Date: new Date(classdate)
    }).toArray();

    if (results.length > 0) {
        let message = { 'message': `Found ${results.length} listing` };
        console.log(message.message);
        results.forEach((result, i) => {
            console.log(`_id: ${result._id}
            Student_Profile: ${result.Student_Id}
            Class ID: ${result.Class.Id}
            Class Date: ${result.Class.Date}
            Class status: ${result.Class.Status}
            Class Start: ${result.Class.EnterTime}
            Class End: ${result.Class.ExitTime}`);
        });
        res.send({
            ...results,
            ...message
        });
    } else {
        let message = { 'message': `No listings found with Class Date(${req.query.classdate})` };
        console.log(message.message);
        res.send({
            ...results,
            ...message
        });
    }
});

// Update status of class list by id
app.put('/olive/class/updatebyId', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    const updatedList = req.body;

    const result = await mongoClient.db('olive').collection('Class')
        .updateOne({
            _id: ObjectId(req.query._id)
        }, {
            $set: updatedList
        });

    if (result.matchedCount > 0) {
        res.send(result);
    } else res.send(result);
});

// Update EnterTime and date of class list by id
app.put('/olive/class/updateEnter', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    const updatedList = {
        "Date": new Date().getDate(),
        "Start_time": new Date().getTime()
    };

    const result = await mongoClient.db('olive').collection('Class')
        .updateOne({
            _id: ObjectId(req.query._id)
        }, {
            $set: updatedList
        });

    if (result.matchedCount > 0) {
        res.send(result);
    } else res.send(result);
});

// Update ExitTime of class list by id
app.put('/olive/class/updateLeave', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    const updatedList = { "End_time": new Date().getTime() };

    const result = await mongoClient.db('olive').collection('Class')
        .updateOne({
            _id: ObjectId(req.query._id)
        }, {
            $set: updatedList
        });

    if (result.matchedCount > 0) {
        res.send(result);
    } else res.send(result);
});

// Delete list by id
app.delete('/olive/class/deletebyId', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    const result = await mongoClient.db('olive').collection('Class')
        .deleteOne({
            _id: ObjectId(req.query._id)
        });

    if (result.matchedCount > 0) {
        res.send(result);
    } else res.send(result);
});

// Report <NOT YET>

// 

// Emoji

app.post('/olive/emoji', async (req, res) => {
    await mongoClient.connect();

    const emojis = req.body;

    const results = await mongoClient.db('olive').collection('Emoji').insertMany(emojis);

    res.send(results);
});

app.get('/olive/emoji/getAll', async (req, res) => {
    await mongoClient.connect();

    const results = await mongoClient.db('olive').collection('Emoji').find({}).toArray();

    res.send(results);
});

// Interaction_Log

app.post('/olive/interact', async (req, res) => {
    await mongoClient.connect();

    // let result = { message: `${req.body.Student} | ${req.body.Class} | ${req.body.Type} | ${req.body.Emoji} | ${req.body.Description} | ${req.body.Boolean}` };
    // console.log(result);
    // res.send(result);

    let student = req.body.Student == undefined ? "" : req.body.Student;
    let clas = req.body.Class == undefined ? "" : req.body.Class;
    let type = req.body.Type == undefined ? "" : req.body.Type;
    let emoji = req.body.Emoji == undefined ? "" : req.body.Emoji;
    let desc = req.body.Description == undefined ? "" : req.body.Description;
    let bools = req.body.Boolean == undefined ? "" : req.body.Boolean;

    let today = new Date();
    let todaystring = `${today.getFullYear()}-0${today.getMonth() + 1}-${today.getDate()}`;

    const interaction = {
        Student: student,
        Class: clas,
        Type: type,
        Emoji: emoji,
        Description: desc,
        Boolean: bools,
        Date: new Date(todaystring),
        Time: new Date().getTime()
    };
    console.log(interaction);

    const results = await mongoClient.db('olive').collection('Interaction_Log').insertOne(interaction);

    res.send(results);
});

app.get('/olive/interact/getAll', async (req, res) => {
    await mongoClient.connect();

    const results = await mongoClient.db('olive').collection('Interaction_Log').find({}).toArray();

    res.send(results);
});

app.get('/olive/interact/getbyType', async (req, res) => {
    await mongoClient.connect();

    const results = await mongoClient.db('olive').collection('Interaction_Log').find({
        Type: req.query.type,
        Class: req.query.classid
    }).sort({ Time: -1 }).toArray();

    res.send(results);
});

app.get('/olive/interact/getChat', async (req, res) => {
    await mongoClient.connect();

    const results = await mongoClient.db('olive').collection('Interaction_Log').find({
        Type: 'chat',
        Student: req.query.student
    }).toArray();

    res.send(results);
});

app.delete('/olive/interact/deleteAll', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    const result = await mongoClient.db('olive').collection('Interaction_Log')
        .deleteMany({});

    if (result.matchedCount > 0) {
        res.send(result);
    } else res.send(result);
});

// Delete list by id
app.delete('/olive/interact/deletebyId', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    const result = await mongoClient.db('olive').collection('Interaction_Log')
        .deleteOne({
            _id: ObjectId(req.query._id)
        });

    if (result.matchedCount > 0) {
        res.send(result);
    } else res.send(result);
});

// Emoji_Stack

// Stacking
app.post('/olive/emojis', async (req, res) => {
    await mongoClient.connect();

    const emojis = req.body;

    let today = new Date();
    let todaystring = `${today.getFullYear()}-0${today.getMonth() + 1}-${today.getDate()}`;

    emojis['Date'] = new Date(todaystring);

    const results = await mongoClient.db('olive').collection('Emoji_Stack').insertOne(emojis);

    res.send(results);
});


app.get('/olive/emojis/getAll', async (req, res) => {
    await mongoClient.connect();

    const results = await mongoClient.db('olive').collection('Emoji_Stack').find({}).toArray();

    res.send(results);
})

// get stack with id
app.get('/olive/emojis/getbyId', async (req, res) => {
    await mongoClient.connect();

    const stack = await mongoClient.db('olive').collection('Emoji_Stack').findOne({
        _id: ObjectId(req.query._id)
    });
    console.log(stack);

    res.send(stack);
});

app.get('/olive/emojis/getbyClass', async (req, res) => {
    await mongoClient.connect();

    let today = new Date();
    let todaystring = `${today.getFullYear()}-0${today.getMonth() + 1}-${today.getDate()}`;

    const stack = await mongoClient.db('olive').collection('Emoji_Stack').find({
        Class: req.query.classid,
        Clear_stack: false,
        Date: new Date(todaystring)
    }).toArray();
    // console.log(stack);

    res.send(stack);
});

// append emoji
app.put('/olive/emojis/add', async (req, res) => {
    await mongoClient.connect();

    const emojis = req.body;

    const stack = await mongoClient.db('olive').collection('Emoji_Stack').findOne({
        _id: ObjectId(req.query._id)
    });
    stack.Emoji.push(emojis.Emoji);
    console.log(stack.Emoji);

    res.send(stack);
});

// clear stack
app.put('/olive/emojis/clear', async (req, res) => {
    await mongoClient.connect();

    const result = await mongoClient.db('olive').collection('Emoji_Stack').updateOne({
        _id: ObjectId(req.query._id)
    },
        {
            $set: { "Clear_stack": true }
        });
    console.log(result);

    res.send(result);
});

app.delete('/olive/emojis/delete', async (req, res) => {
    const result = await mongoClient.db('olive').collection('Emoji_Stack').deleteOne({
        _id: ObjectId(req.query._id)
    });

    res.send(result);
})

app.listen(port, () => console.log(`Now running on port ${port}...`))