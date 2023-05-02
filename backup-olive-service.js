const { mongo, MongoClient, ObjectId } = require('mongodb');
const moment = require('moment');

require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')

const port = 4000
const app = express()

// app.set('baseUrl', 'http://olive-api.northanapon.com');
app.set('baseUrl', 'https://3dddfdaadb14.ngrok.app');

// app.use((req, res, next) => {
//     // res.setHeader('Access-Control-Allow-Origin', 'https://90acce2ace74.ngrok.app');
//     res.setHeader('Access-Control-Allow-Origin', '*');
//     res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
//     res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//     res.setHeader('Access-Control-Allow-Credentials', 'true');
//     next();
// });

app.use(bodyParser.json(), cors())
app.options('*', cors())
app.use(cors({
    origin: 'https://90acce2ace74.ngrok.app',
    credentials: true
}));

const fs = require('fs');

const options = {
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert')
};

// const http = require('https').createServer(options, app);

// const http = require('http').createServer(app);
const io = require('socket.io')(app, {
    cors: {
        // origin: "http://olive.northanapon.com",
        origin: "https://90acce2ace74.ngrok.app",
        methods: ["GET", "POST", "PUT"],
        // allowedHeaders: ["my-custom-header"],
        credentials: true
    }
});

const router = express.Router();

// const socket = require("socket.io");



app.use(router)

// ---------- mongo ----------

// const url = "mongodb+srv://SmilealniS:sutorimu13@npm-olive.4z8itim.mongodb.net/?retryWrites=true&w=majority";
// const url = "mongodb://SmilealniS:sutorimu13@mongo:27017/Olive";
// Admin
const url = "mongodb://root:ictoliveict@mongo:27017";
const mongoClient = new MongoClient(url);

var todayLocal = new Date(
    // new Date().toLocaleString('th-TH', {
    //     timeZone: 'Asia/Bangkok',
    // }),
);

