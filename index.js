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

  app.get('/', (req, res) => {
    res.send('Express Buy Server is operating')
  })
  app.listen(port, () => {
    console.log(`Express Buy Server is operating on port ${port}`)
  })