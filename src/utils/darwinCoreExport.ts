import { SpecimenRecord } from '../types/specimen';

export function formatDarwinCoreRecord(specimen: SpecimenRecord) {
  return {
    occurrenceID: `urn:catalog:${specimen.institutionCode}:${specimen.catalogNumber.replace('CAT. ', '')}`,
    basisOfRecord: 'HumanObservation',
    scientificName: specimen.scientificName,
    vernacularName: specimen.commonName,
    kingdom: specimen.taxonomy.kingdom,
    phylum: specimen.taxonomy.phylum,
    class: specimen.taxonomy.class,
    order: specimen.taxonomy.order,
    family: specimen.taxonomy.family,
    genus: specimen.taxonomy.genus,
    specificEpithet: specimen.taxonomy.species,
    taxonRank: 'species',
    taxonomicStatus: 'accepted',
    taxonID: specimen.taxonomy.taxonId || '',
    country: 'Costa Rica',
    countryCode: 'CR',
    stateProvince: specimen.georeference.province,
    locality: specimen.georeference.locality,
    decimalLatitude: specimen.georeference.latitude,
    decimalLongitude: specimen.georeference.longitude,
    verbatimCoordinates: `${specimen.georeference.latitudeDMS}, ${specimen.georeference.longitudeDMS}`,
    coordinateUncertaintyInMeters: specimen.georeference.accuracyMeters,
    geodeticDatum: specimen.georeference.datum,
    minimumElevationInMeters: specimen.georeference.elevationMeters,
    habitat: specimen.georeference.microhabitat,
    eventDate: specimen.collectionDate,
    eventTime: specimen.collectionTime,
    recordedBy: specimen.collector,
    identifiedBy: specimen.collector,
    institutionCode: specimen.institutionCode,
    catalogNumber: specimen.catalogNumber,
    fieldNumber: specimen.fieldFolio,
    iucnRedListCategory: specimen.iucnStatus.code,
    citesAppendix: specimen.citesStatus.appendix,
    lifeStage: 'Adult',
    sex: 'Male',
    dynamicProperties: JSON.stringify({
      snoutVentLengthMm: specimen.morphometrics.snoutVentLengthMm,
      coloration: specimen.morphometrics.colorationAndAnatomy,
      ethology: specimen.morphometrics.ethologyAndReproduction,
      sympatricCount: specimen.morphometrics.sympatricSpecies.length,
      conservationArea: specimen.georeference.conservationArea,
      holdridgeLifeZone: specimen.georeference.lifeZone,
    }),
  };
}

export function exportDarwinCoreJson(specimen: SpecimenRecord) {
  const dwc = formatDarwinCoreRecord(specimen);
  const jsonStr = JSON.stringify(dwc, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${specimen.catalogNumber.replace(/[^a-zA-Z0-9-]/g, '_')}_DwC.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportDarwinCoreCsv(specimens: SpecimenRecord[]) {
  if (specimens.length === 0) return;
  const records = specimens.map(formatDarwinCoreRecord);
  const headers = Object.keys(records[0]) as (keyof typeof records[0])[];

  const csvRows = [
    headers.join(','),
    ...records.map((r) =>
      headers
        .map((h) => {
          const val = r[h] !== undefined ? String(r[h]) : '';
          return `"${val.replace(/"/g, '""')}"`;
        })
        .join(',')
    ),
  ];

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `BioBitacora_CR_DarwinCore_Export_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
