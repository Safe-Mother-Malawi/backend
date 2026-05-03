import { Injectable, Logger } from '@nestjs/common';
import { IVR_MESSAGES, IvrLanguage, IvrMessages } from '../config/ivr-messages.i18n';

/**
 * IVR Language Service
 * Manages multi-language support for IVR messages
 */
@Injectable()
export class IvrLanguageService {
  private readonly logger = new Logger(IvrLanguageService.name);
  private readonly supportedLanguages: IvrLanguage[] = ['en', 'ny'];
  private readonly defaultLanguage: IvrLanguage = 'en';

  /**
   * Get message in specified language
   */
  getMessage(key: keyof IvrMessages, language?: IvrLanguage): string {
    const lang = this.validateLanguage(language);
    const messages = IVR_MESSAGES[lang];
    
    if (!messages[key]) {
      this.logger.warn(`Message key not found: ${key} for language: ${lang}`);
      // Fallback to English
      return IVR_MESSAGES['en'][key] || `[Missing: ${key}]`;
    }
    
    return messages[key];
  }

  /**
   * Get multiple messages at once
   */
  getMessages(keys: (keyof IvrMessages)[], language?: IvrLanguage): Record<string, string> {
    const lang = this.validateLanguage(language);
    const result: Record<string, string> = {};
    
    keys.forEach(key => {
      result[key] = this.getMessage(key, lang);
    });
    
    return result;
  }

  /**
   * Get all messages for a language
   */
  getAllMessages(language?: IvrLanguage): IvrMessages {
    const lang = this.validateLanguage(language);
    return IVR_MESSAGES[lang];
  }

  /**
   * Validate and normalize language code
   */
  validateLanguage(language?: IvrLanguage): IvrLanguage {
    if (!language) {
      return this.defaultLanguage;
    }
    
    if (!this.supportedLanguages.includes(language)) {
      this.logger.warn(`Unsupported language: ${language}. Using default: ${this.defaultLanguage}`);
      return this.defaultLanguage;
    }
    
    return language;
  }

  /**
   * Get list of supported languages
   */
  getSupportedLanguages(): IvrLanguage[] {
    return this.supportedLanguages;
  }

  /**
   * Get language metadata
   */
  getLanguageMetadata(): Record<IvrLanguage, { name: string; nativeName: string; code: string }> {
    return {
      en: { name: 'English', nativeName: 'English', code: 'en' },
      ny: { name: 'Chichewa', nativeName: 'Chichewa', code: 'ny' },
    };
  }

  /**
   * Detect language from phone number or caller info
   * In production, this could use caller location, patient profile, etc.
   */
  detectLanguage(callerPhone?: string, patientLanguagePreference?: IvrLanguage): IvrLanguage {
    // If patient has a language preference, use it
    if (patientLanguagePreference && this.supportedLanguages.includes(patientLanguagePreference)) {
      return patientLanguagePreference;
    }
    
    // Default to English for now
    // In production, could use:
    // - Caller location/district to determine language
    // - Patient profile language preference
    // - Caller's previous IVR language choice
    return this.defaultLanguage;
  }
}
