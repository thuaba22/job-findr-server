const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.unqmcva.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const jobCollection = client.db("jobDB").collection("jobs");
    const applyJobsCollection = client.db("jobDB").collection("applyJobs");
    app.get("/jobs", async (req, res) => {
      const cursor = jobCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id),
      };

      const result = await jobCollection.findOne(query);
      res.send(result);
    });

    app.get("/jobs/byUser/:userName", async (req, res) => {
      const userName = req.params.userName;
      const query = {
        name: userName,
      };

      const cursor = jobCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/jobs/appliedJobs/:userEmail", async (req, res) => {
      const userEmail = req.params.userEmail;
      const cursor = applyJobsCollection.find({ user: userEmail });
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/jobs", async (req, res) => {
      const newJobs = req.body;
      const result = await jobCollection.insertOne(newJobs);
      res.send(result);
    });
    app.post("/jobs/appliedJobs", async (req, res) => {
      const appliedJob = req.body;

      const result = await applyJobsCollection.insertOne(appliedJob);

      // Update the applicant count for the specific job being applied to
      // const updatedApplicant = await jobCollection.updateOne(
      //   { _id: jobId }, // Assuming you have a jobId field in appliedJob
      //   { $inc: { applicants: 1 } }
      // );
      // console.log(updatedApplicant);
      res.send(result);
    });

    app.put("/jobs/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };

        const updatedJobs = req.body;
        console.log(updatedJobs);
        delete updatedJobs["_id"];

        const result = await jobCollection.updateOne(
          query,
          {
            $set: { ...updatedJobs },
          },
          { upsert: true }
        );
        console.log(result);
        if (result.modifiedCount === 1) {
          // Product updated successfully
          res.status(200).json({ message: "Product updated successfully" });
        } else {
          // No product was updated (ID not found)
          res.status(404).json({ message: "Product not found" });
        }
      } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("job finder is running");
});

app.listen(port, () => {
  console.log(`Job Finder server is running on port ${port}`);
});
