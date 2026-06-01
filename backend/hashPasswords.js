const bcrypt = require("bcryptjs");
const { User } = require("./models"); // adapte le chemin

async function hashPasswords() {
  try {
    const users = await User.findAll();

    for (const user of users) {
      // ignorer ceux déjà hashés
      if (!user.password.startsWith("$2")) {
        const hashedPassword = await bcrypt.hash(user.password, 10);

        user.password = hashedPassword;

        await user.save();

        console.log(`Utilisateur ${user.id} mis à jour`);
      }
    }

    console.log("Tous les mots de passe ont été hashés");
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

hashPasswords();