// Get all databases
router.get('/olive/listDatabases', async (req, res) => {
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
router.post('/olive/createCollections', async (req, res) => {
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
router.get('/olive/getCollections', async (req, res) => {
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
router.post('/olive/identity/create', async (req, res) => {
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
router.get('/olive/identity/getAll', async (req, res) => {
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
router.get('/olive/identity/getbyId', async (req, res) => {
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
router.get('/olive/identity/getbyParams', async (req, res) => {
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
router.put('/olive/identity/updatebyId', async (req, res) => {
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
router.delete('/olive/identity/deletebyId', async (req, res) => {
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

router.post('/', async (req, res) => {
    await mongoClient.connect();
    // console.log(req.body)

    const user = await mongoClient.db('olive').collection('Identity').findOne({
        Username: req.body.username
    });

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
router.post('/olive/student-profile/create', async (req, res) => {
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
router.get('/olive/student-profile/getAll', async (req, res) => {
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
router.get('/olive/student-profile/getbyId', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();
    console.log(req)

    try {
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
        }
    } catch (error) {
        let message = { 'message': `No listings found with the id '${req.query._id}' in collection 'Student_Profile'` };
        console.log(message.message);
        res.send(message);
    }
});

// Find listing in collection 'Student_Profile' matched all params
router.get('/olive/student-profile/getbyParams', async (req, res) => {
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
router.put('/olive/student-profile/updatebyId', async (req, res) => {
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
router.delete('/olive/student-profile/deletebyId', async (req, res) => {
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
router.post('/olive/teacher-profile/create', async (req, res) => {
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
router.get('/olive/teacher-profile/getAll', async (req, res) => {
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
router.get('/olive/teacher-profile/getbyId', async (req, res) => {
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
router.get('/olive/teacher-profile/getbyParams', async (req, res) => {
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
router.put('/olive/teacher-profile/updatebyId', async (req, res) => {
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
router.delete('/olive/teacher-profile/deletebyId', async (req, res) => {
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
router.post('/olive/admin-profile/create', async (req, res) => {
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
router.get('/olive/admin-profile/getAll', async (req, res) => {
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
router.get('/olive/admin-profile/getbyId', async (req, res) => {
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
router.get('/olive/admin-profile/getbyParams', async (req, res) => {
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
router.put('/olive/admin-profile/updatebyId', async (req, res) => {
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
router.delete('/olive/admin-profile/deletebyId', async (req, res) => {
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
router.post('/olive/attendance/create', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    console.log('-------------------- Attendance --------------------')
    const newList = req.body;

    // let today = new Date();
    // let todaystring;
    // if ((today.getMonth() + 1) > 9) {
    //     if (today.getDate() > 9) todaystring = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    //     else todaystring = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    // } else {
    //     if (today.getDate() > 9) todaystring = `${today.getFullYear()}-0${today.getMonth() + 1}-${today.getDate()}`;
    //     else todaystring = `${today.getFullYear()}-0${today.getMonth() + 1}-0${today.getDate()}`;
    // }

    console.log('Body:', req.body);
    // for (let i = 0; i < newList.length; i++) {
    // let data = {
    //     "Student_Id": newList.Student_Id,
    //     "Class": {
    //         "Id": newList.Class.Id,
    //         "Date": new Date(todaystring),
    //         "Status": false,
    //         "EnterTime": "",
    //         "ExitTime": ""
    //     }
    // }

    //     console.log(newList[i]);
    // }
    // console.log('====================');

    const result = await mongoClient.db('olive').collection('Attendance').insertOne(newList);
    // console.log('Inserted', result.insertedCount, 'with new list id:');
    // console.log(result.insertedIds);

    res.send(result);
});

router.get('/olive/attendance/getAll', async (req, res) => {
    // 
    await mongoClient.connect();

    console.log('-------------- Get all attendance ------------------')
    const results = await mongoClient.db('olive').collection('Attendance').find({}).toArray();
    console.log(results);

    res.send(results);
});

// Find listing in collection 'Attendance' matched all params
router.get('/olive/attendance/getbyStudentId', async (req, res) => {
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
router.get('/olive/attendance/getbyparams', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    let student = req.query.student == undefined ? "none" : req.query.student;
    let classdate = req.query.classdate == undefined ? "" : req.query.classdate;
    let classid = req.query.classid == undefined ? "" : req.query.classid;

    const results = await mongoClient.db('olive').collection('Attendance').find({
        Student_Id: student,
        "Class.Id": classid,
        // "Class.Date": new Date(classdate)
        "Class.Date": classdate
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

router.get('/olive/attendance/getbyClassId', async (req, res) => {
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

router.get('/olive/attendance/getbyClassDate', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    let classdate = req.query.classdate == undefined ? "" : req.query.classdate;
    let classid = req.query.classid == undefined ? "" : req.query.classid;

    const results = await mongoClient.db('olive').collection('Attendance').find({
        "Class.Id": classid,
        // "Class.Date": new Date(classdate)
        "Class.Date": classdate
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

// Update EnterTime and status of attendance list by id
router.put('/olive/attendance/updatebyId', async (req, res) => {
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
router.put('/olive/attendance/updateEnter', async (req, res) => {
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
router.put('/olive/attendance/updateLeave', async (req, res) => {
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

router.delete('/olive/attendance/deleteAll', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    const result = await mongoClient.db('olive').collection('Attendance')
        .deleteMany({});

    if (result.matchedCount > 0) {
        res.send(result);
    } else res.send(result);
});

// Delete list by id
router.delete('/olive/attendance/deletebyId', async (req, res) => {
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

router.post('/olive/engagement', async (req, res) => {
    // 
    await mongoClient.connect();

    console.log('-------------------- Create engagement --------------------')

    // let today = new Date();
    let today = todayLocal;
    let todaystring;
    if ((today.getMonth() + 1) > 9) {
        if (today.getDate() > 9) todaystring = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
        else todaystring = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    } else {
        if (today.getDate() > 9) todaystring = `${today.getFullYear()}-0${today.getMonth() + 1}-${today.getDate()}`;
        else todaystring = `${today.getFullYear()}-0${today.getMonth() + 1}-0${today.getDate()}`;
    }

    console.log("Today:", today, todaystring);

    const engagement = {
        Student_Id: req.body.Student_Id,
        Class: {
            Id: req.body.Class.Id,
            // Date: new Date(todaystring),
            Date: todaystring,
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

router.get('/olive/engagement/getAll', async (req, res) => {
    // 
    await mongoClient.connect();

    const results = await mongoClient.db('olive').collection('Engagement').find({}).toArray();
    console.log(results);

    res.send(results);
});

// 
router.get('/olive/engagement/getbyStudentID', async (req, res) => {
    // 
    await mongoClient.connect();

    let student = req.query.student == undefined ? "none" : req.query.student;
    let classid = req.query.classid == undefined ? "none" : req.query.classid;

    const results = await mongoClient.db('olive').collection('Engagement').find({
        Student_Id: student,
        "Class.Id": classid,
        Clear: false
    }).toArray();
    console.log(results);

    res.send(results);
});

router.get('/olive/engagement/getbyClassID', async (req, res) => {
    // 
    await mongoClient.connect();

    console.log('-------------- Get Engagement -----------------')

    let classid = req.query.classid == undefined ? "none" : req.query.classid;

    // let today = new Date();
    let today = todayLocal;
    let todaystring;
    if ((today.getMonth() + 1) > 9) {
        if (today.getDate() > 9) todaystring = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
        else todaystring = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    } else {
        if (today.getDate() > 9) todaystring = `${today.getFullYear()}-0${today.getMonth() + 1}-${today.getDate()}`;
        else todaystring = `${today.getFullYear()}-0${today.getMonth() + 1}-0${today.getDate()}`;
    }

    const results = await mongoClient.db('olive').collection('Engagement').find({
        "Class.Id": classid,
        // "Class.Date": new Date(todaystring),
        "Class.Date": todaystring,
        Clear: false
    }).toArray();

    console.log(results);

    res.send(results);
});

router.put('/olive/engagement/addLog', async (req, res) => {
    // 
    await mongoClient.connect();

    let today = todayLocal;
    let todaystring;
    if ((today.getMonth() + 1) > 9) {
        if (today.getDate() > 9) todaystring = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
        else todaystring = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    } else {
        if (today.getDate() > 9) todaystring = `${today.getFullYear()}-0${today.getMonth() + 1}-${today.getDate()}`;
        else todaystring = `${today.getFullYear()}-0${today.getMonth() + 1}-0${today.getDate()}`;
    }

    console.log('------------------- Add engagement log ------------------')
    const log = req.body;

    const engagement = await mongoClient.db('olive').collection('Engagement').findOne({
        Student_Id: req.query.student,
        "Class.Id": req.query.class,
        "Class.Date": todaystring,
        Clear: false
    });

    console.log('Old:', engagement)

    if (engagement != null) {
        engagement.Interaction_Log.push(log.Interaction_Log);

        console.log('New:', engagement)

        const results = await mongoClient.db('olive').collection('Engagement').updateOne({
            _id: engagement._id
        }, {
            $set: engagement
        });

        res.send(results);
    } else {
        console.log('Req:', req.query, req.body, todaystring)
        res.send({ 'results': 'No engagement found' })
    }
});

router.put('/olive/engagement/update', async (req, res) => {
    // 
    await mongoClient.connect();

    const log = req.body;

    console.log('------------ Update engagement ----------------')

    console.log('Engagement', log)

    try {
        const oldlog = await mongoClient.db('olive').collection('Engagement')
            .findOne({
                _id: ObjectId(req.query._id)
            });

        console.log('Old:', oldlog)

        oldlog.Class.Engagement = log.Class.Engagement;

        console.log('New:', oldlog)

        const results = await mongoClient.db('olive').collection('Engagement')
            .updateOne({
                // Student_Id: req.query.student,
                // "Class.Id": req.query.class 
                _id: ObjectId(req.query._id)
            }, {
                $set: oldlog
            });

        res.send(results);
    } catch {

    }
});

router.put('/olive/engagement/clear', async (req, res) => {
    // 
    await mongoClient.connect();

    try {
        const oldlog = await mongoClient.db('olive').collection('Engagement')
            .find({
                _id: ObjectId(req.query._id)
            }).toArray();

        oldlog[0].Clear = true;


        const results = await mongoClient.db('olive').collection('Engagement')
            .updateOne({
                _id: ObjectId(req.query._id)
            }, {
                $set: oldlog[0]
            });

        res.send(results);
    } catch {
        // 
    }
});

router.delete('/olive/engagement/deletebyId', async (req, res) => {
    // 
    await mongoClient.connect();

    const result = await mongoClient.db('olive').collection('Engagement').deleteOne({
        _id: ObjectId(req.query._id)
    });

    console.log(`${req.query._id}`);

    res.send(result);
});

router.delete('/olive/engagement/deleteAll', async (req, res) => {
    // 
    await mongoClient.connect();

    const result = await mongoClient.db('olive').collection('Engagement').deleteMany({});

    res.send(result);
});

// Enrollment

router.post('/olive/enroll', async (req, res) => {
    let newList = req.body;

    console.log(newList);
    console.log('====================');

    const result = await mongoClient.db('olive').collection('Enrollment').insertMany(newList);
    console.log('Inserted', result.insertedCount, 'with new list id:');
    console.log(result.insertedIds);

    res.send(result);
});

// 
router.get('/olive/enroll/getAll', async (req, res) => {
    // 
    await mongoClient.connect();

    const results = await mongoClient.db('olive').collection('Enrollment').find({}).toArray();
    console.log(results);

    res.send(results);
});

router.get('/olive/enroll/getbyClassID', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    const result = await mongoClient.db('olive').collection('Enrollment').find({
        Class: req.query.classid
    }).toArray();

    console.log(result);

    // res.redirect('/teachingUI')
    res.send(result);
});

router.post('/redirect', (req, res) => {
    res.status(301).redirect(`https://90acce2ace74.ngrok.app/${req.query.rp}`)
});

router.get('/olive/enroll/getbyStudentID', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    const result = await mongoClient.db('olive').collection('Enrollment').find({
        Student: req.query._id
    }).toArray();

    console.log(result);

    res.send(result);
});

router.put('/olive/enroll/updateStudent', async (req, res) => {
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

router.delete('/olive/enroll/delete', async (req, res) => {
    await mongoClient.connect();

    const result = await mongoClient.db('olive').collection('Enrollment').deleteOne({
        _id: ObjectId(req.query._id)
    });

    res.send(result);
});

// Score

router.post('/olive/score/create', async (req, res) => {
    await mongoClient.connect();

    const newList = req.body;
    console.log(newList);

    const result = await mongoClient.db('olive').collection('Score').insertMany(newList);
    console.log(`${result.insertedCount} ids inserted: ${result.insertedIds}`)

    res.send(result);
});

// get all score
router.get('/olive/score/getAll', async (req, res) => {
    await mongoClient.connect();

    const result = await mongoClient.db('olive').collection('Score').find({}).toArray();
    console.log(result);

    res.send(result);
})

// get score by student _id
router.get('/olive/score/getbyStudentId', async (req, res) => {
    await mongoClient.connect();

    const result = await mongoClient.db('olive').collection('Score').find({
        Student_Id: req.query.student
    }).toArray();
    console.log(result);

    res.send(result);
})

// get score by class id
router.get('/olive/score/getbyClassId', async (req, res) => {
    await mongoClient.connect();

    const result = await mongoClient.db('olive').collection('Score').find({
        Class: req.query.classid
    }).toArray();
    console.log(result);

    res.send(result);
})

// update score by student and class id
router.put('/olive/score/update', async (req, res) => {
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

router.delete('/olive/score/delete', async (req, res) => {
    await mongoClient.connect();

    const result = await mongoClient.db('olive').collection('Score').deleteOne({
        Student_Id: req.query.student,
        Class: req.query.classid
    });

    res.send(result);
});


// Class

router.post('/olive/class/create', async (req, res) => {
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
            "Class": []
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
router.get('/olive/class/getAll', async (req, res) => {
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
router.get('/olive/class/getbyId', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    const result = await mongoClient.db('olive').collection('Class').findOne({
        _id: ObjectId(req.query._id)
    });

    if (result) {
        let message = { 'message': `Found listing with id ${req.query._id}` };
        console.log(message.message);

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

        res.send({
            ...result,
            ...message
        });
    } else {
        let message = { 'message': `No listings found with Class ID(${req.query._id})` };
        console.log(message.message);
        res.send({
            ...result,
            ...message
        });
    }
});

router.get('/olive/class/getbyTeacher', async (req, res) => {
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

router.get('/olive/class/getbyClassDate', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    let classdate = req.query.classdate == undefined ? "" : req.query.classdate;

    const results = await mongoClient.db('olive').collection('Attendance').find({
        // Date: new Date(classdate)
        Date: classdate
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
router.put('/olive/class/updatebyId', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();
    console.log('-------------------- Update class by Id --------------------')

    const old = await mongoClient.db('olive').collection('Class').findOne({
        _id: ObjectId(req.query._id)
    });
    // console.log(old);

    const updatedList = req.body;
    old.Class.push(updatedList.Class)

    // console.log(updatedList.Class, old.Class)
    // console.log(old.Class.push(updatedList.Class))
    // console.log(old)

    const result = await mongoClient.db('olive').collection('Class')
        .updateOne({
            _id: ObjectId(req.query._id)
        }, {
            $set: old
        });

    if (result.matchedCount > 0) {
        res.send(result);
    } else res.send(result);
});

// Update EnterTime and date of class list by id
router.put('/olive/class/updateEnter', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    // let today = new Date();
    let today = todayLocal;
    let todaystring;
    if ((today.getMonth() + 1) > 9) {
        if (today.getDate() > 9) todaystring = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
        else todaystring = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    } else {
        if (today.getDate() > 9) todaystring = `${today.getFullYear()}-0${today.getMonth() + 1}-${today.getDate()}`;
        else todaystring = `${today.getFullYear()}-0${today.getMonth() + 1}-0${today.getDate()}`;
    }

    const updatedList = {
        // "Date": new Date(todaystring),
        "Date": todaystring,
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
router.put('/olive/class/updateLeave', async (req, res) => {
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
router.delete('/olive/class/deletebyId', async (req, res) => {
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

router.post('/olive/emoji', async (req, res) => {
    await mongoClient.connect();

    const emojis = req.body;

    const results = await mongoClient.db('olive').collection('Emoji').insertMany(emojis);

    res.send(results);
});

router.get('/olive/emoji/getAll', async (req, res) => {
    await mongoClient.connect();

    const results = await mongoClient.db('olive').collection('Emoji').find({}).toArray();

    res.send(results);
});

// Interaction_Log

router.post('/olive/interact', async (req, res) => {
    await mongoClient.connect();

    console.log('-------------------- Interaction ----------------------')

    // let result = { message: `${req.body.Student} | ${req.body.Class} | ${req.body.Type} | ${req.body.Emoji} | ${req.body.Description} | ${req.body.Boolean}` };
    // console.log(result);
    // res.send(result);

    let student = req.body.Student == undefined ? "" : req.body.Student;
    let clas = req.body.Class == undefined ? "" : req.body.Class;
    let type = req.body.Type == undefined ? "" : req.body.Type;
    let emoji = req.body.Emoji == undefined ? "" : req.body.Emoji;
    let desc = req.body.Description == undefined ? "" : req.body.Description;
    let bools = req.body.Boolean == undefined ? "" : req.body.Boolean;

    // let today = new Date(moment().format());
    let today = todayLocal;
    let todaystring;
    if ((today.getMonth() + 1) > 9) {
        if (today.getDate() > 9) todaystring = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
        else todaystring = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    } else {
        if (today.getDate() > 9) todaystring = `${today.getFullYear()}-0${today.getMonth() + 1}-${today.getDate()}`;
        else todaystring = `${today.getFullYear()}-0${today.getMonth() + 1}-0${today.getDate()}`;
    }
    // console.log('Today is', today)

    const interaction = {
        Student: student,
        Class: clas,
        Type: type,
        Emoji: emoji,
        Description: desc,
        Boolean: bools,
        // Date: new Date(todaystring),
        Date: todaystring,
        Time: new Date().getTime()
    };
    console.log(interaction);

    const results = await mongoClient.db('olive').collection('Interaction_Log').insertOne(interaction);

    res.send(results);
});

router.get('/olive/interact/getAll', async (req, res) => {
    await mongoClient.connect();

    const results = await mongoClient.db('olive').collection('Interaction_Log').find({}).toArray();

    res.send(results);
});

router.get('/olive/interact/getbyId', async (req, res) => {
    await mongoClient.connect();

    const result = await mongoClient.db('olive').collection('Interaction_Log').findOne({
        _id: ObjectId(req.query._id)
    });
    console.log(result);

    res.send(result);
});

router.get('/olive/interact/getbyType', async (req, res) => {
    await mongoClient.connect();

    // let today = new Date();
    let today = todayLocal;
    let todaystring;
    if ((today.getMonth() + 1) > 9) {
        if (today.getDate() > 9) todaystring = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
        else todaystring = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    } else {
        if (today.getDate() > 9) todaystring = `${today.getFullYear()}-0${today.getMonth() + 1}-${today.getDate()}`;
        else todaystring = `${today.getFullYear()}-0${today.getMonth() + 1}-0${today.getDate()}`;
    }

    const results = await mongoClient.db('olive').collection('Interaction_Log').find({
        Type: req.query.type,
        Class: req.query.classid,
        // Date: new Date(todaystring)
        Date: todaystring
    }).sort({ Time: 1 }).toArray();

    res.send(results);
});

router.get('/olive/interact/getStudent', async (req, res) => {
    await mongoClient.connect();

    const results = await mongoClient.db('olive').collection('Interaction_Log').findOne({
        Type: req.query.type,
        Student: req.query.student,
        Class: req.query.classid,
        // Date: new Date(req.query.date)
    });

    res.send(results);
});

router.put('/olive/interact/updateLight', async (req, res) => {
    await mongoClient.connect();

    console.log('--------------- Toggle light -----------')

    const light = await mongoClient.db('olive').collection('Interaction_Log').findOne({
        _id: ObjectId(req.query._id)
    });

    console.log('Before:', light)

    light.Boolean = Boolean(req.query.light)

    console.log('After:', light)

    const result = await mongoClient.db('olive').collection('Interaction_Log')
        .updateOne({
            _id: ObjectId(req.query._id)
        }, {
            $set: light
        });

    res.send(result);
});

router.delete('/olive/interact/deleteAll', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    const result = await mongoClient.db('olive').collection('Interaction_Log')
        .deleteMany({});

    if (result.matchedCount > 0) {
        res.send(result);
    } else res.send(result);
});

// Delete list by id
router.delete('/olive/interact/deletebyId', async (req, res) => {
    // Connect mongodb
    await mongoClient.connect();

    try {
        const result = await mongoClient.db('olive').collection('Interaction_Log')
            .deleteOne({
                _id: ObjectId(req.query._id)
            });

        if (result.matchedCount > 0) {
            res.send(result);
        } else res.send(result);
    } catch {
        // 
    }
});

// Emoji_Stack

// Stacking
router.post('/olive/emojis', async (req, res) => {
    await mongoClient.connect();

    console.log('-------------------- Add emoji stack --------------------')

    const emojis = req.body;

    console.log(emojis)

    const results = await mongoClient.db('olive').collection('Emoji_Stack').insertOne(emojis);

    res.send(results);
});


router.get('/olive/emojis/getAll', async (req, res) => {
    await mongoClient.connect();

    const results = await mongoClient.db('olive').collection('Emoji_Stack').find({}).toArray();

    res.send(results);
})

// get stack with id
router.get('/olive/emojis/getbyId', async (req, res) => {
    await mongoClient.connect();

    const stack = await mongoClient.db('olive').collection('Emoji_Stack').findOne({
        _id: ObjectId(req.query._id)
    });
    console.log(stack);

    res.send(stack);
});

router.get('/olive/emojis/getbyClass', async (req, res) => {
    await mongoClient.connect();

    console.log('-------------- Get emoji stack ---------------')

    try {
        let today = todayLocal;
        let todaystring;
        if ((today.getMonth() + 1) > 9) {
            if (today.getDate() > 9) todaystring = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
            else todaystring = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
        } else {
            if (today.getDate() > 9) todaystring = `${today.getFullYear()}-0${today.getMonth() + 1}-${today.getDate()}`;
            else todaystring = `${today.getFullYear()}-0${today.getMonth() + 1}-0${today.getDate()}`;
        }

        const stack = await mongoClient.db('olive').collection('Emoji_Stack').find({
            Class: req.query.classid,
            Clear_stack: false,
            // Date: new Date(req.query.todaystring)
            // Date: req.query.todaystring
            Date: todaystring
        }).toArray();

        console.log(stack);

        res.send(stack);
    } catch {
        // 
    }
});

// append emoji
router.put('/olive/emojis/add', async (req, res) => {
    await mongoClient.connect();

    console.log('-------------------- Add emoji --------------------')

    const emojis = req.body;
    console.log(req.query._id, emojis)

    const stack = await mongoClient.db('olive').collection('Emoji_Stack').findOne({
        _id: ObjectId(req.query._id)
    });

    console.log('Old:', stack)

    stack.Emoji.push(emojis.Emoji);
    console.log('New:', stack);

    const result = await mongoClient.db('olive').collection('Emoji_Stack').updateOne({
        _id: ObjectId(req.query._id)
    }, {
        $set: stack
    })

    res.send(result);
});

// clear stack
router.put('/olive/emojis/clear', async (req, res) => {
    await mongoClient.connect();

    console.log('------------ Clear stack -------------')
    try {
        const result = await mongoClient.db('olive').collection('Emoji_Stack').updateOne({
            _id: ObjectId(req.query._id)
        },
            {
                $set: { "Clear_stack": true }
            });
        console.log(result);

        res.send(result);
    } catch {
        // 
    }


});

router.delete('/olive/emojis/delete', async (req, res) => {
    await mongoClient.connect();

    const result = await mongoClient.db('olive').collection('Emoji_Stack').deleteOne({
        _id: ObjectId(req.query._id)
    });

    res.send(result);
});

router.delete('/olive/emojis/deleteAll', async (req, res) => {
    await mongoClient.connect();

    const result = await mongoClient.db('olive').collection('Emoji_Stack').deleteMany({});

    res.send(result);
});

router.get('/active-users', (req, res) => {
    res.send(student);
});


const server = app.listen(port, () => console.log(`Now running on port ${port}...`));
server.keepAliveTimeout = 0;

// const io = socket(server, {
//     cors: { 
//         origin: "http://localhost:3000",
//         credentials: true
//     }
// });

var active = [];
var teacher = [];
var student = [];

io.on("connection", (socket) => {
    socket.on('add-user', nuser => {

        if (!active.some((user) => user._id === nuser[0])) {
            console.log('Enter:', nuser)
            active.push({
                _id: nuser[0],
                role: nuser[1],
                socket_id: socket.id
            })
            if (nuser[1] == 'teacher') {
                teacher.push(socket.id);
                console.log('Teacher active:', teacher)
            } else if (nuser[1] == 'student') {
                student.push(nuser[0])
            }
        } else {
            console.log('already active')
        }
        io.emit('get-user', active)
    });

    socket.on('get-user', () => {
        console.log('Active:', active)
        // console.log('Teacher active:', teacher)
    });

    socket.on('send-msg', data => {
        io.emit('msg-recieve', data)
        // io.to(teacher).emit('get-interact', data)
    });

    socket.on('msg-recieve', data => {
        // console.log('Recieve:', data)
    });

    socket.on('send-emo', data => {
        // console.log('****************** Send Emoji ********************')
        // teacher.forEach(t => {
        //     io.to(t).emit('emo-recieve', data)
        // })
        io.emit('emo-recieve', data);

        // io.to(teacher).emit('get-interact', data)
    });

    socket.on('emo-recieve', data => {
        // console.log('Recieve:', data)
    });

    socket.on('send-interact', data => {
        console.log('****************** Send interaction ********************')
        // teacher.forEach(t => {
        //     io.to(t).emit('get-interact', data)
        // });
        io.emit('get-interact', data);
    });

    socket.on('toggle-light', data => {
        // console.log(data)
        io.emit('cal-light', data)
        // io.to(teacher).emit('get-interact', data)
    });

    socket.on('cal-light', data => {
        // console.log('Recieve:', data)
    });
});
