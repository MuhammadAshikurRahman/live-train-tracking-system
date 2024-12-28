const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const { ObjectId } = require('mongodb'); // Import ObjectId for proper type conversion

const schedule = require('node-schedule'); // Import node-schedule

// MongoDB URI
const uri = "mongodb+srv://mdashikurrahman50000:uel4Zcf5Rkj1DtU9@cluster0.dasvi.mongodb.net/Train?retryWrites=true&w=majority";
const client = new MongoClient(uri);

// Express App Setup
const app = express();
const portMain = process.env.PORT || 4000; // Main Port for Routes

// Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('public'));

// LOGIN Session Middleware
app.use(session({
    secret: '123', // Replace with a strong secret key
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: uri,
        collectionName: 'sessions',
    }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

// MongoDB Connection and Routes
async function start() {
    try {
        await client.connect();
        console.log("Connected to MongoDB!");

        const userCollection = client.db("Train").collection("ID");
        const trainCollection = client.db("Train").collection("Train-info");


        schedule.scheduleJob('0 2 * * *', async () => {
            try {
                // Delete all documents from the Train-info collection
                const result = await trainCollection.deleteMany({});
        
                console.log(`Train-info collection cleared at 11:55 PM. Deleted ${result.deletedCount} documents.`);
            } catch (error) {
                console.error('Error clearing Train-info collection:', error);
            }
        });
        


        // ** Register Route **
        app.post('/register', async (req, res) => {
            const { id, password } = req.body;
            try {
                const existingUser = await userCollection.findOne({ id: id });
                if (existingUser) {
                    return res.status(400).json({ message: 'এই আইডি ইতিমধ্যে নিবন্ধিত আছে!' });
                }
                await userCollection.insertOne({ id: id, password: password });
                res.status(200).json({ message: 'Registration successful!' });
            } catch (error) {
                console.error('Error during registration:', error);
                res.status(500).json({ message: 'Server error during registration.' });
            }
        });

        // ** Login Route **
        app.post('/login', async (req, res) => {
            const { id, password } = req.body;
            try {
                const user = await userCollection.findOne({ id: id });
                if (!user || user.password !== password) {
                    return res.status(400).json({ message: 'Invalid ID or password!' });
                }
                req.session.userId = user._id;
                res.status(200).json({ message: 'Login successful!' });
            } catch (error) {
                console.error('Error during login:', error);
                res.status(500).json({ message: 'Server error during login.' });
            }
        });

        // ** Logout Route **
        app.post('/logout', (req, res) => {
            req.session.destroy(err => {
                if (err) {
                    return res.status(500).json({ message: 'Logout failed!' });
                }
                res.redirect('/'); // Redirect to login page after logout
            });
        });
// ====================================================================
        // ** Protected Routes **
        app.get('/home', isAuthenticated, (req, res) => {
            res.sendFile(__dirname + '/views/home.html');
        });

        app.get('/jatri', isAuthenticated, (req, res) => {
            res.sendFile(__dirname + '/views/jatri.html');
        });

        app.get('/wait', isAuthenticated, (req, res) => {
            res.sendFile(__dirname + '/views/wait.html');
        });

        app.get('/loc&speed', isAuthenticated, (req, res) => {
            res.sendFile(__dirname + '/views/loc&speed.html');
        });

        // ** Public Login Page **
        app.get('/', (req, res) => {
            res.sendFile(__dirname + '/views/index.html');
        });




        // ******** Add Train Route ********
        app.post('/addTrain', async (req, res) => {
            try {
                const train = req.body;
                train.uid = req.session.userId; // Automatically add userId from session to the train data
                train.updatedAt = new Date(); // Set current date-time for updatedAt
               
        
                const trainCollection = client.db("Train").collection("Train-info");
        
                // Delete any existing train data for the user
                await trainCollection.deleteMany({ uid: req.session.userId });
        
                // Insert the new train data
                await trainCollection.insertOne(train);
        
                res.redirect('/loc&speed'); // Redirect to location and speed page after successful insertion
            } catch (error) {
                console.error('Error adding train info:', error);
                res.status(500).send('Failed to add train information'); // Return error if failed to add train info
            }
        });
        
        app.get('/loc&speed', isAuthenticated, (req, res) => {
            res.sendFile(__dirname + '/views/loc&speed.html');
        });
       // res.redirect('/loc&speed'); // Redirect to location and speed page after successful insertion

    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }


    // Add train name display functionality on loc&speed.html
    app.get('/getTrain', isAuthenticated, async (req, res) => {
        const userId = req.session.userId;
    
        try {
            const trainCollection = client.db("Train").collection("Train-info");
    
            // Fetch train info for the authenticated user
            const trainInfo = await trainCollection.findOne({ uid: userId });
    
            if (!trainInfo) {
                return res.status(404).json({ error: 'No train data found for this user' });
            }
    
            // Send train name to the client
            res.status(200).json({ trainName: trainInfo.trainName });
        } catch (error) {
            console.error('Error fetching train info:', error);
            res.status(500).json({ error: 'Failed to fetch train info' });
        }
    });
    
    

// Update train name functionality on loc&speed.html





    // ** Update Train Info Route ** UPDATE TRAIN INFO FUNCTIONALITY
app.put('/updateTrainInfo', isAuthenticated, async (req, res) => {
    const { location, speed, message } = req.body;
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const trainCollection = client.db("Train").collection("Train-info");

        // Update the train document where uid matches
        const result = await trainCollection.updateOne(
            { uid: userId },
            {
                $set: {
                    location: location || '',
                    speed: speed || '',
                    updatedAt: new Date() // Set the current time
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Train information not found for this user' });
        }

        res.status(200).json({ message: 'Train information updated successfully!' });
    } catch (error) {
        console.error('Error updating train information:', error);
        res.status(500).json({ error: 'Failed to update train information' });
    }
});




// ====================================================================

// ** Update Message Route **
app.put('/updateMessage', isAuthenticated, async (req, res) => {
    const { message } = req.body;
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const trainCollection = client.db("Train").collection("Train-info");

        // Update the message field for the user
        const result = await trainCollection.updateOne(
            { uid: userId },
            {
                $set: {
                    message: message || ''
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Train information not found for this user' });
        }

        res.status(200).json({ message: 'Message updated successfully!' });
    } catch (error) {
        console.error('Error updating message:', error);
        res.status(500).json({ error: 'Failed to update message' });
    }
});




    // Fetch all train information
    app.get('/getAllTrains', async (req, res) => {
        try {
            const trainCollection = client.db("Train").collection("Train-info");
    
            // Fetch all train entries
            const trains = await trainCollection.find().toArray();
    
            // Group trains by trainName
            const groupedTrains = trains.reduce((acc, train) => {
                if (!acc[train.trainName]) {
                    acc[train.trainName] = { trainName: train.trainName, latSum: 0, lonSum: 0, speedSum: 0, count: 0, messages: [],updatedAt: train.updatedAt  };
                }
    
                const [lat, lon] = train.location.split(',').map(coord => parseFloat(coord.split(':')[1].trim()));
    
                acc[train.trainName].latSum += lat;
                acc[train.trainName].lonSum += lon;
                acc[train.trainName].speedSum += parseFloat(train.speed || 0);
                acc[train.trainName].count++;
                acc[train.trainName].messages.push(train.message);

                
    
                return acc;
            }, {});
    
            // Calculate average location and speed for each trainName
            const avgTrainData = Object.values(groupedTrains).map(trainGroup => ({
                trainName: trainGroup.trainName,
                avgLocation: `Lat: ${(trainGroup.latSum / trainGroup.count).toFixed(6)}, Lon: ${(trainGroup.lonSum / trainGroup.count).toFixed(6)}`,
                avgSpeed: trainGroup.speedSum / trainGroup.count,
                messages: trainGroup.messages,
                updatedAt: trainGroup.updatedAt // Include the updatedAt field
                
            }));
    
            res.status(200).json(avgTrainData);
        } catch (error) {
            console.error('Error fetching all train information:', error);
            res.status(500).json({ error: 'Failed to fetch train information' });
        }
    });

            //============================================



    
    



  

}


// Authenticated Middleware
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        return next();
    }
    res.redirect('/'); // Redirect to login page if not authenticated
}

// Start Server for Main Routes
app.listen(portMain, () => {
    console.log(`Main Server listening on port ${portMain}`);
    start(); // MongoDB connection
});
