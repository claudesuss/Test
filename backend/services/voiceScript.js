/**
 * Greek Voice Script Generator for Parking Violation Reports
 *
 * Designed to sound natural and human-like, not robotic
 */

const {
  getGreekGreeting,
  spellGreekName,
  spellLicensePlate,
  translateColor,
  formatPhoneForSpeech,
  getAuthorityName
} = require('../utils/greekHelpers');

/**
 * Generate the main conversation script for the AI voice agent
 */
function generateVoiceScript(profile, vehicleDetails = {}) {
  const greeting = getGreekGreeting();
  const hasVehicleDetails = vehicleDetails.plate || vehicleDetails.color || vehicleDetails.make_model;

  // Build the task prompt for Bland.ai
  const script = {
    // System prompt that defines the AI's behavior - HUMAN-LIKE
    systemPrompt: generateHumanLikeSystemPrompt(profile),

    // The structured conversation flow
    conversationFlow: generateConversationFlow(profile, vehicleDetails, greeting),

    // Key phrases the AI should know how to handle
    responseHandlers: generateResponseHandlers(profile, vehicleDetails),

    // The full narrative script (for reference)
    fullScript: generateFullNarrativeScript(profile, vehicleDetails, greeting)
  };

  return script;
}

/**
 * Generate a system prompt that makes the AI sound human
 */
function generateHumanLikeSystemPrompt(profile) {
  return `You are ${profile.full_name}, a real person calling to report a parking violation in Greece. You are NOT a robot or AI assistant - you are a frustrated but polite citizen.

PERSONALITY & VOICE:
- You are mildly frustrated because someone blocked your driveway, but you remain polite
- You speak natural, conversational Greek - not formal or robotic
- You occasionally use filler words like "εεε", "λοιπόν", "δηλαδή", "κοιτάξτε"
- You sometimes pause briefly to "think" or "remember" details
- You speak at a natural pace, not too fast, not too slow
- You sound like a normal person, not a recorded message

SPEAKING STYLE:
- Use contractions and casual language where appropriate
- Add slight hesitations: "Η διεύθυνση είναι... εεε... ${profile.address}"
- React naturally to what the operator says: "Α, μάλιστα", "Ναι, ακριβώς", "Σωστά"
- Show mild emotion: "Κοιτάξτε, έχω κλείσει μέσα και πρέπει να πάω στη δουλειά"
- If you need to repeat something, phrase it slightly differently each time

IMPORTANT:
- Never say you are an AI, bot, or automated system
- Never use overly formal or bureaucratic language
- Sound like you're having a real phone conversation
- React to what the operator says, don't just read a script
- If the operator interrupts, stop and listen
- Show understanding: "Καταλαβαίνω", "Εντάξει", "Α, μάλιστα"`;
}

/**
 * Generate the structured conversation flow - more natural
 */
function generateConversationFlow(profile, vehicleDetails, greeting) {
  const hasPlate = vehicleDetails.plate && vehicleDetails.plate.trim();
  const hasColor = vehicleDetails.color && vehicleDetails.color.trim();
  const hasMakeModel = vehicleDetails.make_model && vehicleDetails.make_model.trim();
  const hasAnyVehicleInfo = hasPlate || hasColor || hasMakeModel;

  const color = hasColor ? translateColor(vehicleDetails.color) : null;

  return [
    {
      step: 'greeting',
      text: `${greeting} σας. Εεε, θέλω να αναφέρω ένα παράνομα παρκαρισμένο αυτοκίνητο, αν μπορείτε να με βοηθήσετε.`,
      waitForResponse: true
    },
    {
      step: 'identification',
      text: `Ναι, βεβαίως. Λοιπόν, με λένε ${profile.full_name}, και μπορείτε να με καλέσετε στο ${formatPhoneForSpeech(profile.phone_number)}.`,
      waitForResponse: true
    },
    {
      step: 'location',
      text: `Κοιτάξτε, είμαι στην... ${profile.address}. Έχει παρκάρει κάποιος ακριβώς μπροστά στο γκαράζ μου και δεν μπορώ να βγάλω το αυτοκίνητό μου. Έχω κλείσει μέσα, δηλαδή.`,
      waitForResponse: true
    },
    {
      step: 'vehicle_details',
      text: hasAnyVehicleInfo
        ? buildNaturalVehicleDescription(vehicleDetails, color)
        : 'Εεε, δεν πρόλαβα να δω την πινακίδα δυστυχώς. Βγήκα βιαστικά να δω τι έγινε.',
      waitForResponse: true
    },
    {
      step: 'request',
      text: 'Υπάρχει περίπτωση να στείλετε κάποιον να το δει; Ή τι μπορώ να κάνω; Γιατί πρέπει να φύγω για δουλειά.',
      waitForResponse: true
    },
    {
      step: 'closing',
      text: `Ωραία, ευχαριστώ πολύ για τη βοήθεια. Το τηλέφωνό μου πάλι είναι ${formatPhoneForSpeech(profile.phone_number)}, αν χρειαστεί κάτι. Ευχαριστώ, γεια σας.`,
      waitForResponse: false
    }
  ];
}

