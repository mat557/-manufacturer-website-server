const express = require('express');
const cors = require('cors');
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

          //adding order

          app.post('/order',async(req,res)=>{
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
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