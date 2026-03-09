export interface CityConfig {
  slug: string;
  name: string;
  state: string;
  stateCode: string;
}

const cities: CityConfig[] = [
  { slug: "dallas", name: "Dallas", state: "Texas", stateCode: "TX" },
  { slug: "houston", name: "Houston", state: "Texas", stateCode: "TX" },
  { slug: "austin", name: "Austin", state: "Texas", stateCode: "TX" },
  { slug: "san-antonio", name: "San Antonio", state: "Texas", stateCode: "TX" },
  { slug: "fort-worth", name: "Fort Worth", state: "Texas", stateCode: "TX" },
  { slug: "phoenix", name: "Phoenix", state: "Arizona", stateCode: "AZ" },
  { slug: "tucson", name: "Tucson", state: "Arizona", stateCode: "AZ" },
  { slug: "los-angeles", name: "Los Angeles", state: "California", stateCode: "CA" },
  { slug: "san-diego", name: "San Diego", state: "California", stateCode: "CA" },
  { slug: "san-francisco", name: "San Francisco", state: "California", stateCode: "CA" },
  { slug: "sacramento", name: "Sacramento", state: "California", stateCode: "CA" },
  { slug: "denver", name: "Denver", state: "Colorado", stateCode: "CO" },
  { slug: "colorado-springs", name: "Colorado Springs", state: "Colorado", stateCode: "CO" },
  { slug: "miami", name: "Miami", state: "Florida", stateCode: "FL" },
  { slug: "tampa", name: "Tampa", state: "Florida", stateCode: "FL" },
  { slug: "orlando", name: "Orlando", state: "Florida", stateCode: "FL" },
  { slug: "jacksonville", name: "Jacksonville", state: "Florida", stateCode: "FL" },
  { slug: "atlanta", name: "Atlanta", state: "Georgia", stateCode: "GA" },
  { slug: "chicago", name: "Chicago", state: "Illinois", stateCode: "IL" },
  { slug: "indianapolis", name: "Indianapolis", state: "Indiana", stateCode: "IN" },
  { slug: "nashville", name: "Nashville", state: "Tennessee", stateCode: "TN" },
  { slug: "memphis", name: "Memphis", state: "Tennessee", stateCode: "TN" },
  { slug: "charlotte", name: "Charlotte", state: "North Carolina", stateCode: "NC" },
  { slug: "raleigh", name: "Raleigh", state: "North Carolina", stateCode: "NC" },
  { slug: "new-york", name: "New York", state: "New York", stateCode: "NY" },
  { slug: "seattle", name: "Seattle", state: "Washington", stateCode: "WA" },
  { slug: "portland", name: "Portland", state: "Oregon", stateCode: "OR" },
  { slug: "las-vegas", name: "Las Vegas", state: "Nevada", stateCode: "NV" },
  { slug: "minneapolis", name: "Minneapolis", state: "Minnesota", stateCode: "MN" },
  { slug: "kansas-city", name: "Kansas City", state: "Missouri", stateCode: "MO" },
  { slug: "st-louis", name: "St. Louis", state: "Missouri", stateCode: "MO" },
  { slug: "columbus", name: "Columbus", state: "Ohio", stateCode: "OH" },
  { slug: "cleveland", name: "Cleveland", state: "Ohio", stateCode: "OH" },
  { slug: "pittsburgh", name: "Pittsburgh", state: "Pennsylvania", stateCode: "PA" },
  { slug: "philadelphia", name: "Philadelphia", state: "Pennsylvania", stateCode: "PA" },
  { slug: "detroit", name: "Detroit", state: "Michigan", stateCode: "MI" },
  { slug: "milwaukee", name: "Milwaukee", state: "Wisconsin", stateCode: "WI" },
  { slug: "oklahoma-city", name: "Oklahoma City", state: "Oklahoma", stateCode: "OK" },
  { slug: "albuquerque", name: "Albuquerque", state: "New Mexico", stateCode: "NM" },
  { slug: "richmond", name: "Richmond", state: "Virginia", stateCode: "VA" },
  { slug: "virginia-beach", name: "Virginia Beach", state: "Virginia", stateCode: "VA" },
  { slug: "louisville", name: "Louisville", state: "Kentucky", stateCode: "KY" },
  { slug: "salt-lake-city", name: "Salt Lake City", state: "Utah", stateCode: "UT" },
  { slug: "birmingham", name: "Birmingham", state: "Alabama", stateCode: "AL" },
  { slug: "new-orleans", name: "New Orleans", state: "Louisiana", stateCode: "LA" },
  { slug: "baltimore", name: "Baltimore", state: "Maryland", stateCode: "MD" },
  { slug: "boston", name: "Boston", state: "Massachusetts", stateCode: "MA" },
  { slug: "washington-dc", name: "Washington", state: "District of Columbia", stateCode: "DC" },
  { slug: "omaha", name: "Omaha", state: "Nebraska", stateCode: "NE" },
  { slug: "des-moines", name: "Des Moines", state: "Iowa", stateCode: "IA" },
];

export default cities;

/**
 * Get all city+trade URL combinations for sitemap generation.
 */
export function getAllCityTradeUrls(tradeSlugs: string[]): string[] {
  const urls: string[] = [];
  for (const trade of tradeSlugs) {
    for (const city of cities) {
      urls.push(`/crm-for-${trade}-in-${city.slug}`);
    }
  }
  return urls;
}