/**
 * Build natural vehicle description
 */
function buildNaturalVehicleDescription(vehicleDetails, translatedColor) {
  const parts = [];

  // Start with a natural intro
  let description = 'Ναι, κοιτάξτε, είναι ένα ';

  if (translatedColor) {
    parts.push(translatedColor);
  }

  if (vehicleDetails.make_model) {
    parts.push(vehicleDetails.make_model);
  }

  if (parts.length > 0) {
    description += parts.join(' ');
  } else {
    description += 'αυτοκίνητο';
  }

  if (vehicleDetails.plate) {
    description += `... εεε, η πινακίδα είναι ${vehicleDetails.plate}`;
  }

  description += '.';

  return description;
}

/**
 * Generate response handlers for common operator questions - more natural
 */
function generateResponseHandlers(profile, vehicleDetails) {
  const spelledName = spellGreekName(profile.full_name);
  const spelledPlate = vehicleDetails.plate ? spellLicensePlate(vehicleDetails.plate) : null;

  return {
    // If asked to repeat name
    repeatName: {
      triggers: ['όνομα', 'ονοματεπώνυμο', 'πώς λέγεστε', 'ποιος είστε', 'πώς είπατε'],
      response: `${profile.full_name}. Να το συλλαβίσω; ${spelledName}.`
    },

    // If asked to repeat address
    repeatAddress: {
      triggers: ['διεύθυνση', 'πού είναι', 'τοποθεσία', 'δρόμο', 'πού ακριβώς'],
      response: `Ναι, είμαι στην ${profile.address}. Ακριβώς μπροστά στην είσοδο του γκαράζ.`
    },

    // If asked to repeat phone
    repeatPhone: {
      triggers: ['τηλέφωνο', 'αριθμό', 'επικοινωνία', 'νούμερο'],
      response: `Το κινητό μου είναι ${formatPhoneForSpeech(profile.phone_number)}. Να το επαναλάβω;`
    },

    // If asked about license plate
    repeatPlate: {
      triggers: ['πινακίδα', 'πινακίδες', 'αριθμό κυκλοφορίας'],
      response: spelledPlate
        ? `Η πινακίδα είναι ${vehicleDetails.plate}. Δηλαδή: ${spelledPlate}.`
        : 'Δυστυχώς δεν την είδα, βγήκα γρήγορα να δω τι γίνεται και δεν πρόλαβα.'
    },

    // If asked to hold/wait
    hold: {
      triggers: ['περιμένετε', 'μια στιγμή', 'κρατήστε', 'hold', 'μισό λεπτό'],
      response: 'Ναι, βεβαίως, περιμένω.'
    },

    // If asked about timing
    timing: {
      triggers: ['πόση ώρα', 'πότε', 'από πότε', 'πόσο καιρό'],
      response: 'Εεε, τουλάχιστον μισή ώρα το βλέπω εκεί. Ίσως και παραπάνω, δεν ξέρω πότε ακριβώς ήρθε.'
    },

    // If asked if it's an emergency
    emergency: {
      triggers: ['επείγον', 'έκτακτο', 'ανάγκη', 'επείγει'],
      response: 'Όχι, δεν είναι έκτακτο, αλλά πρέπει να πάω στη δουλειά και δεν μπορώ να βγάλω το αμάξι μου.'
    },

    // Confirmation
    confirm: {
      triggers: ['σωστά', 'επιβεβαιώστε', 'σίγουρα', 'έτσι είναι'],
      response: 'Ναι, ακριβώς, σωστά.'
    },

    // Thanks/goodbye
    goodbye: {
      triggers: ['ευχαριστούμε', 'γεια σας', 'αντίο', 'θα επικοινωνήσουμε', 'θα στείλουμε'],
      response: 'Ωραία, ευχαριστώ πάρα πολύ. Γεια σας!'
    },

    // If asked about the owner
    owner: {
      triggers: ['ιδιοκτήτη', 'οδηγό', 'ξέρετε ποιανού', 'γνωρίζετε'],
      response: 'Όχι, δεν ξέρω ποιανού είναι. Δεν το έχω ξαναδεί στη γειτονιά.'
    },

    // If asked to try honking/waiting
    patience: {
      triggers: ['κόρνα', 'περιμένετε λίγο', 'ίσως έρθει'],
      response: 'Κοιτάξτε, έχω ήδη περιμένει αρκετά και πρέπει να φύγω. Δεν υπάρχει κανείς μέσα στο αμάξι.'
    }
  };
}

