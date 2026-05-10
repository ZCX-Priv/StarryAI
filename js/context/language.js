const Language = {
  LANG_NAMES: {
    pt:'Portuguese (Brazilian)', en:'English', es:'Spanish', fr:'French',
    de:'German', it:'Italian', ja:'Japanese', zh:'Chinese (Simplified)', ko:'Korean', ru:'Russian'
  },

  hasLanguagePreference() {
    return state.memory.some(m =>
      /\b(language|idioma|l[íi]ngua|sprache|langue|lingua|言語|语言|언어|язык|prefer.*speak|speak.*prefer|fala|gosta.*escrever)\b/i.test(m)
    );
  },

  getLanguageName() {
    return this.LANG_NAMES[state.lang] || 'English';
  }
};
