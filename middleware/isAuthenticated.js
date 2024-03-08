// Fonction permettant de valider que l'utilisateur est bien présent en BDD suivant le Bearer Token envoyé via Postman

const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  // Je récupère le token envoyé via le client (Postman > Authorozation > Bearer Token)
  const tokenSent = req.headers.authorization;
  // Si la valeur du token est falsy je stoppe la fonction
  if (!tokenSent) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  // Je trouve dans ma BDD l'utilisateur associé au token envoyé
  const authUser = await User.findOne({
    token: tokenSent.replace("Bearer ", ""), // Je supprime "Bearer " pour ne garder que la valeur du token
  }).select("account"); // Permet de ne garder que les informations account de l'objet User
  // Si aucun utilisateur n'est associé au token, je stoppe la fonction
  if (!authUser) {
    return res.status(401).json({ message: "Unauthorized" });
  } else {
    // Je rend accessible l'objet authUser
    req.authUser = authUser;
    next();
  }
};

module.exports = isAuthenticated;
