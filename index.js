// importing required files
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


// installing middle wares
const app = express()
const port = process.env.PORT || 4000

// handling cors
const corsOptions = {
    origin: '*',
    credentials: true,
    optionSuccessStatus: 200,
}
app.use(cors(corsOptions))
// handing json conversion
app.use(express.json())


// jwt verifying function
const validateJWT = async (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
      return res.status(401).send({ error: true, message: 'You are not authorized' })
    }
    const token = authorization.split(' ')[1];
  
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET_KEY, (error, decoded) => {
      if (error) {
        return res.status(401).send({ error: true, message: 'You are not authorized' })
      }
  
      req.decoded = decoded;
      next()
    })
  }

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
        const usersCollection = client.db("expressBuy").collection("users");
        const cartCollection = client.db("expressBuy").collection("cart");
        const orderCollection = client.db("expressBuy").collection("orders");

        // jwt token sender api

        app.post('/jwt', (req, res) => {
            const requester = req.body;

            const token = jwt.sign(requester, process.env.ACCESS_TOKEN_SECRET_KEY, {
                expiresIn: '1h'
            })

            res.send({ token });
        })
        
        // get all the products
        app.get('/products', async (req, res) => {
            const page = parseInt(req.query.page) || 0;
            const limit = parseInt(req.query.limit) || 10;
            const skip = page * limit
            const result = await productCollection.find().skip(skip).limit(limit).toArray();
            res.send(result);
        })

        // get total products count
        app.get('/totalProducts', async (req, res) => {
            const result = await productCollection.estimatedDocumentCount();
            // const result = await productCollection.find().toArray();
            res.send({ totalProducts: result });
        })

        

        // registering first time user as customer
    app.post('/register-new-user', async (req, res) => {
        const requester = req.body
        const query = { email: requester.email }
        const alreadyRegistered = await usersCollection.findOne(query)
        if (alreadyRegistered) {
          return res.send({ message: 'You are already registered' })
        }
        const result = await usersCollection.insertOne(requester);
        res.send(result);
      })

      // adding product to cart api for customer
    app.post('/add-to-cart', validateJWT, async (req, res) => {
        const newCart = req.body
        const result = await cartCollection.insertOne(newCart)
        res.send(result)
      })
      // api for getting products in user's cart 
    app.get('/carts', validateJWT, async(req, res) => {
        const email = req.query?.email;
        if(!email){
          return res.send([]);
        }
        const decodedEmail = req.decoded.email // getting the decoded email from the response of jwt
        if(email !== decodedEmail){
          //adding extra level of security
          return res.status(403).send({error: true, message: 'forbidden access'})
        }
        const query = { 
            customerEmail : email};
        const result = await cartCollection.find(query).toArray();
        res.send(result)
      })

      // api for getting total product charge and shipment charge of the user's cart
      app.get('/carts/user-cart-products-total-price', validateJWT, async(req,res)=>{
        try{
            const { customerEmail } = req.query;
        const cartItems = await cartCollection.find({ customerEmail }).toArray();
        let totalPrice = 0;
        let totalShipping = 0;
        cartItems.forEach((item) => {
            totalPrice += item.price;
            totalShipping += item.shipping;
          });
          const totalProducts = cartItems.length;
          res.send({ totalPrice, totalShipping,totalProducts });
        }
        catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'An error occurred' });
          }
      })

      // delete selected product from cart api for customer
    app.delete('/customer-selected-product', validateJWT, async (req, res) => {
        const id = req.query?.id;
        const query = { _id: new ObjectId(id) }
        const result = await cartCollection.deleteOne(query)
        res.send(result);
      })
      // clearing or deleting every product from cart
      app.delete('/customer-cart-products', validateJWT, async (req, res) => {
        
        try{
            const customerEmail = req.query?.customerEmail;
        const result = await cartCollection.deleteMany({ customerEmail });
        // console.log(result)
        res.send(result);
        }
        catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'An error occurred' });
          }
      })
      // confirming orders api for user
      app.post('/confirm-order',validateJWT, async(req,res)=>{
        try{
            const customerEmail = req.query?.customerEmail;
            const cartItems = await cartCollection.find({ customerEmail }).toArray();
            const removeFromCart = await cartCollection.deleteMany({ customerEmail });
            const orderedItems = cartItems.map(({ _id, ...rest }) => rest);
            const result = await orderCollection.insertMany(orderedItems)
            console.log(result)
            res.send(result);
        }
        catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'An error occurred' });
          }
      })
      // api for user's order
      app.get('/my-orders', validateJWT, async(req,res)=>{
        try{
            const customerEmail = req.query?.customerEmail;
            const result = await orderCollection.find({customerEmail}).toArray();
        res.send(result)
        }
        catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'An error occurred' });
          }
      })

      // getting all users to display at admin-dashboard manage users page
    app.get('/users', validateJWT, async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    })

    
    // api for admin to make the user an admin
    app.patch('/users/make-admin/:userId', validateJWT, async (req, res) => {
      const userId = req.params.userId;
      const filter = { _id: new ObjectId(userId) }
      const updateRole = {
        $set: {
          role: 'admin'
        }
      }
      const result = await usersCollection.updateOne(filter, updateRole);
      res.send(result);
    })
  
        // user role getting api 
    app.get('/user-role/:email', validateJWT, async (req, res) => {

        try {
  
          const email = req.params.email;
          const user = await usersCollection.findOne({ email });
          if (!user) {
            return res.status(404).send({ error: 'User not found' });
          }
          const role = user.role;
  
          res.send({ role });
        } catch (error) {
          res.status(500).send({ error: 'Server error' });
        }
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