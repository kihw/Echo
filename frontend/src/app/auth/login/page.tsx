'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Music, Mail, Lock, ArrowRight, Github } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { login, loginWithSpotify, loginWithDeezer } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await login(email, password);
            toast.success('Connexion réussie !');
            router.push('/');
        } catch (error: any) {
            toast.error(error.message || 'Erreur de connexion');
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Carte d'informations de test */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
                >
                    <div className="flex items-center mb-2">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                            <span className="text-blue-600 text-sm font-bold">ℹ</span>
                        </div>
                        <h3 className="text-sm font-semibold text-blue-800">Comptes de test disponibles</h3>
                    </div>
                    <div className="text-xs text-blue-700 space-y-1">
                        <div className="flex justify-between">
                            <span className="font-medium">Utilisateur:</span>
                            <span className="font-mono">test@echo.com</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium">Mot de passe:</span>
                            <span className="font-mono">password123</span>
                        </div>
                        <div className="border-t border-blue-200 my-2"></div>
                        <div className="flex justify-between">
                            <span className="font-medium">Admin:</span>
                            <span className="font-mono">admin@echo.com</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium">Mot de passe:</span>
                            <span className="font-mono">admin123</span>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="bg-white rounded-2xl shadow-xl border border-secondary-200 overflow-hidden"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-8 text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
                            className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4"
                        >
                            <Music className="w-8 h-8 text-primary-600" />
                        </motion.div>

                        <h1 className="text-2xl font-bold text-white mb-2">Bon retour !</h1>
                        <p className="text-primary-100">Connectez-vous à votre compte Echo</p>
                    </div>

                    {/* Form */}
                    <div className="p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Email Field */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-secondary-700">
                                        Adresse email
                                    </label>
                                    <div className="flex space-x-1">
                                        <button
                                            type="button"
                                            onClick={() => { setEmail('test@echo.com'); setPassword('password123'); }}
                                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                        >
                                            Test
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setEmail('admin@echo.com'); setPassword('admin123'); }}
                                            className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                                        >
                                            Admin
                                        </button>
                                    </div>
                                </div>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-gray-900 bg-white placeholder:text-gray-400"
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
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-10 pr-12 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-gray-900 bg-white placeholder:text-gray-400"
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
                            </div>

                            {/* Remember & Forgot */}
                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center">
                                    <input type="checkbox" className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500" />
                                    <span className="ml-2 text-secondary-600">Se souvenir de moi</span>
                                </label>
                                <Link href="/auth/forgot-password" className="text-primary-600 hover:text-primary-700 font-medium">
                                    Mot de passe oublié ?
                                </Link>
                            </div>

                            {/* Login Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-3 rounded-lg font-semibold hover:from-primary-700 hover:to-primary-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <span>Se connecter</span>
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="my-8 flex items-center">
                            <div className="flex-1 border-t border-secondary-200"></div>
                            <span className="px-4 text-sm text-secondary-500">ou continuez avec</span>
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

                        {/* Register Link */}
                        <div className="mt-8 text-center">
                            <p className="text-secondary-600">
                                Pas encore de compte ?{' '}
                                <Link href="/auth/register" className="text-primary-600 hover:text-primary-700 font-medium">
                                    Créer un compte
                                </Link>
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
