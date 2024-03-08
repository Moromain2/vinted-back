const offersFilter = (req, res, next) => {
  // Objet contenant toutes les queries passées par le client
  const clientQueries = req.query;
  // Tableau contenant les clés des queries passées par le client
  const queryKeys = Object.keys(clientQueries);

  // Variable définissant le nombre de produits à afficher sur chaque page
  const productsPerPage = 4;
  // Objet filtre par défaut intégrant les paramètres prévus
  const filterValues = {
    title: "",
    priceMin: 0,
    priceMax: 99999999,
    page: {
      // Valeurs par défaut pour forcer l'affichage de la première page si aucune query n'est envoyée par le client
      limitValue: productsPerPage,
      skipValue: 0,
    },
  };

  // Boucle sur le tableau des clés renseignées par le client
  for (let i = 0; i < queryKeys.length; i++) {
    // Création d'une variable ayant pour valeur les clés passées par le client
    let keyToAdd = queryKeys[i];
    // Chaque clé passée par le client est ajoutée à l'objet filtre : elle remplace la clé par défaut ou est ajoutée s'il s'agit d'un clé faisant varier l'affichage (sort ou page)
    if (keyToAdd === "sort") {
      // S'il s'agit de la clé sort, elle est ajoutée selon la valeur renseignée par le client
      if (clientQueries[keyToAdd] === "price-desc") {
        filterValues.sort = { product_price: "desc" };
      } else if (clientQueries[keyToAdd] === "price-asc") {
        filterValues.sort = { product_price: "asc" };
      }
    } else if (keyToAdd === "page") {
      // S'il sagit d'une clé page, elle modifie la valeur skip
      filterValues.page = {
        limitValue: productsPerPage,
        skipValue: productsPerPage * (clientQueries[keyToAdd] - 1),
      };
    } else {
      filterValues[keyToAdd] = clientQueries[keyToAdd];
    }
  }
  // L'objet filter est rendu accessible globalement via req.filter
  req.filterValues = filterValues;
  next();
};

module.exports = offersFilter;
