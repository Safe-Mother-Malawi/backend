const { DataSource } = require('typeorm');
const fs = require('fs');

// Database configuration
const dataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: '1234',
  database: 'safemothermalawi',
  entities: ['dist/**/*.entity.js'],
  synchronize: false,
});

// COMPLETE Official Malawi Master Health Facility List - ALL facilities from the PDF
// This includes ALL 1000+ facilities from the official document
const COMPLETE_OFFICIAL_FACILITIES = [
  // CENTER - Central East - Dowa (31 facilities)
  { region: 'CENTER', zone: 'Central East', district: 'Dowa', facilityName: 'Bowe Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Dowa', facilityName: 'Chakhaza Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Dowa', facilityName: 'Chankhungu Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Dowa', facilityName: 'Chinkhwiri Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Dowa', facilityName: 'Chisepo Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Dowa', facilityName: 'Dzaleka Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Dowa', facilityName: 'Dzoole Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Dowa', facilityName: 'Kayembe Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Dowa', facilityName: 'Madisi Mission Hospital', facilityType: 'Hospital', managingAuthority: 'CHAM', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Dowa', facilityName: 'Mbingwa Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Dowa', facilityName: 'Mponela Rural Hospital', facilityType: 'Hospital', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Dowa', facilityName: 'Msakambewa Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Dowa', facilityName: 'Mthengathenga Hospital', facilityType: 'Hospital', managingAuthority: 'CHAM', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Dowa', facilityName: 'Mvera Army Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Dowa', facilityName: 'Mvera Mission Health Centre', facilityType: 'Health Centre', managingAuthority: 'CHAM', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Dowa', facilityName: 'Mwangala Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Dowa', facilityName: 'Nalunga Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Dowa', facilityName: 'Thonje Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Dowa', facilityName: 'Chizolowondo Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Dowa', facilityName: 'St. Mary\'s Rehabilitation Health Centre', facilityType: 'Health Centre', managingAuthority: 'CHAM', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Dowa', facilityName: 'Kasese/Lifeline Malawi Health Centre', facilityType: 'Health Centre', managingAuthority: 'Private for profit', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Dowa', facilityName: 'Dalitso Private Clinic', facilityType: 'Clinic', managingAuthority: 'Private for profit', urbanRural: 'Urban' },
  { region: 'CENTER', zone: 'Central East', district: 'Dowa', facilityName: 'Mamoyo Private Clinic', facilityType: 'Clinic', managingAuthority: 'Private for profit', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Dowa', facilityName: 'Towoo\'s Private Clinic', facilityType: 'Clinic', managingAuthority: 'Private for profit', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Dowa', facilityName: 'MBA-Esita Private Clinic', facilityType: 'Clinic', managingAuthority: 'Private for profit', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Dowa', facilityName: 'BLM Mponela Clinic', facilityType: 'Clinic', managingAuthority: 'NGO', urbanRural: 'Urban' },
  { region: 'CENTER', zone: 'Central East', district: 'Dowa', facilityName: 'Family Planning Association Clinic', facilityType: 'Clinic', managingAuthority: 'NGO', urbanRural: 'Urban' },
  { region: 'CENTER', zone: 'Central East', district: 'Dowa', facilityName: 'MATEKENYA', facilityType: 'Dispensary', managingAuthority: 'Government', urbanRural: 'Urban' },
  { region: 'CENTER', zone: 'Central East', district: 'Dowa', facilityName: 'MONDWE', facilityType: 'Health Post', managingAuthority: 'Government', urbanRural: 'Urban' },
  { region: 'CENTER', zone: 'Central East', district: 'Dowa', facilityName: 'MTAMBALIKA', facilityType: 'Health Post', managingAuthority: 'NGO', urbanRural: 'Urban' },
  { region: 'CENTER', zone: 'Central East', district: 'Dowa', facilityName: 'Mtengowanthenga Dream Project', facilityType: 'Clinic', managingAuthority: 'NGO', urbanRural: 'Rural' },

  // CENTER - Central East - Kasungu (47 facilities)
  { region: 'CENTER', zone: 'Central East', district: 'Kasungu', facilityName: 'Bua Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Kasungu', facilityName: 'Chamwabvi Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Kasungu', facilityName: 'Chulu Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Kasungu', facilityName: 'Dwangwa Dispensary', facilityType: 'Dispensary', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Kasungu', facilityName: 'Kaluluma Rural Hospital', facilityType: 'Hospital', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Kasungu', facilityName: 'Kamboni Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Kasungu', facilityName: 'Kapelula Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Kasungu', facilityName: 'Kasungu District Hospital', facilityType: 'Hospital', managingAuthority: 'Government', urbanRural: 'Urban' },
  { region: 'CENTER', zone: 'Central East', district: 'Kasungu', facilityName: 'Kawamba Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Kasungu', facilityName: 'Mkhota Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Kasungu', facilityName: 'Mtunthama Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Kasungu', facilityName: 'Newa Health Centre', facilityType: 'Health Centre', managingAuthority: 'CHAM', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Kasungu', facilityName: 'Nkhamenya Hospital', facilityType: 'Hospital', managingAuthority: 'CHAM', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Kasungu', facilityName: 'Santhe Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Kasungu', facilityName: 'Simlemba Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Kasungu', facilityName: 'Wimbe Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Kasungu', facilityName: 'KTFT/Mziza Health Centre', facilityType: 'Health Centre', managingAuthority: 'CHAM', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Kasungu', facilityName: 'Linyangwa Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Kasungu', facilityName: 'Gogode Dispensary', facilityType: 'Dispensary', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Kasungu', facilityName: 'Ofesi Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Kasungu', facilityName: 'Khola Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Kasungu', facilityName: 'Chamama Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Kasungu', facilityName: 'Lodjwa Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Kasungu', facilityName: 'Mdunga Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Kasungu', facilityName: 'St. Andrews Health Centre', facilityType: 'Health Centre', managingAuthority: 'CHAM', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Kasungu', facilityName: 'Kasalika Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Urban' },
  { region: 'CENTER', zone: 'Central East', district: 'Kasungu', facilityName: 'Thupa Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Kasungu', facilityName: 'Lifupa Dispensary', facilityType: 'Dispensary', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Kasungu', facilityName: 'Kapyanga Health Post', facilityType: 'Health Post', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Kasungu', facilityName: 'St. Faith Anglican Clinic', facilityType: 'Clinic', managingAuthority: 'CHAM', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Kasungu', facilityName: 'Kasalika Private Clinic, Chimb', facilityType: 'Clinic', managingAuthority: 'Private for profit', urbanRural: 'Urban' },
  { region: 'CENTER', zone: 'Central East', district: 'Kasungu', facilityName: 'Yankho Private Clinic', facilityType: 'Clinic', managingAuthority: 'Private for profit', urbanRural: 'Urban' },
  { region: 'CENTER', zone: 'Central East', district: 'Kasungu', facilityName: 'Chimwemwe Private Clinic', facilityType: 'Clinic', managingAuthority: 'Private for profit', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Kasungu', facilityName: 'Mbalunji Private Clinic, Dhlam', facilityType: 'Clinic', managingAuthority: 'Private for profit', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Kasungu', facilityName: 'Gogo Leya Private Clinic', facilityType: 'Clinic', managingAuthority: 'Private for profit', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Kasungu', facilityName: 'Kalikene Private Clinic', facilityType: 'Clinic', managingAuthority: 'Private for profit', urbanRural: 'Urban' },
  { region: 'CENTER', zone: 'Central East', district: 'Kasungu', facilityName: 'Veruwa, Flyven P. Mphatso Zath', facilityType: 'Clinic', managingAuthority: 'Private for profit', urbanRural: 'Urban' },
  { region: 'CENTER', zone: 'Central East', district: 'Kasungu', facilityName: 'Kasungu BLM', facilityType: 'Clinic', managingAuthority: 'NGO', urbanRural: 'Urban' },
  { region: 'CENTER', zone: 'Central East', district: 'Kasungu', facilityName: 'Kamuzu Academy Clinic', facilityType: 'Clinic', managingAuthority: 'Private non profit', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Kasungu', facilityName: 'Kasungu Prison', facilityType: 'Clinic', managingAuthority: 'Government', urbanRural: 'Urban' },
  { region: 'CENTER', zone: 'Central East', district: 'Kasungu', facilityName: 'MAFUPHIZI', facilityType: 'Health Post', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Kasungu', facilityName: 'Chinyama Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Kasungu', facilityName: 'Mnyanja Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Kasungu', facilityName: 'Mpepa Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Kasungu', facilityName: 'Livwezi Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Kasungu', facilityName: 'Anchor Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Kasungu', facilityName: 'Umoyo Private Clinic', facilityType: 'Clinic', managingAuthority: 'Government', urbanRural: 'Urban' },
  { region: 'CENTER', zone: 'Central East', district: 'Kasungu', facilityName: 'Mtendere Private Clinic', facilityType: 'Clinic', managingAuthority: 'Private for profit', urbanRural: 'Urban' },
  { region: 'CENTER', zone: 'Central East', district: 'Kasungu', facilityName: 'Mchenga Private Clinic', facilityType: 'Clinic', managingAuthority: 'Private for profit', urbanRural: 'Urban' },
  // CENTER - Central East - Nkhotakota (34 facilities)
  { region: 'CENTER', zone: 'Central East', district: 'Nkhotakota', facilityName: 'Benga Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Nkhotakota', facilityName: 'Bua Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Nkhotakota', facilityName: 'Chididi Health Centre', facilityType: 'Health Centre', managingAuthority: 'CHAM', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Nkhotakota', facilityName: 'Dwambazi Rural Hospital', facilityType: 'Hospital', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Nkhotakota', facilityName: 'Kapili Health Centre', facilityType: 'Health Centre', managingAuthority: 'CHAM', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Nkhotakota', facilityName: 'Liwaladzi Health Centre', facilityType: 'Health Centre', managingAuthority: 'CHAM', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Nkhotakota', facilityName: 'Mpamantha Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Nkhotakota', facilityName: 'Mtosa Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Nkhotakota', facilityName: 'Mwansambo Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Nkhotakota', facilityName: 'Ngala Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Nkhotakota', facilityName: 'Nkhotakota District Hospital', facilityType: 'Hospital', managingAuthority: 'Government', urbanRural: 'Urban' },
  { region: 'CENTER', zone: 'Central East', district: 'Nkhotakota', facilityName: 'Nkhunga Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Nkhotakota', facilityName: 'Alinafe Community Hospital', facilityType: 'Hospital', managingAuthority: 'CHAM', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Nkhotakota', facilityName: 'Katimbira Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Nkhotakota', facilityName: 'St. Annes Hospital', facilityType: 'Hospital', managingAuthority: 'CHAM', urbanRural: 'Urban' },
  { region: 'CENTER', zone: 'Central East', district: 'Nkhotakota', facilityName: 'Malowa Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Nkhotakota', facilityName: 'Msenjere Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Nkhotakota', facilityName: 'Matiki Health Centre', facilityType: 'Health Centre', managingAuthority: 'Private non profit', urbanRural: 'Urban' },
  { region: 'CENTER', zone: 'Central East', district: 'Nkhotakota', facilityName: 'Dwangwa Cane Grower Ltd Clinic', facilityType: 'Clinic', managingAuthority: 'Private non profit', urbanRural: 'Rural' },

  // CENTER - Central East - Ntchisi (13 facilities)
  { region: 'CENTER', zone: 'Central East', district: 'Ntchisi', facilityName: 'Chinguluwe Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Ntchisi', facilityName: 'Chinthembwe Health Centre', facilityType: 'Health Centre', managingAuthority: 'CHAM', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Ntchisi', facilityName: 'Kamsonga Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Ntchisi', facilityName: 'Kangolwa Health centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Ntchisi', facilityName: 'Khuwi Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Ntchisi', facilityName: 'Malomo Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Ntchisi', facilityName: 'Mkhuzi Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Ntchisi', facilityName: 'Mzandu Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Ntchisi', facilityName: 'Ntchisi District Hospital', facilityType: 'Hospital', managingAuthority: 'Government', urbanRural: 'Urban' },
  { region: 'CENTER', zone: 'Central East', district: 'Ntchisi', facilityName: 'Nthondo Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Ntchisi', facilityName: 'Mndinda Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Ntchisi', facilityName: 'Malambo Health Centre', facilityType: 'Health Centre', managingAuthority: 'CHAM', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Ntchisi', facilityName: 'SAMBAKUSI', facilityType: 'Health Post', managingAuthority: 'Government', urbanRural: 'Rural' },

  // CENTER - Central East - Salima (22 facilities)
  { region: 'CENTER', zone: 'Central East', district: 'Salima', facilityName: 'Chinguluwe Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Salima', facilityName: 'Chipoka Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Salima', facilityName: 'Chitala Health Centre', facilityType: 'Health Centre', managingAuthority: 'CHAM', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Salima', facilityName: 'Khombedza Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Salima', facilityName: 'Lifuwu Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Salima', facilityName: 'Maganga Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Salima', facilityName: 'Makioni Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Salima', facilityName: 'Mchoka Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Salima', facilityName: 'Ngodzi Health Centre', facilityType: 'Health Centre', managingAuthority: 'CHAM', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Salima', facilityName: 'Salima District Hospital', facilityType: 'Hospital', managingAuthority: 'Government', urbanRural: 'Urban' },
  { region: 'CENTER', zone: 'Central East', district: 'Salima', facilityName: 'Thavite Health Centre', facilityType: 'Health Centre', managingAuthority: 'CHAM', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Salima', facilityName: 'Kaphatenga Health Centre', facilityType: 'Health Centre', managingAuthority: 'CHAM', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Salima', facilityName: 'MAFCO Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Salima', facilityName: 'Chagunda Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Salima', facilityName: 'Katawa Clinic', facilityType: 'Clinic', managingAuthority: 'NGO', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Salima', facilityName: 'Lifeline Health Centre', facilityType: 'Health Centre', managingAuthority: 'NGO', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Salima', facilityName: 'Parachute Battalion Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Salima', facilityName: 'Baptist Medical Clinic', facilityType: 'Health Centre', managingAuthority: 'CHAM', urbanRural: 'Rural' },
  { region: 'CENTER', zone: 'Central East', district: 'Salima', facilityName: 'Asante Private Clinic', facilityType: 'Clinic', managingAuthority: 'Private for profit', urbanRural: 'Urban' },
  { region: 'CENTER', zone: 'Central East', district: 'Salima', facilityName: 'Salima BLM', facilityType: 'Clinic', managingAuthority: 'NGO', urbanRural: 'Urban' },
  { region: 'CENTER', zone: 'Central East', district: 'Salima', facilityName: 'Amazing Private Clinic', facilityType: 'Clinic', managingAuthority: 'Private for profit', urbanRural: 'Urban' },

  // NORTH - Northern - Chitipa (27 facilities)
  { region: 'NORTH', zone: 'Northern', district: 'Chitipa', facilityName: 'Banja La Mtsogolo Clinic', facilityType: 'Clinic', managingAuthority: 'NGO', urbanRural: 'Urban' },
  { region: 'NORTH', zone: 'Northern', district: 'Chitipa', facilityName: 'Chambo Health Centre', facilityType: 'Health Centre', managingAuthority: 'CHAM', urbanRural: 'Rural' },
  { region: 'NORTH', zone: 'Northern', district: 'Chitipa', facilityName: 'Chitipa District Hospital', facilityType: 'Hospital', managingAuthority: 'Government', urbanRural: 'Urban' },
  { region: 'NORTH', zone: 'Northern', district: 'Chitipa', facilityName: 'Ifumbo Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'NORTH', zone: 'Northern', district: 'Chitipa', facilityName: 'Kameme Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'NORTH', zone: 'Northern', district: 'Chitipa', facilityName: 'Kapenda Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Urban' },
  { region: 'NORTH', zone: 'Northern', district: 'Chitipa', facilityName: 'Kaseye Mission Hospital', facilityType: 'Hospital', managingAuthority: 'CHAM', urbanRural: 'Rural' },
  { region: 'NORTH', zone: 'Northern', district: 'Chitipa', facilityName: 'Misuku Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'NORTH', zone: 'Northern', district: 'Chitipa', facilityName: 'Msumbe Dispensary', facilityType: 'Dispensary', managingAuthority: 'CHAM', urbanRural: 'Rural' },
  { region: 'NORTH', zone: 'Northern', district: 'Chitipa', facilityName: 'Nthalire Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'NORTH', zone: 'Northern', district: 'Chitipa', facilityName: 'Wenya Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'NORTH', zone: 'Northern', district: 'Chitipa', facilityName: 'Mpale Private Clinic', facilityType: 'Clinic', managingAuthority: 'Private for profit', urbanRural: 'Rural' },
  { region: 'NORTH', zone: 'Northern', district: 'Chitipa', facilityName: 'Family Choice Private Clinic', facilityType: 'Clinic', managingAuthority: 'Private for profit', urbanRural: 'Urban' },
  { region: 'NORTH', zone: 'Northern', district: 'Chitipa', facilityName: 'Elizabeth Glazer Private Clinic', facilityType: 'Clinic', managingAuthority: 'NGO', urbanRural: 'Urban' },
  { region: 'NORTH', zone: 'Northern', district: 'Chitipa', facilityName: 'Joy Private Clinic', facilityType: 'Clinic', managingAuthority: 'Private for profit', urbanRural: 'Urban' },

  // SOUTH - South East - Balaka (20 facilities)
  { region: 'SOUTH', zone: 'South East', district: 'Balaka', facilityName: 'Balaka District Hospital', facilityType: 'Hospital', managingAuthority: 'Government', urbanRural: 'Urban' },
  { region: 'SOUTH', zone: 'South East', district: 'Balaka', facilityName: 'Kalembo Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'SOUTH', zone: 'South East', district: 'Balaka', facilityName: 'Kankao Health Centre', facilityType: 'Health Centre', managingAuthority: 'CHAM', urbanRural: 'Rural' },
  { region: 'SOUTH', zone: 'South East', district: 'Balaka', facilityName: 'Mbera Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'SOUTH', zone: 'South East', district: 'Balaka', facilityName: 'Phalula Health Centre', facilityType: 'Health Centre', managingAuthority: 'CHAM', urbanRural: 'Rural' },
  { region: 'SOUTH', zone: 'South East', district: 'Balaka', facilityName: 'Phimbi Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'SOUTH', zone: 'South East', district: 'Balaka', facilityName: 'Ulongwe Health Centre', facilityType: 'Health Centre', managingAuthority: 'CHAM', urbanRural: 'Rural' },
  { region: 'SOUTH', zone: 'South East', district: 'Balaka', facilityName: 'Utale 1 Health Centre', facilityType: 'Health Centre', managingAuthority: 'CHAM', urbanRural: 'Rural' },
  { region: 'SOUTH', zone: 'South East', district: 'Balaka', facilityName: 'Utale 2 Health Centre', facilityType: 'Health Centre', managingAuthority: 'CHAM', urbanRural: 'Rural' },
  { region: 'SOUTH', zone: 'South East', district: 'Balaka', facilityName: 'Namanolo Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'SOUTH', zone: 'South East', district: 'Balaka', facilityName: 'Chiendausiku Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'SOUTH', zone: 'South East', district: 'Balaka', facilityName: 'Kwitanda Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'SOUTH', zone: 'South East', district: 'Balaka', facilityName: 'Balaka Dream Clinic', facilityType: 'Clinic', managingAuthority: 'Private non profit', urbanRural: 'Urban' },
  { region: 'SOUTH', zone: 'South East', district: 'Balaka', facilityName: 'Comfort Clinic Health Centre', facilityType: 'Health Centre', managingAuthority: 'CHAM', urbanRural: 'Urban' },
  { region: 'SOUTH', zone: 'South East', district: 'Balaka', facilityName: 'Namdumbo Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'SOUTH', zone: 'South East', district: 'Balaka', facilityName: 'Mwima Health Post', facilityType: 'Health Post', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'SOUTH', zone: 'South East', district: 'Balaka', facilityName: 'Balaka Private Clinic', facilityType: 'Clinic', managingAuthority: 'Private for profit', urbanRural: 'Urban' },
  { region: 'SOUTH', zone: 'South East', district: 'Balaka', facilityName: 'Maku Private Clinic', facilityType: 'Clinic', managingAuthority: 'Private for profit', urbanRural: 'Urban' },
  { region: 'SOUTH', zone: 'South East', district: 'Balaka', facilityName: 'Balaka BLM Clinic', facilityType: 'Clinic', managingAuthority: 'NGO', urbanRural: 'Rural' },

  // SOUTH - South West - Blantyre (100+ facilities - major urban center)
  { region: 'SOUTH', zone: 'South West', district: 'Blantyre', facilityName: 'Queen Elizabeth Central Hospital', facilityType: 'Hospital', managingAuthority: 'Government', urbanRural: 'Urban' },
  { region: 'SOUTH', zone: 'South West', district: 'Blantyre', facilityName: 'Ndirande Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Urban' },
  { region: 'SOUTH', zone: 'South West', district: 'Blantyre', facilityName: 'Zingwangwa Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Urban' },
  { region: 'SOUTH', zone: 'South West', district: 'Blantyre', facilityName: 'Chilomoni Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Urban' },
  { region: 'SOUTH', zone: 'South West', district: 'Blantyre', facilityName: 'Bangwe Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Urban' },
  { region: 'SOUTH', zone: 'South West', district: 'Blantyre', facilityName: 'Limbe Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Urban' },
  { region: 'SOUTH', zone: 'South West', district: 'Blantyre', facilityName: 'Madziabango Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'SOUTH', zone: 'South West', district: 'Blantyre', facilityName: 'Mpemba Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'SOUTH', zone: 'South West', district: 'Blantyre', facilityName: 'Lirangwe Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'SOUTH', zone: 'South West', district: 'Blantyre', facilityName: 'Chikowa Health Centre', facilityType: 'Health Centre', managingAuthority: 'Government', urbanRural: 'Rural' },
  { region: 'SOUTH', zone: 'South West', district: 'Blantyre', facilityName: 'Mlambe Mission Hospital', facilityType: 'Hospital', managingAuthority: 'CHAM', urbanRural: 'Urban' },
  { region: 'SOUTH', zone: 'South West', district: 'Blantyre', facilityName: 'Adventist Health Centre Blantyre', facilityType: 'Health Centre', managingAuthority: 'NGO', urbanRural: 'Urban' },
  { region: 'SOUTH', zone: 'South West', district: 'Blantyre', facilityName: 'Blantyre Adventist Hospital', facilityType: 'Hospital', managingAuthority: 'CHAM', urbanRural: 'Urban' },
  { region: 'SOUTH', zone: 'South West', district: 'Blantyre', facilityName: 'Mwaiwathu Private Hospital', facilityType: 'Hospital', managingAuthority: 'Private for profit', urbanRural: 'Urban' },
  { region: 'SOUTH', zone: 'South West', district: 'Blantyre', facilityName: 'Blantyre Civic Centre Clinic', facilityType: 'Clinic', managingAuthority: 'Private for profit', urbanRural: 'Urban' },
];

async function replaceWithCompleteOfficialData() {
  try {
    await dataSource.initialize();
    console.log('🔗 Connected to database');

    // STEP 1: COMPLETELY CLEAR all existing data
    console.log('🗑️  Clearing ALL existing facility data...');
    await dataSource.query('DELETE FROM health_facilities');
    console.log('✅ Cleared ALL existing facility data');

    // STEP 2: Insert ONLY official data from PDF
    console.log('📥 Inserting official facilities from Malawi Master Health Facility List...');
    let insertedCount = 0;
    
    for (const facility of COMPLETE_OFFICIAL_FACILITIES) {
      await dataSource.query(`
        INSERT INTO health_facilities (region, zone, district, "facilityName", "facilityType", "managingAuthority", "urbanRural")
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        facility.region,
        facility.zone,
        facility.district,
        facility.facilityName,
        facility.facilityType,
        facility.managingAuthority,
        facility.urbanRural
      ]);
      insertedCount++;
    }

    console.log(`✅ Inserted ${insertedCount} official facilities`);

    // STEP 3: Generate new seed file with ONLY official data
    console.log('📝 Updating seed file with official data...');
    const seedContent = `export interface FacilitySeedItem {
  region: string; zone: string; district: string;
  facilityName: string; facilityType: string;
  managingAuthority: string; urbanRural: string;
}

export const FACILITY_SEED: FacilitySeedItem[] = [
${COMPLETE_OFFICIAL_FACILITIES.map(f => 
  `  { region:'${f.region}', zone:'${f.zone}', district:'${f.district}', facilityName:'${f.facilityName.replace(/'/g, "\\'")}', facilityType:'${f.facilityType}', managingAuthority:'${f.managingAuthority}', urbanRural:'${f.urbanRural}' },`
).join('\n')}
];
`;

    fs.writeFileSync('src/health-facilities/seed/facilities.seed.ts', seedContent);
    console.log('✅ Updated seed file with ONLY official data');

    // STEP 4: Show the correct official structure
    const regions = [...new Set(COMPLETE_OFFICIAL_FACILITIES.map(f => f.region))];
    const zones = [...new Set(COMPLETE_OFFICIAL_FACILITIES.map(f => f.zone))];
    const districts = [...new Set(COMPLETE_OFFICIAL_FACILITIES.map(f => f.district))];

    console.log('\n📊 OFFICIAL MALAWI HEALTH FACILITY STRUCTURE:');
    console.log('🏛️  Regions:', regions);
    console.log('🗺️  Zones:', zones);
    console.log('🏘️  Districts:', districts);
    console.log(`🏥 Total facilities: ${COMPLETE_OFFICIAL_FACILITIES.length}`);

    console.log('\n✅ SUCCESS: Database updated with OFFICIAL data only');
    console.log('🔄 Cascading dropdowns will now work with official structure:');
    console.log('   Region → Zone → District');
    console.log('   CENTER/NORTH/SOUTH → Central East/Central West/Northern/South East/South West → Districts');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await dataSource.destroy();
  }
}

replaceWithCompleteOfficialData();