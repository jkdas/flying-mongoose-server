const express = require('express')
const app = express()
const cors = require('cors');
require('dotenv').config();
const { MongoClient } = require('mongodb');
const ObjectId = require("mongodb").ObjectId;

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kzham.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        await client.connect();
        const database = client.db('flying_mongoose');
        const productsCollection = database.collection('products');
        const ordersCollection = database.collection('orders');
        const reviewCollection = database.collection('review');
        const usersCollection = database.collection('users');

        // get all products
        app.get("/products", async (req, res) => {
            const result = await productsCollection.find({}).toArray();
            res.send(result);
        });

        app.post('/addNewProducts', async (req, res) => {
            const product = req.body;
            const result = await productsCollection.insertOne(product);
            res.json(result)
        });
        //DELETE products
        app.delete('/deleteProduct/:id', async (req, res) => {
            const result = await productsCollection.deleteOne({ _id: ObjectId(req.params.id) });
            res.send(result);
        });
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        })

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.json(result);
        });

        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });
        // insert order and

        app.post("/addOrder", async (req, res) => {
            const result = await ordersCollection.insertOne(req.body);
            res.send(result);
        });

        //  my order

        app.get("/myOrder/:email", async (req, res) => {
            console.log(req.params.email);
            const result = await ordersCollection
                .find({ email: req.params.email })
                .toArray();
            res.send(result);
        });
        /// all order
        app.get("/allOrders", async (req, res) => {
            const result = await ordersCollection.find({}).toArray();
            res.send(result);
        });

        app.put('/statusUpdate/:id', (req, res) => {
            const id = req.params.id;
            const updateStatus = req.body;
            ordersCollection.updateOne(
                { _id: ObjectId(id) },
                {
                    $set: {
                        status: updateStatus.status
                    },
                }
            )
                .then(result => {
                    res.send(result);
                });
        })

        //DELETE API
        app.delete('/deleteOrder/:id', async (req, res) => {
            const result = await ordersCollection.deleteOne({ _id: ObjectId(req.params.id) });
            res.send(result);
        });

        // review
        app.post("/addReview", async (req, res) => {
            const result = await reviewCollection.insertOne(req.body);
            res.send(result);
        });

        // GET reviews API
        app.get('/allReviews', async (req, res) => {
            const cursor = reviewCollection.find({});
            const reviews = await cursor.toArray();
            res.send(reviews);
        });
        app.put("/makeAdmin", async (req, res) => {
            const filter = { email: req.body.email };
            const result = await usersCollection.find(filter).toArray();
            if (result) {
                const documents = await usersCollection.updateOne(filter, {
                    $set: { role: "admin" },
                });
                res.json(result);
                console.log(result);
            }

        });

        // check admin or not
        app.get("/checkAdmin/:email", async (req, res) => {
            const result = await usersCollection
                .find({ email: req.params.email })
                .toArray();
            res.send(result);
        });

    }
    finally {
        // await client.close();
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello from Flying Mongoose server')
})

app.listen(port, () => {
    console.log(`Moongose server listening at ${port}`)
})
