// This script converts the official Malawi Master Health Facility List to our database format
// Based on the PDF document provided

const officialData = `CENTER	Central East	Dowa	Bowe Health Centre	Health Centre	Government	Rural
CENTER	Central East	Dowa	Chakhaza Health Centre	Health Centre	Government	Rural
CENTER	Central East	Dowa	Chankhungu Health Centre	Health Centre	Government	Rural
CENTER	Central East	Dowa	Chinkhwiri Health Centre	Health Centre	Government	Rural
CENTER	Central East	Dowa	Chisepo Health Centre	Health Centre	Government	Rural
CENTER	Central East	Dowa	Dzaleka Health Centre	Health Centre	Government	Rural
CENTER	Central East	Dowa	Dzoole Health Centre	Health Centre	Government	Rural
CENTER	Central East	Dowa	Kayembe Health Centre	Health Centre	Government	Rural
CENTER	Central East	Dowa	Madisi Mission Hospital	Hospital	CHAM	Rural
CENTER	Central East	Dowa	Mbingwa Health Centre	Health Centre	Government	Rural
CENTER	Central East	Dowa	Mponela Rural Hospital	Hospital	Government	Rural
CENTER	Central East	Dowa	Msakambewa Health Centre	Health Centre	Government	Rural
CENTER	Central East	Dowa	Mthengathenga Hospital	Hospital	CHAM	Rural
CENTER	Central East	Dowa	Mvera Army Health Centre	Health Centre	Government	Rural
CENTER	Central East	Dowa	Mvera Mission Health Centre	Health Centre	CHAM	Rural
CENTER	Central East	Dowa	Mwangala Health Centre	Health Centre	Government	Rural
CENTER	Central East	Dowa	Nalunga Health Centre	Health Centre	Government	Rural
CENTER	Central East	Dowa	Thonje Health Centre	Health Centre	Government	Rural
CENTER	Central East	Dowa	Chizolowondo Health Centre	Health Centre	Government	Rural
CENTER	Central East	Dowa	St. Mary's Rehabilitation Health Centre	Health Centre	CHAM	Rural
CENTER	Central East	Dowa	Kasese/Lifeline Malawi Health Centre	Health Centre	Private for profit	Rural
CENTER	Central East	Dowa	Dalitso Private Clinic	Clinic	Private for profit	Urban
CENTER	Central East	Dowa	Mamoyo Private Clinic	Clinic	Private for profit	Rural
CENTER	Central East	Dowa	Towoo's Private Clinic	Clinic	Private for profit	Rural
CENTER	Central East	Dowa	MBA-Esita Private Clinic	Clinic	Private for profit	Rural
CENTER	Central East	Dowa	BLM Mponela Clinic	Clinic	NGO	Urban
CENTER	Central East	Dowa	Family Planning Association Clinic	Clinic	NGO	Urban
CENTER	Central East	Dowa	MATEKENYA	Dispensary	Government	Urban
CENTER	Central East	Dowa	MONDWE	Health Post	Government	Urban
CENTER	Central East	Dowa	MTAMBALIKA	Health Post	NGO	Urban
CENTER	Central East	Dowa	Mtengowanthenga Dream Project	Clinic	NGO	Rural
CENTER	Central East	Kasungu	Bua Health Centre	Health Centre	Government	Rural
CENTER	Central East	Kasungu	Chamwabvi Health Centre	Health Centre	Government	Rural
CENTER	Central East	Kasungu	Chulu Health Centre	Health Centre	Government	Rural
CENTER	Central East	Kasungu	Dwangwa Dispensary	Dispensary	Government	Rural
CENTER	Central East	Kasungu	Kaluluma Rural Hospital	Hospital	Government	Rural
CENTER	Central East	Kasungu	Kamboni Health Centre	Health Centre	Government	Rural
CENTER	Central East	Kasungu	Kapelula Health Centre	Health Centre	Government	Rural
CENTER	Central East	Kasungu	Kasungu District Hospital	Hospital	Government	Urban
CENTER	Central East	Kasungu	Kawamba Health Centre	Health Centre	Government	Rural
CENTER	Central East	Kasungu	Mkhota Health Centre	Health Centre	Government	Rural
CENTER	Central East	Kasungu	Mtunthama Health Centre	Health Centre	Government	Rural
CENTER	Central East	Kasungu	Newa Health Centre	Health Centre	CHAM	Rural
CENTER	Central East	Kasungu	Nkhamenya Hospital	Hospital	CHAM	Rural
CENTER	Central East	Kasungu	Santhe Health Centre	Health Centre	Government	Rural
CENTER	Central East	Kasungu	Simlemba Health Centre	Health Centre	Government	Rural
CENTER	Central East	Kasungu	Wimbe Health Centre	Health Centre	Government	Rural
CENTER	Central East	Kasungu	KTFT/Mziza Health Centre	Health Centre	CHAM	Rural
CENTER	Central East	Kasungu	Linyangwa Health Centre	Health Centre	Government	Rural
CENTER	Central East	Kasungu	Gogode Dispensary	Dispensary	Government	Rural
CENTER	Central East	Kasungu	Ofesi Health Centre	Health Centre	Government	Rural
CENTER	Central East	Kasungu	Khola Health Centre	Health Centre	Government	Rural
CENTER	Central East	Kasungu	Chamama Health Centre	Health Centre	Government	Rural
CENTER	Central East	Kasungu	Lodjwa Health Centre	Health Centre	Government	Rural
CENTER	Central East	Kasungu	Mdunga Health Centre	Health Centre	Government	Rural
CENTER	Central East	Kasungu	St. Andrews Health Centre	Health Centre	CHAM	Rural
CENTER	Central East	Kasungu	Kasalika Health Centre	Health Centre	Government	Urban
CENTER	Central East	Kasungu	Thupa Health Centre	Health Centre	Government	Rural
CENTER	Central East	Kasungu	Lifupa Dispensary	Dispensary	Government	Rural
CENTER	Central East	Kasungu	Kapyanga Health Post	Health Post	Government	Rural
CENTER	Central East	Kasungu	St. Faith Anglican Clinic	Clinic	CHAM	Rural
CENTER	Central East	Kasungu	Kasalika Private Clinic, Chimb	Clinic	Private for profit	Urban
CENTER	Central East	Kasungu	Yankho Private Clinic	Clinic	Private for profit	Urban
CENTER	Central East	Kasungu	Chimwemwe Private Clinic	Clinic	Private for profit	Rural
CENTER	Central East	Kasungu	Mbalunji Private Clinic, Dhlam	Clinic	Private for profit	Rural
CENTER	Central East	Kasungu	Gogo Leya Private Clinic	Clinic	Private for profit	Rural
CENTER	Central East	Kasungu	Kalikene Private Clinic	Clinic	Private for profit	Urban
CENTER	Central East	Kasungu	Veruwa, Flyven P. Mphatso Zath	Clinic	Private for profit	Urban
CENTER	Central East	Kasungu	Kasungu BLM	Clinic	NGO	Urban
CENTER	Central East	Kasungu	Kamuzu Academy Clinic	Clinic	Private non profit	Rural
CENTER	Central East	Kasungu	Kasungu Prison	Clinic	Government	Urban
CENTER	Central East	Kasungu	MAFUPHIZI	Health Post	Government	Rural
CENTER	Central East	Kasungu	Chinyama Health Centre	Health Centre	Government	Rural
CENTER	Central East	Kasungu	Mnyanja Health Centre	Health Centre	Government	Rural
CENTER	Central East	Kasungu	Mpepa Health Centre	Health Centre	Government	Rural
CENTER	Central East	Kasungu	Livwezi Health Centre	Health Centre	Government	Rural
CENTER	Central East	Kasungu	Anchor Health Centre	Health Centre	Government	Rural
CENTER	Central East	Kasungu	Umoyo Private Clinic	Clinic	Government	Urban
CENTER	Central East	Kasungu	Mtendere Private Clinic	Clinic	Private for profit	Urban
CENTER	Central East	Kasungu	Mchenga Private Clinic	Clinic	Private for profit	Urban
NORTH	Northern	Chitipa	Banja La Mtsogolo Clinic	Clinic	NGO	Urban
NORTH	Northern	Chitipa	Chambo Health Centre	Health Centre	CHAM	Rural
NORTH	Northern	Chitipa	Chitipa District Hospital	Hospital	Government	Urban
NORTH	Northern	Chitipa	Ifumbo Health Centre	Health Centre	Government	Rural
NORTH	Northern	Chitipa	Kameme Health Centre	Health Centre	Government	Rural
NORTH	Northern	Chitipa	Kapenda Health Centre	Health Centre	Government	Urban
NORTH	Northern	Chitipa	Kaseye Mission Hospital	Hospital	CHAM	Rural
NORTH	Northern	Chitipa	Misuku Health Centre	Health Centre	Government	Rural
NORTH	Northern	Chitipa	Msumbe Dispensary	Dispensary	CHAM	Rural
NORTH	Northern	Chitipa	Nthalire Health Centre	Health Centre	Government	Rural
NORTH	Northern	Chitipa	Wenya Health Centre	Health Centre	Government	Rural
SOUTH	South East	Balaka	Balaka District Hospital	Hospital	Government	Urban
SOUTH	South East	Balaka	Kalembo Health Centre	Health Centre	Government	Rural
SOUTH	South East	Balaka	Kankao Health Centre	Health Centre	CHAM	Rural
SOUTH	South East	Balaka	Mbera Health Centre	Health Centre	Government	Rural
SOUTH	South East	Balaka	Phalula Health Centre	Health Centre	CHAM	Rural
SOUTH	South East	Balaka	Phimbi Health Centre	Health Centre	Government	Rural
SOUTH	South East	Balaka	Ulongwe Health Centre	Health Centre	CHAM	Rural
SOUTH	South East	Balaka	Utale 1 Health Centre	Health Centre	CHAM	Rural
SOUTH	South East	Balaka	Utale 2 Health Centre	Health Centre	CHAM	Rural
SOUTH	South West	Blantyre	Queen Elizabeth Central Hospital	Hospital	Government	Urban
SOUTH	South West	Blantyre	Ndirande Health Centre	Health Centre	Government	Urban
SOUTH	South West	Blantyre	Zingwangwa Health Centre	Health Centre	Government	Urban
SOUTH	South West	Blantyre	Chilomoni Health Centre	Health Centre	Government	Urban
SOUTH	South West	Blantyre	Bangwe Health Centre	Health Centre	Government	Urban
SOUTH	South West	Blantyre	Limbe Health Centre	Health Centre	Government	Urban
SOUTH	South West	Blantyre	Madziabango Health Centre	Health Centre	Government	Rural
SOUTH	South West	Blantyre	Mpemba Health Centre	Health Centre	Government	Rural
SOUTH	South West	Blantyre	Lirangwe Health Centre	Health Centre	Government	Rural
SOUTH	South West	Blantyre	Chikowa Health Centre	Health Centre	Government	Rural
SOUTH	South West	Blantyre	Mlambe Mission Hospital	Hospital	CHAM	Urban
SOUTH	South West	Blantyre	Adventist Health Centre Blantyre	Health Centre	NGO	Urban`;

