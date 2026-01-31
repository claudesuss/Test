/**
 * Greek Voice Script Generator for Parking Violation Reports
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
    // System prompt that defines the AI's behavior
    systemPrompt: `You are a polite Greek citizen calling to report an illegally parked vehicle.
You speak fluent Greek and are calm and respectful throughout the call.
Your goal is to report the violation and provide all necessary information to the operator.
If asked to repeat information, do so clearly.
If asked to hold or wait, respond with "Εντάξει, περιμένω" and wait patiently.
If transferred to another person, greet them and repeat the report.
Always thank the operator at the end of the call.
Do not argue or become confrontational.
If asked questions you don't have answers to, politely say you don't have that information.`,

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
 * Generate the structured conversation flow
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
      text: `${greeting}, σας καλώ για να αναφέρω παράνομη στάθμευση.`,
      waitForResponse: true
    },
    {
      step: 'identification',
      text: `Ονομάζομαι ${profile.full_name} και το τηλέφωνο επικοινωνίας μου είναι ${formatPhoneForSpeech(profile.phone_number)}.`,
      waitForResponse: true
    },
    {
      step: 'location',
      text: `Η διεύθυνση είναι ${profile.address}. Ένα όχημα έχει παρκάρει μπροστά από την είσοδο του γκαράζ μου και εμποδίζει την είσοδο και έξοδο.`,
      waitForResponse: true
    },
    {
      step: 'vehicle_details',
      text: hasAnyVehicleInfo
        ? buildVehicleDescription(vehicleDetails, color)
        : 'Δεν έχω προλάβει να σημειώσω τον αριθμό πινακίδας του οχήματος.',
      waitForResponse: true
    },
    {
      step: 'request',
      text: 'Παρακαλώ να στείλετε περιπολικό ή να με ενημερώσετε για τα επόμενα βήματα που πρέπει να κάνω.',
      waitForResponse: true
    },
    {
      step: 'closing',
      text: `Ευχαριστώ πολύ για τη βοήθειά σας. Το τηλέφωνο επικοινωνίας μου είναι ${formatPhoneForSpeech(profile.phone_number)}. Γεια σας.`,
      waitForResponse: false
    }
  ];
}

/**
 * Build vehicle description text
 */
function buildVehicleDescription(vehicleDetails, translatedColor) {
  const parts = [];

  if (translatedColor) {
    parts.push(translatedColor);
  }

  if (vehicleDetails.make_model) {
    parts.push(vehicleDetails.make_model);
  }

  let description = 'Το όχημα είναι ';

  if (parts.length > 0) {
    description += parts.join(' ');
  }

  if (vehicleDetails.plate) {
    if (parts.length > 0) {
      description += ` με πινακίδες ${vehicleDetails.plate}`;
    } else {
      description += `με πινακίδες ${vehicleDetails.plate}`;
    }
  }

  description += '.';

  return description;
}

/**
 * Generate response handlers for common operator questions
 */
