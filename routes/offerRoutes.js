const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;

// Middleware pour vérifier que le token envoyé correspond à un utilisateur enregistré en BDD
const isAuthenticated = require("../middleware/isAuthenticated");

// Middleware pour filtrer les annonces à afficher suivant les requettes du client
const offersFilter = require("../middleware/offersFilter");

// Middleware pour récupérer les infos envoyées par le client (texte et image) via form-data
const fileUpload = require("express-fileupload");

// Fonction pour convertir le buffer de l'image envoyée par la client en base64 pour envoi à Cloudinary
const convertToBase64 = require("../utils/convertToBase64");

// Import des models
const Offer = require("../models/Offer");

// Route pour publier une nouvelle offre
router.post(
  "/offers/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      // J'enregistre l'utilisateur authentifié
      const owner = req.authUser;

      // Upload de l'image envoyée par le client sur cloudinary (retourne un objet contenant les clés relatives à l'image)
      const productImage = await cloudinary.uploader.upload(
        convertToBase64(req.files.picture)
      );

      // Destructuration de l'objet req.body
      const { title, description, price, brand, size, condition, color, city } =
        req.body;

      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          { brand: brand },
          { size: size },
          { condition: condition },
          { color: color },
          { city: city },
        ],
        product_owner: owner,
        product_image: {
          secure_url: productImage.secure_url, // Enregistrer tout l'objet dans l'offre <<<<<
        },
      });

      await newOffer.save();
      res.json(newOffer);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
);

// Route pour modifier une annonce
router.put(
  "/offers/update/:id",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      // Variable ayant pour valeur l'offre passé passée en paramètres par le client (objet)
      const offer = await Offer.findById(req.params.id);

      const authUserId = req.authUser._id.toString(); // ID de l'utilisateur
      const offerUserId = offer.product_owner.toString(); // ID de l'auteur de l'annonce

      // Si l'utilisateur authentifié est celui qui a posté l'annonce passée en paramètres
      if (authUserId === offerUserId) {
        // Variable ayant pour valeur un tableau contenant les clés passées dans le body par le client
        const queryKeys = Object.keys(req.body);

        // Boucle sur le tableau des clés passées par le client
        for (let i = 0; i < queryKeys.length; i++) {
          // Variable contenant la clé à changer pour chaque tour de boucle (clé dynamique)
          const keyToUpdate = queryKeys[i];
          // J'assigne chaque clé passée en paramètres à la clé correspondante dans l'objet offer
          if (keyToUpdate === "product_price") {
            // S'il s'agit du prix, je le transforme en Number
            offer[keyToUpdate] = Number(req.body[keyToUpdate]);
          } else if (
            // S'il s'agit d'un élément du tableau product_details
            keyToUpdate === "brand" ||
            keyToUpdate === "size" ||
            keyToUpdate === "condition" ||
            keyToUpdate === "color" ||
            keyToUpdate === "city"
          ) {
            // Boucle sur le tableau product_details
            for (let i = 0; i < offer.product_details.length; i++) {
              // Clé dynamique sur le tableau pour chaque tour de boucle
              const productDetailsKey = Object.keys(
                offer.product_details[i]
              )[0];
              // Si la clé correspond à la clé passée par le client
              if (productDetailsKey === keyToUpdate) {
                // Assignation de la nouvelle valeur
                offer.product_details[i][keyToUpdate] = req.body[keyToUpdate];
              }
            }
          } else {
            offer[keyToUpdate] = req.body[keyToUpdate];
          }
        }
        // Sauvegarde de l'offre en BDD
        await offer.save();
        // Réponse au client : offre mise à jour
        res.json(offer);
      } else {
        // Message d'erreur si l'utilisateur n'est pas l'auteur de l'offre
        res.status(401).json({ message: "You are not this offer's owner." });
      }
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
);

// Route pour consulter les annonces
router.get("/offers", offersFilter, async (req, res) => {
  try {
    // Utilisation de req.filterValue pour associer les valeurs passées par le client à l'objet filter qui sera passé dans le find
    const filter = {
      product_name: new RegExp(req.filterValues.title, "i"), // Passage de la valeur du titre en RegExp
      product_price: {
        $lte: req.filterValues.priceMax,
        $gte: req.filterValues.priceMin,
      },
    };

    const allOffers = await Offer.find(filter)
      .populate("product_owner", "account")
      .sort(req.filterValues.sort) // Utilisation de req.filterValues pour définir les paramètres sort
      .limit(req.filterValues.page.limitValue) // Utilisation de req.filterValues pour définir les paramètres limit
      .skip(req.filterValues.page.skipValue); // Utilisation de req.filterValues pour définir les paramètres skip

    const offersCount = await Offer.countDocuments(filter);

    res.json({
      count: offersCount,
      offers: allOffers,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Route pour obtenir les détails d'une annonce
router.get("/offers/:id", async (req, res) => {
  try {
    const offerToShow = await Offer.findById(req.params.id).populate(
      "product_owner",
      "account"
    );
    res.json(offerToShow);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
