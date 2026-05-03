/**
 * IVR Messages - Multi-language Support
 * Supports: English, Chichewa
 */

export type IvrLanguage = 'en' | 'ny';

export interface IvrMessages {
  welcome: string;
  mainMenu: string;
  symptomChecker: string;
  prenatalHealth: string;
  babyHealth: string;
  appointmentCheck: string;
  clinicianConnect: string;
  emergency: string;
  invalidOption: string;
  
  // Prenatal questions
  prenatalQ1: string;
  prenatalQ2: string;
  prenatalQ3: string;
  prenatalQ4: string;
  prenatalQ5: string;
  prenatalComplete: string;
  
  // Neonatal questions
  neonatalQ1: string;
  neonatalQ2: string;
  neonatalQ3: string;
  neonatalQ4: string;
  neonatalQ5: string;
  neonatalComplete: string;
  
  // Risk results
  riskAssessmentComplete: string;
  criticalRisk: string;
  highRisk: string;
  moderateRisk: string;
  lowRisk: string;
  returnToMenu: string;
  endCall: string;
  
  // Appointment
  appointmentInfo: string;
  appointmentConfirm: string;
  
  // Health tips
  healthTips: string;
  healthTip1: string;
  healthTip2: string;
  healthTip3: string;
  healthTip4: string;
  healthTip5: string;
  anotherTip: string;
  
  // Emergency
  emergencyContacts: string;
  ambulance: string;
  helpline: string;
  police: string;
  
  // Errors
  errorAssessment: string;
  errorMenu: string;
  calculating: string;
}

