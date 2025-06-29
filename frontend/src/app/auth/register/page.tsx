'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Music, Mail, Lock, User, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const { register, loginWithSpotify, loginWithDeezer } = useAuth();
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (!acceptTerms) {
      toast.error('Veuillez accepter les conditions d\'utilisation');
      return;
    }

    setIsLoading(true);

    try {
      await register(formData.email, formData.password, formData.displayName);
      toast.success('Compte créé avec succès !');
      router.push('/');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la création du compte');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpotifyLogin = async () => {
    try {
      await loginWithSpotify();
    } catch (error: any) {
      toast.error(error.message || 'Erreur de connexion Spotify');
    }
  };

  const handleDeezerLogin = async () => {
    try {
      await loginWithDeezer();
    } catch (error: any) {
      toast.error(error.message || 'Erreur de connexion Deezer');
    }
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const strengthLabels = ['Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort'];
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-green-600'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-xl border border-secondary-200 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-accent-600 to-accent-700 p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
              className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4"
            >
              <Music className="w-8 h-8 text-accent-600" />
            </motion.div>

            <h1 className="text-2xl font-bold text-white mb-2">Rejoignez Echo</h1>
            <p className="text-accent-100">Créez votre compte pour commencer</p>
          </div>

          {/* Form */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Display Name Field */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Nom d'affichage
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
                  <input
                    type="text"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-colors text-gray-900 bg-white placeholder:text-gray-400"
                    placeholder="Votre nom"
                    required
                    style={{ color: '#334155' }}
                  />
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Adresse email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-colors text-gray-900 bg-white placeholder:text-gray-400"
                    placeholder="votre@email.com"
                    required
                    style={{ color: '#334155' }}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-12 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-colors text-gray-900 bg-white placeholder:text-gray-400"
                    placeholder="••••••••"
                    required
                    style={{ color: '#334155' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors ${i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-secondary-200'
                            }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-secondary-600 mt-1">
                      Force: {strengthLabels[passwordStrength - 1] || 'Aucun'}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-12 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-colors text-gray-900 bg-white placeholder:text-gray-400"
                    placeholder="••••••••"
                    required
                    style={{ color: '#334155' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Password Match Indicator */}
                {formData.confirmPassword && (
                  <div className="mt-2 flex items-center space-x-2">
                    {formData.password === formData.confirmPassword ? (
                      <>
                        <Check className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600">Les mots de passe correspondent</span>
                      </>
                    ) : (
                      <>
                        <div className="w-4 h-4 rounded-full bg-red-500"></div>
                        <span className="text-sm text-red-600">Les mots de passe ne correspondent pas</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="acceptTerms"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-1 rounded border-secondary-300 text-accent-600 focus:ring-accent-500"
                />
                <label htmlFor="acceptTerms" className="text-sm text-secondary-600 leading-relaxed">
                  J'accepte les{' '}
                  <Link href="/terms" className="text-accent-600 hover:text-accent-700 font-medium">
                    conditions d'utilisation
                  </Link>{' '}
                  et la{' '}
                  <Link href="/privacy" className="text-accent-600 hover:text-accent-700 font-medium">
                    politique de confidentialité
                  </Link>
                </label>
              </div>

              {/* Register Button */}
              <button
                type="submit"
                disabled={isLoading || !acceptTerms}
                className="w-full bg-gradient-to-r from-accent-600 to-accent-700 text-white py-3 rounded-lg font-semibold hover:from-accent-700 hover:to-accent-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Créer mon compte</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="my-8 flex items-center">
              <div className="flex-1 border-t border-secondary-200"></div>
              <span className="px-4 text-sm text-secondary-500">ou inscrivez-vous avec</span>
              <div className="flex-1 border-t border-secondary-200"></div>
            </div>

            {/* Social Login */}
            <div className="space-y-3">
              <button
                onClick={handleSpotifyLogin}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z" />
                </svg>
                <span>Spotify</span>
              </button>

              <button
                onClick={handleDeezerLogin}
                className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.81 12.74h3.19v1.58h-3.19zm0-2.37h3.19v1.58h-3.19zm0-2.37h3.19v1.58h-3.19zm-3.2 4.74h3.19v1.58h-3.19zm0-2.37h3.19v1.58h-3.19zm0-2.37h3.19v1.58h-3.19zm0-2.37h3.19v1.58h-3.19zm-3.19 7.11h3.19v1.58h-3.19zm0-2.37h3.19v1.58h-3.19zm0-2.37h3.19v1.58h-3.19zm0-2.37h3.19v1.58h-3.19zm0-2.37h3.19v1.58h-3.19zm-3.2 9.48h3.19v1.58H9.22zm0-2.37h3.19v1.58H9.22zm0-2.37h3.19v1.58H9.22zm0-2.37h3.19v1.58H9.22zm0-2.37h3.19v1.58H9.22zm0-2.37h3.19v1.58H9.22zm-3.19 11.85h3.19v1.58H6.03zm0-2.37h3.19v1.58H6.03zm0-2.37h3.19v1.58H6.03zm0-2.37h3.19v1.58H6.03zm0-2.37h3.19v1.58H6.03zm0-2.37h3.19v1.58H6.03zm0-2.37h3.19v1.58H6.03zm-3.19 14.22h3.19v1.58H2.84zm0-2.37h3.19v1.58H2.84zm0-2.37h3.19v1.58H2.84zm0-2.37h3.19v1.58H2.84zm0-2.37h3.19v1.58H2.84zm0-2.37h3.19v1.58H2.84zm0-2.37h3.19v1.58H2.84zm0-2.37h3.19v1.58H2.84z" />
                </svg>
                <span>Deezer</span>
              </button>
            </div>

            {/* Login Link */}
            <div className="mt-8 text-center">
              <p className="text-secondary-600">
                Déjà un compte ?{' '}
                <Link href="/auth/login" className="text-accent-600 hover:text-accent-700 font-medium">
                  Se connecter
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
