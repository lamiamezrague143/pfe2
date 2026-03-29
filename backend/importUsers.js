const csv = require("csv-parser");
const fs = require("fs");
const User = require("./models/User");

let compteur = 1;

fs.createReadStream("users.csv")
  .pipe(csv({ separator: ';' }))
  .on("data", async (row) => {
    try {
      // conversion date DD/MM/YYYY -> YYYY-MM-DD
      const [jour, mois, annee] = row["Date de naissance"].split('/');
      const dateISO = `${annee}-${mois}-${jour}`;

      await User.create({
        numero: row.numero?.trim() || `auto-${compteur++}`,
        nomComplet: row.Nom.trim(),
        prenomComplet: row["Prénom"].trim(),
        dateNaissance: dateISO,
        lieuNaissance: row["lieu Naissance"].trim(),
        positionAdministrative: row.position.trim(),
        sexe: "Homme",
        email: `test${compteur}@test.com`,
        password: "123456",
        departement: "Informatique",
        photo: "default.jpg",
         ayantDroits: ["lecture", "écriture", "suppression"], // <-- ici le JSON
      });

      
    } catch (err) {
      console.error(
        "Erreur :");
    }
  })
  .on("end", () => {
    console.log("Import terminé ✅");
  });