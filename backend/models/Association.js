const Clinique = require("./Clinique");
const PrixPrestations = require("./PrixPrestations");

Clinique.hasMany(PrixPrestations, {
  foreignKey: "cliniqueId",
});

PrixPrestations.belongsTo(Clinique, {
  foreignKey: "cliniqueId",
});

