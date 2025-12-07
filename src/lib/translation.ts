import { LanguageSettings } from '../types';

export class TranslationService {
  private settings: LanguageSettings;

  constructor(settings: LanguageSettings) {
    this.settings = settings;
  }

  async translateText(text: string, targetLanguage: string, sourceLanguage: string = 'en'): Promise<string> {
    if (!this.settings.translationApiKey) {
      throw new Error('Translation API key not configured');
    }

    switch (this.settings.translationService) {
      case 'openai':
        return this.translateWithOpenAI(text, targetLanguage, sourceLanguage);
      case 'google':
        return this.translateWithGoogle(text, targetLanguage, sourceLanguage);
      case 'deepl':
        return this.translateWithDeepL(text, targetLanguage, sourceLanguage);
      default:
        throw new Error('Unsupported translation service');
    }
  }

  private async translateWithOpenAI(text: string, targetLanguage: string, sourceLanguage: string): Promise<string> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.settings.translationApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are a professional translator. Translate the following text from ${sourceLanguage} to ${targetLanguage}. Maintain the original formatting, tone, and meaning. If the text contains HTML tags, preserve them exactly. Only return the translated text, nothing else.`
            },
            {
              role: 'user',
              content: text
            }
          ],
          temperature: 0.3,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || text;
    } catch (error) {
      console.error('OpenAI translation error:', error);
      throw new Error('Translation failed with OpenAI');
    }
  }

  private async translateWithGoogle(text: string, targetLanguage: string, sourceLanguage: string): Promise<string> {
    try {
      const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${this.settings.translationApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: sourceLanguage,
          target: targetLanguage,
          format: 'html',
        }),
      });

      if (!response.ok) {
        throw new Error(`Google Translate API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data.translations[0]?.translatedText || text;
    } catch (error) {
      console.error('Google Translate error:', error);
      throw new Error('Translation failed with Google Translate');
    }
  }

  private async translateWithDeepL(text: string, targetLanguage: string, sourceLanguage: string): Promise<string> {
    try {
      const response = await fetch('https://api-free.deepl.com/v2/translate', {
        method: 'POST',
        headers: {
          'Authorization': `DeepL-Auth-Key ${this.settings.translationApiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          text: text,
          source_lang: sourceLanguage.toUpperCase(),
          target_lang: targetLanguage.toUpperCase(),
          tag_handling: 'html',
        }),
      });

      if (!response.ok) {
        throw new Error(`DeepL API error: ${response.status}`);
      }

      const data = await response.json();
      return data.translations[0]?.text || text;
    } catch (error) {
      console.error('DeepL translation error:', error);
      throw new Error('Translation failed with DeepL');
    }
  }
}