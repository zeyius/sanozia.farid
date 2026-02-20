import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Layout } from '../../../shared/components/Layout';
import { Button } from '../../../shared/components/Button';
import { FormField } from '../../../shared/components/FormField';
import { Input } from '../../../shared/components/Input';
import { Leaf } from 'lucide-react';

export function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Format d\'email invalide';
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
      await resetPassword(email);
      setSuccess(true);
      setErrors({});
    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : 'Erreur lors de l\'envoi de l\'email' 
      });
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
              Mot de passe oublié
            </h2>
          </div>

          {success ? (
            <div className="text-center space-y-4">
              <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                Un email de réinitialisation a été envoyé à votre adresse email.
              </div>
              <Link 
                to="/auth/signin" 
                className="text-[#b36b43] hover:underline"
              >
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <>
              {errors.general && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                  {errors.general}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <FormField label="Email" error={errors.email} required>
                  <Input
                    type="email"
                    value={email}
                    onChange={setEmail}
                    placeholder="votre@email.com"
                    disabled={loading}
                  />
                </FormField>

                <Button type="submit" fullWidth disabled={loading}>
                  {loading ? 'Envoi...' : 'Envoyer le lien de réinitialisation'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <div className="text-sm text-[#303d25]">
                  Vous vous souvenez de votre mot de passe ?{' '}
                  <Link to="/auth/signin" className="text-[#b36b43] hover:underline">
                    Se connecter
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
