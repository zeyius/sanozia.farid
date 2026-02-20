import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Layout } from '../../../shared/components/Layout';
import { Button } from '../../../shared/components/Button';
import { FormField } from '../../../shared/components/FormField';
import { Input } from '../../../shared/components/Input';
import { Leaf } from 'lucide-react';

export function SignUp() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }
    
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setLoading(true);
    try {
      await signUp(formData.email, formData.password);
      // Redirection immédiate vers onboarding après inscription
      setTimeout(() => {
        navigate('/onboarding', { replace: true });
      }, 100);
    } catch (error) {
      let errorMessage = 'Erreur lors de l\'inscription';
      
      if (error instanceof Error) {
        // Check for specific Supabase error codes
        if (error.message.includes('user_already_exists') || error.message.includes('User already registered')) {
          errorMessage = 'Cette adresse email est déjà utilisée. Veuillez vous connecter ou utiliser une autre adresse email.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout showHeader={false} showBottomNav={false}>
      <div className="min-h-screen flex flex-col justify-center">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-[#e3c79f]/30">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Leaf size={32} className="text-[#303d25]" />
              <h1 className="text-2xl font-bold text-[#303d25]">
                Sanozia
              </h1>
            </div>
            <h2 className="text-lg font-semibold text-[#303d25]">
              Inscription
            </h2>
          </div>

          {errors.general && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Email" error={errors.email} required>
              <Input
                type="email"
                value={formData.email}
                onChange={(value) => setFormData(prev => ({ ...prev, email: value }))}
                placeholder="votre@email.com"
                disabled={loading}
              />
            </FormField>

            <FormField label="Mot de passe" error={errors.password} required>
              <Input
                type="password"
                value={formData.password}
                onChange={(value) => setFormData(prev => ({ ...prev, password: value }))}
                placeholder="Minimum 6 caractères"
                disabled={loading}
              />
            </FormField>

            <FormField label="Confirmer le mot de passe" error={errors.confirmPassword} required>
              <Input
                type="password"
                value={formData.confirmPassword}
                onChange={(value) => setFormData(prev => ({ ...prev, confirmPassword: value }))}
                placeholder="Répétez votre mot de passe"
                disabled={loading}
              />
            </FormField>

            <Button type="submit" fullWidth disabled={loading}>
              {loading ? 'Inscription...' : 'S\'inscrire'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <div className="text-sm text-[#303d25]">
              Déjà un compte ?{' '}
              <Link to="/auth/signin" className="text-[#b36b43] hover:underline">
                Se connecter
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
