import React, { useState, useEffect } from 'react';
import { Globe, Settings, Key, Check, AlertCircle } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { LanguageSettings as LanguageSettingsType } from '../types';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE_SETTINGS, getLanguageByCode } from '../lib/languages';
import { apiService } from '../lib/api';

interface LanguageSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  settings: LanguageSettingsType;
  onSettingsChange: (settings: LanguageSettingsType) => void;
}

export const LanguageSettings: React.FC<LanguageSettingsProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
}) => {
  const [formData, setFormData] = useState<LanguageSettingsType>(settings);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await apiService.saveLanguageSettings(formData);
      onSettingsChange(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save language settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageToggle = (languageCode: string) => {
    const enabledLanguages = formData.enabledLanguages.includes(languageCode)
      ? formData.enabledLanguages.filter(code => code !== languageCode)
      : [...formData.enabledLanguages, languageCode];
    
    // Ensure default language is always enabled
    if (!enabledLanguages.includes(formData.defaultLanguage)) {
      enabledLanguages.push(formData.defaultLanguage);
    }
    
    setFormData({ ...formData, enabledLanguages });
  };

  const handleDefaultLanguageChange = (languageCode: string) => {
    const enabledLanguages = formData.enabledLanguages.includes(languageCode)
      ? formData.enabledLanguages
      : [...formData.enabledLanguages, languageCode];
    
    setFormData({ 
      ...formData, 
      defaultLanguage: languageCode,
      enabledLanguages 
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Language Settings" size="lg">
      <div className="space-y-6">
        {/* Header Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Globe className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-1">Multilingual Content</h3>
              <p className="text-sm text-blue-800">
                Configure supported languages for your changelog widget. Users will automatically see content in their preferred language.
              </p>
            </div>
          </div>
        </div>

        {/* Default Language */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Default Language
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {SUPPORTED_LANGUAGES.slice(0, 6).map((language) => (
              <button
                key={language.code}
                onClick={() => handleDefaultLanguageChange(language.code)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  formData.defaultLanguage === language.code
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{language.flag}</span>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">{language.name}</p>
                    <p className="text-xs text-gray-500">{language.nativeName}</p>
                  </div>
                  {formData.defaultLanguage === language.code && (
                    <Check size={16} className="text-blue-600 ml-auto" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Enabled Languages */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Enabled Languages
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
            {SUPPORTED_LANGUAGES.map((language) => (
              <label
                key={language.code}
                className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={formData.enabledLanguages.includes(language.code)}
                  onChange={() => handleLanguageToggle(language.code)}
                  disabled={language.code === formData.defaultLanguage}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                />
                <span className="text-lg mr-3">{language.flag}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{language.name}</p>
                  <p className="text-xs text-gray-500">{language.nativeName}</p>
                </div>
                {language.code === formData.defaultLanguage && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    Default
                  </span>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Translation Service */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            AI Translation Service
          </label>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'openai', name: 'OpenAI', description: 'GPT-powered translation' },
                { value: 'google', name: 'Google Translate', description: 'Google Cloud Translation' },
                { value: 'deepl', name: 'DeepL', description: 'Professional translation' },
              ].map((service) => (
                <button
                  key={service.value}
                  onClick={() => setFormData({ ...formData, translationService: service.value as any })}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    formData.translationService === service.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-900">{service.name}</p>
                  <p className="text-xs text-gray-500">{service.description}</p>
                  {formData.translationService === service.value && (
                    <Check size={16} className="text-blue-600 mt-2" />
                  )}
                </button>
              ))}
            </div>

            <Input
              label="Translation API Key"
              type="password"
              value={formData.translationApiKey || ''}
              onChange={(e) => setFormData({ ...formData, translationApiKey: e.target.value })}
              placeholder="Enter your API key for the selected service"
            />
          </div>
        </div>

        {/* Usage Information */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800 mb-2">How it works</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Users see content in their browser's preferred language</li>
                <li>• If their language isn't available, they see the default language</li>
                <li>• AI translation helps you quickly create content in multiple languages</li>
                <li>• You can always edit or override AI-generated translations</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={loading}>
            {saved ? (
              <>
                <Check size={16} className="mr-2" />
                Saved!
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};