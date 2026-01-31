/**
 * Greek language helpers for the parking violation reporter
 */

// Greek phonetic alphabet for spelling names
const greekAlphabet = {
  'Α': 'Άλφα', 'Β': 'Βήτα', 'Γ': 'Γάμμα', 'Δ': 'Δέλτα', 'Ε': 'Έψιλον',
  'Ζ': 'Ζήτα', 'Η': 'Ήτα', 'Θ': 'Θήτα', 'Ι': 'Ιώτα', 'Κ': 'Κάππα',
  'Λ': 'Λάμδα', 'Μ': 'Μι', 'Ν': 'Νι', 'Ξ': 'Ξι', 'Ο': 'Όμικρον',
  'Π': 'Πι', 'Ρ': 'Ρο', 'Σ': 'Σίγμα', 'Τ': 'Ταυ', 'Υ': 'Ύψιλον',
  'Φ': 'Φι', 'Χ': 'Χι', 'Ψ': 'Ψι', 'Ω': 'Ωμέγα'
};

// Common Greek car colors
const colorTranslations = {
  'white': 'λευκό',
  'black': 'μαύρο',
  'silver': 'ασημί',
  'gray': 'γκρι',
  'grey': 'γκρι',
  'red': 'κόκκινο',
  'blue': 'μπλε',
  'green': 'πράσινο',
  'yellow': 'κίτρινο',
  'orange': 'πορτοκαλί',
  'brown': 'καφέ',
  'beige': 'μπεζ',
  'gold': 'χρυσό',
  'bronze': 'μπρονζέ'
};

// Time-based greeting
function getGreekGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) {
    return 'Καλημέρα';
  } else if (hour < 17) {
    return 'Καλημέρα'; // Greeks often say καλημέρα until evening
  } else {
    return 'Καλησπέρα';
  }
}

// Spell out a name using Greek phonetic alphabet
function spellGreekName(name) {
  const upperName = name.toUpperCase();
  const letters = [];

  for (const char of upperName) {
    if (greekAlphabet[char]) {
      letters.push(greekAlphabet[char]);
    } else if (/[A-Z]/.test(char)) {
      // Latin letters - spell as is
      letters.push(char);
    }
  }

  return letters.join(', ');
}

// Spell out a license plate
function spellLicensePlate(plate) {
  if (!plate) return null;

  const cleanPlate = plate.toUpperCase().replace(/\s/g, '');
  const parts = [];

  for (const char of cleanPlate) {
    if (greekAlphabet[char]) {
      parts.push(greekAlphabet[char]);
    } else if (/[A-Z]/.test(char)) {
      parts.push(char);
    } else if (/[0-9]/.test(char)) {
      parts.push(getGreekNumber(parseInt(char)));
    } else if (char === '-') {
      parts.push('παύλα');
    }
  }

  return parts.join(', ');
}

// Greek numbers (0-9)
function getGreekNumber(num) {
  const numbers = ['μηδέν', 'ένα', 'δύο', 'τρία', 'τέσσερα', 'πέντε', 'έξι', 'επτά', 'οκτώ', 'εννέα'];
  return numbers[num] || num.toString();
}

// Translate color to Greek
function translateColor(color) {
  if (!color) return null;
  const lowerColor = color.toLowerCase().trim();
  return colorTranslations[lowerColor] || color;
}

// Format phone number for speech
function formatPhoneForSpeech(phone) {
  if (!phone) return '';

  // Remove non-digits
  const digits = phone.replace(/\D/g, '');

  // Format as groups for easier speech
  const groups = [];
  for (let i = 0; i < digits.length; i += 2) {
    groups.push(digits.slice(i, i + 2));
  }

  return groups.join(' ');
}

// Authority names in Greek
const authorityNames = {
  'trochia': 'Τροχαία',
  'dimotiki': 'Δημοτική Αστυνομία',
  'traffic_police': 'Τροχαία',
  'municipal_police': 'Δημοτική Αστυνομία'
};

function getAuthorityName(type) {
  return authorityNames[type] || type;
}

// Blocked numbers - emergency services that should NOT be called for parking
const blockedNumbers = [
  '100',      // Άμεση Δράση (Emergency)
  '166',      // ΕΚΑΒ (Ambulance)
  '199',      // Πυροσβεστική (Fire)
  '112',      // European Emergency
  '1571',     // Coast Guard
  '+30100',
  '+30166',
  '+30199',
  '+30112'
];

function isBlockedNumber(number) {
  const cleanNumber = number.replace(/\s/g, '');
  return blockedNumbers.some(blocked =>
    cleanNumber === blocked ||
    cleanNumber.endsWith(blocked) ||
    cleanNumber.replace('+30', '') === blocked
  );
}

// Validation helpers
function isValidGreekPhone(phone) {
  // Greek numbers: +30 followed by 10 digits, or 10 digits starting with 2 or 6/7
  const cleanPhone = phone.replace(/[\s-]/g, '');
  const greekPattern = /^(\+30)?[267]\d{9}$/;
  return greekPattern.test(cleanPhone);
}

function isValidGreekPlate(plate) {
  if (!plate) return true; // Optional field
  // Greek plates: 3 letters + 4 digits (e.g., ΑΒΓ 1234)
  const cleanPlate = plate.toUpperCase().replace(/[\s-]/g, '');
  const platePattern = /^[ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩABCDEFGHIJKLMNOPQRSTUVWXYZ]{3}\d{4}$/;
  return platePattern.test(cleanPlate);
}

module.exports = {
  getGreekGreeting,
  spellGreekName,
  spellLicensePlate,
  getGreekNumber,
  translateColor,
  formatPhoneForSpeech,
  getAuthorityName,
  isBlockedNumber,
  isValidGreekPhone,
  isValidGreekPlate,
  greekAlphabet,
  colorTranslations
};
