const express = require("express");

// Imports des packages pour gérer le mot de passe
const uid2 = require("uid2"); // Permet la création d'une string aléatoire (pour le salt et le token)
const SHA256 = require("crypto-js/sha256"); // Permet de créer un hash (sur la base du password entré par le client)
const encBase64 = require("crypto-js/enc-base64"); // Permet de transformer en string le hash généré

// Import du router
const router = express.Router();

// Import du model User
const User = require("../models/User");

// Route pour s'inscire en tant que nouvel utilisateur
router.post("/user/signup", async (req, res) => {
  try {
    // Variables pour le cryptage du mot de passe
    const userToken = uid2(64);
    const userSalt = uid2(16);
    const userHash = SHA256(req.body.password + userSalt).toString(encBase64);

    // Si l'utilisateur n'a pas renseigné d'username
    if (!req.body.username) {
      return res.status(400).json({ message: "Please indicate an username." });
    }

    // Si l'email existe déjà dans la BBD
    const emailCheck = await User.findOne({ email: req.body.email }); // Variable pour trouver l'utilsateur dans la BDD suivant l'email renseigné par l'utilisateur (retourne un tableau ayant comme élément l'objet User correspondant s'il existe en BDD)
    if (emailCheck) {
      return res.status(409).json({ message: "This email is already taken." });
    }

    // Création de l'utilisateur suivant les informations communiquées dans le body
    const newUser = new User({
      account: {
        userName: req.body.username,
      },
      email: req.body.email,
      newsletter: req.body.newsletter,
      token: userToken, // Généré aléatoirement 64 caractères
      salt: userSalt, // Généré alétoirement 16 caractères
      hash: userHash, // MDP encrypté : MDP renseigné par l'utilisateur concatené avec le salt
    });

    // Sauvegarde de l'utilisateur en BDD
    await newUser.save();

    // Réponse au client > A CHANGER POUR UN RESPONSE OBJECT <<<<<
    const responseObj = {
      _id: newUser["_id"],
      token: newUser.token,
      account: {
        userName: newUser.account.userName,
      },
    };
    return res.json(responseObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route pour se connecter en tant qu'utilisateur existant
router.post("/user/login", async (req, res) => {
  try {
    // Variable permettant de retrouver l'utilisateur en BDD grâce à l'email qu'il a renseigné
    const user = await User.findOne({ email: req.body.email }); // Renvoi un tableau contenant un objet correspondant à l'utilisateur associé à l'email renseigné par l'utilisateur

    // VALIDATION DE L'EMAIL
    // Si l'utilisateur n'est pas enregistré dans la BDD
    if (!user) {
      return res
        .status(400)
        .json({ message: "This email does not belong to any user." });
    }

    // VALIDATION DU MOT DE PASSE
    // Variable permettant de comparer le mot de passe renseigné par l'utilisateur avec les informations stockées en BDD
    const passwordValidator = SHA256(req.body.password + user.salt).toString(
      encBase64
    );
    // Si le mot de passe saisi ne correspond pas au hash enregistré en BDD pour l'utilisateur
    if (passwordValidator !== user.hash) {
      return res.status(400).json({ message: "Wrong password." });
    }

    // Réponse au client
    const responseObj = {
      _id: user["_id"],
      token: user.token,
      account: {
        userName: user.account.userName,
      },
    };
    res.json(responseObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