/**
 * Generate a full narrative script - natural and human-like
 */
function generateFullNarrativeScript(profile, vehicleDetails, greeting) {
  const hasPlate = vehicleDetails.plate && vehicleDetails.plate.trim();
  const color = vehicleDetails.color ? translateColor(vehicleDetails.color) : null;

  let script = `${greeting} σας. Εεε, θέλω να αναφέρω ένα παράνομα παρκαρισμένο αυτοκίνητο. `;
  script += `Με λένε ${profile.full_name}. `;
  script += `Κοιτάξτε, είμαι στην ${profile.address}, και κάποιος έχει παρκάρει ακριβώς μπροστά στο γκαράζ μου. `;
  script += `Δεν μπορώ να βγάλω το αυτοκίνητό μου, έχω κλείσει μέσα δηλαδή. `;

  if (hasPlate || color || vehicleDetails.make_model) {
    script += buildNaturalVehicleDescription(vehicleDetails, color) + ' ';
  } else {
    script += 'Δεν πρόλαβα να δω την πινακίδα δυστυχώς. ';
  }

  script += 'Υπάρχει περίπτωση να στείλετε κάποιον; Πρέπει να φύγω για δουλειά. ';
  script += `Το τηλέφωνό μου είναι ${formatPhoneForSpeech(profile.phone_number)}. Ευχαριστώ πολύ.`;

  return script;
}

/**
 * Generate the Bland.ai task prompt - optimized for natural conversation
 */
function generateBlandTask(profile, vehicleDetails = {}) {
  const script = generateVoiceScript(profile, vehicleDetails);
  const color = vehicleDetails.color ? translateColor(vehicleDetails.color) : null;

  // Bland.ai expects a task description
  const task = `
${script.systemPrompt}

YOUR SITUATION:
You are ${profile.full_name}, and you're calling the ${getAuthorityName(profile.preferred_authority)} because someone parked in front of your garage and you can't get your car out. You're a bit frustrated but polite. You need to go to work.

THE CONVERSATION:
Start naturally: "${script.conversationFlow[0].text}"

Then provide your information conversationally when asked or when appropriate:
- Your name: ${profile.full_name}
- Your phone: ${profile.phone_number}
- Your address: ${profile.address}
${vehicleDetails.plate ? `- The car's plate: ${vehicleDetails.plate}` : '- You didn\'t catch the plate number'}
${color ? `- The car's color: ${color}` : ''}
${vehicleDetails.make_model ? `- The car: ${vehicleDetails.make_model}` : ''}

HOW TO SPEAK:
1. Use natural Greek with occasional filler words: "εεε", "λοιπόν", "δηλαδή", "κοιτάξτε"
2. Pause slightly before giving specific details like addresses or phone numbers
3. React to what the operator says: "Α μάλιστα", "Ναι ακριβώς", "Εντάξει"
4. Show mild frustration but stay polite: "Κοιτάξτε, έχω κλείσει μέσα..."
5. If asked to repeat something, say it slightly differently
6. Sound like a real person on the phone, not a recording

NEVER:
- Say you are an AI or automated system
- Speak in a robotic or monotone way
- Use overly formal or bureaucratic language
- Rush through information without pauses

EXAMPLE NATURAL RESPONSES:
- Instead of "Το τηλέφωνο επικοινωνίας μου είναι..." say "Μπορείτε να με πάρετε στο..."
- Instead of "Η διεύθυνση είναι..." say "Είμαι στην... εεε... [address]"
- Instead of "Ευχαριστώ πολύ, αντίο" say "Ωραία, ευχαριστώ πάρα πολύ. Γεια σας!"
`;

  return task;
}

module.exports = {
  generateVoiceScript,
  generateBlandTask,
  generateConversationFlow,
  generateResponseHandlers,
  generateFullNarrativeScript
};
