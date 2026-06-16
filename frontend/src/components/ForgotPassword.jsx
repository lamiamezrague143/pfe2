"use client";
import { useState } from 'react';
import axios from 'axios';

const STEPS = { EMAIL: 1, OTP: 2, NEW_PASSWORD: 3, SUCCESS: 4 };

export default function ForgotPassword({ onClose }) {
  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    setError(''); setLoading(true);
    try {
      await axios.post('http://localhost:5001/api/auth/forgot-password', { email });
      setStep(STEPS.OTP);
    } catch (e) {
      setError(e.response?.data?.message || "Erreur lors de l'envoi.");
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    setError(''); setLoading(true);
    try {
      await axios.post('http://localhost:5001/api/auth/verify-otp', { email, otp });
      setStep(STEPS.NEW_PASSWORD);
    } catch (e) {
      setError(e.response?.data?.message || 'Code invalide ou expiré.');
    } finally { setLoading(false); }
  };

  const handleResetPassword = async () => {
    if (newPassword !== confirm) return setError('Les mots de passe ne correspondent pas.');
    setError(''); setLoading(true);
    try {
      await axios.post('http://localhost:5001/api/auth/reset-password', { email, otp, newPassword });
      setStep(STEPS.SUCCESS);
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur lors de la réinitialisation.');
    } finally { setLoading(false); }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl w-full">

      {/* ── ÉTAPE 1 : Email ── */}
      {step === STEPS.EMAIL && (
        <>
          <h2 className="text-2xl font-bold text-emerald-700 mb-2">Mot de passe oublié</h2>
          <p className="text-gray-500 text-sm mb-6">
            Entrez votre email pour recevoir un code OTP.
          </p>
          <input
            type="email"
            placeholder="nom.prenom@ummto.dz"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border-b-2 border-slate-100 focus:border-emerald-500 outline-none py-2.5 text-sm text-slate-700 bg-transparent transition-all placeholder:text-slate-300 mb-6"
          />
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <button
            onClick={handleSendOtp}
            disabled={loading}
            className="w-full py-3 rounded-xl text-white text-xs font-bold tracking-widest uppercase bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 hover:opacity-95 transition-all disabled:opacity-60"
          >
            {loading ? 'Envoi en cours...' : 'Envoyer le code OTP'}
          </button>
        </>
      )}

      {/* ── ÉTAPE 2 : OTP ── */}
      {step === STEPS.OTP && (
        <>
          <h2 className="text-2xl font-bold text-emerald-700 mb-2">Vérification OTP</h2>
          <p className="text-gray-500 text-sm mb-6">
            Un code à 6 chiffres a été envoyé à <strong>{email}</strong>. Valable 5 minutes.
          </p>
          <input
            type="text"
            placeholder="_ _ _ _ _ _"
            maxLength={6}
            value={otp}
            onChange={e => setOtp(e.target.value)}
            className="w-full border-b-2 border-slate-100 focus:border-emerald-500 outline-none py-2.5 text-center tracking-[0.5em] text-2xl font-bold text-slate-700 bg-transparent transition-all placeholder:text-slate-200 mb-6"
          />
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <button
            onClick={handleVerifyOtp}
            disabled={loading}
            className="w-full py-3 rounded-xl text-white text-xs font-bold tracking-widest uppercase bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 hover:opacity-95 transition-all disabled:opacity-60"
          >
            {loading ? 'Vérification...' : 'Vérifier le code'}
          </button>
          <button
            onClick={() => { setStep(STEPS.EMAIL); setOtp(''); setError(''); }}
            className="w-full mt-3 text-slate-400 text-xs hover:text-emerald-600 transition-colors"
          >
            ← Changer d'email
          </button>
        </>
      )}

      {/* ── ÉTAPE 3 : Nouveau mot de passe ── */}
      {step === STEPS.NEW_PASSWORD && (
        <>
          <h2 className="text-2xl font-bold text-emerald-700 mb-2">Nouveau mot de passe</h2>
          <p className="text-gray-500 text-sm mb-6">Choisissez un nouveau mot de passe sécurisé.</p>
          <input
            type="password"
            placeholder="Nouveau mot de passe"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            className="w-full border-b-2 border-slate-100 focus:border-emerald-500 outline-none py-2.5 text-sm text-slate-700 bg-transparent transition-all placeholder:text-slate-300 mb-4"
          />
          <input
            type="password"
            placeholder="Confirmer le mot de passe"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            className="w-full border-b-2 border-slate-100 focus:border-emerald-500 outline-none py-2.5 text-sm text-slate-700 bg-transparent transition-all placeholder:text-slate-300 mb-6"
          />
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <button
            onClick={handleResetPassword}
            disabled={loading}
            className="w-full py-3 rounded-xl text-white text-xs font-bold tracking-widest uppercase bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 hover:opacity-95 transition-all disabled:opacity-60"
          >
            {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
          </button>
        </>
      )}

      {/* ── ÉTAPE 4 : Succès ── */}
      {step === STEPS.SUCCESS && (
        <div className="text-center py-4">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-emerald-700 mb-2">Mot de passe mis à jour !</h2>
          <p className="text-gray-500 text-sm mb-8">
            Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
          </p>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl text-white text-xs font-bold tracking-widest uppercase bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 hover:opacity-95 transition-all"
          >
            Retour à la connexion
          </button>
        </div>
      )}

    </div>
  );
}