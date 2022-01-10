interface Location {
    latitude: number,
    longitude: number,
};

interface DisasterCard {
    uuid: string,
    latLng: Location,
    severity: Severity,
    disaster: Disaster,
    hazardId: string,
    hazardName: string,
    lastUpdate: string,
    description: string,
    assetUrl: any
};

const XmlAttributeMap = {
    uuid: 'uuid',
    latitude: 'latitude',
    longitude: 'longitude',
    severity: 'severity_ID',
    disaster: 'type_ID',
    hazardId: 'hazard_ID',
    hazardName: 'hazard_Name',
    lastUpdate: 'last_Update',
    description: 'description'
};

enum AppMode {
    ACTIVE="active",
    INACTIVE="inactive"
};

enum Disaster {
    FLOOD="FLOOD",
    WILDFIRE="WILDFIRE",
    WINTERSTORM="WINTERSTORM",
    TORNADO="TORNADO",
    VOLCANO="VOLCANO",
    EARTHQUAKE="EARTHQUAKE",
    STORM="STORM",
    EXTREMETEMPERATURE="EXTREMETEMPERATURE",
    BIOMEDICAL="BIOMEDICAL",
    AVALANCHE="AVALANCHE",
    DROUGHT="DROUGHT",
    LANDSLIDE="LANDSLIDE",
    FALLBACK="FALLBACK"
};

enum Severity {
    WARNING="WARNING",
    INFORMATION="INFORMATION",
    WATCH="WATCH",
    ADVISORY="ADVISORY"
};

const AssetPaths = {
    [Disaster.FLOOD]: require('../../assets/flood.png'),
    [Disaster.WILDFIRE]: require('../../assets/wildfire.png'),
    [Disaster.WINTERSTORM]: require('../../assets/winterstorm.png'),
    [Disaster.TORNADO]: require('../../assets/tornado.png'),
    [Disaster.VOLCANO]: require('../../assets/volcano.png'),
    [Disaster.EARTHQUAKE]: require('../../assets/earthquake.png'),
    [Disaster.STORM]: require('../../assets/storm.png'),
    [Disaster.EXTREMETEMPERATURE]: require('../../assets/extremetemperature.png'),
    [Disaster.BIOMEDICAL]: require('../../assets/biomedical.png'),
    [Disaster.AVALANCHE]: require('../../assets/avalanche.png'),
    [Disaster.DROUGHT]: require('../../assets/drought.png'),
    [Disaster.LANDSLIDE]: require('../../assets/landslide.png'),
    [Disaster.FALLBACK]: require('../../assets/burger.png'),
    ASSEMBLE: require('../../assets/assemble.png'),
    ASSEMBLE_DARK: require('../../assets/assemble-dark.png')
};

enum UserTasks {
    LOCATION_GEO_FENCE="LOCATION_GEO_FENCE"
};

export {
    Location,
    DisasterCard,
    XmlAttributeMap,
    AppMode,
    Disaster,
    Severity,
    AssetPaths,
    UserTasks
};