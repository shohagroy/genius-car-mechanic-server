const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");

const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// DB connect
const uri = process.env.URI;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// token verify functuin
const verifyTOken = (req, res, next) => {
  const bearerToken = req.headers.authorazitation;

  if (!bearerToken) {
    return res.status(401).sent({ message: "unauthorazin access" });
  } else {
    const token = bearerToken.split(" ")[1];
    jwt.verify(token, process.env.JWT_ACCESS_TOKEN, (err, decoded) => {
      if (err) {
        return res.status(401).sent({ message: "unauthorazin access" });
      }
      req.decoded = decoded;
    });
  }

  next();
};

const run = async () => {
  try {
    app.post("/jwt", (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.JWT_ACCESS_TOKEN, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    const serviceCollection = client.db("genius_car").collection("services");
    app.get("/services", async (req, res) => {
      const query = {};
      const curser = serviceCollection.find(query);
      const result = await curser.toArray();
      res.send(result);
    });

    app.get("/service/:id", async (req, res) => {
      const id = req.params;

      const query = { _id: ObjectId(id) };
      const curser = serviceCollection.find(query);
      const result = await curser.toArray();
      res.send(result);
    });

    const orderCollection = client.db("genius_car").collection("user_orders");
    app.post("/orders", async (req, res) => {
      const orderDetiles = req.body;

      const result = await orderCollection.insertOne(orderDetiles);

      res.send(result);
    });

    app.get("/orders", verifyTOken, async (req, res) => {
      const userEmail = req.query.email;

      const decoded = req.decoded;

      if (decoded.email !== userEmail) {
        return res.status(403).send({ massage: "unauthorazid access" });
      }

      const query = { email: userEmail };
      const curser = orderCollection.find(query);
      const result = await curser.toArray();
      res.send(result);
    });

    app.delete("/deleted", async (req, res) => {
      const id = req.query.id;

      const query = { _id: ObjectId(id) };
      const result = await orderCollection.deleteOne(query);

      if (result.deletedCount === 1) {
        res.send(result);
      }
    });
  } finally {
  }
};

run().catch((err) => console.error(err));

app.get("/", (req, res) => {
  res.send("Hello from server. server is running");
});

app.listen(port, () => {
  console.log(`server is running from port: ${port}`);
});