// Parse the data
const facilities = officialData.trim().split('\n').map(line => {
  const parts = line.split('\t');
  return {
    region: parts[0],
    zone: parts[1],
    district: parts[2],
    facilityName: parts[3],
    facilityType: parts[4],
    managingAuthority: parts[5],
    urbanRural: parts[6]
  };
});

// Generate TypeScript seed file
const seedContent = `export interface FacilitySeedItem {
  region: string; zone: string; district: string;
  facilityName: string; facilityType: string;
  managingAuthority: string; urbanRural: string;
}

export const FACILITY_SEED: FacilitySeedItem[] = [
${facilities.map(f => 
  `  { region:'${f.region}', zone:'${f.zone}', district:'${f.district}', facilityName:'${f.facilityName.replace(/'/g, "\\'")}', facilityType:'${f.facilityType}', managingAuthority:'${f.managingAuthority}', urbanRural:'${f.urbanRural}' },`
).join('\n')}
];
`;

const fs = require('fs');
fs.writeFileSync('src/health-facilities/seed/facilities.seed.ts', seedContent);
console.log(`Generated seed file with ${facilities.length} official facilities`);

// Also output summary
const regions = [...new Set(facilities.map(f => f.region))];
const zones = [...new Set(facilities.map(f => f.zone))];
const districts = [...new Set(facilities.map(f => f.district))];

console.log('\nSummary:');
console.log('Regions:', regions);
console.log('Zones:', zones);
console.log('Districts:', districts);
console.log(`Total facilities: ${facilities.length}`);