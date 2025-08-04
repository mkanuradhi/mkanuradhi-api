import axios from "axios";
import IPApiResponse from "../responses/ipapi-response";
import AppError from "../errors/app-error";

export const fetchIpInfo = async (ip: string): Promise<IPApiResponse> => {
  try {
    const response = await axios.get(`https://ipapi.co/${ip}/json/`, {
      headers: {
        'User-Agent': 'nodejs-ipapi-v1.02'
      }
    });
    if (response.status !== 200) {
      throw new AppError(`Failed to fetch IP info for ${ip}`, response.status);
    }

    const data = response.data;
    const iPApiResponse: IPApiResponse = {
      ip: data.ip,
      version: data.version,
      city: data.city,
      region: data.region,
      regionCode: data.region_code,
      countryCode: data.country_code,
      countryCodeIso3: data.country_code_iso3,
      countryName: data.country_name,
      countryCapital: data.country_capital,
      countryTld: data.country_tld,
      continentCode: data.continent_code,
      inEu: data.in_eu,
      postal: data.postal,
      latitude: data.latitude,
      longitude: data.longitude,
      timezone: data.timezone,
      utcOffset: data.utc_offset,
      countryCallingCode: data.country_calling_code,
      currency: data.currency,
      currencyName: data.currency_name,
      languages: data.languages,
      countryArea: data.country_area,
      countryPopulation: data.country_population,
      asn: data.asn,
      org: data.org,
    };
    return iPApiResponse;
  } catch (error) {
    console.error('Error fetching IP info:', (error as Error).message);
    throw new AppError(`Failed to fetch IP info for ${ip}`, 500);
  }
}