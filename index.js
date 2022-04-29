const express = require("express");
const cors = require("cors");
require("dotenv").config;
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require("mongodb");

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
client.connect((err) => {
  const collection = client.db("test").collection("devices");
  console.log("Db Connected");
  // perform actions on the collection object
  client.close();
});

app.get("/", (req, res) => {
  res.send("SPEEDO Initiated");
});

app.listen(port, () => {
  console.log("Responding to", port);
});
