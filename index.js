// importing required files
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');


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


  
  const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5j7d2x6.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    
    
    const productCollection = client.db('expressBuy').collection('products');

    // get all the products
    app.get('/products', async(req, res) => {
        const page = parseInt(req.query.page) || 0;
        const limit = parseInt(req.query.limit) || 10;
        const skip = page * limit
          const result = await productCollection.find().skip(skip).limit(limit).toArray();
          res.send(result);
      })
  
      // get total products count
      app.get('/totalProducts', async(req,res) => {
          const result = await productCollection.estimatedDocumentCount();
          res.send({ totalProducts: result });
      })
      
      // jwt token sender api

    app.post('/jwt', (req, res) => {
        const requester = req.body;
  
        const token = jwt.sign(requester, process.env.ACCESS_TOKEN_SECRET_KEY, {
          expiresIn: '1h'
        })
       
        res.send({ token });
      })
  


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