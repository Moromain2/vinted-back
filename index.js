// Activer les variables d'environnement
require("dotenv").config();

// Import des packages
const express = require("express"); // Serveur
const mongoose = require("mongoose"); // Base de donnée
const cloudinary = require("cloudinary").v2; // Cloudinary
const cors = require("cors");

// Connexion à la BDD
mongoose.connect(process.env.MONGODB_URI);

// Création du serveur
const app = express();

// Permet d'autoriser ou non les demandes provenant de l'extérieur
app.use(cors());

// Permettre au serveur de récupérer éléments depuis le body
app.use(express.json());

// Configuartion de cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Import des routes
const userRoutes = require("./routes/userRoutes");
app.use(userRoutes);
const offerRoutes = require("./routes/offerRoutes");
app.use(offerRoutes);

app.get("/", (req, res) => {
  res.json("Bienvenue sur la réplique de Vinted");
});

// Route 404
app.all("*", (req, res) => {
  res.status(404).json({ message: "This route is not defined." });
});

// Écoute sur le port 3000
app.listen(process.env.PORT, () => {
  console.log("Server running.");
});
