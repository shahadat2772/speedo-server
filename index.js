const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
var jwt = require("jsonwebtoken");
const verify = require("jsonwebtoken/verify");

// MiddleWere
app.use(cors());
app.use(express.json());

// Verifying the TOKEN
const JWTVerification = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access." });
  }
  // token
  const token = authHeader.split(" ")[1];

  // verifying the token
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
    if (error) {
      return res.status(403).send({ message: "Forbidden Access" });
    } else {
      req.decoded = decoded;
      next();
    }
  });
};

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

    // AUTH (GETTING TOKEN FOR USER)
    app.post("/token", (req, res) => {
      const email = req.body;
      const accessToken = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d",
      });
      res.send(accessToken);
    });

    // Getting inventories
    app.get("/inventory", async (req, res) => {
      const limit = parseInt(req?.query?.limit);

      const query = {};
      const cursor = inventoryCollection.find(query);

      // Getting all the inventories

      const inventories = await cursor.toArray();
      res.send(inventories);
    });

    // Getting first six items
    app.get("/getFirstSixInventory", async (req, res) => {
      const query = {};
      const cursor = inventoryCollection.find(query);
      // Getting 6 items form collection
      const inventories = await cursor.limit(6).toArray();
      res.send(inventories);
    });

    // Getting my inventories
    app.get("/myInventories", JWTVerification, async (req, res) => {
      const email = req.query.email;
      const decodedEmail = req.decoded.email;
      if (email === decodedEmail) {
        const query = { email: email };
        const cursor = inventoryCollection.find(query);
        const inventories = await cursor.toArray();
        res.send(inventories);
      } else {
        return res.status(403).send({ message: "forbidden access" });
      }
    });

    // Get last inserted four inventories
    app.get("/lastInventories", async (req, res) => {
      const query = {};
      const cursor = inventoryCollection.find(query).sort({ _id: -1 }).limit(4);
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

    // Add Inventory
    app.post("/addInventory", async (req, res) => {
      const inventory = req.body;
      const result = await inventoryCollection.insertOne(inventory);
      res.send(result);
    });

    // Update SOLD AND QUANTITY RESTOCK:
    app.post("/updateQuantity", async (req, res) => {
      const inventory = req.body;
      let { quantity, sold, ...rest } = inventory;

      const newQuantity = parseInt(quantity) - 1;
      const newSoldQuant = parseInt(sold) + 1;

      quantity = newQuantity;
      sold = newSoldQuant;

      const updatedInventory = { quantity, sold, ...rest };
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

    // Restock Items
    app.post("/restock", async (req, res) => {
      const inventory = req.body;
      let { quantity, sold, ...rest } = inventory;

      const restockQuant = req.query.restockQuantity;
      const newQuantity = parseInt(quantity) + parseInt(restockQuant);
      quantity = newQuantity;

      const updatedInventory = { quantity, sold, ...rest };
      const query = { _id: ObjectId(inventory._id) };
      const updateDoc = {
        $set: {
          quantity: newQuantity,
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

    // Delete inventory
    app.delete("/deleteInventory", async (req, res) => {
      const id = req?.query?.id;
      const query = { _id: ObjectId(id) };
      const result = await inventoryCollection.deleteOne(query);
      res.send(result);
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
