export type ReverseGeocodeResult = {
  administrativeDongName: string;
  administrativeDongCode: string;
};

export async function reverseGeocode() : Promise<ReverseGeocodeResult> {
  return {
    administrativeDongName: "역삼1동",
    administrativeDongCode: "11680640",
  };
}
