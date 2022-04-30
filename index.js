const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
var jwt = require("jsonwebtoken");

// MiddleWere
app.use(express.json());
app.use(cors());

// Connecting DB

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.d7c9x.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    // Collection
    const inventoryCollection = client.db("speedo").collection("inventory");

    // // Getting Access Token
    // app.post("/getToken", (req, res) => {
    //   const email = req.body;
    //   const accessToken = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET, {
    //     expiresIn: "1d",
    //   });
    //   res.send(accessToken);
    // });

    // Getting inventories
    app.get("/inventory", async (req, res) => {
      const query = {};
      const cursor = inventoryCollection.find(query);
      const inventories = await cursor.toArray();
      res.send(inventories);
    });

    // Get Single Inventory using ID
    app.get("/inventory/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const inventory = await inventoryCollection.findOne(query);
      res.send(inventory);
    });

    // Update SOLD AND QUANTITY:
    app.post("/updateQuantity", async (req, res) => {
      const inventory = req.body;
      let { quantity, sold, ...rest } = inventory;
      const newQuantity = parseInt(quantity) - 1;
      const newSoldQuant = parseInt(sold) + 1;

      quantity = newQuantity;
      sold = newSoldQuant;

      const updatedInventory = { quantity, sold, ...rest };

      console.log(inventory);

      const query = { _id: ObjectId(inventory._id) };

      const updateDoc = {
        $set: {
          quantity: newQuantity,
          sold: newSoldQuant,
        },
      };

      const options = { upsert: true };

      const result = await inventoryCollection.updateOne(
        query,
        updateDoc,
        options
      );

      res.send([result, updatedInventory]);
    });
  } finally {
    // await client.close()
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("SPEEDO Initiated");
});

app.listen(port, () => {
  console.log("Responding to", port);
});
