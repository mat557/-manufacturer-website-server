const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const stripe = require("stripe")(process.env.STRIPE_KEY);
const { MongoClient, ServerApiVersion,ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hg4wn.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJwt(req,res,next){
  const authHeader = req.headers.authorization;
  if(!authHeader){
    return res.stuts(401).send({message : 'unauthorized access'});
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.TOKEN_SECRET, function(err, decoded) {
    if(err){
      return res.status(403).send({message:"forbidden access"})
    }
    // console.log(decoded)
    req.decoded = decoded;
    next();
  });
}



async function run(){
    try{
        await client.connect();
        const toolsCollection = client.db('Gear_store').collection('tools');
        const orderCollection = client.db('Gear_store').collection('orders');
        const reviewCollection = client.db('Gear_store').collection('reviews');
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
          app.get('/customOrder',verifyJwt,async(req,res)=>{
            const email = req.query.email;//this line is marked
            const decodedEmail = req.decoded.email;
            if(decodedEmail){
              const query = {email : email};
              const result = await orderCollection.find(query).toArray();
              return res.send(result);
            }
            else{
              return res.status(403).send({message:'forbidden access'})
            }
          });

          //deleting the random order
          app.delete('/order/:id',async(req,res)=>{
            const id = req.params.id;
            const query = {_id : ObjectId(id)}
            const result = await orderCollection.deleteOne(query);
            res.send(result);
          });


          // //adding user api 
          // app.put("/user/:email", async (req, res) => {
            
          //   const emial = req.params.email;
          //   const { name, email, phone, city, education, img } = req.body;
          //   const res = await userCollection.updateOne({ email: emial} , { $set: {name : name, email: email, phone: phone,education : education ,img : img, city: city } } )
          //     res.send(res);
          //   })


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
            const result = await userCollection.find(query).sort({_id:1}).toArray();
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
          });


          // this api is for loading all user for dashboar all user comp...
          app.get('/alluser',verifyJwt,async(req,res)=>{
            const query = {};
            const result = await allUserCollection.find(query).toArray();
            res.send(result)
          });

          //this api is to set admin role in db ,used  in dashboard all user
          app.put('/newuser/admin/:email',verifyJwt,async(req,res)=>{
            const email = req.params.email;
            const filter = {email : email}
            const adminEmail = req.decoded.email;
            const userWithAdmin = await allUserCollection.findOne({email :adminEmail});
            if(userWithAdmin.role === 'Admin'){
                const updateDoc = {
                  $set: {role :'Admin'},
                }
                const result = await allUserCollection.updateOne(filter,updateDoc);
                res.send(result);
            }
            else{
              res.status(403).send({message : 'forbidden access'})
            }
          });

          //this api is for to check admin
          app.get('/admin/:email',async(req,res)=>{
            const email = req.params.email;
            const user = await allUserCollection.findOne({email : email})
            const isAdmin =  user.role === 'Admin';
            res.send({admin : isAdmin})
          });


          //for review will be use in dashboard review
          app.post('/addreview',async(req,res)=>{
            const review = req.body;
            const result = await reviewCollection.insertOne(review);
            res.send(result);
          });

          //get all the review from  db
          app.get('/getreview',async(req,res)=>{
            const reviews = await reviewCollection.find().sort({_id:-1}).toArray();
            res.send(reviews);
          });

          app.get('/singlereview/:email',async(req,res)=>{
            const email = req.params.email;
            const query = {email : email};
            const result = await reviewCollection.findOne(query);
            res.send(result);
          });


          //for payment route

          app.get('/payment/:id',async(req,res)=>{
            const id = req.params.id;
            const query = {_id : ObjectId(id)};
            const result = await orderCollection.findOne(query);
            res.send(result);
          });



          // app.post('/create-payment-intent', async (req, res) => {

          //   const service = req.body;
          //   const price = service.price;
          //   const amount = price*100;
          //   const paymentIntent = await stripe.paymentIntents.create({
          //     amount : amount,
          //     currency: 'usd',
          //     payment_methods_types:['card'],
          //   })

          //   res.send({
          //     clientSecret: paymentIntent.client_secret,
          //   });
          // })


          app.post('/create-payment-intent', async(req, res) =>{
            const service = req.body;
            console.log(service)
            const price = service.price;
            const amount = price*100;
            const paymentIntent = await stripe.paymentIntents.create({
              amount : amount,
              currency: 'usd',
              payment_method_types:['card']
            });
            res.send({clientSecret: paymentIntent.client_secret})
          });
            
          //adding new tools
          app.post('/newTool',async(req,res)=>{
            const tool = req.body;
            const result = await toolsCollection.insertOne(tool);
            res.send(result);
          });

          app.get('/getorder',async(req,res)=>{
            const orders = await orderCollection.find().toArray();
            res.send(orders);
          });

          app.delete('/delete/:id',async(req,res)=>{
            const id = req.params.id;
            const query = {_id : ObjectId(id)};
            const result = await orderCollection.deleteOne(query)
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