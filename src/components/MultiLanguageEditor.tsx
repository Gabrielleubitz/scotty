import React, { useState, useEffect } from 'react';
import { Globe, Wand2, Check, AlertCircle, Loader, Key } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { RichTextEditor } from './RichTextEditor';
import { LanguageSettings } from '../types';
import { getLanguageByCode, getLanguageFlag } from '../lib/languages';
import { TranslationService } from '../lib/translation';

interface MultiLanguageEditorProps {
  title: string;
  content: string;
  translations: { [languageCode: string]: { title: string; content: string; isAIGenerated?: boolean } };
  languageSettings: LanguageSettings;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  onTranslationsChange: (translations: { [languageCode: string]: { title: string; content: string; isAIGenerated?: boolean } }) => void;
}

export const MultiLanguageEditor: React.FC<MultiLanguageEditorProps> = ({
  title,
  content,
  translations,
  languageSettings,
  onTitleChange,
  onContentChange,
  onTranslationsChange,
}) => {
  const [activeLanguage, setActiveLanguage] = useState(languageSettings.defaultLanguage);
  const [translatingLanguage, setTranslatingLanguage] = useState<string | null>(null);
  const [translationService, setTranslationService] = useState<TranslationService | null>(null);
  const [showApiKeyWarning, setShowApiKeyWarning] = useState(false);

  useEffect(() => {
    // Only initialize translation service if API key is configured
    if (languageSettings.translationApiKey && languageSettings.translationApiKey.trim()) {
      setTranslationService(new TranslationService(languageSettings));
      setShowApiKeyWarning(false);
    } else {
      setTranslationService(null);
      setShowApiKeyWarning(true);
    }
  }, [languageSettings]);

  const handleTranslate = async (targetLanguage: string) => {
    if (!translationService) {
      console.error('❌ Translation service not available - API key required');
      return;
    }

    if (!title.trim() && !content.trim()) {
      console.error('❌ No content to translate');
      return;
    }

    console.log('🚀 REAL TRANSLATION STARTED');
    console.log('Target language:', targetLanguage);
    console.log('Translation service:', languageSettings.translationService);
    
    setTranslatingLanguage(targetLanguage);

    try {
      let translatedTitle = '';
      let translatedContent = '';
      
      // Translate title if it exists
      if (title && title.trim()) {
        console.log('🔄 Translating title with', languageSettings.translationService);
        translatedTitle = await translationService.translateText(title.trim(), targetLanguage, languageSettings.defaultLanguage);
        console.log('✅ Title translated successfully');
      }
      
      // Translate content if it exists
      if (content && content.trim()) {
        console.log('🔄 Translating content with', languageSettings.translationService);
        translatedContent = await translationService.translateText(content, targetLanguage, languageSettings.defaultLanguage);
        console.log('✅ Content translated successfully');
      }
      
      const newTranslations = {
        ...translations,
        [targetLanguage]: {
          title: translatedTitle,
          content: translatedContent,
          isAIGenerated: true,
        },
      };

      console.log('✅ REAL TRANSLATION COMPLETED');
      
      onTranslationsChange(newTranslations);
      
      // Switch to translated language
      setTimeout(() => {
        setActiveLanguage(targetLanguage);
      }, 100);
    } catch (error) {
      console.error('❌ Translation failed:', error);
      // Show error to user but don't fall back to mock data
      alert(`Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your API key and try again.`);
    } finally {
      setTranslatingLanguage(null);
    }
  };

  const handleTranslationEdit = (languageCode: string, field: 'title' | 'content', value: string) => {
    const newTranslations = {
      ...translations,
      [languageCode]: {
        ...translations[languageCode],
        [field]: value,
        isAIGenerated: false, // Mark as manually edited
      },
    };
    onTranslationsChange(newTranslations);
  };

  const getCurrentTitle = () => {
    if (activeLanguage === languageSettings.defaultLanguage) {
      return title;
    }
    return translations[activeLanguage]?.title || '';
  };

  const getCurrentContent = () => {
    if (activeLanguage === languageSettings.defaultLanguage) {
      return content;
    }
    return translations[activeLanguage]?.content || '';
  };

  const handleCurrentTitleChange = (value: string) => {
    if (activeLanguage === languageSettings.defaultLanguage) {
      onTitleChange(value);
    } else {
      handleTranslationEdit(activeLanguage, 'title', value);
    }
  };

  const handleCurrentContentChange = (value: string) => {
    if (activeLanguage === languageSettings.defaultLanguage) {
      onContentChange(value);
    } else {
      handleTranslationEdit(activeLanguage, 'content', value);
    }
  };

  const isLanguageEmpty = (languageCode: string) => {
    if (languageCode === languageSettings.defaultLanguage) {
      return !title?.trim() || !content?.trim();
    }
    const translation = translations[languageCode];
    return !translation || !translation.title?.trim() || !translation.content?.trim();
  };

  const isAIGenerated = (languageCode: string) => {
    return translations[languageCode]?.isAIGenerated || false;
  };

  return (
    <div className="space-y-6">
      {/* Language Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-1 overflow-x-auto">
          {languageSettings.enabledLanguages.map((languageCode) => {
            const language = getLanguageByCode(languageCode);
            const isEmpty = isLanguageEmpty(languageCode);
            const isDefault = languageCode === languageSettings.defaultLanguage;
            const isTranslating = translatingLanguage === languageCode;
            const isGenerated = isAIGenerated(languageCode);

            return (
              <button
                key={languageCode}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActiveLanguage(languageCode);
                }}
                className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeLanguage === languageCode
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                type="button"
              >
                <span className="text-base">{getLanguageFlag(languageCode)}</span>
                <span>{language?.name || languageCode.toUpperCase()}</span>
                
                {isDefault && (
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    Default
                  </span>
                )}
                
                {!isDefault && !isEmpty && (
                  <Check size={14} className="text-green-600" />
                )}
                
                {!isDefault && isEmpty && (
                  <div className="w-2 h-2 bg-gray-300 rounded-full" />
                )}
                
                {isGenerated && (
                  <Wand2 size={14} className="text-purple-600" title="AI Generated" />
                )}
                
                {isTranslating && (
                  <Loader size={14} className="text-blue-600 animate-spin" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* API Key Warning */}
      {showApiKeyWarning && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Key className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-900 mb-1">Translation API Key Required</h4>
              <p className="text-sm text-red-800 mb-2">
                To use the auto-translate feature, you need to configure a translation API key in the Language Settings.
              </p>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Go to Admin Dashboard → Languages button</li>
                <li>• Select your preferred translation service (OpenAI, Google, or DeepL)</li>
                <li>• Enter your API key and save settings</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Translation Status */}
      {activeLanguage !== languageSettings.defaultLanguage && (
        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Globe size={20} className="text-gray-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                Editing {getLanguageByCode(activeLanguage)?.name} translation
              </p>
              {isAIGenerated(activeLanguage) && (
                <p className="text-xs text-purple-600 flex items-center space-x-1">
                  <Wand2 size={12} />
                  <span>AI-generated content (you can edit it)</span>
                </p>
              )}
            </div>
          </div>
          
          {isLanguageEmpty(activeLanguage) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTranslate(activeLanguage)}
              loading={translatingLanguage === activeLanguage}
              disabled={(!title.trim() && !content.trim()) || showApiKeyWarning}
              title={(!title.trim() && !content.trim()) ? 'Please add title and content to translate' : 'Translate both title and content'}
            >
              <Wand2 size={16} className="mr-2" />
              Auto-Translate
            </Button>
          )}
          
          {!isLanguageEmpty(activeLanguage) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTranslate(activeLanguage)}
              loading={translatingLanguage === activeLanguage}
              disabled={(!title.trim() && !content.trim()) || showApiKeyWarning}
              title="Re-translate both title and content"
            >
              <Wand2 size={16} className="mr-2" />
              Re-translate
            </Button>
          )}
        </div>
      )}

      {/* Content Editor */}
      <div className="space-y-4">
        <Input
          label="Title"
          value={getCurrentTitle()}
          onChange={(e) => handleCurrentTitleChange(e.target.value)}
          required
          className="text-lg font-medium"
          placeholder={`Enter title in ${getLanguageByCode(activeLanguage)?.name}...`}
        />
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content
          </label>
          <RichTextEditor
            value={getCurrentContent()}
            onChange={handleCurrentContentChange}
            placeholder={`Write your content in ${getLanguageByCode(activeLanguage)?.name}...`}
          />
        </div>
      </div>

      {/* Translation Help */}
      {activeLanguage === languageSettings.defaultLanguage && languageSettings.enabledLanguages.length > 1 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900 mb-1">Translation Tips</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Complete your content in {getLanguageByCode(languageSettings.defaultLanguage)?.name} first</li>
                <li>• Configure your translation API key in Language Settings</li>
                <li>• Switch to other language tabs and use "Auto-Translate" for AI translations</li>
                <li>• Review and edit AI translations to ensure accuracy and tone</li>
                <li>• Empty languages will fall back to the default language for users</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};