export const IVR_MESSAGES: Record<IvrLanguage, IvrMessages> = {
  en: {
    // Welcome & Main Menu
    welcome: 'Welcome to SafeMother Health IVR. Press 1 to continue.',
    mainMenu: 'Welcome to SafeMother Health IVR. Press 1 for Health Assessment. Press 2 for Appointments. Press 3 for Health Tips. Press 4 to Connect to Clinician. Press 0 for Emergency.',
    symptomChecker: 'Health Assessment. Press 1 for Pregnancy Health. Press 2 for Baby Health.',
    prenatalHealth: 'Pregnancy Health Check. Question 1 of 5. How are you feeling today? Press 1 for very well. Press 2 if tired. Press 3 if unwell. Press 4 if in pain.',
    babyHealth: 'Baby Health Check. Question 1 of 5. How is your baby breathing? Press 1 for normal. Press 2 for fast. Press 3 for very fast or noisy.',
    appointmentCheck: 'Checking your next appointment. Please wait.',
    clinicianConnect: 'Connecting you to a clinician. Please wait.',
    emergency: 'Emergency Services. Call 998 for Ambulance. Call 116 for SafeMother Helpline.',
    invalidOption: 'Invalid option. Press 1 for Health Assessment, 2 for Appointments, 3 for Health Tips, 4 for Clinician, 0 for Emergency.',
    
    // Prenatal Questions
    prenatalQ1: 'Question 1 of 5. How are you feeling today? Press 1 for very well. Press 2 if tired. Press 3 if unwell. Press 4 if in pain.',
    prenatalQ2: 'Question 2 of 5. Do you have a headache? Press 1 for no. Press 2 for mild. Press 3 for severe. Press 4 for severe with blurred vision.',
    prenatalQ3: 'Question 3 of 5. Do you have swelling? Press 1 for no. Press 2 for mild feet swelling. Press 3 for hands and face. Press 4 for sudden severe.',
    prenatalQ4: 'Question 4 of 5. Is your baby moving? Press 1 for normal. Press 2 for less than usual. Press 3 for no movement today.',
    prenatalQ5: 'Question 5 of 5. Do you have bleeding or discharge? Press 1 for none. Press 2 for light spotting. Press 3 for heavy. Press 4 for unusual discharge.',
    prenatalComplete: 'Assessment complete. Calculating risk level.',
    
    // Neonatal Questions
    neonatalQ1: 'Question 1 of 5. How is your baby breathing? Press 1 for normal. Press 2 for fast. Press 3 for very fast or noisy.',
    neonatalQ2: 'Question 2 of 5. How is your baby feeding? Press 1 if feeding well. Press 2 if feeding poorly. Press 3 if not feeding.',
    neonatalQ3: 'Question 3 of 5. What is your baby\'s skin colour? Press 1 for normal. Press 2 for pale or yellowish. Press 3 for blue or very yellow.',
    neonatalQ4: 'Question 4 of 5. Does your baby have fever or feel cold? Press 1 for normal. Press 2 for mild fever. Press 3 for high fever or very cold.',
    neonatalQ5: 'Question 5 of 5. How active is your baby? Press 1 if active and alert. Press 2 if less active. Press 3 if very sleepy.',
    neonatalComplete: 'Assessment complete. Calculating risk level.',
    
    // Risk Results
    riskAssessmentComplete: 'Your risk assessment is complete. Risk Level: ',
    criticalRisk: 'This is a critical situation. Please go to the nearest hospital immediately. Call 998 for ambulance.',
    highRisk: 'You need urgent medical attention. Please visit a health facility today.',
    moderateRisk: 'You should schedule an appointment with a clinician soon.',
    lowRisk: 'Your health status is good. Continue regular check-ups.',
    returnToMenu: 'Press 1 to return to main menu. Press 0 to end call.',
    endCall: 'Thank you for using SafeMother Health IVR. Goodbye.',
    
    // Appointment
    appointmentInfo: 'Your next appointment is scheduled for next Monday at 2 PM at Lilongwe Health Centre. Press 1 to confirm. Press 0 to return to main menu.',
    appointmentConfirm: 'Appointment confirmed. You will receive a reminder SMS.',
    
    // Health Tips
    healthTips: 'Health Tips. Press 1 for another tip. Press 0 to return to main menu.',
    healthTip1: 'Drink plenty of water during pregnancy.',
    healthTip2: 'Attend all your clinic appointments.',
    healthTip3: 'Eat nutritious food with vegetables and proteins.',
    healthTip4: 'Rest regularly and avoid heavy work.',
    healthTip5: 'Keep your baby warm and clean.',
    anotherTip: 'Health Tip: ',
    
    // Emergency
    emergencyContacts: 'Emergency Contacts: Call 998 for Ambulance. Call 116 for SafeMother Helpline. Call 112 for Police. Press 0 to return to main menu.',
    ambulance: 'Ambulance: 998',
    helpline: 'SafeMother Helpline: 116',
    police: 'Police: 112',
    
    // Errors
    errorAssessment: 'Error in assessment. Returning to main menu.',
    errorMenu: 'Invalid menu state. Returning to main menu.',
    calculating: 'Calculating risk level. Please wait.',
  },
  
  ny: {
    // Chichewa translations
    welcome: 'Mwabwino ku SafeMother Health IVR. Chotsani 1 kuti muyendetse.',
    mainMenu: 'Mwabwino ku SafeMother Health IVR. Chotsani 1 pa Kuyang\'ana Thandizo. Chotsani 2 pa Msonkhano. Chotsani 3 pa Malangizo a Thandizo. Chotsani 4 kuti mulumikizane ndi Mankhwala. Chotsani 0 pa Ngozi.',
    symptomChecker: 'Kuyang\'ana Thandizo. Chotsani 1 pa Thandizo la Pakubala. Chotsani 2 pa Thandizo la Mwana.',
    prenatalHealth: 'Kuyang\'ana Thandizo la Pakubala. Funso 1 la 5. Kodi mumveka bwanji lero? Chotsani 1 ngati mumveka bwino. Chotsani 2 ngati mwadala. Chotsani 3 ngati simumveka bwino. Chotsani 4 ngati muli ndi ululu.',
    babyHealth: 'Kuyang\'ana Thandizo la Mwana. Funso 1 la 5. Kodi mwana wanu akumveka bwanji? Chotsani 1 ngati kumveka bwino. Chotsani 2 ngati kumveka mwachangu. Chotsani 3 ngati kumveka mwachangu kwambiri.',
    appointmentCheck: 'Kuyang\'ana msonkhano wanu wotsatira. Chitayeni.',
    clinicianConnect: 'Kulumikizana ndi Mankhwala. Chitayeni.',
    emergency: 'Ngozi. Pitani 998 pa Ambulensi. Pitani 116 pa SafeMother Helpline.',
    invalidOption: 'Kusankha kosayenera. Chotsani 1 pa Kuyang\'ana Thandizo, 2 pa Msonkhano, 3 pa Malangizo, 4 pa Mankhwala, 0 pa Ngozi.',
    
    // Prenatal Questions
    prenatalQ1: 'Funso 1 la 5. Kodi mumveka bwanji lero? Chotsani 1 ngati mumveka bwino. Chotsani 2 ngati mwadala. Chotsani 3 ngati simumveka bwino. Chotsani 4 ngati muli ndi ululu.',
    prenatalQ2: 'Funso 2 la 5. Kodi muli ndi mantha? Chotsani 1 ngati ayi. Chotsani 2 ngati mantha mang\'ono. Chotsani 3 ngati mantha akulu. Chotsani 4 ngati mantha akulu ndi macho akuoneka bwino.',
    prenatalQ3: 'Funso 3 la 5. Kodi muli ndi kufumba? Chotsani 1 ngati ayi. Chotsani 2 ngati kufumba kang\'ono pa mapazi. Chotsani 3 ngati kufumba pa manja ndi nkhope. Chotsani 4 ngati kufumba kwakukulu.',
    prenatalQ4: 'Funso 4 la 5. Kodi mwana wanu akudzimira? Chotsani 1 ngati akudzimira bwino. Chotsani 2 ngati akudzimira pang\'ono. Chotsani 3 ngati sakunyamula lero.',
    prenatalQ5: 'Funso 5 la 5. Kodi muli ndi magazi kapena zinthu zina? Chotsani 1 ngati ayi. Chotsani 2 ngati magazi ang\'ono. Chotsani 3 ngati magazi ambiri. Chotsani 4 ngati zinthu zina.',
    prenatalComplete: 'Kuyang\'ana kwathani. Kuwerengera kuchuluka kwa ngozi.',
    
    // Neonatal Questions
    neonatalQ1: 'Funso 1 la 5. Kodi mwana wanu akumveka bwanji? Chotsani 1 ngati kumveka bwino. Chotsani 2 ngati kumveka mwachangu. Chotsani 3 ngati kumveka mwachangu kwambiri.',
    neonatalQ2: 'Funso 2 la 5. Kodi mwana wanu akudya bwanji? Chotsani 1 ngati akudya bwino. Chotsani 2 ngati akudya pang\'ono. Chotsani 3 ngati sadya.',
    neonatalQ3: 'Funso 3 la 5. Kodi mwana wanu ali ndi mtundu wanji wa khungu? Chotsani 1 ngati wabwino. Chotsani 2 ngati woyera kapena woyera. Chotsani 3 ngati woyera kwambiri.',
    neonatalQ4: 'Funso 4 la 5. Kodi mwana wanu ali ndi moto kapena akachita chisilu? Chotsani 1 ngati wabwino. Chotsani 2 ngati ali ndi moto mang\'ono. Chotsani 3 ngati ali ndi moto akulu kapena akachita chisilu.',
    neonatalQ5: 'Funso 5 la 5. Kodi mwana wanu ali ndi mphamvu yanji? Chotsani 1 ngati ali ndi mphamvu ndi akudziwa. Chotsani 2 ngati ali ndi mphamvu pang\'ono. Chotsani 3 ngati akugona.',
    neonatalComplete: 'Kuyang\'ana kwathani. Kuwerengera kuchuluka kwa ngozi.',
    
    // Risk Results
    riskAssessmentComplete: 'Kuyang\'ana kwanu kwathani. Kuchuluka kwa ngozi: ',
    criticalRisk: 'Ichi ndi ngozi yaikulu. Pitani ku hospital yoyandikira. Pitani 998 pa ambulensi.',
    highRisk: 'Muli ndi pofunika kuyang\'aniridwa mwachangu. Pitani ku malo a thandizo lachisaludwe lero.',
    moderateRisk: 'Muyenera kukonza msonkhano ndi Mankhwala.',
    lowRisk: 'Thandizo lanu lili bwino. Enjezerani kuyang\'aniridwa.',
    returnToMenu: 'Chotsani 1 kuti mubwerezere ku menu. Chotsani 0 kuti mutsire.',
    endCall: 'Zikomo pa kugwiritsa ntchito SafeMother Health IVR. Bayi.',
    
    // Appointment
    appointmentInfo: 'Msonkhano wanu wotsatira ndi Lomondi pa 2 PM ku Lilongwe Health Centre. Chotsani 1 kuti mutsimikize. Chotsani 0 kuti mubwerezere.',
    appointmentConfirm: 'Msonkhano watsimikizidwa. Mulandira SMS youkumbutsira.',
    
    // Health Tips
    healthTips: 'Malangizo a Thandizo. Chotsani 1 pa malangizo ena. Chotsani 0 kuti mubwerezere.',
    healthTip1: 'Munthe madzi ambiri pakubala.',
    healthTip2: 'Pitani ku clinic nthawi zonse.',
    healthTip3: 'Dyani zakudya zabwino ndi ndiwo ndi nyama.',
    healthTip4: 'Izani nthawi ndi samukhire ntchito yaikulu.',
    healthTip5: 'Sungani mwana wanu woyenera ndi woyera.',
    anotherTip: 'Malangizo a Thandizo: ',
    
    // Emergency
    emergencyContacts: 'Manambala a Ngozi: Pitani 998 pa Ambulensi. Pitani 116 pa SafeMother Helpline. Pitani 112 pa Polisi. Chotsani 0 kuti mubwerezere.',
    ambulance: 'Ambulensi: 998',
    helpline: 'SafeMother Helpline: 116',
    police: 'Polisi: 112',
    
    // Errors
    errorAssessment: 'Cholakwika pakuyang\'ana. Kubwerezera ku menu.',
    errorMenu: 'Menu yosayenera. Kubwerezera ku menu.',
    calculating: 'Kuwerengera kuchuluka kwa ngozi. Chitayeni.',
  },
};
