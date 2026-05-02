"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function ChangePasswordPage() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [show, setShow] = useState({ old: false, new: false, confirm: false });
  const router = useRouter();

  const toggle = (field) => setShow((prev) => ({ ...prev, [field]: !prev[field] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Les mots de passe ne correspondent pas");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5001/api/users/change-password",
        { oldPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Mot de passe changé avec succès");
      router.push("/login");
    } catch (err) {
      alert(err.response?.data?.message || "Erreur serveur");
    }
  };

  const PasswordField = ({ placeholder, value, onChange, field }) => (
    <div className="relative">
      <input
        type={show[field] ? "text" : "password"}
        placeholder={placeholder}
        className="w-full border p-2 pr-10 rounded"
        value={value}
        onChange={onChange}
        required
      />
      <button
        type="button"
        onClick={() => toggle(field)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-600 transition-colors"
      >
        {show[field] ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow w-96 space-y-3">
        <h1 className="text-lg font-bold">Changer mot de passe</h1>

        <PasswordField
          placeholder="Ancien mot de passe"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          field="old"
        />
        <PasswordField
          placeholder="Nouveau mot de passe"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          field="new"
        />
        <PasswordField
          placeholder="Confirmer mot de passe"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          field="confirm"
        />

        <button className="w-full bg-green-600 hover:bg-green-700 text-white p-2 rounded transition-colors">
          Valider
        </button>
      </form>
    </div>
  );
}