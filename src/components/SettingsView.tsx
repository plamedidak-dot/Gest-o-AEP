import React, { useState } from 'react';
import { 
  Settings, 
  Save, 
  Download, 
  Upload, 
  RotateCcw, 
  CheckCircle2, 
  Trash2,
  Sparkles,
  School,
  Image,
  DollarSign,
  Users,
  Database,
  Link as LinkIcon,
  Check,
  Cloud,
  RefreshCw
} from 'lucide-react';
import { AssociationSettings, UserProfile } from '../types';
import { storage } from '../services/storage';
import { ConfirmDialog } from './ConfirmDialog';

interface SettingsViewProps {
  settings: AssociationSettings;
  currentUser: UserProfile;
  onSettingsUpdated: (newSettings: AssociationSettings) => void;
  onLoadSampleData?: () => void;
}

// Preset logos that users can choose with 1 click
const PRESET_LOGOS = [
  {
    id: 'aep2_official',
    name: 'Emblema Oficial AEP-2 (Associação)',
    url: '/assets/aistudio/Screenshot_20261107-111452_1a58e2b0.jpg',
    description: 'Emblema oficial com capelo e livro da AEP-2 Polo II',
  },
  {
    id: 'proglory_crest',
    name: 'Brasão Oficial Proglory (C.E.P.P.)',
    url: '/assets/aistudio/PEQUENO_87357065.png',
    description: 'Logótipo oficial do Complexo Escolar Privado Proglory',
  },
  {
    id: 'emerald_crest',
    name: 'Emblema Verde & Ouro Escolar',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%23064e3b" stroke="%2310b981" stroke-width="4"/><path d="M50 18 C30 18 24 30 24 50 C24 72 50 82 50 82 C50 82 76 72 76 50 C76 30 70 18 50 18 Z" fill="%23047857" stroke="%2334d399" stroke-width="2"/><path d="M36 45 C42 40 50 42 50 54 C50 42 58 40 64 45 L64 62 C58 58 50 60 50 70 C50 60 42 58 36 62 Z" fill="%23ffffff"/><circle cx="50" cy="34" r="5" fill="%23fbbf24"/></svg>',
    description: 'Estilo clássico verde esmeralda com livro da sabedoria',
  },
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  currentUser,
  onSettingsUpdated,
  onLoadSampleData,
}) => {
  const [activeTab, setActiveTab] = useState<'identidade' | 'quotas' | 'diretoria' | 'dados'>('identidade');
  const [formData, setFormData] = useState<AssociationSettings>(settings);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [showConfirmClearAll, setShowConfirmClearAll] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<{ message: string; isError?: boolean } | null>(null);

  React.useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleChange = (field: keyof AssociationSettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Immediate save for logo changes
  const handleApplyLogo = (newLogoUrl: string | undefined) => {
    const updated = { ...formData, logoUrl: newLogoUrl };
    setFormData(updated);
    storage.saveSettings(updated);
    onSettingsUpdated(updated);
    setSuccessMsg('Logótipo da Associação atualizado com sucesso em todo o sistema!');
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    storage.saveSettings(formData);
    onSettingsUpdated(formData);
    setSuccessMsg('Definições da Associação Escolar guardadas com sucesso!');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleDownloadBackup = () => {
    const json = storage.exportFullBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_ae_escola_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (storage.importBackup(content)) {
        setStatusFeedback({ message: 'Cópia de segurança restaurada com sucesso! A recarregar...', isError: false });
        setTimeout(() => window.location.reload(), 800);
      } else {
        setStatusFeedback({ message: 'Erro ao importar ficheiro de cópia de segurança. Formato inválido.', isError: true });
      }
    };
    reader.readAsText(file);
  };

  const [isSyncingCloud, setIsSyncingCloud] = useState(false);

  const handleSyncToCloud = async () => {
    setIsSyncingCloud(true);
    try {
      const res = await storage.syncAllToCloud();
      if (res.success) {
        setStatusFeedback({ message: `Base de dados na nuvem sincronizada com sucesso (${res.count} registos atualizados).` });
      } else {
        setStatusFeedback({ message: `Erro ao sincronizar: ${res.error || 'Verifique a ligação'}`, isError: true });
      }
    } catch (e: any) {
      setStatusFeedback({ message: `Erro: ${e.message}`, isError: true });
    } finally {
      setIsSyncingCloud(false);
      setTimeout(() => setStatusFeedback(null), 4000);
    }
  };

  const handleClearAll = () => {
    setShowConfirmClearAll(true);
  };

  const confirmClearAllAction = () => {
    storage.clearAllData();
    setShowConfirmClearAll(false);
    window.location.reload();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <School className="w-5 h-5 text-indigo-600" />
            <span>Definições da Associação de Estudantes</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Personalize o logótipo, dados da escola, quotas semanais (500 Kz) e dirigentes escolares
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>Guardar Alterações</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Responsive Settings Tabs (Abas das Configurações) */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-medium overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('identidade')}
          className={`px-3.5 py-2 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'identidade'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Image className="w-4 h-4" />
          <span>Logótipo & Identidade</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('quotas')}
          className={`px-3.5 py-2 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'quotas'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Quotas Semanais (500 Kz)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('diretoria')}
          className={`px-3.5 py-2 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'diretoria'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Corpo Directivo</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('dados')}
          className={`px-3.5 py-2 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'dados'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Cópia de Segurança & Dados</span>
        </button>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* ABA 1: Identidade & Logótipo */}
        {activeTab === 'identidade' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-6 shadow-sm text-xs">
            {/* Logo Customization Card */}
            <div className="p-5 bg-gradient-to-br from-slate-50 to-indigo-50/40 rounded-2xl border border-indigo-100 space-y-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Image className="w-4 h-4 text-indigo-600" />
                    <span>Logótipo Oficial da Associação Escolar</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Este logótipo aparece no cabeçalho, na barra de navegação, nos cartões de associado, nos recibos de 500 Kz e nos relatórios oficiais em PDF.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyLogo(formData.logoUrl)}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Guardar Logótipo</span>
                  </button>
                </div>
              </div>

              {/* Logo Preview & Upload Controls */}
              <div className="flex flex-col sm:flex-row items-center gap-5 pt-2">
                <div className="relative group shrink-0">
                  <img
                    src={formData.logoUrl || '/src/assets/images/association_crest_1793825853762.jpg'}
                    alt="Pré-visualização do Logótipo"
                    className="w-24 h-24 rounded-2xl object-cover ring-4 ring-indigo-500/20 bg-white shadow-lg p-1"
                  />
                  <span className="absolute -top-1.5 -right-1.5 bg-emerald-600 text-white rounded-full p-1 shadow">
                    <Check className="w-3 h-3" />
                  </span>
                </div>

                <div className="space-y-3 text-center sm:text-left flex-1 w-full">
                  <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                    {/* Botão de Carregar Imagem */}
                    <label className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer transition-colors shadow-xs inline-flex items-center gap-1.5">
                      <Upload className="w-4 h-4" />
                      <span>Carregar Imagem / Logótipo</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const base64 = event.target?.result as string;
                            handleApplyLogo(base64);
                          };
                          reader.readAsDataURL(file);
                        }}
                        className="hidden"
                      />
                    </label>

                    {/* Botão para inserir Link/URL */}
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="px-3.5 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl font-semibold transition-colors inline-flex items-center gap-1.5 bg-white"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>Inserir por Link / URL</span>
                    </button>

                    {/* Restaurar padrão */}
                    {formData.logoUrl && (
                      <button
                        type="button"
                        onClick={() => handleApplyLogo(undefined)}
                        className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl font-semibold transition-colors flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restaurar Brasão Padrão</span>
                      </button>
                    )}
                  </div>

                  {/* Input de URL expandido */}
                  {showUrlInput && (
                    <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center gap-2 max-w-md">
                      <input
                        type="url"
                        placeholder="https://exemplo.com/logotipo.png"
                        value={customUrlInput}
                        onChange={(e) => setCustomUrlInput(e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customUrlInput.trim()) {
                            handleApplyLogo(customUrlInput.trim());
                            setShowUrlInput(false);
                            setCustomUrlInput('');
                          }
                        }}
                        className="px-3 py-1.5 bg-slate-900 text-white rounded-lg font-bold text-xs"
                      >
                        Aplicar
                      </button>
                    </div>
                  )}

                  <p className="text-[11px] text-slate-500">
                    Formatos aceites: <strong>PNG</strong>, <strong>JPG</strong>, <strong>SVG</strong> ou <strong>WEBP</strong>. Pode selecionar qualquer imagem da galeria do telemóvel ou computador.
                  </p>
                </div>
              </div>

              {/* Logótipos & Emblemas Pré-definidos */}
              <div className="pt-3 border-t border-indigo-100">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  Ou escolha um dos Emblemas Oficiais Prontos:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {PRESET_LOGOS.map((preset) => {
                    const isSelected = (!formData.logoUrl && preset.id === 'default') || formData.logoUrl === preset.url;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => handleApplyLogo(preset.id === 'default' ? undefined : preset.url)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                          isSelected
                            ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/30'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-10 h-10 rounded-xl object-cover shrink-0 ring-1 ring-slate-200 bg-white"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-900 truncate text-xs">{preset.name}</p>
                          <p className="text-[10px] text-slate-500 truncate">{preset.description}</p>
                        </div>
                        {isSelected && (
                          <span className="text-indigo-600 font-bold shrink-0">✓</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* School Identification Fields */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
                Identificação da Escola e da Associação
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Nome da Associação *</label>
                  <input
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sigla da Associação *</label>
                  <input
                    value={formData.acronym}
                    onChange={(e) => handleChange('acronym', e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ano Lectivo / Mandato *</label>
                  <input
                    value={formData.academicYear}
                    onChange={(e) => handleChange('academicYear', e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Nome da Escola / Complexo Escolar *</label>
                  <input
                    value={formData.institution}
                    onChange={(e) => handleChange('institution', e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Localização da Escola / Sala da Associação</label>
                  <input
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Identidade</span>
              </button>
            </div>
          </div>
        )}

        {/* ABA 2: Quotas Semanais (500 Kz) */}
        {activeTab === 'quotas' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-6 shadow-sm text-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-1 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Configuração das Quotas Semanais</span>
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Por definição, todos os membros pagam semanalmente 500 Kz à tesouraria da Associação Escolar.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Valor Semanal da Quota *</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.quotaAmount}
                      onChange={(e) => handleChange('quotaAmount', Number(e.target.value))}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono font-bold text-slate-900"
                    />
                    <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">Kz</span>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Moeda Oficial *</label>
                  <input
                    value={formData.currency}
                    onChange={(e) => handleChange('currency', e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 focus:outline-none font-bold text-slate-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Periodicidade de Cobrança</label>
                  <select
                    value={formData.quotaCadence}
                    onChange={(e) => handleChange('quotaCadence', e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                  >
                    <option value="semanal">Semanal (500 Kz por semana)</option>
                    <option value="mensal">Mensal</option>
                    <option value="anual">Anual</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 p-4 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="text-xs text-emerald-950">
                  <p className="font-bold">Emissão Automática de Recibos em Kwanzas</p>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    Todas as cobranças registadas criam recibos com numeração sequencial, data e carimbo da tesouraria da escola.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Configurações de Quotas</span>
              </button>
            </div>
          </div>
        )}

        {/* ABA 3: Corpo Directivo */}
        {activeTab === 'diretoria' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-6 shadow-sm text-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-1 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Dirigentes do Departamento Administrativo</span>
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Nomes que figuram nos certificados, declarações de sócio e atas oficiais da Associação de Estudantes.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Presidente da Direção</label>
                  <input
                    value={formData.presidentName}
                    onChange={(e) => handleChange('presidentName', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vice-Presidente da Direção</label>
                  <input
                    value={formData.vicePresidentName}
                    onChange={(e) => handleChange('vicePresidentName', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Secretário-Geral</label>
                  <input
                    value={formData.secretaryName}
                    onChange={(e) => handleChange('secretaryName', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tesoureiro da AE</label>
                  <input
                    value={formData.treasurerName}
                    onChange={(e) => handleChange('treasurerName', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Corpo Directivo</span>
              </button>
            </div>
          </div>
        )}

        {/* ABA 4: Cópia de Segurança & Dados */}
        {activeTab === 'dados' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-6 shadow-sm text-xs">
            {/* Cloud Database (Firebase Firestore) Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-white to-slate-50 border border-indigo-200/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">Base de Dados na Nuvem (Firebase Firestore)</h4>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Conectada & Activa
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Sincronização em tempo real entre todos os computadores e telemóveis dos membros.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSyncToCloud}
                  disabled={isSyncingCloud}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center gap-2 transition-all shadow-sm shrink-0 self-start sm:self-auto cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-spin' : ''}`} />
                  <span>{isSyncingCloud ? 'A Sincronizar...' : 'Sincronizar Tudo com a Nuvem'}</span>
                </button>
              </div>

              <div className="p-3 bg-white/80 rounded-xl border border-indigo-100 text-[11px] text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Como funciona o acesso de outros membros:
                </p>
                <p>
                  Ao adicionar membros ou departamentos num dispositivo, estes são gravados instantaneamente na base de dados central. Quando outros estudantes acederem via <strong>https://gestaep.netlify.app/</strong> ou no telemóvel, os membros e dados estarão automaticamente disponíveis para acesso com o seu <strong>Número de Telefone</strong> e senha!
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-1 flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-600" />
                <span>Gestão Local de Dados & Cópias de Segurança (Backup)</span>
              </h3>
              <p className="text-slate-500 leading-relaxed mb-4">
                Descarregue ou restaure ficheiros de cópia de segurança em formato JSON para garantir a salvaguarda de todos os membros, documentos, quotas e presenças.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-xl font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 text-indigo-600" />
                  <span>Descarregar Backup Completo (JSON)</span>
                </button>

                <label className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-xl font-semibold flex items-center gap-2 transition-colors cursor-pointer">
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span>Restaurar Backup</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>

                {onLoadSampleData && (
                  <button
                    type="button"
                    onClick={onLoadSampleData}
                    className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                    title="Carregar estrutura de departamentos e alunos de teste"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Carregar Dados de Exemplo</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-semibold flex items-center gap-2 transition-colors sm:ml-auto cursor-pointer"
                  title="Limpar todos os dados e deixar o sistema vazio"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Limpar Todos os Dados</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </form>

      {/* Status Feedback Toast */}
      {statusFeedback && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs animate-in fade-in ${
          statusFeedback.isError ? 'bg-rose-900 text-white' : 'bg-slate-900 text-white'
        }`}>
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusFeedback.message}</span>
        </div>
      )}

      {/* Confirmation Dialog for Resetting System Data */}
      <ConfirmDialog
        isOpen={showConfirmClearAll}
        title="Limpar e Reinicializar o Sistema"
        message="Tem a certeza absoluta de que deseja apagar todos os registos? Esta ação deixará o sistema completamente em branco."
        detail="Todos os membros, quotas pagas, documentos arquivados e departamentos criados serão permanentemente apagados."
        confirmLabel="Limpar Todos os Dados"
        cancelLabel="Cancelar"
        isDestructive={true}
        onConfirm={confirmClearAllAction}
        onClose={() => setShowConfirmClearAll(false)}
      />
    </div>
  );
};
