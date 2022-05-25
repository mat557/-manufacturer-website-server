const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion,ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hg4wn.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run(){
    try{
        await client.connect();
        const toolsCollection = client.db('Gear_store').collection('tools');
        const orderCollection = client.db('Gear_store').collection('orders');
        // const reviewCollection = client.db('Gear_store').collection('reviews');
        const userCollection = client.db('Gear_store').collection('users');
        const allUserCollection = client.db('Gear_store').collection('usersForAdmin');

        //getting every collection for tools and home tools
        app.get('/tools', async (req, res) => {
            const query = {};
            const cursor = toolsCollection.find(query);
            const tools = await cursor.toArray();
            res.send(tools);
          });


          //getting single collection by id for check and order
          app.get('/tools/:id',async (req,res)=>{
            const id = req.params.id;
            // console.log(id);
            const query = {_id : ObjectId (id)};
            const tool = await toolsCollection.findOne(query);
            res.send(tool);
          });

          //adding order api
          app.post('/order',async(req,res)=>{
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
          });


          //get all order for perticular customer
          app.get('/customOrder',async(req,res)=>{
            const email = req.query.email;
            const authorization = req.headers.authorization;//this line is marked
            const query = {email : email};
            const result = await orderCollection.find(query).toArray();
            res.send(result);
          });

          //deleting the random order
          app.delete('/order/:id',async(req,res)=>{
            const id = req.params.id;
            const query = {_id : ObjectId(id)}
            const result = await orderCollection.deleteOne(query);
            res.send(result);
          });


          //adding user api 
          app.put('/user/:email',async(req,res)=>{
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
              $set: user,
            };
            const result = await userCollection.updateOne(filter,updateDoc, options);
            res.send(result);
          });

          //user get api for profile
          app.get('/userByEmail',async(req,res)=>{
            const email = req.query.email;
            const query = {email : email};
            const result = await userCollection.findOne(query);
            res.send(result);
          });

          
          //creating put method for new user to store user info who loged in used in useGettoken
          app.put('/newuser/:email',async(req,res)=>{
            const email = req.params.email;
            const user = req.body;
            const filter = {email : email}
            const options = {upsert:true}
            const updateDoc = {
              $set: user,
            }
            const result = await allUserCollection.updateOne(filter,updateDoc,options);
            const token = jwt.sign({ email : email }, process.env.TOKEN_SECRET, { expiresIn: '1h' });
            res.send({result,token});
          })

    }
    finally{}
}

run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('The Port Is Running From Assignment Task!')
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});