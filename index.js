const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const port = 5000;
require("dotenv").config();
const fileUpload = require("express-fileupload");

const MongoClient = require("mongodb").MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wascw.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("doctors"));
app.use(fileUpload());

const client = new MongoClient(uri, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
});

app.get("/", (req, res) => {
  res.send("connect express");
});

client.connect((err) => {
  const appointmentCollection = client
    .db(`${process.env.DB_NAME}`)
    .collection("appointments");
  const doctorCollection = client
    .db(`${process.env.DB_NAME}`)
    .collection("doctors");

  //post appointment from appointment-form
  app.post("/appointment", (req, res) => {
    const appointment = req.body;
    appointmentCollection.insertOne(appointment).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });
  //appointment filter by date from dashboard
  app.post("/appointmentByDate", (req, res) => {
    const date = req.body.date;
    const email = req.body.email;
    doctorCollection.find({ email: email }).toArray((err, doctors) => {
      const filter = { date };
      if (doctors.length === 0) {
        filter.email = email;
      }
      appointmentCollection.find(filter).toArray((err, documents) => {
        res.send(documents);
      });
    });
  });
  //appointment filter by specific patient
  app.post("/patientAppointment", (req, res) => {
    const email = req.body.email;
    appointmentCollection.find({ email }).toArray((err, documents) => {
      res.send(documents);
    });
  });

  //post add Doctor from dashboard
  app.post("/addDoctor", (req, res) => {
    const file = req.files.file;
    const name = req.body.name;
    const email = req.body.email;
    const newImg = file.data;
    const encImg = newImg.toString("base64");
    const image = {
      ContentType: file.mimeType,
      size: file.size,
      img: Buffer.from(encImg, "base64"),
    };
    doctorCollection.insertOne({ name, email, img: image }).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });
  //get all appointment for dashboard all-appointment
  app.get("/allAppointment", (req, res) => {
    appointmentCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });
  //get all doctor for home-page doctor
  app.get("/doctor", (req, res) => {
    doctorCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });
  //get doctor/admin filter by email
  app.get("/isDoctor", (req, res) => {
    doctorCollection
      .find({ email: req.query.email })
      .toArray((err, documents) => {
        res.send(documents.length > 0);
      });
  });
});

app.listen(process.env.PORT || port);
