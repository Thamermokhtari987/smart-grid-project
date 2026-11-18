import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  Mail,
  LockKeyhole,
  User,
  Phone,
  MapPin,
  Building2,
  Gauge,
  Eye,
  EyeOff,
  ArrowRight,
  LoaderCircle,
} from 'lucide-react';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  customerType: string;
  contractedPowerKva: number;
  role: string;
}

type AuthMode = 'signup' | 'signin';

export function saveAuth(token: string, user: AuthUser) {
  localStorage.setItem('smartgrid_token', token);
  localStorage.setItem('smartgrid_user', JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem('smartgrid_token');
  localStorage.removeItem('smartgrid_user');
}

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('signup');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    password: '',
    customerType: 'RESIDENTIAL',
    contractedPowerKva: 4,
  });

  const update = (field: keyof typeof form, value: string | number) =>
    setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = mode === 'signup' ? '/api/auth/signup' : '/api/auth/signin';
      const body = mode === 'signup'
        ? form
        : { email: form.email, password: form.password };
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Impossible de continuer.');
      saveAuth(data.token, data.user);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F5F7FB] dark:bg-[#09111F]">
      <div className="hidden lg:flex lg:w-[46%] relative overflow-hidden bg-[#0B1B38] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(34,211,238,.20),transparent_32%),radial-gradient(circle_at_75%_85%,rgba(59,130,246,.24),transparent_35%)]" />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'linear-gradient(rgba(148,163,184,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.18) 1px, transparent 1px)',
          backgroundSize: '42px 42px',
        }} />
        <div className="relative z-10 flex flex-col justify-between w-full p-12 xl:p-16">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Zap className="w-6 h-6 fill-white" />
            </div>
            <div>
              <div className="font-extrabold tracking-wider text-lg">SMARTGRID<span className="text-cyan-400">.TN</span></div>
              <div className="text-[10px] text-slate-400 tracking-[0.25em] uppercase">Energy Platform</div>
            </div>
          </div>
          <div className="max-w-xl">
            <div className="inline-flex px-3 py-1 mb-5 rounded-full border border-cyan-400/30 bg-cyan-400/10 text-cyan-300 text-xs font-bold">
              ENERGIE INTELLIGENTE
            </div>
            <h1 className="text-4xl xl:text-5xl font-extrabold leading-tight">
              Gérez votre énergie.<br />
              <span className="text-cyan-400">Optimisez votre avenir.</span>
            </h1>
            <p className="mt-5 text-slate-300 text-lg leading-relaxed">
              Suivez votre consommation, vos batteries et votre production solaire depuis votre espace client sécurisé.
            </p>
          </div>
          <p className="text-xs text-slate-500">SMARTGRID Tunisia - Plateforme intelligente de gestion énergétique</p>
        </div>
      </div>

      <div className="w-full lg:w-[54%] flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-xl">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="font-extrabold text-slate-900 dark:text-white">SMARTGRID<span className="text-cyan-500">.TN</span></span>
          </div>

          <div className="mb-7">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {mode === 'signup' ? 'Créer votre compte client' : 'Connexion à votre espace'}
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {mode === 'signup'
                ? 'Renseignez vos informations pour accéder à la plateforme.'
                : 'Entrez vos identifiants pour continuer.'}
            </p>
          </div>

          <div className="grid grid-cols-2 p-1 mb-6 rounded-xl bg-slate-200/70 dark:bg-slate-800">
            {(['signup', 'signin'] as AuthMode[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => { setMode(item); setError(''); }}
                className={`rounded-lg py-2.5 text-sm font-bold transition-all ${
                  mode === item
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-cyan-400 shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                {item === 'signup' ? 'Créer un compte' : 'Se connecter'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'signup' && (
              <div className="grid sm:grid-cols-2 gap-4">
                <TextField icon={<User />} label="Nom complet" value={form.name} onChange={(v) => update('name', v)} required />
                <TextField icon={<Phone />} label="Téléphone" value={form.phone} onChange={(v) => update('phone', v)} required />
                <div className="sm:col-span-2">
                  <TextField icon={<MapPin />} label="Adresse" value={form.address} onChange={(v) => update('address', v)} required />
                </div>
                <TextField icon={<Building2 />} label="Ville" value={form.city} onChange={(v) => update('city', v)} required />
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Type de client</label>
                  <select
                    value={form.customerType}
                    onChange={(e) => update('customerType', e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="RESIDENTIAL">Résidentiel</option>
                    <option value="PROFESSIONAL">Professionnel</option>
                  </select>
                </div>
                <TextField
                  icon={<Gauge />}
                  label="Puissance souscrite (kVA)"
                  value={String(form.contractedPowerKva)}
                  onChange={(v) => update('contractedPowerKva', Number(v))}
                  type="number"
                  required
                />
              </div>
            )}

            <TextField icon={<Mail />} label="Adresse e-mail" value={form.email} onChange={(v) => update('email', v)} type="email" required />
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Mot de passe</label>
              <div className="relative">
                <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  required
                  minLength={mode === 'signup' ? 8 : undefined}
                  placeholder={mode === 'signup' ? 'Minimum 8 caractères' : 'Votre mot de passe'}
                  className="w-full h-12 pl-11 pr-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 hover:brightness-105 disabled:opacity-60"
            >
              {loading ? <LoaderCircle className="w-5 h-5 animate-spin" /> : (
                <>
                  {mode === 'signup' ? 'Créer mon compte' : 'Se connecter'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

interface TextFieldProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}

const TextField: React.FC<TextFieldProps> = ({ icon, label, value, onChange, type = 'text', required }) => (
  <div>
    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">{label}</label>
    <div className="relative">
      <span className="[&>svg]:w-4.5 [&>svg]:h-4.5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 [&>svg]:block">
        {icon}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        min={type === 'number' ? 1 : undefined}
        step={type === 'number' ? 0.5 : undefined}
        className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  </div>
);
