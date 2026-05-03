const { DataSource } = require('typeorm');
const fs = require('fs');

// Database configuration from .env
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

// Official Malawi Master Health Facility List data
const officialFacilities = [
  // CENTER - Central East - Dowa
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
  
  // Add more facilities from the official document...
  // This is just a sample - I'll need to add all 1000+ facilities from the PDF
];

async function updateWithOfficialData() {
  try {
    await dataSource.initialize();
    console.log('Connected to database');

    // Clear existing data
    await dataSource.query('DELETE FROM health_facilities');
    console.log('Cleared existing facility data');

    // Insert official data
    const repo = dataSource.getRepository('HealthFacility');
    for (const facility of officialFacilities) {
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
    }

    console.log(`Inserted ${officialFacilities.length} official facilities`);

    // Generate updated seed file
    const seedContent = `export interface FacilitySeedItem {
  region: string; zone: string; district: string;
  facilityName: string; facilityType: string;
  managingAuthority: string; urbanRural: string;
}

export const FACILITY_SEED: FacilitySeedItem[] = [
${officialFacilities.map(f => 
  `  { region:'${f.region}', zone:'${f.zone}', district:'${f.district}', facilityName:'${f.facilityName.replace(/'/g, "\\'")}', facilityType:'${f.facilityType}', managingAuthority:'${f.managingAuthority}', urbanRural:'${f.urbanRural}' },`
).join('\n')}
];
`;

    fs.writeFileSync('src/health-facilities/seed/facilities.seed.ts', seedContent);
    console.log('Updated seed file with official data');

  } catch (error) {
    console.error('Error updating with official data:', error);
  } finally {
    await dataSource.destroy();
  }
}

updateWithOfficialData();