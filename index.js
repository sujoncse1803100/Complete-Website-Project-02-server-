const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");
const fileUpload = require("express-fileupload");
require("dotenv").config();
const ObjectId = require("mongodb").ObjectId;

const app = express();
const port = 3001;
const PORT = process.env.PORT;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(fileUpload());

app.get("/", (req, res) => {
  res.send("Welcome to creative agency server");
  console.log("server started");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ifk56.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

try {
  client.connect((err) => {
    console.log("Database connected");

    const orderCollection = client
      .db(`${process.env.DB_NAME}`)
      .collection(`${process.env.DB_ORDER_COLLECTION}`);

    const adminCollection = client
      .db(`${process.env.DB_NAME}`)
      .collection(`${process.env.DB_ADMIN_COLLECTION}`);

    const reviewCollection = client
      .db(`${process.env.DB_NAME}`)
      .collection(`${process.env.DB_REVIEW_COLLECTION}`);

    const serviceCollection = client
      .db(`${process.env.DB_NAME}`)
      .collection(`${process.env.DB_SERVICE_COLLECTION}`);

    app.post("/addService", (req, res) => {
      const file = req.files.file;
      const title = req.body.title;
      const description = req.body.desc;

      const newImage = file.data;
      const encodedImage = newImage.toString("base64");

      const service = {
        title: title,
        desc: description,
        image: encodedImage,
      };

      serviceCollection.insertOne(service).then((result) => {
        if (result) {
          res.send(result.acknowledged);
        }
      });
    });

    app.get("/service", (req, res) => {
      serviceCollection.find({}).toArray((err, result) => {
        res.send(result);
      });
    });

    app.post("/makeAdmin", (req, res) => {
      const email = req.body.email;

      adminCollection.insertOne({ email: email }).then((result) => {
        res.send(result.acknowledged);
      });
    });

    app.post("/isAdmin", (req, res) => {
      const email = req.body.email;
      adminCollection.find({ email: email }).toArray((err, result) => {
        res.send(result.length > 0);
      });
    });

    app.post("/createOrder", (req, res) => {
      const data = req.body;
      const newImage = req.files.file.data;
      const encodedImage = newImage.toString("base64");

      const status = {
        selectedStatus: data.selectedStatus,
        secondStatus: data.secondStatus,
        thirdStatus: data.thirdStatus,
      };

      const order = {
        name: data.name,
        email: data.email,
        orderName: data.orderName,
        projectDetails: data.projectDetails,
        price: data.price,
        status: status,
        statusColor: data.statusColor,
        image: encodedImage,
      };

      orderCollection.insertOne(order).then((result) => {
        if (result) {
          res.send(result.acknowledged);
        }
      });
    });

    app.get("/orders", (req, res) => {
      orderCollection.find({}).toArray((err, documents) => {
        res.send(documents);
      });
    });

    app.patch("/updateStatus/:_id", (req, res) => {
      const status = {
        selectedStatus: req.body.selectedStatus,
        secondStatus: req.body.secondStatus,
        thirdStatus: req.body.thirdStatus,
      };
      const statusColor = req.body.dropdownColor;

      if (status && statusColor) {
        orderCollection.updateOne({ _id: ObjectId(req.params._id) },{
              $set: {
                status: status,
                statusColor: statusColor
              },
            }
          )
          .then((result) => {
            res.send(result.modifiedCount > 0);
          });
      }
    });

    app.post('/particularUserOrderList',(req,res)=>{
      orderCollection.find({email: req.body.email})
        .toArray((err,documents)=>{
            res.send(documents)
        });

    });


    app.post('/addReview',(req,res)=>{
      const reviewData = {
        name : req.body.name,
        orderName : req.body.orderName,
        photoURL : req.body.photoURL,
        description : req.body.description,
      };

      reviewCollection.insertOne(reviewData)
      .then(result =>{
        res.send(result.acknowledged);
      })
    });

    app.get("/review", (req, res) => {
      reviewCollection.find({}).toArray((err, documents) => {
        res.send(documents);
      });
    });



    //...terminal point db connection....
  });
} catch (err) {
  console.log("Database Connection Error : ", err);
}

app.listen(PORT || port);
