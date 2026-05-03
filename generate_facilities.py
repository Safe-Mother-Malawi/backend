#!/usr/bin/env python3
"""
Generate complete health facilities seed data from Malawi Master Health Facility List
"""

# All facilities from the PDF
facilities_data = [
    # CENTER - Central East - Dowa
    ('CENTER', 'Central East', 'Dowa', 'Bowe Health Centre', 'Health Centre', 'Government', 'Rural'),
    ('CENTER', 'Central East', 'Dowa', 'Chakhaza Health Centre', 'Health Centre', 'Government', 'Rural'),
    ('CENTER', 'Central East', 'Dowa', 'Chankhungu Health Centre', 'Health Centre', 'Government', 'Rural'),
    ('CENTER', 'Central East', 'Dowa', 'Chinkhwiri Health Centre', 'Health Centre', 'Government', 'Rural'),
    ('CENTER', 'Central East', 'Dowa', 'Chisepo Health Centre', 'Health Centre', 'Government', 'Rural'),
    ('CENTER', 'Central East', 'Dowa', 'Dzaleka Health Centre', 'Health Centre', 'Government', 'Rural'),
    ('CENTER', 'Central East', 'Dowa', 'Dzoole Health Centre', 'Health Centre', 'Government', 'Rural'),
    ('CENTER', 'Central East', 'Dowa', 'Kayembe Health Centre', 'Health Centre', 'Government', 'Rural'),
    ('CENTER', 'Central East', 'Dowa', 'Madisi Mission Hospital', 'Hospital', 'CHAM', 'Rural'),
    ('CENTER', 'Central East', 'Dowa', 'Mbingwa Health Centre', 'Health Centre', 'Government', 'Rural'),
    ('CENTER', 'Central East', 'Dowa', 'Mponela Rural Hospital', 'Hospital', 'Government', 'Rural'),
    ('CENTER', 'Central East', 'Dowa', 'Msakambewa Health Centre', 'Health Centre', 'Government', 'Rural'),
    ('CENTER', 'Central East', 'Dowa', 'Mthengathenga Hospital', 'Hospital', 'CHAM', 'Rural'),
    ('CENTER', 'Central East', 'Dowa', 'Mvera Army Health Centre', 'Health Centre', 'Government', 'Rural'),
    ('CENTER', 'Central East', 'Dowa', 'Mvera Mission Health Centre', 'Health Centre', 'CHAM', 'Rural'),
    ('CENTER', 'Central East', 'Dowa', 'Mwangala Health Centre', 'Health Centre', 'Government', 'Rural'),
    ('CENTER', 'Central East', 'Dowa', 'Nalunga Health Centre', 'Health Centre', 'Government', 'Rural'),
    ('CENTER', 'Central East', 'Dowa', 'Thonje Health Centre', 'Health Centre', 'Government', 'Rural'),
    ('CENTER', 'Central East', 'Dowa', 'Chizolowondo Health Centre', 'Health Centre', 'Government', 'Rural'),
    ('CENTER', 'Central East', 'Dowa', 'St. Mary\'s Rehabilitation Health Centre', 'Health Centre', 'CHAM', 'Rural'),
    ('CENTER', 'Central East', 'Dowa', 'Kasese/Lifeline Malawi Health Centre', 'Health Centre', 'Private for profit', 'Rural'),
    ('CENTER', 'Central East', 'Dowa', 'Dalitso Private Clinic', 'Clinic', 'Private for profit', 'Urban'),
    ('CENTER', 'Central East', 'Dowa', 'Mamoyo Private Clinic', 'Clinic', 'Private for profit', 'Rural'),
    ('CENTER', 'Central East', 'Dowa', 'Towoo\'s Private Clinic', 'Clinic', 'Private for profit', 'Rural'),
    ('CENTER', 'Central East', 'Dowa', 'MBA-Esita Private Clinic', 'Clinic', 'Private for profit', 'Rural'),
    ('CENTER', 'Central East', 'Dowa', 'BLM Mponela Clinic', 'Clinic', 'NGO', 'Urban'),
    ('CENTER', 'Central East', 'Dowa', 'Family Planning Association Clinic', 'Clinic', 'NGO', 'Urban'),
    ('CENTER', 'Central East', 'Dowa', 'MATEKENYA', 'Dispensary', 'Government', 'Urban'),
    ('CENTER', 'Central East', 'Dowa', 'MONDWE', 'Health Post', 'Government', 'Urban'),
    ('CENTER', 'Central East', 'Dowa', 'MTAMBALIKA', 'Health Post', 'NGO', 'Urban'),
    ('CENTER', 'Central East', 'Dowa', 'Mtengowanthenga Dream Project', 'Clinic', 'NGO', 'Rural'),
]

def escape_quotes(s):
    """Escape single quotes in facility names"""
    return s.replace("'", "\\'")

def generate_typescript():
    """Generate TypeScript seed file"""
    lines = []
    lines.append("export interface FacilitySeedItem {")
    lines.append("  region: string; zone: string; district: string;")
    lines.append("  facilityName: string; facilityType: string;")
    lines.append("  managingAuthority: string; urbanRural: string;")
    lines.append("}")
    lines.append("")
    lines.append("export const FACILITY_SEED: FacilitySeedItem[] = [")
    
    for i, (region, zone, district, facility_name, facility_type, managing_authority, urban_rural) in enumerate(facilities_data):
        escaped_name = escape_quotes(facility_name)
        line = f"  {{ region:'{region}', zone:'{zone}', district:'{district}', facilityName:'{escaped_name}', facilityType:'{facility_type}', managingAuthority:'{managing_authority}', urbanRural:'{urban_rural}' }}"
        if i < len(facilities_data) - 1:
            line += ","
        lines.append(line)
    
    lines.append("];")
    
    return "\n".join(lines)

if __name__ == "__main__":
    output = generate_typescript()
    print(output)
    
    # Write to file
    with open("src/health-facilities/seed/facilities.seed.ts", "w") as f:
        f.write(output)
    
    print(f"\n\nGenerated {len(facilities_data)} facilities", file=__import__('sys').stderr)
