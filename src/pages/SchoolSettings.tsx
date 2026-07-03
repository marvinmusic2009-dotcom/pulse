import React, { useState, useEffect } from 'react';
import { dbService, applySchoolBranding } from '../services/db';
import type { User, School } from '../services/db';
import { 
  Save, CheckCircle, Image as ImageIcon, Palette, User as UserIcon,
  Building, RefreshCw, Phone, Mail, MapPin, Sliders, Info, Upload
} from 'lucide-react';

interface SchoolSettingsProps {
  user: User;
}

export default function SchoolSettings({ user }: SchoolSettingsProps) {
  const schoolId = user.school_id;
  const isAdmin = user.role === 'Admin';

  // Active settings tab: 'profile' | 'branding' | 'facilities' | 'alerts' | 'cloud'
  const [activeSettingsTab, setActiveSettingsTab] = useState<'profile' | 'branding' | 'facilities' | 'alerts' | 'cloud'>('profile');

  // School data states
  const [school, setSchool] = useState<School | null>(null);
  
  // Profile Tab Fields
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || '');

  // Branding Tab Fields
  const [name, setName] = useState('');
  const [logo, setLogo] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#0ea5e9');
  const [secondaryColor, setSecondaryColor] = useState('#0f172a');
  const [themePreset, setThemePreset] = useState('custom');
  const [fontPreset, setFontPreset] = useState('inter');
  const [customCss, setCustomCss] = useState('');

  // Facilities Tab Fields
  const [clinicAddress, setClinicAddress] = useState('');
  const [clinicEmail, setClinicEmail] = useState('');
  const [clinicPhone, setClinicPhone] = useState('');
  const [clinicBeds, setClinicBeds] = useState(2);

  // Alert Thresholds Tab Fields
  const [lowStockLimit, setLowStockLimit] = useState(20);

  // Cloud Sync Tab Fields
  const [cloudSyncEnabled, setCloudSyncEnabled] = useState(false);
  const [cloudSyncToken, setCloudSyncToken] = useState('');

  // Messages
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Avatar presets
  const avatarPresets = [
    'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150', // Female Doctor
    'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=150', // Male Doctor
    'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=150', // Female Nurse
    'https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?auto=format&fit=crop&q=80&w=150', // Male Nurse
    'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=150', // Surgeon
    'https://images.unsplash.com/photo-1582750433449-64c382817d8f?auto=format&fit=crop&q=80&w=150', // Lab
  ];

  // Preset Palettes
  const presets = [
    { id: 'indigo', label: 'Midnight Indigo', primary: '#6366f1', secondary: '#1e1b4b' },
    { id: 'emerald', label: 'Glass Emerald', primary: '#10b981', secondary: '#064e3b' },
    { id: 'sunset', label: 'Sunset Amber', primary: '#f97316', secondary: '#7c2d12' },
    { id: 'teal', label: 'Ocean Teal', primary: '#14b8a6', secondary: '#115e59' },
    { id: 'slate', label: 'Corporate Slate', primary: '#475569', secondary: '#0f172a' },
  ];

  // Font Typography options
  const fontOptions = [
    { id: 'inter', label: 'Inter (Clean & Professional)' },
    { id: 'roboto', label: 'Roboto (Standard Medical)' },
    { id: 'outfit', label: 'Outfit (Modern & Minimalist)' },
    { id: 'poppins', label: 'Poppins (Friendly & Rounded)' },
    { id: 'lexend', label: 'Lexend (Highly Readable)' },
  ];

  // Load settings
  useEffect(() => {
    const sc = dbService.getSchool(schoolId);
    if (sc) {
      setSchool(sc);
      setName(sc.name);
      setLogo(sc.logo_url || '');
      setPrimaryColor(sc.primary_color);
      setSecondaryColor(sc.secondary_color);
      setThemePreset(sc.theme_preset || 'custom');
      setFontPreset(sc.font_preset || 'inter');
      setCustomCss(sc.custom_css || '');
      setClinicAddress(sc.clinic_address || '100 School Lane, Greenwood');
      setClinicEmail(sc.clinic_email || 'sickbay@greenwood.edu');
      setClinicPhone(sc.clinic_phone || '+1 (555) 902-1920');
      setClinicBeds(sc.clinic_beds || 2);
      setLowStockLimit(sc.low_stock_limit || 20);
      setCloudSyncEnabled(sc.cloud_sync_enabled || false);
      setCloudSyncToken(sc.cloud_sync_token || '');
    }

    // Load active user fresh avatar
    const savedUserStr = localStorage.getItem('pulse_current_user');
    if (savedUserStr) {
      const savedUser = JSON.parse(savedUserStr) as User;
      setAvatarUrl(savedUser.avatar_url || '');
    }
  }, [schoolId]);

  // Apply Preset Choice
  const handleApplyPreset = (presetId: string, pri: string, sec: string) => {
    setThemePreset(presetId);
    setPrimaryColor(pri);
    setSecondaryColor(sec);
  };

  // Convert uploaded logo to Base64
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Convert uploaded custom avatar to Base64
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save Settings Submit
  const handleSaveSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    try {
      if (activeSettingsTab === 'profile') {
        dbService.updateUserAvatar(user.id, avatarUrl);
        setSuccessMsg('Your profile picture has been updated successfully!');
      } else {
        // Admin school settings
        dbService.updateSchool(schoolId, {
          name,
          logo_url: logo,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          theme_preset: themePreset,
          font_preset: fontPreset,
          custom_css: customCss,
          clinic_address: clinicAddress,
          clinic_email: clinicEmail,
          clinic_phone: clinicPhone,
          clinic_beds: clinicBeds,
          low_stock_limit: lowStockLimit,
          cloud_sync_enabled: cloudSyncEnabled,
          cloud_sync_token: cloudSyncToken,
        });
        setSuccessMsg('Sickbay settings and branding colors updated successfully!');
        
        // Refresh local styling Preview
        const sc = dbService.getSchool(schoolId);
        if (sc) {
          setSchool(sc);
          applySchoolBranding(sc);
        }
      }
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch(err: any) {
      setErrorMsg(err.message || 'Error updating settings.');
    }
  };

  // Reset defaults
  const handleResetToDefaults = () => {
    if (window.confirm('Reset school sickbay settings back to Greenwood defaults?')) {
      setThemePreset('custom');
      setPrimaryColor('#0ea5e9');
      setSecondaryColor('#0f172a');
      setFontPreset('inter');
      setCustomCss('');
      setClinicAddress('100 School Lane, Greenwood');
      setClinicEmail('sickbay@greenwood.edu');
      setClinicPhone('+1 (555) 902-1920');
      setClinicBeds(2);
      setLowStockLimit(20);
      setCloudSyncEnabled(false);
      setCloudSyncToken('');
    }
  };

  if (!school) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header title */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Settings Portal</h2>
          <p className="text-xs text-slate-400 mt-0.5">Customize your personal clinician profile, branding setups, and alert configurations</p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-500 rounded-lg text-xs font-semibold transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        )}
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-slide-up">
          <CheckCircle className="w-4.5 h-4.5 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Settings Panel Column (Form) */}
        <div className={isAdmin ? "lg:col-span-8 space-y-6" : "lg:col-span-12 space-y-6"}>
          
          {/* Sub Navigation Tabs */}
          <div className="flex flex-wrap border-b border-slate-200 bg-white px-4 py-2.5 rounded-xl border gap-1.5">
            {[
              { id: 'profile', label: 'My Profile Card', icon: UserIcon, roles: ['Admin', 'Nurse', 'Doctor', 'Clerk'] },
              { id: 'branding', label: 'Branding & Styling', icon: Palette, roles: ['Admin'] },
              { id: 'facilities', label: 'Clinic Facilities', icon: Building, roles: ['Admin'] },
              { id: 'alerts', label: 'Alert Policies', icon: Sliders, roles: ['Admin'] },
              { id: 'cloud', label: 'Cloud Synchronization', icon: RefreshCw, roles: ['Admin'] },
            ]
              .filter(t => t.roles.includes(user.role))
              .map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveSettingsTab(tab.id as any)}
                    className={`flex items-center gap-1.5 py-2 px-4 rounded-lg text-xs font-bold transition ${
                      activeSettingsTab === tab.id 
                        ? 'bg-primary text-white shadow-sm' 
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
          </div>

          {/* Form wrapper */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <form onSubmit={handleSaveSettingsSubmit} className="space-y-6">
              
              {/* TAB 0: PERSONAL PROFILE CARD */}
              {activeSettingsTab === 'profile' && (
                <div className="space-y-5 animate-fade-slide-up">
                  <div className="space-y-1 border-b pb-3 mb-4 flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-slate-500" />
                    <span className="font-bold text-slate-800 text-sm">Personal Profile & Profile Picture</span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-6 p-4 border border-slate-100 rounded-2xl bg-slate-50/50">
                    <div className="relative">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-2 border-primary shadow-lg bg-white" />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-slate-200 text-slate-500 border border-slate-300 flex items-center justify-center font-bold text-3xl shadow-inner">
                          {user.full_name.charAt(0)}
                        </div>
                      )}
                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={() => setAvatarUrl('')}
                          className="absolute -top-1 -right-1 bg-rose-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shadow"
                        >
                          &times;
                        </button>
                      )}
                    </div>

                    <div className="flex-1 space-y-3 text-center sm:text-left">
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">{user.full_name}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Role: <span className="font-semibold text-primary">{user.role}</span> &bull; {user.email}</p>
                      </div>

                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                        <label className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 text-xs font-semibold cursor-pointer hover:bg-slate-50 transition shadow-xs">
                          <Upload className="w-3.5 h-3.5 text-slate-400" />
                          <span>Upload custom photo</span>
                          <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Preset Avatar Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Or choose a professional clinical avatar</label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                      {avatarPresets.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAvatarUrl(preset)}
                          className={`p-1 border rounded-xl overflow-hidden transition relative flex items-center justify-center bg-white ${
                            avatarUrl === preset ? 'ring-2 ring-primary border-primary' : 'border-slate-200 hover:scale-105'
                          }`}
                        >
                          <img src={preset} alt={`Preset ${idx + 1}`} className="w-12 h-12 rounded-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 1: BRANDING */}
              {activeSettingsTab === 'branding' && isAdmin && (
                <div className="space-y-5 animate-fade-slide-up">
                  <div className="space-y-1 border-b pb-3 mb-4 flex items-center gap-2">
                    <Palette className="w-5 h-5 text-slate-500" />
                    <span className="font-bold text-slate-800 text-sm">Theme Design System</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">School Workspace Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">School Sickbay Logo</label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-600 text-xs font-semibold cursor-pointer hover:bg-slate-100 transition">
                        <ImageIcon className="w-4 h-4 text-slate-400" />
                        <span>Choose Image File</span>
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                      </label>
                      {logo ? (
                        <div className="relative">
                          <img src={logo} alt="Logo" className="w-12 h-12 object-contain rounded border bg-white p-0.5" />
                          <button
                            type="button"
                            onClick={() => setLogo('')}
                            className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white w-4.5 h-4.5 rounded-full flex items-center justify-center text-[10px] font-bold"
                          >
                            &times;
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No custom logo uploaded.</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Color Palette Preset</label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {presets.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleApplyPreset(p.id, p.primary, p.secondary)}
                          className={`p-2.5 border rounded-xl flex flex-col items-center gap-1.5 transition ${
                            themePreset === p.id 
                              ? 'ring-2 ring-primary border-primary bg-sky-50/20' 
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <span className="text-[10px] font-bold text-slate-600 block">{p.label}</span>
                          <div className="flex gap-1">
                            <span className="w-4 h-4 rounded-full border shadow-sm block" style={{ backgroundColor: p.primary }} />
                            <span className="w-4 h-4 rounded-full border shadow-sm block" style={{ backgroundColor: p.secondary }} />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Primary Branding Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={primaryColor}
                          onChange={(e) => {
                            setThemePreset('custom');
                            setPrimaryColor(e.target.value);
                          }}
                          className="w-10 h-9 p-0.5 border border-slate-200 rounded-lg cursor-pointer bg-white"
                        />
                        <input
                          type="text"
                          value={primaryColor}
                          onChange={(e) => {
                            setThemePreset('custom');
                            setPrimaryColor(e.target.value);
                          }}
                          className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono uppercase focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Secondary Branding Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={secondaryColor}
                          onChange={(e) => {
                            setThemePreset('custom');
                            setSecondaryColor(e.target.value);
                          }}
                          className="w-10 h-9 p-0.5 border border-slate-200 rounded-lg cursor-pointer bg-white"
                        />
                        <input
                          type="text"
                          value={secondaryColor}
                          onChange={(e) => {
                            setThemePreset('custom');
                            setSecondaryColor(e.target.value);
                          }}
                          className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono uppercase focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Google Fonts Family Preset</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {fontOptions.map(fo => (
                        <button
                          key={fo.id}
                          type="button"
                          onClick={() => setFontPreset(fo.id)}
                          className={`p-3 border rounded-xl text-left transition flex items-center justify-between ${
                            fontPreset === fo.id 
                              ? 'ring-2 ring-primary border-primary bg-slate-50' 
                              : 'border-slate-200 hover:bg-slate-50/50'
                          }`}
                        >
                          <span className="text-xs font-bold text-slate-700">{fo.label}</span>
                          <span className="text-[10px] text-slate-400 font-mono">Aa</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">CSS Theme Overrides (Developer Console)</label>
                    <textarea
                      rows={4}
                      value={customCss}
                      onChange={(e) => setCustomCss(e.target.value)}
                      placeholder="e.g. :root { --border-radius: 8px; } .card { box-shadow: none; }"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: FACILITIES */}
              {activeSettingsTab === 'facilities' && isAdmin && (
                <div className="space-y-5 animate-fade-slide-up">
                  <div className="space-y-1 border-b pb-3 mb-4 flex items-center gap-2">
                    <Building className="w-5 h-5 text-slate-500" />
                    <span className="font-bold text-slate-800 text-sm">Clinic Facility Profile</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Sickbay Address / Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={clinicAddress}
                        onChange={(e) => setClinicAddress(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Clinic Support Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                          type="email"
                          value={clinicEmail}
                          onChange={(e) => setClinicEmail(e.target.value)}
                          className="w-full pl-9 pr-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Clinic Phone Hotline</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={clinicPhone}
                          onChange={(e) => setClinicPhone(e.target.value)}
                          className="w-full pl-9 pr-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Active Sickbay Beds Capacity</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={clinicBeds}
                      onChange={(e) => setClinicBeds(parseInt(e.target.value) || 2)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                      required
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: ALERTS */}
              {activeSettingsTab === 'alerts' && isAdmin && (
                <div className="space-y-5 animate-fade-slide-up">
                  <div className="space-y-1 border-b pb-3 mb-4 flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-slate-500" />
                    <span className="font-bold text-slate-800 text-sm">Clinic Safety Alert Thresholds</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Pharmacy Low Stock Warning Trigger (Count)</label>
                    <input
                      type="number"
                      min={1}
                      value={lowStockLimit}
                      onChange={(e) => setLowStockLimit(parseInt(e.target.value) || 20)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                      required
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block leading-normal">
                      When drug quantities in pharmacy inventory drop below this level, they trigger dashboard alerts.
                    </span>
                  </div>
                </div>
              )}

              {/* TAB 4: CLOUD SYNC */}
              {activeSettingsTab === 'cloud' && isAdmin && (
                <div className="space-y-5 animate-fade-slide-up">
                  <div className="space-y-1 border-b pb-3 mb-4 flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-slate-500" />
                    <span className="font-bold text-slate-800 text-sm">Cloud Synchronization Options</span>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-xl bg-slate-50/50">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Enable Background Cloud Sync</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">Enables multiple workers to read/write concurrently from separate browsers.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={cloudSyncEnabled} 
                        onChange={(e) => {
                          const val = e.target.checked;
                          setCloudSyncEnabled(val);
                          if (val && !cloudSyncToken) {
                            // Generate random token if missing
                            const tok = `pulse_sync_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;
                            setCloudSyncToken(tok);
                          }
                        }}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  {cloudSyncEnabled && (
                    <div className="space-y-4 animate-fade-slide-up">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Cloud Sync Bucket Token</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={cloudSyncToken}
                            onChange={(e) => setCloudSyncToken(e.target.value)}
                            className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-primary"
                            placeholder="pulse_sync_xxxxxxxxxxxx"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(cloudSyncToken);
                              alert('Sync Token copied to clipboard! Paste this in settings on another worker\'s screen.');
                            }}
                            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold"
                          >
                            Copy
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1.5 block leading-normal">
                          Provide this token to other nurses or doctors to link their local browsers. Sync updates periodically in the background.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Submit button */}
              <div className="pt-4 border-t flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-primary/25"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Settings Profile</span>
                </button>
              </div>

            </form>
          </div>
        </div>

        {/* Live CSS Preview Panel Column (Admins only) */}
        {isAdmin && (
          <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-[450px]">
            <div className="border-b pb-2">
              <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">Sickbay Preview Portal</span>
              <p className="text-[10px] text-slate-400 mt-0.5">Live mockup styling preview</p>
            </div>

            {/* Theme preview Box */}
            <div className="p-4 rounded-xl border border-slate-200 space-y-4 text-xs font-semibold flex-1 flex flex-col justify-center bg-slate-50/50 my-4 overflow-hidden">
              
              {/* Mock Header */}
              <div className="flex items-center gap-2 bg-white p-3 border rounded-xl shadow-xs">
                {logo ? (
                  <img src={logo} alt="Preview Logo" className="w-8 h-8 object-contain bg-white rounded border p-0.5" />
                ) : (
                  <div 
                    className="w-8 h-8 rounded text-white flex items-center justify-center font-bold text-xs"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {name.charAt(0) || 'P'}
                  </div>
                )}
                <div className="min-w-0">
                  <span className="text-slate-800 font-bold block truncate max-w-[140px]">{name || 'Greenwood'}</span>
                  <span className="text-[9px] text-slate-400 block font-normal tracking-wide">
                    Capacity: {clinicBeds} Bed{clinicBeds > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Mock Buttons */}
              <div className="space-y-2">
                <button
                  type="button"
                  className="w-full py-2 text-white font-bold rounded-lg transition text-[11px] shadow-sm"
                  style={{ backgroundColor: primaryColor }}
                >
                  Log New Sickbay Visit
                </button>
                
                <button
                  type="button"
                  className="w-full py-2 text-white font-bold rounded-lg transition text-[11px]"
                  style={{ backgroundColor: secondaryColor }}
                >
                  Dispense Prescription
                </button>
              </div>

              {/* Mock Font Preview */}
              <div className="p-2.5 bg-white border border-slate-100 rounded-lg text-center">
                <span className="text-[10px] text-slate-400 block font-normal">Active Typography:</span>
                <span className="text-xs text-slate-800 font-bold block mt-0.5 capitalize">
                  {fontPreset} Font
                </span>
              </div>

            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[10px] text-slate-400 leading-relaxed flex gap-2">
              <Info className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <div>
                <strong>Instant Style Updates:</strong>
                <p className="mt-0.5 text-slate-500">
                  Custom palettes, font loaders, and CSS overrides are applied in real-time onto root elements.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
