interface IPApiResponse {
  ip: string;
  version: string;
  city: string;
  region: string;
  regionCode: string;
  countryCode: string;
  countryCodeIso3: string;
  countryName: string;
  countryCapital: string;
  countryTld: string;
  continentCode: string;
  inEu: boolean;
  postal: string;
  latitude: number;
  longitude: number;
  timezone: string;
  utcOffset: string;
  countryCallingCode: string;
  currency: string;
  currencyName: string;
  languages: string;
  countryArea: number;
  countryPopulation: number;
  asn: string;
  org: string;
}

export default IPApiResponse;
