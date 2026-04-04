"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import FileUploadZone from "./FileUploadZone";

const API_BASE = "http://localhost:5001/api";

export default function DemandeForm() {
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [sexe, setSexe] = useState("");
  const [telephone, setTelephone] = useState("");
  const [dateNaiss, setDateNaiss] = useState("");
  const [fonction, setFonction] = useState("");
  const [prestation, setPrestation] = useState("");
  const [fichiers, setFichiers] = useState([]);

  const [captchaSvg, setCaptchaSvg] = useState("");
  const [userCaptcha, setUserCaptcha] = useState("");

  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitMsg, setSubmitMsg] = useState({ text: "", type: "" });

  // 🔄 captcha
const refreshCaptcha = async () => {
  try {
    const res = await fetch(`${API_BASE}/captcha`, {
      method: "GET",
      headers: {
        "Content-Type": "text/html",
      },
    });

    if (!res.ok) {
      throw new Error("Erreur captcha");
    }

    const text = await res.text();
    setCaptchaSvg(text);
  } catch (err) {
    console.error("Captcha error:", err);
  }
};
  useEffect(() => {
    refreshCaptcha();
  }, []);

  // 🔄 reset
  const resetForm = () => {
    setPrenom("");
    setNom("");
    setSexe("");
    setTelephone("");
    setDateNaiss("");
    setFonction("");
    setPrestation("");
    setFichiers([]);
    setUserCaptcha("");
    setSubmitMsg({ text: "", type: "" });
  };

  // 📤 submit
  const handleSubmit = async () => {
    if (!prenom || !nom || !prestation || fichiers.length === 0) {
      setSubmitMsg({
        text: "⚠️ Remplis les champs obligatoires",
        type: "error",
      });
      return;
    }

    setSubmitLoading(true);

    const fd = new FormData();
    fd.append("nom_beneficiaire", `${prenom} ${nom}`);
    fd.append("type_prestation", prestation);
    fd.append("fonction", fonction);
    fd.append("sexe", sexe);
    fd.append("telephone", telephone);
    fd.append("date_naissance", dateNaiss);
    fd.append("captcha", userCaptcha);

    fichiers.forEach((f) => fd.append("ordonnance", f));

    try {
      await axios.post(`${API_BASE}/demandes/ajouter`, fd);

      setSubmitMsg({
        text: "✅ Envoyé avec succès",
        type: "success",
      });

      resetForm();
      refreshCaptcha();
    } catch (err) {
      setSubmitMsg({
        text: err.response?.data?.message || "Erreur",
        type: "error",
      });
      refreshCaptcha();
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow border">
      <h2 className="text-lg font-bold mb-4">Nouvelle demande</h2>

      <div className="space-y-3">
        <input
          placeholder="Prénom"
          value={prenom}
          onChange={(e) => setPrenom(e.target.value)}
          className="border p-2 w-full"
        />

        <input
          placeholder="Nom"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          className="border p-2 w-full"
        />

        <select
          value={sexe}
          onChange={(e) => setSexe(e.target.value)}
          className="border p-2 w-full"
        >
          <option value="">Sexe</option>
          <option>Masculin</option>
          <option>Féminin</option>
        </select>

        <input
          placeholder="Téléphone"
          value={telephone}
          onChange={(e) => setTelephone(e.target.value)}
          className="border p-2 w-full"
        />

        <input
          type="date"
          value={dateNaiss}
          onChange={(e) => setDateNaiss(e.target.value)}
          className="border p-2 w-full"
        />

        <select
          value={fonction}
          onChange={(e) => setFonction(e.target.value)}
          className="border p-2 w-full"
        >
          <option value="">Fonction</option>
          <option>ATS</option>
          <option>ENSEIGNANT</option>
          <option>RETRAITE</option>
        </select>

        <select
          value={prestation}
          onChange={(e) => setPrestation(e.target.value)}
          className="border p-2 w-full"
        >
          <option value="">Prestation</option>
          <option>Radiologie</option>
          <option>Analyses</option>
        </select>

        {/* 📎 Upload */}
        <FileUploadZone files={fichiers} onChange={setFichiers} />

        {/* 🔐 captcha */}
        <div>
          <div
            dangerouslySetInnerHTML={{ __html: captchaSvg }}
            onClick={refreshCaptcha}
          />
          <input
            placeholder="Captcha"
            value={userCaptcha}
            onChange={(e) => setUserCaptcha(e.target.value)}
            className="border p-2 w-full mt-2"
          />
        </div>

        {/* message */}
        {submitMsg.text && (
          <p className={submitMsg.type === "error" ? "text-red-500" : "text-green-600"}>
            {submitMsg.text}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitLoading}
          className="bg-green-700 text-white px-4 py-2 rounded"
        >
          {submitLoading ? "Envoi..." : "Envoyer"}
        </button>
      </div>
    </div>
  );
}