function generateResponseHandlers(profile, vehicleDetails) {
  const spelledName = spellGreekName(profile.full_name);
  const spelledPlate = vehicleDetails.plate ? spellLicensePlate(vehicleDetails.plate) : null;

  return {
    // If asked to repeat name
    repeatName: {
      triggers: ['όνομα', 'ονοματεπώνυμο', 'πώς λέγεστε', 'ποιος είστε'],
      response: `Ονομάζομαι ${profile.full_name}. Αν θέλετε να το συλλαβίσω: ${spelledName}.`
    },

    // If asked to repeat address
    repeatAddress: {
      triggers: ['διεύθυνση', 'πού είναι', 'τοποθεσία', 'δρόμο'],
      response: `Η διεύθυνση είναι ${profile.address}.`
    },

    // If asked to repeat phone
    repeatPhone: {
      triggers: ['τηλέφωνο', 'αριθμό', 'επικοινωνία'],
      response: `Το τηλέφωνο μου είναι ${formatPhoneForSpeech(profile.phone_number)}.`
    },

    // If asked about license plate
    repeatPlate: {
      triggers: ['πινακίδα', 'πινακίδες', 'αριθμό κυκλοφορίας'],
      response: spelledPlate
        ? `Οι πινακίδες είναι ${vehicleDetails.plate}. Αν θέλετε να τις συλλαβίσω: ${spelledPlate}.`
        : 'Δεν έχω προλάβει να σημειώσω τον αριθμό πινακίδας.'
    },

    // If asked to hold/wait
    hold: {
      triggers: ['περιμένετε', 'μια στιγμή', 'κρατήστε', 'hold'],
      response: 'Εντάξει, περιμένω.'
    },

    // If asked about timing
    timing: {
      triggers: ['πόση ώρα', 'πότε', 'από πότε'],
      response: 'Το όχημα είναι παρκαρισμένο εδώ τουλάχιστον μισή ώρα και χρειάζομαι να βγάλω το αυτοκίνητό μου.'
    },

    // If asked if it's an emergency
    emergency: {
      triggers: ['επείγον', 'έκτακτο', 'ανάγκη'],
      response: 'Δεν είναι έκτακτη ανάγκη, αλλά εμποδίζομαι να βγάλω το αυτοκίνητό μου από το γκαράζ.'
    },

    // Confirmation
    confirm: {
      triggers: ['σωστά', 'επιβεβαιώστε', 'σίγουρα'],
      response: 'Ναι, αυτό είναι σωστό.'
    },

    // Thanks/goodbye
    goodbye: {
      triggers: ['ευχαριστούμε', 'γεια σας', 'αντίο', 'θα επικοινωνήσουμε'],
      response: 'Ευχαριστώ πολύ. Γεια σας.'
    }
  };
}

/**
 * Generate a full narrative script (single text block)
 */
function generateFullNarrativeScript(profile, vehicleDetails, greeting) {
  const hasPlate = vehicleDetails.plate && vehicleDetails.plate.trim();
  const color = vehicleDetails.color ? translateColor(vehicleDetails.color) : null;

  let script = `${greeting}, σας καλώ για να αναφέρω παράνομη στάθμευση. `;
  script += `Ονομάζομαι ${profile.full_name} και το τηλέφωνο επικοινωνίας μου είναι ${formatPhoneForSpeech(profile.phone_number)}. `;
  script += `Η διεύθυνση είναι ${profile.address}. `;
  script += `Ένα όχημα έχει παρκάρει μπροστά από την είσοδο του γκαράζ μου και εμποδίζει την είσοδο και έξοδο. `;

  if (hasPlate || color || vehicleDetails.make_model) {
    script += buildVehicleDescription(vehicleDetails, color) + ' ';
  } else {
    script += 'Δεν έχω προλάβει να σημειώσω τον αριθμό πινακίδας του οχήματος. ';
  }

  script += 'Παρακαλώ να στείλετε περιπολικό ή να με ενημερώσετε για τα επόμενα βήματα. ';
  script += `Ευχαριστώ πολύ. Το τηλέφωνο επικοινωνίας μου είναι ${formatPhoneForSpeech(profile.phone_number)}.`;

  return script;
}

/**
 * Generate the Bland.ai task prompt
 */
function generateBlandTask(profile, vehicleDetails = {}) {
  const script = generateVoiceScript(profile, vehicleDetails);

  // Bland.ai expects a task description
  const task = `
${script.systemPrompt}

Your task:
You are calling the ${getAuthorityName(profile.preferred_authority)} to report an illegally parked vehicle.

Follow this script:
${script.fullScript}

Important instructions:
1. Speak clearly and at a moderate pace
2. Wait for the operator to respond before continuing
3. If asked to repeat any information, do so politely
4. If asked to hold or wait, say "Εντάξει, περιμένω" and wait
5. If the operator asks questions, answer based on the information provided
6. If you don't have certain information, say "Δεν έχω αυτή την πληροφορία"
7. Always be polite and thank the operator at the end
8. The call should last no more than 3-4 minutes

Information you know:
- Name: ${profile.full_name}
- Phone: ${profile.phone_number}
- Address: ${profile.address}
${vehicleDetails.plate ? `- License plate: ${vehicleDetails.plate}` : '- License plate: Unknown'}
${vehicleDetails.color ? `- Vehicle color: ${translateColor(vehicleDetails.color)}` : ''}
${vehicleDetails.make_model ? `- Vehicle make/model: ${vehicleDetails.make_model}` : ''}
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
