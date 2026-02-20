import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Layout } from '../../../shared/components/Layout';
import { Button } from '../../../shared/components/Button';
import { FormField } from '../../../shared/components/FormField';
import { Input } from '../../../shared/components/Input';
import { Leaf } from 'lucide-react';

export function SignIn() {

  const { signIn } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
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
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      await signIn(formData.email, formData.password);
      // La redirection sera gérée automatiquement par AppContent
    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : 'Erreur lors de la connexion' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout showHeader={false} showBottomNav={false}>
      <div className="min-h-screen flex flex-col justify-center items-center px-4">
        <div className="w-full max-w-sm bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-[#e3c79f]/30">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Leaf size={32} className="text-[#303d25]" />
              <h1 className="text-2xl font-bold text-[#303d25]">
                Sanozia
              </h1>
            </div>
            <h2 className="text-lg font-semibold text-[#303d25]">
              Connexion
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
                placeholder="Votre mot de passe"
                disabled={loading}
              />
            </FormField>

            <Button type="submit" fullWidth disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <div className="text-sm text-[#303d25]">
              Pas encore de compte ?{' '}
              <Link to="/auth/signup" className="text-[#b36b43] hover:underline">
                S'inscrire
              </Link>
            </div>
            <div className="text-sm">
              <Link to="/auth/forgot-password" className="text-[#b36b43] hover:underline">
                Mot de passe oublié ?
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
