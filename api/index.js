const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");

const app = express();

app.use(cors());
app.use(express.json());

app.use(cors({
  origin: "http://localhost:3001", // Allow frontend
  methods: ["GET", "POST"],
  credentials: true, // Optional: if cookies are required
}));

// Connection string
const MONGO_URI = "mongodb+srv://bindhu:123@cluster0.ufgq0.mongodb.net/passkey?retryWrites=true&w=majority&appName=Cluster0";

// Connect to MongoDB Atlas
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB Atlas");
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB Atlas:", error);
  });

// Define the Credential schema (if not already created)
const credentialSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true,
  },
  pass: {
    type: String,
    required: true,
  },
});

// Define the model
const Credential = mongoose.model("Credential", credentialSchema, "bulkmail");

// Email sending route
app.post("/sendmail", async (req, res) => {
  try {
    const msg = req.body.msg;
    const emailList = req.body.emailList;

    // Fetch credentials from the MongoDB collection
    const credentials = await Credential.find();

    // Log the credentials to inspect their structure
    console.log('Credentials:', credentials);

    // Ensure there's at least one credential document
    if (credentials.length === 0) {
      return res.status(400).send("No credentials found in the database");
    }

    // Extract user and pass from the first document in the array
    const user = credentials[0].user;  // Access user from the first document (index 0)
    const pass = credentials[0].pass;  // Access pass from the first document (index 0)

    // Log the user and pass to verify
    console.log('User:', user);
    console.log('Pass:', pass);

    // Create transporter with correct credentials
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: user,   // Correct email address
        pass: pass,   // Correct app password
      },
      secure: true, // Use secure connection
    });

    // Loop through the email list and send the email
    for (const email of emailList) {
      await transporter.sendMail({
        from: user, // Sender's email address
        to: email,  // Receiver's email address
        subject: "Building a Bulkmail App",
        text: msg,   // Message content
      });
      console.log("Email sent to:", email);
    }

    res.status(200).send(true); // Response on success
  } catch (error) {
    console.error("Error in /sendmail route:", error);
    res.status(500).send(false); // Response on failure
  }
});

// Export the app for serverless functions or start the server locally
if (process.env.NODE_ENV !== "production") {
  const PORT = 5000;
  app.listen(PORT, () => {
    console.log(`Server running locally on http://localhost:${PORT}`);
  });
}

module.exports = app;
