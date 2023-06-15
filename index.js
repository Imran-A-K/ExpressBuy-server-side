// importing required files
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()

// installing middle wares
const app = express()
const port = process.env.PORT || 5000

// handling cors
const corsOptions = {
    origin: '*',
    credentials: true,
    optionSuccessStatus: 200,
  }
  app.use(cors(corsOptions))
// handing json conversion
  app.use(express.json())


  
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://<username>:<password>@cluster0.5j7d2x6.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    
  }
}
run().catch(console.dir);


  app.get('/', (req, res) => {
    res.send('Express Buy Server is operating')
  })
  app.listen(port, () => {
    console.log(`Express Buy Server is operating on port ${port}`)
  })